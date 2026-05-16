import { describe, expect, it } from 'vitest'
import { createInitialState } from '../initialState'
import { createReducer, getEnergiaParaJugador } from '../reducer'
import { mockCard, mockDeps } from './_helpers'

const cardA = mockCard({ id: 'CARD-A', categoria: 'Ataque', coste: 1, fuerzaBase: 1, condicionales: [{ tipo: 'premonicion_propia', valor: 'Ataque', fuerzaDelta: 1 }] })
const cardB = mockCard({ id: 'CARD-B', raza: 'Würon', categoria: 'Defensa', coste: 1, fuerzaBase: 1, condicionales: [{ tipo: 'premonicion_propia', valor: 'Defensa', fuerzaDelta: 1 }] })
const cardExpensive = mockCard({ id: 'CARD-X', coste: 10, fuerzaBase: 99, condicionales: [{ tipo: 'premonicion_propia', valor: 'Ataque', fuerzaDelta: 0 }] })

const deps = mockDeps([cardA, cardB, cardExpensive])

function setupNeb() {
  const s = createInitialState({
    seed: 1,
    modo: 'vsIA',
    deckA: { raza: 'Tezhal', cardIds: Array.from({ length: 20 }, () => 'CARD-A'), heroId: 'HRO-TEZHAL' },
    deckB: { raza: 'Würon', cardIds: Array.from({ length: 20 }, () => 'CARD-B'), heroId: 'HRO-WURON' },
    planetIdsNebulosa: ['PLN-NEB-ATQ', 'PLN-NEB-DEF', 'PLN-NEB-RIT'],
    planetIdsEstrellas: ['PLN-EST-ATQ', 'PLN-EST-DEF', 'PLN-EST-RIT'],
  })
  return s
}

describe('reducer — MULLIGAN', () => {
  it('re-baraja mano y roba 4 nuevas', () => {
    const reducer = createReducer(deps)
    let s = setupNeb()
    s = reducer(s, { type: 'MULLIGAN', playerId: 'a' })
    expect(s.players.a.mulliganUsado).toBe(true)
    expect(s.players.a.mano.length).toBe(4)
    expect(s.players.a.mazoRestante.length).toBe(16)
  })

  it('rechaza segundo mulligan', () => {
    const reducer = createReducer(deps)
    let s = setupNeb()
    s = reducer(s, { type: 'MULLIGAN', playerId: 'a' })
    expect(() => reducer(s, { type: 'MULLIGAN', playerId: 'a' })).toThrow(/ya usó/)
  })

  it('rechaza mulligan después de elegir planeta', () => {
    const reducer = createReducer(deps)
    let s = setupNeb()
    s = reducer(s, { type: 'SELECT_PLANET', playerId: 'a', planetId: 'PLN-NEB-ATQ' })
    expect(() => reducer(s, { type: 'MULLIGAN', playerId: 'a' })).toThrow()
  })
})

describe('reducer — KEEP_HAND', () => {
  it('marca mulligan como usado sin cambiar mano', () => {
    const reducer = createReducer(deps)
    let s = setupNeb()
    const manoAntes = [...s.players.a.mano]
    s = reducer(s, { type: 'KEEP_HAND', playerId: 'a' })
    expect(s.players.a.mulliganUsado).toBe(true)
    expect(s.players.a.mano).toEqual(manoAntes)
  })
})

describe('reducer — PASS_TURN', () => {
  it('avanza a premonicion_pendiente cuando ambos pasan', () => {
    const reducer = createReducer(deps)
    let s = setupNeb()
    s = reducer(s, { type: 'SELECT_PLANET', playerId: 'a', planetId: 'PLN-NEB-ATQ' })
    s = reducer(s, { type: 'SELECT_PLANET', playerId: 'b', planetId: 'PLN-NEB-DEF' })
    s = reducer(s, { type: 'DRAW_BOTH' })
    s = reducer(s, { type: 'PASS_TURN', playerId: 'a' })
    s = reducer(s, { type: 'PASS_TURN', playerId: 'b' })
    expect(s.subPaso).toBe('premonicion_pendiente')
    expect(s.paseDeclarado.a).toBe(true)
    expect(s.paseDeclarado.b).toBe(true)
  })

  it('rechaza pasar dos veces', () => {
    const reducer = createReducer(deps)
    let s = setupNeb()
    s = reducer(s, { type: 'SELECT_PLANET', playerId: 'a', planetId: 'PLN-NEB-ATQ' })
    s = reducer(s, { type: 'SELECT_PLANET', playerId: 'b', planetId: 'PLN-NEB-DEF' })
    s = reducer(s, { type: 'DRAW_BOTH' })
    s = reducer(s, { type: 'PASS_TURN', playerId: 'a' })
    expect(() => reducer(s, { type: 'PASS_TURN', playerId: 'a' })).toThrow()
  })
})

describe('reducer — getEnergiaParaJugador', () => {
  it('energía base = número de turno', () => {
    const s = setupNeb()
    expect(getEnergiaParaJugador({ ...s, turno: 3 }, 'a')).toBe(3)
    expect(getEnergiaParaJugador({ ...s, turno: 7 }, 'b')).toBe(7)
  })

  it('Würon Ascendida da +1 energía cada turno', () => {
    const s = setupNeb()
    const withWuronAsc = {
      ...s,
      turno: 5,
      players: {
        ...s.players,
        b: { ...s.players.b, heroEstado: 'ascendido' as const, raza: 'Würon' as const },
      },
    }
    expect(getEnergiaParaJugador(withWuronAsc, 'b')).toBe(6)
    expect(getEnergiaParaJugador(withWuronAsc, 'a')).toBe(5)
  })

  it('Tezhal Ascendido NO da +1 energía', () => {
    const s = setupNeb()
    const withTezhalAsc = {
      ...s,
      turno: 5,
      players: {
        ...s.players,
        a: { ...s.players.a, heroEstado: 'ascendido' as const, raza: 'Tezhal' as const },
      },
    }
    expect(getEnergiaParaJugador(withTezhalAsc, 'a')).toBe(5)
  })
})

describe('reducer — DECLARE_PREMONICION edge cases', () => {
  it('rechaza segunda declaración del mismo jugador', () => {
    const reducer = createReducer(deps)
    let s = setupNeb()
    s = reducer(s, { type: 'SELECT_PLANET', playerId: 'a', planetId: 'PLN-NEB-ATQ' })
    s = reducer(s, { type: 'SELECT_PLANET', playerId: 'b', planetId: 'PLN-NEB-DEF' })
    s = reducer(s, { type: 'DRAW_BOTH' })
    s = reducer(s, { type: 'PASS_TURN', playerId: 'a' })
    s = reducer(s, { type: 'PASS_TURN', playerId: 'b' })
    s = reducer(s, { type: 'DECLARE_PREMONICION', playerId: 'a', categoria: 'Ataque' })
    expect(() =>
      reducer(s, { type: 'DECLARE_PREMONICION', playerId: 'a', categoria: 'Defensa' }),
    ).toThrow(/ya declaró/)
  })
})

describe('reducer — INVOKE_ECLIPSE edge cases', () => {
  it('rechaza Eclipse en sub-paso eleccion_planeta', () => {
    const reducer = createReducer(deps)
    let s = setupNeb()
    s = { ...s, tramo: 'sexto_sol' }
    expect(() => reducer(s, { type: 'INVOKE_ECLIPSE', playerId: 'a' })).toThrow(/accion_pendiente o premonicion_pendiente/)
  })
})
