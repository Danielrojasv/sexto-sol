// Walkthrough §11 reproducible — Sexto Sol v4.2 (Premonición como Lectura).
//
// Reproduce el flujo del walkthrough §11 (Ana Tezhal-Aggro vs Bruno Würon-Control)
// con scripted moves controladas + seed determinístico, adaptado al modelo v4.2:
//   - subPaso `seleccion_secreta` (carta + premonición ocultas en paralelo).
//   - subPaso `revisar_resolucion` post-revelado (cleanup via CONTINUE_TURN).
//   - Acciones `PLAY_HIDDEN`/`PASS_TURN` llevan la premonición en el payload.
//   - `DECLARE_PREMONICION` eliminada (no existe en v4.2).
//
// El test es ESTRUCTURAL: valida flujo end-to-end (cierre de tramos, ganador,
// Eclipse en T7) SIN números exactos. Robusto a re-balanceos del pool v4.2.

import { describe, expect, it } from 'vitest'
import { POOL_REGISTRY } from '@/data/cards/loader'
import { CANONICAL_DECKS } from '@/data/decks/loader'
import type { Action } from '../actions'
import { createInitialState } from '../initialState'
import { createReducer, type ReducerDeps } from '../reducer'
import type { Categoria, GameState, PlayerId } from '../types'

function findDeck(id: string) {
  const deck = CANONICAL_DECKS.find((d) => d.id === id)
  if (!deck) {
    throw new Error(
      `Deck no encontrado: ${id}. Disponibles: ${CANONICAL_DECKS.map((d) => d.id).join(', ')}`,
    )
  }
  return deck
}

interface ScriptedAgent {
  pickPlanetNebulosa: (planets: string[]) => string
  pickPlanetEstrellas: (planets: string[]) => string
  pickPremonicion: (state: GameState, playerId: PlayerId) => Categoria
  pickCardOrPass: (
    state: GameState,
    playerId: PlayerId,
    deps: ReducerDeps,
  ) => { type: 'play'; cardId: string } | { type: 'pass' }
  shouldInvokeEclipse: (state: GameState, playerId: PlayerId) => boolean
}

function pickFirstByCategoria(
  hand: string[],
  deps: ReducerDeps,
  energia: number,
  preferred: Categoria,
): { type: 'play'; cardId: string } | { type: 'pass' } {
  const jugable = hand.filter((id) => {
    const c = deps.cards.get(id)
    return c !== undefined && c.coste <= energia
  })
  if (jugable.length === 0) return { type: 'pass' }
  const preferredCard = jugable.find((id) => deps.cards.get(id)?.categoria === preferred)
  if (preferredCard) return { type: 'play', cardId: preferredCard }
  return { type: 'play', cardId: jugable[0]! }
}

function makeAnaAgent(): ScriptedAgent {
  return {
    pickPlanetNebulosa: (planets) => {
      const atq = planets.find((id) => POOL_REGISTRY.planets.get(id)?.categoria === 'Ataque')
      return atq ?? planets[0]!
    },
    pickPlanetEstrellas: (planets) => {
      const atq = planets.find((id) => POOL_REGISTRY.planets.get(id)?.categoria === 'Ataque')
      return atq ?? planets[0]!
    },
    pickPremonicion: () => 'Defensa', // Ana lee a Würon esperando defensa
    pickCardOrPass: (state, pid, deps) => {
      const energia = state.turno
      return pickFirstByCategoria(state.players[pid].mano, deps, energia, 'Ataque')
    },
    shouldInvokeEclipse: (state) => {
      return state.turno === 7 && state.tramo === 'sexto_sol' && !state.eclipseInvocado
    },
  }
}

function makeBrunoAgent(): ScriptedAgent {
  return {
    pickPlanetNebulosa: (planets) => {
      const def = planets.find((id) => POOL_REGISTRY.planets.get(id)?.categoria === 'Defensa')
      return def ?? planets[0]!
    },
    pickPlanetEstrellas: (planets) => {
      const rit = planets.find((id) => POOL_REGISTRY.planets.get(id)?.categoria === 'Ritual')
      return rit ?? planets[0]!
    },
    pickPremonicion: () => 'Ataque',
    pickCardOrPass: (state, pid, deps) => {
      const energia = state.turno
      const preferred: Categoria =
        state.tramo === 'nebulosa' ? 'Defensa' : state.tramo === 'estrellas' ? 'Ritual' : 'Defensa'
      return pickFirstByCategoria(state.players[pid].mano, deps, energia, preferred)
    },
    shouldInvokeEclipse: () => false,
  }
}

function runWalkthroughGame(deps: ReducerDeps, seed: number): GameState {
  const decA = findDeck('tezhal-aggro')
  const decB = findDeck('wuron-control')

  let state = createInitialState({
    seed,
    modo: 'vsIA',
    deckA: { raza: decA.race, cardIds: decA.cardIds, heroId: decA.heroId },
    deckB: { raza: decB.race, cardIds: decB.cardIds, heroId: decB.heroId },
    planetIdsNebulosa: POOL_REGISTRY.planetasNebulosa,
    planetIdsEstrellas: POOL_REGISTRY.planetasEstrellas,
  })
  const reducer = createReducer(deps)
  const ana = makeAnaAgent()
  const bruno = makeBrunoAgent()

  let safety = 0
  while (state.subPaso !== 'terminado' && safety < 300) {
    safety++
    state = step(state, reducer, deps, ana, bruno)
  }
  if (safety >= 300) {
    throw new Error('Loop infinito en walkthrough.test (safety hit)')
  }
  return state
}

function step(
  state: GameState,
  reducer: (s: GameState, a: Action) => GameState,
  deps: ReducerDeps,
  ana: ScriptedAgent,
  bruno: ScriptedAgent,
): GameState {
  switch (state.subPaso) {
    case 'mulligan_inicial': {
      // Ambos aceptan mano inicial sin mulligan en el walkthrough.
      if (!state.players.a.manoAceptada) {
        return reducer(state, { type: 'KEEP_HAND', playerId: 'a' })
      }
      if (!state.players.b.manoAceptada) {
        return reducer(state, { type: 'KEEP_HAND', playerId: 'b' })
      }
      return state
    }
    case 'eleccion_planeta': {
      const poolIds =
        state.tramo === 'nebulosa' ? state.poolPlanetasNebulosa : state.poolPlanetasEstrellas
      if (state.players.a.planetElegidoActual === undefined) {
        const pid =
          state.tramo === 'nebulosa'
            ? ana.pickPlanetNebulosa(poolIds)
            : ana.pickPlanetEstrellas(poolIds)
        return reducer(state, { type: 'SELECT_PLANET', playerId: 'a', planetId: pid })
      }
      if (state.players.b.planetElegidoActual === undefined) {
        const pid =
          state.tramo === 'nebulosa'
            ? bruno.pickPlanetNebulosa(poolIds)
            : bruno.pickPlanetEstrellas(poolIds)
        return reducer(state, { type: 'SELECT_PLANET', playerId: 'b', planetId: pid })
      }
      return state
    }
    case 'robo':
      return reducer(state, { type: 'DRAW_BOTH' })
    case 'seleccion_secreta': {
      // En Sexto Sol, Ana puede invocar Eclipse antes de jugar acción.
      if (
        state.tramo === 'sexto_sol' &&
        !state.eclipseInvocado &&
        ana.shouldInvokeEclipse(state, 'a')
      ) {
        return reducer(state, { type: 'INVOKE_ECLIPSE', playerId: 'a' })
      }
      // Cada uno juega su acción con premonición en el mismo payload.
      if (state.accionesPendientes.a === undefined && state.paseDeclarado.a !== true) {
        const choice = ana.pickCardOrPass(state, 'a', deps)
        const prem = ana.pickPremonicion(state, 'a')
        if (choice.type === 'play') {
          return reducer(state, {
            type: 'PLAY_HIDDEN',
            playerId: 'a',
            cardId: choice.cardId,
            premonicion: prem,
          })
        }
        return reducer(state, { type: 'PASS_TURN', playerId: 'a', premonicion: prem })
      }
      if (state.accionesPendientes.b === undefined && state.paseDeclarado.b !== true) {
        const choice = bruno.pickCardOrPass(state, 'b', deps)
        const prem = bruno.pickPremonicion(state, 'b')
        if (choice.type === 'play') {
          return reducer(state, {
            type: 'PLAY_HIDDEN',
            playerId: 'b',
            cardId: choice.cardId,
            premonicion: prem,
          })
        }
        return reducer(state, { type: 'PASS_TURN', playerId: 'b', premonicion: prem })
      }
      return state
    }
    case 'revelar':
      return reducer(state, { type: 'REVEAL' })
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

describe('Walkthrough §11 — estructural (v4.2)', () => {
  it('Ana invoca Eclipse en T7 y la partida termina', () => {
    const deps: ReducerDeps = { cards: POOL_REGISTRY.cards, planets: POOL_REGISTRY.planets }
    const final = runWalkthroughGame(deps, 1234)
    expect(final.subPaso).toBe('terminado')
    expect(final.eclipseInvocado).toBe(true)
    expect(final.eclipseInvocador).toBe('a')
  })

  it('partida termina con ganador definido', () => {
    const deps: ReducerDeps = { cards: POOL_REGISTRY.cards, planets: POOL_REGISTRY.planets }
    const final = runWalkthroughGame(deps, 1234)
    expect(final.ganador).toBeDefined()
    expect(['a', 'b', 'empate']).toContain(final.ganador)
  })

  it('tally final con suma ≤ 3 atributos decididos', () => {
    const deps: ReducerDeps = { cards: POOL_REGISTRY.cards, planets: POOL_REGISTRY.planets }
    const final = runWalkthroughGame(deps, 1234)
    expect(final.finalTally).toBeDefined()
    const { a, b } = final.finalTally!
    expect(a + b).toBeLessThanOrEqual(3)
    expect(a + b).toBeGreaterThan(0)
  })

  it('historialPremoniciones registró al menos los turnos jugados', () => {
    const deps: ReducerDeps = { cards: POOL_REGISTRY.cards, planets: POOL_REGISTRY.planets }
    const final = runWalkthroughGame(deps, 1234)
    expect(final.historialPremoniciones.length).toBeGreaterThan(0)
    for (const entry of final.historialPremoniciones) {
      expect(['Ataque', 'Defensa', 'Ritual']).toContain(entry.a)
      expect(['Ataque', 'Defensa', 'Ritual']).toContain(entry.b)
    }
  })

  it('determinismo: misma seed produce mismo final', () => {
    const deps: ReducerDeps = { cards: POOL_REGISTRY.cards, planets: POOL_REGISTRY.planets }
    const a = runWalkthroughGame(deps, 1234)
    const b = runWalkthroughGame(deps, 1234)
    expect(a.ganador).toBe(b.ganador)
    expect(JSON.stringify(a.players.a.atributos)).toBe(JSON.stringify(b.players.a.atributos))
    expect(JSON.stringify(a.players.b.atributos)).toBe(JSON.stringify(b.players.b.atributos))
  })
})
