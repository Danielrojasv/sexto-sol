// scriptedAI v4.2 — STUB Phase 1a.
//
// La implementación completa se reescribe en Phase 2 con:
//   - Tracking histórico de premoniciones reveladas (de state.historialPremoniciones).
//   - Predicción 70%/15%/15% para categoría más jugada del rival.
//   - Elección de carta considerando penalizacion_acierto del rival + bonus planeta.
//   - Eclipse logic adaptada al nuevo orden de aplicación.
//
// Por ahora, las funciones devuelven decisiones razonables pero simples para que
// gameStore funcione en vsIA contra el humano durante migración.

import type { ReducerDeps } from '../reducer'
import type { Categoria, GameState, PlayerId } from '../types'

export interface AIHistory {
  oponenteCategorias: Categoria[]
}

export function emptyHistory(): AIHistory {
  return { oponenteCategorias: [] }
}

export function shouldMulligan(state: GameState, playerId: PlayerId, deps: ReducerDeps): boolean {
  const hand = state.players[playerId].mano
  return !hand.some((id) => {
    const c = deps.cards.get(id)
    return c !== undefined && c.coste <= 2
  })
}

export function pickPlanet(
  _state: GameState,
  _playerId: PlayerId,
  _deps: ReducerDeps,
  poolPlanetIds: string[],
): string {
  // Stub: elige el primero del pool.
  return poolPlanetIds[0]!
}

export function pickPremonicion(_state: GameState, history: AIHistory): Categoria {
  // Stub: elige la categoría más frecuente histórica, o Ataque por default.
  const counts: Record<Categoria, number> = { Ataque: 0, Defensa: 0, Ritual: 0 }
  for (const c of history.oponenteCategorias) counts[c]++
  let max: Categoria = 'Ataque'
  let maxN = -1
  for (const cat of ['Ataque', 'Defensa', 'Ritual'] as Categoria[]) {
    if (counts[cat] > maxN) {
      max = cat
      maxN = counts[cat]
    }
  }
  return max
}

export type DecisionAccion = { type: 'play'; cardId: string } | { type: 'pass' }

export function pickAccion(
  state: GameState,
  playerId: PlayerId,
  deps: ReducerDeps,
  _history: AIHistory,
  _miPremonicion: Categoria,
): DecisionAccion {
  // Stub: juega la primera carta pagable, sino pasa.
  const energia = state.turno
  const player = state.players[playerId]
  for (const cardId of player.mano) {
    const card = deps.cards.get(cardId)
    if (card && card.coste <= energia) return { type: 'play', cardId }
  }
  return { type: 'pass' }
}

export function shouldInvokeEclipse(_opts: {
  state: GameState
  playerId: PlayerId
  deps: ReducerDeps
  history: AIHistory
  miPremonicion: Categoria
}): boolean {
  // Stub: nunca invoca eclipse. Phase 2 reimplementa heurística.
  return false
}
