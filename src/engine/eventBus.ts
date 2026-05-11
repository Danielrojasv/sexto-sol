// Bridge entre el reducer y el bus primitivo de `events.ts`.
//
// El reducer emite GameEvents (SHIP_DAMAGED, SHIP_ATTACKED, SHIP_DESTROYED, ...).
// Este módulo deriva handlers desde abilities de cartas con triggers reactivos
// (`trigger.kind === 'on_event'`) y los pasa al `dispatch()` del bus primitivo,
// ordenado por MechanicCategory (con Premonition rompiendo orden).
//
// Mantiene las restricciones de portabilidad: pure, sin browser APIs, sin Map/Set
// en state, RNG inyectable via state.
//
// Diseño:
//   - `gameTypeToTriggerEvent` mapea constantes engine → strings del DSL.
//   - `deriveHandlersFromAbilities(state)` escanea fleet de ambos jugadores y
//     emite un EventHandler por cada ability con trigger 'on_event' matching.
//   - `runTriggers(state, event)` deriva handlers + dispatch + retorna nuevo
//     state + lista de events emitidos por handlers (cascade — el caller decide
//     re-procesarlos via mismo runTriggers con cap de profundidad).
//
// Mecánicas firma con keyword pero sin ability JSON (Külen, Refluencia, etc.)
// se implementan en Commit 2 — `deriveHandlersFromKeywords(state)` se agregará
// en ese commit y se llamará desde `deriveAllHandlers`.

import { dispatch, type EventHandler, type HandlerContext } from './events'
import { executeEffect } from './interpreter'
import { KW_KULEN, buildKulenHandler } from './mechanics/kulen'
import type {
  Ability,
  Trigger,
  TriggerEvent,
  TriggerFilter,
} from '@/data/primitives/spec'
import type { GameEvent, GameState, MechanicCategory, ShipInstance } from './types'

/** Mapping de constantes engine (UPPER_SNAKE) → strings del DSL (lower_snake). */
export const TRIGGER_EVENT_TO_GAME_TYPE: Readonly<Record<TriggerEvent, GameEvent['type']>> = {
  ship_damaged: 'SHIP_DAMAGED',
  ship_destroyed: 'SHIP_DESTROYED',
  ship_attacked: 'SHIP_ATTACKED',
  card_played: 'CARD_PLAYED',
  planet_activated: 'PLANET_ACTIVATED',
  phase_start: 'PHASE_START',
  phase_end: 'PHASE_END',
  turn_start: 'TURN_START',
  age_changed: 'AGE_CHANGED',
  homeworld_damaged: 'HOMEWORLD_DAMAGED',
  card_drawn: 'CARD_DRAWN',
}

/** Profundidad máxima de re-procesamiento de eventos emitidos por handlers. */
export const MAX_TRIGGER_CASCADE_DEPTH = 16

/**
 * Construye el filter del EventHandler para una ability con trigger on_event.
 * El filter chequea el `TriggerFilter` del DSL (controller, shipFilter, cardType).
 */
function buildAbilityFilter(
  triggerFilter: TriggerFilter | undefined,
): (event: GameEvent, ctx: HandlerContext) => boolean {
  return (_event, ctx) => {
    if (!triggerFilter) return true
    if (triggerFilter.controller && triggerFilter.controller !== 'any') {
      // Para SHIP_DAMAGED/DESTROYED/ATTACKED el "controller" del evento se infiere
      // de quién es dueño del ship referenciado. Sin acceso al state acá, el
      // filtro es permisivo para `controller`. Validación más fina vive en el
      // effect mismo (interpreter resuelve targets con state actual).
      // TODO Phase 1 kernel siguiente: filtros de controller a nivel handler.
      void ctx
    }
    return true
  }
}

/**
 * Convierte una ability con `trigger.kind === 'on_event'` en un EventHandler.
 * El handler:
 *   - tiene `trigger` = constante engine derivada del DSL (SHIP_DAMAGED, etc.).
 *   - `effect` invoca `executeEffect(ability.effect, state, ctx)` del interpreter.
 *   - `context` incluye selfId (instanceId del ship) y selfController.
 */
function abilityToHandler(
  ability: Ability,
  ship: ShipInstance,
  sourceCardId: string,
): EventHandler | null {
  const trigger: Trigger = ability.trigger
  if (trigger.kind !== 'on_event') return null
  const gameType = TRIGGER_EVENT_TO_GAME_TYPE[trigger.event]
  const filter = buildAbilityFilter(trigger.filter)
  const effectFn = (event: GameEvent, state: GameState): { state: GameState; emit: readonly GameEvent[] } => {
    // Para handlers reactivos, populate attackerShipId cuando aplique.
    const attackerShipId =
      event.type === 'SHIP_ATTACKED' ? event.attackerId : undefined
    const result = executeEffect(ability.effect, state, {
      controller: ship.controller,
      selfShipId: ship.instanceId,
      sourceCardId,
      ...(attackerShipId ? { attackerShipId } : {}),
    })
    return { state: result.state, emit: result.emit }
  }
  return {
    trigger: gameType,
    category: ability.category as MechanicCategory,
    premonition: ability.premonition === true,
    context: { selfId: ship.instanceId, selfController: ship.controller },
    filter,
    effect: effectFn,
  }
}

/**
 * Deriva handlers desde fleet de ambos jugadores. Para cada nave, busca en su
 * Card definition las abilities con trigger `on_event` y construye un handler.
 *
 * Las abilities con `trigger.kind === 'on_play'` siguen disparándose
 * directamente desde el reducer en `handlePlayCard` (backward compat).
 * Las abilities con `trigger.kind === 'continuous'` no se evalúan acá (derive
 * layer las consulta on-read, ver Commit 2 / FS).
 * Las abilities con `trigger.kind === 'activated'` no se disparan automáticamente
 * — sólo via acción explícita del usuario.
 */
export function deriveHandlersFromAbilities(state: GameState): readonly EventHandler[] {
  const handlers: EventHandler[] = []
  for (const owner of ['p1', 'p2'] as const) {
    for (const ship of state.players[owner].fleet) {
      const card = state.cardRegistry[ship.cardId]
      if (!card) continue
      for (const ability of card.abilities) {
        const h = abilityToHandler(ability, ship, card.id)
        if (h) handlers.push(h)
      }
    }
  }
  return handlers
}

/**
 * Resultado de procesar un evento via el bus: nuevo state + eventos emitidos
 * por handlers (cascade). El caller (reducer) decide si re-procesarlos.
 */
export interface RunTriggersResult {
  state: GameState
  emit: readonly GameEvent[]
}

/**
 * Procesa un evento a través del bus completo:
 *   1. Deriva handlers desde state (abilities + futuras keywords firma).
 *   2. Llama `dispatch()` (que ordena por categoría + Premonition).
 *   3. Devuelve nuevo state + eventos emitidos por handlers.
 *
 * No re-procesa cascade — eso es responsabilidad del caller (con cap de
 * profundidad para evitar loops infinitos).
 */
export function runTriggers(state: GameState, event: GameEvent): RunTriggersResult {
  const handlers = deriveAllHandlers(state)
  const result = dispatch(state, event, handlers)
  return { state: result.state, emit: result.emit }
}

/**
 * Deriva handlers desde keywords firma de las naves. Las mecánicas firma
 * (Külen, etc.) se modelan acá en vez de en ability JSON porque las cartas
 * con la keyword no traen ability declarada — la lógica vive en el engine.
 *
 * - Külen (Würon, reactive): on_event SHIP_DAMAGED + survive → +1 strength
 *   permanent. Implementación en `src/engine/mechanics/kulen.ts`.
 * - Refluencia (Zaqe, post_combat): manejado fuera del bus en killShip
 *   (death routing a pozoAstral).
 * - Formación Solar (Q'ralan, accumulative): manejado via derive layer
 *   (getEffectiveStrength), NO via bus.
 * - Ignición (Tezhal, initiative): action explícita ACTIVATE_IGNICION, NO
 *   via bus reactivo.
 */
export function deriveHandlersFromKeywords(state: GameState): readonly EventHandler[] {
  const handlers: EventHandler[] = []
  for (const owner of ['p1', 'p2'] as const) {
    for (const ship of state.players[owner].fleet) {
      if (ship.keywords.includes(KW_KULEN)) {
        handlers.push(buildKulenHandler(ship))
      }
    }
  }
  return handlers
}

/**
 * Punto de extensión central. Combina handlers de abilities JSON + keywords
 * firma del engine. Ordenados luego por `dispatch()` según MechanicCategory
 * + Premonición.
 */
export function deriveAllHandlers(state: GameState): readonly EventHandler[] {
  return [...deriveHandlersFromAbilities(state), ...deriveHandlersFromKeywords(state)]
}

/**
 * Helper para uso desde el reducer: dado un state y un evento recién emitido,
 * procesa el evento + procesa cascade (con cap). Retorna el state final.
 *
 * Usage en reducer:
 *   state = processEventWithCascade(state, event, eventsAcc)
 * donde `eventsAcc` acumula todos los eventos (originales + cascade) para
 * exposición al UI.
 */
export function processEventWithCascade(
  state: GameState,
  event: GameEvent,
  emittedEvents: GameEvent[],
  depth = 0,
): GameState {
  if (depth >= MAX_TRIGGER_CASCADE_DEPTH) return state
  const { state: next, emit } = runTriggers(state, event)
  let acc = next
  for (const cascadeEvent of emit) {
    emittedEvents.push(cascadeEvent)
    acc = processEventWithCascade(acc, cascadeEvent, emittedEvents, depth + 1)
  }
  return acc
}
