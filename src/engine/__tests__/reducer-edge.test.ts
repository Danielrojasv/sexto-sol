// reducer-edge.test.ts v4.2 — edge cases (mulligan, pass, eclipse, energía)

import { describe, expect, it } from 'vitest'
import { createInitialState } from '../initialState'
import { createReducer, getEnergiaParaJugador } from '../reducer'
import { mockCard, mockDeps } from './_helpers'

const cardA = mockCard({
  id: 'CARD-A',
  categoria: 'Ataque',
  coste: 1,
  fuerzaBase: 1,
  penalizacionAcierto: 0,
})
const cardB = mockCard({
  id: 'CARD-B',
  raza: 'Würon',
  categoria: 'Defensa',
  coste: 1,
  fuerzaBase: 1,
  penalizacionAcierto: 0,
})

const deps = mockDeps([cardA, cardB])

function setupNeb(skipMulligan = true) {
  let s = createInitialState({
    seed: 1,
    modo: 'vsIA',
    deckA: { raza: 'Tezhal', cardIds: Array.from({ length: 20 }, () => 'CARD-A'), heroId: 'HRO-TEZHAL' },
    deckB: { raza: 'Würon', cardIds: Array.from({ length: 20 }, () => 'CARD-B'), heroId: 'HRO-WURON' },
    planetIdsNebulosa: ['PLN-NEB-ATQ', 'PLN-NEB-DEF', 'PLN-NEB-RIT'],
    planetIdsEstrellas: ['PLN-EST-ATQ', 'PLN-EST-DEF', 'PLN-EST-RIT'],
  })
  if (skipMulligan) {
    const r = createReducer(deps)
    s = r(s, { type: 'KEEP_HAND', playerId: 'a' })
    s = r(s, { type: 'KEEP_HAND', playerId: 'b' })
  }
  return s
}

describe('reducer — MULLIGAN', () => {
  it('re-baraja mano', () => {
    const r = createReducer(deps)
    let s = setupNeb(false)
    s = r(s, { type: 'MULLIGAN', playerId: 'a' })
    expect(s.players.a.mulliganUsado).toBe(true)
    expect(s.players.a.mano.length).toBe(4)
    expect(s.players.a.mazoRestante.length).toBe(16)
  })

  it('rechaza segundo mulligan', () => {
    const r = createReducer(deps)
    let s = setupNeb(false)
    s = r(s, { type: 'MULLIGAN', playerId: 'a' })
    expect(() => r(s, { type: 'MULLIGAN', playerId: 'a' })).toThrow(/ya usó/)
  })

  it('KEEP_HAND avanza cuando ambos aceptan', () => {
    const r = createReducer(deps)
    let s = setupNeb(false)
    s = r(s, { type: 'KEEP_HAND', playerId: 'a' })
    expect(s.subPaso).toBe('mulligan_inicial')
    s = r(s, { type: 'KEEP_HAND', playerId: 'b' })
    expect(s.subPaso).toBe('eleccion_planeta')
  })
})

describe('reducer — PASS_TURN', () => {
  it('pasa con premonición y avanza a revelar', () => {
    const r = createReducer(deps)
    let s = setupNeb()
    s = r(s, { type: 'SELECT_PLANET', playerId: 'a', planetId: 'PLN-NEB-ATQ' })
    s = r(s, { type: 'SELECT_PLANET', playerId: 'b', planetId: 'PLN-NEB-DEF' })
    s = r(s, { type: 'DRAW_BOTH' })
    s = r(s, { type: 'PASS_TURN', playerId: 'a', premonicion: 'Defensa' })
    s = r(s, { type: 'PASS_TURN', playerId: 'b', premonicion: 'Ataque' })
    expect(s.subPaso).toBe('revelar')
    expect(s.paseDeclarado.a).toBe(true)
    expect(s.paseDeclarado.b).toBe(true)
    expect(s.premoniciones.a).toBe('Defensa')
    expect(s.premoniciones.b).toBe('Ataque')
  })

  it('rechaza segunda decisión del mismo jugador', () => {
    const r = createReducer(deps)
    let s = setupNeb()
    s = r(s, { type: 'SELECT_PLANET', playerId: 'a', planetId: 'PLN-NEB-ATQ' })
    s = r(s, { type: 'SELECT_PLANET', playerId: 'b', planetId: 'PLN-NEB-DEF' })
    s = r(s, { type: 'DRAW_BOTH' })
    s = r(s, { type: 'PASS_TURN', playerId: 'a', premonicion: 'Defensa' })
    expect(() => r(s, { type: 'PASS_TURN', playerId: 'a', premonicion: 'Ataque' })).toThrow()
  })
})

describe('reducer — getEnergiaParaJugador', () => {
  it('energía base = número de turno', () => {
    const s = setupNeb()
    expect(getEnergiaParaJugador({ ...s, turno: 3 }, 'a')).toBe(3)
    expect(getEnergiaParaJugador({ ...s, turno: 7 }, 'b')).toBe(7)
  })

  it('Würon Ascendida da +1 energía', () => {
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
})

describe('reducer — INVOKE_ECLIPSE edge cases', () => {
  it('rechaza Eclipse fuera de Sexto Sol', () => {
    const r = createReducer(deps)
    let s = setupNeb()
    s = { ...s, subPaso: 'seleccion_secreta' as const, tramo: 'nebulosa' as const }
    expect(() => r(s, { type: 'INVOKE_ECLIPSE', playerId: 'a' })).toThrow(/Sexto Sol/)
  })

  it('rechaza Eclipse fuera del sub-paso correcto', () => {
    const r = createReducer(deps)
    let s = setupNeb()
    s = { ...s, tramo: 'sexto_sol' as const, subPaso: 'eleccion_planeta' as const }
    expect(() => r(s, { type: 'INVOKE_ECLIPSE', playerId: 'a' })).toThrow(/seleccion_secreta/)
  })
})

describe('reducer — CLOSE_TRAMO', () => {
  it('A gana su planeta → avanza héroe a despertado', () => {
    const r = createReducer(deps)
    let s = setupNeb()
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
    s = r(s, { type: 'CLOSE_TRAMO' })
    expect(s.players.a.heroEstado).toBe('despertado')
    expect(s.players.b.heroEstado).toBe('despertado')
    expect(s.tramo).toBe('estrellas')
    expect(s.turno).toBe(3)
    expect(s.subPaso).toBe('eleccion_planeta')
    expect(s.players.a.planetElegidoActual).toBeUndefined()
  })

  it('Cierre Estrellas avanza a Sexto Sol sub-paso robo', () => {
    const r = createReducer(deps)
    let s = setupNeb()
    s = {
      ...s,
      tramo: 'estrellas',
      turno: 4,
      subPaso: 'cierre_tramo',
      players: {
        a: { ...s.players.a, atributos: { fuerza: 10, resguardo: 0, resonancia: 0 }, planetElegidoActual: 'PLN-EST-ATQ' },
        b: { ...s.players.b, atributos: { fuerza: 0, resguardo: 0, resonancia: 5 }, planetElegidoActual: 'PLN-EST-RIT' },
      },
    }
    s = r(s, { type: 'CLOSE_TRAMO' })
    expect(s.tramo).toBe('sexto_sol')
    expect(s.turno).toBe(5)
    expect(s.subPaso).toBe('robo')
  })

  it('Empate: nadie avanza héroe', () => {
    const r = createReducer(deps)
    let s = setupNeb()
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
    s = r(s, { type: 'CLOSE_TRAMO' })
    expect(s.players.a.heroEstado).toBe('neutral')
    expect(s.players.b.heroEstado).toBe('neutral')
  })
})

describe('reducer — Pasar con acierto aplica penalización mínima', () => {
  it('A pasa con premonición que acierta → B pierde 1', () => {
    const r = createReducer(deps)
    let s = setupNeb()
    s = r(s, { type: 'SELECT_PLANET', playerId: 'a', planetId: 'PLN-NEB-ATQ' })
    s = r(s, { type: 'SELECT_PLANET', playerId: 'b', planetId: 'PLN-NEB-DEF' })
    s = r(s, { type: 'DRAW_BOTH' })
    // A pasa con premonición Defensa (que acertará a B).
    s = r(s, { type: 'PASS_TURN', playerId: 'a', premonicion: 'Defensa' })
    // B juega su carta CARD-B (Defensa, base 1, pen 0).
    s = r(s, { type: 'PLAY_HIDDEN', playerId: 'b', cardId: 'CARD-B', premonicion: 'Ataque' })
    s = r(s, { type: 'REVEAL' })
    // CARD-B: base 1. A premonición Defensa, B categoría Defensa → A acertó → -0 (pen=0 de B).
    //   Pero A pasó (sin carta), aplica penalización mínima -1 al B → fuerza B = 1 - 0 - 1 = 0.
    //   Wait — releyendo §4.3: pasar con acierto aplica -1 al rival ADEMÁS de la lectura normal.
    //   Pero la lectura normal del rival sobre B también aplicó (-0 porque pen=0). Total: -0 + -1 = -1.
    //   Bonus planeta PLN-NEB-DEF + Def: +1. Total: 1 + 0 - 1 + 1 = 1.
    // Wait, ojo: A premonición Defensa Y A pasó. La regla de "Pasar con acierto = -1" se suma al efecto
    // normal. Resultado: 1 (base) - 0 (rival acertó pen=0) + 1 (bonus) - 1 (pasar con acierto) = 1.
    expect(s.players.b.atributos.resguardo).toBe(1)
  })
})
