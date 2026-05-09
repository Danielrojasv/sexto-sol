// Zustand store que encapsula el GameState + dispatch al reducer puro.
// Tambien guarda el viewstate de la app (home / play / cards / game-over).

import { create } from 'zustand'
import { createInitialState } from '@/engine/initialState'
import { apply } from '@/engine/reducer'
import { ALL_CARDS, cardsByRace } from '@/data/cards'
import type { GameAction, GameEvent, GameState, Race } from '@/engine/types'
import type { Card } from '@/engine/types'

export type View = 'home' | 'play' | 'cards' | 'gameover'

export interface GameStore {
  view: View
  state: GameState | null
  /** Eventos emitidos por el último dispatch — para feedback visual transient. */
  lastEvents: readonly GameEvent[]
  /** UI: nave seleccionada como atacante (durante combate). */
  selectedAttackerId: string | null
  /** UI: pantalla de privacidad activa entre turnos en hot-seat. */
  privacyShield: boolean

  setView(view: View): void
  startGame(p1Race: Race, p2Race: Race): void
  dispatch(action: GameAction): void
  selectAttacker(id: string | null): void
  acknowledgePrivacy(): void
}

/**
 * Construye un mazo de 30 cartas para una raza:
 * toma todas las cartas de la raza y las repite x3 (limitando a 30 cartas).
 * Phase 4+ tendrá deck-builder real; este es un auto-deck para playtest.
 */
function autoDeck(race: Race): Card[] {
  const pool = cardsByRace(race)
  if (pool.length === 0) return []
  const repeated: Card[] = []
  let i = 0
  while (repeated.length < 30) {
    const card = pool[i % pool.length]
    if (!card) break
    repeated.push(card)
    i++
  }
  return repeated.slice(0, 30)
}

export const useGameStore = create<GameStore>((set, get) => ({
  view: 'home',
  state: null,
  lastEvents: [],
  selectedAttackerId: null,
  privacyShield: false,

  setView(view) {
    set({ view })
  },

  startGame(p1Race, p2Race) {
    const seed = Math.floor(Math.random() * 2 ** 31) >>> 0
    const initialState = createInitialState({
      seed,
      p1Race,
      p2Race,
      p1Deck: autoDeck(p1Race),
      p2Deck: autoDeck(p2Race),
    })
    set({
      state: initialState,
      view: initialState.outcome.kind === 'in_progress' ? 'play' : 'gameover',
      lastEvents: [],
      selectedAttackerId: null,
      privacyShield: false,
    })
  },

  dispatch(action) {
    const { state } = get()
    if (!state) return
    const result = apply(state, action)
    const view: View =
      result.state.outcome.kind === 'in_progress' ? get().view : 'gameover'
    // Si el turno cambió tras la acción, arrancar el privacy shield.
    const turnChanged = result.state.activePlayer !== state.activePlayer
    set({
      state: result.state,
      lastEvents: result.events,
      view,
      selectedAttackerId: null,
      privacyShield: turnChanged,
    })
  },

  selectAttacker(id) {
    set({ selectedAttackerId: id })
  },

  acknowledgePrivacy() {
    set({ privacyShield: false })
  },
}))

// Helpers selectores (estables, no recrean por render).
export const selectActivePlayer = (s: GameStore) => s.state?.activePlayer ?? null
export const selectPlayerState = (player: 'p1' | 'p2') => (s: GameStore) =>
  s.state?.players[player] ?? null

/** Catálogo total — útil para preview de deck en home. */
export const TOTAL_CARDS = ALL_CARDS.length
