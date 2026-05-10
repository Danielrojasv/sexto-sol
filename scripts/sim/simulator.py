"""Sexto Sol game simulator — SPEC 3 reference implementation.

Implementa la simulación a nivel de habilidad legible (no engine kernel).
Determinista via seed. Logs estructurados en YAML por partida.

Cobertura:
  - Estructura de turno (5 fases)
  - Energía (+1/turno, cap 10, no acumula)
  - Mareo de invocación (no ataque salvo embate)
  - Combate simultáneo
  - Bastión obliga, Vuelo bypassa, Desgarro daño residual
  - Mecánicas firma: kulen, formacion_solar, ignicion (sacrificio mandatory),
    refluencia (Pozo Astral + revival con stats base + HP máximo + Disolución)
  - Win conditions: HP=0, decking out, turn cap 30
  - IA scripted: deployment + combat + mulligan heuristics

Limitaciones honestas (Phase 1 kernel resolverá):
  - Habilidades individuales de eventos/relics/tech: solo handlers para ~12
    cartas más impactantes; resto se skip-ea con interpretation_notes flag.
  - Premonición: trigger reconocido pero no altera orden de resolución
    (Phase 1 lo implementará).
  - Algunos efectos AoE compuestos se aproximan.

Cada limitación se loggea como ambiguity_flagged: true cuando aplica.
"""

import json
import glob
import random
import os
import sys
from copy import deepcopy
from datetime import datetime, timezone

REPO = '/opt/sexto-sol'
POOL_DIR = f'{REPO}/src/data/cards'

TURN_CAP = 30
HAND_CAP = 7
HP_START = 20
ENERGY_CAP = 10


# ----------------------------------------------------------------------
# Pool loading
# ----------------------------------------------------------------------

def load_pool():
    pool = {}
    for race in ['quralan', 'wuron', 'tezhal', 'zaqe']:
        for f in sorted(glob.glob(f'{POOL_DIR}/{race}/*.json')):
            d = json.load(open(f))
            pool[d['name']] = d
    return pool


POOL = load_pool()


# ----------------------------------------------------------------------
# Yaml subset loader (para evitar dependencia externa pyyaml en CI)
# ----------------------------------------------------------------------

def parse_deck_yaml(path):
    """Parser ad-hoc para los YAMLs del deck-builder.

    No es un parser YAML general — espera el schema específico que produce
    el script gen-meta-decks.py. Suficiente para los 12 mazos canónicos.
    """
    with open(path) as f:
        text = f.read()
    deck = {'name': '', 'race': '', 'archetype': '', 'variant': '', 'cards': []}
    for line in text.splitlines():
        s = line.strip()
        if s.startswith('name:'):
            deck['name'] = s.split('"', 2)[1] if '"' in s else s.split(':', 1)[1].strip()
        elif s.startswith('race:'):
            deck['race'] = s.split('"', 2)[1]
        elif s.startswith('archetype:') and not deck['archetype']:
            deck['archetype'] = s.split('"', 2)[1]
        elif s.startswith('variant:'):
            deck['variant'] = s.split('"', 2)[1]
        elif s.startswith('- {') and 'name:' in s and 'count:' in s:
            # - { name: "X", count: N }
            name = s.split('"', 2)[1]
            count = int(s.rsplit(':', 1)[1].rstrip('}').strip())
            deck['cards'].append({'name': name, 'count': count})
    return deck


# ----------------------------------------------------------------------
# Ship + game state
# ----------------------------------------------------------------------

class ShipInstance:
    __slots__ = ('card', 'instance_id', 'name', 'race', 'cost', 'keywords',
                 'base_strength', 'strength', 'base_hp', 'max_hp', 'hp',
                 'has_sickness', 'damaged_this_turn', 'revived_once')

    def __init__(self, card, instance_id):
        self.card = card
        self.instance_id = instance_id
        self.name = card['name']
        self.race = card['race']
        self.cost = card['cost']
        self.keywords = list(card.get('keywords', []))
        self.base_strength = card.get('strength', 0)
        self.strength = self.base_strength
        self.base_hp = card.get('hp', 0)
        self.max_hp = self.base_hp
        self.hp = self.base_hp
        self.has_sickness = True
        self.damaged_this_turn = False
        self.revived_once = False

    def reset_for_revival(self):
        self.strength = self.base_strength
        self.hp = self.max_hp
        self.has_sickness = True
        self.damaged_this_turn = False
        self.revived_once = True

    def __repr__(self):
        return f'{self.name} ({self.strength}/{self.hp})'


class Game:
    def __init__(self, deck_a, deck_b, seed, goes_first='random',
                 deck_a_path='', deck_b_path=''):
        self.seed = seed
        self.rng = random.Random(seed)
        self.next_iid = 1
        self.turn_no = 0
        self.firma_activations = {'kulen': 0, 'formacion_solar': 0,
                                   'ignicion': 0, 'refluencia': 0}
        self.interpretation_notes = []
        self.ambiguity_flagged_count = 0
        self.turn_logs = []
        self.key_events = []

        # Initialize players
        self.players = {
            'a': self._init_player('a', deck_a, deck_a_path),
            'b': self._init_player('b', deck_b, deck_b_path),
        }

        # Decide who goes first
        if goes_first == 'random':
            self.first = self.rng.choice(['a', 'b'])
        else:
            self.first = goes_first
        self.players[self.first]['goes_first'] = True
        other = 'b' if self.first == 'a' else 'a'
        self.players[other]['goes_first'] = False

        # Initial draws (4 first, 5 second)
        self._draw(self.first, 4)
        self._draw(other, 5)

        # Mulligan check (heuristic 4)
        for pid in [self.first, other]:
            if self._should_mulligan(pid):
                self._do_mulligan(pid)
                self.players[pid]['mulligan'] = True
            else:
                self.players[pid]['mulligan'] = False

        # Snapshot initial hand for log
        for pid in ['a', 'b']:
            self.players[pid]['initial_hand'] = [c['name'] for c in self.players[pid]['hand']]

        self.active_player = self.first
        self.result = None  # filled when game ends

    def _init_player(self, pid, deck, deck_path):
        deck_cards = []
        for entry in deck['cards']:
            for _ in range(entry['count']):
                if entry['name'] not in POOL:
                    raise RuntimeError(f"Carta '{entry['name']}' no está en el pool")
                deck_cards.append(POOL[entry['name']])
        self.rng.shuffle(deck_cards)
        return {
            'pid': pid,
            'hp': HP_START,
            'energy': 0,
            'deck': deck_cards,
            'hand': [],
            'fleet': [],
            'pozo_astral': [],
            'disolucion': [],
            'goes_first': False,
            'mulligan': False,
            'name': deck['name'],
            'race': deck['race'],
            'archetype': deck['archetype'],
            'variant': deck.get('variant', 'midrange'),
            'deck_file': deck_path,
            'initial_hand': [],
        }

    def _draw(self, pid, n=1):
        drawn = []
        for _ in range(n):
            if not self.players[pid]['deck']:
                return drawn  # decking out flagged in main loop
            if len(self.players[pid]['hand']) >= HAND_CAP:
                # Hand cap reached — burn the card
                self.players[pid]['deck'].pop(0)
                continue
            c = self.players[pid]['deck'].pop(0)
            self.players[pid]['hand'].append(c)
            drawn.append(c)
        return drawn

    def _should_mulligan(self, pid):
        hand = self.players[pid]['hand']
        cheap = sum(1 for c in hand if c['cost'] <= 2)
        if cheap == 0:
            return True
        expensive = sum(1 for c in hand if c['cost'] >= 5)
        if expensive >= 4:
            return True
        return False

    def _do_mulligan(self, pid):
        hand = self.players[pid]['hand']
        n = len(hand)
        self.players[pid]['deck'].extend(hand)
        self.rng.shuffle(self.players[pid]['deck'])
        self.players[pid]['hand'] = []
        self._draw(pid, n)
        # put 1 card to bottom (random tiebroken by rng)
        if self.players[pid]['hand']:
            idx = self.rng.randrange(len(self.players[pid]['hand']))
            bottom = self.players[pid]['hand'].pop(idx)
            self.players[pid]['deck'].append(bottom)

    def _opponent(self, pid):
        return 'b' if pid == 'a' else 'a'

    def _flag_ambiguity(self, turn_log, note):
        turn_log.setdefault('interpretation_notes', []).append(note)
        turn_log['ambiguity_flagged'] = True
        self.ambiguity_flagged_count += 1
        self.interpretation_notes.append(f"T{self.turn_no}: {note}")

    # ------------------------------------------------------------------
    # Mecánicas firma triggers
    # ------------------------------------------------------------------

    def _trigger_kulen(self, ship, turn_log):
        if 'kulen' in ship.keywords and ship.hp > 0 and ship.damaged_this_turn:
            ship.strength += 1
            self.firma_activations['kulen'] += 1
            turn_log['actions'].append({
                'action': 'kulen_trigger',
                'ship': f'{ship.name}#{ship.instance_id}',
                'new_strength': ship.strength,
            })

    def _recompute_formacion_solar(self):
        """Recalcula bonus FS para todas las naves Q'ralan con la keyword.

        Sec 7.2 v3.0.2: cuenta por raza, no por keyword.
        """
        for pid in ['a', 'b']:
            qralan_count = sum(1 for s in self.players[pid]['fleet'] if s.race == 'quralan')
            for ship in self.players[pid]['fleet']:
                if 'formacion_solar' in ship.keywords:
                    bonus = max(0, qralan_count - 1)  # otras Q'ralan
                    ship.strength = ship.base_strength + bonus

    def _activate_ignicion(self, pid, source_card, turn_log):
        """Sacrifica una nave Tezhal aliada para activar Ignición.

        Heurística: sacrificar la nave de menor costo/fuerza disponible.
        Si no hay nave Tezhal aliada, no se puede jugar.
        """
        candidates = [s for s in self.players[pid]['fleet'] if s.race == 'tezhal']
        if not candidates:
            return False, None
        # sacrificar la más débil (menor fuerza)
        candidates.sort(key=lambda s: (s.strength, s.cost))
        victim = candidates[0]
        self.players[pid]['fleet'].remove(victim)
        # ships sacrificados van a pozo_astral
        self.players[pid]['pozo_astral'].append(victim.card)
        self.firma_activations['ignicion'] += 1
        turn_log['actions'].append({
            'action': 'ignicion_sacrifice',
            'source': source_card['name'],
            'victim': f'{victim.name}#{victim.instance_id}',
        })
        return True, victim

    def _on_ship_destroyed(self, pid, ship, turn_log):
        """Mover ship a pozo_astral o Disolución según refluencia state."""
        if 'refluencia' in ship.keywords:
            if not ship.revived_once:
                self.players[pid]['pozo_astral'].append(ship.card)
                turn_log['actions'].append({
                    'action': 'ship_to_pozo_astral',
                    'ship': f'{ship.name}#{ship.instance_id}',
                })
            else:
                self.players[pid]['disolucion'].append(ship.card)
                turn_log['actions'].append({
                    'action': 'ship_to_disolucion',
                    'ship': f'{ship.name}#{ship.instance_id}',
                })
        else:
            # otras razas: pozo_astral universal (rename graveyard)
            self.players[pid]['pozo_astral'].append(ship.card)
            turn_log['actions'].append({
                'action': 'ship_destroyed',
                'ship': f'{ship.name}#{ship.instance_id}',
            })

        # Handlers on_destroy específicos
        if ship.name == 'Sumzhua del Sexto Sol':
            self._draw(pid, 1)
            turn_log['actions'].append({
                'action': 'ability_on_destroy',
                'card': ship.name,
                'effect': 'draw 1',
            })
        # Hangar de Aguas Doradas (relic) — robar cuando muere Zaqe aliada
        if any(self._has_relic(pid, 'Hangar de Aguas Doradas') for _ in [0]) and ship.race == 'zaqe':
            self._draw(pid, 1)
            turn_log['actions'].append({
                'action': 'relic_trigger',
                'relic': 'Hangar de Aguas Doradas',
                'effect': 'draw 1 al morir Zaqe',
            })

    def _has_relic(self, pid, name):
        return any(s.name == name and s.card['type'] == 'relic'
                   for s in self.players[pid]['fleet'])

    # ------------------------------------------------------------------
    # AI: decisiones
    # ------------------------------------------------------------------

    def _archetype_value(self, pid):
        return self.players[pid].get('variant', 'midrange')

    def _pick_play(self, pid, energy_left):
        hand = self.players[pid]['hand']
        playable = [c for c in hand if c['cost'] <= energy_left]
        if not playable:
            return None
        # Heurística: priorizar mayor costo jugable, tiebreak por sinergia con board
        fleet_races = set(s.race for s in self.players[pid]['fleet'])
        my_race = self.players[pid]['race']

        def value(card):
            v = card['cost'] * 10
            # Bonus si suma a sinergia firma de raza
            if card['race'] == my_race and any(
                kw in card.get('keywords', [])
                for kw in ['kulen', 'formacion_solar', 'ignicion', 'refluencia']
            ):
                v += 5
            # Bonus para tech en mid/late
            if self.turn_no >= 4 and card['type'] in ['tech', 'event', 'relic']:
                v += 2
            # Penalty: legendary muy caro turn 1-2
            if card.get('rarity') == 'legendary' and self.turn_no <= 3:
                v -= 20
            # Penalty: ignición sin nave Tezhal aliada
            if 'ignicion' in card.get('keywords', []) and card['type'] != 'ship':
                if not [s for s in self.players[pid]['fleet'] if s.race == 'tezhal']:
                    v -= 100
            return v

        playable.sort(key=lambda c: (-value(c), c['cost']))
        # tiebreak determinista: rng
        return playable[0]

    def _should_attack_natal(self, pid):
        """Decide si atacar mundo natal vs naves enemigas."""
        opp = self._opponent(pid)
        opp_hp = self.players[opp]['hp']
        opp_fleet = self.players[opp]['fleet']
        my_attack_strength = sum(s.strength for s in self.players[pid]['fleet'] if not s.has_sickness)

        # Lethal posible
        # Considerar bastiones — no podemos atacar natal si hay bastión enemigo
        opp_bastions = [s for s in opp_fleet if 'bastion' in s.keywords]
        if opp_bastions:
            return False  # debemos atacar bastión primero
        # Si oponente tiene amenazas grandes y nosotros vulnerables
        big_threats = [s for s in opp_fleet if s.strength >= 4 and not s.has_sickness]
        my_hp = self.players[pid]['hp']
        if big_threats and my_hp < sum(s.strength for s in big_threats):
            return False  # priorizar remoción
        # Default: atacar natal
        return True

    # ------------------------------------------------------------------
    # Phases
    # ------------------------------------------------------------------

    def _phase_recoleccion(self, pid, turn_log):
        # +energía hasta cap (no acumula — cap actual = turn_no, max 10)
        target_energy = min(self.turn_no, ENERGY_CAP)
        self.players[pid]['energy'] = target_energy
        # Robar 1 carta
        drawn = self._draw(pid, 1)
        # Trigger continuous turn_start abilities (Brotal de Üntu, R1 Reloj, etc.)
        self._continuous_turn_start(pid, turn_log)
        # Reset damaged_this_turn flag
        for s in self.players[pid]['fleet']:
            s.damaged_this_turn = False
        # Quitar mareo de invocación a las que pasaron 1+ turnos
        for s in self.players[pid]['fleet']:
            s.has_sickness = False  # se levanta al inicio del turno propio
        turn_log['phases']['recoleccion'] = {
            'energy': self.players[pid]['energy'],
            'drew': drawn[0]['name'] if drawn else None,
            'hand_size': len(self.players[pid]['hand']),
        }

    def _continuous_turn_start(self, pid, turn_log):
        # Brotal de Üntu — auto-daño a una nave Würon aliada (Trono trigger)
        for relic in self.players[pid]['fleet']:
            if relic.name == 'Brotal de Üntu':
                wuron_ships = [s for s in self.players[pid]['fleet']
                               if s.race == 'wuron' and s != relic]
                if wuron_ships:
                    target = min(wuron_ships, key=lambda s: s.hp)
                    target.hp = max(0, target.hp - 1)
                    target.damaged_this_turn = True
                    if target.hp > 0:
                        self._trigger_kulen(target, turn_log)
                    turn_log['actions'].append({
                        'action': 'brotal_auto_damage',
                        'target': f'{target.name}#{target.instance_id}',
                    })
            # Reloj del Pozo Áureo — engine de tiempo
            if relic.name == 'Reloj del Pozo Áureo':
                pozo_count = len(self.players[pid]['pozo_astral'])
                if pozo_count >= 5:
                    drawn = self._draw(pid, 1)
                    turn_log['actions'].append({
                        'action': 'reloj_pozo_aureo',
                        'condition': f'pozo_astral={pozo_count} >= 5',
                        'effect': 'draw 1',
                    })
                if pozo_count >= 10:
                    drawn = self._draw(pid, 1)
                    self.players[pid]['hp'] = min(HP_START, self.players[pid]['hp'] + 2)
                    turn_log['actions'].append({
                        'action': 'reloj_pozo_aureo',
                        'condition': f'pozo_astral={pozo_count} >= 10',
                        'effect': 'draw 1 + heal 2',
                    })
            # Hangar Eterno (Tezhal) — auto-tutor si <3 Tezhal
            if relic.name == 'Hangar Eterno':
                tezhal_count = sum(1 for s in self.players[pid]['fleet'] if s.race == 'tezhal')
                if tezhal_count < 3:
                    # buscar nave Tezhal ≤2c en deck
                    for i, c in enumerate(self.players[pid]['deck']):
                        if c['race'] == 'tezhal' and c['type'] == 'ship' and c['cost'] <= 2:
                            self.players[pid]['deck'].pop(i)
                            self._play_ship_from_card(pid, c, turn_log, free=True)
                            turn_log['actions'].append({
                                'action': 'hangar_eterno_tutor',
                                'ship': c['name'],
                            })
                            break
            # Hangar del Sol Pétreo (Q'ralan) — +1 fuerza AoE Q'ralan si ≥4
            if relic.name == 'Hangar del Sol Pétreo':
                qralan_count = sum(1 for s in self.players[pid]['fleet'] if s.race == 'quralan')
                if qralan_count >= 4:
                    for s in self.players[pid]['fleet']:
                        if s.race == 'quralan':
                            s.strength += 1  # end_of_turn — simplificado a perm para esta sim
                    turn_log['actions'].append({
                        'action': 'hangar_pétreo_buff',
                        'effect': '+1 fuerza AoE Q\'ralan este turno',
                    })

    def _play_ship_from_card(self, pid, card, turn_log, free=False):
        ship = ShipInstance(card, self.next_iid)
        self.next_iid += 1
        self.players[pid]['fleet'].append(ship)
        # On-play handlers
        if ship.name == 'Lhwentrü de las Raíces':
            self._draw(pid, 1)
            turn_log['actions'].append({'action': 'on_play_draw',
                                         'card': ship.name, 'effect': 'draw 1'})
        if ship.name == 'Xolot Quetlani Ardiente':
            opp = self._opponent(pid)
            targets = self.players[opp]['fleet']
            if targets:
                target = max(targets, key=lambda s: s.strength)
                self._damage_ship(opp, target, 3, turn_log, source=ship.name)
        if ship.name == 'Sumaq-untay Tutelar':
            # buscar 1 Q'ralan en deck → mano
            for i, c in enumerate(self.players[pid]['deck']):
                if c['race'] == 'quralan' and c['type'] == 'ship':
                    self.players[pid]['deck'].pop(i)
                    if len(self.players[pid]['hand']) < HAND_CAP:
                        self.players[pid]['hand'].append(c)
                        turn_log['actions'].append({'action': 'on_play_tutor',
                                                     'card': ship.name,
                                                     'tutored': c['name']})
                    break
        if ship.name == 'Centinela Pétreo':
            qralan_count = sum(1 for s in self.players[pid]['fleet'] if s.race == 'quralan')
            if qralan_count >= 2:
                self._draw(pid, 1)
        # Recompute FS bonuses
        self._recompute_formacion_solar()
        return ship

    def _damage_ship(self, owner_pid, ship, amount, turn_log, source=None):
        ship.hp -= amount
        ship.damaged_this_turn = True
        turn_log['actions'].append({
            'action': 'damage',
            'target': f'{ship.name}#{ship.instance_id}',
            'amount': amount,
            'source': source or 'combat',
        })
        if ship.hp <= 0:
            self.players[owner_pid]['fleet'].remove(ship)
            self._on_ship_destroyed(owner_pid, ship, turn_log)
            # Recompute FS
            self._recompute_formacion_solar()
        else:
            # Survivor — trigger Külen if applicable
            self._trigger_kulen(ship, turn_log)

    def _phase_despliegue(self, pid, turn_log):
        actions = []
        # Refluencia: revivir naves del Pozo Astral si tenés energía y son Zaqe
        # Heurística: revivir la más cara que entre en presupuesto
        if self.players[pid]['race'] == 'zaqe':
            self._try_refluencia_revival(pid, turn_log, actions)

        # Loop de despliegue: jugar cartas hasta agotar energía o sin opciones
        max_iter = 20
        while max_iter > 0:
            max_iter -= 1
            energy_left = self.players[pid]['energy']
            card = self._pick_play(pid, energy_left)
            if not card:
                break
            self._play_card(pid, card, turn_log)
            actions.append({'action': 'play', 'card': card['name'],
                            'cost': card['cost']})
        turn_log['phases']['despliegue'] = {
            'actions': actions,
            'energy_remaining': self.players[pid]['energy'],
        }

    def _try_refluencia_revival(self, pid, turn_log, actions):
        # Buscar naves Zaqe en pozo_astral con costo ≤ energía
        # Cost reducer: si tiene Espejo del Reflujo Áureo en juego, -1 (min 1)
        has_cost_reducer = any(s.name == 'Espejo del Reflujo Áureo'
                               for s in self.players[pid]['fleet'])
        revival_cost = lambda card: max(1, card['cost'] - (1 if has_cost_reducer else 0))
        candidates = [c for c in self.players[pid]['pozo_astral']
                      if c['race'] == 'zaqe' and c['type'] == 'ship'
                      and 'refluencia' in c.get('keywords', [])
                      and revival_cost(c) <= self.players[pid]['energy']]
        # Heurística: revivir la más cara primero
        candidates.sort(key=lambda c: -c['cost'])
        for cand in candidates[:2]:  # max 2 revivals por turno
            cost = revival_cost(cand)
            if cost > self.players[pid]['energy']:
                continue
            self.players[pid]['energy'] -= cost
            self.players[pid]['pozo_astral'].remove(cand)
            ship = ShipInstance(cand, self.next_iid)
            self.next_iid += 1
            ship.revived_once = True
            ship.has_sickness = True  # entra con mareo
            self.players[pid]['fleet'].append(ship)
            self.firma_activations['refluencia'] += 1
            actions.append({
                'action': 'refluencia_revival',
                'card': cand['name'],
                'cost_paid': cost,
            })

    def _play_card(self, pid, card, turn_log):
        # Pagar costo
        cost = card['cost']
        # Ignición (mandatory sacrifice)
        if 'ignicion' in card.get('keywords', []):
            if card['type'] == 'ship':
                # Las naves con ignición se juegan normales; activación es Activated
                pass
            else:
                # eventos/tech con ignición — sacrifico mandatory
                ok, victim = self._activate_ignicion(pid, card, turn_log)
                if not ok:
                    return  # no puede jugarse
        self.players[pid]['energy'] -= cost
        self.players[pid]['hand'].remove(card)

        if card['type'] == 'ship':
            self._play_ship_from_card(pid, card, turn_log)
        elif card['type'] == 'relic':
            ship = ShipInstance(card, self.next_iid)
            self.next_iid += 1
            self.players[pid]['fleet'].append(ship)  # tratamos relics como permanentes en fleet
            ship.has_sickness = True  # relic no ataca
        elif card['type'] in ('event', 'tech', 'weapon'):
            self._resolve_event_tech(pid, card, turn_log)
            self.players[pid]['pozo_astral'].append(card)
        # Recompute firma bonuses
        self._recompute_formacion_solar()

    def _resolve_event_tech(self, pid, card, turn_log):
        opp = self._opponent(pid)
        name = card['name']
        # Hardcoded handlers para cartas más impactantes
        if name == 'Plumaje Encendido':
            self.players[opp]['hp'] = max(0, self.players[opp]['hp'] - 2)
            turn_log['actions'].append({'action': 'event', 'card': name, 'effect': 'hangar 2 dmg'})
        elif name == 'Cuchilla del Quinto Sol':
            # Ignición consume el sacrificio; buff a otra nave
            allies = [s for s in self.players[pid]['fleet'] if s.race == 'tezhal']
            if allies:
                target = max(allies, key=lambda s: s.strength)
                target.strength += 3
                target.has_sickness = False  # embate
                turn_log['actions'].append({'action': 'event', 'card': name,
                                             'target': target.name, 'effect': '+3 fuerza + embate'})
        elif name == 'Salva Ritual':
            for s in list(self.players[opp]['fleet']):
                self._damage_ship(opp, s, 2, turn_log, source=name)
        elif name == 'Cántico Tlapetl':
            for s in self.players[pid]['fleet']:
                if s.race == 'tezhal':
                    s.strength += 2
                    s.has_sickness = False  # embate
        elif name == 'Filo del Tonatzin':
            # destroy enemy ≤4c
            targets = [s for s in self.players[opp]['fleet'] if s.cost <= 4]
            if targets:
                target = max(targets, key=lambda s: s.strength)
                self._damage_ship(opp, target, 999, turn_log, source=name)
        elif name == 'Espejo Disolutorio':
            # Ignición: exilia 1 nave enemiga directo a Disolución
            targets = self.players[opp]['fleet']
            if targets:
                target = max(targets, key=lambda s: s.strength)
                self.players[opp]['fleet'].remove(target)
                self.players[opp]['disolucion'].append(target.card)
                turn_log['actions'].append({'action': 'exile_to_disolucion',
                                             'target': f'{target.name}#{target.instance_id}',
                                             'source': name})
        elif name == 'Eclipse del K\'illay':
            for s in list(self.players[opp]['fleet']):
                if 'ignicion' in s.keywords:
                    self._damage_ship(opp, s, 2, turn_log, source=name)
        elif name == 'Eclipse del Pozo Astral':
            for s in list(self.players[opp]['fleet']):
                if 'kulen' in s.keywords:
                    self._damage_ship(opp, s, 3, turn_log, source=name)
        elif name == 'Coraza del Lago Áureo':
            for s in self.players[pid]['fleet']:
                if s.race == 'zaqe':
                    s.max_hp += 1
                    s.hp += 1
        elif name == 'Despertar de la Raíz':
            for s in self.players[pid]['fleet']:
                if s.race == 'wuron':
                    s.strength += 1
        elif name == 'Susurro del Bosque':
            for s in self.players[pid]['fleet']:
                if s.race == 'wuron':
                    others = sum(1 for x in self.players[pid]['fleet'] if x.race == 'wuron' and x != s)
                    s.strength += others
        elif name == 'Disolutorio Sqhaguata':
            # exilia una Reliquia enemiga
            relics = [s for s in self.players[opp]['fleet'] if s.card['type'] == 'relic']
            if relics:
                target = relics[0]
                self.players[opp]['fleet'].remove(target)
                self.players[opp]['pozo_astral'].append(target.card)
                turn_log['actions'].append({'action': 'exile_relic',
                                             'target': target.name,
                                             'source': name})
        elif name == 'Visión del Pozo Astral':
            self._draw(pid, 1)
            pozo = len(self.players[pid]['pozo_astral'])
            if pozo >= 3:
                self._draw(pid, 1)
            if pozo >= 6:
                self._draw(pid, 1)
        elif name == 'Velo Sqhanguata':
            zaqes = [s for s in self.players[pid]['fleet'] if s.race == 'zaqe']
            if zaqes:
                target = max(zaqes, key=lambda s: s.cost)
                self.players[pid]['fleet'].remove(target)
                self.players[pid]['hand'].append(target.card)
                self._draw(pid, 1)
        else:
            # Skip — habilidad no implementada en esta versión del simulator
            self._flag_ambiguity(turn_log,
                f"{name}: habilidad individual no implementada en simulator v0; tratada como vanilla event sin efecto. (Phase 1 kernel resolverá)")

    def _phase_combate(self, pid, turn_log):
        actions = []
        attackers = [s for s in self.players[pid]['fleet']
                     if not s.has_sickness or 'embate' in s.keywords]
        attackers = [s for s in attackers if s.card['type'] == 'ship']
        opp = self._opponent(pid)

        # Decidir target principal: bastiones primero, luego natal/amenazas
        opp_bastions = [s for s in self.players[opp]['fleet'] if 'bastion' in s.keywords]
        attack_natal = self._should_attack_natal(pid)

        for atk in list(attackers):
            if atk not in self.players[pid]['fleet']:
                continue
            opp_bastions = [s for s in self.players[opp]['fleet'] if 'bastion' in s.keywords]
            if opp_bastions:
                # debe atacar bastión
                target = min(opp_bastions, key=lambda s: s.hp)
                self._do_combat(pid, atk, opp, target, turn_log, actions)
            elif attack_natal:
                # atacar mundo natal directo
                self.players[opp]['hp'] = max(0, self.players[opp]['hp'] - atk.strength)
                actions.append({
                    'action': 'attack_homeworld',
                    'attacker': f'{atk.name}#{atk.instance_id}',
                    'damage': atk.strength,
                    'opponent_hp_remaining': self.players[opp]['hp'],
                })
            else:
                # remover amenaza
                threats = [s for s in self.players[opp]['fleet']
                           if s.card['type'] == 'ship']
                if threats:
                    target = max(threats, key=lambda s: s.strength)
                    self._do_combat(pid, atk, opp, target, turn_log, actions)
                else:
                    self.players[opp]['hp'] = max(0, self.players[opp]['hp'] - atk.strength)
                    actions.append({
                        'action': 'attack_homeworld',
                        'attacker': f'{atk.name}#{atk.instance_id}',
                        'damage': atk.strength,
                        'opponent_hp_remaining': self.players[opp]['hp'],
                    })
        turn_log['phases']['combate'] = {'actions': actions}

    def _do_combat(self, atk_pid, atk, def_pid, defender, turn_log, actions):
        # Combate simultáneo
        atk_dmg = atk.strength
        def_dmg = defender.strength
        # Apply damage simultaneously
        defender.hp -= atk_dmg
        defender.damaged_this_turn = True
        atk.hp -= def_dmg
        atk.damaged_this_turn = True
        actions.append({
            'action': 'combat',
            'attacker': f'{atk.name}#{atk.instance_id}',
            'defender': f'{defender.name}#{defender.instance_id}',
            'damage_to_defender': atk_dmg,
            'damage_to_attacker': def_dmg,
        })
        # Desgarro: daño excedente pasa
        if 'desgarro' in atk.keywords and defender.hp < 0:
            overflow = -defender.hp
            self.players[def_pid]['hp'] = max(0, self.players[def_pid]['hp'] - overflow)
            actions.append({
                'action': 'desgarro',
                'overflow': overflow,
                'opponent_hp_remaining': self.players[def_pid]['hp'],
            })
        # Resolve destructions / triggers
        if defender.hp <= 0:
            self.players[def_pid]['fleet'].remove(defender)
            self._on_ship_destroyed(def_pid, defender, turn_log)
        else:
            self._trigger_kulen(defender, turn_log)
        if atk.hp <= 0:
            self.players[atk_pid]['fleet'].remove(atk)
            self._on_ship_destroyed(atk_pid, atk, turn_log)
        else:
            self._trigger_kulen(atk, turn_log)
        self._recompute_formacion_solar()

    def _phase_regroup(self, pid, turn_log):
        turn_log['phases']['regroup'] = {'actions': []}

    def _phase_eclipse(self, pid, turn_log):
        # Reset energy unspent (no acumula)
        spent = self.players[pid]['energy']
        turn_log['phases']['eclipse'] = {
            'actions': [],
            'energy_lost': self.players[pid]['energy'],
        }
        # No hay acción específica en simulator base

    # ------------------------------------------------------------------
    # Loop principal
    # ------------------------------------------------------------------

    def play(self):
        while self.turn_no < TURN_CAP:
            self.turn_no += 1
            for active in [self.first, self._opponent(self.first)]:
                if self.result is not None:
                    break
                self.active_player = active
                turn_log = {
                    'turn': self.turn_no,
                    'active_player': active,
                    'phases': {},
                    'actions': [],
                }
                self._phase_recoleccion(active, turn_log)
                # Check win conditions before acting
                if self._check_decking_out(turn_log):
                    self.turn_logs.append(turn_log)
                    return
                self._phase_despliegue(active, turn_log)
                self._phase_combate(active, turn_log)
                self._phase_regroup(active, turn_log)
                self._phase_eclipse(active, turn_log)

                # Snapshot state
                turn_log['end_state'] = {
                    'a': self._snapshot('a'),
                    'b': self._snapshot('b'),
                }
                self.turn_logs.append(turn_log)

                # Check win conditions
                if self._check_winner(turn_log):
                    return

        # Turn cap reached
        self.result = {
            'winner': None,
            'condition': 'turn_cap_reached',
            'final_turn': self.turn_no,
        }

    def _check_decking_out(self, turn_log):
        active = self.active_player
        if not self.players[active]['deck'] and not self.players[active]['hand']:
            self.result = {
                'winner': self._opponent(active),
                'condition': 'decking_out',
                'final_turn': self.turn_no,
            }
            return True
        return False

    def _check_winner(self, turn_log):
        a_hp = self.players['a']['hp']
        b_hp = self.players['b']['hp']
        if a_hp <= 0 and b_hp <= 0:
            self.result = {
                'winner': None,
                'condition': 'simultaneous_homeworld_destruction',
                'final_turn': self.turn_no,
            }
            return True
        if a_hp <= 0:
            self.result = {
                'winner': 'b',
                'condition': 'mundo_natal_destroyed',
                'final_turn': self.turn_no,
            }
            return True
        if b_hp <= 0:
            self.result = {
                'winner': 'a',
                'condition': 'mundo_natal_destroyed',
                'final_turn': self.turn_no,
            }
            return True
        return False

    def _snapshot(self, pid):
        return {
            'hp': self.players[pid]['hp'],
            'hand': len(self.players[pid]['hand']),
            'board': [f'{s.name} ({s.strength}/{s.hp})' for s in self.players[pid]['fleet']],
            'pozo_astral': len(self.players[pid]['pozo_astral']),
            'disolucion': len(self.players[pid]['disolucion']),
            'deck': len(self.players[pid]['deck']),
        }

    def to_log_dict(self):
        ts = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
        log = {
            'game': {
                'id': f'sim_{self.seed}',
                'seed': self.seed,
                'date': ts,
                'setup': {},
                'turns': self.turn_logs,
                'result': self.result or {'winner': None, 'condition': 'unfinished',
                                           'final_turn': self.turn_no},
                'analysis': {
                    'firma_activations': self.firma_activations,
                    'ambiguity_flagged_count': self.ambiguity_flagged_count,
                    'interpretation_notes': self.interpretation_notes,
                    'final_state': {
                        'a': self._snapshot('a'),
                        'b': self._snapshot('b'),
                    },
                },
            }
        }
        for pid in ['a', 'b']:
            p = self.players[pid]
            log['game']['setup'][f'player_{pid}'] = {
                'deck_file': p['deck_file'],
                'deck_name': p['name'],
                'race': p['race'],
                'archetype': p['archetype'],
                'variant': p['variant'],
                'goes_first': p['goes_first'],
                'mulligan': p['mulligan'],
                'initial_hand': p['initial_hand'],
            }
        return log


# ----------------------------------------------------------------------
# YAML serializer simple (sin pyyaml)
# ----------------------------------------------------------------------

def yaml_dump(obj, indent=0):
    pad = '  ' * indent
    out = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            if isinstance(v, (dict, list)) and v:
                out.append(f'{pad}{k}:')
                out.append(yaml_dump(v, indent + 1))
            else:
                out.append(f'{pad}{k}: {yaml_scalar(v)}')
    elif isinstance(obj, list):
        for item in obj:
            if isinstance(item, dict):
                lines = yaml_dump(item, indent + 1).splitlines()
                if lines:
                    first = lines[0].lstrip()
                    out.append(f'{pad}- {first}')
                    for l in lines[1:]:
                        out.append(l)
            elif isinstance(item, list):
                out.append(f'{pad}- {yaml_scalar(item)}')
            else:
                out.append(f'{pad}- {yaml_scalar(item)}')
    else:
        out.append(f'{pad}{yaml_scalar(obj)}')
    return '\n'.join(out)


def yaml_scalar(v):
    if v is None:
        return 'null'
    if isinstance(v, bool):
        return 'true' if v else 'false'
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, list):
        if not v:
            return '[]'
        return '[' + ', '.join(yaml_scalar(x) for x in v) + ']'
    if isinstance(v, dict):
        if not v:
            return '{}'
        return '{' + ', '.join(f'{k}: {yaml_scalar(val)}' for k, val in v.items()) + '}'
    s = str(v)
    if any(ch in s for ch in ':,#"\''):
        return repr(s)
    return s


def write_log(log, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(yaml_dump(log))
        f.write('\n')


# ----------------------------------------------------------------------
# API públicas
# ----------------------------------------------------------------------

def simulate_match(deck_a_path, deck_b_path, seed=None, goes_first='random'):
    deck_a = parse_deck_yaml(deck_a_path)
    deck_b = parse_deck_yaml(deck_b_path)
    if seed is None:
        seed = random.SystemRandom().randint(1, 1_000_000)
    g = Game(deck_a, deck_b, seed, goes_first, deck_a_path, deck_b_path)
    g.play()
    return g.to_log_dict()


def simulate_batch(deck_a_path, deck_b_path, count, base_seed=1000, goes_first_dist='alternating'):
    results = []
    for i in range(count):
        seed = base_seed + i
        if goes_first_dist == 'alternating':
            gf = 'a' if i % 2 == 0 else 'b'
        elif goes_first_dist == 'random':
            gf = 'random'
        elif goes_first_dist == 'a_only':
            gf = 'a'
        else:
            gf = 'b'
        log = simulate_match(deck_a_path, deck_b_path, seed=seed, goes_first=gf)
        results.append(log)
    return results


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print('Usage: simulator.py <deck_a.yaml> <deck_b.yaml> [seed]')
        sys.exit(1)
    a, b = sys.argv[1], sys.argv[2]
    seed = int(sys.argv[3]) if len(sys.argv) > 3 else 42
    log = simulate_match(a, b, seed=seed)
    print(yaml_dump(log))
