// Mecánica firma Würon — Külen (reactive).
//
// "Cuando esta nave recibe daño y sobrevive, gana +1 fuerza permanente."
//
// Categoría: reactive (orden 1).
// Trigger: on_event SHIP_DAMAGED donde event.shipId === sourceShipId Y la nave
// sigue viva (currentHp > 0).
// Effect: modifica strength del field directamente (buff permanente, queda
// en `ship.strength`).
//
// Las cartas Würon con keyword `kulen` se descubren al deriva handlers del bus
// sin necesidad de ability JSON en la carta. Esto permite que cualquier nave
// con la keyword herede el comportamiento.
//
// Amplificadores (Trono de Lhülkan): keyword_amplifier `kulen` deltaBonus=1
// se aplican en Commit 3 (registry de amplifiers).

import type { EventHandler } from '../events'
import type { GameState, ShipInstance } from '../types'

export const KW_KULEN = 'kulen'

/**
 * Construye un EventHandler que aplica el buff de Külen a la nave que recibió
 * daño y sobrevivió. El delta se calcula consultando amplifiers activos en el
 * mismo controller (Commit 3: por ahora delta fijo = 1).
 */
export function buildKulenHandler(ship: ShipInstance): EventHandler {
  return {
    trigger: 'SHIP_DAMAGED',
    category: 'reactive',
    premonition: false,
    context: { selfId: ship.instanceId, selfController: ship.controller },
    filter: (event, ctx) => {
      if (event.type !== 'SHIP_DAMAGED') return false
      // Sólo la nave dañada que tiene la keyword aplica buff a sí misma.
      return event.shipId === ctx.selfId
    },
    effect: (event, state) => {
      if (event.type !== 'SHIP_DAMAGED') return { state, emit: [] }
      // El handler corre DESPUÉS de aplicar el daño. El ship debe seguir vivo
      // (hp > 0) para gatillar. Lookup en state actualizado.
      const found = findShipInState(state, event.shipId)
      if (!found) return { state, emit: [] }
      if (found.ship.hp <= 0) return { state, emit: [] }
      // Delta canónico Külen = +1. Amplifier (Trono de Lhülkan) sumará en Commit 3.
      const delta = computeKulenDelta(state, found.ship)
      const buffed: ShipInstance = { ...found.ship, strength: found.ship.strength + delta }
      const player = state.players[found.owner]
      const fleet = player.fleet.map((s) =>
        s.instanceId === buffed.instanceId ? buffed : s,
      )
      return {
        state: {
          ...state,
          players: {
            ...state.players,
            [found.owner]: { ...player, fleet },
          },
        },
        emit: [],
      }
    },
  }
}

/**
 * Delta de Külen base = 1, sumado de keyword amplifiers activos en juego
 * (ej: Trono de Lhülkan deltaBonus +1 → delta total = 2). Los amplifiers
 * deben ser del mismo controller que la nave.
 */
export function computeKulenDelta(state: GameState, ship: ShipInstance): number {
  let delta = 1
  for (const amp of state.keywordAmplifiers) {
    if (amp.keyword !== KW_KULEN) continue
    if (amp.controller !== ship.controller) continue
    delta += amp.deltaBonus
  }
  return delta
}

function findShipInState(
  state: GameState,
  shipId: string,
): { ship: ShipInstance; owner: 'p1' | 'p2' } | null {
  for (const owner of ['p1', 'p2'] as const) {
    const found = state.players[owner].fleet.find((s) => s.instanceId === shipId)
    if (found) return { ship: found, owner }
  }
  return null
}
