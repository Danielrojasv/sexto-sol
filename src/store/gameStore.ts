// Zustand store que encapsula el GameState + dispatch al reducer puro.
// Tambien guarda el viewstate de la app (home / play / cards / game-over).

import { create } from 'zustand'
import { createInitialState } from '@/engine/initialState'
import { apply } from '@/engine/reducer'
import { ALL_CARDS, cardsByRace } from '@/data/cards'
import {
  CANONICAL_DECKS,
  REPRESENTATIVE_DECK_IDS,
  flattenDeck,
} from '@/data/decks/loader'
import type { GameAction, GameEvent, GameState, PlayerId, Race } from '@/engine/types'
import type { Card } from '@/engine/types'

export type View = 'home' | 'play' | 'cards' | 'gameover'

/** Modo de juego: hot-seat (2 humanos en el mismo dispositivo) o vs IA. */
export type GameMode = 'hot-seat' | 'vs-ai'

export interface GameStore {
  view: View
  state: GameState | null
  /** Eventos emitidos por el último dispatch — para feedback visual transient. */
  lastEvents: readonly GameEvent[]
  /** UI: nave seleccionada como atacante (durante combate). */
  selectedAttackerId: string | null
  /** UI: pantalla de privacidad activa entre turnos en hot-seat (NO en vs IA). */
  privacyShield: boolean
  /** Modo de la partida actual. Persiste hasta que se inicie otra. */
  mode: GameMode
  /** Si mode === 'vs-ai', cuál player es controlado por la IA. */
  aiPlayer: PlayerId | null

  setView(view: View): void
  /** Inicia partida con modo. En vs-ai, p2 es la IA por convención. */
  startGame(p1Race: Race, p2Race: Race, mode?: GameMode): void
  dispatch(action: GameAction): void
  selectAttacker(id: string | null): void
  acknowledgePrivacy(): void
}

/**
 * Devuelve el mazo canónico representativo de la raza para el MVP UI.
 * Los 12 mazos completos están en CANONICAL_DECKS (loadCanonicalDecks);
 * REPRESENTATIVE_DECK_IDS define cuál se expone en la UI (1 por raza).
 *
 * Fallback: si por algún motivo el mazo canónico no se encuentra (ej:
 * YAML inválido), arma un autoDeck con la pool de la raza repetida x3.
 */
function deckFor(race: Race): Card[] {
  const id = REPRESENTATIVE_DECK_IDS[race]
  const canonical = CANONICAL_DECKS.find((d) => d.id === id)
  if (canonical) return flattenDeck(canonical)
  // Fallback de emergencia (no esperado en runtime normal).
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
  mode: 'hot-seat',
  aiPlayer: null,

  setView(view) {
    set({ view })
  },

  startGame(p1Race, p2Race, mode = 'hot-seat') {
    const seed = Math.floor(Math.random() * 2 ** 31) >>> 0
    const initialState = createInitialState({
      seed,
      p1Race,
      p2Race,
      p1Deck: deckFor(p1Race),
      p2Deck: deckFor(p2Race),
    })
    set({
      state: initialState,
      view: initialState.outcome.kind === 'in_progress' ? 'play' : 'gameover',
      lastEvents: [],
      selectedAttackerId: null,
      privacyShield: false,
      mode,
      aiPlayer: mode === 'vs-ai' ? 'p2' : null,
    })
  },

  dispatch(action) {
    const { state, mode } = get()
    if (!state) return
    const result = apply(state, action)
    const view: View =
      result.state.outcome.kind === 'in_progress' ? get().view : 'gameover'
    // Privacy shield solo aplica en hot-seat: en vs IA no hay rotación física.
    const turnChanged = result.state.activePlayer !== state.activePlayer
    set({
      state: result.state,
      lastEvents: result.events,
      view,
      selectedAttackerId: null,
      privacyShield: mode === 'hot-seat' && turnChanged,
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
