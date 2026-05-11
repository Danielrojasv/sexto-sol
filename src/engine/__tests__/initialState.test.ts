import { describe, expect, it } from 'vitest'
import { createInitialState } from '../initialState'
import type { Card } from '../types'

function sampleDeck(size: number): Card[] {
  return Array.from({ length: size }, (_, i) => ({
    id: `c${i}`,
    name: `Carta ${i}`,
    type: 'ship',
    race: 'wuron',
    cost: 0,
    rarity: 'common',
    keywords: [],
    abilities: [],
    strength: 1,
    hp: 1,
  }))
}

describe('initialState — setup canónico', () => {
  it('mundos natales arrancan en HP 20', () => {
    const s = createInitialState({
      seed: 1,
      p1Race: 'wuron',
      p2Race: 'tezhal',
      p1Deck: sampleDeck(20),
      p2Deck: sampleDeck(20),
    })
    expect(s.players.p1.homeworld.hp).toBe(20)
    expect(s.players.p1.homeworld.maxHp).toBe(20)
    expect(s.players.p2.homeworld.hp).toBe(20)
    expect(s.players.p2.homeworld.maxHp).toBe(20)
  })

  it('p1 mano 5 (4 setup + 1 robada en primer turn-start), p2 mano 5 (compensación)', () => {
    const s = createInitialState({
      seed: 1,
      p1Race: 'wuron',
      p2Race: 'tezhal',
      p1Deck: sampleDeck(20),
      p2Deck: sampleDeck(20),
    })
    expect(s.players.p1.hand).toHaveLength(5)
    expect(s.players.p2.hand).toHaveLength(5)
  })

  it('p1 arranca con 1 energía después del primer turn-start', () => {
    const s = createInitialState({
      seed: 1,
      p1Race: 'wuron',
      p2Race: 'tezhal',
      p1Deck: sampleDeck(20),
      p2Deck: sampleDeck(20),
    })
    expect(s.players.p1.energy).toBe(1)
    expect(s.players.p2.energy).toBe(0)
  })

  it('Edad I, fase Recolección, turno 1, activePlayer p1', () => {
    const s = createInitialState({
      seed: 1,
      p1Race: 'wuron',
      p2Race: 'tezhal',
      p1Deck: sampleDeck(20),
      p2Deck: sampleDeck(20),
    })
    expect(s.phase).toBe('recoleccion')
    expect(s.turn).toBe(1)
    expect(s.activePlayer).toBe('p1')
  })

  it('zonas de jugador inicializadas vacías (v3.0: sin planetas)', () => {
    const s = createInitialState({
      seed: 1,
      p1Race: 'wuron',
      p2Race: 'tezhal',
      p1Deck: sampleDeck(20),
      p2Deck: sampleDeck(20),
    })
    expect(s.players.p1.pozoAstral).toEqual([])
    expect(s.players.p1.disolucion).toEqual([])
    expect(s.players.p1.relicsInPlay).toEqual([])
    expect(s.players.p1.techInPlay).toEqual([])
    expect(s.players.p2.pozoAstral).toEqual([])
  })

  it('outcome arranca in_progress con deck nonempty', () => {
    const s = createInitialState({
      seed: 1,
      p1Race: 'wuron',
      p2Race: 'tezhal',
      p1Deck: sampleDeck(20),
      p2Deck: sampleDeck(20),
    })
    expect(s.outcome.kind).toBe('in_progress')
  })

  it('decking-out instantáneo si p1 arranca con mazo vacío', () => {
    const s = createInitialState({ seed: 1, p1Race: 'wuron', p2Race: 'tezhal' })
    expect(s.outcome.kind).toBe('win')
    if (s.outcome.kind === 'win') {
      expect(s.outcome.winner).toBe('p2')
      expect(s.outcome.reason).toBe('decking_out')
    }
  })

  it('log y pendingEvents arrancan vacíos', () => {
    const s = createInitialState({
      seed: 1,
      p1Race: 'wuron',
      p2Race: 'tezhal',
      p1Deck: sampleDeck(20),
      p2Deck: sampleDeck(20),
    })
    expect(s.log).toEqual([])
    expect(s.pendingEvents).toEqual([])
  })

  it('mismo seed produce mismo state (determinismo)', () => {
    const setup = {
      seed: 42,
      p1Race: 'wuron' as const,
      p2Race: 'tezhal' as const,
      p1Deck: sampleDeck(20),
      p2Deck: sampleDeck(20),
    }
    const a = createInitialState(setup)
    const b = createInitialState(setup)
    expect(a).toEqual(b)
  })

  // v3.0: héroes pasivos en mundo natal eliminados. Las legendarias son
  // naves normales (rarity='legendary') en el deck.
})
