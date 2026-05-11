// Factory para construir el GameState inicial de una partida — GAME-RULES v3.0.
//
// Setup canónico (sec 1):
//   - Mundos natales HP 20.
//   - p1 hand 4, p2 hand 5 (+1 compensación segundo jugador).
//   - Energía inicial: turno 1 → 1 (cap creciente +1/turno hasta 10).
//   - Fase Recolección, p1 activePlayer.
//   - Después del setup, primer TURN_START aplicado a p1: energía=1, roba 1 carta.
//   - Sin planetas neutrales (eliminados en v3.0).
//   - Sin Edades (eliminadas en v3.0).
//   - Sin héroes pasivos (eliminados en v3.0; legendarias son naves normales).

import { createRng } from './rng'
import type { Card, GameState, PlayerState, Race, TurnPhase } from './types'

const HOMEWORLD_HP = 20
const STARTING_HAND_SIZE = 4
const SECOND_PLAYER_BONUS_CARD = 1
const TURN_1_ENERGY = 1
const PHASE_RECOLECCION: TurnPhase = 'recoleccion'

export interface NewGameSetup {
  seed: number
  p1Race: Race
  p2Race: Race
  /** Mazo del jugador 1. Si se omite, se asume mazo vacío (test/playtest). */
  p1Deck?: readonly Card[]
  p2Deck?: readonly Card[]
}

/**
 * Saca las primeras `count` cartas del mazo y las deja en mano. Devuelve hand y
 * el mazo restante. Si el mazo es más chico, llena con un placeholder consistente
 * para mantener el shape estructural de los tests.
 */
function drawSetupHand(
  deck: readonly Card[],
  count: number,
  race: Race,
): { hand: readonly Card[]; deck: readonly Card[] } {
  if (deck.length >= count) {
    return { hand: deck.slice(0, count), deck: deck.slice(count) }
  }
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
): PlayerState {
  const drawn = drawSetupHand(deck, handSize, race)
  return {
    race,
    homeworld: { hp: HOMEWORLD_HP, maxHp: HOMEWORLD_HP },
    hand: drawn.hand,
    deck: drawn.deck,
    graveyard: [],
    energy: 0,
    fleet: [],
    pozoAstral: [],
    disolucion: [],
    relicsInPlay: [],
    techInPlay: [],
  }
}

/**
 * Aplica el primer TURN_START a p1: acredita energía base (turno 1 = 1) y
 * le hace robar 1 carta. Si el mazo está vacío al robar → outcome decking_out.
 *
 * Esta función vive acá (no en reducer.ts) para evitar dependencia circular y
 * para reflejar que el "estado inicial canónico" YA tiene el primer turn-start
 * aplicado, igual que cualquier otro turn start futuro.
 */
function applyFirstTurnStart(state: GameState): GameState {
  const p1 = state.players.p1
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
        energy: TURN_1_ENERGY,
      },
    },
  }
}

/**
 * Construye un GameState inicial canónico v3.0:
 *   - HP 20, manos 4/5, sin planetas, sin Edad, sin hero.
 *   - Fase Recolección, p1 activePlayer.
 *   - Primer TURN_START aplicado a p1 (energía 1, +1 carta robada).
 *
 * Mismo seed → mismo state (determinismo).
 */
export function createInitialState(setup: NewGameSetup): GameState {
  const rng = createRng(setup.seed)

  const p1 = emptyPlayer(setup.p1Race, STARTING_HAND_SIZE, setup.p1Deck ?? [])
  const p2 = emptyPlayer(
    setup.p2Race,
    STARTING_HAND_SIZE + SECOND_PLAYER_BONUS_CARD,
    setup.p2Deck ?? [],
  )

  const cardRegistry: Record<string, Card> = {}
  for (const c of setup.p1Deck ?? []) cardRegistry[c.id] = c
  for (const c of setup.p2Deck ?? []) cardRegistry[c.id] = c

  const setupState: GameState = {
    seed: setup.seed,
    rng: rng.snapshot(),
    turn: 1,
    activePlayer: 'p1',
    phase: PHASE_RECOLECCION,
    players: { p1, p2 },
    pendingEvents: [],
    log: [],
    outcome: { kind: 'in_progress' },
    cardRegistry,
    costModifiers: [],
    keywordAmplifiers: [],
  }

  return applyFirstTurnStart(setupState)
}
