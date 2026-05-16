// scriptedAI v4.1 — IA heurística determinista para Sexto Sol.
//
// Implementa las 5 heurísticas §7.5 del SPEC v4.1:
//   1. Mulligan
//   2. Elección de planeta (70/15/15)
//   3. Premonición (tracking 70/15/15)
//   4. Elección de acción (max fuerza esperada paid)
//   5. Eclipse (condicional)
//
// Es función pura: dado un (state, playerId, history, deps), devuelve la próxima Action.
// Sin LLM. Sin Math.random. Determinismo total vía createRng(state.seed, state.rng).

import { interpretCondicionales } from '../interpreter'
import { getEnergiaParaJugador, type ReducerDeps } from '../reducer'
import { createRng } from '../rng'
import type { CardActionDef, Categoria, GameState, PlayerId } from '../types'

/** Historial de categorías jugadas por cada jugador (para tracking de premonición). */
export interface AIHistory {
  /** Lista plana de categorías que el oponente jugó (más reciente al final). */
  oponenteCategorias: Categoria[]
}

export function emptyHistory(): AIHistory {
  return { oponenteCategorias: [] }
}

// ===== HEURÍSTICA 1: Mulligan =================================================

/** Devuelve true si la IA debería mulliganear la mano inicial. */
export function shouldMulligan(state: GameState, playerId: PlayerId, deps: ReducerDeps): boolean {
  const hand = state.players[playerId].mano
  const hasBarata = hand.some((id) => {
    const c = deps.cards.get(id)
    return c !== undefined && c.coste <= 2
  })
  return !hasBarata
}

// ===== HEURÍSTICA 2: Elección de planeta =====================================

/** Distribución de eficiencia por categoría según mano + cartas próximas a robar. */
function eficienciasPorCategoria(state: GameState, playerId: PlayerId, deps: ReducerDeps): Record<Categoria, number> {
  const hand = state.players[playerId].mano
  const turnoActual = state.turno
  // Considerar cartas jugables en los próximos 2 turnos (energía actual + actual+1).
  const energiaMax = turnoActual + 1
  const counts: Record<Categoria, number> = { Ataque: 0, Defensa: 0, Ritual: 0 }
  for (const cardId of hand) {
    const card = deps.cards.get(cardId)
    if (!card) continue
    if (card.coste > energiaMax) continue
    counts[card.categoria] += card.fuerzaBase
  }
  return counts
}

/**
 * Elige planeta basándose en eficiencia de la mano, con distribución 70/15/15.
 * Si todas las eficiencias son 0, distribuye uniforme.
 */
export function pickPlanet(
  state: GameState,
  playerId: PlayerId,
  deps: ReducerDeps,
  poolPlanetIds: string[],
): string {
  const eff = eficienciasPorCategoria(state, playerId, deps)
  const sorted: Array<{ cat: Categoria; score: number }> = (['Ataque', 'Defensa', 'Ritual'] as Categoria[])
    .map((cat) => ({ cat, score: eff[cat] }))
    .sort((a, b) => b.score - a.score)

  // Distribución de probabilidad: top=70%, mid=15%, bot=15%.
  // Si todas son 0, uniforme.
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

  // Encontrar el planeta del pool con esa categoría.
  for (const planetId of poolPlanetIds) {
    const planet = deps.planets.get(planetId)
    if (planet?.categoria === chosenCat) return planetId
  }
  // Fallback: primer planeta del pool.
  return poolPlanetIds[0]!
}

// ===== HEURÍSTICA 3: Premonición ============================================

/**
 * Predice la categoría que el oponente jugará basándose en su historial reciente.
 * Distribución: más frecuente últimos 3 turnos = 70%, otras = 15% c/u.
 * Sin historia (turno 1): uniforme 33/33/33.
 */
export function pickPremonicion(state: GameState, history: AIHistory): Categoria {
  const recent = history.oponenteCategorias.slice(-3)
  const counts: Record<Categoria, number> = { Ataque: 0, Defensa: 0, Ritual: 0 }
  for (const cat of recent) counts[cat]++

  let dist: Array<{ cat: Categoria; prob: number }>
  if (recent.length === 0) {
    dist = [
      { cat: 'Ataque', prob: 1 / 3 },
      { cat: 'Defensa', prob: 1 / 3 },
      { cat: 'Ritual', prob: 1 / 3 },
    ]
  } else {
    const sorted = (['Ataque', 'Defensa', 'Ritual'] as Categoria[])
      .map((cat) => ({ cat, count: counts[cat] }))
      .sort((a, b) => b.count - a.count)
    dist = [
      { cat: sorted[0]!.cat, prob: 0.7 },
      { cat: sorted[1]!.cat, prob: 0.15 },
      { cat: sorted[2]!.cat, prob: 0.15 },
    ]
  }

  const rng = createRng(state.seed, state.rng)
  const roll = rng.next()
  let acc = 0
  for (const d of dist) {
    acc += d.prob
    if (roll <= acc) return d.cat
  }
  return dist[0]!.cat
}

// ===== HEURÍSTICA 4: Elección de acción =====================================

/**
 * Calcula la fuerza esperada de jugar una carta dado el contexto del turno.
 * Considera condicionales + bonus de planeta. Predice premonición del oponente
 * como "la más frecuente que el oponente ha jugado" (auto-tracking).
 */
function fuerzaEsperada(opts: {
  card: CardActionDef
  miPremonicion: Categoria
  oponentePremonicion: Categoria
  state: GameState
  playerId: PlayerId
  deps: ReducerDeps
}): number {
  const { card, miPremonicion, oponentePremonicion, state, playerId, deps } = opts
  const player = state.players[playerId]
  const planet = player.planetElegidoActual ? deps.planets.get(player.planetElegidoActual) : undefined
  const result = interpretCondicionales({
    card,
    miPremonicion,
    oponentePremonicion,
    planetElegido: planet,
    tramo: state.tramo,
    heroEstado: player.heroEstado,
    raza: player.raza,
    owner: playerId,
  })
  // Aproximación: side effects como valor estimado.
  let estim = result.fuerzaFinal
  for (const eff of result.sideEffects) {
    if (eff.tipo === 'anula' && eff.target === 'oponente') estim += eff.valor * 0.7
    if (eff.tipo === 'robo' && eff.target === 'propio') estim += 0.7
    if (eff.tipo === 'descarte' && eff.target === 'oponente') estim += 0.5
    if (eff.tipo === 'descarte' && eff.target === 'propio') estim -= 0.5
  }
  return estim
}

export type DecisionAccion =
  | { type: 'play'; cardId: string }
  | { type: 'pass' }

/** Elige la carta de la mano que maximiza fuerza esperada dado el contexto. */
export function pickAccion(
  state: GameState,
  playerId: PlayerId,
  deps: ReducerDeps,
  history: AIHistory,
  miPremonicionPlanificada: Categoria,
): DecisionAccion {
  const player = state.players[playerId]
  const energia = getEnergiaParaJugador(state, playerId)
  // Predecir premonición del oponente (auto-tracking, simple).
  const oponentePremonicionEsperada = pickPremonicion(state, {
    oponenteCategorias: history.oponenteCategorias,
  })

  const jugables = player.mano
    .map((id) => deps.cards.get(id))
    .filter((c): c is CardActionDef => c !== undefined && c.coste <= energia)
  if (jugables.length === 0) return { type: 'pass' }

  let best: { cardId: string; expected: number } | undefined
  for (const card of jugables) {
    const exp = fuerzaEsperada({
      card,
      miPremonicion: miPremonicionPlanificada,
      oponentePremonicion: oponentePremonicionEsperada,
      state,
      playerId,
      deps,
    })
    if (!best || exp > best.expected || (exp === best.expected && card.coste > (deps.cards.get(best.cardId)!.coste))) {
      best = { cardId: card.id, expected: exp }
    }
  }
  return { type: 'play', cardId: best!.cardId }
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

  // Calcular fuerza esperada del mejor jugable.
  const decision = pickAccion(state, playerId, deps, history, miPremonicion)
  if (decision.type === 'pass') return false
  const card = deps.cards.get(decision.cardId)
  if (!card) return false
  const exp = fuerzaEsperada({
    card,
    miPremonicion,
    oponentePremonicion: pickPremonicion(state, history),
    state,
    playerId,
    deps,
  })
  // Eclipse ×2 debe llevar mi acción a ≥ 5 fuerza efectiva.
  return exp * 2 >= 5
}
