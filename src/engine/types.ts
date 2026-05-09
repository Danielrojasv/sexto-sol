// Tipos del engine de Sexto Sol. Aliados a GAME-RULES.md v2.0 + ARCHITECTURE.md.
//
// Determinismo total: todo el state pasa por un reducer puro `(state, action) => newState`.
// Sin mutación in-place. Sin LLM en el motor de reglas.

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

/** Edad I "El Despertar", II "Las Estrellas Recuerdan", III "El Sexto Sol". */
export type Age = 1 | 2 | 3

/** Las 5 fases del turno. Recolección → Despliegue → Combate → Regroup → Vigilia. */
export type TurnPhase = 'recoleccion' | 'despliegue' | 'combate' | 'regroup' | 'vigilia'

/** Identificador opaco de una nave instanciada en el campo. */
export type ShipInstanceId = string

/** Identificador opaco de un planeta neutral del sector estelar. */
export type PlanetId = string

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
  /** Fuerza actual (puede modificarse por Külen, Formación Solar, etc.). */
  strength: number
  /** HP máximo de la nave (no cambia por combate, solo por buffs). */
  maxHp: number
  /** HP actual (puede modificarse por daño/curación). */
  hp: number
  /** Daño acumulado desde que entró al campo. Usado por Külen. */
  damageTaken: number
  /** Keywords activos (Bastión, Desgarro, Vuelo, Premonición, Resonancia, etc.). */
  keywords: readonly string[]
  /** True si esta instancia es el héroe del jugador. Su muerte vuelve al natal. */
  isHero?: boolean
}

// ---- Héroe ----------------------------------------------------------------

export interface HeroDefinition {
  id: string
  name: string
  race: Race
  /** Habilidades pasivas mientras el héroe está en juego (incluye Edad I). */
  passives: readonly string[]
  /** Hero powers activables (1-2 por turno) en Edad I. */
  activePowers: readonly string[]
  /** Stats al desplegarse en el campo (Edad II+). */
  combatStrength: number
  combatHp: number
}

export interface HeroInstance {
  defId: string
  /** Si está en el mundo natal (Edad I siempre, II opcional, III opcional). */
  inHomeworld: boolean
  /** Daño acumulado mientras está desplegado. */
  damageTaken: number
  /** Cooldown post-muerte: turnos restantes hasta poder reactivarse. 0 = disponible. */
  reactivationCooldown: number
  /** Cuántos hero powers activó este turno (cap 2 en Edad I). */
  powersUsedThisTurn: number
}

// ---- Planetas + Dones -----------------------------------------------------

/**
 * Don de un planeta neutral. Activarlo cuesta 1 energía y otorga +1 esa fase,
 * además de su efecto único. El planeta queda agotado hasta el próximo turno
 * del jugador que lo activó.
 */
export interface PlanetGift {
  id: string
  name: string
  description: string
}

export interface PlanetState {
  id: PlanetId
  name: string
  gift: PlanetGift
  exhausted: boolean
  exhaustedBy: PlayerId | null
}

export interface SectorState {
  /** 3 planetas neutrales con Don revelado al setup. Lista expandible en sets futuros. */
  planets: readonly PlanetState[]
}

// ---- Estado por jugador ---------------------------------------------------

export interface PlayerState {
  race: Race
  homeworld: { hp: number; maxHp: number }
  hero: HeroInstance | null
  hand: readonly Card[]
  deck: readonly Card[]
  graveyard: readonly Card[]
  /** Energía gastable este turno (no acumula entre turnos). */
  energy: number
  fleet: readonly ShipInstance[]
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
  age: Age
  activePlayer: PlayerId
  phase: TurnPhase
  players: { p1: PlayerState; p2: PlayerState }
  sector: SectorState
  pendingEvents: readonly GameEvent[]
  log: readonly GameAction[]
  outcome: GameOutcome
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
  | { type: 'ACTIVATE_PLANET'; planetId: PlanetId }
  | { type: 'ACTIVATE_HERO_POWER'; abilityId: string }
  | { type: 'DEPLOY_HERO' }
  | { type: 'ACTIVATE_ABILITY'; sourceId: string; abilityId: string }
  | { type: 'END_PHASE' }
  | { type: 'CONCEDE'; player: PlayerId }

// ---- Eventos del bus ------------------------------------------------------

export type GameEvent =
  | { type: 'SHIP_DESTROYED'; shipId: ShipInstanceId; cause: 'combat' | 'sacrifice' | 'ability' }
  | { type: 'SHIP_DAMAGED'; shipId: ShipInstanceId; amount: number; source: string }
  | { type: 'HOMEWORLD_DAMAGED'; player: PlayerId; amount: number; source: string }
  | { type: 'CARD_DRAWN'; player: PlayerId }
  | { type: 'PLANET_ACTIVATED'; planetId: PlanetId; activatedBy: PlayerId }
  | { type: 'PHASE_START'; phase: TurnPhase; player: PlayerId }
  | { type: 'PHASE_END'; phase: TurnPhase; player: PlayerId }
  | { type: 'TURN_START'; turn: number; player: PlayerId }
  | { type: 'AGE_CHANGED'; from: Age; to: Age }
  | { type: 'CARD_PLAYED'; cardId: string; player: PlayerId }
  | { type: 'HERO_DEPLOYED'; player: PlayerId }
  | { type: 'HERO_RETURNED'; player: PlayerId }
  | { type: 'GAME_OVER'; outcome: Exclude<GameOutcome, { kind: 'in_progress' }> }
