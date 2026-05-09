import { describe, expect, it } from 'vitest'
import { createInitialState } from '../initialState'

describe('initialState — setup canónico', () => {
  it('mundos natales arrancan en HP 20', () => {
    const s = createInitialState({ seed: 1, p1Race: 'wuron', p2Race: 'tezhal' })
    expect(s.players.p1.homeworld.hp).toBe(20)
    expect(s.players.p1.homeworld.maxHp).toBe(20)
    expect(s.players.p2.homeworld.hp).toBe(20)
    expect(s.players.p2.homeworld.maxHp).toBe(20)
  })

  it('p1 mano 4, p2 mano 5 (+1 compensación segundo jugador)', () => {
    const s = createInitialState({ seed: 1, p1Race: 'wuron', p2Race: 'tezhal' })
    expect(s.players.p1.hand).toHaveLength(4)
    expect(s.players.p2.hand).toHaveLength(5)
  })

  it('p1 arranca con 1 energía en turno 1', () => {
    const s = createInitialState({ seed: 1, p1Race: 'wuron', p2Race: 'tezhal' })
    expect(s.players.p1.energy).toBe(1)
    expect(s.players.p2.energy).toBe(0)
  })

  it('Edad I, fase Recolección, turno 1, activePlayer p1', () => {
    const s = createInitialState({ seed: 1, p1Race: 'wuron', p2Race: 'tezhal' })
    expect(s.age).toBe(1)
    expect(s.phase).toBe('recoleccion')
    expect(s.turn).toBe(1)
    expect(s.activePlayer).toBe('p1')
  })

  it('3 planetas neutrales con Don revelado', () => {
    const s = createInitialState({ seed: 1, p1Race: 'wuron', p2Race: 'tezhal' })
    expect(s.sector.planets).toHaveLength(3)
    for (const p of s.sector.planets) {
      expect(p.exhausted).toBe(false)
      expect(p.exhaustedBy).toBeNull()
      expect(p.gift.id).toBeTruthy()
      expect(p.gift.name).toBeTruthy()
    }
  })

  it('Dones placeholder vienen pre-poblados si no se proveen', () => {
    const s = createInitialState({ seed: 1, p1Race: 'wuron', p2Race: 'tezhal' })
    const giftIds = s.sector.planets.map((p) => p.gift.id)
    expect(giftIds).toEqual(['gift_archive', 'gift_core', 'gift_forge'])
  })

  it('Dones custom se respetan', () => {
    const s = createInitialState({
      seed: 1,
      p1Race: 'wuron',
      p2Race: 'tezhal',
      planetGifts: [
        { id: 'a', name: 'A', description: 'x' },
        { id: 'b', name: 'B', description: 'y' },
        { id: 'c', name: 'C', description: 'z' },
      ],
    })
    expect(s.sector.planets.map((p) => p.gift.id)).toEqual(['a', 'b', 'c'])
  })

  it('outcome arranca in_progress', () => {
    const s = createInitialState({ seed: 1, p1Race: 'wuron', p2Race: 'tezhal' })
    expect(s.outcome.kind).toBe('in_progress')
  })

  it('log y pendingEvents arrancan vacíos', () => {
    const s = createInitialState({ seed: 1, p1Race: 'wuron', p2Race: 'tezhal' })
    expect(s.log).toEqual([])
    expect(s.pendingEvents).toEqual([])
  })

  it('mismo seed produce mismo state (determinismo)', () => {
    const a = createInitialState({ seed: 42, p1Race: 'wuron', p2Race: 'tezhal' })
    const b = createInitialState({ seed: 42, p1Race: 'wuron', p2Race: 'tezhal' })
    expect(a).toEqual(b)
  })
})
