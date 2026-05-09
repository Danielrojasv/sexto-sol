// Property tests con fast-check sobre invariantes que NUNCA pueden romperse
// durante una partida. Si alguno falla, hay un bug fundamental en el reducer.

import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { createInitialState } from '../initialState'
import { apply } from '../reducer'
import { strategyFor } from '@/strategies'
import type { Card, GameAction, GameState, Race } from '../types'

const ALL_RACES: readonly Race[] = ['quralan', 'wuron', 'tezhal', 'zaqe']

const arbRace = fc.constantFrom(...ALL_RACES)

const arbAction: fc.Arbitrary<GameAction> = fc.oneof(
  fc.constant<GameAction>({ type: 'END_PHASE' }),
  fc.constant<GameAction>({ type: 'CONCEDE', player: 'p1' }),
  fc.constant<GameAction>({ type: 'CONCEDE', player: 'p2' }),
)

function deck(size: number, race: Race = 'wuron'): Card[] {
  return Array.from({ length: size }, (_, i) => ({
    id: `c${i}`,
    name: `Carta ${i}`,
    type: 'ship',
    race,
    cost: 0,
    rarity: 'common',
    keywords: [],
    abilities: [],
    strength: 1,
    hp: 1,
  }))
}

function runActions(initial: GameState, actions: readonly GameAction[]): GameState {
  let s = initial
  for (const a of actions) s = apply(s, a).state
  return s
}

describe('invariantes — HP y energía', () => {
  it('HP de mundo natal nunca negativo', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }),
        arbRace,
        arbRace,
        fc.array(arbAction, { minLength: 0, maxLength: 30 }),
        (seed, p1Race, p2Race, actions) => {
          const init = createInitialState({
            seed,
            p1Race,
            p2Race,
            p1Deck: deck(60, p1Race),
            p2Deck: deck(60, p2Race),
          })
          const final = runActions(init, actions)
          return final.players.p1.homeworld.hp >= 0 && final.players.p2.homeworld.hp >= 0
        },
      ),
      { numRuns: 100 },
    )
  })

  it('energía nunca negativa', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }),
        arbRace,
        arbRace,
        fc.array(arbAction, { minLength: 0, maxLength: 30 }),
        (seed, p1Race, p2Race, actions) => {
          const init = createInitialState({
            seed,
            p1Race,
            p2Race,
            p1Deck: deck(60, p1Race),
            p2Deck: deck(60, p2Race),
          })
          const final = runActions(init, actions)
          return final.players.p1.energy >= 0 && final.players.p2.energy >= 0
        },
      ),
      { numRuns: 100 },
    )
  })
})

describe('invariantes — turno y edad', () => {
  it('turn nunca decrece', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }),
        arbRace,
        arbRace,
        fc.array(arbAction, { minLength: 0, maxLength: 30 }),
        (seed, p1Race, p2Race, actions) => {
          const init = createInitialState({
            seed,
            p1Race,
            p2Race,
            p1Deck: deck(60, p1Race),
            p2Deck: deck(60, p2Race),
          })
          let s = init
          for (const a of actions) {
            const next = apply(s, a).state
            if (next.turn < s.turn) return false
            s = next
          }
          return true
        },
      ),
      { numRuns: 100 },
    )
  })

  it('age nunca decrece', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }),
        arbRace,
        arbRace,
        fc.array(arbAction, { minLength: 0, maxLength: 30 }),
        (seed, p1Race, p2Race, actions) => {
          const init = createInitialState({
            seed,
            p1Race,
            p2Race,
            p1Deck: deck(60, p1Race),
            p2Deck: deck(60, p2Race),
          })
          let s = init
          for (const a of actions) {
            const next = apply(s, a).state
            if (next.age < s.age) return false
            s = next
          }
          return true
        },
      ),
      { numRuns: 100 },
    )
  })
})

describe('invariantes — outcome y log', () => {
  it('una vez que outcome.kind != in_progress, nunca vuelve a in_progress', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }),
        arbRace,
        arbRace,
        fc.array(arbAction, { minLength: 0, maxLength: 30 }),
        (seed, p1Race, p2Race, actions) => {
          const init = createInitialState({
            seed,
            p1Race,
            p2Race,
            p1Deck: deck(60, p1Race),
            p2Deck: deck(60, p2Race),
          })
          let s = init
          let terminated = false
          for (const a of actions) {
            s = apply(s, a).state
            if (terminated && s.outcome.kind === 'in_progress') return false
            if (s.outcome.kind !== 'in_progress') terminated = true
          }
          return true
        },
      ),
      { numRuns: 100 },
    )
  })

  it('log monotónicamente crece (solo se agrega, nunca se trunca)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }),
        arbRace,
        arbRace,
        fc.array(arbAction, { minLength: 0, maxLength: 20 }),
        (seed, p1Race, p2Race, actions) => {
          const init = createInitialState({
            seed,
            p1Race,
            p2Race,
            p1Deck: deck(60, p1Race),
            p2Deck: deck(60, p2Race),
          })
          let s = init
          for (const a of actions) {
            const before = s.log.length
            s = apply(s, a).state
            if (s.log.length < before) return false
          }
          return true
        },
      ),
      { numRuns: 100 },
    )
  })
})

describe('invariantes — strategies', () => {
  it('cada raza tiene una categoría única (counter wheel emergente)', () => {
    const cats = ALL_RACES.map((r) => strategyFor(r).category)
    const unique = new Set(cats)
    expect(unique.size).toBe(ALL_RACES.length)
  })

  it('strategyFor(race).race === race (consistencia)', () => {
    for (const race of ALL_RACES) {
      expect(strategyFor(race).race).toBe(race)
    }
  })
})
