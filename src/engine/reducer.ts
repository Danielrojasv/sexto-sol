// Reducer puro de Sexto Sol v4.2.
//
// Modelo B2 "Premonición como Lectura": premonición es oculta hasta el revelado.
// El sub-paso 'premonicion_pendiente' fue eliminado; carta + premonición se eligen
// en paralelo durante 'seleccion_secreta'.
//
// Flujo por turno:
//   mulligan_inicial (T1 solo) → eleccion_planeta (inicio Neb/Est)
//   → robo → seleccion_secreta → revelar → revisar_resolucion
//   → (cierre_tramo o siguiente turno o duelo_final)

import type { Action } from './actions'
import { interpretCondicionales, penalizacionPorPasarConAcierto, type InterpretInput } from './interpreter'
import { createRng, shuffle } from './rng'
import type {
  Categoria,
  CardActionDef,
  CardPlanetDef,
  GameState,
  HeroEstado,
  PlayerId,
  Player,
  PremonicionRevelada,
  SideEffect,
} from './types'

export interface ReducerDeps {
  cards: Map<string, CardActionDef>
  planets: Map<string, CardPlanetDef>
}

const MANO_INICIAL = 4
const CAP_MANO = 7

export function createReducer(
  deps: ReducerDeps,
): (state: GameState, action: Action) => GameState {
  return function reducer(state: GameState, action: Action): GameState {
    switch (action.type) {
      case 'MULLIGAN':
        return applyMulligan(state, action.playerId)
      case 'KEEP_HAND':
        return applyKeepHand(state, action.playerId)
      case 'SELECT_PLANET':
        return applySelectPlanet(state, action.playerId, action.planetId, deps)
      case 'DRAW_BOTH':
        return applyDrawBoth(state)
      case 'PLAY_HIDDEN':
        return applyPlayHidden(state, action.playerId, action.cardId, action.premonicion, deps)
      case 'PASS_TURN':
        return applyPass(state, action.playerId, action.premonicion)
      case 'REVEAL':
        return applyReveal(state, deps)
      case 'CONTINUE_TURN':
        return applyContinueTurn(state)
      case 'CLOSE_TRAMO':
        return applyCloseTramo(state, deps)
      case 'INVOKE_ECLIPSE':
        return applyInvokeEclipse(state, action.playerId)
      case 'END_GAME':
        return applyEndGame(state)
      default: {
        const _exhaust: never = action
        void _exhaust
        return state
      }
    }
  }
}

// ===== HELPERS ==============================================================

function withRng<T>(
  state: GameState,
  fn: (rng: ReturnType<typeof createRng>) => T,
): { result: T; rngState: GameState['rng'] } {
  const rng = createRng(state.seed, state.rng)
  const result = fn(rng)
  return { result, rngState: rng.snapshot() }
}

function updatePlayer(
  state: GameState,
  id: PlayerId,
  mutator: (p: Player) => Player,
): GameState {
  return { ...state, players: { ...state.players, [id]: mutator(state.players[id]) } }
}

function otherPlayer(id: PlayerId): PlayerId {
  return id === 'a' ? 'b' : 'a'
}

function categoriaToAtributo(cat: Categoria): keyof Player['atributos'] {
  switch (cat) {
    case 'Ataque':
      return 'fuerza'
    case 'Defensa':
      return 'resguardo'
    case 'Ritual':
      return 'resonancia'
  }
}

function avanzarHeroEstado(actual: HeroEstado): HeroEstado {
  switch (actual) {
    case 'neutral':
      return 'despertado'
    case 'despertado':
      return 'ascendido'
    case 'ascendido':
      return 'ascendido'
  }
}

function capHand(mano: string[]): string[] {
  if (mano.length > CAP_MANO) return mano.slice(0, CAP_MANO)
  return mano
}

export function getEnergiaParaJugador(state: GameState, playerId: PlayerId): number {
  let base = state.turno
  const player = state.players[playerId]
  if (player.heroEstado === 'ascendido' && player.raza === 'Würon') base += 1
  return base
}

// ===== MULLIGAN =============================================================

function applyMulligan(state: GameState, playerId: PlayerId): GameState {
  if (state.subPaso !== 'mulligan_inicial') {
    throw new Error(`MULLIGAN solo válido en mulligan_inicial`)
  }
  const player = state.players[playerId]
  if (player.mulliganUsado) throw new Error(`Player ${playerId} ya usó mulligan`)
  if (player.manoAceptada) throw new Error(`Player ${playerId} ya aceptó su mano`)
  const merged = [...player.mazoRestante, ...player.mano]
  const { result: shuffled, rngState } = withRng(state, (r) => shuffle(r, merged))
  return {
    ...updatePlayer(state, playerId, (p) => ({
      ...p,
      mano: shuffled.slice(0, MANO_INICIAL),
      mazoRestante: shuffled.slice(MANO_INICIAL),
      mulliganUsado: true,
    })),
    rng: rngState,
  }
}

function applyKeepHand(state: GameState, playerId: PlayerId): GameState {
  if (state.subPaso !== 'mulligan_inicial') {
    throw new Error(`KEEP_HAND solo válido en mulligan_inicial`)
  }
  if (state.players[playerId].manoAceptada) {
    throw new Error(`Player ${playerId} ya aceptó`)
  }
  let next = updatePlayer(state, playerId, (p) => ({ ...p, manoAceptada: true }))
  if (next.players.a.manoAceptada && next.players.b.manoAceptada) {
    next = { ...next, subPaso: 'eleccion_planeta' }
  }
  return next
}

// ===== SELECT_PLANET ========================================================

function applySelectPlanet(
  state: GameState,
  playerId: PlayerId,
  planetId: string,
  deps: ReducerDeps,
): GameState {
  if (state.subPaso !== 'eleccion_planeta') {
    throw new Error(`SELECT_PLANET solo válido en eleccion_planeta`)
  }
  const pool = state.tramo === 'nebulosa' ? state.poolPlanetasNebulosa : state.poolPlanetasEstrellas
  if (!pool.includes(planetId)) throw new Error(`Planet ${planetId} no en pool`)
  if (!deps.planets.has(planetId)) throw new Error(`Planet ${planetId} no en registry`)
  if (state.players[playerId].planetElegidoActual !== undefined) {
    throw new Error(`Player ${playerId} ya eligió`)
  }
  let next = updatePlayer(state, playerId, (p) => ({
    ...p,
    planetElegidoActual: planetId,
    mulliganUsado: true,
  }))
  if (
    next.players.a.planetElegidoActual !== undefined &&
    next.players.b.planetElegidoActual !== undefined
  ) {
    next = { ...next, subPaso: 'robo' }
  }
  return next
}

// ===== DRAW =================================================================

function applyDrawBoth(state: GameState): GameState {
  if (state.subPaso !== 'robo') {
    throw new Error(`DRAW_BOTH solo válido en sub-paso robo`)
  }
  let next = state
  for (const playerId of ['a', 'b'] as const) {
    const player = next.players[playerId]
    if (player.mazoRestante.length === 0) continue
    const [head, ...rest] = player.mazoRestante
    next = updatePlayer(next, playerId, (p) => ({
      ...p,
      mano: capHand([...p.mano, head!]),
      mazoRestante: rest,
    }))
  }
  return { ...next, energiaActual: state.turno, subPaso: 'seleccion_secreta' }
}

// ===== PLAY / PASS ==========================================================

function applyPlayHidden(
  state: GameState,
  playerId: PlayerId,
  cardId: string,
  premonicion: Categoria,
  deps: ReducerDeps,
): GameState {
  if (state.subPaso !== 'seleccion_secreta') {
    throw new Error(`PLAY_HIDDEN solo válido en seleccion_secreta`)
  }
  const player = state.players[playerId]
  if (state.accionesPendientes[playerId] !== undefined || state.paseDeclarado[playerId] === true) {
    throw new Error(`Player ${playerId} ya decidió este turno`)
  }
  if (!player.mano.includes(cardId)) throw new Error(`Card ${cardId} no en mano`)
  const card = deps.cards.get(cardId)
  if (!card) throw new Error(`Card ${cardId} no en registry`)
  const energia = getEnergiaParaJugador(state, playerId)
  if (card.coste > energia) {
    throw new Error(`Card ${cardId} cuesta ${card.coste}, energía ${energia}`)
  }

  let next: GameState = updatePlayer(state, playerId, (p) => ({
    ...p,
    mano: p.mano.filter((id) => id !== cardId),
  }))
  next = {
    ...next,
    accionesPendientes: { ...next.accionesPendientes, [playerId]: cardId },
    premoniciones: { ...next.premoniciones, [playerId]: premonicion },
  }
  return advanceIfBothActed(next)
}

function applyPass(state: GameState, playerId: PlayerId, premonicion: Categoria): GameState {
  if (state.subPaso !== 'seleccion_secreta') {
    throw new Error(`PASS_TURN solo válido en seleccion_secreta`)
  }
  if (state.accionesPendientes[playerId] !== undefined || state.paseDeclarado[playerId] === true) {
    throw new Error(`Player ${playerId} ya decidió`)
  }
  const next: GameState = {
    ...state,
    paseDeclarado: { ...state.paseDeclarado, [playerId]: true },
    premoniciones: { ...state.premoniciones, [playerId]: premonicion },
  }
  return advanceIfBothActed(next)
}

function advanceIfBothActed(state: GameState): GameState {
  const aActed =
    state.accionesPendientes.a !== undefined || state.paseDeclarado.a === true
  const bActed =
    state.accionesPendientes.b !== undefined || state.paseDeclarado.b === true
  if (aActed && bActed && state.premoniciones.a && state.premoniciones.b) {
    return { ...state, subPaso: 'revelar' }
  }
  return state
}

// ===== REVEAL ===============================================================

function applyReveal(state: GameState, deps: ReducerDeps): GameState {
  if (state.subPaso !== 'revelar') throw new Error(`REVEAL solo válido en revelar`)
  if (!state.premoniciones.a || !state.premoniciones.b) {
    throw new Error(`Falta premonición de algún jugador`)
  }

  const cardIdA = state.accionesPendientes.a
  const cardIdB = state.accionesPendientes.b
  const cardA = cardIdA ? deps.cards.get(cardIdA) : undefined
  const cardB = cardIdB ? deps.cards.get(cardIdB) : undefined

  let next = state

  // 1. Interpretar carta de A (si jugó).
  let fuerzaA = 0
  let categoriaA: Categoria | undefined
  let sideEffectsA: SideEffect[] = []
  if (cardA) {
    const planetA = next.players.a.planetElegidoActual
      ? deps.planets.get(next.players.a.planetElegidoActual)
      : undefined
    const input: InterpretInput = {
      card: cardA,
      miPremonicion: state.premoniciones.a!,
      oponentePremonicion: state.premoniciones.b!,
      oponenteCategoria: cardB?.categoria,
      planetElegido: planetA,
      tramo: state.tramo,
      heroEstado: state.players.a.heroEstado,
      raza: state.players.a.raza,
      owner: 'a',
      atributosPropio: state.players.a.atributos,
      atributosOponente: state.players.b.atributos,
      eclipseActivo: state.eclipseInvocado,
      eclipseInvocador: state.eclipseInvocador,
    }
    const r = interpretCondicionales(input)
    fuerzaA = r.fuerzaFinal
    categoriaA = r.categoria
    sideEffectsA = r.sideEffects
  } else if (state.paseDeclarado.a) {
    // A pasó: sus premonición igual puede aplicar penalización mínima al rival.
    // Esto se procesa en la rama de cardB (cuando computamos B, le restamos si A acertó).
  }

  // 2. Interpretar carta de B.
  let fuerzaB = 0
  let categoriaB: Categoria | undefined
  let sideEffectsB: SideEffect[] = []
  if (cardB) {
    const planetB = next.players.b.planetElegidoActual
      ? deps.planets.get(next.players.b.planetElegidoActual)
      : undefined
    const input: InterpretInput = {
      card: cardB,
      miPremonicion: state.premoniciones.b!,
      oponentePremonicion: state.premoniciones.a!,
      oponenteCategoria: cardA?.categoria,
      planetElegido: planetB,
      tramo: state.tramo,
      heroEstado: state.players.b.heroEstado,
      raza: state.players.b.raza,
      owner: 'b',
      atributosPropio: state.players.b.atributos,
      atributosOponente: state.players.a.atributos,
      eclipseActivo: state.eclipseInvocado,
      eclipseInvocador: state.eclipseInvocador,
    }
    const r = interpretCondicionales(input)
    fuerzaB = r.fuerzaFinal
    categoriaB = r.categoria
    sideEffectsB = r.sideEffects
  }

  // 3. Pasar con acierto: si un jugador pasó y su premonición acertó la categoría
  //    de la carta del rival, aplicamos -1 fijo al rival (§4.3 SPEC).
  if (state.paseDeclarado.a && cardB && state.premoniciones.a) {
    const pen = penalizacionPorPasarConAcierto(state.premoniciones.a, cardB.categoria)
    fuerzaB = Math.max(0, fuerzaB - pen)
  }
  if (state.paseDeclarado.b && cardA && state.premoniciones.b) {
    const pen = penalizacionPorPasarConAcierto(state.premoniciones.b, cardA.categoria)
    fuerzaA = Math.max(0, fuerzaA - pen)
  }

  // 4. Sumar fuerza a atributos.
  if (categoriaA !== undefined) {
    const key = categoriaToAtributo(categoriaA)
    next = updatePlayer(next, 'a', (p) => ({
      ...p,
      atributos: { ...p.atributos, [key]: p.atributos[key] + fuerzaA },
    }))
  }
  if (categoriaB !== undefined) {
    const key = categoriaToAtributo(categoriaB)
    next = updatePlayer(next, 'b', (p) => ({
      ...p,
      atributos: { ...p.atributos, [key]: p.atributos[key] + fuerzaB },
    }))
  }

  // 5. Aplicar side effects.
  next = applySideEffects(next, 'a', sideEffectsA, deps)
  next = applySideEffects(next, 'b', sideEffectsB, deps)

  // 6. Guardar entrada de historial de premoniciones reveladas.
  const historial: PremonicionRevelada = {
    turno: state.turno,
    tramo: state.tramo,
    a: state.premoniciones.a!,
    b: state.premoniciones.b!,
    cardCategoriaA: cardA?.categoria ?? state.premoniciones.a!,
    cardCategoriaB: cardB?.categoria ?? state.premoniciones.b!,
  }
  next = {
    ...next,
    historialPremoniciones: [...next.historialPremoniciones, historial],
    subPaso: 'revisar_resolucion',
  }
  return next
}

function applySideEffects(
  state: GameState,
  source: PlayerId,
  effs: SideEffect[],
  _deps: ReducerDeps,
): GameState {
  let next = state
  for (const eff of effs) {
    switch (eff.tipo) {
      case 'descarte_oponente': {
        const target = otherPlayer(source)
        next = updatePlayer(next, target, (p) => {
          const descartadas = p.mano.slice(0, eff.valor)
          return { ...p, mano: p.mano.slice(eff.valor), pozo: [...p.pozo, ...descartadas] }
        })
        break
      }
      case 'robo_propio': {
        for (let i = 0; i < eff.valor; i++) {
          const player = next.players[source]
          if (player.mazoRestante.length === 0) break
          const [head, ...rest] = player.mazoRestante
          next = updatePlayer(next, source, (p) => ({
            ...p,
            mano: capHand([...p.mano, head!]),
            mazoRestante: rest,
          }))
        }
        break
      }
      case 'mirar_mazo_oponente': {
        const target = otherPlayer(source)
        const card = next.players[target].mazoRestante[0]
        next = { ...next, peekedCardOponente: card }
        break
      }
      case 'bloqueo_planeta': {
        // El bonus de planeta del oponente NO se aplica este turno. Como ya pasamos
        // por el interpreter, este side effect debería evaluarse antes — pero el
        // SPEC dice que se aplica como side effect. En v4.2 lo modelamos como
        // "elimina temporalmente el planet del oponente". Por simplicidad: no-op
        // este turno (su carta ya fue procesada con bonus; recordar implementar
        // si vuelve este efecto en cartas futuras).
        break
      }
    }
  }
  return next
}

// ===== CONTINUE / CIERRE / ECLIPSE / END ====================================

function applyContinueTurn(state: GameState): GameState {
  if (state.subPaso !== 'revisar_resolucion') {
    throw new Error(`CONTINUE_TURN solo válido en revisar_resolucion`)
  }
  let next = state

  const cardIdA = next.accionesPendientes.a
  const cardIdB = next.accionesPendientes.b
  if (cardIdA) next = updatePlayer(next, 'a', (p) => ({ ...p, pozo: [...p.pozo, cardIdA] }))
  if (cardIdB) next = updatePlayer(next, 'b', (p) => ({ ...p, pozo: [...p.pozo, cardIdB] }))

  next = {
    ...next,
    accionesPendientes: {},
    premoniciones: {},
    paseDeclarado: {},
    peekedCardOponente: undefined,
  }

  if (next.eclipseInvocado) {
    next = { ...next, subPaso: 'duelo_final' }
    return applyEndGame(next)
  }

  const isLastTurnOfTramo =
    (next.tramo === 'nebulosa' && next.turno === 2) ||
    (next.tramo === 'estrellas' && next.turno === 4)
  if (isLastTurnOfTramo) return { ...next, subPaso: 'cierre_tramo' }

  if (next.turno === 7) {
    next = { ...next, subPaso: 'duelo_final' }
    return applyEndGame(next)
  }
  return { ...next, turno: next.turno + 1, subPaso: 'robo' }
}

function applyCloseTramo(state: GameState, deps: ReducerDeps): GameState {
  if (state.subPaso !== 'cierre_tramo') throw new Error(`CLOSE_TRAMO solo en cierre_tramo`)
  let next = state
  for (const playerId of ['a', 'b'] as const) {
    const player = next.players[playerId]
    if (!player.planetElegidoActual) throw new Error(`${playerId} sin planeta elegido`)
    const planet = deps.planets.get(player.planetElegidoActual)
    if (!planet) throw new Error(`Planet ${player.planetElegidoActual} no en registry`)
    const key = categoriaToAtributo(planet.categoria)
    const mi = player.atributos[key]
    const op = next.players[otherPlayer(playerId)].atributos[key]
    if (mi > op) {
      next = updatePlayer(next, playerId, (p) => ({
        ...p,
        heroEstado: avanzarHeroEstado(p.heroEstado),
      }))
    }
  }
  next = updatePlayer(next, 'a', (p) => ({ ...p, planetElegidoActual: undefined }))
  next = updatePlayer(next, 'b', (p) => ({ ...p, planetElegidoActual: undefined }))
  if (next.tramo === 'nebulosa') {
    return { ...next, tramo: 'estrellas', turno: 3, subPaso: 'eleccion_planeta' }
  } else if (next.tramo === 'estrellas') {
    return { ...next, tramo: 'sexto_sol', turno: 5, subPaso: 'robo' }
  }
  return next
}

function applyInvokeEclipse(state: GameState, playerId: PlayerId): GameState {
  if (state.tramo !== 'sexto_sol') throw new Error(`Eclipse solo en Sexto Sol`)
  if (state.eclipseInvocado) throw new Error(`Eclipse ya invocado`)
  if (state.subPaso !== 'seleccion_secreta') {
    throw new Error(`Eclipse se invoca en seleccion_secreta (antes de comprometerse)`)
  }
  // Oponente roba 1 extra.
  let next = state
  const target = otherPlayer(playerId)
  const player = next.players[target]
  if (player.mazoRestante.length > 0) {
    const [head, ...rest] = player.mazoRestante
    next = updatePlayer(next, target, (p) => ({
      ...p,
      mano: capHand([...p.mano, head!]),
      mazoRestante: rest,
    }))
  }
  return { ...next, eclipseInvocado: true, eclipseInvocador: playerId }
}

function applyEndGame(state: GameState): GameState {
  const a = state.players.a.atributos
  const b = state.players.b.atributos
  let tallyA = 0
  let tallyB = 0
  if (a.fuerza > b.fuerza) tallyA++
  else if (b.fuerza > a.fuerza) tallyB++
  if (a.resguardo > b.resguardo) tallyA++
  else if (b.resguardo > a.resguardo) tallyB++
  if (a.resonancia > b.resonancia) tallyA++
  else if (b.resonancia > a.resonancia) tallyB++

  let ganador: PlayerId | 'empate'
  if (tallyA >= 2 && tallyA > tallyB) ganador = 'a'
  else if (tallyB >= 2 && tallyB > tallyA) ganador = 'b'
  else {
    const sumA = a.fuerza + a.resguardo + a.resonancia
    const sumB = b.fuerza + b.resguardo + b.resonancia
    if (sumA > sumB) ganador = 'a'
    else if (sumB > sumA) ganador = 'b'
    else {
      const orden = (e: HeroEstado) => (e === 'ascendido' ? 2 : e === 'despertado' ? 1 : 0)
      if (orden(state.players.a.heroEstado) > orden(state.players.b.heroEstado)) ganador = 'a'
      else if (orden(state.players.b.heroEstado) > orden(state.players.a.heroEstado)) ganador = 'b'
      else ganador = 'empate'
    }
  }
  return { ...state, subPaso: 'terminado', ganador, finalTally: { a: tallyA, b: tallyB } }
}
