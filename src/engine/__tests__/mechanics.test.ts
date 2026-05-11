// Tests de las 4 mecánicas firma del set base v3.0:
//   - Külen (Würon, reactive)
//   - Formación Solar (Q'ralan, accumulative) — derive layer
//   - Ignición (Tezhal, initiative) — ACTIVATE_IGNICION action
//   - Refluencia (Zaqe, post_combat) — pozoAstral + PAY_REFLUENCIA + Disolución
//
// Escenarios canónicos del handoff v3.

import { describe, expect, it } from 'vitest'
import { createInitialState, type NewGameSetup } from '../initialState'
import { apply } from '../reducer'
import { runTriggers } from '../eventBus'
import { getEffectiveStrength } from '../derive/strength'
import type { Card, GameEvent, GameState } from '../types'

function deck(size: number, overrides?: Partial<Card>): Card[] {
  return Array.from({ length: size }, (_, i) => ({
    id: `c${i}`,
    name: `Carta ${i}`,
    type: 'ship',
    race: 'wuron',
    cost: 0,
    rarity: 'common',
    keywords: [],
    abilities: [],
    strength: 1,
    hp: 1,
    ...overrides,
  }))
}

function fresh(over?: Partial<NewGameSetup>): GameState {
  return createInitialState({
    seed: 1,
    p1Race: 'wuron',
    p2Race: 'tezhal',
    p1Deck: deck(30),
    p2Deck: deck(30),
    ...over,
  })
}

function advanceToPhase(s: GameState, player: 'p1' | 'p2', phase: GameState['phase']): GameState {
  let cur = s
  while (!(cur.activePlayer === player && cur.phase === phase)) {
    cur = apply(cur, { type: 'END_PHASE' }).state
  }
  return cur
}

// ---------------------------------------------------------------------------
// Külen — Würon reactive
// ---------------------------------------------------------------------------

describe('mecánica firma — Külen (Würon reactive)', () => {
  it('nave Würon con Külen recibe daño y sobrevive → +1 fuerza permanente', () => {
    const lhuepang: Card = {
      id: 'lhuepang',
      name: 'Lhüpang Resistente',
      type: 'ship',
      race: 'wuron',
      cost: 0,
      rarity: 'common',
      keywords: ['kulen'],
      abilities: [],
      strength: 2,
      hp: 4,
    }
    let s = fresh({ p1Deck: [lhuepang, ...deck(30)] })
    s = apply(s, { type: 'END_PHASE' }).state // p1 despliegue
    s = apply(s, { type: 'PLAY_CARD', cardId: 'lhuepang' }).state
    const shipId = s.players.p1.fleet[0]?.instanceId as string
    // Simular daño de 2 (sobrevive con hp 2).
    const damagedShip = s.players.p1.fleet[0]
    if (damagedShip) {
      s = {
        ...s,
        players: {
          ...s.players,
          p1: {
            ...s.players.p1,
            fleet: s.players.p1.fleet.map((sh) =>
              sh.instanceId === shipId
                ? { ...sh, hp: sh.hp - 2, damageTaken: 2, damagedThisTurn: true }
                : sh,
            ),
          },
        },
      }
    }
    const event: GameEvent = { type: 'SHIP_DAMAGED', shipId, amount: 2, source: 'test' }
    const { state: after } = runTriggers(s, event)
    const buffed = after.players.p1.fleet.find((sh) => sh.instanceId === shipId)
    expect(buffed?.strength).toBe(3) // 2 base + 1 Külen
    expect(buffed?.hp).toBe(2) // hp post-daño
  })

  it('nave Würon con Külen muere → NO gatilla buff', () => {
    const fragile: Card = {
      id: 'frag',
      name: 'Frágil con Külen',
      type: 'ship',
      race: 'wuron',
      cost: 0,
      rarity: 'common',
      keywords: ['kulen'],
      abilities: [],
      strength: 1,
      hp: 1,
    }
    let s = fresh({ p1Deck: [fragile, ...deck(30)] })
    s = apply(s, { type: 'END_PHASE' }).state
    s = apply(s, { type: 'PLAY_CARD', cardId: 'frag' }).state
    const shipId = s.players.p1.fleet[0]?.instanceId as string
    // Simular daño que mata la nave.
    s = {
      ...s,
      players: {
        ...s.players,
        p1: {
          ...s.players.p1,
          fleet: s.players.p1.fleet.map((sh) =>
            sh.instanceId === shipId
              ? { ...sh, hp: 0, damageTaken: 1, damagedThisTurn: true }
              : sh,
          ),
        },
      },
    }
    const event: GameEvent = { type: 'SHIP_DAMAGED', shipId, amount: 1, source: 'test' }
    const { state: after } = runTriggers(s, event)
    const dead = after.players.p1.fleet.find((sh) => sh.instanceId === shipId)
    // Nave aún en fleet (kill no se ejecutó en este test sintético), pero
    // hp=0, no debería haber buff de Külen.
    expect(dead?.strength).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Formación Solar — Q'ralan accumulative (derive layer)
// ---------------------------------------------------------------------------

describe('mecánica firma — Formación Solar (Q\'ralan derive layer)', () => {
  it('Q\'illay (3/3 con FS) + 4 otras Q\'ralan (una sin keyword FS) → effective 7', () => {
    const qillay: Card = {
      id: 'qillay',
      name: "Q'illay del Hangar Solar",
      type: 'ship',
      race: 'quralan',
      cost: 0,
      rarity: 'legendary',
      keywords: ['formacion_solar'],
      abilities: [],
      strength: 3,
      hp: 3,
    }
    const otherFS: Card = {
      id: 'oa',
      name: 'Otra A',
      type: 'ship',
      race: 'quralan',
      cost: 0,
      rarity: 'common',
      keywords: ['formacion_solar'],
      abilities: [],
      strength: 1,
      hp: 1,
    }
    const otherFS2: Card = { ...otherFS, id: 'ob', name: 'Otra B' }
    const otherFS3: Card = { ...otherFS, id: 'oc', name: 'Otra C' }
    const otherNoKw: Card = {
      ...otherFS,
      id: 'od',
      name: 'Otra D Sin FS',
      keywords: [], // Q'ralan SIN keyword formacion_solar — debe contar igual.
    }
    let s = fresh({
      p1Race: 'quralan',
      p1Deck: [qillay, otherFS, otherFS2, otherFS3, otherNoKw, ...deck(30)],
    })
    s = apply(s, { type: 'END_PHASE' }).state // p1 despliegue
    s = apply(s, { type: 'PLAY_CARD', cardId: 'qillay' }).state
    s = apply(s, { type: 'PLAY_CARD', cardId: 'oa' }).state
    s = apply(s, { type: 'PLAY_CARD', cardId: 'ob' }).state
    s = apply(s, { type: 'PLAY_CARD', cardId: 'oc' }).state
    s = apply(s, { type: 'PLAY_CARD', cardId: 'od' }).state
    const qillayShip = s.players.p1.fleet.find((sh) => sh.cardId === 'qillay')
    expect(qillayShip).toBeDefined()
    if (qillayShip) {
      const eff = getEffectiveStrength(qillayShip, s)
      expect(eff).toBe(7) // 3 base + 4 otras Q'ralan (incluye la sin keyword)
    }
  })

  it('FS cuenta sólo Q\'ralan, NO naves de otras razas', () => {
    const qillay: Card = {
      id: 'qillay',
      name: "Q'illay",
      type: 'ship',
      race: 'quralan',
      cost: 0,
      rarity: 'legendary',
      keywords: ['formacion_solar'],
      abilities: [],
      strength: 3,
      hp: 3,
    }
    const wuronShip: Card = {
      id: 'w1',
      name: 'Würon',
      type: 'ship',
      race: 'wuron',
      cost: 0,
      rarity: 'common',
      keywords: [],
      abilities: [],
      strength: 1,
      hp: 1,
    }
    let s = fresh({
      p1Race: 'quralan',
      p1Deck: [qillay, wuronShip, ...deck(30)],
    })
    s = apply(s, { type: 'END_PHASE' }).state
    s = apply(s, { type: 'PLAY_CARD', cardId: 'qillay' }).state
    s = apply(s, { type: 'PLAY_CARD', cardId: 'w1' }).state
    const qillayShip = s.players.p1.fleet.find((sh) => sh.cardId === 'qillay')
    if (qillayShip) {
      const eff = getEffectiveStrength(qillayShip, s)
      expect(eff).toBe(3) // 3 base + 0 otras Q'ralan (Würon no cuenta)
    }
  })

  it('nave Q\'ralan sin keyword FS → effective = base', () => {
    const qralan: Card = {
      id: 'q',
      name: 'Q\'ralan sin FS',
      type: 'ship',
      race: 'quralan',
      cost: 0,
      rarity: 'common',
      keywords: [], // sin FS
      abilities: [],
      strength: 2,
      hp: 2,
    }
    const other: Card = { ...qralan, id: 'q2', name: "Q'ralan 2", keywords: ['formacion_solar'] }
    let s = fresh({ p1Race: 'quralan', p1Deck: [qralan, other, ...deck(30)] })
    s = apply(s, { type: 'END_PHASE' }).state
    s = apply(s, { type: 'PLAY_CARD', cardId: 'q' }).state
    s = apply(s, { type: 'PLAY_CARD', cardId: 'q2' }).state
    const ship = s.players.p1.fleet.find((sh) => sh.cardId === 'q')
    if (ship) {
      const eff = getEffectiveStrength(ship, s)
      expect(eff).toBe(2) // sin keyword, no aplica bonus
    }
  })
})

// ---------------------------------------------------------------------------
// Ignición — Tezhal initiative (ACTIVATE_IGNICION)
// ---------------------------------------------------------------------------

describe('mecánica firma — Ignición (Tezhal ACTIVATE_IGNICION)', () => {
  it('sin nave Tezhal aliada → ACTIVATE_IGNICION es ilegal', () => {
    const plumaje: Card = {
      id: 'plumaje',
      name: 'Plumaje Encendido',
      type: 'tech',
      race: 'tezhal',
      cost: 1,
      rarity: 'common',
      keywords: ['ignicion'],
      abilities: [
        {
          trigger: { kind: 'on_play' },
          category: 'initiative',
          effect: {
            op: 'sequence',
            effects: [
              { op: 'sacrifice', target: { kind: 'chosen_ship', filter: { controller: 'self' } } },
              { op: 'damage_homeworld', player: 'opponent', amount: 3 },
            ],
          },
        },
      ],
    }
    let s = fresh({ p1Race: 'tezhal', p1Deck: [plumaje, ...deck(30)] })
    s = apply(s, { type: 'END_PHASE' }).state
    const before = s
    const r = apply(s, {
      type: 'ACTIVATE_IGNICION',
      cardId: 'plumaje',
      sacrificeShipId: 'nonexistent',
    })
    expect(r.state).toBe(before)
  })

  it('con Iniciado Tezhal aliado → sacrifica + ejecuta effect', () => {
    const plumaje: Card = {
      id: 'plumaje',
      name: 'Plumaje Encendido',
      type: 'tech',
      race: 'tezhal',
      cost: 1,
      rarity: 'common',
      keywords: ['ignicion'],
      abilities: [
        {
          trigger: { kind: 'on_play' },
          category: 'initiative',
          effect: {
            op: 'sequence',
            effects: [
              { op: 'sacrifice', target: { kind: 'chosen_ship', filter: { controller: 'self' } } },
              { op: 'damage_homeworld', player: 'opponent', amount: 3 },
            ],
          },
        },
      ],
    }
    const iniciado: Card = {
      id: 'iniciado',
      name: 'Iniciado Xocotzin',
      type: 'ship',
      race: 'tezhal',
      cost: 0,
      rarity: 'common',
      keywords: [],
      abilities: [],
      strength: 1,
      hp: 1,
    }
    let s = fresh({ p1Race: 'tezhal', p1Deck: [plumaje, iniciado, ...deck(30)] })
    s = apply(s, { type: 'END_PHASE' }).state
    // Jugar Iniciado primero
    s = apply(s, { type: 'PLAY_CARD', cardId: 'iniciado' }).state
    const iniciadoId = s.players.p1.fleet[0]?.instanceId as string
    // damage_homeworld solo aplica en Edad III (regla §5). Esperamos que el
    // sacrifice ocurra pero damage_homeworld sea no-op por edad.
    const r = apply(s, {
      type: 'ACTIVATE_IGNICION',
      cardId: 'plumaje',
      sacrificeShipId: iniciadoId,
    })
    // El iniciado debe haber sido sacrificado (sale del fleet).
    expect(r.state.players.p1.fleet.find((sh) => sh.instanceId === iniciadoId)).toBeUndefined()
    // La carta plumaje sale de hand al graveyard.
    expect(r.state.players.p1.hand.find((c) => c.id === 'plumaje')).toBeUndefined()
    expect(r.state.players.p1.graveyard.find((c) => c.id === 'plumaje')).toBeDefined()
  })

  it('sacrifice de nave NO-Tezhal → action ilegal aunque la nave sea aliada', () => {
    const plumaje: Card = {
      id: 'plumaje',
      name: 'Plumaje Encendido',
      type: 'tech',
      race: 'tezhal',
      cost: 0,
      rarity: 'common',
      keywords: ['ignicion'],
      abilities: [{ trigger: { kind: 'on_play' }, category: 'initiative', effect: { op: 'noop' } }],
    }
    const wuronAlly: Card = {
      id: 'w',
      name: 'Aliada Würon',
      type: 'ship',
      race: 'wuron',
      cost: 0,
      rarity: 'common',
      keywords: [],
      abilities: [],
      strength: 1,
      hp: 1,
    }
    let s = fresh({ p1Race: 'tezhal', p1Deck: [plumaje, wuronAlly, ...deck(30)] })
    s = apply(s, { type: 'END_PHASE' }).state
    s = apply(s, { type: 'PLAY_CARD', cardId: 'w' }).state
    const wuronId = s.players.p1.fleet[0]?.instanceId as string
    const before = s
    const r = apply(s, {
      type: 'ACTIVATE_IGNICION',
      cardId: 'plumaje',
      sacrificeShipId: wuronId,
    })
    expect(r.state).toBe(before) // Aliada Würon no califica para Ignición
  })
})

// ---------------------------------------------------------------------------
// Refluencia — Zaqe post_combat (pozoAstral + PAY_REFLUENCIA)
// ---------------------------------------------------------------------------

describe('mecánica firma — Refluencia (Zaqe pozoAstral + revival)', () => {
  it('nave Zaqe con keyword refluencia muere → va a pozoAstral con stats base', () => {
    // Setup: nave Zaqe con keyword refluencia, fuerza base 1, hp 1. Recibe
    // un buff hipotético (FS o Külen no aplica acá, simulamos buff directo).
    const sumzhua: Card = {
      id: 'sumzhua',
      name: 'Sumzhua del Sexto Sol',
      type: 'ship',
      race: 'zaqe',
      cost: 0,
      rarity: 'legendary',
      keywords: ['refluencia'],
      abilities: [],
      strength: 3,
      hp: 3,
    }
    const attacker: Card = {
      id: 'att',
      name: 'Atacante',
      type: 'ship',
      race: 'wuron',
      cost: 0,
      rarity: 'common',
      keywords: [],
      abilities: [],
      strength: 5, // kill instantáneo
      hp: 5,
    }
    let s = fresh({
      p2Race: 'zaqe',
      p1Deck: [attacker, ...deck(30)],
      p2Deck: [sumzhua, ...deck(30)],
    })
    // Buff manual a sumzhua después de jugarla (simular Külen)
    s = apply(s, { type: 'END_PHASE' }).state
    s = apply(s, { type: 'PLAY_CARD', cardId: 'att' }).state
    s = advanceToPhase(s, 'p2', 'despliegue')
    s = apply(s, { type: 'PLAY_CARD', cardId: 'sumzhua' }).state
    // Buff fuerza de sumzhua a +5 (simular Külen acumulado)
    const sumzhuaId = s.players.p2.fleet[0]?.instanceId as string
    s = {
      ...s,
      players: {
        ...s.players,
        p2: {
          ...s.players.p2,
          fleet: s.players.p2.fleet.map((sh) =>
            sh.instanceId === sumzhuaId ? { ...sh, strength: sh.strength + 5 } : sh,
          ),
        },
      },
    }
    s = advanceToPhase(s, 'p1', 'combate')
    const attackerId = s.players.p1.fleet[0]?.instanceId as string
    const r = apply(s, {
      type: 'DECLARE_ATTACK',
      attackerShipId: attackerId,
      target: { kind: 'ship', ref: sumzhuaId },
    })
    // Sumzhua muere y va a pozoAstral con stats base.
    expect(r.state.players.p2.fleet.find((sh) => sh.instanceId === sumzhuaId)).toBeUndefined()
    const inPozo = r.state.players.p2.pozoAstral.find((sh) => sh.instanceId === sumzhuaId)
    expect(inPozo).toBeDefined()
    expect(inPozo?.strength).toBe(3) // RESET a base, NO acumula el +5
    expect(inPozo?.hp).toBe(3) // RESET a maxHp
    expect(inPozo?.damageTaken).toBe(0)
  })

  it('PAY_REFLUENCIA en despliegue revive ship con stats base + revivedFromRefluencia', () => {
    const sumzhua: Card = {
      id: 'sumzhua',
      name: 'Sumzhua',
      type: 'ship',
      race: 'zaqe',
      cost: 2,
      rarity: 'legendary',
      keywords: ['refluencia'],
      abilities: [],
      strength: 3,
      hp: 3,
    }
    // Setup state: sumzhua en pozoAstral, p2 active phase despliegue, energía suficiente.
    let s = fresh({ p2Race: 'zaqe', p2Deck: [sumzhua, ...deck(30)] })
    s = advanceToPhase(s, 'p2', 'despliegue')
    // Inyectar sumzhua en pozoAstral con stats reseteadas.
    const fakeShip = {
      instanceId: 'sh1',
      cardId: 'sumzhua',
      controller: 'p2' as const,
      strength: 3,
      maxHp: 3,
      hp: 3,
      damageTaken: 0,
      keywords: ['refluencia'],
    }
    s = {
      ...s,
      players: {
        ...s.players,
        p2: { ...s.players.p2, pozoAstral: [fakeShip], energy: 3 },
      },
    }
    const r = apply(s, { type: 'PAY_REFLUENCIA', shipId: 'sh1' })
    expect(r.state.players.p2.pozoAstral).toHaveLength(0)
    const revived = r.state.players.p2.fleet.find((sh) => sh.instanceId === 'sh1')
    expect(revived).toBeDefined()
    expect(revived?.revivedFromRefluencia).toBe(true)
    expect(revived?.strength).toBe(3)
    expect(revived?.hp).toBe(3)
    expect(r.state.players.p2.energy).toBe(3 - 2) // pagó costo 2
  })

  it('segunda muerte de nave revived va a Disolución (terminal), NO vuelve a pozoAstral', () => {
    const sumzhua: Card = {
      id: 'sumzhua',
      name: 'Sumzhua',
      type: 'ship',
      race: 'zaqe',
      cost: 0,
      rarity: 'legendary',
      keywords: ['refluencia'],
      abilities: [],
      strength: 1,
      hp: 1,
    }
    const attacker: Card = {
      id: 'att',
      name: 'Atacante',
      type: 'ship',
      race: 'wuron',
      cost: 0,
      rarity: 'common',
      keywords: [],
      abilities: [],
      strength: 5,
      hp: 5,
    }
    let s = fresh({
      p2Race: 'zaqe',
      p1Deck: [attacker, ...deck(30)],
      p2Deck: [sumzhua, ...deck(30)],
    })
    s = apply(s, { type: 'END_PHASE' }).state
    s = apply(s, { type: 'PLAY_CARD', cardId: 'att' }).state
    s = advanceToPhase(s, 'p2', 'despliegue')
    s = apply(s, { type: 'PLAY_CARD', cardId: 'sumzhua' }).state
    const sumzhuaId = s.players.p2.fleet[0]?.instanceId as string
    s = advanceToPhase(s, 'p1', 'combate')
    const attackerId = s.players.p1.fleet[0]?.instanceId as string
    // Primera muerte → pozoAstral
    s = apply(s, {
      type: 'DECLARE_ATTACK',
      attackerShipId: attackerId,
      target: { kind: 'ship', ref: sumzhuaId },
    }).state
    expect(s.players.p2.pozoAstral.find((sh) => sh.instanceId === sumzhuaId)).toBeDefined()
    // Revival
    s = advanceToPhase(s, 'p2', 'despliegue')
    s = apply(s, { type: 'PAY_REFLUENCIA', shipId: sumzhuaId }).state
    const revived = s.players.p2.fleet.find((sh) => sh.instanceId === sumzhuaId)
    expect(revived?.revivedFromRefluencia).toBe(true)
    // Segunda muerte
    s = advanceToPhase(s, 'p1', 'combate')
    s = apply(s, {
      type: 'DECLARE_ATTACK',
      attackerShipId: attackerId,
      target: { kind: 'ship', ref: sumzhuaId },
    }).state
    // Va a disolucion, NO a pozoAstral.
    expect(s.players.p2.pozoAstral.find((sh) => sh.instanceId === sumzhuaId)).toBeUndefined()
    expect(s.players.p2.disolucion.find((sh) => sh.instanceId === sumzhuaId)).toBeDefined()
  })

  it('PAY_REFLUENCIA cuando la nave NO está en pozoAstral → ilegal', () => {
    let s = fresh({ p2Race: 'zaqe' })
    s = advanceToPhase(s, 'p2', 'despliegue')
    const before = s
    const r = apply(s, { type: 'PAY_REFLUENCIA', shipId: 'nonexistent' })
    expect(r.state).toBe(before)
  })

  it('damagedThisTurn flag se setea en daño y se resetea en TURN_START', () => {
    const ship: Card = {
      id: 'ship1',
      name: 'Ship 1',
      type: 'ship',
      race: 'wuron',
      cost: 0,
      rarity: 'common',
      keywords: [],
      abilities: [],
      strength: 1,
      hp: 5,
    }
    const attacker: Card = {
      id: 'att',
      name: 'Atacante',
      type: 'ship',
      race: 'tezhal',
      cost: 0,
      rarity: 'common',
      keywords: [],
      abilities: [],
      strength: 1,
      hp: 1,
    }
    let s = fresh({ p1Deck: [ship, ...deck(30)], p2Deck: [attacker, ...deck(30)] })
    s = apply(s, { type: 'END_PHASE' }).state
    s = apply(s, { type: 'PLAY_CARD', cardId: 'ship1' }).state
    const shipId = s.players.p1.fleet[0]?.instanceId as string
    s = advanceToPhase(s, 'p2', 'despliegue')
    s = apply(s, { type: 'PLAY_CARD', cardId: 'att' }).state
    const attackerId = s.players.p2.fleet[0]?.instanceId as string
    s = advanceToPhase(s, 'p2', 'combate')
    s = apply(s, {
      type: 'DECLARE_ATTACK',
      attackerShipId: attackerId,
      target: { kind: 'ship', ref: shipId },
    }).state
    const damaged = s.players.p1.fleet.find((sh) => sh.instanceId === shipId)
    expect(damaged?.damagedThisTurn).toBe(true)
    // Avanzar a TURN_START de p1 → debería resetear damagedThisTurn
    s = advanceToPhase(s, 'p1', 'recoleccion')
    const reset = s.players.p1.fleet.find((sh) => sh.instanceId === shipId)
    expect(reset?.damagedThisTurn).toBe(false)
  })
})
