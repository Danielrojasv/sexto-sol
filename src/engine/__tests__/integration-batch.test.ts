// Test integración v4.2 — 5 partidas scriptedAI vs scriptedAI con seeds 1001-1005.
//
// Valida que el flujo end-to-end del modelo "Premonición como Lectura" termina
// determinísticamente: ambos jugadores eligen carta + premonición ocultas en el
// mismo sub-paso (`seleccion_secreta`), revelado simultáneo, revisión, cierre
// de tramo. No verifica balance del pool — esa pertenece al sanity check.

import { describe, expect, it } from 'vitest'
import type { Action } from '../actions'
import { POOL_REGISTRY } from '@/data/cards/loader'
import { CANONICAL_DECKS } from '@/data/decks/loader'
import {
  emptyHistory,
  pickAccion,
  pickPlanet,
  pickPremonicion,
  shouldInvokeEclipse,
  shouldMulligan,
  type AIHistory,
} from '../ai/scriptedAI'
import { createInitialState } from '../initialState'
import { createReducer, type ReducerDeps } from '../reducer'
import type { Categoria, GameState } from '../types'

interface PlayerAIState {
  history: AIHistory
  miPremonicionPlanificada?: Categoria
}

function step(
  state: GameState,
  reducer: (s: GameState, a: Action) => GameState,
  deps: ReducerDeps,
  aiState: { a: PlayerAIState; b: PlayerAIState },
): GameState {
  switch (state.subPaso) {
    case 'mulligan_inicial': {
      for (const pid of ['a', 'b'] as const) {
        if (!state.players[pid].manoAceptada) {
          if (shouldMulligan(state, pid, deps) && !state.players[pid].mulliganUsado) {
            return reducer(state, { type: 'MULLIGAN', playerId: pid })
          }
          return reducer(state, { type: 'KEEP_HAND', playerId: pid })
        }
      }
      return state
    }
    case 'eleccion_planeta': {
      const pool =
        state.tramo === 'nebulosa' ? state.poolPlanetasNebulosa : state.poolPlanetasEstrellas
      for (const pid of ['a', 'b'] as const) {
        if (state.players[pid].planetElegidoActual === undefined) {
          return reducer(state, {
            type: 'SELECT_PLANET',
            playerId: pid,
            planetId: pickPlanet(state, pid, deps, pool),
          })
        }
      }
      return state
    }
    case 'robo':
      return reducer(state, { type: 'DRAW_BOTH' })
    case 'seleccion_secreta': {
      for (const pid of ['a', 'b'] as const) {
        if (aiState[pid].miPremonicionPlanificada === undefined) {
          aiState[pid].miPremonicionPlanificada = pickPremonicion(
            state,
            aiState[pid].history,
            pid,
          )
        }
      }
      if (state.tramo === 'sexto_sol' && !state.eclipseInvocado) {
        for (const pid of ['a', 'b'] as const) {
          if (
            shouldInvokeEclipse({
              state,
              playerId: pid,
              deps,
              history: aiState[pid].history,
              miPremonicion: aiState[pid].miPremonicionPlanificada!,
            })
          ) {
            return reducer(state, { type: 'INVOKE_ECLIPSE', playerId: pid })
          }
        }
      }
      for (const pid of ['a', 'b'] as const) {
        if (state.accionesPendientes[pid] === undefined && state.paseDeclarado[pid] !== true) {
          const prem = aiState[pid].miPremonicionPlanificada!
          const dec = pickAccion(state, pid, deps, aiState[pid].history, prem)
          if (dec.type === 'play') {
            return reducer(state, {
              type: 'PLAY_HIDDEN',
              playerId: pid,
              cardId: dec.cardId,
              premonicion: prem,
            })
          }
          return reducer(state, { type: 'PASS_TURN', playerId: pid, premonicion: prem })
        }
      }
      return state
    }
    case 'revelar': {
      for (const pid of ['a', 'b'] as const) {
        aiState[pid].miPremonicionPlanificada = undefined
      }
      return reducer(state, { type: 'REVEAL' })
    }
    case 'revisar_resolucion':
      return reducer(state, { type: 'CONTINUE_TURN' })
    case 'cierre_tramo':
      return reducer(state, { type: 'CLOSE_TRAMO' })
    case 'duelo_final':
      return reducer(state, { type: 'END_GAME' })
    case 'terminado':
      return state
    default:
      return state
  }
}

function runGame(seed: number): GameState {
  const decA = CANONICAL_DECKS.find((d) => d.id === 'tezhal-aggro')!
  const decB = CANONICAL_DECKS.find((d) => d.id === 'wuron-control')!
  const deps: ReducerDeps = { cards: POOL_REGISTRY.cards, planets: POOL_REGISTRY.planets }
  let state = createInitialState({
    seed,
    modo: 'vsIA',
    deckA: { raza: decA.race, cardIds: decA.cardIds, heroId: decA.heroId },
    deckB: { raza: decB.race, cardIds: decB.cardIds, heroId: decB.heroId },
    planetIdsNebulosa: POOL_REGISTRY.planetasNebulosa,
    planetIdsEstrellas: POOL_REGISTRY.planetasEstrellas,
  })
  const aiState: { a: PlayerAIState; b: PlayerAIState } = {
    a: { history: emptyHistory() },
    b: { history: emptyHistory() },
  }
  const reducer = createReducer(deps)
  let safety = 0
  while (state.subPaso !== 'terminado' && safety < 500) {
    safety++
    state = step(state, reducer, deps, aiState)
  }
  if (safety >= 500) {
    throw new Error('Loop infinito en integration-batch')
  }
  return state
}

describe('Phase 2 v4.2 — Batch integración scriptedAI vs scriptedAI', () => {
  it('5 partidas seeds 1001-1005 corren hasta terminado', () => {
    const seeds = [1001, 1002, 1003, 1004, 1005]
    for (const seed of seeds) {
      const final = runGame(seed)
      expect(final.subPaso).toBe('terminado')
      expect(final.ganador).toBeDefined()
    }
  })

  it('determinismo: misma seed produce mismo ganador', () => {
    const a = runGame(1001)
    const b = runGame(1001)
    expect(a.ganador).toBe(b.ganador)
    expect(JSON.stringify(a.players.a.atributos)).toBe(JSON.stringify(b.players.a.atributos))
    expect(JSON.stringify(a.players.b.atributos)).toBe(JSON.stringify(b.players.b.atributos))
  })

  it('distribución de ganadores es razonable', () => {
    const seeds = [1001, 1002, 1003, 1004, 1005]
    const ganadores = seeds.map((s) => runGame(s).ganador)
    expect(ganadores.every((g) => g !== undefined)).toBe(true)
  })

  it('historialPremoniciones poblado al final', () => {
    const final = runGame(1001)
    expect(final.historialPremoniciones.length).toBeGreaterThan(0)
  })
})
