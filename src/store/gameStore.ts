// gameStore v4.1 — Zustand store. Espejo de GameState + dispatcher de Actions.
//
// Patrón: el reducer es puro (state, action) => newState. El store guarda el
// state + carga registries + expone dispatch + provee helpers de UI.

import { create } from 'zustand'
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
} from '@/engine/ai/scriptedAI'
import type { Action } from '@/engine/actions'
import { createInitialState } from '@/engine/initialState'
import { createReducer, type ReducerDeps } from '@/engine/reducer'
import type { Categoria, GameState, Modo, PlayerId, Raza } from '@/engine/types'

const DEPS: ReducerDeps = { cards: POOL_REGISTRY.cards, planets: POOL_REGISTRY.planets }
const REDUCER = createReducer(DEPS)

/** Configuración para iniciar nueva partida (HomeView). */
export interface GameConfig {
  modo: Modo
  razaA: Raza
  deckA_id: string
  /** Para vsIA, el oponente B se asigna automáticamente del otro race (default mazo). */
  razaB: Raza
  deckB_id: string
  /** Default ON, IQ6 cerrada en rev 3. */
  showTooltips: boolean
}

interface GameStore {
  /** Estado actual de la partida. undefined antes de START_GAME. */
  state: GameState | undefined
  /** Config con la que arrancó. Usado para "Jugar de nuevo". */
  lastConfig: GameConfig | undefined
  /** Historia del scriptedAI (vsIA). Reset cada partida. */
  aiHistory: { a: AIHistory; b: AIHistory }
  /** Premonición planificada por la IA este turno (cached). */
  aiPlannedPremonicion: { a?: Categoria; b?: Categoria }
  /** En Hot-seat: bandera de pantalla de privacidad activa. */
  privacyShieldActive: boolean
  /** Si la app está en HomeView (no en partida). */
  inHome: boolean
  /** Log de acciones de la partida actual (para replay/análisis). Reset por partida. */
  actionLog: Action[]
  /** Seed + timestamp de la partida actual (para identificar el log). */
  gameStartedAt: string | undefined
  /** Flag para evitar postear el log dos veces si re-render entra a terminado. */
  logPosted: boolean

  // Actions del store
  startGame: (config: GameConfig) => void
  dispatch: (action: Action) => void
  /** Avanza un sub-paso automáticamente si el activo es IA. */
  stepIA: () => void
  goHome: () => void
  acknowledgePrivacy: () => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  state: undefined,
  lastConfig: undefined,
  aiHistory: { a: emptyHistory(), b: emptyHistory() },
  aiPlannedPremonicion: {},
  privacyShieldActive: false,
  inHome: true,
  actionLog: [],
  gameStartedAt: undefined,
  logPosted: false,

  startGame: (config: GameConfig) => {
    const seed = Math.floor(Math.random() * 1_000_000_000) // browser-side, OK acá (no engine)
    const deckA = CANONICAL_DECKS.find((d) => d.id === config.deckA_id)
    const deckB = CANONICAL_DECKS.find((d) => d.id === config.deckB_id)
    if (!deckA || !deckB) throw new Error('Deck no encontrado en el registry')
    const initial = createInitialState({
      seed,
      modo: config.modo,
      deckA: { raza: deckA.race, cardIds: deckA.cardIds, heroId: deckA.heroId },
      deckB: { raza: deckB.race, cardIds: deckB.cardIds, heroId: deckB.heroId },
      planetIdsNebulosa: POOL_REGISTRY.planetasNebulosa,
      planetIdsEstrellas: POOL_REGISTRY.planetasEstrellas,
    })
    set({
      state: initial,
      lastConfig: config,
      aiHistory: { a: emptyHistory(), b: emptyHistory() },
      aiPlannedPremonicion: {},
      privacyShieldActive: false,
      inHome: false,
      actionLog: [],
      gameStartedAt: new Date().toISOString().replace(/[:.]/g, '-'),
      logPosted: false,
    })
    // No auto-keep — el user verá su mano en mulligan_inicial y decidirá.
    // stepIA() resolverá automáticamente el mulligan del jugador B (IA).
  },

  dispatch: (action: Action) => {
    const s = get().state
    if (!s) return
    // Si es REVEAL, registrar categorías jugadas en aiHistory ANTES de aplicar.
    if (action.type === 'REVEAL') {
      const aHist = get().aiHistory
      const aiHistoryNext = {
        a: { ...aHist.a, oponenteCategorias: [...aHist.a.oponenteCategorias] },
        b: { ...aHist.b, oponenteCategorias: [...aHist.b.oponenteCategorias] },
      }
      const cardA = s.accionesPendientes.a ? DEPS.cards.get(s.accionesPendientes.a) : undefined
      const cardB = s.accionesPendientes.b ? DEPS.cards.get(s.accionesPendientes.b) : undefined
      if (cardA) aiHistoryNext.b.oponenteCategorias.push(cardA.categoria)
      if (cardB) aiHistoryNext.a.oponenteCategorias.push(cardB.categoria)
      set({ aiHistory: aiHistoryNext, aiPlannedPremonicion: {} })
    }
    const next = REDUCER(s, action)
    const log = [...get().actionLog, action]
    set({ state: next, actionLog: log })
    // Si la partida acaba de terminar, postear el log al server (best-effort).
    if (next.subPaso === 'terminado' && !get().logPosted) {
      set({ logPosted: true })
      postGameLog({
        ts: get().gameStartedAt ?? new Date().toISOString(),
        seed: next.seed,
        config: get().lastConfig,
        actions: log,
        finalState: snapshotForLog(next),
      }).catch(() => {
        // best-effort; no romper UX si server no responde.
      })
    }
  },

  stepIA: () => {
    const s = get().state
    if (!s) return
    if (get().lastConfig?.modo !== 'vsIA') return
    // En vsIA, jugador B es siempre IA.
    const pid: PlayerId = 'b'
    const aiHistory = get().aiHistory[pid]
    switch (s.subPaso) {
      case 'mulligan_inicial': {
        if (s.players[pid].manoAceptada) return
        if (shouldMulligan(s, pid, DEPS) && !s.players[pid].mulliganUsado) {
          get().dispatch({ type: 'MULLIGAN', playerId: pid })
          // Tras mulligan, IA siempre acepta la nueva mano (1 mulligan máximo).
          get().dispatch({ type: 'KEEP_HAND', playerId: pid })
        } else {
          get().dispatch({ type: 'KEEP_HAND', playerId: pid })
        }
        return
      }
      case 'eleccion_planeta': {
        if (s.players[pid].planetElegidoActual !== undefined) return
        const pool = s.tramo === 'nebulosa' ? s.poolPlanetasNebulosa : s.poolPlanetasEstrellas
        get().dispatch({
          type: 'SELECT_PLANET',
          playerId: pid,
          planetId: pickPlanet(s, pid, DEPS, pool),
        })
        return
      }
      case 'seleccion_secreta': {
        // Phase 2 reescribirá scriptedAI con tracking nuevo. Por ahora stub
        // que mantiene flow básico: predice categoría más frecuente histórica,
        // juega max-fuerza-esperada.
        if (s.accionesPendientes[pid] !== undefined || s.paseDeclarado[pid] === true) return
        let planned = get().aiPlannedPremonicion[pid]
        if (planned === undefined) {
          planned = pickPremonicion(s, aiHistory, pid)
          set({ aiPlannedPremonicion: { ...get().aiPlannedPremonicion, [pid]: planned } })
        }
        // Eclipse?
        if (
          s.tramo === 'sexto_sol' &&
          !s.eclipseInvocado &&
          shouldInvokeEclipse({
            state: s,
            playerId: pid,
            deps: DEPS,
            history: aiHistory,
            miPremonicion: planned,
          })
        ) {
          get().dispatch({ type: 'INVOKE_ECLIPSE', playerId: pid })
          return
        }
        const decision = pickAccion(s, pid, DEPS, aiHistory, planned)
        if (decision.type === 'play') {
          get().dispatch({
            type: 'PLAY_HIDDEN',
            playerId: pid,
            cardId: decision.cardId,
            premonicion: planned,
          })
        } else {
          get().dispatch({ type: 'PASS_TURN', playerId: pid, premonicion: planned })
        }
        return
      }
      case 'revelar': {
        get().dispatch({ type: 'REVEAL' })
        return
      }
      case 'revisar_resolucion': {
        // El humano controla cuándo avanzar — la IA NO auto-continúa para que
        // el user tenga tiempo de revisar qué jugó cada uno.
        return
      }
      case 'cierre_tramo': {
        get().dispatch({ type: 'CLOSE_TRAMO' })
        return
      }
      case 'duelo_final': {
        get().dispatch({ type: 'END_GAME' })
        return
      }
      case 'robo': {
        get().dispatch({ type: 'DRAW_BOTH' })
        return
      }
      default:
        return
    }
  },

  goHome: () => {
    set({
      state: undefined,
      lastConfig: undefined,
      aiHistory: { a: emptyHistory(), b: emptyHistory() },
      aiPlannedPremonicion: {},
      privacyShieldActive: false,
      inHome: true,
    })
  },

  acknowledgePrivacy: () => set({ privacyShieldActive: false }),
}))

// ===== Logging =================================================================

interface PostLogPayload {
  ts: string
  seed: number
  config: GameConfig | undefined
  actions: Action[]
  finalState: ReturnType<typeof snapshotForLog>
}

async function postGameLog(payload: PostLogPayload): Promise<void> {
  try {
    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    // best-effort
  }
}

function snapshotForLog(state: GameState) {
  return {
    tramo: state.tramo,
    turno: state.turno,
    subPaso: state.subPaso,
    ganador: state.ganador,
    finalTally: state.finalTally,
    eclipseInvocado: state.eclipseInvocado,
    eclipseInvocador: state.eclipseInvocador,
    historialPremoniciones: state.historialPremoniciones,
    atributosA: state.players.a.atributos,
    atributosB: state.players.b.atributos,
    razaA: state.players.a.raza,
    razaB: state.players.b.raza,
    heroEstadoA: state.players.a.heroEstado,
    heroEstadoB: state.players.b.heroEstado,
  }
}
