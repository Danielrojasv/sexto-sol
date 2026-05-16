// scriptedAI v4.2 — tests heurísticos.
//
// Cubre las 5 heurísticas: mulligan, planeta (70/15/15), premonición
// (con tracking del historial v4.2), elección de acción (max fuerza esperada),
// y eclipse condicional.

import { describe, expect, it } from 'vitest'
import {
  emptyHistory,
  pickAccion,
  pickPlanet,
  pickPremonicion,
  shouldInvokeEclipse,
  shouldMulligan,
} from '../ai/scriptedAI'
import { createInitialState } from '../initialState'
import { mockCard, mockDeps } from './_helpers'
import type { Categoria, GameState, PremonicionRevelada, Tramo } from '../types'

const cardAtq1 = mockCard({
  id: 'C-ATQ-1',
  categoria: 'Ataque',
  coste: 1,
  fuerzaBase: 2,
  penalizacionAcierto: 0,
})
const cardAtq3 = mockCard({
  id: 'C-ATQ-3',
  categoria: 'Ataque',
  coste: 3,
  fuerzaBase: 4,
  penalizacionAcierto: 1,
})
const cardDef1 = mockCard({
  id: 'C-DEF-1',
  raza: 'Würon',
  categoria: 'Defensa',
  coste: 1,
  fuerzaBase: 1,
  penalizacionAcierto: 0,
})
const cardRit5 = mockCard({
  id: 'C-RIT-5',
  categoria: 'Ritual',
  coste: 5,
  fuerzaBase: 4,
  penalizacionAcierto: 2,
})
const cardExpensive = mockCard({
  id: 'C-EXP',
  categoria: 'Ataque',
  coste: 6,
  fuerzaBase: 5,
  penalizacionAcierto: 2,
})

const ALL = [cardAtq1, cardAtq3, cardDef1, cardRit5, cardExpensive]
const deps = mockDeps(ALL)

function setup(handIds: string[], seed = 1): GameState {
  const s = createInitialState({
    seed,
    modo: 'vsIA',
    deckA: {
      raza: 'Tezhal',
      cardIds: Array.from({ length: 20 }, () => 'C-ATQ-1'),
      heroId: 'HRO-TEZHAL',
    },
    deckB: {
      raza: 'Würon',
      cardIds: Array.from({ length: 20 }, () => 'C-DEF-1'),
      heroId: 'HRO-WURON',
    },
    planetIdsNebulosa: ['PLN-NEB-ATQ', 'PLN-NEB-DEF', 'PLN-NEB-RIT'],
    planetIdsEstrellas: ['PLN-EST-ATQ', 'PLN-EST-DEF', 'PLN-EST-RIT'],
  })
  return {
    ...s,
    players: { ...s.players, a: { ...s.players.a, mano: handIds } },
  }
}

describe('shouldMulligan', () => {
  it('mulligan si mano sin coste ≤ 2', () => {
    const s = setup(['C-ATQ-3', 'C-RIT-5', 'C-EXP', 'C-EXP'])
    expect(shouldMulligan(s, 'a', deps)).toBe(true)
  })

  it('NO mulligan si hay carta coste ≤ 2', () => {
    const s = setup(['C-ATQ-1', 'C-ATQ-3', 'C-RIT-5', 'C-EXP'])
    expect(shouldMulligan(s, 'a', deps)).toBe(false)
  })
})

describe('pickPlanet', () => {
  it('elige mayoritariamente planeta-Atq cuando mano es aggro', () => {
    const pool = ['PLN-NEB-ATQ', 'PLN-NEB-DEF', 'PLN-NEB-RIT']
    const elections: string[] = []
    for (let seed = 100; seed < 120; seed++) {
      const s = setup(['C-ATQ-1', 'C-ATQ-1', 'C-ATQ-3', 'C-DEF-1'], seed)
      elections.push(pickPlanet(s, 'a', deps, pool))
    }
    const atqCount = elections.filter((id) => id === 'PLN-NEB-ATQ').length
    expect(atqCount).toBeGreaterThanOrEqual(10)
  })

  it('elige válido si mano vacía', () => {
    const s = setup([])
    const pool = ['PLN-NEB-ATQ', 'PLN-NEB-DEF', 'PLN-NEB-RIT']
    const result = pickPlanet(s, 'a', deps, pool)
    expect(pool).toContain(result)
  })

  it('determinismo: misma seed produce misma elección', () => {
    const s = setup(['C-ATQ-1', 'C-ATQ-3'])
    const pool = ['PLN-NEB-ATQ', 'PLN-NEB-DEF', 'PLN-NEB-RIT']
    expect(pickPlanet(s, 'a', deps, pool)).toBe(pickPlanet(s, 'a', deps, pool))
  })
})

describe('pickPremonicion — tracking de historialPremoniciones', () => {
  it('sin historial: distribuye uniforme sobre múltiples seeds', () => {
    const elections: Categoria[] = []
    for (let seed = 200; seed < 260; seed++) {
      const s = setup([], seed)
      elections.push(pickPremonicion(s, emptyHistory(), 'a'))
    }
    expect(elections.filter((c) => c === 'Ataque').length).toBeGreaterThan(5)
    expect(elections.filter((c) => c === 'Defensa').length).toBeGreaterThan(5)
    expect(elections.filter((c) => c === 'Ritual').length).toBeGreaterThan(5)
  })

  it('con historial pesado en Ataque: predice mayoritariamente Ataque', () => {
    const histAtq: PremonicionRevelada[] = [1, 2, 3].map((t) => ({
      turno: t,
      tramo: 'nebulosa' as Tramo,
      a: 'Defensa' as Categoria,
      b: 'Ataque' as Categoria,
      cardCategoriaA: 'Defensa' as Categoria,
      cardCategoriaB: 'Ataque' as Categoria,
    }))
    const elections: Categoria[] = []
    for (let seed = 300; seed < 330; seed++) {
      const s = setup([], seed)
      const sWithHist = { ...s, historialPremoniciones: histAtq }
      elections.push(pickPremonicion(sWithHist, emptyHistory(), 'a'))
    }
    const atqCount = elections.filter((c) => c === 'Ataque').length
    expect(atqCount).toBeGreaterThanOrEqual(15)
  })
})

describe('pickAccion — elige max fuerza esperada', () => {
  it('con energía limitada, juega la carta de mayor fuerza_base pagable', () => {
    const s = setup(['C-ATQ-1', 'C-ATQ-3', 'C-RIT-5', 'C-EXP'])
    const s3 = { ...s, turno: 3 }
    const dec = pickAccion(s3, 'a', deps, emptyHistory(), 'Ataque')
    expect(dec.type).toBe('play')
    if (dec.type === 'play') {
      expect(dec.cardId).toBe('C-ATQ-3')
    }
  })

  it('si mano sin pagables → pass', () => {
    const s = setup(['C-RIT-5', 'C-EXP'])
    const dec = pickAccion(s, 'a', deps, emptyHistory(), 'Ataque')
    expect(dec.type).toBe('pass')
  })

  it('determinismo: misma seed produce misma elección', () => {
    const s = setup(['C-ATQ-1', 'C-ATQ-3'], 42)
    const s3 = { ...s, turno: 3 }
    const d1 = pickAccion(s3, 'a', deps, emptyHistory(), 'Ataque')
    const d2 = pickAccion(s3, 'a', deps, emptyHistory(), 'Ataque')
    expect(d1).toEqual(d2)
  })
})

describe('shouldInvokeEclipse', () => {
  it('NO invoca fuera del Sexto Sol', () => {
    const s = setup(['C-ATQ-1'])
    const should = shouldInvokeEclipse({
      state: { ...s, tramo: 'nebulosa' },
      playerId: 'a',
      deps,
      history: emptyHistory(),
      miPremonicion: 'Ataque',
    })
    expect(should).toBe(false)
  })

  it('NO invoca si ya fue invocado', () => {
    const s = setup(['C-ATQ-1'])
    const sSS = { ...s, tramo: 'sexto_sol' as Tramo, eclipseInvocado: true }
    const should = shouldInvokeEclipse({
      state: sSS,
      playerId: 'a',
      deps,
      history: emptyHistory(),
      miPremonicion: 'Ataque',
    })
    expect(should).toBe(false)
  })

  it('NO invoca si voy ganando el tally', () => {
    const s = setup(['C-ATQ-1'])
    const sSS = {
      ...s,
      tramo: 'sexto_sol' as Tramo,
      players: {
        ...s.players,
        a: { ...s.players.a, atributos: { fuerza: 10, resguardo: 10, resonancia: 0 } },
        b: { ...s.players.b, atributos: { fuerza: 0, resguardo: 0, resonancia: 5 } },
      },
    }
    expect(
      shouldInvokeEclipse({
        state: sSS,
        playerId: 'a',
        deps,
        history: emptyHistory(),
        miPremonicion: 'Ataque',
      }),
    ).toBe(false)
  })

  it('puede invocar si voy perdiendo y la carta tiene fuerza alta', () => {
    const s = setup(['C-EXP'], 5)
    const sSS = {
      ...s,
      tramo: 'sexto_sol' as Tramo,
      turno: 6,
      players: {
        ...s.players,
        a: { ...s.players.a, atributos: { fuerza: 0, resguardo: 0, resonancia: 0 } },
        b: { ...s.players.b, atributos: { fuerza: 10, resguardo: 10, resonancia: 5 } },
      },
    }
    const should = shouldInvokeEclipse({
      state: sSS,
      playerId: 'a',
      deps,
      history: emptyHistory(),
      miPremonicion: 'Ataque',
    })
    expect(should).toBe(true)
  })
})
