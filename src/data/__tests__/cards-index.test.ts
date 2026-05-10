import { describe, expect, it } from 'vitest'
import { ALL_CARDS, cardById, cardsByRace } from '../cards'

describe('ALL_CARDS', () => {
  it('contains the 74 cards of the canary set (post-Zaqe expansion — set base completo)', () => {
    expect(ALL_CARDS.length).toBe(74)
  })

  it('groups by race correctly', () => {
    const counts = ALL_CARDS.reduce<Record<string, number>>((acc, c) => {
      acc[c.race] = (acc[c.race] ?? 0) + 1
      return acc
    }, {})
    expect(counts.quralan).toBe(19)
    expect(counts.wuron).toBe(19)
    expect(counts.tezhal).toBe(18)
    expect(counts.zaqe).toBe(18)
  })

  it('is sorted by race then cost then name', () => {
    for (let i = 1; i < ALL_CARDS.length; i++) {
      const prev = ALL_CARDS[i - 1]!
      const curr = ALL_CARDS[i]!
      if (prev.race !== curr.race) {
        expect(prev.race.localeCompare(curr.race)).toBeLessThanOrEqual(0)
      } else {
        expect(prev.cost <= curr.cost).toBe(true)
      }
    }
  })

  it('has unique ids', () => {
    const ids = new Set(ALL_CARDS.map((c) => c.id))
    expect(ids.size).toBe(ALL_CARDS.length)
  })
})

describe('cardsByRace', () => {
  it('filters to a single race', () => {
    const wuron = cardsByRace('wuron')
    expect(wuron.length).toBe(19)
    expect(wuron.every((c) => c.race === 'wuron')).toBe(true)
  })

  it('returns empty for an absent race (defensive)', () => {
    // @ts-expect-error — testing defensive path with invalid race
    expect(cardsByRace('marsino').length).toBe(0)
  })
})

describe('cardById', () => {
  it('finds an existing card', () => {
    const c = cardById('wuron_explorador_brote')
    expect(c?.name).toBe('Explorador del Brote')
  })

  it('returns undefined for missing id', () => {
    expect(cardById('not-a-real-id')).toBeUndefined()
  })
})
