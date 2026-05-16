// replay.test.ts v4.2 — determinismo via seed + secuencia de actions.

import { describe, expect, it } from 'vitest'
import type { Action } from '../actions'
import { createInitialState } from '../initialState'
import { createReducer } from '../reducer'
import { mockCard, mockDeps } from './_helpers'

const cardAtq = mockCard({
  id: 'CARD-ATQ',
  categoria: 'Ataque',
  coste: 1,
  fuerzaBase: 2,
  penalizacionAcierto: 0,
})
const cardDef = mockCard({
  id: 'CARD-DEF',
  raza: 'Würon',
  categoria: 'Defensa',
  coste: 1,
  fuerzaBase: 1,
  penalizacionAcierto: 0,
})

const deps = mockDeps([cardAtq, cardDef])

const actions: Action[] = [
  { type: 'KEEP_HAND', playerId: 'a' },
  { type: 'KEEP_HAND', playerId: 'b' },
  { type: 'SELECT_PLANET', playerId: 'a', planetId: 'PLN-NEB-ATQ' },
  { type: 'SELECT_PLANET', playerId: 'b', planetId: 'PLN-NEB-DEF' },
  { type: 'DRAW_BOTH' },
  { type: 'PLAY_HIDDEN', playerId: 'a', cardId: 'CARD-ATQ', premonicion: 'Defensa' },
  { type: 'PLAY_HIDDEN', playerId: 'b', cardId: 'CARD-DEF', premonicion: 'Ataque' },
  { type: 'REVEAL' },
  { type: 'CONTINUE_TURN' },
]

function runReplay(seed: number) {
  const state0 = createInitialState({
    seed,
    modo: 'vsIA',
    deckA: { raza: 'Tezhal', cardIds: Array.from({ length: 20 }, () => 'CARD-ATQ'), heroId: 'HRO-TEZHAL' },
    deckB: { raza: 'Würon', cardIds: Array.from({ length: 20 }, () => 'CARD-DEF'), heroId: 'HRO-WURON' },
    planetIdsNebulosa: ['PLN-NEB-ATQ', 'PLN-NEB-DEF', 'PLN-NEB-RIT'],
    planetIdsEstrellas: ['PLN-EST-ATQ', 'PLN-EST-DEF', 'PLN-EST-RIT'],
  })
  const reducer = createReducer(deps)
  return actions.reduce((state, action) => reducer(state, action), state0)
}

describe('determinismo (replay)', () => {
  it('misma seed + mismas actions = mismo state final', () => {
    const a = runReplay(42)
    const b = runReplay(42)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('seeds distintas → estados RNG distintos', () => {
    const a = runReplay(1)
    const b = runReplay(2)
    expect(a.rng.s0).not.toBe(b.rng.s0)
  })
})
