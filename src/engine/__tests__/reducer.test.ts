import { beforeEach, describe, expect, it } from 'vitest'
import type { Action } from '../actions'
import { createInitialState, type InitConfig } from '../initialState'
import { createReducer, type ReducerDeps } from '../reducer'
import type { GameState } from '../types'
import { mockCard, mockDeps } from './_helpers'

const cardAtq2 = mockCard({ id: 'CARD-ATQ-2', categoria: 'Ataque', coste: 2, fuerzaBase: 3, condicionales: [{ tipo: 'premonicion_propia', valor: 'Ataque', fuerzaDelta: 2 }] })
const cardDef2 = mockCard({ id: 'CARD-DEF-2', raza: 'Würon', categoria: 'Defensa', coste: 2, fuerzaBase: 2, condicionales: [{ tipo: 'premonicion_propia', valor: 'Defensa', fuerzaDelta: 1 }] })
const cardAtq1 = mockCard({ id: 'CARD-ATQ-1', categoria: 'Ataque', coste: 1, fuerzaBase: 2, condicionales: [{ tipo: 'premonicion_propia', valor: 'Ataque', fuerzaDelta: 1 }] })
const cardDef1 = mockCard({ id: 'CARD-DEF-1', raza: 'Würon', categoria: 'Defensa', coste: 1, fuerzaBase: 1, condicionales: [{ tipo: 'premonicion_propia', valor: 'Defensa', fuerzaDelta: 1 }] })
// Card que anula 2 fuerza enemiga al revelar (oponente jugó Ataque).
const cardAnula = mockCard({ id: 'CARD-ANULA', raza: 'Würon', categoria: 'Defensa', coste: 2, fuerzaBase: 1, condicionales: [{ tipo: 'premonicion_oponente', valor: 'Ataque', sideEffect: { tipo: 'anula', target: 'oponente', valor: 2 } }] })

const ALL_CARDS = [cardAtq1, cardAtq2, cardDef1, cardDef2, cardAnula]

const deckA = Array.from({ length: 20 }, () => cardAtq1.id) // todos Atq coste 1
const deckB = Array.from({ length: 20 }, () => cardDef1.id) // todos Def coste 1
const deps: ReducerDeps = mockDeps(ALL_CARDS)

function initState(overrides?: Partial<InitConfig>): GameState {
  return createInitialState({
    seed: 42,
    modo: 'vsIA',
    deckA: { raza: 'Tezhal', cardIds: deckA, heroId: 'HRO-TEZHAL' },
    deckB: { raza: 'Würon', cardIds: deckB, heroId: 'HRO-WURON' },
    planetIdsNebulosa: ['PLN-NEB-ATQ', 'PLN-NEB-DEF', 'PLN-NEB-RIT'],
    planetIdsEstrellas: ['PLN-EST-ATQ', 'PLN-EST-DEF', 'PLN-EST-RIT'],
    ...overrides,
  })
}

describe('reducer — SELECT_PLANET', () => {
  let state: GameState
  let reduce: (s: GameState, a: Action) => GameState

  beforeEach(() => {
    state = initState()
    reduce = createReducer(deps)
  })

  it('asigna planetElegido al player', () => {
    const next = reduce(state, { type: 'SELECT_PLANET', playerId: 'a', planetId: 'PLN-NEB-ATQ' })
    expect(next.players.a.planetElegidoActual).toBe('PLN-NEB-ATQ')
    expect(next.players.b.planetElegidoActual).toBeUndefined()
  })

  it('cuando ambos eligen, avanza a sub-paso robo', () => {
    let next = reduce(state, { type: 'SELECT_PLANET', playerId: 'a', planetId: 'PLN-NEB-ATQ' })
    expect(next.subPaso).toBe('eleccion_planeta')
    next = reduce(next, { type: 'SELECT_PLANET', playerId: 'b', planetId: 'PLN-NEB-DEF' })
    expect(next.subPaso).toBe('robo')
  })

  it('rechaza planeta de tramo equivocado', () => {
    expect(() =>
      reduce(state, { type: 'SELECT_PLANET', playerId: 'a', planetId: 'PLN-EST-ATQ' }),
    ).toThrow(/pool del tramo/)
  })

  it('rechaza si el player ya eligió', () => {
    const next = reduce(state, { type: 'SELECT_PLANET', playerId: 'a', planetId: 'PLN-NEB-ATQ' })
    expect(() =>
      reduce(next, { type: 'SELECT_PLANET', playerId: 'a', planetId: 'PLN-NEB-DEF' }),
    ).toThrow(/ya eligió/)
  })
})

describe('reducer — DRAW_BOTH', () => {
  it('roba 1 carta a cada jugador y avanza a accion_pendiente', () => {
    const reduce = createReducer(deps)
    let s = initState()
    s = reduce(s, { type: 'SELECT_PLANET', playerId: 'a', planetId: 'PLN-NEB-ATQ' })
    s = reduce(s, { type: 'SELECT_PLANET', playerId: 'b', planetId: 'PLN-NEB-DEF' })
    expect(s.subPaso).toBe('robo')
    const handsBeforeA = s.players.a.mano.length
    const handsBeforeB = s.players.b.mano.length
    s = reduce(s, { type: 'DRAW_BOTH' })
    expect(s.subPaso).toBe('accion_pendiente')
    expect(s.players.a.mano.length).toBe(handsBeforeA + 1)
    expect(s.players.b.mano.length).toBe(handsBeforeB + 1)
  })
})

describe('reducer — PLAY_HIDDEN', () => {
  it('mueve carta de mano a accionesPendientes, paga coste', () => {
    const reduce = createReducer(deps)
    let s = initState()
    s = reduce(s, { type: 'SELECT_PLANET', playerId: 'a', planetId: 'PLN-NEB-ATQ' })
    s = reduce(s, { type: 'SELECT_PLANET', playerId: 'b', planetId: 'PLN-NEB-DEF' })
    s = reduce(s, { type: 'DRAW_BOTH' })
    const handBefore = [...s.players.a.mano]
    const cardId = handBefore[0]!
    s = reduce(s, { type: 'PLAY_HIDDEN', playerId: 'a', cardId })
    expect(s.players.a.mano).not.toContain(cardId)
    expect(s.accionesPendientes.a).toBe(cardId)
  })

  it('rechaza si coste excede energía', () => {
    const expensiveCard = mockCard({ id: 'CARD-EXPENSIVE', coste: 5, fuerzaBase: 5 })
    const depsX = mockDeps([...ALL_CARDS, expensiveCard])
    const reduceX = createReducer(depsX)
    let s = initState({
      deckA: { raza: 'Tezhal', cardIds: Array.from({ length: 20 }, () => expensiveCard.id), heroId: 'HRO-TEZHAL' },
    })
    s = reduceX(s, { type: 'SELECT_PLANET', playerId: 'a', planetId: 'PLN-NEB-ATQ' })
    s = reduceX(s, { type: 'SELECT_PLANET', playerId: 'b', planetId: 'PLN-NEB-DEF' })
    s = reduceX(s, { type: 'DRAW_BOTH' })
    expect(() =>
      reduceX(s, { type: 'PLAY_HIDDEN', playerId: 'a', cardId: expensiveCard.id }),
    ).toThrow(/cuesta 5/)
  })
})

describe('reducer — REVEAL flow', () => {
  it('suma fuerza al atributo correcto', () => {
    const reduce = createReducer(deps)
    let s = initState()
    s = reduce(s, { type: 'SELECT_PLANET', playerId: 'a', planetId: 'PLN-NEB-ATQ' })
    s = reduce(s, { type: 'SELECT_PLANET', playerId: 'b', planetId: 'PLN-NEB-DEF' })
    s = reduce(s, { type: 'DRAW_BOTH' })
    const cardIdA = s.players.a.mano[0]! // siempre cardAtq1
    const cardIdB = s.players.b.mano[0]! // siempre cardDef1
    s = reduce(s, { type: 'PLAY_HIDDEN', playerId: 'a', cardId: cardIdA })
    s = reduce(s, { type: 'PLAY_HIDDEN', playerId: 'b', cardId: cardIdB })
    s = reduce(s, { type: 'DECLARE_PREMONICION', playerId: 'a', categoria: 'Defensa' })
    s = reduce(s, { type: 'DECLARE_PREMONICION', playerId: 'b', categoria: 'Ataque' })
    expect(s.subPaso).toBe('revelar')
    s = reduce(s, { type: 'REVEAL' })
    // cardAtq1: base 2, A=Def → no aplica prem_propia. Bonus planeta PLN-NEB-ATQ (Atq) coincide con Atq → +1. Fuerza 3.
    expect(s.players.a.atributos.fuerza).toBe(3)
    // cardDef1: base 1, B=Atq → no aplica prem_propia. Bonus PLN-NEB-DEF coincide con Def → +1. Fuerza 2.
    expect(s.players.b.atributos.resguardo).toBe(2)
    // Turno avanza a 2.
    expect(s.turno).toBe(2)
    expect(s.subPaso).toBe('robo')
  })

  it('aplica anulación cruzada: A anula 2 a B', () => {
    // Mazo A: cardAtq2 (base 3, condicional +2 si A=Atq). Mazo B: cardAnula (base 1, anula 2 si A=Atq).
    const deckA2 = Array.from({ length: 20 }, () => cardAtq2.id)
    const deckB2 = Array.from({ length: 20 }, () => cardAnula.id)
    const reduce = createReducer(deps)
    let s = initState({
      deckA: { raza: 'Tezhal', cardIds: deckA2, heroId: 'HRO-TEZHAL' },
      deckB: { raza: 'Würon', cardIds: deckB2, heroId: 'HRO-WURON' },
    })
    // Avanzamos a turno 2 manualmente para tener energía suficiente.
    s = { ...s, turno: 2, energiaActual: 2 }
    s = reduce(s, { type: 'SELECT_PLANET', playerId: 'a', planetId: 'PLN-NEB-ATQ' })
    s = reduce(s, { type: 'SELECT_PLANET', playerId: 'b', planetId: 'PLN-NEB-DEF' })
    s = reduce(s, { type: 'DRAW_BOTH' })
    s = reduce(s, { type: 'PLAY_HIDDEN', playerId: 'a', cardId: cardAtq2.id })
    s = reduce(s, { type: 'PLAY_HIDDEN', playerId: 'b', cardId: cardAnula.id })
    s = reduce(s, { type: 'DECLARE_PREMONICION', playerId: 'a', categoria: 'Ataque' })
    s = reduce(s, { type: 'DECLARE_PREMONICION', playerId: 'b', categoria: 'Ataque' })
    s = reduce(s, { type: 'REVEAL' })
    // cardAtq2 fuerza inicial = 3 + 2 (prem_propia Atq, A=Atq) + 1 (bonus PLN-NEB-ATQ) = 6.
    // cardAnula: clause prem_oponente=Ataque, A=Atq → APLICA, sideEffect anula 2 al oponente.
    // Anulación cruzada: B le quita 2 a A → A fuerza final 4.
    // No hay anulación de A a B (cardAtq2 no tiene clause anula).
    expect(s.players.a.atributos.fuerza).toBe(4)
    // cardAnula base 1 + 0 (prem_propia Def — B declaró Atq → no aplica) + 1 (bonus PLN-NEB-DEF=Def) = 2.
    // No es anulado (A no jugó anula).
    expect(s.players.b.atributos.resguardo).toBe(2)
  })
})

describe('reducer — CLOSE_TRAMO', () => {
  it('avanza héroe del jugador que ganó su atributo correspondiente', () => {
    const reduce = createReducer(deps)
    let s = initState()
    // Forzamos atributos para test: A va a planeta-Atq con Fuerza 10, B planeta-Def con Resguardo 5.
    s = {
      ...s,
      tramo: 'nebulosa',
      turno: 2,
      subPaso: 'cierre_tramo',
      players: {
        a: { ...s.players.a, atributos: { fuerza: 10, resguardo: 0, resonancia: 0 }, planetElegidoActual: 'PLN-NEB-ATQ' },
        b: { ...s.players.b, atributos: { fuerza: 0, resguardo: 5, resonancia: 0 }, planetElegidoActual: 'PLN-NEB-DEF' },
      },
    }
    s = reduce(s, { type: 'CLOSE_TRAMO' })
    // A: planeta-Atq, A.fuerza 10 vs B.fuerza 0 → A gana → A despertado.
    // B: planeta-Def, B.resguardo 5 vs A.resguardo 0 → B gana → B despertado.
    expect(s.players.a.heroEstado).toBe('despertado')
    expect(s.players.b.heroEstado).toBe('despertado')
    // Atributos NO se resetean.
    expect(s.players.a.atributos.fuerza).toBe(10)
    expect(s.players.b.atributos.resguardo).toBe(5)
    // Avanza a tramo estrellas.
    expect(s.tramo).toBe('estrellas')
    expect(s.turno).toBe(3)
    expect(s.subPaso).toBe('eleccion_planeta')
  })

  it('no avanza héroe si empate', () => {
    const reduce = createReducer(deps)
    let s = initState()
    s = {
      ...s,
      tramo: 'nebulosa',
      turno: 2,
      subPaso: 'cierre_tramo',
      players: {
        a: { ...s.players.a, atributos: { fuerza: 5, resguardo: 0, resonancia: 0 }, planetElegidoActual: 'PLN-NEB-ATQ' },
        b: { ...s.players.b, atributos: { fuerza: 5, resguardo: 0, resonancia: 0 }, planetElegidoActual: 'PLN-NEB-ATQ' },
      },
    }
    s = reduce(s, { type: 'CLOSE_TRAMO' })
    expect(s.players.a.heroEstado).toBe('neutral')
    expect(s.players.b.heroEstado).toBe('neutral')
  })
})

describe('reducer — INVOKE_ECLIPSE + END_GAME', () => {
  it('Eclipse fuerza el cierre tras REVEAL', () => {
    const reduce = createReducer(deps)
    let s = initState()
    // Forzamos a Sexto Sol turno 5.
    s = {
      ...s,
      tramo: 'sexto_sol',
      turno: 5,
      energiaActual: 5,
      subPaso: 'accion_pendiente',
      players: {
        a: { ...s.players.a, atributos: { fuerza: 5, resguardo: 3, resonancia: 1 }, planetElegidoActual: undefined },
        b: { ...s.players.b, atributos: { fuerza: 1, resguardo: 5, resonancia: 8 }, planetElegidoActual: undefined },
      },
    }
    // A invoca Eclipse.
    s = reduce(s, { type: 'INVOKE_ECLIPSE', playerId: 'a' })
    expect(s.eclipseInvocado).toBe(true)
    expect(s.eclipseInvocador).toBe('a')
    // B robó una carta extra.
    const bHandSize = s.players.b.mano.length
    expect(bHandSize).toBeGreaterThanOrEqual(5) // 4 inicial + 1 extra
    // Ahora ambos juegan + premonician + revelan. La acción de A cuenta ×2.
    const cardIdA = s.players.a.mano[0]!
    const cardIdB = s.players.b.mano[0]!
    s = reduce(s, { type: 'PLAY_HIDDEN', playerId: 'a', cardId: cardIdA })
    s = reduce(s, { type: 'PLAY_HIDDEN', playerId: 'b', cardId: cardIdB })
    s = reduce(s, { type: 'DECLARE_PREMONICION', playerId: 'a', categoria: 'Ataque' })
    s = reduce(s, { type: 'DECLARE_PREMONICION', playerId: 'b', categoria: 'Defensa' })
    s = reduce(s, { type: 'REVEAL' })
    // Partida termina post-Eclipse.
    expect(s.subPaso).toBe('terminado')
    expect(s.ganador).toBeDefined()
  })
})

describe('reducer — END_GAME tally 2-de-3', () => {
  it('A gana 2-1', () => {
    const reduce = createReducer(deps)
    let s = initState()
    s = {
      ...s,
      players: {
        a: { ...s.players.a, atributos: { fuerza: 10, resguardo: 10, resonancia: 0 } },
        b: { ...s.players.b, atributos: { fuerza: 5, resguardo: 5, resonancia: 8 } },
      },
    }
    s = reduce(s, { type: 'END_GAME' })
    expect(s.ganador).toBe('a')
    expect(s.finalTally).toEqual({ a: 2, b: 1 })
  })

  it('Tiebreaker: suma total si empate en 2-de-3', () => {
    const reduce = createReducer(deps)
    let s = initState()
    s = {
      ...s,
      players: {
        a: { ...s.players.a, atributos: { fuerza: 5, resguardo: 5, resonancia: 5 } },
        b: { ...s.players.b, atributos: { fuerza: 5, resguardo: 5, resonancia: 5 } },
      },
    }
    s = reduce(s, { type: 'END_GAME' })
    // Suma igual → siguiente tiebreaker es héroe estado (ambos neutral) → empate técnico.
    expect(s.ganador).toBe('empate')
  })

  it('Empate por suma total se rompe por mayor estado de héroe', () => {
    const reduce = createReducer(deps)
    let s = initState()
    s = {
      ...s,
      players: {
        a: { ...s.players.a, atributos: { fuerza: 5, resguardo: 5, resonancia: 5 }, heroEstado: 'ascendido' },
        b: { ...s.players.b, atributos: { fuerza: 5, resguardo: 5, resonancia: 5 }, heroEstado: 'despertado' },
      },
    }
    s = reduce(s, { type: 'END_GAME' })
    expect(s.ganador).toBe('a')
  })
})
