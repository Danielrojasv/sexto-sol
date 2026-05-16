// mechanics.test.ts v4.2 — Eclipse, bonus planeta, habilidades héroe.

import { describe, expect, it } from 'vitest'
import { createInitialState } from '../initialState'
import { createReducer } from '../reducer'
import type { GameState } from '../types'
import { mockCard, mockDeps } from './_helpers'

const cardAtq = mockCard({
  id: 'CARD-ATQ',
  categoria: 'Ataque',
  coste: 2,
  fuerzaBase: 4,
  penalizacionAcierto: 0,
})
const cardDef = mockCard({
  id: 'CARD-DEF',
  raza: 'Würon',
  categoria: 'Defensa',
  coste: 1,
  fuerzaBase: 1,
  penalizacionAcierto: 0,
})

const deps = mockDeps([cardAtq, cardDef])

function bootstrap() {
  const r = createReducer(deps)
  let s = createInitialState({
    seed: 42,
    modo: 'vsIA',
    deckA: { raza: 'Tezhal', cardIds: Array.from({ length: 20 }, () => 'CARD-ATQ'), heroId: 'HRO-TEZHAL' },
    deckB: { raza: 'Würon', cardIds: Array.from({ length: 20 }, () => 'CARD-DEF'), heroId: 'HRO-WURON' },
    planetIdsNebulosa: ['PLN-NEB-ATQ', 'PLN-NEB-DEF', 'PLN-NEB-RIT'],
    planetIdsEstrellas: ['PLN-EST-ATQ', 'PLN-EST-DEF', 'PLN-EST-RIT'],
  })
  s = r(s, { type: 'KEEP_HAND', playerId: 'a' })
  s = r(s, { type: 'KEEP_HAND', playerId: 'b' })
  return { reducer: r, s }
}

describe('Eclipse', () => {
  it('aplica ×2 al total del invocador', () => {
    const { reducer: r, s: initS } = bootstrap()
    let s: GameState = {
      ...initS,
      tramo: 'sexto_sol',
      turno: 5,
      energiaActual: 5,
      subPaso: 'seleccion_secreta',
    }
    s = r(s, { type: 'INVOKE_ECLIPSE', playerId: 'a' })
    expect(s.eclipseInvocado).toBe(true)
    s = r(s, { type: 'PLAY_HIDDEN', playerId: 'a', cardId: 'CARD-ATQ', premonicion: 'Defensa' })
    s = r(s, { type: 'PLAY_HIDDEN', playerId: 'b', cardId: 'CARD-DEF', premonicion: 'Defensa' })
    s = r(s, { type: 'REVEAL' })
    // cardAtq base 4. B premonición Defensa, A categoría Ataque → B falló → +1.
    // (En Sexto Sol no hay bonus planeta.)
    // Total = (4 + 1) * 2 (Eclipse) = 10.
    expect(s.players.a.atributos.fuerza).toBe(10)
    s = r(s, { type: 'CONTINUE_TURN' })
    expect(s.subPaso).toBe('terminado')
  })

  it('Eclipse solo se invoca 1 vez', () => {
    const { reducer: r, s: initS } = bootstrap()
    let s: GameState = {
      ...initS,
      tramo: 'sexto_sol',
      turno: 5,
      energiaActual: 5,
      subPaso: 'seleccion_secreta',
    }
    s = r(s, { type: 'INVOKE_ECLIPSE', playerId: 'a' })
    expect(() => r(s, { type: 'INVOKE_ECLIPSE', playerId: 'b' })).toThrow(/ya invocado/)
  })
})

describe('Bonus de planeta', () => {
  it('+1 a carta de la categoría del planeta en Nebulosa', () => {
    const { reducer: r, s: initS } = bootstrap()
    let s: GameState = { ...initS, turno: 2, energiaActual: 2 }
    s = r(s, { type: 'SELECT_PLANET', playerId: 'a', planetId: 'PLN-NEB-ATQ' })
    s = r(s, { type: 'SELECT_PLANET', playerId: 'b', planetId: 'PLN-NEB-DEF' })
    s = r(s, { type: 'DRAW_BOTH' })
    s = r(s, { type: 'PLAY_HIDDEN', playerId: 'a', cardId: 'CARD-ATQ', premonicion: 'Defensa' })
    s = r(s, { type: 'PLAY_HIDDEN', playerId: 'b', cardId: 'CARD-DEF', premonicion: 'Defensa' })
    s = r(s, { type: 'REVEAL' })
    // cardAtq base 4. B premonición Defensa, A=Ataque → falló → +1. Bonus planeta +1. = 6
    expect(s.players.a.atributos.fuerza).toBe(6)
    // cardDef base 1. A premonición Defensa, B=Defensa → A ACERTÓ → -0 (pen=0). Bonus +1. = 2
    expect(s.players.b.atributos.resguardo).toBe(2)
  })
})

describe('Habilidad pasiva Tezhal Despertado', () => {
  it('+1 fuerza adicional a cartas Ataque', () => {
    const { reducer: r, s: initS } = bootstrap()
    let s: GameState = {
      ...initS,
      tramo: 'sexto_sol', // sin bonus planeta
      turno: 5,
      energiaActual: 5,
      subPaso: 'seleccion_secreta',
      players: {
        ...initS.players,
        a: { ...initS.players.a, heroEstado: 'despertado' },
      },
    }
    s = r(s, { type: 'PLAY_HIDDEN', playerId: 'a', cardId: 'CARD-ATQ', premonicion: 'Defensa' })
    s = r(s, { type: 'PLAY_HIDDEN', playerId: 'b', cardId: 'CARD-DEF', premonicion: 'Defensa' })
    s = r(s, { type: 'REVEAL' })
    // cardAtq base 4. B premonición Defensa, A=Ataque → falló → +1. Tezhal Despertado +1. = 6.
    expect(s.players.a.atributos.fuerza).toBe(6)
  })
})
