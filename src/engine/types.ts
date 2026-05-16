// Tipos del engine de Sexto Sol — alineado a GAME-RULES.md v4.2 (Modelo B2).
//
// Cambios v4.1 → v4.2 ("Premonición como Lectura"):
//   - Premonición OCULTA hasta el revelado simultáneo (no pública antes).
//   - Premonición afecta la carta del OPONENTE, no la propia:
//     * Acierto: rival pierde `penalizacion_acierto` fuerza (campo top-level de cada carta).
//     * Fallo: rival gana +1 fuerza.
//   - Eliminadas las cláusulas premonicion_propia/oponente/acierta del schema.
//   - Cláusulas ahora son sobre ESTADO DEL JUEGO (héroe, tramo, atributos, eclipse).
//
// Preservado de v4.1: 3 atributos, 3 tramos, planeta secreto, Eclipse, victoria 2-de-3.
//
// Determinismo total: todo el state pasa por un reducer puro (state, action) => newState.

import type { RngState } from './rng'

// ---- Primitivos del dominio ------------------------------------------------

export type Categoria = 'Ataque' | 'Defensa' | 'Ritual'

export type Raza = 'Tezhal' | 'Würon'

export type Tramo = 'nebulosa' | 'estrellas' | 'sexto_sol'

export type HeroEstado = 'neutral' | 'despertado' | 'ascendido'

export type PlayerId = 'a' | 'b'

export type Modo = 'vsIA' | 'hotseat'

/** Sub-paso dentro del flujo de turno. v4.2: NO hay premonicion_pendiente
 *  (la premonición se elige paralela con la acción, ambas ocultas). */
export type SubPaso =
  | 'mulligan_inicial'
  | 'eleccion_planeta'
  | 'robo'
  /** Cada jugador elige carta + premonición (paralelo, ambos ocultos). */
  | 'seleccion_secreta'
  | 'revelar'
  /** Cartas + premoniciones reveladas; user revisa antes de avanzar. */
  | 'revisar_resolucion'
  | 'cierre_tramo'
  | 'duelo_final'
  | 'terminado'

// ---- Side effects (acciones más allá de fuerza) ----------------------------

/** v4.2: tipos válidos de side effect según §5.4 SPEC. */
export type SideEffectTipo =
  | 'descarte_oponente'
  | 'robo_propio'
  | 'mirar_mazo_oponente'
  | 'bloqueo_planeta'

export interface SideEffect {
  tipo: SideEffectTipo
  valor: number
}

// ---- Condicionales de carta (sobre ESTADO DEL JUEGO) -----------------------

/** v4.2: tipos válidos de condicional según §5.2 SPEC.
 *  Las viejas premonicion_* fueron eliminadas — premonición ya no condicional. */
export type CondicionalTipo =
  /** Tu héroe está en estado X. valor: HeroEstado. */
  | 'heroe_estado'
  /** El tramo actual es X. valor: Tramo. */
  | 'tramo'
  /** Tu atributo Y ≥ umbral. valorAtributo: Categoria, umbral: number. */
  | 'atributo_propio'
  /** Atributo Y del rival ≥ umbral. */
  | 'atributo_oponente'
  /** Eclipse fue invocado este turno. */
  | 'eclipse_activo'

export interface Condicional {
  tipo: CondicionalTipo
  /** Para heroe_estado | tramo: estado/tramo requerido. */
  valor?: HeroEstado | Tramo
  /** Para atributo_propio | atributo_oponente: la categoría/atributo a chequear. */
  valorAtributo?: Categoria
  /** Para atributo_*: umbral mínimo (≥). */
  umbral?: number
  /** Delta numérico a la fuerza final si la cláusula triggera. */
  fuerzaDelta?: number
  /** Efecto colateral si la cláusula triggera. */
  sideEffect?: SideEffect
  /** Texto humano para mostrar en UI. */
  efectoTexto?: string
}

// ---- Cartas (definiciones estáticas del pool) ------------------------------

export type Rareza = 'comun' | 'rara' | 'epica' | 'legendaria'

export interface CardActionDef {
  id: string
  nombre: string
  raza: Raza
  categoria: Categoria
  coste: number
  fuerzaBase: number
  /** v4.2: penalización aplicada a ESTA carta si el oponente acierta su premonición. ≥ 0. */
  penalizacionAcierto: number
  rareza: Rareza
  /** Condicionales sobre estado del juego (sin premoniciones — eliminadas en v4.2). */
  condicionales: Condicional[]
  /** Side effects que la carta gatilla incondicionalmente al revelarse. */
  sideEffects?: SideEffect[]
  flavor: string
}

export interface CardPlanetDef {
  id: string
  nombre: string
  tramo: 'Nebulosa' | 'Estrellas'
  categoria: Categoria
  flavor: string
  efectoEspecial: null
}

export interface CardHeroEstadoDef {
  id: string
  activacion: string
  habilidad: string
  flavor: string
}

export interface CardHeroDef {
  nombre: string
  raza: Raza
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
  mazoRestante: string[]
  mano: string[]
  pozo: string[]
  atributos: HeroAttributes
  heroEstado: HeroEstado
  mulliganUsado: boolean
  manoAceptada: boolean
  planetElegidoActual?: string
}

// ---- Estado global de la partida -------------------------------------------

/** Entrada de historial de premoniciones reveladas (visible tras cada turno). */
export interface PremonicionRevelada {
  turno: number
  tramo: Tramo
  a: Categoria
  b: Categoria
  cardCategoriaA: Categoria
  cardCategoriaB: Categoria
}

export interface GameState {
  seed: number
  rng: RngState
  tramo: Tramo
  turno: number
  subPaso: SubPaso
  jugadorActivo: PlayerId
  players: { a: Player; b: Player }
  poolPlanetasNebulosa: string[]
  poolPlanetasEstrellas: string[]
  energiaActual: number
  /** v4.2: premoniciones ocultas hasta revelar. Set durante seleccion_secreta. */
  premoniciones: { a?: Categoria; b?: Categoria }
  /** Ids de cartas elegidas (boca abajo) este turno. */
  accionesPendientes: { a?: string; b?: string }
  /** "Pasa" sin carta. v4.2: igual declara premonición (puede acertar y debilitar). */
  paseDeclarado: { a?: boolean; b?: boolean }
  eclipseInvocado: boolean
  eclipseInvocador?: PlayerId
  modo: Modo
  /** v4.2: historial de premoniciones reveladas (visible para ambos tras cada revelado). */
  historialPremoniciones: PremonicionRevelada[]
  /** Carta peekada por habilidad de Tezhal Ascendido este turno (id), o undefined. */
  peekedCardOponente?: string
  ganador?: PlayerId | 'empate'
  finalTally?: { a: number; b: number }
}

// ---- Resultado de interpretación de una carta revelada ---------------------

export interface InterpretResult {
  /** Fuerza final aplicable al atributo correspondiente (≥ 0, Math.max(0,...)). */
  fuerzaFinal: number
  /** Side effects a aplicar después de calcular fuerza. */
  sideEffects: SideEffect[]
  categoria: Categoria
  owner: PlayerId
}
