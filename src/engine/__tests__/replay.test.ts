// Replay tests: misma seed + misma secuencia de acciones produce el mismo state.
// Es el contrato de determinismo que habilita PVP async, anti-cheat y spectator mode.

import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { createInitialState } from '../initialState'
import { apply } from '../reducer'
import type { Card, GameAction, Race } from '../types'

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

const ALL_RACES: readonly Race[] = ['quralan', 'wuron', 'tezhal', 'zaqe']

describe('replay — determinismo total', () => {
  it('seed + END_PHASE x10 produce el mismo state byte-a-byte', () => {
    const setup = {
      seed: 12345,
      p1Race: 'wuron' as const,
      p2Race: 'quralan' as const,
      p1Deck: deck(60, 'wuron'),
      p2Deck: deck(60, 'quralan'),
    }
    const actions: readonly GameAction[] = Array.from({ length: 10 }, () => ({
      type: 'END_PHASE',
    }))

    const states = Array.from({ length: 5 }, () => {
      let s = createInitialState(setup)
      for (const a of actions) s = apply(s, a).state
      return s
    })

    // Todos iguales al primero.
    for (let i = 1; i < states.length; i++) {
      expect(states[i]).toEqual(states[0])
    }
  })

  it('property: cualquier seed + cualquier secuencia replay-able', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }),
        fc.constantFrom(...ALL_RACES),
        fc.constantFrom(...ALL_RACES),
        fc.array(fc.constant<GameAction>({ type: 'END_PHASE' }), {
          minLength: 0,
          maxLength: 30,
        }),
        (seed, p1Race, p2Race, actions) => {
          const stateA = (() => {
            let s = createInitialState({
              seed,
              p1Race,
              p2Race,
              p1Deck: deck(60, p1Race),
              p2Deck: deck(60, p2Race),
            })
            for (const a of actions) s = apply(s, a).state
            return s
          })()
          const stateB = (() => {
            let s = createInitialState({
              seed,
              p1Race,
              p2Race,
              p1Deck: deck(60, p1Race),
              p2Deck: deck(60, p2Race),
            })
            for (const a of actions) s = apply(s, a).state
            return s
          })()
          // Comparación estructural profunda usando JSON (los states son serializables).
          return JSON.stringify(stateA) === JSON.stringify(stateB)
        },
      ),
      { numRuns: 50 },
    )
  })

  it('CONCEDE en cualquier punto produce mismo outcome al replayar', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 0, max: 8 }),
        fc.constantFrom('p1' as const, 'p2' as const),
        (seed, prefixLen, conceder) => {
          const setup = {
            seed,
            p1Race: 'tezhal' as const,
            p2Race: 'zaqe' as const,
            p1Deck: deck(60, 'tezhal'),
            p2Deck: deck(60, 'zaqe'),
          }
          const prefix: GameAction[] = Array.from({ length: prefixLen }, () => ({
            type: 'END_PHASE',
          }))
          const fullSeq: readonly GameAction[] = [...prefix, { type: 'CONCEDE', player: conceder }]

          const replay = (): ReturnType<typeof createInitialState> => {
            let s = createInitialState(setup)
            for (const a of fullSeq) s = apply(s, a).state
            return s
          }
          const a = replay()
          const b = replay()
          return JSON.stringify(a) === JSON.stringify(b) && a.outcome.kind === 'win'
        },
      ),
      { numRuns: 50 },
    )
  })
})
