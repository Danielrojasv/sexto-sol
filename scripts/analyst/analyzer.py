"""Sexto Sol balance analyst — SPEC 4 reference implementation.

Consume logs YAML producidos por el game-simulator (SPEC 3) y produce
reportes de balance + recomendaciones con confianza calibrada.

Conoce las limitaciones del simulator v0:
  - IA no diferencia heurísticas por archetype/variant
  - Solo ~22 cartas con handler hardcodeado
  - Sesgo conocido hacia aggro

Calibra confidence por matchup profile (high/medium/low).

Comandos:
  - analyze_batch
  - analyze_matchup
  - analyze_card
  - validate_meta
"""

import os
import sys
import glob
import re
from collections import defaultdict, Counter
from statistics import mean, median

REPO = '/opt/sexto-sol'

# Importar parse_deck_yaml + yaml_dump del simulator
sys.path.insert(0, f'{REPO}/scripts/sim')
from simulator import parse_deck_yaml, yaml_dump, write_log  # noqa: E402

# ----------------------------------------------------------------------
# YAML log loader (subset parser)
# ----------------------------------------------------------------------

def load_log(path):
    """Parser ad-hoc para logs producidos por simulator.yaml_dump.

    Suficiente para extraer los campos que el analyst necesita: result.winner,
    result.condition, result.final_turn, analysis.firma_activations,
    setup.player_*.race/archetype/variant/deck_name.
    """
    with open(path) as f:
        text = f.read()
    log = {
        'seed': None,
        'winner': None,
        'condition': None,
        'final_turn': None,
        'firma_activations': {},
        'ambiguity_flagged_count': 0,
        'players': {'a': {}, 'b': {}},
        'card_plays': {'a': Counter(), 'b': Counter()},
    }
    section = None
    sub = None
    cur_player = None
    cur_turn_active = None
    # Stateful parser para multiline action: play
    awaiting_card_for = False
    for line in text.splitlines():
        s = line.rstrip()
        # seed
        m = re.match(r'^\s*seed:\s*(\d+)', s)
        if m:
            log['seed'] = int(m.group(1))
        # final_turn / winner / condition (en result o key turns)
        m = re.match(r'^\s*winner:\s*(.+)', s)
        if m:
            v = m.group(1).strip().strip("'\"")
            if v in ('null', 'None'):
                log['winner'] = None
            elif v in ('a', 'b'):
                if log['winner'] is None:  # solo el primero
                    log['winner'] = v
        m = re.match(r'^\s*condition:\s*(.+)', s)
        if m and log['condition'] is None:
            v = m.group(1).strip().strip("'\"")
            log['condition'] = v
        m = re.match(r'^\s*final_turn:\s*(\d+)', s)
        if m and log['final_turn'] is None:
            log['final_turn'] = int(m.group(1))
        # ambiguity flag count
        m = re.match(r'^\s*ambiguity_flagged_count:\s*(\d+)', s)
        if m:
            log['ambiguity_flagged_count'] = int(m.group(1))
        # firma_activations sub-keys
        m = re.match(r'^\s*(kulen|formacion_solar|ignicion|refluencia):\s*(\d+)', s)
        if m:
            log['firma_activations'][m.group(1)] = int(m.group(2))
        # player setup
        m = re.match(r'^\s*player_([ab]):', s)
        if m:
            cur_player = m.group(1)
        if cur_player:
            for field in ['race', 'archetype', 'variant', 'deck_name', 'deck_file']:
                pat = re.compile(rf'^\s+{field}:\s*(.+)')
                mm = pat.match(s)
                if mm:
                    v = mm.group(1).strip().strip("'\"")
                    log['players'][cur_player][field] = v
        # action: play (inline format) — extract card name
        m = re.match(r"^\s*-\s*\{?\s*action:\s*['\"]?play['\"]?,\s*card:\s*['\"]?([^'\",\}]+)['\"]?", s)
        if m:
            card_name = m.group(1).strip()
            if cur_turn_active in ('a', 'b'):
                log['card_plays'][cur_turn_active][card_name] += 1
        # action: play (multiline format) — set flag
        m = re.match(r"^\s*-\s*action:\s*['\"]?play['\"]?\s*$", s)
        if m:
            awaiting_card_for = True
            continue
        if awaiting_card_for:
            m = re.match(r"^\s*card:\s*['\"]?([^'\"\n]+?)['\"]?\s*$", s)
            if m:
                card_name = m.group(1).strip()
                if cur_turn_active in ('a', 'b'):
                    log['card_plays'][cur_turn_active][card_name] += 1
                awaiting_card_for = False
                continue
            # Si la siguiente línea no es card:, abortar el flag
            if not re.match(r'^\s+\w+:', s):
                awaiting_card_for = False
        # turn block: track active_player
        m = re.match(r"^\s*active_player:\s*['\"]?([ab])['\"]?", s)
        if m:
            cur_turn_active = m.group(1)
    return log


# ----------------------------------------------------------------------
# Aggregation helpers
# ----------------------------------------------------------------------

def aggregate_batch(logs):
    """Agrega métricas across N logs."""
    n = len(logs)
    if n == 0:
        return {'games': 0, 'note': 'no logs'}

    wins = Counter()
    turns = []
    conditions = Counter()
    firma_per_race = defaultdict(lambda: defaultdict(list))
    cards_played_total = defaultdict(Counter)  # by (race) → Counter
    races_seen = set()

    for log in logs:
        winner = log['winner']
        if winner:
            wins[winner] += 1
        else:
            wins['tie'] += 1
        if log['final_turn']:
            turns.append(log['final_turn'])
        conditions[log['condition'] or 'unknown'] += 1
        # firma per race
        for pid in ['a', 'b']:
            race = log['players'][pid].get('race', 'unknown')
            races_seen.add(race)
            for k, v in log['firma_activations'].items():
                firma_per_race[race][k].append(v)
            for card, count in log['card_plays'][pid].items():
                cards_played_total[race][card] += count

    avg_turn = mean(turns) if turns else 0
    med_turn = median(turns) if turns else 0
    p25 = sorted(turns)[len(turns)//4] if turns else 0
    p75 = sorted(turns)[len(turns)*3//4] if turns else 0

    firma_summary = {}
    for race, mech_map in firma_per_race.items():
        firma_summary[race] = {}
        for mech, vals in mech_map.items():
            if not vals:
                continue
            activated_count = sum(1 for v in vals if v > 0)
            firma_summary[race][mech] = {
                'avg_per_game': round(mean(vals), 2),
                'pct_games_with_activation': round(activated_count / len(vals), 2),
                'sample_size': len(vals),
            }

    top_cards = {}
    for race, ctr in cards_played_total.items():
        top_cards[race] = [{'card': c, 'plays': n} for c, n in ctr.most_common(10)]

    return {
        'games': n,
        'wins': dict(wins),
        'win_rate_a': round(wins['a'] / n, 3) if n else 0,
        'win_rate_b': round(wins['b'] / n, 3) if n else 0,
        'tie_rate': round(wins['tie'] / n, 3) if n else 0,
        'turn_stats': {
            'avg': round(avg_turn, 1),
            'median': med_turn,
            'p25': p25,
            'p75': p75,
            'max': max(turns) if turns else 0,
            'min': min(turns) if turns else 0,
        },
        'turn_cap_reached_pct': round(conditions.get('turn_cap_reached', 0) / n, 2),
        'conditions': dict(conditions),
        'firma_per_race': firma_summary,
        'top_cards_per_race': top_cards,
        'races_observed': sorted(races_seen),
    }


def matchup_profile(deck_a_variant, deck_b_variant):
    """Returns profile classification for matchup."""
    same_profile = deck_a_variant == deck_b_variant
    has_aggro = 'aggro' in (deck_a_variant, deck_b_variant)
    has_control = 'control' in (deck_a_variant, deck_b_variant)
    if same_profile:
        return 'same_profile'
    if has_aggro and has_control:
        return 'aggro_vs_control'
    return 'cross_profile_other'


def confidence_for(profile):
    """Calibrar confianza por profile (per spec sec 2 solución)."""
    if profile == 'same_profile':
        return 'medium', 'Same-profile matchup. IA v0 sesga parejo en ambos lados.'
    if profile == 'aggro_vs_control':
        return 'low', 'Cross-profile aggro vs control. IA v0 sesga sistemáticamente contra control (siempre ataca natal).'
    return 'low', 'Cross-profile heterogéneo. IA v0 puede sesgar.'


# ----------------------------------------------------------------------
# Análisis principal
# ----------------------------------------------------------------------

def analyze_batch(logs, label='batch'):
    agg = aggregate_batch(logs)
    n = agg['games']

    metrics_section = {
        'games_analyzed': n,
        'turn_stats': agg.get('turn_stats', {}),
        'turn_cap_reached_pct': agg.get('turn_cap_reached_pct', 0),
        'firma_activations_per_race': agg.get('firma_per_race', {}),
        'top_cards_per_race': {r: cards[:5] for r, cards in agg.get('top_cards_per_race', {}).items()},
        'confidence': 'high',
        'confidence_reason': 'Métricas mecánicas derivadas directamente de los logs sin requerir buena IA.',
    }

    # Validations: lo que funciona
    validations = []
    for race, mech_map in agg.get('firma_per_race', {}).items():
        for mech, stats in mech_map.items():
            pct = stats['pct_games_with_activation']
            if pct >= 0.80:
                validations.append({
                    'id': f'val_{race}_{mech}',
                    'description': f"{mech.capitalize()} activa en {int(pct*100)}% de partidas con mazos {race}.",
                    'observed': pct,
                    'expected': '>=80%',
                    'confidence': 'high',
                    'conclusion': f'Mecánica firma {mech} funciona como diseñado para raza {race}.',
                })

    return {
        'label': label,
        'mechanical_metrics': metrics_section,
        'validations': validations,
    }


def evaluate_nerf_criteria(logs):
    """Evalúa los criterios objetivos de nerf documentados por raza."""
    agg = aggregate_batch(logs)
    n = agg['games']
    criteria = []

    # Turn-based criteria por raza
    turns_per_race = defaultdict(list)
    wins_per_race = defaultdict(lambda: {'wins': 0, 'losses': 0})
    for log in logs:
        if log['final_turn'] is None or log['winner'] is None:
            continue
        for pid in ['a', 'b']:
            race = log['players'][pid].get('race')
            if not race:
                continue
            turns_per_race[race].append(log['final_turn'])
            if log['winner'] == pid:
                wins_per_race[race]['wins'] += 1
            else:
                wins_per_race[race]['losses'] += 1

    # Würon: Tiempo promedio de cierre <6 turnos → nerf agresivo?
    if 'wuron' in turns_per_race:
        wuron_avg = mean(turns_per_race['wuron'])
        criteria.append({
            'id': 'wuron_avg_close_turn_low',
            'description': 'Würon tiempo promedio cierre < 6 turnos → nerf agresivo?',
            'status': 'triggered' if wuron_avg < 6 and len(turns_per_race['wuron']) >= 10 else
                       ('insufficient_data' if len(turns_per_race['wuron']) < 10 else 'not_triggered'),
            'observed_value': round(wuron_avg, 1),
            'threshold': 6,
            'sample_size': len(turns_per_race['wuron']),
            'confidence': 'medium',
            'recommendation': '— ver Responsabilidad 6 si triggered',
        })

    # Tezhal: Tiempo promedio <5 turnos → nerf agresivo?
    if 'tezhal' in turns_per_race:
        tezhal_avg = mean(turns_per_race['tezhal'])
        criteria.append({
            'id': 'tezhal_avg_close_turn_low',
            'description': 'Tezhal tiempo promedio cierre < 5 turnos → nerf agresivo?',
            'status': 'triggered' if tezhal_avg < 5 and len(turns_per_race['tezhal']) >= 10 else
                       ('insufficient_data' if len(turns_per_race['tezhal']) < 10 else 'not_triggered'),
            'observed_value': round(tezhal_avg, 1),
            'threshold': 5,
            'sample_size': len(turns_per_race['tezhal']),
            'confidence': 'medium',
            'recommendation': '— ver Responsabilidad 6 si triggered',
        })

    # Q'ralan: <7 turnos
    if 'quralan' in turns_per_race:
        q_avg = mean(turns_per_race['quralan'])
        criteria.append({
            'id': 'qralan_avg_close_turn_low',
            'description': "Q'ralan tiempo promedio cierre < 7 turnos → nerf agresivo?",
            'status': 'triggered' if q_avg < 7 and len(turns_per_race['quralan']) >= 10 else
                       ('insufficient_data' if len(turns_per_race['quralan']) < 10 else 'not_triggered'),
            'observed_value': round(q_avg, 1),
            'threshold': 7,
            'sample_size': len(turns_per_race['quralan']),
            'confidence': 'medium',
            'recommendation': '— ver Responsabilidad 6 si triggered',
        })

    # Zaqe: Tiempo <10 turnos → revisar?
    if 'zaqe' in turns_per_race:
        z_avg = mean(turns_per_race['zaqe'])
        criteria.append({
            'id': 'zaqe_avg_close_turn_low',
            'description': 'Zaqe tiempo promedio cierre < 10 turnos → revisar?',
            'status': 'triggered' if z_avg < 10 and len(turns_per_race['zaqe']) >= 10 else
                       ('insufficient_data' if len(turns_per_race['zaqe']) < 10 else 'not_triggered'),
            'observed_value': round(z_avg, 1),
            'threshold': 10,
            'sample_size': len(turns_per_race['zaqe']),
            'confidence': 'low',
            'recommendation': 'CAVEAT: simulator v0 no diferencia heurísticas por archetype — Zaqe long-game se juega como aggro. Sub-10-turn close puede ser artefacto IA, no balance.',
        })

    return criteria


def analyze_matchup(logs, deck_a_path, deck_b_path):
    """Análisis focalizado en un matchup específico."""
    deck_a = parse_deck_yaml(deck_a_path)
    deck_b = parse_deck_yaml(deck_b_path)
    n = len(logs)
    wins_a = sum(1 for l in logs if l['winner'] == 'a')
    wins_b = sum(1 for l in logs if l['winner'] == 'b')
    ties = sum(1 for l in logs if l['winner'] is None)
    profile = matchup_profile(deck_a.get('variant', 'midrange'),
                              deck_b.get('variant', 'midrange'))
    conf, reason = confidence_for(profile)
    win_rate_a = round(wins_a / n, 3) if n else 0
    caveats = []
    if win_rate_a >= 0.65 and profile in ('aggro_vs_control', 'cross_profile_other'):
        caveats.append('Win rate alto en cross-profile matchup. IA v0 no diferencia heurísticas por archetype — control y midrange juegan igual de aggro. Distinguir con simulator v1+.')
    if win_rate_a >= 0.65 and conf == 'low':
        caveats.append('Confidence low por gap conocido en IA v0. NO recomendar nerf antes de re-validar.')
    return {
        'matchup': {
            'deck_a': deck_a['name'],
            'deck_b': deck_b['name'],
            'profile': profile,
        },
        'games': n,
        'wins_a': wins_a,
        'wins_b': wins_b,
        'ties': ties,
        'win_rate_a': win_rate_a,
        'win_rate_b': round(wins_b / n, 3) if n else 0,
        'confidence': conf,
        'confidence_reason': reason,
        'caveats': caveats,
    }


def validate_counter_wheel(matchup_results):
    """Evalúa wheel teórico contra observaciones por raza pair."""
    expected = {
        ('wuron', 'quralan'): 'wuron',
        ('quralan', 'tezhal'): 'quralan',
        ('tezhal', 'zaqe'): 'tezhal',
        ('zaqe', 'wuron'): 'zaqe',
    }
    out = []
    for (r1, r2), winner in expected.items():
        # buscar matchups que enfrenten r1 vs r2
        relevant = []
        for m in matchup_results:
            races = (m.get('race_a'), m.get('race_b'))
            if races == (r1, r2) or races == (r2, r1):
                relevant.append(m)
        if not relevant:
            out.append({
                'matchup': f'{r1}_vs_{r2}',
                'expected_winner': winner,
                'status': 'insufficient_data',
                'note': 'Sin partidas suficientes para evaluar.',
                'confidence': 'low',
            })
            continue
        # observed: win rate del esperado
        total_wins = 0
        total_games = 0
        for m in relevant:
            if m['race_a'] == winner:
                total_wins += m['wins_a']
            elif m['race_b'] == winner:
                total_wins += m['wins_b']
            total_games += m['games']
        observed = round(total_wins / total_games, 3) if total_games else 0
        matches = 'yes (strong)' if observed >= 0.55 else \
                  'yes (weak)' if observed >= 0.50 else \
                  'no'
        out.append({
            'matchup': f'{r1}_vs_{r2}',
            'expected_winner': winner,
            'observed_win_rate_for_expected': observed,
            'matches_theory': matches,
            'sample_size': total_games,
            'confidence': 'medium' if total_games >= 20 else 'low',
            'note': '' if matches.startswith('yes') else f'{winner} no le gana a su rival teórico en simulación.',
        })
    return out


def analyze_card(card_name, all_logs):
    """Análisis enfocado en una carta."""
    plays_total = 0
    games_with_card = 0
    games_without_card = 0
    wins_with = 0
    wins_without = 0
    for log in all_logs:
        played = False
        for pid in ['a', 'b']:
            if card_name in log['card_plays'][pid]:
                played = True
                plays_total += log['card_plays'][pid][card_name]
                if log['winner'] == pid:
                    wins_with += 1
                games_with_card += 1
                break
        if not played:
            games_without_card += 1
            if log['winner']:
                # contar wins del jugador que no jugó la carta
                wins_without += 1  # rough
    n = len(all_logs)
    return {
        'card': card_name,
        'total_plays_observed': plays_total,
        'inclusion_rate_in_logged_games': round(games_with_card / n, 3) if n else 0,
        'win_rate_when_played': round(wins_with / games_with_card, 3) if games_with_card else None,
        'sample_size_games': n,
        'sample_size_with_card': games_with_card,
        'confidence': 'medium' if games_with_card >= 10 else 'low',
        'note': 'Solo cuenta plays observados en log.actions[].card. Cartas vanilla sin handler pueden no aparecer si no se loggea play.',
    }


def validate_meta(matchup_results, criteria, counter_wheel):
    """Reporte ejecutivo del estado del meta."""
    # Win rate global por raza
    race_stats = defaultdict(lambda: {'wins': 0, 'losses': 0})
    for m in matchup_results:
        race_stats[m['race_a']]['wins'] += m['wins_a']
        race_stats[m['race_a']]['losses'] += m['games'] - m['wins_a'] - m['ties']
        race_stats[m['race_b']]['wins'] += m['wins_b']
        race_stats[m['race_b']]['losses'] += m['games'] - m['wins_b'] - m['ties']
    race_win_rates = {}
    for race, stats in race_stats.items():
        total = stats['wins'] + stats['losses']
        if total > 0:
            race_win_rates[race] = round(stats['wins'] / total, 3)
    dominant = [r for r, wr in race_win_rates.items() if wr > 0.55]
    underpowered = [r for r, wr in race_win_rates.items() if wr < 0.45]
    triggered = [c for c in criteria if c.get('status') == 'triggered']
    return {
        'race_global_win_rates': race_win_rates,
        'dominant_races': dominant,
        'underpowered_races': underpowered,
        'criteria_triggered_count': len(triggered),
        'criteria_triggered_ids': [c['id'] for c in triggered],
        'counter_wheel_summary': [
            {'matchup': cw['matchup'], 'matches_theory': cw.get('matches_theory', 'n/a')}
            for cw in counter_wheel
        ],
        'confidence_summary': {
            'race_win_rates': 'medium (calibrado por gap IA v0)',
            'criteria_triggered': 'medium',
            'counter_wheel': 'medium-low (depende de sample size + IA gap)',
        },
        'top_recommendations': [
            'Implementar AI variant-aware en simulator v1 antes de aplicar nerfs basados en cross-profile win rates.',
            'Re-correr full meta matrix con simulator v1+ una vez disponible.',
            'Mientras tanto: validations de mecánicas firma (high confidence) confirman diseño.',
        ],
    }


# ----------------------------------------------------------------------
# Main: API públicas
# ----------------------------------------------------------------------

def cmd_analyze_batch(batch_dir, label=None):
    """Comando 1."""
    files = sorted(glob.glob(f'{batch_dir}/*.yaml'))
    logs = [load_log(f) for f in files]
    return analyze_batch(logs, label or batch_dir)


def cmd_analyze_matchup(deck_a_path, deck_b_path, logs):
    """Comando 2."""
    return analyze_matchup(logs, deck_a_path, deck_b_path)


def cmd_analyze_card(card_name, logs):
    """Comando 3."""
    return analyze_card(card_name, logs)


def cmd_validate_meta(matchup_results, criteria, counter_wheel):
    """Comando 4."""
    return validate_meta(matchup_results, criteria, counter_wheel)


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'analyze':
        path = sys.argv[2] if len(sys.argv) > 2 else f'{REPO}/docs/playtest/sim-validation/sample-games'
        result = cmd_analyze_batch(path)
        print(yaml_dump(result))
    else:
        print('Usage: analyzer.py analyze <batch_dir>')
        sys.exit(1)
