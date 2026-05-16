// Setup inicial de una partida de Sexto Sol v4.1.
//
// Toma config (mazos, pool de planetas, modo, seed) y produce el GameState
// inicial: héroes en Neutral, atributos en 0, mazos barajados, mano inicial
// de 4 cartas robadas, primer sub-paso = 'eleccion_planeta' de Nebulosa.

import type { GameState, Modo, Player, PlayerId, Raza } from './types'
import { createRng, shuffle } from './rng'

export interface InitDeckConfig {
  raza: Raza
  /** Lista de IDs de cartas en el mazo (con duplicados según copies). 20 cartas. */
  cardIds: string[]
  /** ID del héroe asociado a esta raza (informativo; las habilidades se aplican por raza). */
  heroId: string
}

export interface InitConfig {
  seed: number
  modo: Modo
  deckA: InitDeckConfig
  deckB: InitDeckConfig
  /** 3 IDs de cartas-planeta para Nebulosa (categoría Atq, Def, Rit). */
  planetIdsNebulosa: string[]
  /** 3 IDs de cartas-planeta para Estrellas. */
  planetIdsEstrellas: string[]
}

const MANO_INICIAL = 4
const MAZO_SIZE = 20
const PLANETAS_POR_TRAMO = 3

/** Crea el state inicial de una partida. Determinista vía seed. */
export function createInitialState(config: InitConfig): GameState {
  validateConfig(config)
  const rng = createRng(config.seed)

  // Barajar mazos de ambos jugadores con el mismo RNG (consume bits secuencialmente).
  const shuffledA = shuffle(rng, config.deckA.cardIds)
  const shuffledB = shuffle(rng, config.deckB.cardIds)

  // Robar 4 cartas iniciales de cada mazo.
  const handA = shuffledA.slice(0, MANO_INICIAL)
  const restA = shuffledA.slice(MANO_INICIAL)
  const handB = shuffledB.slice(0, MANO_INICIAL)
  const restB = shuffledB.slice(MANO_INICIAL)

  const playerA: Player = {
    id: 'a',
    raza: config.deckA.raza,
    mazoRestante: restA,
    mano: handA,
    pozo: [],
    atributos: { fuerza: 0, resguardo: 0, resonancia: 0 },
    heroEstado: 'neutral',
    mulliganUsado: false,
  }

  const playerB: Player = {
    id: 'b',
    raza: config.deckB.raza,
    mazoRestante: restB,
    mano: handB,
    pozo: [],
    atributos: { fuerza: 0, resguardo: 0, resonancia: 0 },
    heroEstado: 'neutral',
    mulliganUsado: false,
  }

  return {
    seed: config.seed,
    rng: rng.snapshot(),
    tramo: 'nebulosa',
    turno: 1,
    subPaso: 'eleccion_planeta',
    jugadorActivo: 'a',
    players: { a: playerA, b: playerB },
    poolPlanetasNebulosa: [...config.planetIdsNebulosa],
    poolPlanetasEstrellas: [...config.planetIdsEstrellas],
    energiaActual: 1, // turno 1 = 1 energía
    premoniciones: {},
    accionesPendientes: {},
    paseDeclarado: {},
    eclipseInvocado: false,
    modo: config.modo,
  }
}

function validateConfig(config: InitConfig): void {
  if (config.deckA.cardIds.length !== MAZO_SIZE) {
    throw new Error(`deckA debe tener ${MAZO_SIZE} cartas, tiene ${config.deckA.cardIds.length}`)
  }
  if (config.deckB.cardIds.length !== MAZO_SIZE) {
    throw new Error(`deckB debe tener ${MAZO_SIZE} cartas, tiene ${config.deckB.cardIds.length}`)
  }
  if (config.planetIdsNebulosa.length !== PLANETAS_POR_TRAMO) {
    throw new Error(`planetIdsNebulosa debe tener ${PLANETAS_POR_TRAMO} elementos`)
  }
  if (config.planetIdsEstrellas.length !== PLANETAS_POR_TRAMO) {
    throw new Error(`planetIdsEstrellas debe tener ${PLANETAS_POR_TRAMO} elementos`)
  }
}

/** Helper para tests: verifica que un state luce como estado inicial post-setup. */
export function isInitialState(state: GameState): boolean {
  const p = (id: PlayerId) => state.players[id]
  return (
    state.tramo === 'nebulosa' &&
    state.turno === 1 &&
    state.subPaso === 'eleccion_planeta' &&
    !state.eclipseInvocado &&
    p('a').atributos.fuerza === 0 &&
    p('a').atributos.resguardo === 0 &&
    p('a').atributos.resonancia === 0 &&
    p('b').atributos.fuerza === 0 &&
    p('b').atributos.resguardo === 0 &&
    p('b').atributos.resonancia === 0 &&
    p('a').heroEstado === 'neutral' &&
    p('b').heroEstado === 'neutral' &&
    p('a').mano.length === MANO_INICIAL &&
    p('b').mano.length === MANO_INICIAL &&
    p('a').mazoRestante.length === MAZO_SIZE - MANO_INICIAL &&
    p('b').mazoRestante.length === MAZO_SIZE - MANO_INICIAL
  )
}
