// scriptedAI — IA scripted determinista para el MVP web.
//
// Port simplificado de las heurísticas de `scripts/sim/simulator.py`
// (deploy_ships, declare_attacks, mulligan).
//
// Restricciones de portabilidad:
//   - Sin browser deps (no imports de @/ui, @/store, react, zustand, pixi, etc.).
//   - Funciones puras: (state, player) → GameAction.
//   - Usa el RNG embebido en state (no Math.random).
//
// NO variant-aware (opción A del backlog futura). Heurísticas base.

import { getEffectiveStrength } from '../derive/strength'
import { createRng } from '../rng'
import type { GameAction, GameState, PlayerId, Race, ShipInstance } from '../types'

/**
 * Decide la próxima acción para `player` dado el state actual. Garantiza que
 * la acción devuelta es LEGAL (el reducer la aceptará).
 *
 * Por phase:
 *   - recoleccion / regroup / vigilia → END_PHASE.
 *   - despliegue → decideDeploy (maximize energy use).
 *   - combate → decideCombat (lethal > biggest threat; respeta Bastión).
 *   - END_PHASE como fallback siempre que no haya jugada óptima.
 */
export function decideAction(state: GameState, player: PlayerId): GameAction {
  if (state.outcome.kind !== 'in_progress') return { type: 'END_PHASE' }
  if (state.activePlayer !== player) return { type: 'END_PHASE' }
  switch (state.phase) {
    case 'recoleccion':
      return { type: 'END_PHASE' }
    case 'despliegue':
      return decideDeploy(state, player)
    case 'combate':
      return decideCombat(state, player)
    case 'regroup':
      return { type: 'END_PHASE' }
    case 'eclipse':
      return { type: 'END_PHASE' }
    default:
      return { type: 'END_PHASE' }
  }
}

/**
 * Heurística de despliegue: prioriza
 *   1. Cartas que sinergizan con cartas ya en juego (placeholder: cartas
 *      del mismo race que naves en fleet).
 *   2. Naves baratas para curva (menor costo primero).
 *   3. END_PHASE si no hay nada jugable.
 *
 * También considera revival via PAY_REFLUENCIA si hay naves en pozoAstral.
 */
function decideDeploy(state: GameState, player: PlayerId): GameAction {
  const ps = state.players[player]
  // Revival Refluencia: si hay nave en pozoAstral y energía suficiente, revivir.
  for (const reviveShip of ps.pozoAstral) {
    const card = state.cardRegistry[reviveShip.cardId]
    if (!card) continue
    if (card.cost <= ps.energy) {
      return { type: 'PAY_REFLUENCIA', shipId: reviveShip.instanceId }
    }
  }
  // Filtrar cartas jugables (cost ≤ energy, ship/relic/tech, sin ignicion
  // bloqueante).
  const playable = ps.hand
    .map((card, idx) => ({ card, idx }))
    .filter(({ card }) => {
      if (card.cost > ps.energy) return false
      if (card.type === 'event') return false // Phase 3+
      if (card.type === 'ship' && (card.strength === undefined || card.hp === undefined)) {
        return false
      }
      // Cartas con keyword ignicion necesitan ACTIVATE_IGNICION + nave Tezhal aliada.
      // Por ahora la IA salta esas cartas en deploy normal (puede activarlas
      // si hay Tezhal vía decisión separada abajo).
      if (card.keywords.includes('ignicion')) return false
      return true
    })

  // Si hay Ignición jugable: priorizar (initiative agresivo).
  for (const { card } of ps.hand.map((c) => ({ card: c }))) {
    if (!card.keywords.includes('ignicion')) continue
    if (card.cost > ps.energy) continue
    const tezhalAlly = ps.fleet.find((sh) => {
      const c = state.cardRegistry[sh.cardId]
      return c?.race === 'tezhal'
    })
    if (tezhalAlly) {
      return {
        type: 'ACTIVATE_IGNICION',
        cardId: card.id,
        sacrificeShipId: tezhalAlly.instanceId,
      }
    }
  }

  if (playable.length === 0) return { type: 'END_PHASE' }
  // Sinergia: cartas del mismo race que naves ya en fleet.
  const fleetRaces = new Set<Race>(
    ps.fleet
      .map((sh) => state.cardRegistry[sh.cardId]?.race)
      .filter((r): r is Race => r !== undefined),
  )
  playable.sort((a, b) => {
    const aSyn = fleetRaces.has(a.card.race) ? 1 : 0
    const bSyn = fleetRaces.has(b.card.race) ? 1 : 0
    if (aSyn !== bSyn) return bSyn - aSyn
    return a.card.cost - b.card.cost
  })
  const pick = playable[0]
  if (!pick) return { type: 'END_PHASE' }
  return { type: 'PLAY_CARD', cardId: pick.card.id }
}

/**
 * Heurística de combate: lethal hp, biggest threat, respeta Bastión.
 *   - Si lethal posible al mundo natal enemigo (suma de fuerzas efectivas
 *     ≥ HP del homeworld), atacar el natal con la nave más fuerte que pueda.
 *   - Si Bastión enemigo en fleet, atacar a esa nave primero.
 *   - Si no, atacar la amenaza enemiga más grande (mayor effective strength).
 *   - END_PHASE si no hay naves atacando o no hay targets útiles.
 */
function decideCombat(state: GameState, player: PlayerId): GameAction {
  const ps = state.players[player]
  const enemyId: PlayerId = player === 'p1' ? 'p2' : 'p1'
  const enemy = state.players[enemyId]
  // Naves que pueden atacar (todas las del player en combate; mareo de
  // invocación no se trackea por turno aún — Phase 3+).
  // Filtra naves que pueden atacar: del player, sin mareo de invocación, sin
  // haber atacado este turno.
  const attackers = ps.fleet.filter(
    (sh) =>
      sh.controller === player && !sh.summoningSickness && !sh.hasAttackedThisTurn,
  )
  if (attackers.length === 0) return { type: 'END_PHASE' }

  // Si hay Bastión enemigo, debe atacarse primero.
  const bastion = enemy.fleet.find((sh) => sh.keywords.includes('bastion'))
  if (bastion) {
    // Atacar con la nave de mayor fuerza efectiva.
    const best = pickStrongestAttacker(state, attackers)
    if (best) {
      return {
        type: 'DECLARE_ATTACK',
        attackerShipId: best.instanceId,
        target: { kind: 'ship', ref: bastion.instanceId },
      }
    }
  }

  // Lethal: si suma de fuerzas efectivas ≥ HP del homeworld enemigo, atacar
  // homeworld. v3.0: damage_homeworld permitido siempre (Edades eliminadas).
  {
    const totalForce = attackers.reduce((sum, sh) => sum + getEffectiveStrength(sh, state), 0)
    if (totalForce >= enemy.homeworld.hp) {
      const strongest = pickStrongestAttacker(state, attackers)
      if (strongest) {
        return {
          type: 'DECLARE_ATTACK',
          attackerShipId: strongest.instanceId,
          target: { kind: 'homeworld', ref: enemyId },
        }
      }
    }
  }

  // Default: atacar la amenaza más grande enemiga si existe; si no, homeworld.
  if (enemy.fleet.length > 0) {
    const biggestThreat = enemy.fleet.reduce((max, sh) => {
      const sStr = getEffectiveStrength(sh, state)
      const mStr = getEffectiveStrength(max, state)
      return sStr > mStr ? sh : max
    })
    const attacker = pickStrongestAttacker(state, attackers)
    if (attacker) {
      return {
        type: 'DECLARE_ATTACK',
        attackerShipId: attacker.instanceId,
        target: { kind: 'ship', ref: biggestThreat.instanceId },
      }
    }
  }

  if (attackers.length > 0) {
    const strongest = pickStrongestAttacker(state, attackers)
    if (strongest) {
      return {
        type: 'DECLARE_ATTACK',
        attackerShipId: strongest.instanceId,
        target: { kind: 'homeworld', ref: enemyId },
      }
    }
  }

  return { type: 'END_PHASE' }
}

function pickStrongestAttacker(
  state: GameState,
  attackers: readonly ShipInstance[],
): ShipInstance | null {
  if (attackers.length === 0) return null
  // Determinismo: el RNG del state desempata si hay tie, pero por simplicidad
  // tomamos el primero por orden de instanceId.
  let best = attackers[0] as ShipInstance
  let bestStrength = getEffectiveStrength(best, state)
  for (const sh of attackers) {
    const s = getEffectiveStrength(sh, state)
    if (s > bestStrength) {
      best = sh
      bestStrength = s
    }
  }
  return best
}

/**
 * Determinismo: avanza RNG del state si se desea simular "decisión aleatoria"
 * (ej: empate de heurísticas). API expuesta para futura expansión variant-aware.
 */
export function advanceRngForAI(state: GameState): GameState {
  const rng = createRng(state.seed, state.rng)
  rng.nextInt(1)
  return { ...state, rng: rng.snapshot() }
}
