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
})
