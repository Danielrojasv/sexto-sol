// Discriminated union de Actions del reducer de Sexto Sol v4.2.
//
// Cambios respecto a v4.1:
//   - PLAY_HIDDEN ahora incluye premonición (ambas se eligen en paralelo, ocultas).
//   - PASS_TURN ahora incluye premonición (igual puede acertar y debilitar al rival).
//   - DECLARE_PREMONICION eliminada (no hay paso público de declaración).

import type { Categoria, PlayerId } from './types'

export type Action =
  | { type: 'MULLIGAN'; playerId: PlayerId }
  | { type: 'KEEP_HAND'; playerId: PlayerId }
  | { type: 'SELECT_PLANET'; playerId: PlayerId; planetId: string }
  | { type: 'DRAW_BOTH' }
  /** Jugar carta boca abajo + declarar premonición oculta sobre el oponente. */
  | { type: 'PLAY_HIDDEN'; playerId: PlayerId; cardId: string; premonicion: Categoria }
  /** Pasar (no juega carta) pero declara premonición igual. */
  | { type: 'PASS_TURN'; playerId: PlayerId; premonicion: Categoria }
  | { type: 'REVEAL' }
  /** Tras revisar la resolución del revelado, avanzar al siguiente sub-paso. */
  | { type: 'CONTINUE_TURN' }
  | { type: 'CLOSE_TRAMO' }
  | { type: 'INVOKE_ECLIPSE'; playerId: PlayerId }
  | { type: 'END_GAME' }

export type ActionType = Action['type']
