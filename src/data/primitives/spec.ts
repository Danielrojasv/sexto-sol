// Catalog de primitives + tipos del DSL declarativo de cartas.
//
// Las abilities de las cartas se expresan como árboles JSON construidos a partir
// de estos tipos. El interpreter (src/engine/interpreter.ts) ejecuta el árbol
// sobre el GameState. El renderer (src/data/abilityRenderer.ts) traduce el árbol
// a texto para el front.
//
// Reciclado del DSL de myl-game (/opt/myl-game/scripts/card-algorithms/primitives.yaml)
// adaptando zonas y eventos a Sexto Sol:
//   - castle → homeworld
//   - gold_reserve → energy
//   - cemetery → graveyard
//   - response_play / talisman_war (myl stack) — no se portan; sexto-sol no
//     tiene stack de respuestas todavía.
//
// Phase D entrega 22 primitives (cap del rango 15-25 de la spec).

import type { Age, CardType, MechanicCategory, Race } from '@/engine/types'

// ---------------------------------------------------------------------------
// Triggers — cuándo se dispara una ability
// ---------------------------------------------------------------------------

export type Trigger =
  | { kind: 'on_play' }
  | { kind: 'on_destroy' }
  | { kind: 'on_event'; event: TriggerEvent; filter?: TriggerFilter }
  | { kind: 'continuous'; while?: Condition }
  | { kind: 'activated'; window: ActivationWindow; usesPerTurn?: number; cost?: ActivationCost }

export type TriggerEvent =
  | 'ship_damaged'
  | 'ship_destroyed'
  | 'ship_attacked'
  | 'card_played'
  | 'planet_activated'
  | 'phase_start'
  | 'phase_end'
  | 'turn_start'
  | 'age_changed'
  | 'homeworld_damaged'
  | 'card_drawn'

export interface TriggerFilter {
  controller?: 'self' | 'opponent' | 'any'
  /** Para ship_damaged: qué nave activa el trigger. */
  shipFilter?: ShipFilter
  /** Para card_played: tipo de carta jugada. */
  cardType?: CardType
}

export type ActivationWindow =
  | 'recoleccion'
  | 'despliegue'
  | 'combate'
  | 'regroup'
  | 'vigilia'
  | 'any_time'

export interface ActivationCost {
  energy?: number
  sacrificeShip?: ShipFilter
}

// ---------------------------------------------------------------------------
// Conditions — predicates de state (para `continuous.while` o `conditional`)
// ---------------------------------------------------------------------------

export type Condition =
  | { kind: 'always' }
  | { kind: 'in_age'; age: Age }
  | { kind: 'in_age_gte'; age: Age }
  | { kind: 'count_filter'; filter: ShipFilter; op: 'gte' | 'lte' | 'eq'; value: number }
  | { kind: 'self_has_keyword'; keyword: string }
  | { kind: 'controller_energy_gte'; value: number }

// ---------------------------------------------------------------------------
// Targets — qué afecta un Effect
// ---------------------------------------------------------------------------

export type Target =
  | { kind: 'self' }
  | { kind: 'controller' }
  | { kind: 'opponent' }
  | { kind: 'all_ships'; filter?: ShipFilter }
  | { kind: 'chosen_ship'; filter?: ShipFilter }
  | { kind: 'random_ship'; filter?: ShipFilter }
  | { kind: 'homeworld'; player: 'self' | 'opponent' }
  /**
   * v3.0.1: la nave que disparó el evento `ship_attacked` (el atacante).
   * Sólo válido dentro de abilities con `trigger.kind === 'on_event'` y `event === 'ship_attacked'`.
   * Engine impl: TODO Phase 1 kernel.
   */
  | { kind: 'attacker' }

export interface ShipFilter {
  controller?: 'self' | 'opponent' | 'any'
  race?: Race | 'any'
  cardType?: CardType
  keywordsAny?: readonly string[]
  keywordsAll?: readonly string[]
  costLte?: number
  costGte?: number
  /**
   * v3.0.1: si true, sólo matchea naves que recibieron daño durante el turno actual.
   * Resetea con TURN_START. Engine impl: TODO Phase 1 kernel — requiere
   * `damagedThisTurn: boolean` en ShipInstance + reset en reducer.
   */
  wasDamagedThisTurn?: boolean
}

// ---------------------------------------------------------------------------
// Durations — vida útil de un efecto modificador
// ---------------------------------------------------------------------------

export type Duration = 'permanent' | 'end_of_turn' | 'end_of_age' | 'this_turn' | 'next_turn'

// ---------------------------------------------------------------------------
// Effect = árbol de primitives. Las primitives se identifican por `op`.
// ---------------------------------------------------------------------------

export type Effect =
  // ---- Movement ----
  | { op: 'destroy'; target: Target }
  | { op: 'exile'; target: Target; fromZone?: 'in_play' | 'graveyard' | 'hand' | 'deck' }
  | { op: 'bounce_to_hand'; target: Target }
  | { op: 'shuffle_to_deck'; target: Target; owner: 'self' | 'opponent' }

  // ---- Card flow ----
  | { op: 'draw'; player: PlayerSelector; n: number }
  | {
      op: 'discard'
      target: PlayerSelector
      n: number
      selection: 'random' | 'choice'
      filter?: { cardType?: CardType }
    }
  | { op: 'mill'; player: PlayerSelector; n: number }
  | {
      op: 'search'
      owner: PlayerSelector
      zone: 'deck' | 'graveyard'
      filter: { cardType?: CardType; race?: Race }
      count: number
      destination: 'hand' | 'play'
    }

  // ---- Stats / keywords ----
  | {
      op: 'modify_strength'
      target: Target
      kind: 'delta' | 'set'
      value: number
      duration: Duration
    }
  | {
      op: 'modify_hp'
      target: Target
      /**
       * v3.0.1: `set_to_max` restaura HP al máximo de la nave (uses ShipInstance.maxHp).
       * Engine impl: TODO Phase 1 kernel.
       */
      kind: 'delta' | 'set' | 'set_to_max'
      value: number
      duration: Duration
    }
  | { op: 'grant_keyword'; target: Target; keyword: string; duration: Duration }
  | { op: 'remove_ability'; target: Target; duration: Duration }

  // ---- Resources ----
  | { op: 'generate_energy'; player: PlayerSelector; n: number; duration: Duration }
  | { op: 'sacrifice'; target: Target }

  // ---- Combat / damage ----
  | { op: 'damage'; target: Target; amount: number }
  | { op: 'damage_homeworld'; player: PlayerSelector; amount: number }
  | { op: 'prevent_damage'; target: Target; amount: number; duration: Duration }

  // ---- Composition ----
  | { op: 'sequence'; effects: readonly Effect[] }
  | { op: 'conditional'; condition: Condition; thenEffect: Effect; elseEffect?: Effect }
  | { op: 'for_each'; filter: ShipFilter; effect: Effect }

  // ---- Keyword amplification (v3.0.1) ----
  /**
   * Sólo válido en relics con `trigger.kind === 'continuous'`.
   * Mientras el relic esté en juego, cada vez que `keyword` se dispare en una nave
   * controlada por el dueño del relic, su delta de stats se incrementa en `deltaBonus`.
   * Ejemplo: { op: 'keyword_amplifier', keyword: 'kulen', deltaBonus: 1 } convierte
   * Külen +1 fuerza en Külen +2 fuerza permanente.
   * Engine impl: TODO Phase 1 kernel — requiere hook en el sistema de keywords del
   * interpretador.
   */
  | { op: 'keyword_amplifier'; keyword: string; deltaBonus: number }

  // ---- No-op (placeholder / debug) ----
  | { op: 'noop' }

export type PlayerSelector = 'self' | 'opponent'

// ---------------------------------------------------------------------------
// Ability — la unidad declarativa que vive dentro de Card.abilities.
// ---------------------------------------------------------------------------

export interface Ability {
  trigger: Trigger
  /** Categoría que dicta el orden de resolución del event bus. */
  category: MechanicCategory
  /** Si true, salta antes de cualquier categoría (keyword Premonición). */
  premonition?: boolean
  effect: Effect
  /** Override opcional del renderer si el árbol no captura algo del texto narrativo. */
  description?: string
}

// ---------------------------------------------------------------------------
// Catálogo de primitives — used by validator (Phase E) y por documentación.
// ---------------------------------------------------------------------------

export const PRIMITIVE_OPS = [
  'destroy',
  'exile',
  'bounce_to_hand',
  'shuffle_to_deck',
  'draw',
  'discard',
  'mill',
  'search',
  'modify_strength',
  'modify_hp',
  'grant_keyword',
  'remove_ability',
  'generate_energy',
  'sacrifice',
  'damage',
  'damage_homeworld',
  'prevent_damage',
  'sequence',
  'conditional',
  'for_each',
  // v3.0.1
  'keyword_amplifier',
  'noop',
] as const

export type PrimitiveOp = (typeof PRIMITIVE_OPS)[number]

/** Type guard: el árbol declarativo usa solo primitives conocidas. */
export function isKnownOp(op: string): op is PrimitiveOp {
  return (PRIMITIVE_OPS as readonly string[]).includes(op)
}

/** Profundidad máxima de composición (cap por spec §Decisions). */
export const MAX_COMPOSITION_DEPTH = 3

/**
 * Categorías firma por raza — usado por el validador para flag abilities cuya
 * categoría no coincide con la firma de la raza (sin justificación explícita).
 */
export const RACE_SIGNATURE_CATEGORY: Readonly<Record<Race, MechanicCategory>> = {
  wuron: 'reactive',
  tezhal: 'initiative',
  quralan: 'accumulative',
  zaqe: 'post_combat',
}
