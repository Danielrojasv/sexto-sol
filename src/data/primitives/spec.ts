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
  /**
   * Cuenta cartas que matchean `filter`, compara con `op` (gte/lte/eq) y `value`.
   * v3.0.3: `zone` opcional (default `'in_play'`) y `player` opcional permiten contar
   * cartas en zonas distintas a fleet — típicamente `'pozo_astral'` para gating de
   * efectos long-game Zaqe (E4 Visión del Pozo Astral, R1 Reloj del Pozo Áureo).
   * Cuando `zone !== 'in_play'`, el filtro `ShipFilter.controller` se ignora a favor
   * de `player` (porque las cartas en pozo_astral pertenecen al dueño del mazo, no
   * a quien las controla en combate). Engine impl: TODO Phase 1 kernel.
   */
  | {
      kind: 'count_filter'
      filter: ShipFilter
      op: 'gte' | 'lte' | 'eq'
      value: number
      zone?: 'in_play' | 'pozo_astral' | 'disolucion' | 'hand' | 'deck'
      player?: 'self' | 'opponent'
    }
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
  /**
   * v3.0.3: una carta no-ship (relic/tech en juego) elegida por el jugador.
   * Extensión natural de `chosen_ship` para permitir targets sobre engines/permanentes.
   * Aplicación: anti-Reliquia tech (T1 Disolutorio Sqhaguata).
   * Engine impl: TODO Phase 1 kernel — `resolveTargets` debe buscar en zona de relics/tech
   * además de fleet.
   */
  | { kind: 'chosen_permanent'; filter?: PermanentFilter }

export interface PermanentFilter {
  controller?: 'self' | 'opponent' | 'any'
  cardType?: CardType
}

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
  /**
   * v3.0.3: `fromZone` ahora acepta `'pozo_astral'` (canónico v3.0) además de
   * `'graveyard'` (legacy alias mantenido para backward compat hasta deprecación).
   */
  | {
      op: 'exile'
      target: Target
      fromZone?: 'in_play' | 'pozo_astral' | 'graveyard' | 'hand' | 'deck'
    }
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
      /**
       * v3.0.3: `'pozo_astral'` agregada como zona canónica (rename de graveyard
       * per GAME-RULES sec 0). `'graveyard'` se mantiene como alias legacy hasta
       * deprecación completa (Phase 2). Nuevas cartas deben usar `'pozo_astral'`.
       */
      zone: 'deck' | 'pozo_astral' | 'graveyard'
      /**
       * v3.0.2: filter extendido con `costLte`/`costGte` (mismos campos que ShipFilter).
       * Permite restringir el resultado del search por rango de costo. Ej: "buscá una
       * nave Tezhal de costo ≤ 1 y ponla en juego" (Hangar Eterno relic).
       * Engine impl: TODO Phase 1 kernel — el reducer del search debe aplicar el filtro
       * sobre el deck/pozo_astral.
       */
      filter: { cardType?: CardType; race?: Race; costLte?: number; costGte?: number }
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

  // ---- Cost modifier (v3.0.3) ----
  /**
   * Sólo válido en relics con `trigger.kind === 'continuous'`.
   * Mientras el relic esté en juego, modifica el costo de pagar la keyword target
   * (típicamente `refluencia`) en `delta` (negativo = descuento). El costo final
   * se clamp-ea a `minCost` (inviolable — restricción "no revival gratis" Zaqe).
   * Ejemplo: { op: 'cost_modifier', target: { keyword: 'refluencia' }, delta: -1, minCost: 1 }
   * — las Refluencias cuestan 1 menos pero nunca menos de 1.
   * Engine impl: TODO Phase 1 kernel — registrar en `state.costModifiers` al desplegar,
   * limpiar al destruir el relic, aplicar al calcular el costo de revival.
   */
  | {
      op: 'cost_modifier'
      target: { keyword: string }
      delta: number
      minCost: number
    }

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
  // v3.0.3
  'cost_modifier',
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
