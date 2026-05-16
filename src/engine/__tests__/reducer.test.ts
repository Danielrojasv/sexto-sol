// reducer.test.ts v4.2 — flujo nuevo con seleccion_secreta + premonición oculta.

import { beforeEach, describe, expect, it } from 'vitest'
import type { Action } from '../actions'
import { createInitialState, type InitConfig } from '../initialState'
import { createReducer, type ReducerDeps } from '../reducer'
import type { GameState } from '../types'
import { mockCard, mockDeps } from './_helpers'

const cardAtq2 = mockCard({
  id: 'CARD-ATQ-2',
  categoria: 'Ataque',
  coste: 2,
  fuerzaBase: 3,
  penalizacionAcierto: 1,
})
const cardDef1 = mockCard({
  id: 'CARD-DEF-1',
  raza: 'Würon',
  categoria: 'Defensa',
  coste: 1,
  fuerzaBase: 2,
  penalizacionAcierto: 2,
})
const cardAtq1 = mockCard({
  id: 'CARD-ATQ-1',
  categoria: 'Ataque',
  coste: 1,
  fuerzaBase: 2,
  penalizacionAcierto: 0,
})

const ALL = [cardAtq1, cardAtq2, cardDef1]
const deckA = Array.from({ length: 20 }, () => cardAtq1.id)
const deckB = Array.from({ length: 20 }, () => cardDef1.id)
const deps: ReducerDeps = mockDeps(ALL)

function initState(overrides?: Partial<InitConfig>): GameState {
  let s = createInitialState({
    seed: 42,
    modo: 'vsIA',
    deckA: { raza: 'Tezhal', cardIds: deckA, heroId: 'HRO-TEZHAL' },
    deckB: { raza: 'Würon', cardIds: deckB, heroId: 'HRO-WURON' },
    planetIdsNebulosa: ['PLN-NEB-ATQ', 'PLN-NEB-DEF', 'PLN-NEB-RIT'],
    planetIdsEstrellas: ['PLN-EST-ATQ', 'PLN-EST-DEF', 'PLN-EST-RIT'],
    ...overrides,
  })
  const r = createReducer(deps)
  s = r(s, { type: 'KEEP_HAND', playerId: 'a' })
  s = r(s, { type: 'KEEP_HAND', playerId: 'b' })
  return s
}

describe('reducer — SELECT_PLANET', () => {
  let state: GameState
  let reduce: (s: GameState, a: Action) => GameState

  beforeEach(() => {
    state = initState()
    reduce = createReducer(deps)
  })

  it('asigna planet al jugador', () => {
    const next = reduce(state, { type: 'SELECT_PLANET', playerId: 'a', planetId: 'PLN-NEB-ATQ' })
    expect(next.players.a.planetElegidoActual).toBe('PLN-NEB-ATQ')
  })

  it('ambos eligen → avanza a robo', () => {
    let next = reduce(state, { type: 'SELECT_PLANET', playerId: 'a', planetId: 'PLN-NEB-ATQ' })
    next = reduce(next, { type: 'SELECT_PLANET', playerId: 'b', planetId: 'PLN-NEB-DEF' })
    expect(next.subPaso).toBe('robo')
  })
})

describe('reducer — DRAW_BOTH', () => {
  it('roba 1 a cada uno y avanza a seleccion_secreta', () => {
    const r = createReducer(deps)
    let s = initState()
    s = r(s, { type: 'SELECT_PLANET', playerId: 'a', planetId: 'PLN-NEB-ATQ' })
    s = r(s, { type: 'SELECT_PLANET', playerId: 'b', planetId: 'PLN-NEB-DEF' })
    s = r(s, { type: 'DRAW_BOTH' })
    expect(s.subPaso).toBe('seleccion_secreta')
    expect(s.players.a.mano.length).toBe(5)
    expect(s.players.b.mano.length).toBe(5)
  })
})

describe('reducer — PLAY_HIDDEN (con premonición)', () => {
  it('guarda carta + premonición ocultas', () => {
    const r = createReducer(deps)
    let s = initState()
    s = r(s, { type: 'SELECT_PLANET', playerId: 'a', planetId: 'PLN-NEB-ATQ' })
    s = r(s, { type: 'SELECT_PLANET', playerId: 'b', planetId: 'PLN-NEB-DEF' })
    s = r(s, { type: 'DRAW_BOTH' })
    const cardId = s.players.a.mano[0]!
    s = r(s, { type: 'PLAY_HIDDEN', playerId: 'a', cardId, premonicion: 'Defensa' })
    expect(s.accionesPendientes.a).toBe(cardId)
    expect(s.premoniciones.a).toBe('Defensa')
  })

  it('ambos juegan → avanza directo a revelar (NO premonicion_pendiente)', () => {
    const r = createReducer(deps)
    let s = initState()
    s = r(s, { type: 'SELECT_PLANET', playerId: 'a', planetId: 'PLN-NEB-ATQ' })
    s = r(s, { type: 'SELECT_PLANET', playerId: 'b', planetId: 'PLN-NEB-DEF' })
    s = r(s, { type: 'DRAW_BOTH' })
    s = r(s, {
      type: 'PLAY_HIDDEN',
      playerId: 'a',
      cardId: s.players.a.mano[0]!,
      premonicion: 'Defensa',
    })
    s = r(s, {
      type: 'PLAY_HIDDEN',
      playerId: 'b',
      cardId: s.players.b.mano[0]!,
      premonicion: 'Ataque',
    })
    expect(s.subPaso).toBe('revelar')
  })
})

describe('reducer — REVEAL flow', () => {
  it('aplica lectura rival + bonus planeta + suma a atributos', () => {
    const r = createReducer(deps)
    let s = initState()
    s = r(s, { type: 'SELECT_PLANET', playerId: 'a', planetId: 'PLN-NEB-ATQ' })
    s = r(s, { type: 'SELECT_PLANET', playerId: 'b', planetId: 'PLN-NEB-DEF' })
    s = r(s, { type: 'DRAW_BOTH' })
    // A juega cardAtq1 (Atq, base 2, pen 0) declarando premonición Defensa.
    // B juega cardDef1 (Def, base 2, pen 2) declarando premonición Ataque.
    s = r(s, {
      type: 'PLAY_HIDDEN',
      playerId: 'a',
      cardId: cardAtq1.id,
      premonicion: 'Defensa',
    })
    s = r(s, {
      type: 'PLAY_HIDDEN',
      playerId: 'b',
      cardId: cardDef1.id,
      premonicion: 'Ataque',
    })
    s = r(s, { type: 'REVEAL' })
    // cardAtq1 (A): base 2, B premonición Ataque, A categoría Ataque → B ACERTÓ → -0 (pen=0).
    // Bonus planeta PLN-NEB-ATQ + Atq → +1. Fuerza A = 2 + 0 + 1 = 3.
    expect(s.players.a.atributos.fuerza).toBe(3)
    // cardDef1 (B): base 2, A premonición Defensa, B categoría Defensa → A ACERTÓ → -2.
    // Bonus planeta PLN-NEB-DEF + Def → +1. Fuerza B = 2 - 2 + 1 = 1. Resguardo = 1.
    expect(s.players.b.atributos.resguardo).toBe(1)
    expect(s.subPaso).toBe('revisar_resolucion')
  })

  it('CONTINUE_TURN avanza al siguiente turno', () => {
    const r = createReducer(deps)
    let s = initState()
    s = r(s, { type: 'SELECT_PLANET', playerId: 'a', planetId: 'PLN-NEB-ATQ' })
    s = r(s, { type: 'SELECT_PLANET', playerId: 'b', planetId: 'PLN-NEB-DEF' })
    s = r(s, { type: 'DRAW_BOTH' })
    s = r(s, {
      type: 'PLAY_HIDDEN',
      playerId: 'a',
      cardId: cardAtq1.id,
      premonicion: 'Defensa',
    })
    s = r(s, {
      type: 'PLAY_HIDDEN',
      playerId: 'b',
      cardId: cardDef1.id,
      premonicion: 'Ataque',
    })
    s = r(s, { type: 'REVEAL' })
    expect(s.subPaso).toBe('revisar_resolucion')
    s = r(s, { type: 'CONTINUE_TURN' })
    expect(s.turno).toBe(2)
    expect(s.subPaso).toBe('robo')
  })
})

describe('reducer — historial de premoniciones', () => {
  it('al revelar, agrega entrada al historial', () => {
    const r = createReducer(deps)
    let s = initState()
    s = r(s, { type: 'SELECT_PLANET', playerId: 'a', planetId: 'PLN-NEB-ATQ' })
    s = r(s, { type: 'SELECT_PLANET', playerId: 'b', planetId: 'PLN-NEB-DEF' })
    s = r(s, { type: 'DRAW_BOTH' })
    s = r(s, {
      type: 'PLAY_HIDDEN',
      playerId: 'a',
      cardId: cardAtq1.id,
      premonicion: 'Defensa',
    })
    s = r(s, {
      type: 'PLAY_HIDDEN',
      playerId: 'b',
      cardId: cardDef1.id,
      premonicion: 'Ataque',
    })
    s = r(s, { type: 'REVEAL' })
    expect(s.historialPremoniciones).toHaveLength(1)
    expect(s.historialPremoniciones[0]).toMatchObject({
      turno: 1,
      tramo: 'nebulosa',
      a: 'Defensa',
      b: 'Ataque',
      cardCategoriaA: 'Ataque',
      cardCategoriaB: 'Defensa',
    })
  })
})

describe('reducer — END_GAME tally 2-de-3', () => {
  it('A gana 2-1', () => {
    const r = createReducer(deps)
    let s = initState()
    s = {
      ...s,
      players: {
        a: { ...s.players.a, atributos: { fuerza: 10, resguardo: 10, resonancia: 0 } },
        b: { ...s.players.b, atributos: { fuerza: 5, resguardo: 5, resonancia: 8 } },
      },
    }
    s = r(s, { type: 'END_GAME' })
    expect(s.ganador).toBe('a')
    expect(s.finalTally).toEqual({ a: 2, b: 1 })
  })

  it('Tiebreaker por suma total si empate 2-de-3', () => {
    const r = createReducer(deps)
    let s = initState()
    s = {
      ...s,
      players: {
        a: { ...s.players.a, atributos: { fuerza: 10, resguardo: 0, resonancia: 0 } },
        b: { ...s.players.b, atributos: { fuerza: 0, resguardo: 10, resonancia: 0 } },
      },
    }
    s = r(s, { type: 'END_GAME' })
    // Cada uno gana uno + 1 empate en Resonancia → suma A=10 vs B=10 → empate técnico.
    expect(s.ganador).toBe('empate')
  })
})
