// Tipos del engine de Sexto Sol — alineado a GAME-RULES.md v3.0.
//
// Cambios respecto a v2.0 (ver GAME-RULES sec 0):
//   - Sin Edades (Age type removido).
//   - Sin planetas neutrales (SectorState/PlanetState removidos).
//   - Sin héroes pasivos en mundo natal (HeroInstance/HeroDefinition removidos).
//     Las legendarias son Naves normales (rarity='legendary', max 1 copia).
//   - Phase 'vigilia' renombrada a 'eclipse'.
//   - Energía automática: +1/turno hasta cap 10, reset al cap cada turno.
//   - Cementerio → Pozo Astral (rename, ya cubierto en v3.0.3).
//
// Determinismo total: todo el state pasa por un reducer puro `(state, action) => newState`.
// Sin mutación in-place. Sin LLM en el motor de reglas. Sin browser deps en engine.

import type { RngState } from './rng'
// Re-export Ability del catálogo de primitives. Card.abilities lo usa.
// Cuidado: orden de imports — types.ts es importado por primitives/spec.ts,
// así que el tipo Ability vive ahí y se importa acá como type-only.
export type { Ability } from '@/data/primitives/spec'
import type { Ability } from '@/data/primitives/spec'

// ---- Identidades del juego ------------------------------------------------

export type PlayerId = 'p1' | 'p2'

/** Las 4 razas inventadas del set base. Las precolombinas reales son ecos en lore. */
export type Race = 'quralan' | 'wuron' | 'tezhal' | 'zaqe'

/**
 * Categoría de mecánica. Dicta el orden de resolución del event bus:
 * Reactiva → Iniciativa → Acumulativa → Post-combate.
 * Es la regla central que produce el counter wheel emergente sin lógica
 * hardcodeada por raza.
 */
export type MechanicCategory = 'reactive' | 'initiative' | 'accumulative' | 'post_combat'

/** Las 5 fases del turno (v3.0). Recolección → Despliegue → Combate → Regroup → Eclipse. */
export type TurnPhase = 'recoleccion' | 'despliegue' | 'combate' | 'regroup' | 'eclipse'

/** Identificador opaco de una nave instanciada en el campo. */
export type ShipInstanceId = string

// ---- Cartas y unidades ----------------------------------------------------

export type CardType = 'ship' | 'weapon' | 'tech' | 'relic' | 'event'

export type Rarity = 'common' | 'rare' | 'legendary'

/** Definición estática de una carta (vive en data/, instanciable durante la partida). */
export interface Card {
  id: string
  name: string
  type: CardType
  race: Race
  cost: number
  rarity: Rarity
  /** Solo para Naves: fuerza base. */
  strength?: number
  /** Solo para Naves: HP base. */
  hp?: number
  /** Lista de keywords (Bastión, Desgarro, Resonancia, Premonición, Vuelo, etc.). */
  keywords: readonly string[]
  /** Abilities declarativas (árbol JSON de primitives). Vacío para vanilla ships. */
  abilities: readonly Ability[]
  /** Texto narrativo al pie de la carta. */
  flavorText?: string
  /** Placeholder hasta Phase 4 (arte profesional + Kickstarter). */
  artUrl?: string
  /** Posición de la carta en el sprite sheet de su raza. Grid 4 cols × 3 rows.
   *  Frontend renderiza con background-image: /art/<race>.jpg + background-position. */
  artSlot?: { row: number; col: number }
}

export interface ShipInstance {
  instanceId: ShipInstanceId
  cardId: string
  controller: PlayerId
  /** Fuerza base. Buffs permanentes (Külen, etc.) la modifican directamente.
   *  La fuerza EFECTIVA (incluye derive como Formación Solar) se computa via
   *  `getEffectiveStrength(ship, state)` de `src/engine/derive/strength.ts`. */
  strength: number
  /** HP máximo de la nave (no cambia por combate, solo por buffs). */
  maxHp: number
  /** HP actual (puede modificarse por daño/curación). */
  hp: number
  /** Daño acumulado desde que entró al campo. Usado por Külen. */
  damageTaken: number
  /** Keywords activos (Bastión, Desgarro, Vuelo, Premonición, Embate, etc.). */
  keywords: readonly string[]
  /** v3.0.1: true si la nave recibió daño durante el turno actual.
   *  Set true en applyDamageToShip; reset false en TURN_START.
   *  Filtro `ShipFilter.wasDamagedThisTurn` consulta este campo. */
  damagedThisTurn?: boolean
  /** v3.0.3: tracking de revival Refluencia. Si true, la próxima muerte va a
   *  Disolución terminal (no vuelve a pozoAstral). */
  revivedFromRefluencia?: boolean
  /** v3.0 (Mareo de invocación): true cuando una nave entra al campo. Le
   *  impide atacar el turno que entra, salvo que tenga keyword Embate. Se
   *  resetea (false) en TURN_START del controller. */
  summoningSickness?: boolean
  /** v3.0: true si la nave ya atacó este turno. Una nave sólo puede atacar
   *  una vez por turno (regla 11.1). Reset false en TURN_START del controller. */
  hasAttackedThisTurn?: boolean
}

// ---- Estado por jugador ---------------------------------------------------

export interface PlayerState {
  race: Race
  homeworld: { hp: number; maxHp: number }
  hand: readonly Card[]
  deck: readonly Card[]
  graveyard: readonly Card[]
  /** Energía gastable este turno. Reset al cap creciente en TURN_START. */
  energy: number
  fleet: readonly ShipInstance[]
  /** v3.0.3 Refluencia: naves Zaqe con keyword `refluencia` que murieron y
   *  pueden revivirse en fase Despliegue del owner via acción PAY_REFLUENCIA.
   *  Su muerte siguiente va a `disolucion` (terminal, no recuperable). */
  pozoAstral: readonly ShipInstance[]
  /** v3.0.3 Disolución: naves que ya no pueden volver al juego por ningún medio.
   *  Cementerio terminal. NO se expone via API de search/move_to_zone. */
  disolucion: readonly ShipInstance[]
  /** v3.0.3 Reliquias en juego (zona separada de fleet, no atacable). */
  relicsInPlay: readonly ShipInstance[]
  /** v3.0.3 Tecnologías "permanentes" en juego (zona separada de fleet). */
  techInPlay: readonly ShipInstance[]
}

/** v3.0.3 Cost modifier registrado por relics como R2 Espejo del Reflujo Áureo. */
export interface CostModifier {
  /** Identidad de la fuente del modifier (instanceId del relic). Permite limpiar
   *  el modifier al destruir el relic. */
  source: ShipInstanceId
  /** Ámbito del modifier. `refluencia`: descuento al revival via PAY_REFLUENCIA.
   *  `play`: descuento al jugar la carta target. */
  scope: 'refluencia' | 'play'
  /** Keyword/cardType al que aplica el modifier (ej: `refluencia`, `tezhal`). */
  target: { keyword?: string; cardType?: CardType; race?: Race }
  /** Delta aplicado al costo. Negativo = descuento. */
  amount: number
  /** Costo mínimo después del clamp. Mínimo inviolable (no revival/play gratis). */
  minCost: number
}

/** v3.0.1 Keyword amplifier registrado por relics como Trono de Lhülkan
 *  ("cada vez que keyword X dispara delta de stats en nave del owner, sumar
 *  deltaBonus al delta"). */
export interface KeywordAmplifier {
  source: ShipInstanceId
  /** Player cuyas naves se ven afectadas (típicamente el owner del relic). */
  controller: PlayerId
  /** Keyword amplificada (ej: 'kulen'). */
  keyword: string
  /** Suma extra al delta de fuerza/HP del trigger de la keyword. */
  deltaBonus: number
}

// ---- Estado global --------------------------------------------------------

export type WinReason = 'homeworld_destroyed' | 'decking_out' | 'concession'
export type DrawReason = 'simultaneous_homeworld_destruction'

export type GameOutcome =
  | { kind: 'in_progress' }
  | { kind: 'win'; winner: PlayerId; reason: WinReason }
  | { kind: 'draw'; reason: DrawReason }

export interface GameState {
  /** Seed inmutable de la partida. */
  seed: number
  /** Estado actual del PRNG. Avanza con cada operación aleatoria. */
  rng: RngState
  turn: number
  activePlayer: PlayerId
  phase: TurnPhase
  players: { p1: PlayerState; p2: PlayerState }
  pendingEvents: readonly GameEvent[]
  log: readonly GameAction[]
  outcome: GameOutcome
  /**
   * Catálogo inmutable de definiciones de cartas en la partida — todas las cards
   * que pueden aparecer (ambos decks iniciales). Indexado por cardId.
   *
   * Razón: cuando una nave se juega y sale de hand, su definición ya no está
   * referenciable desde players.hand/deck/graveyard. El intérprete y el event
   * bus necesitan resolver `Ship.cardId → Card` para ejecutar abilities sobre
   * naves en fleet. cardRegistry es ese mapeo persistente.
   *
   * 100% JSON-serializable (Record plain). Read-only desde el reducer (sólo
   * createInitialState lo construye).
   */
  cardRegistry: Readonly<Record<string, Card>>
  /**
   * v3.0.3 Cost modifiers activos. Cada relic con `op: 'cost_modifier'` se
   * registra acá al desplegarse y se limpia al destruirse. Consultado al
   * calcular costo de revival (PAY_REFLUENCIA) o de jugar una carta.
   */
  costModifiers: readonly CostModifier[]
  /**
   * v3.0.1 Keyword amplifiers activos. Relics con `op: 'keyword_amplifier'`
   * registran su deltaBonus acá al desplegarse. Külen y otras mecánicas firma
   * lo consultan al calcular el delta del trigger.
   */
  keywordAmplifiers: readonly KeywordAmplifier[]
}

// ---- Acciones (lo que el jugador puede hacer) -----------------------------

export interface AttackTarget {
  kind: 'ship' | 'homeworld'
  /** Si kind='ship', el instanceId de la nave objetivo. Si 'homeworld', el PlayerId dueño. */
  ref: ShipInstanceId | PlayerId
}

export type GameAction =
  | { type: 'PLAY_CARD'; cardId: string; targets?: readonly string[] }
  | { type: 'DECLARE_ATTACK'; attackerShipId: ShipInstanceId; target: AttackTarget }
  | { type: 'ACTIVATE_ABILITY'; sourceId: string; abilityId: string }
  | {
      /** v3.0.3 Tezhal Initiative: activa una carta con keyword `ignicion`
       *  sacrificando una nave Tezhal aliada. Reemplaza PLAY_CARD para cartas
       *  tech/event con esta keyword (handlePlayCard sólo procesa ships).
       *  Para cartas ship con `ignicion`, también puede usarse. */
      type: 'ACTIVATE_IGNICION'
      cardId: string
      sacrificeShipId: ShipInstanceId
    }
  | {
      /** v3.0.3 Zaqe Post-combat: paga el costo de revival de una nave Zaqe
       *  que está en `pozoAstral` para devolverla al campo con stats base
       *  y HP máximo. Sólo en fase `despliegue` del owner. */
      type: 'PAY_REFLUENCIA'
      shipId: ShipInstanceId
    }
  | { type: 'END_PHASE' }
  | { type: 'CONCEDE'; player: PlayerId }

// ---- Eventos del bus ------------------------------------------------------

export type GameEvent =
  | { type: 'SHIP_DESTROYED'; shipId: ShipInstanceId; cause: 'combat' | 'sacrifice' | 'ability' }
  | { type: 'SHIP_DAMAGED'; shipId: ShipInstanceId; amount: number; source: string }
  /**
   * v3.0.1: emitido cuando una nave ataca a otra (antes de aplicar el daño).
   * `attackerId` es la nave que ataca; `defenderId` puede ser shipId o homeworld owner.
   */
  | { type: 'SHIP_ATTACKED'; attackerId: ShipInstanceId; defenderId: ShipInstanceId | PlayerId }
  | { type: 'HOMEWORLD_DAMAGED'; player: PlayerId; amount: number; source: string }
  | { type: 'CARD_DRAWN'; player: PlayerId }
  | { type: 'PHASE_START'; phase: TurnPhase; player: PlayerId }
  | { type: 'PHASE_END'; phase: TurnPhase; player: PlayerId }
  | { type: 'TURN_START'; turn: number; player: PlayerId }
  | { type: 'CARD_PLAYED'; cardId: string; player: PlayerId }
  | { type: 'GAME_OVER'; outcome: Exclude<GameOutcome, { kind: 'in_progress' }> }
