import { describe, expect, it } from 'vitest'
import type { Action } from '../actions'
import { createInitialState } from '../initialState'
import { createReducer } from '../reducer'
import { mockCard, mockDeps } from './_helpers'

const cardAtq = mockCard({ id: 'CARD-ATQ', categoria: 'Ataque', coste: 1, fuerzaBase: 2, condicionales: [{ tipo: 'premonicion_propia', valor: 'Ataque', fuerzaDelta: 1 }] })
const cardDef = mockCard({ id: 'CARD-DEF', raza: 'Würon', categoria: 'Defensa', coste: 1, fuerzaBase: 1, condicionales: [{ tipo: 'premonicion_propia', valor: 'Defensa', fuerzaDelta: 1 }] })

const deps = mockDeps([cardAtq, cardDef])

const actions: Action[] = [
  { type: 'SELECT_PLANET', playerId: 'a', planetId: 'PLN-NEB-ATQ' },
  { type: 'SELECT_PLANET', playerId: 'b', planetId: 'PLN-NEB-DEF' },
  { type: 'DRAW_BOTH' },
  { type: 'PLAY_HIDDEN', playerId: 'a', cardId: 'CARD-ATQ' },
  { type: 'PLAY_HIDDEN', playerId: 'b', cardId: 'CARD-DEF' },
  { type: 'DECLARE_PREMONICION', playerId: 'a', categoria: 'Defensa' },
  { type: 'DECLARE_PREMONICION', playerId: 'b', categoria: 'Ataque' },
  { type: 'REVEAL' },
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
    const stateA = runReplay(42)
    const stateB = runReplay(42)
    // Comparación exhaustiva via JSON.stringify (la única no determinista sería iteración
    // de Maps/Sets, pero el state no usa esas estructuras).
    expect(JSON.stringify(stateA)).toBe(JSON.stringify(stateB))
  })

  it('seeds distintas pueden producir states distintos', () => {
    const stateA = runReplay(1)
    const stateB = runReplay(2)
    // Mano inicial diferente por shuffle distinto (cards son las mismas pero positions distintas
    // — y como son todas CARD-ATQ, las manos coinciden. Validamos que al menos el rng counter difiere).
    expect(stateA.rng.counter).toBe(stateB.rng.counter) // mismo número de calls
    expect(stateA.rng.s0).not.toBe(stateB.rng.s0) // pero el estado interno difiere
  })
})
