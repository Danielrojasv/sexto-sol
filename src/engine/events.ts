// Event bus con resolución por categoría de mecánica.
//
// Toda interacción simultánea sigue este orden (regla central de Sexto Sol):
//   1. Reactivas    (Würon)
//   2. Iniciativa   (Tezhal)
//   3. Acumulativas (Q'ralan)
//   4. Post-combate (Zaqe)
//
// Este orden produce el counter wheel emergente sin lógica hardcoded por raza.
// La keyword `Premonition` permite a una habilidad romper el orden.

import type { GameEvent, GameState, MechanicCategory } from './types'

/** Orden numérico de cada categoría. Menor = resuelve primero. */
const CATEGORY_ORDER: Record<MechanicCategory, number> = {
  reactive: 1,
  initiative: 2,
  accumulative: 3,
  post_combat: 4,
}

export interface HandlerContext {
  /** Identidad del "self" (carta/nave/héroe) que registró el handler. Usado por filters. */
  selfId: string
  /** Identidad del controlador del self. */
  selfController: 'p1' | 'p2'
}

export interface EventHandler {
  /** Tipo de evento que despierta este handler. */
  trigger: GameEvent['type']
  /** Categoría de mecánica — dicta el orden de resolución. */
  category: MechanicCategory
  /** Si true, resuelve antes que cualquier categoría. Solo cartas con keyword Premonición. */
  premonition: boolean
  /** Identidad del registrante (para deduplicación y debugging). */
  context: HandlerContext
  /** Filtro: si retorna false, el handler ignora este evento. */
  filter: (event: GameEvent, ctx: HandlerContext) => boolean
  /** Efecto puro sobre el state. Devuelve nuevo state + nuevos eventos a encolar. */
  effect: (event: GameEvent, state: GameState) => { state: GameState; emit: readonly GameEvent[] }
}

/**
 * Ordena handlers para ejecución sobre un evento dado. Regla:
 *   1. Premonition handlers primero (en orden de registro entre sí).
 *   2. Resto por CATEGORY_ORDER, con orden de registro como desempate.
 */
export function sortHandlers(handlers: readonly EventHandler[]): readonly EventHandler[] {
  return [...handlers]
    .map((h, idx) => ({ h, idx }))
    .sort((a, b) => {
      if (a.h.premonition !== b.h.premonition) {
        return a.h.premonition ? -1 : 1
      }
      // Mismo bucket de premonition: si ambos son premonition, orden de registro
      // (Premonición ignora la categoría — el contrato es "salta antes de cualquier categoría").
      if (a.h.premonition) return a.idx - b.idx
      const catDiff = CATEGORY_ORDER[a.h.category] - CATEGORY_ORDER[b.h.category]
      if (catDiff !== 0) return catDiff
      return a.idx - b.idx
    })
    .map(({ h }) => h)
}

/**
 * Aplica un evento a una lista de handlers, en el orden de resolución correcto.
 * Pure: devuelve un nuevo state y la cola de eventos emitidos por los efectos.
 */
export function dispatch(
  state: GameState,
  event: GameEvent,
  handlers: readonly EventHandler[],
): { state: GameState; emit: readonly GameEvent[] } {
  const ordered = sortHandlers(handlers)
  let currentState = state
  const allEmitted: GameEvent[] = []

  for (const handler of ordered) {
    if (handler.trigger !== event.type) continue
    if (!handler.filter(event, handler.context)) continue
    const result = handler.effect(event, currentState)
    currentState = result.state
    for (const e of result.emit) allEmitted.push(e)
  }

  return { state: currentState, emit: allEmitted }
}

/** Encola eventos al final de pendingEvents. Pure. */
export function enqueueEvents(state: GameState, events: readonly GameEvent[]): GameState {
  if (events.length === 0) return state
  return { ...state, pendingEvents: [...state.pendingEvents, ...events] }
}

/** Saca el primer evento pendiente. Devuelve undefined si la cola está vacía. */
export function dequeueEvent(state: GameState): { event: GameEvent | null; state: GameState } {
  if (state.pendingEvents.length === 0) return { event: null, state }
  const [head, ...rest] = state.pendingEvents
  if (!head) return { event: null, state }
  return { event: head, state: { ...state, pendingEvents: rest } }
}
