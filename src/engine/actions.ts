// Discriminated union de Actions del reducer de Sexto Sol v4.1.
//
// Convención: cada action tiene `type` y opcionalmente `playerId` (cuando
// es acción específica de un jugador) + payload de la action.
// El reducer es puro: (state, action) => newState.

import type { Categoria, PlayerId } from './types'

export type Action =
  | { type: 'MULLIGAN'; playerId: PlayerId }
  | { type: 'KEEP_HAND'; playerId: PlayerId }
  | { type: 'SELECT_PLANET'; playerId: PlayerId; planetId: string }
  /** Robo automático de 1 carta a ambos jugadores. Inicio de cada turno. */
  | { type: 'DRAW_BOTH' }
  | { type: 'PLAY_HIDDEN'; playerId: PlayerId; cardId: string }
  | { type: 'PASS_TURN'; playerId: PlayerId } // no puede pagar carta este turno
  | { type: 'DECLARE_PREMONICION'; playerId: PlayerId; categoria: Categoria }
  | { type: 'REVEAL' }
  | { type: 'CLOSE_TRAMO' }
  | { type: 'INVOKE_ECLIPSE'; playerId: PlayerId }
  | { type: 'END_GAME' }

export type ActionType = Action['type']
