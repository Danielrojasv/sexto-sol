// Tipos del engine de Sexto Sol — alineado a GAME-RULES.md v4.1.
//
// "El Peregrinaje del Héroe":
//   - El héroe es el sujeto que acumula 3 atributos (Fuerza/Resguardo/Resonancia).
//   - 3 tramos: Nebulosa (T1-2), Estrellas (T3-4), Sexto Sol (T5-7).
//   - Elección secreta de planeta en Nebulosa y Estrellas (no en Sexto Sol).
//   - Bonus +1 a cartas de la categoría del planeta elegido (solo Neb/Est).
//   - Victoria: ganar 2 de 3 atributos en duelo final.
//
// Determinismo total: todo el state pasa por un reducer puro (state, action) => newState.
// Sin mutación in-place. Sin LLM. Sin browser deps en engine.

import type { RngState } from './rng'

// ---- Primitivos del dominio ------------------------------------------------

export type Categoria = 'Ataque' | 'Defensa' | 'Ritual'

export type Raza = 'Tezhal' | 'Würon'

export type Tramo = 'nebulosa' | 'estrellas' | 'sexto_sol'

export type HeroEstado = 'neutral' | 'despertado' | 'ascendido'

export type PremonicionTipo = 'premonicion_propia' | 'premonicion_oponente' | 'premonicion_acierta'

export type PlayerId = 'a' | 'b'

export type Modo = 'vsIA' | 'hotseat'

/** Sub-paso dentro del flujo de turno (o de transición entre tramos). */
export type SubPaso =
  | 'eleccion_planeta'
  | 'robo'
  | 'accion_pendiente'
  | 'premonicion_pendiente'
  | 'revelar'
  | 'cierre_tramo'
  | 'duelo_final'
  | 'terminado'

// ---- Side effects de cláusulas condicionales -------------------------------

export type SideEffectTipo = 'descarte' | 'robo' | 'anula'
export type SideEffectTarget = 'propio' | 'oponente'

export interface SideEffect {
  tipo: SideEffectTipo
  target: SideEffectTarget
  valor: number
}

// ---- Cartas (definiciones estáticas del pool) ------------------------------

export type Rareza = 'comun' | 'rara' | 'epica' | 'legendaria'

/**
 * Cláusula condicional de una carta de Acción.
 * Formato v4.1 estructurado (ver scripts/migrate-v4.1-cards-to-structured.ts).
 * El interpreter consume directamente fuerzaDelta + sideEffect, no parsea strings.
 */
export interface Condicional {
  tipo: PremonicionTipo
  /** Categoría requerida (solo para premonicion_propia / premonicion_oponente). */
  valor?: Categoria
  /** Delta numérico a la fuerza final si la cláusula triggera. */
  fuerzaDelta?: number
  /** Efecto colateral (descarte, robo, anulación) si la cláusula triggera. */
  sideEffect?: SideEffect
  /** Texto humano del efecto original (solo para mostrar en UI). */
  efectoTexto?: string
}

export interface CardActionDef {
  id: string
  nombre: string
  raza: Raza
  categoria: Categoria
  coste: number
  fuerzaBase: number
  rareza: Rareza
  condicionales: Condicional[]
  flavor: string
}

export interface CardPlanetDef {
  id: string
  nombre: string
  tramo: 'Nebulosa' | 'Estrellas'
  categoria: Categoria
  flavor: string
  /** Reservado para v4.2+. Siempre null en v4.1. */
  efectoEspecial: null
}

export interface CardHeroEstadoDef {
  /** ID estable del estado (ej: HRO-TEZHAL-DESPERTADO). */
  id: string
  /** Texto humano de cuándo se activa este estado. */
  activacion: string
  /** Texto humano de la habilidad pasiva (solo informativo — la lógica vive en el interpreter). */
  habilidad: string
  /** Flavor narrativo del estado. */
  flavor: string
}

export interface CardHeroDef {
  /** Nombre del héroe (ej: "Tlanixtli"). */
  nombre: string
  raza: Raza
  /** Persona / descripción del héroe (puede venir del state Despertado del YAML). */
  persona: string
  despertado: CardHeroEstadoDef
  ascendido: CardHeroEstadoDef
}

// ---- Estado del héroe en partida -------------------------------------------

export interface HeroAttributes {
  fuerza: number
  resguardo: number
  resonancia: number
}

// ---- Estado del jugador ----------------------------------------------------

export interface Player {
  id: PlayerId
  raza: Raza
  /** Ids de cartas remaining en el mazo (orden de robo: shift desde [0]). */
  mazoRestante: string[]
  /** Ids de cartas en mano. */
  mano: string[]
  /** Ids de cartas en pozo (descartadas o jugadas). */
  pozo: string[]
  /** Atributos acumulados del héroe (toda la partida, no se resetean). */
  atributos: HeroAttributes
  heroEstado: HeroEstado
  mulliganUsado: boolean
  /** Id del planeta elegido para el tramo actual. Undefined fuera de Neb/Est. */
  planetElegidoActual?: string
}

// ---- Estado global de la partida -------------------------------------------

export interface GameState {
  /** Seed inicial — para reproducibilidad. */
  seed: number
  /** Estado del RNG (mutable a través del reducer, siempre via funciones puras de rng.ts). */
  rng: RngState
  tramo: Tramo
  /** Turno actual (1-7). */
  turno: number
  subPaso: SubPaso
  /**
   * Jugador "activo" para sub-pasos secuenciales en Hot-seat (ej: elección de planeta,
   * que es secreta y debe alternarse). En vsIA siempre 'a' (el humano).
   */
  jugadorActivo: PlayerId
  players: { a: Player; b: Player }
  /** Pool fijo de 3 ids de cartas-planeta para Nebulosa. */
  poolPlanetasNebulosa: string[]
  /** Pool fijo de 3 ids de cartas-planeta para Estrellas. */
  poolPlanetasEstrellas: string[]
  /** Energía disponible este turno (== turno). */
  energiaActual: number
  /** Premoniciones declaradas en el turno actual (vacío hasta declarar). */
  premoniciones: { a?: Categoria; b?: Categoria }
  /** Ids de cartas jugadas boca abajo este turno (vacío hasta jugar). */
  accionesPendientes: { a?: string; b?: string }
  /** Si "Pasa" se declaró en lugar de jugar carta. */
  paseDeclarado: { a?: boolean; b?: boolean }
  eclipseInvocado: boolean
  eclipseInvocador?: PlayerId
  modo: Modo
  /** Ganador final, set solo en duelo_final/terminado. */
  ganador?: PlayerId | 'empate'
  /** Tally final 2-de-3, set solo en terminado. */
  finalTally?: { a: number; b: number }
}

// ---- Resultado de interpretación de una carta revelada ---------------------

/** Output del interpreter para una sola carta revelada. */
export interface InterpretResult {
  /** Fuerza final aplicable al atributo correspondiente (≥ 0, ya con Math.max). */
  fuerzaFinal: number
  /** Side effects a aplicar después de calcular fuerza de ambas cartas. */
  sideEffects: SideEffect[]
  /** Categoría de la carta (para que el reducer sepa a qué atributo sumar). */
  categoria: Categoria
  /** Owner: el jugador que jugó esta carta. */
  owner: PlayerId
}
