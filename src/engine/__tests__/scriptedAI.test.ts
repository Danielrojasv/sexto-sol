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
import type { Categoria } from '../types'

const cardAtq1 = mockCard({ id: 'C-ATQ-1', categoria: 'Ataque', coste: 1, fuerzaBase: 2, condicionales: [{ tipo: 'premonicion_propia', valor: 'Ataque', fuerzaDelta: 1 }] })
const cardAtq3 = mockCard({ id: 'C-ATQ-3', categoria: 'Ataque', coste: 3, fuerzaBase: 4, condicionales: [{ tipo: 'premonicion_propia', valor: 'Ataque', fuerzaDelta: 2 }] })
const cardDef1 = mockCard({ id: 'C-DEF-1', raza: 'Würon', categoria: 'Defensa', coste: 1, fuerzaBase: 1, condicionales: [{ tipo: 'premonicion_propia', valor: 'Defensa', fuerzaDelta: 1 }] })
const cardRit5 = mockCard({ id: 'C-RIT-5', categoria: 'Ritual', coste: 5, fuerzaBase: 4, condicionales: [{ tipo: 'premonicion_propia', valor: 'Ritual', fuerzaDelta: 2 }] })
const cardExpensive = mockCard({ id: 'C-EXP', categoria: 'Ataque', coste: 6, fuerzaBase: 5, condicionales: [{ tipo: 'premonicion_propia', valor: 'Ataque', fuerzaDelta: 0 }] })

const ALL = [cardAtq1, cardAtq3, cardDef1, cardRit5, cardExpensive]
const deps = mockDeps(ALL)

function setup(handIds: string[], seed = 1) {
  const s = createInitialState({
    seed,
    modo: 'vsIA',
    deckA: { raza: 'Tezhal', cardIds: Array.from({ length: 20 }, () => 'C-ATQ-1'), heroId: 'HRO-TEZHAL' },
    deckB: { raza: 'Würon', cardIds: Array.from({ length: 20 }, () => 'C-DEF-1'), heroId: 'HRO-WURON' },
    planetIdsNebulosa: ['PLN-NEB-ATQ', 'PLN-NEB-DEF', 'PLN-NEB-RIT'],
    planetIdsEstrellas: ['PLN-EST-ATQ', 'PLN-EST-DEF', 'PLN-EST-RIT'],
  })
  // Forzamos mano específica para test.
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
  it('elige planeta con categoría más eficiente', () => {
    // Mano con muchos Ataques baratos → preferirá planeta-Atq.
    const s = setup(['C-ATQ-1', 'C-ATQ-1', 'C-ATQ-3', 'C-DEF-1'])
    // Forzar deterministically la decisión con seed que produzca roll <= 0.7.
    // Repetimos 10 veces — al menos algunos deben elegir Atq.
    const pool = ['PLN-NEB-ATQ', 'PLN-NEB-DEF', 'PLN-NEB-RIT']
    const elections: string[] = []
    for (let i = 0; i < 20; i++) {
      const s2 = { ...s, seed: 100 + i }
      elections.push(pickPlanet(s2, 'a', deps, pool))
    }
    // Mayoría debería ser planeta-Atq (~70%).
    const atqCount = elections.filter((id) => id === 'PLN-NEB-ATQ').length
    expect(atqCount).toBeGreaterThanOrEqual(10)
  })

  it('elige uniforme si mano vacía / sin opciones', () => {
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

describe('pickPremonicion', () => {
  it('sin historia: distribuye uniforme', () => {
    const s = setup(['C-ATQ-1'])
    const result = pickPremonicion(s, emptyHistory())
    expect(['Ataque', 'Defensa', 'Ritual']).toContain(result)
  })

  it('con historia: prefiere la más frecuente (~70%)', () => {
    const s = setup(['C-ATQ-1'])
    const history = { oponenteCategorias: ['Ataque', 'Ataque', 'Ataque'] as Categoria[] }
    const elections: Categoria[] = []
    for (let i = 0; i < 30; i++) {
      const s2 = { ...s, seed: 1000 + i }
      elections.push(pickPremonicion(s2, history))
    }
    const atqCount = elections.filter((c) => c === 'Ataque').length
    expect(atqCount).toBeGreaterThanOrEqual(15) // mayoría
  })
})

describe('pickAccion', () => {
  it('elige la carta de mayor fuerza esperada paid', () => {
    // Mano con C-ATQ-1 (fuerza 2+1=3) y C-ATQ-3 (4+2=6). Energía 3 → ambas jugables.
    const s = { ...setup(['C-ATQ-1', 'C-ATQ-3']), turno: 3, energiaActual: 3 }
    const decision = pickAccion(s, 'a', deps, emptyHistory(), 'Ataque')
    expect(decision.type).toBe('play')
    if (decision.type === 'play') {
      expect(decision.cardId).toBe('C-ATQ-3') // mayor fuerza esperada
    }
  })

  it('pass si no hay carta jugable', () => {
    const s = { ...setup(['C-RIT-5', 'C-EXP']), turno: 1, energiaActual: 1 }
    const decision = pickAccion(s, 'a', deps, emptyHistory(), 'Ataque')
    expect(decision.type).toBe('pass')
  })
})

describe('shouldInvokeEclipse', () => {
  it('NO invoca fuera de Sexto Sol', () => {
    const s = { ...setup(['C-ATQ-3']), tramo: 'estrellas' as const, turno: 4, energiaActual: 4 }
    expect(shouldInvokeEclipse({ state: s, playerId: 'a', deps, history: emptyHistory(), miPremonicion: 'Ataque' })).toBe(false)
  })

  it('NO invoca si Eclipse ya invocado', () => {
    const s = {
      ...setup(['C-ATQ-3']),
      tramo: 'sexto_sol' as const,
      turno: 5,
      energiaActual: 5,
      eclipseInvocado: true,
    }
    expect(shouldInvokeEclipse({ state: s, playerId: 'a', deps, history: emptyHistory(), miPremonicion: 'Ataque' })).toBe(false)
  })

  it('NO invoca si voy ganando (tally mayor)', () => {
    const s = {
      ...setup(['C-ATQ-3']),
      tramo: 'sexto_sol' as const,
      turno: 5,
      energiaActual: 5,
      players: {
        a: { ...setup(['C-ATQ-3']).players.a, atributos: { fuerza: 10, resguardo: 10, resonancia: 5 } },
        b: { ...setup(['C-ATQ-3']).players.b, atributos: { fuerza: 0, resguardo: 0, resonancia: 0 } },
      },
    }
    expect(shouldInvokeEclipse({ state: s, playerId: 'a', deps, history: emptyHistory(), miPremonicion: 'Ataque' })).toBe(false)
  })

  it('invoca si voy perdiendo Y fuerza×2 ≥ 5', () => {
    const s = {
      ...setup(['C-ATQ-3']),
      tramo: 'sexto_sol' as const,
      turno: 5,
      energiaActual: 5,
      players: {
        a: { ...setup(['C-ATQ-3']).players.a, mano: ['C-ATQ-3'], atributos: { fuerza: 0, resguardo: 0, resonancia: 0 } },
        b: { ...setup(['C-ATQ-3']).players.b, atributos: { fuerza: 5, resguardo: 5, resonancia: 5 } },
      },
    }
    // C-ATQ-3 con A=Atq → 4+2 = 6. ×2 = 12 ≥ 5. ✓
    expect(shouldInvokeEclipse({ state: s, playerId: 'a', deps, history: emptyHistory(), miPremonicion: 'Ataque' })).toBe(true)
  })
})
