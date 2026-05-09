// Reducer puro del engine de Sexto Sol.
//
// Contrato:
//   apply(state, action) → { state: nextState, events: emitted }
//
// Sin mutación in-place. Mismo input → mismo output. Determinismo total.
// Acciones de Phase 1: CONCEDE, END_PHASE (con avance de fase + turno + Edad).
// El resto retorna state sin cambios y un evento `not_implemented` para Phase 2+.

import type { Age, GameAction, GameEvent, GameState, PlayerId, TurnPhase } from './types'

const PHASE_ORDER: readonly TurnPhase[] = [
  'recoleccion',
  'despliegue',
  'combate',
  'regroup',
  'vigilia',
] as const

const TURN_TO_AGE_TRANSITION: Readonly<Record<number, Age>> = {
  5: 2,
  9: 3,
}

export interface ReducerResult {
  state: GameState
  events: readonly GameEvent[]
}

function opponentOf(player: PlayerId): PlayerId {
  return player === 'p1' ? 'p2' : 'p1'
}

function nextPhaseInfo(currentPhase: TurnPhase): { nextPhase: TurnPhase; turnEnded: boolean } {
  const idx = PHASE_ORDER.indexOf(currentPhase)
  // En estado consistente nunca se llega acá con fase inválida — pero por defensa,
  // si se da, la próxima es Recolección.
  if (idx < 0 || idx === PHASE_ORDER.length - 1) {
    return { nextPhase: 'recoleccion', turnEnded: idx === PHASE_ORDER.length - 1 }
  }
  return { nextPhase: PHASE_ORDER[idx + 1] as TurnPhase, turnEnded: false }
}

function ageForTurn(turn: number, currentAge: Age): { age: Age; changed: boolean } {
  const transition = TURN_TO_AGE_TRANSITION[turn]
  if (transition !== undefined && transition > currentAge) {
    return { age: transition, changed: true }
  }
  return { age: currentAge, changed: false }
}

function handleConcede(state: GameState, conceder: PlayerId): ReducerResult {
  const logged = appendLog(state, { type: 'CONCEDE', player: conceder })
  const winner = opponentOf(conceder)
  const outcome = { kind: 'win' as const, winner, reason: 'concession' as const }
  return {
    state: { ...logged, outcome },
    events: [{ type: 'GAME_OVER', outcome }],
  }
}

function handleEndPhase(state: GameState): ReducerResult {
  const logged = appendLog(state, { type: 'END_PHASE' })
  const events: GameEvent[] = []
  events.push({ type: 'PHASE_END', phase: logged.phase, player: logged.activePlayer })

  const { nextPhase, turnEnded } = nextPhaseInfo(logged.phase)

  let nextActivePlayer = logged.activePlayer
  let nextTurn = logged.turn
  let nextAge = logged.age

  if (turnEnded) {
    nextActivePlayer = opponentOf(logged.activePlayer)
    nextTurn = logged.turn + 1
    const ageInfo = ageForTurn(nextTurn, logged.age)
    if (ageInfo.changed) {
      events.push({ type: 'AGE_CHANGED', from: logged.age, to: ageInfo.age })
      nextAge = ageInfo.age
    }
    events.push({ type: 'TURN_START', turn: nextTurn, player: nextActivePlayer })
  }

  events.push({ type: 'PHASE_START', phase: nextPhase, player: nextActivePlayer })

  return {
    state: {
      ...logged,
      phase: nextPhase,
      turn: nextTurn,
      age: nextAge,
      activePlayer: nextActivePlayer,
    },
    events,
  }
}

/**
 * Apply pure: aplica una acción al state, devuelve el nuevo state + eventos
 * que emitió la acción (para que el caller los procese vía event bus).
 *
 * Las acciones no implementadas todavía (Phase 2+) devuelven el state sin
 * cambios — no emiten eventos ni modifican log. El caller puede detectar
 * esto comparando referencias.
 */
export function apply(state: GameState, action: GameAction): ReducerResult {
  // Una vez terminada la partida, todas las acciones son no-op (referencialmente iguales).
  if (state.outcome.kind !== 'in_progress') {
    return { state, events: [] }
  }
  switch (action.type) {
    case 'CONCEDE':
      return handleConcede(state, action.player)
    case 'END_PHASE':
      return handleEndPhase(state)
    case 'PLAY_CARD':
    case 'DECLARE_ATTACK':
    case 'ACTIVATE_PLANET':
    case 'ACTIVATE_HERO_POWER':
    case 'DEPLOY_HERO':
    case 'ACTIVATE_ABILITY':
      // Phase 2+ implementará. Por ahora, no-op consistente: no se loggea, no se emite.
      return { state, events: [] }
  }
}

function appendLog(state: GameState, action: GameAction): GameState {
  return { ...state, log: [...state.log, action] }
}
