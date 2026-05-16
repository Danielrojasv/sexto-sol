// Loaders tests v4.2 — verifica que el pool real cargue + balance por raza.

import { describe, expect, it } from 'vitest'
import { POOL_REGISTRY, cardById, heroByRaza, planetById } from '../cards/loader'
import { CANONICAL_DECKS, deckById, decksByRaza } from '../decks/loader'

describe('POOL_REGISTRY — carga estructural', () => {
  it('tiene 30 cartas de acción', () => {
    expect(POOL_REGISTRY.cards.size).toBe(30)
  })

  it('tiene 6 planetas (3 Nebulosa + 3 Estrellas)', () => {
    expect(POOL_REGISTRY.planets.size).toBe(6)
    expect(POOL_REGISTRY.planetasNebulosa).toHaveLength(3)
    expect(POOL_REGISTRY.planetasEstrellas).toHaveLength(3)
  })

  it('tiene 2 héroes (Tezhal + Würon)', () => {
    expect(POOL_REGISTRY.heroes.size).toBe(2)
    expect(POOL_REGISTRY.heroes.has('Tezhal')).toBe(true)
    expect(POOL_REGISTRY.heroes.has('Würon')).toBe(true)
  })

  it('todas las cartas tienen penalizacionAcierto definida (≥ 0)', () => {
    for (const c of POOL_REGISTRY.cards.values()) {
      expect(c.penalizacionAcierto).toBeGreaterThanOrEqual(0)
      expect(Number.isInteger(c.penalizacionAcierto)).toBe(true)
    }
  })

  it('ninguna carta usa cláusula premonicion_* (eliminadas en v4.2)', () => {
    for (const c of POOL_REGISTRY.cards.values()) {
      for (const cond of c.condicionales) {
        expect(cond.tipo).not.toMatch(/^premonicion/)
      }
    }
  })
})

describe('POOL_REGISTRY — balance por raza', () => {
  it('Tezhal tiene 15 cartas, Würon tiene 15 cartas', () => {
    const tezhal = [...POOL_REGISTRY.cards.values()].filter((c) => c.raza === 'Tezhal')
    const wuron = [...POOL_REGISTRY.cards.values()].filter((c) => c.raza === 'Würon')
    expect(tezhal).toHaveLength(15)
    expect(wuron).toHaveLength(15)
  })

  it('cada raza tiene 5 cartas por categoría (Atq/Def/Rit)', () => {
    for (const raza of ['Tezhal', 'Würon'] as const) {
      const cards = [...POOL_REGISTRY.cards.values()].filter((c) => c.raza === raza)
      const byCat = { Ataque: 0, Defensa: 0, Ritual: 0 }
      for (const c of cards) byCat[c.categoria]++
      expect(byCat).toEqual({ Ataque: 5, Defensa: 5, Ritual: 5 })
    }
  })

  it('Tezhal pen_acierto promedio < Würon pen_acierto promedio', () => {
    const tezhalCards = [...POOL_REGISTRY.cards.values()].filter((c) => c.raza === 'Tezhal')
    const wuronCards = [...POOL_REGISTRY.cards.values()].filter((c) => c.raza === 'Würon')
    const tezhalAvg = avg(tezhalCards.map((c) => c.penalizacionAcierto))
    const wuronAvg = avg(wuronCards.map((c) => c.penalizacionAcierto))
    expect(tezhalAvg).toBeLessThan(wuronAvg)
  })

  it('Tezhal fuerza_base promedio > Würon fuerza_base promedio', () => {
    const tezhalCards = [...POOL_REGISTRY.cards.values()].filter((c) => c.raza === 'Tezhal')
    const wuronCards = [...POOL_REGISTRY.cards.values()].filter((c) => c.raza === 'Würon')
    const tezhalAvg = avg(tezhalCards.map((c) => c.fuerzaBase))
    const wuronAvg = avg(wuronCards.map((c) => c.fuerzaBase))
    expect(tezhalAvg).toBeGreaterThan(wuronAvg)
  })
})

function avg(nums: number[]): number {
  if (nums.length === 0) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

describe('POOL_REGISTRY — helpers', () => {
  it('cardById devuelve carta o undefined', () => {
    const first = [...POOL_REGISTRY.cards.values()][0]!
    expect(cardById(first.id)?.id).toBe(first.id)
    expect(cardById('NO-EXISTE')).toBeUndefined()
  })

  it('planetById devuelve planeta o undefined', () => {
    const id = POOL_REGISTRY.planetasNebulosa[0]!
    expect(planetById(id)?.id).toBe(id)
    expect(planetById('NO-EXISTE')).toBeUndefined()
  })

  it('heroByRaza devuelve héroe o undefined', () => {
    expect(heroByRaza('Tezhal')?.raza).toBe('Tezhal')
    expect(heroByRaza('Würon')?.raza).toBe('Würon')
  })
})

describe('CANONICAL_DECKS', () => {
  it('carga 4 mazos preconstruidos', () => {
    expect(CANONICAL_DECKS).toHaveLength(4)
  })

  it('cada mazo tiene 20 cartas con IDs válidos del pool', () => {
    for (const d of CANONICAL_DECKS) {
      expect(d.cardIds).toHaveLength(20)
      for (const id of d.cardIds) {
        expect(POOL_REGISTRY.cards.has(id)).toBe(true)
      }
    }
  })

  it('todos los mazos tienen race ∈ {Tezhal, Würon}', () => {
    for (const d of CANONICAL_DECKS) {
      expect(['Tezhal', 'Würon']).toContain(d.race)
    }
  })

  it('deckById devuelve el mazo correcto o undefined', () => {
    const first = CANONICAL_DECKS[0]!
    expect(deckById(first.id)?.id).toBe(first.id)
    expect(deckById('no-existe')).toBeUndefined()
  })

  it('decksByRaza filtra por raza', () => {
    const tezhal = decksByRaza('Tezhal')
    const wuron = decksByRaza('Würon')
    expect(tezhal.length).toBeGreaterThan(0)
    expect(wuron.length).toBeGreaterThan(0)
    for (const d of tezhal) expect(d.race).toBe('Tezhal')
    for (const d of wuron) expect(d.race).toBe('Würon')
  })
})
