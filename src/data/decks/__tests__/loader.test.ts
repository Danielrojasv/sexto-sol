// Tests del YAML deck loader.

import { describe, expect, it } from 'vitest'
import {
  CANONICAL_DECKS,
  REPRESENTATIVE_DECK_IDS,
  flattenDeck,
  loadCanonicalDecks,
  pickRepresentativeDecks,
} from '../loader'

describe('deck loader — carga + validación de mazos canónicos', () => {
  it('CANONICAL_DECKS tiene 12 mazos (3 por raza × 4 razas)', () => {
    expect(CANONICAL_DECKS).toHaveLength(12)
  })

  it('cada mazo tiene exactamente 30 cartas', () => {
    for (const deck of CANONICAL_DECKS) {
      const total = deck.cards.reduce((sum, c) => sum + c.count, 0)
      expect(total).toBe(30)
    }
  })

  it('legendarias respetan max 1 copia por mazo', () => {
    for (const deck of CANONICAL_DECKS) {
      for (const { card, count } of deck.cards) {
        if (card.rarity === 'legendary') {
          expect(count).toBeLessThanOrEqual(1)
        } else {
          expect(count).toBeLessThanOrEqual(3)
        }
      }
    }
  })

  it('todos los mazos tienen race válida', () => {
    const races = new Set(['wuron', 'tezhal', 'quralan', 'zaqe'])
    for (const deck of CANONICAL_DECKS) {
      expect(races.has(deck.race)).toBe(true)
    }
  })

  it('cada raza tiene 3 mazos representativos', () => {
    for (const race of ['wuron', 'tezhal', 'quralan', 'zaqe'] as const) {
      const count = CANONICAL_DECKS.filter((d) => d.race === race).length
      expect(count).toBe(3)
    }
  })

  it('flattenDeck produce array plano con length === 30', () => {
    const deck = CANONICAL_DECKS[0]
    if (!deck) throw new Error('no decks')
    const flat = flattenDeck(deck)
    expect(flat).toHaveLength(30)
  })

  it('loadCanonicalDecks async resuelve a CANONICAL_DECKS', async () => {
    const decks = await loadCanonicalDecks()
    expect(decks).toBe(CANONICAL_DECKS)
  })

  it('REPRESENTATIVE_DECK_IDS apunta a mazos existentes (uno por raza)', () => {
    const wuron = CANONICAL_DECKS.find((d) => d.id === REPRESENTATIVE_DECK_IDS.wuron)
    const tezhal = CANONICAL_DECKS.find((d) => d.id === REPRESENTATIVE_DECK_IDS.tezhal)
    const quralan = CANONICAL_DECKS.find((d) => d.id === REPRESENTATIVE_DECK_IDS.quralan)
    const zaqe = CANONICAL_DECKS.find((d) => d.id === REPRESENTATIVE_DECK_IDS.zaqe)
    expect(wuron).toBeDefined()
    expect(tezhal).toBeDefined()
    expect(quralan).toBeDefined()
    expect(zaqe).toBeDefined()
  })

  it('pickRepresentativeDecks retorna 4 mazos representativos', () => {
    const reps = pickRepresentativeDecks(CANONICAL_DECKS)
    expect(reps.wuron).toBeDefined()
    expect(reps.tezhal).toBeDefined()
    expect(reps.quralan).toBeDefined()
    expect(reps.zaqe).toBeDefined()
  })
})
