// Reducer puro del engine de Sexto Sol — alineado a GAME-RULES.md v3.0.
//
// Contrato:
//   apply(state, action) → { state: nextState, events: emitted }
//
// Sin mutación in-place. Mismo input → mismo output. Determinismo total.
//
// Cambios v3.0 vs v2.0:
//   - Sin planetas neutrales (handleActivatePlanet removido).
//   - Sin Edades (handleAge transitions removidas; damage_homeworld sin restricción).
//   - Sin héroes pasivos (handleDeployHero/handleActivateHeroPower removidos).
//     Las legendarias son Naves normales en el deck.
//   - Energía: cap creciente +1/turno hasta 10, reset al cap cada turno start.
//   - Phase 'vigilia' → 'eclipse'.
//   - Mareo de invocación: nuevo flag ShipInstance.summoningSickness, reset en
//     TURN_START. Override por keyword `embate`.
//   - Una nave sólo puede atacar 1 vez por turno (ShipInstance.hasAttackedThisTurn).

import { createRng } from './rng'
import { getEffectiveStrength } from './derive/strength'
import { processEventWithCascade } from './eventBus'
import { executeEffect } from './interpreter'
import type {
  AttackTarget,
  Card,
  GameAction,
  GameEvent,
  GameOutcome,
  GameState,
  PlayerId,
  PlayerState,
  ShipInstance,
  ShipInstanceId,
  TurnPhase,
} from './types'

const PHASE_ORDER: readonly TurnPhase[] = [
  'recoleccion',
  'despliegue',
  'combate',
  'regroup',
  'eclipse',
] as const

const HAND_CAP = 7
const ENERGY_CAP = 10

const KW_BASTION = 'bastion'
const KW_DESGARRO = 'desgarro'
const KW_EMBATE = 'embate'
const KW_REFLUENCIA = 'refluencia'
const KW_IGNICION = 'ignicion'
const RACE_TEZHAL = 'tezhal'

export interface ReducerResult {
  state: GameState
  events: readonly GameEvent[]
}

// ---- Helpers genéricos ----------------------------------------------------

function opponentOf(player: PlayerId): PlayerId {
  return player === 'p1' ? 'p2' : 'p1'
}

function nextPhaseInfo(currentPhase: TurnPhase): { nextPhase: TurnPhase; turnEnded: boolean } {
  const idx = PHASE_ORDER.indexOf(currentPhase)
  if (idx < 0 || idx === PHASE_ORDER.length - 1) {
    return { nextPhase: 'recoleccion', turnEnded: idx === PHASE_ORDER.length - 1 }
  }
  return { nextPhase: PHASE_ORDER[idx + 1] as TurnPhase, turnEnded: false }
}

/**
 * Energía del turno N: min(N, ENERGY_CAP). En TURN_START se resetea al cap.
 */
function energyForTurn(turn: number): number {
  return Math.min(turn, ENERGY_CAP)
}

function appendLog(state: GameState, action: GameAction): GameState {
  return { ...state, log: [...state.log, action] }
}

function setPlayer(state: GameState, id: PlayerId, player: PlayerState): GameState {
  return { ...state, players: { ...state.players, [id]: player } }
}

function emitEvent(events: GameEvent[], event: GameEvent): void {
  events.push(event)
}

// ---- Combate y damage helpers --------------------------------------------

function applyDamageToShip(
  ship: ShipInstance,
  amount: number,
): { ship: ShipInstance; destroyed: boolean } {
  const newHp = ship.hp - amount
  return {
    ship: {
      ...ship,
      hp: newHp,
      damageTaken: ship.damageTaken + amount,
      damagedThisTurn: true,
    },
    destroyed: newHp <= 0,
  }
}

function findShipById(
  state: GameState,
  shipId: ShipInstanceId,
): { ship: ShipInstance; ownerId: PlayerId } | null {
  for (const id of ['p1', 'p2'] as const) {
    const found = state.players[id].fleet.find((s) => s.instanceId === shipId)
    if (found) return { ship: found, ownerId: id }
  }
  return null
}

function replaceShip(
  state: GameState,
  ownerId: PlayerId,
  shipId: ShipInstanceId,
  next: ShipInstance | null,
): GameState {
  const player = state.players[ownerId]
  const fleet = next
    ? player.fleet.map((s) => (s.instanceId === shipId ? next : s))
    : player.fleet.filter((s) => s.instanceId !== shipId)
  return setPlayer(state, ownerId, { ...player, fleet })
}

/**
 * Routing de muerte canónico v3.0:
 *   1. Nave con keyword `refluencia` que NO ha revivido → pozoAstral del owner
 *      (con stats base reseteados desde card def).
 *   2. Nave con `revivedFromRefluencia: true` → disolucion (terminal).
 *   3. Default → removida del fleet (sin destino persistente).
 */
function killShip(
  state: GameState,
  ownerId: PlayerId,
  ship: ShipInstance,
): { state: GameState; events: readonly GameEvent[] } {
  const events: GameEvent[] = []
  if (ship.keywords.includes(KW_REFLUENCIA) && !ship.revivedFromRefluencia) {
    const card = state.cardRegistry[ship.cardId]
    const baseShip: ShipInstance =
      card && card.strength !== undefined && card.hp !== undefined
        ? {
            ...ship,
            strength: card.strength,
            maxHp: card.hp,
            hp: card.hp,
            damageTaken: 0,
            damagedThisTurn: false,
            hasAttackedThisTurn: false,
            summoningSickness: false,
            keywords: card.keywords,
          }
        : ship
    const player = state.players[ownerId]
    const stateWithPozo = setPlayer(state, ownerId, {
      ...player,
      pozoAstral: [...player.pozoAstral, baseShip],
    })
    const next = replaceShip(stateWithPozo, ownerId, ship.instanceId, null)
    emitEvent(events, { type: 'SHIP_DESTROYED', shipId: ship.instanceId, cause: 'combat' })
    return { state: next, events }
  }
  if (ship.revivedFromRefluencia) {
    const player = state.players[ownerId]
    const stateWithDisolution = setPlayer(state, ownerId, {
      ...player,
      disolucion: [...player.disolucion, ship],
    })
    const next = replaceShip(stateWithDisolution, ownerId, ship.instanceId, null)
    emitEvent(events, { type: 'SHIP_DESTROYED', shipId: ship.instanceId, cause: 'combat' })
    return { state: next, events }
  }
  const next = replaceShip(state, ownerId, ship.instanceId, null)
  emitEvent(events, { type: 'SHIP_DESTROYED', shipId: ship.instanceId, cause: 'combat' })
  return { state: next, events }
}

function damageHomeworld(
  state: GameState,
  player: PlayerId,
  amount: number,
  source: string,
): { state: GameState; events: readonly GameEvent[] } {
  if (amount <= 0) return { state, events: [] }
  const p = state.players[player]
  const newHp = Math.max(0, p.homeworld.hp - amount)
  const next = setPlayer(state, player, {
    ...p,
    homeworld: { ...p.homeworld, hp: newHp },
  })
  return {
    state: next,
    events: [{ type: 'HOMEWORLD_DAMAGED', player, amount, source }],
  }
}

/** Casos límite §10.1: si ambos mundos cayeron a 0 simultáneamente → tablas. */
function checkGameOver(state: GameState): {
  state: GameState
  events: readonly GameEvent[]
} {
  if (state.outcome.kind !== 'in_progress') return { state, events: [] }
  const p1Down = state.players.p1.homeworld.hp <= 0
  const p2Down = state.players.p2.homeworld.hp <= 0
  if (p1Down && p2Down) {
    const outcome: GameOutcome = {
      kind: 'draw',
      reason: 'simultaneous_homeworld_destruction',
    }
    return {
      state: { ...state, outcome },
      events: [{ type: 'GAME_OVER', outcome }],
    }
  }
  if (p1Down) {
    const outcome: GameOutcome = { kind: 'win', winner: 'p2', reason: 'homeworld_destroyed' }
    return { state: { ...state, outcome }, events: [{ type: 'GAME_OVER', outcome }] }
  }
  if (p2Down) {
    const outcome: GameOutcome = { kind: 'win', winner: 'p1', reason: 'homeworld_destroyed' }
    return { state: { ...state, outcome }, events: [{ type: 'GAME_OVER', outcome }] }
  }
  return { state, events: [] }
}

// ---- Turn start automático -----------------------------------------------

/**
 * v3.0 TURN_START canónico:
 *   - Reset summoningSickness y hasAttackedThisTurn de todas las naves del
 *     player (las naves del oponente mantienen sus flags).
 *   - Reset damagedThisTurn de TODAS las naves (ambos players).
 *   - Energía al cap creciente: min(turn, 10).
 *   - Robo de 1 carta. Si el mazo está vacío → decking_out.
 */
function applyTurnStart(
  state: GameState,
  player: PlayerId,
): { state: GameState; events: readonly GameEvent[] } {
  if (state.outcome.kind !== 'in_progress') return { state, events: [] }
  const events: GameEvent[] = []

  let next: GameState = {
    ...state,
    players: {
      ...state.players,
      p1: {
        ...state.players.p1,
        fleet: state.players.p1.fleet.map((sh) => ({
          ...sh,
          damagedThisTurn: false,
          ...(sh.controller === player
            ? { summoningSickness: false, hasAttackedThisTurn: false }
            : {}),
        })),
      },
      p2: {
        ...state.players.p2,
        fleet: state.players.p2.fleet.map((sh) => ({
          ...sh,
          damagedThisTurn: false,
          ...(sh.controller === player
            ? { summoningSickness: false, hasAttackedThisTurn: false }
            : {}),
        })),
      },
    },
  }

  // Energía al cap creciente del turno.
  const ps = next.players[player]
  next = setPlayer(next, player, { ...ps, energy: energyForTurn(next.turn) })

  // Robar 1 carta — si el mazo está vacío, decking out.
  const refreshed = next.players[player]
  if (refreshed.deck.length === 0) {
    const winner = opponentOf(player)
    const outcome: GameOutcome = { kind: 'win', winner, reason: 'decking_out' }
    next = { ...next, outcome }
    emitEvent(events, { type: 'GAME_OVER', outcome })
    return { state: next, events }
  }
  const drawn = refreshed.deck[0] as Card
  next = setPlayer(next, player, {
    ...refreshed,
    hand: [...refreshed.hand, drawn],
    deck: refreshed.deck.slice(1),
  })
  emitEvent(events, { type: 'CARD_DRAWN', player })
  return { state: next, events }
}

// ---- Acciones -------------------------------------------------------------

function handleConcede(state: GameState, conceder: PlayerId): ReducerResult {
  const logged = appendLog(state, { type: 'CONCEDE', player: conceder })
  const winner = opponentOf(conceder)
  const outcome: GameOutcome = { kind: 'win', winner, reason: 'concession' }
  return {
    state: { ...logged, outcome },
    events: [{ type: 'GAME_OVER', outcome }],
  }
}

function handleEndPhase(state: GameState): ReducerResult {
  const logged = appendLog(state, { type: 'END_PHASE' })
  const events: GameEvent[] = []
  emitEvent(events, { type: 'PHASE_END', phase: logged.phase, player: logged.activePlayer })

  let next = logged
  if (logged.phase === 'eclipse') {
    next = enforceHandCap(next, next.activePlayer)
  }

  const { nextPhase, turnEnded } = nextPhaseInfo(next.phase)
  let nextActivePlayer = next.activePlayer
  let nextTurn = next.turn

  if (turnEnded) {
    nextActivePlayer = opponentOf(next.activePlayer)
    nextTurn = next.turn + 1
    emitEvent(events, { type: 'TURN_START', turn: nextTurn, player: nextActivePlayer })
  }

  emitEvent(events, { type: 'PHASE_START', phase: nextPhase, player: nextActivePlayer })

  next = {
    ...next,
    phase: nextPhase,
    turn: nextTurn,
    activePlayer: nextActivePlayer,
  }

  if (turnEnded) {
    const ts = applyTurnStart(next, nextActivePlayer)
    next = ts.state
    for (const e of ts.events) events.push(e)
  }

  return { state: next, events }
}

function enforceHandCap(state: GameState, player: PlayerId): GameState {
  const p = state.players[player]
  if (p.hand.length <= HAND_CAP) return state
  const keep = p.hand.slice(0, HAND_CAP)
  const discarded = p.hand.slice(HAND_CAP)
  return setPlayer(state, player, {
    ...p,
    hand: keep,
    graveyard: [...p.graveyard, ...discarded],
  })
}

function handlePlayCard(state: GameState, cardId: string): ReducerResult {
  if (state.phase !== 'despliegue') return { state, events: [] }
  const player = state.activePlayer
  const ps = state.players[player]
  const idx = ps.hand.findIndex((c) => c.id === cardId)
  if (idx < 0) return { state, events: [] }
  const card = ps.hand[idx]
  if (!card) return { state, events: [] }
  if (card.cost > ps.energy) return { state, events: [] }

  if (card.type === 'ship') {
    if (card.strength === undefined || card.hp === undefined) return { state, events: [] }
    return playShipCard(state, ps, card, idx, player)
  }
  if (card.type === 'relic' || card.type === 'tech') {
    return playPermanentCard(state, ps, card, idx, player)
  }
  return { state, events: [] }
}

function playShipCard(
  state: GameState,
  ps: PlayerState,
  card: Card,
  idx: number,
  player: PlayerId,
): ReducerResult {
  if (card.strength === undefined || card.hp === undefined) return { state, events: [] }
  const rng = createRng(state.seed, state.rng)
  const instanceId = `ship_${rng.nextId()}`
  // Mareo de invocación: por defecto la nave entra summoningSickness=true,
  // salvo que tenga keyword Embate.
  const hasEmbate = card.keywords.includes(KW_EMBATE)
  const ship: ShipInstance = {
    instanceId,
    cardId: card.id,
    controller: player,
    strength: card.strength,
    maxHp: card.hp,
    hp: card.hp,
    damageTaken: 0,
    keywords: card.keywords,
    summoningSickness: !hasEmbate,
  }
  let next = setPlayer(state, player, {
    ...ps,
    hand: [...ps.hand.slice(0, idx), ...ps.hand.slice(idx + 1)],
    fleet: [...ps.fleet, ship],
    energy: ps.energy - card.cost,
  })
  next = { ...next, rng: rng.snapshot() }
  const events: GameEvent[] = [{ type: 'CARD_PLAYED', cardId: card.id, player }]
  for (const ability of card.abilities) {
    if (ability.trigger.kind !== 'on_play') continue
    const result = executeEffect(ability.effect, next, {
      controller: player,
      selfShipId: instanceId,
      sourceCardId: card.id,
    })
    next = result.state
    for (const e of result.emit) events.push(e)
  }
  return {
    state: appendLog(next, { type: 'PLAY_CARD', cardId: card.id }),
    events,
  }
}

function playPermanentCard(
  state: GameState,
  ps: PlayerState,
  card: Card,
  idx: number,
  player: PlayerId,
): ReducerResult {
  const rng = createRng(state.seed, state.rng)
  const instanceId = `${card.type}_${rng.nextId()}`
  const permanent: ShipInstance = {
    instanceId,
    cardId: card.id,
    controller: player,
    strength: 0,
    maxHp: 0,
    hp: 0,
    damageTaken: 0,
    keywords: card.keywords,
  }
  const zone = card.type === 'relic' ? 'relicsInPlay' : 'techInPlay'
  let next: GameState = {
    ...state,
    rng: rng.snapshot(),
    players: {
      ...state.players,
      [player]: {
        ...ps,
        hand: [...ps.hand.slice(0, idx), ...ps.hand.slice(idx + 1)],
        [zone]: [...ps[zone], permanent],
        energy: ps.energy - card.cost,
      },
    },
  }
  for (const ability of card.abilities) {
    if (ability.trigger.kind !== 'continuous') continue
    if (ability.effect.op === 'keyword_amplifier') {
      next = {
        ...next,
        keywordAmplifiers: [
          ...next.keywordAmplifiers,
          {
            source: instanceId,
            controller: player,
            keyword: ability.effect.keyword,
            deltaBonus: ability.effect.deltaBonus,
          },
        ],
      }
    } else if (ability.effect.op === 'cost_modifier') {
      next = {
        ...next,
        costModifiers: [
          ...next.costModifiers,
          {
            source: instanceId,
            scope: 'refluencia',
            target: { keyword: ability.effect.target.keyword },
            amount: ability.effect.delta,
            minCost: ability.effect.minCost,
          },
        ],
      }
    }
  }
  const events: GameEvent[] = [{ type: 'CARD_PLAYED', cardId: card.id, player }]
  for (const ability of card.abilities) {
    if (ability.trigger.kind !== 'on_play') continue
    const result = executeEffect(ability.effect, next, {
      controller: player,
      selfShipId: instanceId,
      sourceCardId: card.id,
    })
    next = result.state
    for (const e of result.emit) events.push(e)
  }
  return {
    state: appendLog(next, { type: 'PLAY_CARD', cardId: card.id }),
    events,
  }
}

/**
 * Combate v3.0: ship vs ship es simultáneo; ship vs homeworld no tiene retorno.
 *
 * Reglas:
 *  - Mareo de invocación: nave con summoningSickness=true no puede atacar
 *    (salvo Embate, que ya se manejó al entrar al campo).
 *  - Una nave sólo puede atacar 1 vez por turno (hasAttackedThisTurn).
 *  - Bastión: si el defensor tiene una nave con Bastión, el atacante DEBE
 *    apuntar a esa nave antes que a otras o al mundo natal.
 *  - Desgarro: si la fuerza del atacante > HP del defensor (ship), el exceso
 *    pasa al mundo natal.
 */
function handleDeclareAttack(
  state: GameState,
  attackerShipId: ShipInstanceId,
  target: AttackTarget,
): ReducerResult {
  if (state.phase !== 'combate') return { state, events: [] }
  const attackerInfo = findShipById(state, attackerShipId)
  if (!attackerInfo || attackerInfo.ownerId !== state.activePlayer) return { state, events: [] }
  const attacker = attackerInfo.ship
  // Mareo de invocación: la nave no puede atacar.
  if (attacker.summoningSickness) return { state, events: [] }
  // Una nave sólo puede atacar 1 vez por turno.
  if (attacker.hasAttackedThisTurn) return { state, events: [] }

  const defenderId: PlayerId = opponentOf(state.activePlayer)
  const defenderState = state.players[defenderId]

  // Bastión enforcement.
  const bastions = defenderState.fleet.filter((s) => s.keywords.includes(KW_BASTION))
  if (bastions.length > 0) {
    const isBastion =
      target.kind === 'ship' && bastions.some((b) => b.instanceId === target.ref)
    if (!isBastion) return { state, events: [] }
  }

  let next = appendLog(state, { type: 'DECLARE_ATTACK', attackerShipId, target })
  const events: GameEvent[] = []

  // Marcar atacante como "ya atacó" inmediatamente (antes de aplicar daño,
  // así si la nave se autodaña en su propio trigger no bug-loop).
  next = replaceShip(next, attackerInfo.ownerId, attacker.instanceId, {
    ...attacker,
    hasAttackedThisTurn: true,
  })

  // Fuerza efectiva del atacante congelada al inicio del combate.
  const attackerEffStrength = getEffectiveStrength(attacker, state)

  // Emit SHIP_ATTACKED al inicio.
  const defenderRef: ShipInstanceId | PlayerId =
    target.kind === 'ship' ? (target.ref as ShipInstanceId) : defenderId
  const attackedEvent: GameEvent = {
    type: 'SHIP_ATTACKED',
    attackerId: attackerShipId,
    defenderId: defenderRef,
  }
  events.push(attackedEvent)
  next = processEventWithCascade(next, attackedEvent, events)

  if (target.kind === 'homeworld') {
    if (target.ref !== defenderId) return { state, events: [] }
    const dmg = damageHomeworld(next, defenderId, attackerEffStrength, attackerShipId)
    next = dmg.state
    for (const e of dmg.events) {
      events.push(e)
      next = processEventWithCascade(next, e, events)
    }
  } else {
    const defInfo = findShipById(next, target.ref as ShipInstanceId)
    if (!defInfo || defInfo.ownerId !== defenderId) return { state, events: [] }
    const defender = defInfo.ship
    const defenderEffStrength = getEffectiveStrength(defender, state)
    const atkResult = applyDamageToShip(
      // Re-lookup attacker en next, ya tiene hasAttackedThisTurn=true.
      next.players[attackerInfo.ownerId].fleet.find((s) => s.instanceId === attacker.instanceId) ??
        attacker,
      defenderEffStrength,
    )
    const defResult = applyDamageToShip(defender, attackerEffStrength)
    next = replaceShip(next, attackerInfo.ownerId, attacker.instanceId, atkResult.ship)
    next = replaceShip(next, defInfo.ownerId, defender.instanceId, defResult.ship)

    const defDamagedEvent: GameEvent = {
      type: 'SHIP_DAMAGED',
      shipId: defender.instanceId,
      amount: attackerEffStrength,
      source: attackerShipId,
    }
    events.push(defDamagedEvent)
    next = processEventWithCascade(next, defDamagedEvent, events)

    const atkDamagedEvent: GameEvent = {
      type: 'SHIP_DAMAGED',
      shipId: attacker.instanceId,
      amount: defenderEffStrength,
      source: defender.instanceId,
    }
    events.push(atkDamagedEvent)
    next = processEventWithCascade(next, atkDamagedEvent, events)

    // Desgarro: si atacante tiene Desgarro y mata al defensor con exceso, pasa al natal.
    if (defResult.destroyed && attacker.keywords.includes(KW_DESGARRO)) {
      const excess = attackerEffStrength - defender.hp
      if (excess > 0) {
        const dmg = damageHomeworld(next, defenderId, excess, attackerShipId)
        next = dmg.state
        for (const e of dmg.events) {
          events.push(e)
          next = processEventWithCascade(next, e, events)
        }
      }
    }

    if (atkResult.destroyed) {
      const k = killShip(next, attackerInfo.ownerId, atkResult.ship)
      next = k.state
      for (const e of k.events) {
        events.push(e)
        next = processEventWithCascade(next, e, events)
      }
    }
    if (defResult.destroyed) {
      const k = killShip(next, defInfo.ownerId, defResult.ship)
      next = k.state
      for (const e of k.events) {
        events.push(e)
        next = processEventWithCascade(next, e, events)
      }
    }
  }

  const over = checkGameOver(next)
  next = over.state
  for (const e of over.events) events.push(e)

  return { state: next, events }
}

/**
 * v3.0.3 — Activa una carta con keyword `ignicion` sacrificando una nave
 * Tezhal aliada (mandatory).
 */
function handleActivateIgnicion(
  state: GameState,
  cardId: string,
  sacrificeShipId: ShipInstanceId,
): ReducerResult {
  if (state.phase !== 'despliegue') return { state, events: [] }
  const player = state.activePlayer
  const ps = state.players[player]
  const idx = ps.hand.findIndex((c) => c.id === cardId)
  if (idx < 0) return { state, events: [] }
  const card = ps.hand[idx]
  if (!card || !card.keywords.includes(KW_IGNICION)) return { state, events: [] }
  if (card.cost > ps.energy) return { state, events: [] }
  const sacrificeShip = ps.fleet.find((s) => s.instanceId === sacrificeShipId)
  if (!sacrificeShip) return { state, events: [] }
  const sacCard = state.cardRegistry[sacrificeShip.cardId]
  if (!sacCard || sacCard.race !== RACE_TEZHAL) return { state, events: [] }

  let next = setPlayer(state, player, {
    ...ps,
    hand: [...ps.hand.slice(0, idx), ...ps.hand.slice(idx + 1)],
    energy: ps.energy - card.cost,
    graveyard: [...ps.graveyard, card],
  })
  const events: GameEvent[] = [{ type: 'CARD_PLAYED', cardId, player }]

  for (const ability of card.abilities) {
    if (ability.trigger.kind !== 'on_play') continue
    const result = executeEffect(ability.effect, next, {
      controller: player,
      sourceCardId: card.id,
      chosenTargets: [sacrificeShipId],
    })
    next = result.state
    for (const e of result.emit) {
      events.push(e)
      next = processEventWithCascade(next, e, events)
    }
  }

  return {
    state: appendLog(next, { type: 'ACTIVATE_IGNICION', cardId, sacrificeShipId }),
    events,
  }
}

/**
 * v3.0.3 — Revival via Refluencia. La nave debe estar en `pozoAstral`. El
 * costo es card.cost - mods aplicables (clamp mínimo 1).
 */
function handlePayRefluencia(state: GameState, shipId: ShipInstanceId): ReducerResult {
  if (state.phase !== 'despliegue') return { state, events: [] }
  const player = state.activePlayer
  const ps = state.players[player]
  const ship = ps.pozoAstral.find((s) => s.instanceId === shipId)
  if (!ship) return { state, events: [] }
  const card = state.cardRegistry[ship.cardId]
  if (!card || card.strength === undefined || card.hp === undefined) {
    return { state, events: [] }
  }
  const cost = computeRevivalCost(state, card.cost)
  if (ps.energy < cost) return { state, events: [] }

  const revivedShip: ShipInstance = {
    ...ship,
    strength: card.strength,
    maxHp: card.hp,
    hp: card.hp,
    damageTaken: 0,
    damagedThisTurn: false,
    hasAttackedThisTurn: false,
    summoningSickness: !card.keywords.includes(KW_EMBATE),
    keywords: card.keywords,
    revivedFromRefluencia: true,
  }

  const next = setPlayer(state, player, {
    ...ps,
    energy: ps.energy - cost,
    pozoAstral: ps.pozoAstral.filter((s) => s.instanceId !== shipId),
    fleet: [...ps.fleet, revivedShip],
  })
  return {
    state: appendLog(next, { type: 'PAY_REFLUENCIA', shipId }),
    events: [{ type: 'CARD_PLAYED', cardId: card.id, player }],
  }
}

function computeRevivalCost(state: GameState, baseCost: number): number {
  let cost = baseCost
  let minCost = 1
  for (const mod of state.costModifiers) {
    if (mod.scope !== 'refluencia') continue
    if (mod.target.keyword !== KW_REFLUENCIA) continue
    cost += mod.amount
    if (mod.minCost > minCost) minCost = mod.minCost
  }
  return Math.max(minCost, cost)
}

/**
 * Apply pure: aplica una acción al state, devuelve el nuevo state + eventos
 * que emitió la acción.
 */
export function apply(state: GameState, action: GameAction): ReducerResult {
  if (state.outcome.kind !== 'in_progress') {
    return { state, events: [] }
  }
  switch (action.type) {
    case 'CONCEDE':
      return handleConcede(state, action.player)
    case 'END_PHASE':
      return handleEndPhase(state)
    case 'PLAY_CARD':
      return handlePlayCard(state, action.cardId)
    case 'DECLARE_ATTACK':
      return handleDeclareAttack(state, action.attackerShipId, action.target)
    case 'ACTIVATE_ABILITY':
      // Phase 3+ implementará habilidades activadas explícitas. No-op por ahora.
      return { state, events: [] }
    case 'ACTIVATE_IGNICION':
      return handleActivateIgnicion(state, action.cardId, action.sacrificeShipId)
    case 'PAY_REFLUENCIA':
      return handlePayRefluencia(state, action.shipId)
  }
}
