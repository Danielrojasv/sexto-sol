// Reducer puro del engine de Sexto Sol.
//
// Contrato:
//   apply(state, action) → { state: nextState, events: emitted }
//
// Sin mutación in-place. Mismo input → mismo output. Determinismo total.
// Phase 2 implementa: turn-start automático (recolección), PLAY_CARD para Naves,
// ACTIVATE_PLANET, DECLARE_ATTACK con combate simultáneo (Bastión + Desgarro),
// DEPLOY_HERO, ACTIVATE_HERO_POWER (skeleton), mano cap 7, win conditions.

import { createRng } from './rng'
import { executeEffect } from './interpreter'
import type {
  Age,
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
  'vigilia',
] as const

const TURN_TO_AGE_TRANSITION: Readonly<Record<number, Age>> = {
  5: 2,
  9: 3,
}

const HAND_CAP = 7
const HOMEWORLD_ENERGY_INCOME = 1

const KW_BASTION = 'bastion'
const KW_DESGARRO = 'desgarro'

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

function ageForTurn(turn: number, currentAge: Age): { age: Age; changed: boolean } {
  const transition = TURN_TO_AGE_TRANSITION[turn]
  if (transition !== undefined && transition > currentAge) {
    return { age: transition, changed: true }
  }
  return { age: currentAge, changed: false }
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
    ship: { ...ship, hp: newHp, damageTaken: ship.damageTaken + amount },
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
 * Una nave muere: si es héroe vuelve al mundo natal con cooldown=1; si no,
 * sale del fleet (no se modela cementerio de naves explícito en Phase 2).
 */
function killShip(state: GameState, ownerId: PlayerId, ship: ShipInstance): {
  state: GameState
  events: readonly GameEvent[]
} {
  const events: GameEvent[] = []
  if (ship.isHero) {
    const player = state.players[ownerId]
    const heroDef = player.hero
    if (heroDef) {
      const returnedHero = {
        ...heroDef,
        inHomeworld: true,
        damageTaken: 0,
        reactivationCooldown: 1,
        powersUsedThisTurn: 0,
      }
      const updated = setPlayer(state, ownerId, { ...player, hero: returnedHero })
      const next = replaceShip(updated, ownerId, ship.instanceId, null)
      emitEvent(events, { type: 'HERO_RETURNED', player: ownerId })
      return { state: next, events }
    }
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

/**
 * Aplica las reglas de "casos límite" §10.1: si ambos mundos cayeron a 0
 * por el mismo evento → tablas. Si solo cayó uno → win del opp. Si ninguno → in_progress.
 */
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
 * Ejecuta la lógica de inicio-de-turno para `player`:
 *   - Reset de planetas que ese jugador agotó el turno previo.
 *   - Decremento de cooldown del héroe (si lo tiene); reset de powersUsedThisTurn.
 *   - Acreditación de energía (mundo natal +1, +1 más por cada planeta que
 *     activó este jugador en su turno previo — no aplicado todavía a Phase 2:
 *     los Dones se difieren a Phase 3, así que solo cobramos el natal).
 *   - Robo de 1 carta. Si el mazo está vacío → decking out.
 */
function applyTurnStart(
  state: GameState,
  player: PlayerId,
): { state: GameState; events: readonly GameEvent[] } {
  if (state.outcome.kind !== 'in_progress') return { state, events: [] }
  const events: GameEvent[] = []

  // Reset planetas agotados por este jugador.
  const planets = state.sector.planets.map((p) =>
    p.exhaustedBy === player ? { ...p, exhausted: false, exhaustedBy: null } : p,
  )
  let next: GameState = { ...state, sector: { planets } }

  // Hero: decrementa cooldown, resetea power counter.
  const playerState = next.players[player]
  if (playerState.hero) {
    const heroNext = {
      ...playerState.hero,
      reactivationCooldown: Math.max(0, playerState.hero.reactivationCooldown - 1),
      powersUsedThisTurn: 0,
    }
    next = setPlayer(next, player, { ...playerState, hero: heroNext })
  }

  // Energía base: mundo natal +1. (Bonos de Dones diferidos a Phase 3.)
  const ps = next.players[player]
  next = setPlayer(next, player, { ...ps, energy: HOMEWORLD_ENERGY_INCOME })

  // Robar 1 carta — si el mazo está vacío, decking out (derrota).
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

  // Mano cap al final de Vigilia: descartar excedente al mazo cementerio.
  let next = logged
  if (logged.phase === 'vigilia') {
    next = enforceHandCap(next, next.activePlayer)
  }

  const { nextPhase, turnEnded } = nextPhaseInfo(next.phase)
  let nextActivePlayer = next.activePlayer
  let nextTurn = next.turn
  let nextAge = next.age

  if (turnEnded) {
    nextActivePlayer = opponentOf(next.activePlayer)
    nextTurn = next.turn + 1
    const ageInfo = ageForTurn(nextTurn, next.age)
    if (ageInfo.changed) {
      emitEvent(events, { type: 'AGE_CHANGED', from: next.age, to: ageInfo.age })
      nextAge = ageInfo.age
    }
    emitEvent(events, { type: 'TURN_START', turn: nextTurn, player: nextActivePlayer })
  }

  emitEvent(events, { type: 'PHASE_START', phase: nextPhase, player: nextActivePlayer })

  next = {
    ...next,
    phase: nextPhase,
    turn: nextTurn,
    age: nextAge,
    activePlayer: nextActivePlayer,
  }

  // Si arrancó un turno nuevo, ejecutar lógica de turn-start (recolección).
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
  if (card.type !== 'ship') return { state, events: [] } // Phase 3+ implementa otros tipos.
  if (card.cost > ps.energy) return { state, events: [] }
  if (card.strength === undefined || card.hp === undefined) return { state, events: [] }

  // Derivamos un instanceId determinista del rng del state. Esto avanza la rng
  // y guardamos el snapshot resultante en el nuevo state, manteniendo replay-ability.
  const rng = createRng(state.seed, state.rng)
  const instanceId = `ship_${rng.nextId()}`
  const ship: ShipInstance = {
    instanceId,
    cardId: card.id,
    controller: player,
    strength: card.strength,
    maxHp: card.hp,
    hp: card.hp,
    damageTaken: 0,
    keywords: card.keywords,
  }

  let next = setPlayer(state, player, {
    ...ps,
    hand: [...ps.hand.slice(0, idx), ...ps.hand.slice(idx + 1)],
    fleet: [...ps.fleet, ship],
    energy: ps.energy - card.cost,
  })
  next = { ...next, rng: rng.snapshot() }
  const events: GameEvent[] = [{ type: 'CARD_PLAYED', cardId, player }]

  // Ejecutar abilities con trigger 'on_play' a través del interpreter.
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
    state: appendLog(next, { type: 'PLAY_CARD', cardId }),
    events,
  }
}

function handleActivatePlanet(state: GameState, planetId: string): ReducerResult {
  const player = state.activePlayer
  const ps = state.players[player]
  const planetIdx = state.sector.planets.findIndex((p) => p.id === planetId)
  if (planetIdx < 0) return { state, events: [] }
  const planet = state.sector.planets[planetIdx]
  if (!planet) return { state, events: [] }
  if (planet.exhausted) return { state, events: [] }
  if (ps.energy < 1) return { state, events: [] }

  // Costo 1, gana 1: net 0 energía. El planeta queda agotado por este jugador.
  const newPlanets = state.sector.planets.map((p, i) =>
    i === planetIdx ? { ...p, exhausted: true, exhaustedBy: player } : p,
  )
  // El "+1 energía esa fase" del Don: por simplicidad sumamos 1 inmediato
  // (gastá 1 → ganá 1 → net 0, pero respeta la mecánica).
  const nextPs = { ...ps, energy: ps.energy /* -1 +1 */ }
  let next = setPlayer(state, player, nextPs)
  next = { ...next, sector: { planets: newPlanets } }
  return {
    state: appendLog(next, { type: 'ACTIVATE_PLANET', planetId }),
    events: [{ type: 'PLANET_ACTIVATED', planetId, activatedBy: player }],
  }
}

/**
 * Combate: ship vs ship es simultáneo (ambos sufren daño = fuerza del otro).
 * ship vs homeworld no tiene retorno (homeworld no tiene fuerza).
 *
 * Reglas:
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
  const defenderId: PlayerId = opponentOf(state.activePlayer)
  const defenderState = state.players[defenderId]

  // Bastión enforcement: si el defensor tiene una nave con Bastión, el atacante
  // DEBE apuntar a una de ellas. Si no, la acción es ilegal.
  const bastions = defenderState.fleet.filter((s) => s.keywords.includes(KW_BASTION))
  if (bastions.length > 0) {
    const isBastion =
      target.kind === 'ship' && bastions.some((b) => b.instanceId === target.ref)
    if (!isBastion) return { state, events: [] }
  }

  let next = appendLog(state, { type: 'DECLARE_ATTACK', attackerShipId, target })
  const events: GameEvent[] = []

  if (target.kind === 'homeworld') {
    if (target.ref !== defenderId) return { state, events: [] }
    const dmg = damageHomeworld(next, defenderId, attacker.strength, attackerShipId)
    next = dmg.state
    for (const e of dmg.events) events.push(e)
  } else {
    // ship vs ship simultáneo
    const defInfo = findShipById(next, target.ref as ShipInstanceId)
    if (!defInfo || defInfo.ownerId !== defenderId) return { state, events: [] }
    const defender = defInfo.ship
    const atkResult = applyDamageToShip(attacker, defender.strength)
    const defResult = applyDamageToShip(defender, attacker.strength)
    next = replaceShip(next, attackerInfo.ownerId, attacker.instanceId, atkResult.ship)
    next = replaceShip(next, defInfo.ownerId, defender.instanceId, defResult.ship)
    events.push({
      type: 'SHIP_DAMAGED',
      shipId: defender.instanceId,
      amount: attacker.strength,
      source: attackerShipId,
    })
    events.push({
      type: 'SHIP_DAMAGED',
      shipId: attacker.instanceId,
      amount: defender.strength,
      source: defender.instanceId,
    })

    // Desgarro: si atacante tiene Desgarro y mata al defensor con exceso, pasa al natal.
    if (defResult.destroyed && attacker.keywords.includes(KW_DESGARRO)) {
      const excess = attacker.strength - defender.hp
      if (excess > 0) {
        const dmg = damageHomeworld(next, defenderId, excess, attackerShipId)
        next = dmg.state
        for (const e of dmg.events) events.push(e)
      }
    }

    // Resolver muertes. Hacemos snapshot de las naves muertas ANTES de quitarlas
    // para emitir SHIP_DESTROYED / HERO_RETURNED en orden.
    if (atkResult.destroyed) {
      const k = killShip(next, attackerInfo.ownerId, atkResult.ship)
      next = k.state
      for (const e of k.events) events.push(e)
    }
    if (defResult.destroyed) {
      const k = killShip(next, defInfo.ownerId, defResult.ship)
      next = k.state
      for (const e of k.events) events.push(e)
    }
  }

  // Check win conditions después del combate.
  const over = checkGameOver(next)
  next = over.state
  for (const e of over.events) events.push(e)

  return { state: next, events }
}

function handleDeployHero(state: GameState): ReducerResult {
  if (state.age < 2) return { state, events: [] }
  if (state.phase !== 'despliegue') return { state, events: [] }
  const player = state.activePlayer
  const ps = state.players[player]
  if (!ps.hero) return { state, events: [] }
  if (!ps.hero.inHomeworld) return { state, events: [] }
  if (ps.hero.reactivationCooldown > 0) return { state, events: [] }

  // Modelar al héroe como una ShipInstance especial. Sus stats vienen del HeroDefinition,
  // pero como Phase 2 todavía no carga HeroDefinitions completas, usamos defaults.
  const heroShip: ShipInstance = {
    instanceId: `hero_${player}`,
    cardId: ps.hero.defId,
    controller: player,
    strength: 3,
    maxHp: 5,
    hp: 5,
    damageTaken: 0,
    keywords: [],
    isHero: true,
  }

  const updated = setPlayer(state, player, {
    ...ps,
    hero: { ...ps.hero, inHomeworld: false },
    fleet: [...ps.fleet, heroShip],
  })
  return {
    state: appendLog(updated, { type: 'DEPLOY_HERO' }),
    events: [{ type: 'HERO_DEPLOYED', player }],
  }
}

function handleActivateHeroPower(state: GameState, abilityId: string): ReducerResult {
  const player = state.activePlayer
  const ps = state.players[player]
  if (!ps.hero) return { state, events: [] }
  if (ps.hero.powersUsedThisTurn >= 2) return { state, events: [] }
  // En Phase 2 no aplicamos efecto del power — solo trackeamos el contador.
  // Phase 3 implementará efectos concretos por hero definition.
  const updated = setPlayer(state, player, {
    ...ps,
    hero: { ...ps.hero, powersUsedThisTurn: ps.hero.powersUsedThisTurn + 1 },
  })
  return {
    state: appendLog(updated, { type: 'ACTIVATE_HERO_POWER', abilityId }),
    events: [],
  }
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
    case 'ACTIVATE_PLANET':
      return handleActivatePlanet(state, action.planetId)
    case 'DEPLOY_HERO':
      return handleDeployHero(state)
    case 'ACTIVATE_HERO_POWER':
      return handleActivateHeroPower(state, action.abilityId)
    case 'ACTIVATE_ABILITY':
      // Phase 3+ implementará. No-op por ahora.
      return { state, events: [] }
  }
}
