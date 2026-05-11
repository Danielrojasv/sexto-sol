// Tests unitarios del interpreter — un caso por primitive como mínimo.
// Los tests construyen states minimalistas via createInitialState con decks
// de prueba y luego invocan executeEffect directamente.

import { describe, expect, it } from 'vitest'
import { createInitialState } from '../initialState'
import { executeEffect, type EffectContext } from '../interpreter'
import type { Card, GameState, ShipInstance } from '../types'
import type { Effect } from '@/data/primitives/spec'

function deck(size: number, race: 'wuron' | 'tezhal' | 'quralan' | 'zaqe' = 'wuron'): Card[] {
  return Array.from({ length: size }, (_, i) => ({
    id: `c${i}`,
    name: `Carta ${i}`,
    type: 'ship',
    race,
    cost: 0,
    rarity: 'common',
    keywords: [],
    abilities: [],
    strength: 1,
    hp: 1,
  }))
}

function fresh(): GameState {
  return createInitialState({
    seed: 42,
    p1Race: 'wuron',
    p2Race: 'tezhal',
    p1Deck: deck(20, 'wuron'),
    p2Deck: deck(20, 'tezhal'),
  })
}

function withFleet(state: GameState, p: 'p1' | 'p2', ships: ShipInstance[]): GameState {
  return {
    ...state,
    players: { ...state.players, [p]: { ...state.players[p], fleet: ships } },
  }
}

function ship(over: Partial<ShipInstance> & { instanceId: string }): ShipInstance {
  return {
    cardId: 'c0',
    controller: 'p1',
    strength: 2,
    maxHp: 3,
    hp: 3,
    damageTaken: 0,
    keywords: [],
    ...over,
  }
}

const ctxP1 = (selfShipId?: string): EffectContext => ({
  controller: 'p1',
  sourceCardId: 'src',
  selfShipId,
})

describe('interpreter — primitives', () => {
  it('noop devuelve state idéntico', () => {
    const s = fresh()
    const r = executeEffect({ op: 'noop' }, s, ctxP1())
    expect(r.state).toBe(s)
    expect(r.emit).toEqual([])
  })

  it('damage a una nave reduce hp y emite SHIP_DAMAGED', () => {
    const target = ship({ instanceId: 'enemy-1', controller: 'p2', hp: 5, strength: 1 })
    const s = withFleet(fresh(), 'p2', [target])
    const effect: Effect = {
      op: 'damage',
      target: { kind: 'all_ships', filter: { controller: 'opponent' } },
      amount: 2,
    }
    const r = executeEffect(effect, s, ctxP1())
    expect(r.state.players.p2.fleet[0]?.hp).toBe(3)
    expect(r.emit.find((e) => e.type === 'SHIP_DAMAGED')).toBeTruthy()
  })

  it('damage que mata emite SHIP_DESTROYED y la quita del fleet', () => {
    const target = ship({ instanceId: 'enemy-1', controller: 'p2', hp: 2 })
    const s = withFleet(fresh(), 'p2', [target])
    const effect: Effect = {
      op: 'damage',
      target: { kind: 'all_ships', filter: { controller: 'opponent' } },
      amount: 5,
    }
    const r = executeEffect(effect, s, ctxP1())
    expect(r.state.players.p2.fleet).toHaveLength(0)
    expect(r.emit.some((e) => e.type === 'SHIP_DESTROYED')).toBe(true)
  })

  it('damage_homeworld permitido siempre (v3.0: sin restricción de Edad)', () => {
    const s = fresh()
    const r = executeEffect({ op: 'damage_homeworld', player: 'opponent', amount: 5 }, s, ctxP1())
    expect(r.state.players.p2.homeworld.hp).toBe(15)
    expect(r.emit).toContainEqual({
      type: 'HOMEWORLD_DAMAGED',
      player: 'p2',
      amount: 5,
      source: 'src',
    })
  })

  it('destroy elimina la nave', () => {
    const target = ship({ instanceId: 'x' })
    const s = withFleet(fresh(), 'p1', [target])
    const r = executeEffect(
      { op: 'destroy', target: { kind: 'all_ships', filter: { controller: 'self' } } },
      s,
      ctxP1(),
    )
    expect(r.state.players.p1.fleet).toHaveLength(0)
  })

  it('exile destruye sin pasar al graveyard de nave', () => {
    const target = ship({ instanceId: 'x' })
    const s = withFleet(fresh(), 'p1', [target])
    const r = executeEffect(
      { op: 'exile', target: { kind: 'all_ships', filter: { controller: 'self' } } },
      s,
      ctxP1(),
    )
    expect(r.state.players.p1.fleet).toHaveLength(0)
  })

  it('bounce_to_hand: nave vuelve a la mano de su dueño', () => {
    const target = ship({ instanceId: 'x', cardId: 'c0' })
    const s = withFleet(fresh(), 'p1', [target])
    const handBefore = s.players.p1.hand.length
    const r = executeEffect(
      { op: 'bounce_to_hand', target: { kind: 'all_ships', filter: { controller: 'self' } } },
      s,
      ctxP1(),
    )
    expect(r.state.players.p1.fleet).toHaveLength(0)
    expect(r.state.players.p1.hand.length).toBe(handBefore + 1)
  })

  it('shuffle_to_deck: nave vuelve al mazo del controller', () => {
    const target = ship({ instanceId: 'x', cardId: 'c0' })
    const s = withFleet(fresh(), 'p1', [target])
    const deckBefore = s.players.p1.deck.length
    const r = executeEffect(
      {
        op: 'shuffle_to_deck',
        target: { kind: 'all_ships', filter: { controller: 'self' } },
        owner: 'self',
      },
      s,
      ctxP1(),
    )
    expect(r.state.players.p1.deck.length).toBe(deckBefore + 1)
  })

  it('draw mete N cartas en la mano', () => {
    const s = fresh()
    const handBefore = s.players.p1.hand.length
    const r = executeEffect({ op: 'draw', player: 'self', n: 2 }, s, ctxP1())
    expect(r.state.players.p1.hand.length).toBe(handBefore + 2)
    expect(r.emit.filter((e) => e.type === 'CARD_DRAWN')).toHaveLength(2)
  })

  it('draw cap a deck.length', () => {
    const s: GameState = {
      ...fresh(),
      players: {
        ...fresh().players,
        p1: { ...fresh().players.p1, deck: deck(2) },
      },
    }
    const r = executeEffect({ op: 'draw', player: 'self', n: 5 }, s, ctxP1())
    expect(r.state.players.p1.hand.length - s.players.p1.hand.length).toBe(2)
  })

  it('discard random saca cartas de la mano al graveyard', () => {
    const s = fresh()
    const r = executeEffect(
      { op: 'discard', target: 'self', n: 2, selection: 'random' },
      s,
      ctxP1(),
    )
    expect(r.state.players.p1.hand.length).toBe(s.players.p1.hand.length - 2)
    expect(r.state.players.p1.graveyard.length).toBe(2)
  })

  it('mill manda N cartas del top del mazo al graveyard', () => {
    const s = fresh()
    const r = executeEffect({ op: 'mill', player: 'opponent', n: 3 }, s, ctxP1())
    expect(r.state.players.p2.graveyard.length).toBe(3)
    expect(r.state.players.p2.deck.length).toBe(s.players.p2.deck.length - 3)
  })

  it('search saca de deck a hand cards que match filter', () => {
    const techCard: Card = {
      id: 'tech1',
      name: 'Tech',
      type: 'tech',
      race: 'wuron',
      cost: 0,
      rarity: 'common',
      keywords: [],
      abilities: [],
    }
    const s: GameState = {
      ...fresh(),
      players: {
        ...fresh().players,
        p1: { ...fresh().players.p1, deck: [techCard, ...deck(10)] },
      },
    }
    const r = executeEffect(
      {
        op: 'search',
        owner: 'self',
        zone: 'deck',
        filter: { cardType: 'tech' },
        count: 1,
        destination: 'hand',
      },
      s,
      ctxP1(),
    )
    expect(r.state.players.p1.hand.some((c) => c.id === 'tech1')).toBe(true)
    expect(r.state.players.p1.deck.some((c) => c.id === 'tech1')).toBe(false)
  })

  it('modify_strength delta+ permanente sube fuerza de la nave self', () => {
    const self = ship({ instanceId: 'self-1', strength: 2 })
    const s = withFleet(fresh(), 'p1', [self])
    const r = executeEffect(
      {
        op: 'modify_strength',
        target: { kind: 'self' },
        kind: 'delta',
        value: 1,
        duration: 'permanent',
      },
      s,
      ctxP1('self-1'),
    )
    expect(r.state.players.p1.fleet[0]?.strength).toBe(3)
  })

  it('modify_hp delta+ sube hp', () => {
    const self = ship({ instanceId: 'self-1', hp: 2 })
    const s = withFleet(fresh(), 'p1', [self])
    const r = executeEffect(
      {
        op: 'modify_hp',
        target: { kind: 'self' },
        kind: 'delta',
        value: 2,
        duration: 'permanent',
      },
      s,
      ctxP1('self-1'),
    )
    expect(r.state.players.p1.fleet[0]?.hp).toBe(4)
  })

  it('grant_keyword agrega keyword a la nave si no la tenía', () => {
    const self = ship({ instanceId: 'self-1', keywords: [] })
    const s = withFleet(fresh(), 'p1', [self])
    const r = executeEffect(
      {
        op: 'grant_keyword',
        target: { kind: 'self' },
        keyword: 'bastion',
        duration: 'permanent',
      },
      s,
      ctxP1('self-1'),
    )
    expect(r.state.players.p1.fleet[0]?.keywords).toContain('bastion')
  })

  it('generate_energy suma al pool del player', () => {
    const s = fresh()
    const before = s.players.p1.energy
    const r = executeEffect(
      { op: 'generate_energy', player: 'self', n: 2, duration: 'this_turn' },
      s,
      ctxP1(),
    )
    expect(r.state.players.p1.energy).toBe(before + 2)
  })

  it('sacrifice quita la nave self del fleet', () => {
    const self = ship({ instanceId: 'self-1' })
    const s = withFleet(fresh(), 'p1', [self])
    const r = executeEffect({ op: 'sacrifice', target: { kind: 'self' } }, s, ctxP1('self-1'))
    expect(r.state.players.p1.fleet).toHaveLength(0)
    expect(r.emit.some((e) => e.type === 'SHIP_DESTROYED')).toBe(true)
  })

  it('sequence ejecuta efectos en orden', () => {
    const self = ship({ instanceId: 'self-1', strength: 2 })
    const s = withFleet(fresh(), 'p1', [self])
    const r = executeEffect(
      {
        op: 'sequence',
        effects: [
          {
            op: 'modify_strength',
            target: { kind: 'self' },
            kind: 'delta',
            value: 1,
            duration: 'permanent',
          },
          {
            op: 'modify_strength',
            target: { kind: 'self' },
            kind: 'delta',
            value: 2,
            duration: 'permanent',
          },
        ],
      },
      s,
      ctxP1('self-1'),
    )
    expect(r.state.players.p1.fleet[0]?.strength).toBe(5)
  })

  it('conditional ejecuta thenEffect cuando la condición se cumple', () => {
    const self = ship({ instanceId: 'self-1', strength: 2 })
    const s = withFleet(fresh(), 'p1', [self])
    const r = executeEffect(
      {
        op: 'conditional',
        condition: { kind: 'always' },
        thenEffect: {
          op: 'modify_strength',
          target: { kind: 'self' },
          kind: 'delta',
          value: 1,
          duration: 'permanent',
        },
      },
      s,
      ctxP1('self-1'),
    )
    expect(r.state.players.p1.fleet[0]?.strength).toBe(3)
  })

  it('conditional con elseEffect cuando no se cumple', () => {
    const self = ship({ instanceId: 'self-1', strength: 2 })
    const s = withFleet(fresh(), 'p1', [self])
    const r = executeEffect(
      {
        op: 'conditional',
        condition: { kind: 'self_has_keyword', keyword: 'nonexistent' },
        thenEffect: { op: 'noop' },
        elseEffect: {
          op: 'modify_strength',
          target: { kind: 'self' },
          kind: 'delta',
          value: -1,
          duration: 'permanent',
        },
      },
      s,
      ctxP1('self-1'),
    )
    expect(r.state.players.p1.fleet[0]?.strength).toBe(1)
  })

  it('for_each ejecuta el efecto N veces (1 por nave que match)', () => {
    const enemyA = ship({ instanceId: 'e1', controller: 'p2', strength: 1, hp: 5 })
    const enemyB = ship({ instanceId: 'e2', controller: 'p2', strength: 1, hp: 5 })
    const enemyC = ship({ instanceId: 'e3', controller: 'p2', strength: 1, hp: 5 })
    const self = ship({ instanceId: 'self-1', controller: 'p1' })
    let s = withFleet(fresh(), 'p2', [enemyA, enemyB, enemyC])
    s = withFleet(s, 'p1', [self])
    const r = executeEffect(
      {
        op: 'for_each',
        filter: { controller: 'opponent' },
        effect: {
          op: 'modify_strength',
          target: { kind: 'self' },
          kind: 'delta',
          value: 1,
          duration: 'permanent',
        },
      },
      s,
      ctxP1('self-1'),
    )
    // 3 enemigos → 3 incrementos de +1
    expect(r.state.players.p1.fleet[0]?.strength).toBe(self.strength + 3)
  })

  it('cap de profundidad: composición > MAX_COMPOSITION_DEPTH se ignora', () => {
    // sequence(sequence(sequence(sequence(damage(...))))) — depth 4 ignorado.
    const self = ship({ instanceId: 'self-1', strength: 2 })
    const s = withFleet(fresh(), 'p1', [self])
    const tooDeep: Effect = {
      op: 'sequence',
      effects: [
        {
          op: 'sequence',
          effects: [
            {
              op: 'sequence',
              effects: [
                {
                  op: 'sequence',
                  effects: [
                    {
                      op: 'modify_strength',
                      target: { kind: 'self' },
                      kind: 'delta',
                      value: 100,
                      duration: 'permanent',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }
    const r = executeEffect(tooDeep, s, ctxP1('self-1'))
    // Profundidad 4 no llega a aplicar el modify_strength final.
    expect(r.state.players.p1.fleet[0]?.strength).toBe(2)
  })

  it('random_ship usa el rng del state (determinista)', () => {
    const enemyA = ship({ instanceId: 'e1', controller: 'p2' })
    const enemyB = ship({ instanceId: 'e2', controller: 'p2' })
    const enemyC = ship({ instanceId: 'e3', controller: 'p2' })
    const s = withFleet(fresh(), 'p2', [enemyA, enemyB, enemyC])
    const effect: Effect = {
      op: 'damage',
      target: { kind: 'random_ship', filter: { controller: 'opponent' } },
      amount: 1,
    }
    const r1 = executeEffect(effect, s, ctxP1())
    const r2 = executeEffect(effect, s, ctxP1())
    // Mismo state input → mismo target elegido.
    const dmg1 = r1.emit.find((e) => e.type === 'SHIP_DAMAGED')
    const dmg2 = r2.emit.find((e) => e.type === 'SHIP_DAMAGED')
    expect(dmg1).toEqual(dmg2)
  })
})

describe('interpreter — wired al reducer (on_play)', () => {
  it('PLAY_CARD ejecuta abilities con trigger on_play', async () => {
    // Carta que al entrar en juego le hace 5 daño al mundo natal opponent.
    // En Edad III, el daño aplica.
    const { apply } = await import('../reducer')
    const heavyHitter: Card = {
      id: 'hitter',
      name: 'Megacañón',
      type: 'ship',
      race: 'wuron',
      cost: 0,
      rarity: 'rare',
      keywords: [],
      strength: 1,
      hp: 1,
      abilities: [
        {
          trigger: { kind: 'on_play' },
          category: 'initiative',
          effect: { op: 'damage_homeworld', player: 'opponent', amount: 5 },
        },
      ],
    }
    let s = createInitialState({
      seed: 1,
      p1Race: 'wuron',
      p2Race: 'tezhal',
      p1Deck: [heavyHitter, ...deck(20)],
      p2Deck: deck(20, 'tezhal'),
    })
    // Avanzamos a Edad III para que damage_homeworld aplique.
    while (s.turn < 9) s = apply(s, { type: 'END_PHASE' }).state
    // Ir a despliegue de p1.
    while (!(s.activePlayer === 'p1' && s.phase === 'despliegue')) {
      s = apply(s, { type: 'END_PHASE' }).state
    }
    // Inyectar la carta en mano (la mano puede haber rotado por turnos previos).
    s = {
      ...s,
      players: { ...s.players, p1: { ...s.players.p1, hand: [...s.players.p1.hand, heavyHitter] } },
    }
    const r = apply(s, { type: 'PLAY_CARD', cardId: 'hitter' })
    expect(r.events).toContainEqual({ type: 'CARD_PLAYED', cardId: 'hitter', player: 'p1' })
    expect(r.events.find((e) => e.type === 'HOMEWORLD_DAMAGED')).toEqual({
      type: 'HOMEWORLD_DAMAGED',
      player: 'p2',
      amount: 5,
      source: 'hitter',
    })
    expect(r.state.players.p2.homeworld.hp).toBe(15)
  })
})

// ---------------------------------------------------------------------------
// v3.0.1 — DSL extensions (schema-only). Engine impl pending Phase 1 kernel.
// ---------------------------------------------------------------------------

describe.skip("interpreter — v3.0.1 primitives (TODO Phase 1)", () => {
  // TODO Phase 1 kernel: implementar y des-skippear estos tests.
  // Cada test corresponde a un primitive nuevo agregado en spec.ts v3.0.1.
  // Mientras se .skip, los efectos en el interpreter son no-ops o stubs
  // documentados con TODO en interpreter.ts.

  it("ship_attacked event fires on combat declaration", () => {
    // TODO: el reducer debe emitir SHIP_ATTACKED cuando DECLARE_ATTACK
    // se procesa, antes de aplicar el daño. Validar timing relativo a
    // SHIP_DAMAGED y SHIP_DESTROYED.
    expect(true).toBe(false)
  })

  it("attacker target resolves to the ship that triggered ship_attacked", () => {
    // TODO: resolveShipTargets case attacker debe leer ctx.attackerShipId
    // (campo nuevo en EffectContext) y devolver la ShipInstance del atacante.
    expect(true).toBe(false)
  })

  it("wasDamagedThisTurn filter matches only ships damaged this turn", () => {
    // TODO: ShipInstance.damagedThisTurn (boolean) marca true al recibir SHIP_DAMAGED.
    // TURN_START reset a false en el reducer. shipMatchesFilter chequea el flag.
    expect(true).toBe(false)
  })

  it("modify_hp set_to_max restores hp to maxHp", () => {
    // NOTA: este sí tiene impl básica desde commit 0 (maxHp ya existe).
    // El test queda .skip por simetría con los otros 4; cuando arranque la suite
    // de v3.0.1 desbloquearlo y verificar que la nave dañada vuelve a maxHp.
    expect(true).toBe(false)
  })

  it("keyword_amplifier doubles Kulen delta when relic is in play", () => {
    // TODO: registry de keyword_amplifiers activos por controlador. Cuando una
    // keyword dispara modify_strength en una nave del controlador, sumar
    // amplifier.deltaBonus al value antes de aplicar. Test: relic +1 amplifier
    // hace que Kulen +1 se vuelva +2 perm.
    expect(true).toBe(false)
  })

  it("self-damage triggers Kulen (per Q4 in canary proposal)", () => {
    // TODO: Kulen no debe filtrar por source — cualquier daño que la nave
    // recibe (autoinfligido por Brotal de Üntu, Aullido del Bosque) gatilla
    // el +1 fuerza permanente, siempre que sobreviva.
    expect(true).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// v3.0.3 — DSL extensions (schema-only). Engine impl pending Phase 1 kernel.
// ---------------------------------------------------------------------------

describe.skip("interpreter — v3.0.3 primitives (TODO Phase 1)", () => {
  // TODO Phase 1 kernel: implementar y des-skippear estos tests.
  // Cada test corresponde a un primitive nuevo agregado en spec.ts v3.0.3
  // para el canary Zaqe. Mientras se .skip, los efectos son no-ops o stubs
  // documentados con TODO en interpreter.ts.

  it("search zone pozo_astral lee del state field pozoAstral separado", () => {
    // TODO: state.players[*].pozoAstral debe existir como Card[] separado
    // de graveyard. Ships zaqe destruidas se mueven ahí; otras cartas y
    // tech expirados van a graveyard. search.zone='pozo_astral' lee de
    // pozoAstral; legacy 'graveyard' sigue leyendo de graveyard.
    expect(true).toBe(false)
  })

  it("cost_modifier registra descuento sobre keyword target con clamp minCost", () => {
    // TODO: al desplegar relic con cost_modifier, registrar
    // state.costModifiers[keyword] = { delta, minCost }. Al calcular costo
    // de pagar Refluencia, aplicar Math.max(minCost, baseCost + delta).
    // Limpiar al destruir la fuente. Test: relic con delta -1, minCost 1.
    // Revival de Navegante (1c) sigue costando 1 (clamp). Revival de Balsa
    // Áurea (2c) cuesta 1.
    expect(true).toBe(false)
  })

  it("chosen_permanent resuelve a relic/tech en juego (no fleet)", () => {
    // TODO: resolveTargets case 'chosen_permanent' debe buscar en
    // state.players[*].relicsInPlay (zona nueva separada de fleet). T1
    // Disolutorio Sqhaguata exilia una Reliquia enemiga elegida.
    expect(true).toBe(false)
  })

  it("count_filter zone pozo_astral cuenta cartas en Pozo Astral del player", () => {
    // TODO: evaluateCondition case 'count_filter' debe respetar zone+player
    // opcionales (default in_play). Cuando zone !== in_play, contar cartas
    // en la zona target del player, ignorando filter.controller.
    // E4 Visión del Pozo Astral / R1 Reloj del Pozo Áureo dependen de esto.
    expect(true).toBe(false)
  })

  it("Refluencia revival reset stats base + HP máximo (per GAME-RULES sec 7.4)", () => {
    // TODO: PAY_REFLUENCIA handler nuevo en reducer debe:
    //   1. Descontar costo (modulado por costModifiers["refluencia"] con clamp).
    //   2. Crear ShipInstance fresca con stats base de Card (no las modificadas).
    //   3. Setear hp = maxHp.
    //   4. Mover de pozoAstral -> fleet.
    //   5. Marcar revivedOnce=true.
    // Si revivedOnce=true al volver a morir -> mover a disolucion (terminal).
    expect(true).toBe(false)
  })

  it("Disolución es zona terminal — no search ops pueden referenciarla", () => {
    // TODO: validador runtime debe rechazar search.zone='disolucion' (ya
    // schema-bloqueado pero defensivo en runtime). Disolución solo recibe
    // cartas, nunca las saca. Restricción inviolable Zaqe canary.
    expect(true).toBe(false)
  })
})

