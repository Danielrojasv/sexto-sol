// Factory para construir el GameState inicial de una partida.
//
// Setup canónico (GAME-RULES v2.0 §1 + §3):
//   - Mundos natales HP 20.
//   - p1 hand 4, p2 hand 5 (+1 compensación segundo jugador).
//   - 3 planetas neutrales con Don revelado.
//   - Edad I, fase Recolección.
//   - Después del setup, se aplica el primer TURN_START a p1: se le acredita
//     1 energía (mundo natal +1) y roba 1 carta.

import { createRng } from './rng'
import type {
  Age,
  Card,
  GameState,
  HeroDefinition,
  HeroInstance,
  PlanetGift,
  PlanetState,
  PlayerState,
  Race,
  TurnPhase,
} from './types'

const HOMEWORLD_HP = 20
const STARTING_HAND_SIZE = 4
const SECOND_PLAYER_BONUS_CARD = 1
const HOMEWORLD_ENERGY_INCOME = 1
const PHASE_RECOLECCION: TurnPhase = 'recoleccion'
const AGE_DESPERTAR: Age = 1

export interface NewGameSetup {
  seed: number
  p1Race: Race
  p2Race: Race
  /** Mazo del jugador 1. Si se omite, se asume mazo vacío (test/playtest). */
  p1Deck?: readonly Card[]
  p2Deck?: readonly Card[]
  p1Hero?: HeroDefinition
  p2Hero?: HeroDefinition
  /** 3 Dones revelados al setup. Si se omite, se crean placeholders. */
  planetGifts?: readonly PlanetGift[]
}

function placeholderGifts(): readonly PlanetGift[] {
  return [
    { id: 'gift_archive', name: 'Don del Archivo', description: 'Robá 2 cartas.' },
    { id: 'gift_core', name: 'Don del Núcleo', description: '+5 HP máximo a tu mundo natal.' },
    { id: 'gift_forge', name: 'Don de la Forja', description: 'Buscá una Tecnología en tu mazo.' },
  ]
}

function buildPlanets(gifts: readonly PlanetGift[]): readonly PlanetState[] {
  return gifts.map(
    (gift, i): PlanetState => ({
      id: `planet_${i + 1}`,
      name: `Planeta ${i + 1}`,
      gift,
      exhausted: false,
      exhaustedBy: null,
    }),
  )
}

function makeHero(def: HeroDefinition | undefined): HeroInstance | null {
  if (!def) return null
  return {
    defId: def.id,
    inHomeworld: true,
    damageTaken: 0,
    reactivationCooldown: 0,
    powersUsedThisTurn: 0,
  }
}

/**
 * Saca las primeras `count` cartas del mazo y las deja en mano. Devuelve hand y
 * el mazo restante. Si el mazo es más chico, llena con un placeholder consistente
 * para mantener el shape estructural de los tests (Phase 1 no tenía card data real).
 */
function drawSetupHand(
  deck: readonly Card[],
  count: number,
  race: Race,
): { hand: readonly Card[]; deck: readonly Card[] } {
  if (deck.length >= count) {
    return { hand: deck.slice(0, count), deck: deck.slice(count) }
  }
  // Mazo insuficiente: placeholders para llegar al count (compatible con tests Phase 1).
  const placeholders: Card[] = Array.from({ length: count - deck.length }, () => ({
    id: 'placeholder',
    name: 'Placeholder',
    type: 'ship',
    race,
    cost: 0,
    rarity: 'common',
    keywords: [],
    abilities: [],
  }))
  return { hand: [...deck, ...placeholders], deck: [] }
}

function emptyPlayer(
  race: Race,
  handSize: number,
  deck: readonly Card[],
  hero: HeroInstance | null,
): PlayerState {
  const drawn = drawSetupHand(deck, handSize, race)
  return {
    race,
    homeworld: { hp: HOMEWORLD_HP, maxHp: HOMEWORLD_HP },
    hero,
    hand: drawn.hand,
    deck: drawn.deck,
    graveyard: [],
    energy: 0,
    fleet: [],
  }
}

/**
 * Aplica el primer TURN_START a p1: acredita energía base (mundo natal +1)
 * y le hace robar 1 carta. Si el mazo está vacío al robar → outcome decking_out.
 *
 * Esta función vive acá (no en reducer.ts) para evitar dependencia circular y
 * para reflejar que el "estado inicial canónico" YA tiene el primer turn-start
 * aplicado, igual que cualquier otro turn start futuro.
 */
function applyFirstTurnStart(state: GameState): GameState {
  const p1 = state.players.p1
  // Si el mazo está vacío, decking out instantáneo. (Caso degenerado: mazo vacío al inicio.)
  if (p1.deck.length === 0) {
    return {
      ...state,
      outcome: { kind: 'win', winner: 'p2', reason: 'decking_out' },
    }
  }
  const drawn = p1.deck[0] as Card
  const newHand = [...p1.hand, drawn]
  return {
    ...state,
    players: {
      ...state.players,
      p1: {
        ...p1,
        hand: newHand,
        deck: p1.deck.slice(1),
        energy: HOMEWORLD_ENERGY_INCOME,
      },
    },
  }
}

/**
 * Construye un GameState inicial canónico:
 *   - Setup: HP 20, manos 4/5, 3 planetas con Don, Edad I, phase Recolección.
 *   - Primer TURN_START aplicado a p1 (energía 1, +1 carta robada).
 *
 * Mismo seed → mismo state (determinismo).
 */
export function createInitialState(setup: NewGameSetup): GameState {
  const rng = createRng(setup.seed)
  const gifts =
    setup.planetGifts && setup.planetGifts.length > 0 ? setup.planetGifts : placeholderGifts()

  const p1 = emptyPlayer(
    setup.p1Race,
    STARTING_HAND_SIZE,
    setup.p1Deck ?? [],
    makeHero(setup.p1Hero),
  )
  const p2 = emptyPlayer(
    setup.p2Race,
    STARTING_HAND_SIZE + SECOND_PLAYER_BONUS_CARD,
    setup.p2Deck ?? [],
    makeHero(setup.p2Hero),
  )

  const setupState: GameState = {
    seed: setup.seed,
    rng: rng.snapshot(),
    turn: 1,
    age: AGE_DESPERTAR,
    activePlayer: 'p1',
    phase: PHASE_RECOLECCION,
    players: { p1, p2 },
    sector: { planets: buildPlanets(gifts) },
    pendingEvents: [],
    log: [],
    outcome: { kind: 'in_progress' },
  }

  return applyFirstTurnStart(setupState)
}
