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
  /** Keywords activos (Bastión, Desgarro, Vuelo, Premonición, Resonancia, etc.). */
  keywords: readonly string[]
  /** True si esta instancia es el héroe del jugador. Su muerte vuelve al natal. */
  isHero?: boolean
  /** v3.0.1: true si la nave recibió daño durante el turno actual.
   *  Set true en applyDamageToShip; reset false en TURN_START.
   *  Filtro `ShipFilter.wasDamagedThisTurn` consulta este campo. */
  damagedThisTurn?: boolean
  /** v3.0.3: tracking de revival Refluencia. Si true, la próxima muerte va a
   *  Disolución terminal (no vuelve a pozoAstral). */
  revivedFromRefluencia?: boolean
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
  age: Age
  activePlayer: PlayerId
  phase: TurnPhase
  players: { p1: PlayerState; p2: PlayerState }
  sector: SectorState
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
  | { type: 'ACTIVATE_PLANET'; planetId: PlanetId }
  | { type: 'ACTIVATE_HERO_POWER'; abilityId: string }
  | { type: 'DEPLOY_HERO' }
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
   * Engine impl: TODO Phase 1 kernel — emisión durante combat resolver.
   */
  | { type: 'SHIP_ATTACKED'; attackerId: ShipInstanceId; defenderId: ShipInstanceId | PlayerId }
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
