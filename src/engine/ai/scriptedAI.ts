// scriptedAI v4.2 — IA heurística determinista para Sexto Sol "Premonición como Lectura".
//
// Implementa las 5 heurísticas §7.5 del SPEC v4.2:
//   1. Mulligan (mano sin carta de coste ≤ 2 → mulligan).
//   2. Elección de planeta (eficiencia de mano, distribución 70/15/15).
//   3. Premonición (tracking del state.historialPremoniciones — categoría más
//      frecuente del rival, distribución 70/15/15, suavizado uniforme en turno 1).
//   4. Elección de acción (max fuerza esperada considerando lectura del rival
//      como Bernoulli sobre su tracking, condicionales sobre estado del juego,
//      bonus planeta y sideEffects).
//   5. Eclipse (condicional al tally + fuerza esperada ×2 ≥ umbral).
//
// Es función pura: dado un (state, playerId, history, deps), devuelve la próxima Action.
// Sin LLM. Sin Math.random. Determinismo total vía createRng(state.seed, state.rng).
//
// La heurística asume que el oponente predice mi premonición usando el mismo
// tracking que yo aplico sobre el suyo (auto-tracking simétrico).

import { interpretCondicionales } from '../interpreter'
import { getEnergiaParaJugador, type ReducerDeps } from '../reducer'
import { createRng } from '../rng'
import type { CardActionDef, Categoria, GameState, PlayerId, SideEffect } from '../types'

/**
 * Historial de categorías jugadas por el oponente (visible para tracking).
 * Phase 2 v4.2: se reconstruye desde state.historialPremoniciones — esta
 * estructura local se mantiene por compatibilidad con el gameStore.
 */
export interface AIHistory {
  oponenteCategorias: Categoria[]
}

export function emptyHistory(): AIHistory {
  return { oponenteCategorias: [] }
}

const ALL_CATEGORIAS: readonly Categoria[] = ['Ataque', 'Defensa', 'Ritual']

// ===== HEURÍSTICA 1: Mulligan ===============================================

export function shouldMulligan(state: GameState, playerId: PlayerId, deps: ReducerDeps): boolean {
  const hand = state.players[playerId].mano
  const hasBarata = hand.some((id) => {
    const c = deps.cards.get(id)
    return c !== undefined && c.coste <= 2
  })
  return !hasBarata
}

// ===== HEURÍSTICA 2: Elección de planeta ===================================

function eficienciasPorCategoria(
  state: GameState,
  playerId: PlayerId,
  deps: ReducerDeps,
): Record<Categoria, number> {
  const hand = state.players[playerId].mano
  const energiaMax = state.turno + 1
  const counts: Record<Categoria, number> = { Ataque: 0, Defensa: 0, Ritual: 0 }
  for (const cardId of hand) {
    const card = deps.cards.get(cardId)
    if (!card) continue
    if (card.coste > energiaMax) continue
    counts[card.categoria] += card.fuerzaBase
  }
  return counts
}

export function pickPlanet(
  state: GameState,
  playerId: PlayerId,
  deps: ReducerDeps,
  poolPlanetIds: string[],
): string {
  const eff = eficienciasPorCategoria(state, playerId, deps)
  const sorted = ALL_CATEGORIAS.map((cat) => ({ cat, score: eff[cat] })).sort(
    (a, b) => b.score - a.score,
  )

  const todasCero = sorted.every((s) => s.score === 0)
  const dist: Array<{ cat: Categoria; prob: number }> = todasCero
    ? sorted.map((s) => ({ cat: s.cat, prob: 1 / 3 }))
    : [
        { cat: sorted[0]!.cat, prob: 0.7 },
        { cat: sorted[1]!.cat, prob: 0.15 },
        { cat: sorted[2]!.cat, prob: 0.15 },
      ]

  const rng = createRng(state.seed, state.rng)
  const roll = rng.next()
  let acc = 0
  let chosenCat: Categoria = dist[0]!.cat
  for (const d of dist) {
    acc += d.prob
    if (roll <= acc) {
      chosenCat = d.cat
      break
    }
  }

  for (const planetId of poolPlanetIds) {
    const planet = deps.planets.get(planetId)
    if (planet?.categoria === chosenCat) return planetId
  }
  return poolPlanetIds[0]!
}

// ===== HEURÍSTICA 3: Premonición ===========================================

/**
 * Tracking de últimas 3 categorías jugadas por el oponente.
 * v4.2: leemos de state.historialPremoniciones (campo `cardCategoria{A,B}`)
 * para reconstruir sin depender de AIHistory local.
 */
function oponenteCategoriasRecientes(state: GameState, playerId: PlayerId): Categoria[] {
  const oponente: PlayerId = playerId === 'a' ? 'b' : 'a'
  return state.historialPremoniciones
    .slice(-3)
    .map((e) => (oponente === 'a' ? e.cardCategoriaA : e.cardCategoriaB))
}

/**
 * Distribución 70/15/15 sobre la categoría más jugada por el rival recientemente.
 * Sin historial: uniforme 1/3.
 */
function distribucionPremonicion(
  state: GameState,
  playerId: PlayerId,
): Array<{ cat: Categoria; prob: number }> {
  const recent = oponenteCategoriasRecientes(state, playerId)
  if (recent.length === 0) {
    return ALL_CATEGORIAS.map((cat) => ({ cat, prob: 1 / 3 }))
  }
  const counts: Record<Categoria, number> = { Ataque: 0, Defensa: 0, Ritual: 0 }
  for (const c of recent) counts[c]++
  const sorted = ALL_CATEGORIAS.map((cat) => ({ cat, count: counts[cat] })).sort(
    (a, b) => b.count - a.count,
  )
  return [
    { cat: sorted[0]!.cat, prob: 0.7 },
    { cat: sorted[1]!.cat, prob: 0.15 },
    { cat: sorted[2]!.cat, prob: 0.15 },
  ]
}

export function pickPremonicion(state: GameState, _history: AIHistory, playerId: PlayerId = 'b'): Categoria {
  const dist = distribucionPremonicion(state, playerId)
  const rng = createRng(state.seed, state.rng)
  const roll = rng.next()
  let acc = 0
  for (const d of dist) {
    acc += d.prob
    if (roll <= acc) return d.cat
  }
  return dist[0]!.cat
}

// ===== HEURÍSTICA 4: Elección de acción ====================================

/**
 * Estima el riesgo de ser leído: probabilidad de que el rival adivine la
 * categoría de ESTA carta, usando su propio tracking sobre mí.
 */
function probabilidadDeSerLeido(
  state: GameState,
  playerId: PlayerId,
  miCategoria: Categoria,
): number {
  const oponente: PlayerId = playerId === 'a' ? 'b' : 'a'
  const dist = distribucionPremonicion(state, oponente)
  const entry = dist.find((d) => d.cat === miCategoria)
  return entry?.prob ?? 1 / 3
}

interface FuerzaEsperadaInput {
  card: CardActionDef
  miPremonicion: Categoria
  state: GameState
  playerId: PlayerId
  deps: ReducerDeps
  /** Predicción de la premonición del rival sobre mí (auto-tracking simétrico). */
  oponentePremonicionEsperada: Categoria
  /** Predicción de la categoría que jugará el rival (para Würon Despertado). */
  oponenteCategoriaEsperada: Categoria
  eclipseActivo: boolean
  eclipseInvocador: PlayerId | undefined
}

function fuerzaEsperada(opts: FuerzaEsperadaInput): number {
  const {
    card,
    miPremonicion,
    state,
    playerId,
    deps,
    oponentePremonicionEsperada,
    oponenteCategoriaEsperada,
    eclipseActivo,
    eclipseInvocador,
  } = opts
  const player = state.players[playerId]
  const oponente = state.players[playerId === 'a' ? 'b' : 'a']
  const planet = player.planetElegidoActual
    ? deps.planets.get(player.planetElegidoActual)
    : undefined

  // Caso A: rival acertó (probabilidad p)
  const pAcertado = probabilidadDeSerLeido(state, playerId, card.categoria)
  const resAcertado = interpretCondicionales({
    card,
    miPremonicion,
    oponentePremonicion: card.categoria, // rival acertó
    oponenteCategoria: oponenteCategoriaEsperada,
    planetElegido: planet,
    tramo: state.tramo,
    heroEstado: player.heroEstado,
    raza: player.raza,
    owner: playerId,
    atributosPropio: player.atributos,
    atributosOponente: oponente.atributos,
    eclipseActivo,
    eclipseInvocador,
  })

  // Caso B: rival falló (probabilidad 1-p). Usamos oponentePremonicionEsperada
  // sabiendo que NO es nuestra categoría. Si el "esperada" es nuestra categoría,
  // fallback a la siguiente más probable.
  const fallback: Categoria =
    oponentePremonicionEsperada !== card.categoria
      ? oponentePremonicionEsperada
      : ALL_CATEGORIAS.find((c) => c !== card.categoria) ?? 'Ataque'
  const resFallo = interpretCondicionales({
    card,
    miPremonicion,
    oponentePremonicion: fallback,
    oponenteCategoria: oponenteCategoriaEsperada,
    planetElegido: planet,
    tramo: state.tramo,
    heroEstado: player.heroEstado,
    raza: player.raza,
    owner: playerId,
    atributosPropio: player.atributos,
    atributosOponente: oponente.atributos,
    eclipseActivo,
    eclipseInvocador,
  })

  const fuerzaProm = pAcertado * resAcertado.fuerzaFinal + (1 - pAcertado) * resFallo.fuerzaFinal

  // SideEffects valuados con pesos heurísticos.
  const allEffects: SideEffect[] = [
    ...resAcertado.sideEffects,
    ...resFallo.sideEffects,
  ]
  // Para evitar contar dos veces, deduplicamos por tipo+valor.
  const seen = new Set<string>()
  let bonusEfectos = 0
  for (const eff of allEffects) {
    const key = `${eff.tipo}:${eff.valor}`
    if (seen.has(key)) continue
    seen.add(key)
    switch (eff.tipo) {
      case 'descarte_oponente':
        bonusEfectos += eff.valor * 0.6
        break
      case 'robo_propio':
        bonusEfectos += eff.valor * 0.7
        break
      case 'mirar_mazo_oponente':
        bonusEfectos += eff.valor * 0.3
        break
      case 'bloqueo_planeta':
        bonusEfectos += eff.valor * 0.4
        break
    }
  }

  return fuerzaProm + bonusEfectos
}

export type DecisionAccion = { type: 'play'; cardId: string } | { type: 'pass' }

export function pickAccion(
  state: GameState,
  playerId: PlayerId,
  deps: ReducerDeps,
  _history: AIHistory,
  miPremonicionPlanificada: Categoria,
  opts?: { eclipseActivo?: boolean; eclipseInvocador?: PlayerId },
): DecisionAccion {
  const player = state.players[playerId]
  const energia = getEnergiaParaJugador(state, playerId)

  // Predicción heurística: el rival juega la categoría más frecuente que ha
  // jugado, simétrico al tracking que aplico sobre él.
  const oponentePremonicionEsperada = pickPremonicion(state, emptyHistory(), playerId)
  // Para Würon Despertado / lectura, asumimos categoría rival = la que él más jugó.
  const oponenteCats = oponenteCategoriasRecientes(state, playerId)
  const oponenteCategoriaEsperada: Categoria =
    oponenteCats.length === 0
      ? 'Ataque'
      : modeCategoria(oponenteCats)

  const jugables = player.mano
    .map((id) => deps.cards.get(id))
    .filter((c): c is CardActionDef => c !== undefined && c.coste <= energia)
  if (jugables.length === 0) return { type: 'pass' }

  let best: { cardId: string; expected: number; coste: number } | undefined
  for (const card of jugables) {
    const exp = fuerzaEsperada({
      card,
      miPremonicion: miPremonicionPlanificada,
      state,
      playerId,
      deps,
      oponentePremonicionEsperada,
      oponenteCategoriaEsperada,
      eclipseActivo: opts?.eclipseActivo ?? state.eclipseInvocado,
      eclipseInvocador: opts?.eclipseInvocador ?? state.eclipseInvocador,
    })
    if (
      !best ||
      exp > best.expected ||
      (exp === best.expected && card.coste > best.coste)
    ) {
      best = { cardId: card.id, expected: exp, coste: card.coste }
    }
  }
  return { type: 'play', cardId: best!.cardId }
}

function modeCategoria(cats: Categoria[]): Categoria {
  const counts: Record<Categoria, number> = { Ataque: 0, Defensa: 0, Ritual: 0 }
  for (const c of cats) counts[c]++
  let max: Categoria = 'Ataque'
  let maxN = -1
  for (const cat of ALL_CATEGORIAS) {
    if (counts[cat] > maxN) {
      max = cat
      maxN = counts[cat]
    }
  }
  return max
}

// ===== HEURÍSTICA 5: Eclipse ===============================================

export function shouldInvokeEclipse(opts: {
  state: GameState
  playerId: PlayerId
  deps: ReducerDeps
  history: AIHistory
  miPremonicion: Categoria
}): boolean {
  const { state, playerId, deps, history, miPremonicion } = opts
  if (state.tramo !== 'sexto_sol') return false
  if (state.eclipseInvocado) return false

  // Tally actual: cuántos atributos llevo ganados.
  const mi = state.players[playerId].atributos
  const op = state.players[playerId === 'a' ? 'b' : 'a'].atributos
  let tallyMi = 0
  let tallyOp = 0
  if (mi.fuerza > op.fuerza) tallyMi++
  else if (op.fuerza > mi.fuerza) tallyOp++
  if (mi.resguardo > op.resguardo) tallyMi++
  else if (op.resguardo > mi.resguardo) tallyOp++
  if (mi.resonancia > op.resonancia) tallyMi++
  else if (op.resonancia > mi.resonancia) tallyOp++

  // Solo invoca si voy perdiendo (tallyMi < tallyOp).
  if (tallyMi >= tallyOp) return false

  // Simula la decisión bajo Eclipse activo del owner.
  const decision = pickAccion(state, playerId, deps, history, miPremonicion, {
    eclipseActivo: true,
    eclipseInvocador: playerId,
  })
  if (decision.type === 'pass') return false
  const card = deps.cards.get(decision.cardId)
  if (!card) return false
  const exp = fuerzaEsperada({
    card,
    miPremonicion,
    state,
    playerId,
    deps,
    oponentePremonicionEsperada: pickPremonicion(state, emptyHistory(), playerId),
    oponenteCategoriaEsperada: 'Ataque',
    eclipseActivo: true,
    eclipseInvocador: playerId,
  })
  // Eclipse rentable si fuerza esperada (con ×2 ya aplicado en interpreter) ≥ 5.
  return exp >= 5
}
