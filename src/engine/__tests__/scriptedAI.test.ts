// Tests de scriptedAI — IA scripted determinista para vs IA mode.
//
// Verifica que decideAction(state, player) siempre devuelve una acción
// legal según el state actual, y que las heurísticas básicas funcionan
// (lethal, bastion priority, despliegue maximize energy).

import { describe, expect, it } from 'vitest'
import { createInitialState, type NewGameSetup } from '../initialState'
import { apply } from '../reducer'
import { decideAction } from '../ai/scriptedAI'
import type { Card, GameState } from '../types'

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

describe('scriptedAI — decideAction', () => {
  it('en recoleccion siempre retorna END_PHASE', () => {
    const s = fresh()
    expect(s.phase).toBe('recoleccion')
    const action = decideAction(s, 'p1')
    expect(action.type).toBe('END_PHASE')
  })

  it('en despliegue retorna PLAY_CARD si hay cartas jugables', () => {
    const cheap: Card = {
      id: 'cheap',
      name: 'Cheap',
      type: 'ship',
      race: 'wuron',
      cost: 0,
      rarity: 'common',
      keywords: [],
      abilities: [],
      strength: 1,
      hp: 1,
    }
    let s = fresh({ p1Deck: [cheap, ...deck(30)] })
    s = apply(s, { type: 'END_PHASE' }).state
    const action = decideAction(s, 'p1')
    expect(action.type).toBe('PLAY_CARD')
    if (action.type === 'PLAY_CARD') {
      expect(action.cardId).toBe('cheap')
    }
  })

  it('en despliegue retorna END_PHASE si no hay cartas jugables', () => {
    // Mazo con cartas costo > energía (energía base es 1).
    const expensive: Card = {
      id: 'exp',
      name: 'Expensive',
      type: 'ship',
      race: 'wuron',
      cost: 99,
      rarity: 'common',
      keywords: [],
      abilities: [],
      strength: 1,
      hp: 1,
    }
    let s = fresh({ p1Deck: [expensive, ...deck(30, { cost: 99 })] })
    s = apply(s, { type: 'END_PHASE' }).state
    const action = decideAction(s, 'p1')
    expect(action.type).toBe('END_PHASE')
  })

  it('en combate retorna DECLARE_ATTACK si hay naves atacantes', () => {
    // Setup: p1 con nave, p2 con nave en combate.
    let s = fresh()
    s = apply(s, { type: 'END_PHASE' }).state // p1 despliegue
    s = apply(s, { type: 'PLAY_CARD', cardId: 'c0' }).state
    // Avanzar a turno p2 despliegue y jugar carta
    while (!(s.activePlayer === 'p2' && s.phase === 'despliegue')) {
      s = apply(s, { type: 'END_PHASE' }).state
    }
    s = apply(s, { type: 'PLAY_CARD', cardId: 'c0' }).state
    // Avanzar a combate p1
    while (!(s.activePlayer === 'p1' && s.phase === 'combate')) {
      s = apply(s, { type: 'END_PHASE' }).state
    }
    const action = decideAction(s, 'p1')
    expect(action.type).toBe('DECLARE_ATTACK')
  })

  it('en combate prioriza Bastión cuando defensor lo tiene', () => {
    const att: Card = {
      id: 'att',
      name: 'Atacante',
      type: 'ship',
      race: 'wuron',
      cost: 0,
      rarity: 'common',
      keywords: [],
      abilities: [],
      strength: 3,
      hp: 5,
    }
    const bastion: Card = {
      id: 'bas',
      name: 'Bastión',
      type: 'ship',
      race: 'tezhal',
      cost: 0,
      rarity: 'common',
      keywords: ['bastion'],
      abilities: [],
      strength: 1,
      hp: 3,
    }
    let s = fresh({ p1Deck: [att, ...deck(30)], p2Deck: [bastion, ...deck(30)] })
    s = apply(s, { type: 'END_PHASE' }).state
    s = apply(s, { type: 'PLAY_CARD', cardId: 'att' }).state
    while (!(s.activePlayer === 'p2' && s.phase === 'despliegue')) {
      s = apply(s, { type: 'END_PHASE' }).state
    }
    s = apply(s, { type: 'PLAY_CARD', cardId: 'bas' }).state
    while (!(s.activePlayer === 'p1' && s.phase === 'combate')) {
      s = apply(s, { type: 'END_PHASE' }).state
    }
    const bastionId = s.players.p2.fleet[0]?.instanceId
    const action = decideAction(s, 'p1')
    expect(action.type).toBe('DECLARE_ATTACK')
    if (action.type === 'DECLARE_ATTACK') {
      expect(action.target.kind).toBe('ship')
      expect(action.target.ref).toBe(bastionId)
    }
  })

  it('si no es turno del player retorna END_PHASE', () => {
    const s = fresh()
    expect(s.activePlayer).toBe('p1')
    const action = decideAction(s, 'p2')
    expect(action.type).toBe('END_PHASE')
  })

  it('con partida terminada retorna END_PHASE', () => {
    let s = fresh()
    s = apply(s, { type: 'CONCEDE', player: 'p1' }).state
    expect(s.outcome.kind).toBe('win')
    const action = decideAction(s, 'p1')
    expect(action.type).toBe('END_PHASE')
  })

  it('decisión es determinista: mismo state → misma acción', () => {
    const cheap: Card = {
      id: 'cheap',
      name: 'Cheap',
      type: 'ship',
      race: 'wuron',
      cost: 0,
      rarity: 'common',
      keywords: [],
      abilities: [],
      strength: 1,
      hp: 1,
    }
    let s = fresh({ p1Deck: [cheap, ...deck(30)] })
    s = apply(s, { type: 'END_PHASE' }).state
    const a1 = decideAction(s, 'p1')
    const a2 = decideAction(s, 'p1')
    expect(a1).toEqual(a2)
  })

  it('en despliegue prioriza Ignición si hay Tezhal aliada en fleet', () => {
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
    const tezhalAlly: Card = {
      id: 'tezhal_ally',
      name: 'Aliada Tezhal',
      type: 'ship',
      race: 'tezhal',
      cost: 0,
      rarity: 'common',
      keywords: [],
      abilities: [],
      strength: 1,
      hp: 1,
    }
    let s = fresh({ p1Race: 'tezhal', p1Deck: [plumaje, tezhalAlly, ...deck(30)] })
    s = apply(s, { type: 'END_PHASE' }).state
    s = apply(s, { type: 'PLAY_CARD', cardId: 'tezhal_ally' }).state
    const action = decideAction(s, 'p1')
    expect(action.type).toBe('ACTIVATE_IGNICION')
    if (action.type === 'ACTIVATE_IGNICION') {
      expect(action.cardId).toBe('plumaje')
    }
  })

  it('en despliegue prioriza revival via PAY_REFLUENCIA si hay ship en pozoAstral', () => {
    let s = fresh({ p2Race: 'zaqe' })
    while (!(s.activePlayer === 'p2' && s.phase === 'despliegue')) {
      s = apply(s, { type: 'END_PHASE' }).state
    }
    // Inyectar ship en pozoAstral con costo ≤ energía.
    const card: Card = {
      id: 'sumzhua',
      name: 'Sumzhua',
      type: 'ship',
      race: 'zaqe',
      cost: 0,
      rarity: 'common',
      keywords: ['refluencia'],
      abilities: [],
      strength: 1,
      hp: 1,
    }
    s = {
      ...s,
      cardRegistry: { ...s.cardRegistry, sumzhua: card },
      players: {
        ...s.players,
        p2: {
          ...s.players.p2,
          pozoAstral: [
            {
              instanceId: 'sh1',
              cardId: 'sumzhua',
              controller: 'p2' as const,
              strength: 1,
              maxHp: 1,
              hp: 1,
              damageTaken: 0,
              keywords: ['refluencia'],
            },
          ],
          energy: 5,
        },
      },
    }
    const action = decideAction(s, 'p2')
    expect(action.type).toBe('PAY_REFLUENCIA')
    if (action.type === 'PAY_REFLUENCIA') {
      expect(action.shipId).toBe('sh1')
    }
  })

  it('en combate Edad III ataca homeworld si lethal posible', () => {
    const big: Card = {
      id: 'big',
      name: 'Big',
      type: 'ship',
      race: 'wuron',
      cost: 0,
      rarity: 'common',
      keywords: [],
      abilities: [],
      strength: 25,
      hp: 5,
    }
    let s = fresh({ p1Deck: [big, ...deck(30)] })
    s = apply(s, { type: 'END_PHASE' }).state
    s = apply(s, { type: 'PLAY_CARD', cardId: 'big' }).state
    while (!(s.activePlayer === 'p1' && s.phase === 'combate')) {
      s = apply(s, { type: 'END_PHASE' }).state
    }
    // Forzar Edad III
    s = { ...s, age: 3 }
    const action = decideAction(s, 'p1')
    expect(action.type).toBe('DECLARE_ATTACK')
    if (action.type === 'DECLARE_ATTACK') {
      // 25 fuerza ≥ 20 HP → lethal → ataca homeworld
      expect(action.target.kind).toBe('homeworld')
    }
  })

  it('en combate sin Bastión enemigo ataca la amenaza más grande', () => {
    const att: Card = {
      id: 'att',
      name: 'Atacante',
      type: 'ship',
      race: 'wuron',
      cost: 0,
      rarity: 'common',
      keywords: [],
      abilities: [],
      strength: 2,
      hp: 2,
    }
    const weakDef: Card = {
      id: 'weak',
      name: 'Débil',
      type: 'ship',
      race: 'tezhal',
      cost: 0,
      rarity: 'common',
      keywords: [],
      abilities: [],
      strength: 1,
      hp: 1,
    }
    const strongDef: Card = { ...weakDef, id: 'strong', name: 'Fuerte', strength: 5, hp: 5 }
    let s = fresh({
      p1Deck: [att, ...deck(30)],
      p2Deck: [weakDef, strongDef, ...deck(30)],
    })
    s = apply(s, { type: 'END_PHASE' }).state
    s = apply(s, { type: 'PLAY_CARD', cardId: 'att' }).state
    while (!(s.activePlayer === 'p2' && s.phase === 'despliegue')) {
      s = apply(s, { type: 'END_PHASE' }).state
    }
    s = apply(s, { type: 'PLAY_CARD', cardId: 'weak' }).state
    s = apply(s, { type: 'PLAY_CARD', cardId: 'strong' }).state
    while (!(s.activePlayer === 'p1' && s.phase === 'combate')) {
      s = apply(s, { type: 'END_PHASE' }).state
    }
    const strongId = s.players.p2.fleet.find((sh) => sh.cardId === 'strong')?.instanceId
    const action = decideAction(s, 'p1')
    expect(action.type).toBe('DECLARE_ATTACK')
    if (action.type === 'DECLARE_ATTACK') {
      expect(action.target.kind).toBe('ship')
      expect(action.target.ref).toBe(strongId)
    }
  })

  it('en combate sin fleet enemigo + Edad < 3 retorna END_PHASE', () => {
    const att: Card = {
      id: 'att',
      name: 'Atacante',
      type: 'ship',
      race: 'wuron',
      cost: 0,
      rarity: 'common',
      keywords: [],
      abilities: [],
      strength: 3,
      hp: 5,
    }
    let s = fresh({ p1Deck: [att, ...deck(30)] })
    s = apply(s, { type: 'END_PHASE' }).state
    s = apply(s, { type: 'PLAY_CARD', cardId: 'att' }).state
    while (!(s.activePlayer === 'p1' && s.phase === 'combate')) {
      s = apply(s, { type: 'END_PHASE' }).state
    }
    // p2 sin fleet, Edad I → no se puede atacar homeworld
    const action = decideAction(s, 'p1')
    expect(action.type).toBe('END_PHASE')
  })

  it('en eclipse/vigilia/regroup retorna END_PHASE', () => {
    let s = fresh()
    s = { ...s, phase: 'regroup' as const }
    expect(decideAction(s, 'p1').type).toBe('END_PHASE')
    s = { ...s, phase: 'vigilia' as const }
    expect(decideAction(s, 'p1').type).toBe('END_PHASE')
  })

  it('en combate Edad III sin fleet enemigo ataca homeworld', () => {
    const att: Card = {
      id: 'att',
      name: 'Atacante',
      type: 'ship',
      race: 'wuron',
      cost: 0,
      rarity: 'common',
      keywords: [],
      abilities: [],
      strength: 3,
      hp: 5,
    }
    let s = fresh({ p1Deck: [att, ...deck(30)] })
    s = apply(s, { type: 'END_PHASE' }).state
    s = apply(s, { type: 'PLAY_CARD', cardId: 'att' }).state
    while (!(s.activePlayer === 'p1' && s.phase === 'combate')) {
      s = apply(s, { type: 'END_PHASE' }).state
    }
    s = { ...s, age: 3 }
    const action = decideAction(s, 'p1')
    expect(action.type).toBe('DECLARE_ATTACK')
    if (action.type === 'DECLARE_ATTACK') {
      expect(action.target.kind).toBe('homeworld')
    }
  })

  it('despliegue prefiere cartas sinérgicas (mismo race que fleet)', () => {
    const wuronCheap: Card = {
      id: 'wuron_cheap',
      name: 'Würon barata',
      type: 'ship',
      race: 'wuron',
      cost: 0,
      rarity: 'common',
      keywords: [],
      abilities: [],
      strength: 1,
      hp: 1,
    }
    const tezhalCheap: Card = {
      ...wuronCheap,
      id: 'tezhal_cheap',
      name: 'Tezhal barata',
      race: 'tezhal',
    }
    let s = fresh({ p1Race: 'wuron', p1Deck: [wuronCheap, tezhalCheap, ...deck(30)] })
    s = apply(s, { type: 'END_PHASE' }).state
    s = apply(s, { type: 'PLAY_CARD', cardId: 'wuron_cheap' }).state
    // Ahora hay 1 Würon en fleet. Próxima carta debería ser Würon.
    // Avanzar a próximo despliegue de p1.
    while (!(s.activePlayer === 'p1' && s.phase === 'despliegue')) {
      s = apply(s, { type: 'END_PHASE' }).state
    }
    // Agregar tezhal a hand manualmente para test (ambas baratas, ambas cost 0).
    const tezhalCard: Card = { ...tezhalCheap, id: 'tezhal_in_hand' }
    s = {
      ...s,
      cardRegistry: { ...s.cardRegistry, tezhal_in_hand: tezhalCard, wuron_cheap: wuronCheap },
      players: {
        ...s.players,
        p1: {
          ...s.players.p1,
          hand: [wuronCheap, tezhalCard],
        },
      },
    }
    const action = decideAction(s, 'p1')
    expect(action.type).toBe('PLAY_CARD')
    if (action.type === 'PLAY_CARD') {
      // Debe elegir la Würon por sinergia (fleet ya tiene Würon).
      expect(action.cardId).toBe('wuron_cheap')
    }
  })
})

describe('scriptedAI — advanceRngForAI', () => {
  it('avanza el RNG del state sin cambiar otros campos', async () => {
    const { advanceRngForAI } = await import('../ai/scriptedAI')
    const s = fresh()
    const next = advanceRngForAI(s)
    expect(next.rng).not.toEqual(s.rng)
    expect(next.seed).toBe(s.seed)
    expect(next.players).toBe(s.players)
  })
})
