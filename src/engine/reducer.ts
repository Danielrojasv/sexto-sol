// Reducer puro de Sexto Sol v4.1.
//
// (state, action) => newState. Sin mutación in-place. Sin LLM. Determinismo total.
// Flujo por turno: ELECCIÓN_PLANETA (solo Neb/Est) → ROBO → ACCIÓN_PENDIENTE
// → PREMONICIÓN_PENDIENTE → REVELAR → (CIERRE_TRAMO o siguiente turno o duelo).
//
// El reducer es una factory: createReducer(deps) devuelve (state, action) => state.
// deps incluye los registries de cartas (definiciones estáticas del pool).

import type { Action } from './actions'
import { aplicarBonusWuronDespertada, interpretCondicionales, type InterpretInput } from './interpreter'
import { createRng, shuffle } from './rng'
import type {
  Categoria,
  CardActionDef,
  CardPlanetDef,
  GameState,
  HeroEstado,
  InterpretResult,
  PlayerId,
  Player,
  SideEffect,
} from './types'

export interface ReducerDeps {
  /** Pool completo de cartas de Acción indexadas por id. */
  cards: Map<string, CardActionDef>
  /** Pool completo de cartas de Planeta indexadas por id. */
  planets: Map<string, CardPlanetDef>
}

const MANO_INICIAL = 4
const CAP_MANO = 7

/** Factory del reducer puro. */
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
        return applyPlayHidden(state, action.playerId, action.cardId, deps)
      case 'PASS_TURN':
        return applyPass(state, action.playerId)
      case 'DECLARE_PREMONICION':
        return applyDeclarePremonicion(state, action.playerId, action.categoria)
      case 'REVEAL':
        return applyReveal(state, deps)
      case 'CLOSE_TRAMO':
        return applyCloseTramo(state, deps)
      case 'INVOKE_ECLIPSE':
        return applyInvokeEclipse(state, action.playerId)
      case 'END_GAME':
        return applyEndGame(state)
      default: {
        // Exhaustiveness check.
        const _exhaust: never = action
        void _exhaust
        return state
      }
    }
  }
}

// ===== HELPERS PRIMITIVOS ===================================================

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
  return {
    ...state,
    players: {
      ...state.players,
      [id]: mutator(state.players[id]),
    },
  }
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

// ===== ENERGÍA POR JUGADOR ==================================================

/** Energía efectiva del jugador en el turno actual (incluye bonus Würon Ascendida). */
export function getEnergiaParaJugador(state: GameState, playerId: PlayerId): number {
  let base = state.turno
  const player = state.players[playerId]
  if (player.heroEstado === 'ascendido' && player.raza === 'Würon') {
    base += 1
  }
  return base
}

// ===== ACTIONS ==============================================================

function applyMulligan(state: GameState, playerId: PlayerId): GameState {
  const player = state.players[playerId]
  if (player.mulliganUsado) {
    throw new Error(`Player ${playerId} ya usó mulligan`)
  }
  if (state.tramo !== 'nebulosa' || state.turno !== 1 || state.subPaso !== 'eleccion_planeta') {
    throw new Error('Mulligan solo válido al inicio de Nebulosa, antes de elegir planeta')
  }
  if (player.planetElegidoActual !== undefined) {
    throw new Error('Mulligan no permitido después de elegir planeta')
  }
  // Devolver mano al mazo restante, mezclar, robar 4 nuevas.
  const merged = [...player.mazoRestante, ...player.mano]
  const { result: shuffled, rngState } = withRng(state, (r) => shuffle(r, merged))
  const newMano = shuffled.slice(0, MANO_INICIAL)
  const newMazo = shuffled.slice(MANO_INICIAL)
  return {
    ...updatePlayer(state, playerId, (p) => ({
      ...p,
      mano: newMano,
      mazoRestante: newMazo,
      mulliganUsado: true,
    })),
    rng: rngState,
  }
}

function applyKeepHand(state: GameState, playerId: PlayerId): GameState {
  // Marcar mulliganUsado=true (la mano se acepta tal cual).
  return updatePlayer(state, playerId, (p) => ({ ...p, mulliganUsado: true }))
}

function applySelectPlanet(
  state: GameState,
  playerId: PlayerId,
  planetId: string,
  deps: ReducerDeps,
): GameState {
  if (state.subPaso !== 'eleccion_planeta') {
    throw new Error(`SELECT_PLANET solo válido en eleccion_planeta, actual: ${state.subPaso}`)
  }
  const pool = state.tramo === 'nebulosa' ? state.poolPlanetasNebulosa : state.poolPlanetasEstrellas
  if (!pool.includes(planetId)) {
    throw new Error(`Planet ${planetId} no está en el pool del tramo ${state.tramo}`)
  }
  if (!deps.planets.has(planetId)) {
    throw new Error(`Planet ${planetId} no existe en el registry`)
  }
  if (state.players[playerId].planetElegidoActual !== undefined) {
    throw new Error(`Player ${playerId} ya eligió planeta este tramo`)
  }

  let next = updatePlayer(state, playerId, (p) => ({
    ...p,
    planetElegidoActual: planetId,
    // Si no usó mulligan al llegar acá, no podrá usarlo después.
    mulliganUsado: true,
  }))

  // Si ambos eligieron, avanzar a sub-paso 'robo' del turno actual.
  const bothChose =
    next.players.a.planetElegidoActual !== undefined &&
    next.players.b.planetElegidoActual !== undefined
  if (bothChose) {
    next = { ...next, subPaso: 'robo' }
  }
  return next
}

function applyDrawBoth(state: GameState): GameState {
  if (state.subPaso !== 'robo') {
    throw new Error(`DRAW_BOTH solo válido en sub-paso robo, actual: ${state.subPaso}`)
  }
  let next = state
  for (const playerId of ['a', 'b'] as const) {
    const player = next.players[playerId]
    if (player.mazoRestante.length === 0) continue // decking out no aplica en v4.1
    const [head, ...rest] = player.mazoRestante
    next = updatePlayer(next, playerId, (p) => ({
      ...p,
      mano: capHand([...p.mano, head!]),
      mazoRestante: rest,
    }))
  }
  return {
    ...next,
    energiaActual: state.turno, // base, getEnergiaParaJugador agrega bonus
    subPaso: 'accion_pendiente',
  }
}

function applyPlayHidden(
  state: GameState,
  playerId: PlayerId,
  cardId: string,
  deps: ReducerDeps,
): GameState {
  if (state.subPaso !== 'accion_pendiente') {
    throw new Error(`PLAY_HIDDEN solo válido en accion_pendiente`)
  }
  const player = state.players[playerId]
  if (!player.mano.includes(cardId)) {
    throw new Error(`Card ${cardId} no está en la mano de ${playerId}`)
  }
  const card = deps.cards.get(cardId)
  if (!card) {
    throw new Error(`Card ${cardId} no existe en el registry`)
  }
  if (state.accionesPendientes[playerId] !== undefined || state.paseDeclarado[playerId] === true) {
    throw new Error(`Player ${playerId} ya jugó/pasó este turno`)
  }
  const energia = getEnergiaParaJugador(state, playerId)
  if (card.coste > energia) {
    throw new Error(
      `Card ${cardId} cuesta ${card.coste} pero ${playerId} tiene ${energia} energía`,
    )
  }

  let next: GameState = updatePlayer(state, playerId, (p) => ({
    ...p,
    mano: p.mano.filter((id) => id !== cardId),
  }))
  next = {
    ...next,
    accionesPendientes: { ...next.accionesPendientes, [playerId]: cardId },
  }
  return advanceIfBothActed(next)
}

function applyPass(state: GameState, playerId: PlayerId): GameState {
  if (state.subPaso !== 'accion_pendiente') {
    throw new Error(`PASS_TURN solo válido en accion_pendiente`)
  }
  if (state.accionesPendientes[playerId] !== undefined || state.paseDeclarado[playerId] === true) {
    throw new Error(`Player ${playerId} ya jugó/pasó este turno`)
  }
  const next: GameState = {
    ...state,
    paseDeclarado: { ...state.paseDeclarado, [playerId]: true },
  }
  return advanceIfBothActed(next)
}

function advanceIfBothActed(state: GameState): GameState {
  const aActed =
    state.accionesPendientes.a !== undefined || state.paseDeclarado.a === true
  const bActed =
    state.accionesPendientes.b !== undefined || state.paseDeclarado.b === true
  if (aActed && bActed) {
    return { ...state, subPaso: 'premonicion_pendiente' }
  }
  return state
}

function applyDeclarePremonicion(
  state: GameState,
  playerId: PlayerId,
  categoria: Categoria,
): GameState {
  if (state.subPaso !== 'premonicion_pendiente') {
    throw new Error(`DECLARE_PREMONICION solo válido en premonicion_pendiente`)
  }
  if (state.premoniciones[playerId] !== undefined) {
    throw new Error(`Player ${playerId} ya declaró premonición este turno`)
  }
  let next: GameState = {
    ...state,
    premoniciones: { ...state.premoniciones, [playerId]: categoria },
  }
  if (next.premoniciones.a !== undefined && next.premoniciones.b !== undefined) {
    next = { ...next, subPaso: 'revelar' }
  }
  return next
}

// ===== REVEAL ==============================================================

function applyReveal(state: GameState, deps: ReducerDeps): GameState {
  if (state.subPaso !== 'revelar') {
    throw new Error(`REVEAL solo válido en revelar`)
  }
  if (state.premoniciones.a === undefined || state.premoniciones.b === undefined) {
    throw new Error(`No se puede REVEAL sin ambas premoniciones declaradas`)
  }

  const cardIdA = state.accionesPendientes.a
  const cardIdB = state.accionesPendientes.b
  const cardA = cardIdA ? deps.cards.get(cardIdA) : undefined
  const cardB = cardIdB ? deps.cards.get(cardIdB) : undefined

  // 1. Interpretar ambas cartas (puro, no toca atributos todavía).
  const resultA = cardA ? interpretCard(state, 'a', cardA, deps) : undefined
  const resultB = cardB ? interpretCard(state, 'b', cardB, deps) : undefined

  // 1b. Bonus Würon Despertada: +1 a la fuerza si MI premonición acertó la
  //     categoría jugada por el OPONENTE (info que requiere el segundo pase).
  let fuerzaA = resultA?.fuerzaFinal ?? 0
  let fuerzaB = resultB?.fuerzaFinal ?? 0
  if (resultA) {
    fuerzaA += aplicarBonusWuronDespertada({
      heroEstado: state.players.a.heroEstado,
      raza: state.players.a.raza,
      miPremonicion: state.premoniciones.a!,
      categoriaJugadaPorOponente: resultB?.categoria,
    })
  }
  if (resultB) {
    fuerzaB += aplicarBonusWuronDespertada({
      heroEstado: state.players.b.heroEstado,
      raza: state.players.b.raza,
      miPremonicion: state.premoniciones.b!,
      categoriaJugadaPorOponente: resultA?.categoria,
    })
  }

  // 2. Aplicar anulaciones cruzadas: side effect 'anula' de A le resta fuerza a B y viceversa.
  if (resultA) {
    for (const eff of resultA.sideEffects) {
      if (eff.tipo === 'anula' && eff.target === 'oponente') {
        fuerzaB = Math.max(0, fuerzaB - eff.valor)
      }
    }
  }
  if (resultB) {
    for (const eff of resultB.sideEffects) {
      if (eff.tipo === 'anula' && eff.target === 'oponente') {
        fuerzaA = Math.max(0, fuerzaA - eff.valor)
      }
    }
  }

  // 3. Aplicar Eclipse ×2 (después de anulaciones, antes de sumar a atributos).
  if (state.eclipseInvocado && state.eclipseInvocador === 'a') {
    fuerzaA *= 2
  }
  if (state.eclipseInvocado && state.eclipseInvocador === 'b') {
    fuerzaB *= 2
  }

  // 4. Sumar fuerza a atributos del jugador correspondiente.
  let next = state
  if (resultA) {
    const key = categoriaToAtributo(resultA.categoria)
    next = updatePlayer(next, 'a', (p) => ({
      ...p,
      atributos: { ...p.atributos, [key]: p.atributos[key] + fuerzaA },
    }))
  }
  if (resultB) {
    const key = categoriaToAtributo(resultB.categoria)
    next = updatePlayer(next, 'b', (p) => ({
      ...p,
      atributos: { ...p.atributos, [key]: p.atributos[key] + fuerzaB },
    }))
  }

  // 5. Aplicar side effects no-anula (descarte, robo).
  if (resultA) {
    next = applyNonAnularSideEffects(next, 'a', resultA.sideEffects)
  }
  if (resultB) {
    next = applyNonAnularSideEffects(next, 'b', resultB.sideEffects)
  }

  // 6. Mover cartas reveladas al pozo.
  if (cardIdA) {
    next = updatePlayer(next, 'a', (p) => ({ ...p, pozo: [...p.pozo, cardIdA] }))
  }
  if (cardIdB) {
    next = updatePlayer(next, 'b', (p) => ({ ...p, pozo: [...p.pozo, cardIdB] }))
  }

  // 7. Cleanup del turno.
  next = {
    ...next,
    accionesPendientes: {},
    premoniciones: {},
    paseDeclarado: {},
  }

  // 8. Eclipse fuerza el final.
  if (next.eclipseInvocado) {
    next = { ...next, subPaso: 'duelo_final' }
    return applyEndGame(next)
  }

  // 9. Cierre de tramo si fue el último turno.
  const isLastTurnOfTramo =
    (next.tramo === 'nebulosa' && next.turno === 2) ||
    (next.tramo === 'estrellas' && next.turno === 4)
  if (isLastTurnOfTramo) {
    return { ...next, subPaso: 'cierre_tramo' }
  }

  // 10. Fin del turno 7 sin Eclipse → duelo final.
  if (next.turno === 7) {
    next = { ...next, subPaso: 'duelo_final' }
    return applyEndGame(next)
  }

  // 11. Avanzar al siguiente turno.
  return {
    ...next,
    turno: next.turno + 1,
    subPaso: 'robo',
  }
}

function interpretCard(
  state: GameState,
  ownerId: PlayerId,
  card: CardActionDef,
  deps: ReducerDeps,
): InterpretResult {
  const owner = state.players[ownerId]
  const planetId = owner.planetElegidoActual
  const planet = planetId ? deps.planets.get(planetId) : undefined
  const input: InterpretInput = {
    card,
    miPremonicion: state.premoniciones[ownerId]!,
    oponentePremonicion: state.premoniciones[otherPlayer(ownerId)]!,
    planetElegido: planet,
    tramo: state.tramo,
    heroEstado: owner.heroEstado,
    raza: owner.raza,
    owner: ownerId,
  }
  return interpretCondicionales(input)
}

function applyNonAnularSideEffects(
  state: GameState,
  sourceOwner: PlayerId,
  sideEffects: SideEffect[],
): GameState {
  let next = state
  for (const eff of sideEffects) {
    if (eff.tipo === 'anula') continue // ya aplicado en pre-cálculo
    const target: PlayerId = eff.target === 'propio' ? sourceOwner : otherPlayer(sourceOwner)
    if (eff.tipo === 'descarte') {
      next = discardCardsFromHand(next, target, eff.valor)
    } else if (eff.tipo === 'robo') {
      next = drawCardsToHand(next, target, eff.valor)
    }
  }
  return next
}

function discardCardsFromHand(state: GameState, playerId: PlayerId, n: number): GameState {
  return updatePlayer(state, playerId, (p) => {
    const descartadas = p.mano.slice(0, n)
    const remaining = p.mano.slice(n)
    return { ...p, mano: remaining, pozo: [...p.pozo, ...descartadas] }
  })
}

function drawCardsToHand(state: GameState, playerId: PlayerId, n: number): GameState {
  let next = state
  for (let i = 0; i < n; i++) {
    const player = next.players[playerId]
    if (player.mazoRestante.length === 0) break
    const [head, ...rest] = player.mazoRestante
    next = updatePlayer(next, playerId, (p) => ({
      ...p,
      mano: capHand([...p.mano, head!]),
      mazoRestante: rest,
    }))
  }
  return next
}

// ===== CIERRE TRAMO ========================================================

function applyCloseTramo(state: GameState, deps: ReducerDeps): GameState {
  if (state.subPaso !== 'cierre_tramo') {
    throw new Error(`CLOSE_TRAMO solo válido en cierre_tramo`)
  }
  // Per jugador independientemente: comparar SU atributo del planeta-elegido
  // contra el atributo del oponente en la MISMA categoría.
  let next = state
  for (const playerId of ['a', 'b'] as const) {
    const player = next.players[playerId]
    if (!player.planetElegidoActual) {
      throw new Error(`Player ${playerId} no tiene planeta elegido en cierre de tramo`)
    }
    const planet = deps.planets.get(player.planetElegidoActual)
    if (!planet) {
      throw new Error(`Planet ${player.planetElegidoActual} no en registry`)
    }
    const atributoKey = categoriaToAtributo(planet.categoria)
    const miValor = player.atributos[atributoKey]
    const oponenteValor = next.players[otherPlayer(playerId)].atributos[atributoKey]
    if (miValor > oponenteValor) {
      next = updatePlayer(next, playerId, (p) => ({
        ...p,
        heroEstado: avanzarHeroEstado(p.heroEstado),
      }))
    }
    // Si <= empate o menor: NO avanza.
  }
  // Reset planetElegidoActual para el siguiente tramo.
  next = updatePlayer(next, 'a', (p) => ({ ...p, planetElegidoActual: undefined }))
  next = updatePlayer(next, 'b', (p) => ({ ...p, planetElegidoActual: undefined }))

  // Avanzar tramo + turno.
  if (next.tramo === 'nebulosa') {
    return { ...next, tramo: 'estrellas', turno: 3, subPaso: 'eleccion_planeta' }
  } else if (next.tramo === 'estrellas') {
    return { ...next, tramo: 'sexto_sol', turno: 5, subPaso: 'robo' }
  }
  return next
}

// ===== ECLIPSE =============================================================

function applyInvokeEclipse(state: GameState, playerId: PlayerId): GameState {
  if (state.tramo !== 'sexto_sol') {
    throw new Error(`Eclipse solo en Sexto Sol`)
  }
  if (state.eclipseInvocado) {
    throw new Error(`Eclipse ya invocado`)
  }
  // Eclipse se invoca al INICIO del turno antes de jugar acción (sub-paso accion_pendiente
  // o premonicion_pendiente — práctico para UI: el jugador puede invocar antes de
  // comprometerse con su acción).
  if (state.subPaso !== 'accion_pendiente' && state.subPaso !== 'premonicion_pendiente') {
    throw new Error(`Eclipse se invoca en accion_pendiente o premonicion_pendiente`)
  }
  // El oponente roba 1 extra antes de jugar su acción.
  const next = drawCardsToHand(state, otherPlayer(playerId), 1)
  return { ...next, eclipseInvocado: true, eclipseInvocador: playerId }
}

// ===== END GAME ============================================================

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
    // Tiebreakers (§10.1).
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

  return {
    ...state,
    subPaso: 'terminado',
    ganador,
    finalTally: { a: tallyA, b: tallyB },
  }
}
