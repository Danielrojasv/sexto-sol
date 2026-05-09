// Factory para construir el GameState inicial de una partida.

import { createRng } from './rng'
import type {
  Age,
  GameState,
  PlanetGift,
  PlanetState,
  PlayerState,
  Race,
  TurnPhase,
} from './types'

const HOMEWORLD_HP = 20
const STARTING_HAND_SIZE = 4
const SECOND_PLAYER_BONUS_CARD = 1
const STARTING_ENERGY = 1
const PHASE_RECOLECCION: TurnPhase = 'recoleccion'
const AGE_DESPERTAR: Age = 1

export interface NewGameSetup {
  seed: number
  p1Race: Race
  p2Race: Race
  /** 3 Dones revelados al setup. Si se omite, se crean placeholders. */
  planetGifts?: readonly PlanetGift[]
}

function emptyPlayer(race: Race, handSize: number): PlayerState {
  return {
    race,
    homeworld: { hp: HOMEWORLD_HP, maxHp: HOMEWORLD_HP },
    hero: null,
    hand: new Array<never>(handSize).fill(undefined as never).map(() => ({
      id: 'placeholder',
      name: 'Placeholder',
      type: 'ship',
      race,
      cost: 0,
      rarity: 'common',
      keywords: [],
    })),
    deck: [],
    graveyard: [],
    energy: 0,
    fleet: [],
  }
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

/**
 * Construye un GameState inicial:
 * - Mundos natales HP 20.
 * - p1 mano 4, p2 mano 5 (+1 compensación).
 * - p1 inicia con 1 energía (regla "empezás con 1 energía en turno 1").
 * - 3 planetas neutrales con Don revelado.
 * - Edad I, fase Recolección, turno 1, activePlayer p1.
 *
 * Las cartas en mano son placeholders genéricos hasta que tengamos card data
 * real (Phase 3). Mantienen el contrato estructural del state.
 */
export function createInitialState(setup: NewGameSetup): GameState {
  const rng = createRng(setup.seed)
  const gifts = setup.planetGifts && setup.planetGifts.length > 0 ? setup.planetGifts : placeholderGifts()

  const p1 = emptyPlayer(setup.p1Race, STARTING_HAND_SIZE)
  const p2 = emptyPlayer(setup.p2Race, STARTING_HAND_SIZE + SECOND_PLAYER_BONUS_CARD)

  return {
    seed: setup.seed,
    rng: rng.snapshot(),
    turn: 1,
    age: AGE_DESPERTAR,
    activePlayer: 'p1',
    phase: PHASE_RECOLECCION,
    players: {
      p1: { ...p1, energy: STARTING_ENERGY },
      p2,
    },
    sector: { planets: buildPlanets(gifts) },
    pendingEvents: [],
    log: [],
    outcome: { kind: 'in_progress' },
  }
}
