import { describe, expect, it } from 'vitest'
import { createInitialState } from '../initialState'
import { createReducer } from '../reducer'
import type { GameState } from '../types'
import { mockCard, mockDeps } from './_helpers'

const cardAtq2 = mockCard({ id: 'CARD-ATQ-2', categoria: 'Ataque', coste: 2, fuerzaBase: 4, condicionales: [{ tipo: 'premonicion_propia', valor: 'Ataque', fuerzaDelta: 0 }] })
const cardDef1 = mockCard({ id: 'CARD-DEF-1', raza: 'Würon', categoria: 'Defensa', coste: 1, fuerzaBase: 1, condicionales: [{ tipo: 'premonicion_propia', valor: 'Defensa', fuerzaDelta: 0 }] })

const deps = mockDeps([cardAtq2, cardDef1])

function bootstrap() {
  const reducer = createReducer(deps)
  let s = createInitialState({
    seed: 42,
    modo: 'vsIA',
    deckA: { raza: 'Tezhal', cardIds: Array.from({ length: 20 }, () => 'CARD-ATQ-2'), heroId: 'HRO-TEZHAL' },
    deckB: { raza: 'Würon', cardIds: Array.from({ length: 20 }, () => 'CARD-DEF-1'), heroId: 'HRO-WURON' },
    planetIdsNebulosa: ['PLN-NEB-ATQ', 'PLN-NEB-DEF', 'PLN-NEB-RIT'],
    planetIdsEstrellas: ['PLN-EST-ATQ', 'PLN-EST-DEF', 'PLN-EST-RIT'],
  })
  // Avanzar a turno 2 para energía 2.
  s = { ...s, turno: 2, energiaActual: 2 }
  return { reducer, s }
}

describe('Eclipse', () => {
  it('aplica ×2 al atributo correspondiente del invocador', () => {
    const { reducer, s: initS } = bootstrap()
    let s: GameState = {
      ...initS,
      tramo: 'sexto_sol',
      turno: 5,
      energiaActual: 5,
      subPaso: 'accion_pendiente',
    }
    s = reducer(s, { type: 'INVOKE_ECLIPSE', playerId: 'a' })
    expect(s.eclipseInvocado).toBe(true)
    const cardIdA = s.players.a.mano[0]!
    const cardIdB = s.players.b.mano[0]!
    s = reducer(s, { type: 'PLAY_HIDDEN', playerId: 'a', cardId: cardIdA })
    s = reducer(s, { type: 'PLAY_HIDDEN', playerId: 'b', cardId: cardIdB })
    s = reducer(s, { type: 'DECLARE_PREMONICION', playerId: 'a', categoria: 'Ataque' })
    s = reducer(s, { type: 'DECLARE_PREMONICION', playerId: 'b', categoria: 'Defensa' })
    s = reducer(s, { type: 'REVEAL' })
    // cardAtq2 base 4, A=Atq → prem_propia (delta 0) aplica, sin cambio. Sin bonus planeta (sexto_sol).
    // Eclipse ×2 → 8. Suma a fuerza.
    expect(s.players.a.atributos.fuerza).toBe(8)
    // cardDef1 base 1, B=Def prem_propia (delta 0). Sin bonus. Sin Eclipse para B. → 1.
    expect(s.players.b.atributos.resguardo).toBe(1)
    // Partida termina post-Eclipse.
    expect(s.subPaso).toBe('terminado')
  })

  it('Eclipse solo se puede invocar 1 vez', () => {
    const { reducer, s: initS } = bootstrap()
    let s: GameState = {
      ...initS,
      tramo: 'sexto_sol',
      turno: 5,
      energiaActual: 5,
      subPaso: 'accion_pendiente',
    }
    s = reducer(s, { type: 'INVOKE_ECLIPSE', playerId: 'a' })
    expect(() => reducer(s, { type: 'INVOKE_ECLIPSE', playerId: 'b' })).toThrow(/ya invocado/)
  })

  it('Eclipse no se puede invocar fuera de Sexto Sol', () => {
    const { reducer, s } = bootstrap()
    // s está en nebulosa T2 con accion_pendiente — armemos sub-paso correcto.
    const s2: GameState = {
      ...s,
      subPaso: 'accion_pendiente',
      tramo: 'nebulosa',
    }
    expect(() => reducer(s2, { type: 'INVOKE_ECLIPSE', playerId: 'a' })).toThrow(/Sexto Sol/)
  })
})

describe('Bonus de planeta', () => {
  it('aplica +1 a carta de categoría correcta en Nebulosa', () => {
    const reducer = createReducer(deps)
    let s = createInitialState({
      seed: 42,
      modo: 'vsIA',
      deckA: { raza: 'Tezhal', cardIds: Array.from({ length: 20 }, () => 'CARD-ATQ-2'), heroId: 'HRO-TEZHAL' },
      deckB: { raza: 'Würon', cardIds: Array.from({ length: 20 }, () => 'CARD-DEF-1'), heroId: 'HRO-WURON' },
      planetIdsNebulosa: ['PLN-NEB-ATQ', 'PLN-NEB-DEF', 'PLN-NEB-RIT'],
      planetIdsEstrellas: ['PLN-EST-ATQ', 'PLN-EST-DEF', 'PLN-EST-RIT'],
    })
    s = { ...s, turno: 2, energiaActual: 2 }
    // A elige planeta-Atq.
    s = reducer(s, { type: 'SELECT_PLANET', playerId: 'a', planetId: 'PLN-NEB-ATQ' })
    s = reducer(s, { type: 'SELECT_PLANET', playerId: 'b', planetId: 'PLN-NEB-DEF' })
    s = reducer(s, { type: 'DRAW_BOTH' })
    s = reducer(s, { type: 'PLAY_HIDDEN', playerId: 'a', cardId: 'CARD-ATQ-2' })
    s = reducer(s, { type: 'PLAY_HIDDEN', playerId: 'b', cardId: 'CARD-DEF-1' })
    s = reducer(s, { type: 'DECLARE_PREMONICION', playerId: 'a', categoria: 'Ataque' })
    s = reducer(s, { type: 'DECLARE_PREMONICION', playerId: 'b', categoria: 'Defensa' })
    s = reducer(s, { type: 'REVEAL' })
    // cardAtq2 base 4 + bonus PLN-NEB-ATQ +1 = 5. Suma a fuerza.
    expect(s.players.a.atributos.fuerza).toBe(5)
    // cardDef1 base 1 + bonus PLN-NEB-DEF +1 = 2. Suma a resguardo.
    expect(s.players.b.atributos.resguardo).toBe(2)
  })
})

describe('Habilidad pasiva Tezhal Despertado', () => {
  it('+1 fuerza adicional a cartas Ataque cuando héroe Despertado', () => {
    const reducer = createReducer(deps)
    let s = createInitialState({
      seed: 42,
      modo: 'vsIA',
      deckA: { raza: 'Tezhal', cardIds: Array.from({ length: 20 }, () => 'CARD-ATQ-2'), heroId: 'HRO-TEZHAL' },
      deckB: { raza: 'Würon', cardIds: Array.from({ length: 20 }, () => 'CARD-DEF-1'), heroId: 'HRO-WURON' },
      planetIdsNebulosa: ['PLN-NEB-ATQ', 'PLN-NEB-DEF', 'PLN-NEB-RIT'],
      planetIdsEstrellas: ['PLN-EST-ATQ', 'PLN-EST-DEF', 'PLN-EST-RIT'],
    })
    // Setup: A Despertado, en sexto_sol turno 5 (sin bonus planeta).
    s = {
      ...s,
      tramo: 'sexto_sol',
      turno: 5,
      energiaActual: 5,
      subPaso: 'accion_pendiente',
      players: {
        ...s.players,
        a: { ...s.players.a, heroEstado: 'despertado' },
      },
    }
    const cardIdA = s.players.a.mano[0]!
    const cardIdB = s.players.b.mano[0]!
    s = reducer(s, { type: 'PLAY_HIDDEN', playerId: 'a', cardId: cardIdA })
    s = reducer(s, { type: 'PLAY_HIDDEN', playerId: 'b', cardId: cardIdB })
    s = reducer(s, { type: 'DECLARE_PREMONICION', playerId: 'a', categoria: 'Ataque' })
    s = reducer(s, { type: 'DECLARE_PREMONICION', playerId: 'b', categoria: 'Defensa' })
    s = reducer(s, { type: 'REVEAL' })
    // cardAtq2 base 4 + Tezhal Despertado +1 (carta Atq) = 5. Sin bonus planeta (sexto_sol).
    expect(s.players.a.atributos.fuerza).toBe(5)
  })
})
