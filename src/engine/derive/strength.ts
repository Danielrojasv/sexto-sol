// Derive layer para fuerza efectiva v3.0.
//
// `ship.strength` es la fuerza BASE + buffs PERMANENTES (Külen, etc.). Esos
// buffs se aplican directamente al field al disparar el trigger.
//
// La fuerza EFECTIVA es la base + bonuses dinámicos que dependen del state
// actual y deben recomputarse cada vez que se lean. Mecánica firma que opera
// así: Formación Solar (Q'ralan accumulative).
//
// Formación Solar: si la nave tiene keyword `formacion_solar`, suma +1 por
// cada OTRA nave Q'ralan en juego del mismo controller. Cuenta por **raza**
// Q'ralan, NO por keyword formacion_solar.
//
// Pure: sin browser deps, sin Math.random, sin Date.now.

import type { GameState, PlayerId, ShipInstance } from '../types'

const KW_FORMACION_SOLAR = 'formacion_solar'
const RACE_QRALAN = 'quralan'

/**
 * Cuenta OTRAS naves Q'ralan en juego controladas por `controller`. "Otras"
 * = excluye `selfId`. "Q'ralan" = razas según la card definition, NO por
 * keyword formacion_solar (canónico del handoff v3 + GAME-RULES v3.0).
 */
export function countOtherQralanShipsInPlay(
  state: GameState,
  selfId: string,
  controller: PlayerId,
): number {
  let count = 0
  for (const ship of state.players[controller].fleet) {
    if (ship.instanceId === selfId) continue
    const card = state.cardRegistry[ship.cardId]
    if (card?.race === RACE_QRALAN) count++
  }
  return count
}

/**
 * Fuerza efectiva de la nave en el state actual.
 *
 * Base: `ship.strength` (incluye buffs permanentes como Külen).
 * +N si ship.keywords incluye `formacion_solar`, donde N = count de OTRAS
 * naves Q'ralan del mismo controller.
 */
export function getEffectiveStrength(ship: ShipInstance, state: GameState): number {
  let strength = ship.strength
  if (ship.keywords.includes(KW_FORMACION_SOLAR)) {
    strength += countOtherQralanShipsInPlay(state, ship.instanceId, ship.controller)
  }
  return strength
}
