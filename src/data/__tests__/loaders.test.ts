import { describe, expect, it } from 'vitest'
import { POOL_REGISTRY, cardById, heroByRaza, planetById } from '@/data/cards/loader'
import { CANONICAL_DECKS, deckById, decksByRaza } from '@/data/decks/loader'

describe('cards/loader', () => {
  it('carga 30 cartas de acción + 6 planetas + 2 héroes', () => {
    expect(POOL_REGISTRY.cards.size).toBe(30)
    expect(POOL_REGISTRY.planets.size).toBe(6)
    expect(POOL_REGISTRY.heroes.size).toBe(2)
  })

  it('pool de planetas Nebulosa ordenado Atq/Def/Rit', () => {
    const ids = POOL_REGISTRY.planetasNebulosa
    expect(ids).toHaveLength(3)
    expect(POOL_REGISTRY.planets.get(ids[0]!)?.categoria).toBe('Ataque')
    expect(POOL_REGISTRY.planets.get(ids[1]!)?.categoria).toBe('Defensa')
    expect(POOL_REGISTRY.planets.get(ids[2]!)?.categoria).toBe('Ritual')
  })

  it('pool de planetas Estrellas ordenado Atq/Def/Rit', () => {
    const ids = POOL_REGISTRY.planetasEstrellas
    expect(ids).toHaveLength(3)
    expect(POOL_REGISTRY.planets.get(ids[0]!)?.categoria).toBe('Ataque')
    expect(POOL_REGISTRY.planets.get(ids[1]!)?.categoria).toBe('Defensa')
    expect(POOL_REGISTRY.planets.get(ids[2]!)?.categoria).toBe('Ritual')
  })

  it('cardById devuelve cartas existentes', () => {
    expect(cardById('TZH-001')).toBeDefined()
    expect(cardById('NOEXISTE')).toBeUndefined()
  })

  it('planetById devuelve planetas existentes', () => {
    expect(planetById('PLN-NEB-ATQ')).toBeDefined()
    expect(planetById('NOEXISTE')).toBeUndefined()
  })

  it('heroByRaza devuelve héroes existentes', () => {
    expect(heroByRaza('Tezhal')).toBeDefined()
    expect(heroByRaza('Würon')).toBeDefined()
  })

  it('cada héroe tiene Despertado y Ascendido', () => {
    const tezhal = heroByRaza('Tezhal')!
    expect(tezhal.despertado).toBeDefined()
    expect(tezhal.ascendido).toBeDefined()
    expect(tezhal.despertado.id).toBe('HRO-TEZHAL-DESPERTADO')
    expect(tezhal.ascendido.id).toBe('HRO-TEZHAL-ASCENDIDO')
  })
})

describe('decks/loader', () => {
  it('carga 4 mazos preconstruidos', () => {
    expect(CANONICAL_DECKS.length).toBe(4)
  })

  it('cada mazo tiene 20 cartas', () => {
    for (const deck of CANONICAL_DECKS) {
      expect(deck.cardIds.length).toBe(20)
    }
  })

  it('deckById devuelve mazos existentes', () => {
    expect(deckById('tezhal-aggro')).toBeDefined()
    expect(deckById('wuron-control')).toBeDefined()
    expect(deckById('noexiste')).toBeUndefined()
  })

  it('decksByRaza filtra por raza', () => {
    const tezhal = decksByRaza('Tezhal')
    const wuron = decksByRaza('Würon')
    expect(tezhal.length).toBe(2)
    expect(wuron.length).toBe(2)
    expect(tezhal.every((d) => d.race === 'Tezhal')).toBe(true)
    expect(wuron.every((d) => d.race === 'Würon')).toBe(true)
  })

  it('cada cardId del deck existe en el pool', () => {
    for (const deck of CANONICAL_DECKS) {
      for (const cardId of deck.cardIds) {
        expect(POOL_REGISTRY.cards.has(cardId)).toBe(true)
      }
    }
  })
})
