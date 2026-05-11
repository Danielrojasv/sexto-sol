// Interpreter del DSL de cartas. Ejecuta un Effect (árbol de primitives) sobre
// un GameState y devuelve { state: nuevo, emit: eventos generados }.
//
// Es PURO: no muta el state recibido, no usa side effects, no llama LLMs.
// Mismo input → mismo output (replay-able).
//
// Phase D entrega 22 primitives. Phase F integra con triggers via reducer.

import { createRng } from './rng'
import type {
  Card,
  GameEvent,
  GameState,
  PlayerId,
  ShipInstance,
  ShipInstanceId,
} from './types'
import type {
  Condition,
  Effect,
  PlayerSelector,
  ShipFilter,
  Target,
} from '@/data/primitives/spec'
import { MAX_COMPOSITION_DEPTH } from '@/data/primitives/spec'

/** Contexto de ejecución: identidad del "self" y otros valores que las primitives necesitan. */
export interface EffectContext {
  /** Player que controla la fuente del efecto (la carta o nave que disparó la ability). */
  controller: PlayerId
  /** ShipInstanceId de la fuente, si la fuente es una nave instanciada. Undefined si la fuente
   *  es una carta jugándose desde la mano (PLAY_CARD on_play). */
  selfShipId?: ShipInstanceId
  /** ID de carta de la fuente (siempre presente). */
  sourceCardId: string
  /** Targets elegidos por el jugador para este efecto, si la primitive los requería. */
  chosenTargets?: readonly ShipInstanceId[]
  /** Atacante del evento `SHIP_ATTACKED` cuando este context se construye desde un
   *  handler reactivo disparado por ese evento. Permite que `target.kind === 'attacker'`
   *  resuelva al atacante. Engine impl plena en Commit 3 (Phase 1 kernel). */
  attackerShipId?: ShipInstanceId
}

export interface ExecResult {
  state: GameState
  emit: readonly GameEvent[]
}

// ---------------------------------------------------------------------------
// Public entrypoint
// ---------------------------------------------------------------------------

export function executeEffect(effect: Effect, state: GameState, ctx: EffectContext): ExecResult {
  return executeEffectAt(effect, state, ctx, 0)
}

function executeEffectAt(
  effect: Effect,
  state: GameState,
  ctx: EffectContext,
  depth: number,
): ExecResult {
  if (depth > MAX_COMPOSITION_DEPTH) {
    // Cap de profundidad: si una composición excede, ignoramos los hijos.
    // Validator (Phase E) detecta esto antes de runtime; acá es defensa pura.
    return { state, emit: [] }
  }
  switch (effect.op) {
    case 'noop':
      return { state, emit: [] }
    case 'damage':
      return execDamage(effect, state, ctx)
    case 'damage_homeworld':
      return execDamageHomeworld(effect, state, ctx)
    case 'destroy':
      return execDestroy(effect, state, ctx)
    case 'exile':
      return execExile(effect, state, ctx)
    case 'bounce_to_hand':
      return execBounceToHand(effect, state, ctx)
    case 'shuffle_to_deck':
      return execShuffleToDeck(effect, state, ctx)
    case 'draw':
      return execDraw(effect, state, ctx)
    case 'discard':
      return execDiscard(effect, state, ctx)
    case 'mill':
      return execMill(effect, state, ctx)
    case 'search':
      return execSearch(effect, state, ctx)
    case 'modify_strength':
      return execModifyStrength(effect, state, ctx)
    case 'modify_hp':
      return execModifyHp(effect, state, ctx)
    case 'grant_keyword':
      return execGrantKeyword(effect, state, ctx)
    case 'remove_ability':
      // Phase D: marcamos visualmente pero no manipulamos abilities (las cartas instanciadas
      // no portan abilities — viven en la card def). Implementación completa Phase F.
      return { state, emit: [] }
    case 'generate_energy':
      return execGenerateEnergy(effect, state, ctx)
    case 'sacrifice':
      return execSacrifice(effect, state, ctx)
    case 'prevent_damage':
      // Phase D: stub. Requiere replacement registry. Implementación Phase F.
      return { state, emit: [] }
    case 'sequence':
      return execSequence(effect, state, ctx, depth)
    case 'conditional':
      return execConditional(effect, state, ctx, depth)
    case 'for_each':
      return execForEach(effect, state, ctx, depth)
    case 'keyword_amplifier':
      // TODO Phase 1 kernel (v3.0.1): keyword_amplifier requiere hook en sistema
      // de keywords del interpretador. Cuando una keyword `effect.keyword` dispara
      // delta de stats en una nave del controlador del relic, sumar `effect.deltaBonus`
      // al delta. Implementación: registro de amplifiers activos + intercept en
      // executeKeywordTrigger() (todavía no escrito). Por ahora noop — el JSON
      // valida y la carta renderiza correctamente, pero el efecto no se aplica.
      return { state, emit: [] }
    case 'cost_modifier':
      // TODO Phase 1 kernel (v3.0.3): cost_modifier registra un descuento sobre
      // el costo de pagar una keyword target (típicamente `refluencia`) con clamp
      // `minCost`. Implementación: registrar `{ delta, minCost }` en
      // `state.costModifiers[effect.target.keyword]` al desplegar la fuente; limpiar
      // al destruirla. Al calcular el costo de revival en `PAY_REFLUENCIA`, aplicar
      // `Math.max(minCost, baseCost + delta)`. Por ahora noop — JSON valida y
      // renderiza correctamente, pero el costo no se modifica.
      return { state, emit: [] }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function opponentOf(p: PlayerId): PlayerId {
  return p === 'p1' ? 'p2' : 'p1'
}

function resolvePlayer(sel: PlayerSelector, ctx: EffectContext): PlayerId {
  return sel === 'self' ? ctx.controller : opponentOf(ctx.controller)
}

function shipMatchesFilter(
  ship: ShipInstance,
  filter: ShipFilter | undefined,
  cardLookup: (cardId: string) => Card | undefined,
  selfController: PlayerId,
): boolean {
  if (!filter) return true
  if (filter.controller && filter.controller !== 'any') {
    const want = filter.controller === 'self' ? selfController : opponentOf(selfController)
    if (ship.controller !== want) return false
  }
  if (filter.race && filter.race !== 'any') {
    const card = cardLookup(ship.cardId)
    if (!card || card.race !== filter.race) return false
  }
  if (filter.cardType) {
    const card = cardLookup(ship.cardId)
    if (!card || card.type !== filter.cardType) return false
  }
  if (filter.keywordsAny && !filter.keywordsAny.some((k) => ship.keywords.includes(k))) return false
  if (filter.keywordsAll && !filter.keywordsAll.every((k) => ship.keywords.includes(k))) return false
  if (filter.costLte !== undefined) {
    const card = cardLookup(ship.cardId)
    if (!card || card.cost > filter.costLte) return false
  }
  if (filter.costGte !== undefined) {
    const card = cardLookup(ship.cardId)
    if (!card || card.cost < filter.costGte) return false
  }
  if (filter.wasDamagedThisTurn) {
    // v3.0.1: ShipInstance.damagedThisTurn se setea en applyDamageToShip y se
    // resetea en TURN_START (ver reducer). El filtro matchea solo naves con
    // damagedThisTurn === true.
    if (!ship.damagedThisTurn) return false
  }
  return true
}

function findShip(state: GameState, id: ShipInstanceId): { ship: ShipInstance; owner: PlayerId } | null {
  for (const owner of ['p1', 'p2'] as const) {
    const found = state.players[owner].fleet.find((s) => s.instanceId === id)
    if (found) return { ship: found, owner }
  }
  return null
}

function buildCardLookup(state: GameState): (cardId: string) => Card | undefined {
  // Lookup pesimista: las cards en juego siempre tienen su origen en hand+deck+graveyard.
  const all: Card[] = [
    ...state.players.p1.hand,
    ...state.players.p1.deck,
    ...state.players.p1.graveyard,
    ...state.players.p2.hand,
    ...state.players.p2.deck,
    ...state.players.p2.graveyard,
  ]
  return (cardId: string) => all.find((c) => c.id === cardId)
}

function resolveShipTargets(
  target: Target,
  state: GameState,
  ctx: EffectContext,
): readonly ShipInstance[] {
  const lookup = buildCardLookup(state)
  switch (target.kind) {
    case 'self': {
      if (!ctx.selfShipId) return []
      const found = findShip(state, ctx.selfShipId)
      return found ? [found.ship] : []
    }
    case 'controller':
    case 'opponent':
    case 'homeworld':
      return []
    case 'all_ships': {
      const result: ShipInstance[] = []
      for (const owner of ['p1', 'p2'] as const) {
        for (const ship of state.players[owner].fleet) {
          if (shipMatchesFilter(ship, target.filter, lookup, ctx.controller)) result.push(ship)
        }
      }
      return result
    }
    case 'random_ship': {
      const candidates: ShipInstance[] = []
      for (const owner of ['p1', 'p2'] as const) {
        for (const ship of state.players[owner].fleet) {
          if (shipMatchesFilter(ship, target.filter, lookup, ctx.controller)) candidates.push(ship)
        }
      }
      if (candidates.length === 0) return []
      const rng = createRng(state.seed, state.rng)
      const pick = candidates[rng.nextInt(candidates.length)] as ShipInstance
      return [pick]
    }
    case 'chosen_ship': {
      if (!ctx.chosenTargets || ctx.chosenTargets.length === 0) return []
      const result: ShipInstance[] = []
      for (const id of ctx.chosenTargets) {
        const found = findShip(state, id)
        if (found && shipMatchesFilter(found.ship, target.filter, lookup, ctx.controller))
          result.push(found.ship)
      }
      return result
    }
    case 'attacker': {
      // v3.0.1: resuelve al atacante del evento `ship_attacked` que disparó
      // esta ability. EffectContext.attackerShipId se setea desde el bus.
      if (!ctx.attackerShipId) return []
      const found = findShip(state, ctx.attackerShipId)
      return found ? [found.ship] : []
    }
    case 'chosen_permanent': {
      // v3.0.3: resuelve a una carta permanente (relic/tech) elegida via
      // ctx.chosenTargets. Busca en relicsInPlay y techInPlay de ambos
      // players, filtrando por controller/cardType del PermanentFilter.
      if (!ctx.chosenTargets || ctx.chosenTargets.length === 0) return []
      const result: ShipInstance[] = []
      for (const id of ctx.chosenTargets) {
        const found = findPermanentById(state, id)
        if (!found) continue
        if (target.filter) {
          const card = state.cardRegistry[found.ship.cardId]
          if (target.filter.controller && target.filter.controller !== 'any') {
            const want =
              target.filter.controller === 'self'
                ? ctx.controller
                : opponentOf(ctx.controller)
            if (found.ship.controller !== want) continue
          }
          if (target.filter.cardType && card && card.type !== target.filter.cardType) {
            continue
          }
        }
        result.push(found.ship)
      }
      return result
    }
  }
}

/**
 * Lookup en zonas relicsInPlay y techInPlay de ambos players. Usado por
 * el target `chosen_permanent`.
 */
function findPermanentById(
  state: GameState,
  id: ShipInstanceId,
): { ship: ShipInstance; owner: PlayerId } | null {
  for (const owner of ['p1', 'p2'] as const) {
    const inRelics = state.players[owner].relicsInPlay.find((s) => s.instanceId === id)
    if (inRelics) return { ship: inRelics, owner }
    const inTech = state.players[owner].techInPlay.find((s) => s.instanceId === id)
    if (inTech) return { ship: inTech, owner }
  }
  return null
}

function replaceShipInState(
  state: GameState,
  ownerId: PlayerId,
  shipId: ShipInstanceId,
  next: ShipInstance | null,
): GameState {
  const player = state.players[ownerId]
  const fleet = next
    ? player.fleet.map((s) => (s.instanceId === shipId ? next : s))
    : player.fleet.filter((s) => s.instanceId !== shipId)
  return { ...state, players: { ...state.players, [ownerId]: { ...player, fleet } } }
}

function evaluateCondition(cond: Condition, state: GameState, ctx: EffectContext): boolean {
  switch (cond.kind) {
    case 'always':
      return true
    case 'count_filter': {
      const lookup = buildCardLookup(state)
      let count = 0
      for (const owner of ['p1', 'p2'] as const) {
        for (const ship of state.players[owner].fleet) {
          if (shipMatchesFilter(ship, cond.filter, lookup, ctx.controller)) count++
        }
      }
      switch (cond.op) {
        case 'gte':
          return count >= cond.value
        case 'lte':
          return count <= cond.value
        case 'eq':
          return count === cond.value
      }
      break
    }
    case 'self_has_keyword': {
      if (!ctx.selfShipId) return false
      const f = findShip(state, ctx.selfShipId)
      return f ? f.ship.keywords.includes(cond.keyword) : false
    }
    case 'controller_energy_gte':
      return state.players[ctx.controller].energy >= cond.value
  }
}

// ---------------------------------------------------------------------------
// Primitive implementations
// ---------------------------------------------------------------------------

function execDamage(
  effect: Extract<Effect, { op: 'damage' }>,
  state: GameState,
  ctx: EffectContext,
): ExecResult {
  if (effect.target.kind === 'homeworld') {
    return execDamageHomeworld(
      {
        op: 'damage_homeworld',
        player: effect.target.player === 'self' ? 'self' : 'opponent',
        amount: effect.amount,
      },
      state,
      ctx,
    )
  }
  let next = state
  const events: GameEvent[] = []
  const ships = resolveShipTargets(effect.target, state, ctx)
  for (const ship of ships) {
    const found = findShip(next, ship.instanceId)
    if (!found) continue
    const newHp = found.ship.hp - effect.amount
    const updated: ShipInstance = {
      ...found.ship,
      hp: newHp,
      damageTaken: found.ship.damageTaken + effect.amount,
    }
    next = replaceShipInState(next, found.owner, ship.instanceId, newHp <= 0 ? null : updated)
    events.push({
      type: 'SHIP_DAMAGED',
      shipId: ship.instanceId,
      amount: effect.amount,
      source: ctx.sourceCardId,
    })
    if (newHp <= 0) {
      events.push({ type: 'SHIP_DESTROYED', shipId: ship.instanceId, cause: 'ability' })
    }
  }
  return { state: next, emit: events }
}

function execDamageHomeworld(
  effect: Extract<Effect, { op: 'damage_homeworld' }>,
  state: GameState,
  ctx: EffectContext,
): ExecResult {
  // v3.0: damage_homeworld permitido siempre (Edades eliminadas).
  const player = resolvePlayer(effect.player, ctx)
  const ps = state.players[player]
  const newHp = Math.max(0, ps.homeworld.hp - effect.amount)
  const next: GameState = {
    ...state,
    players: {
      ...state.players,
      [player]: { ...ps, homeworld: { ...ps.homeworld, hp: newHp } },
    },
  }
  return {
    state: next,
    emit: [{ type: 'HOMEWORLD_DAMAGED', player, amount: effect.amount, source: ctx.sourceCardId }],
  }
}

function execDestroy(
  effect: Extract<Effect, { op: 'destroy' }>,
  state: GameState,
  ctx: EffectContext,
): ExecResult {
  let next = state
  const events: GameEvent[] = []
  const ships = resolveShipTargets(effect.target, state, ctx)
  for (const ship of ships) {
    const found = findShip(next, ship.instanceId)
    if (!found) continue
    next = replaceShipInState(next, found.owner, ship.instanceId, null)
    events.push({ type: 'SHIP_DESTROYED', shipId: ship.instanceId, cause: 'ability' })
  }
  return { state: next, emit: events }
}

function execExile(
  effect: Extract<Effect, { op: 'exile' }>,
  state: GameState,
  ctx: EffectContext,
): ExecResult {
  // Phase D: el "exile" se modela como destroy + skip graveyard (graveyard no se llena
  // porque las naves instanciadas no van al graveyard en este motor).
  return execDestroy({ op: 'destroy', target: effect.target }, state, ctx)
}

function execBounceToHand(
  effect: Extract<Effect, { op: 'bounce_to_hand' }>,
  state: GameState,
  ctx: EffectContext,
): ExecResult {
  let next = state
  const events: GameEvent[] = []
  const ships = resolveShipTargets(effect.target, state, ctx)
  const lookup = buildCardLookup(state)
  for (const ship of ships) {
    const found = findShip(next, ship.instanceId)
    if (!found) continue
    const card = lookup(ship.cardId)
    if (!card) continue
    next = replaceShipInState(next, found.owner, ship.instanceId, null)
    next = {
      ...next,
      players: {
        ...next.players,
        [found.owner]: {
          ...next.players[found.owner],
          hand: [...next.players[found.owner].hand, card],
        },
      },
    }
    events.push({ type: 'SHIP_DESTROYED', shipId: ship.instanceId, cause: 'ability' })
  }
  return { state: next, emit: events }
}

function execShuffleToDeck(
  effect: Extract<Effect, { op: 'shuffle_to_deck' }>,
  state: GameState,
  ctx: EffectContext,
): ExecResult {
  let next = state
  const events: GameEvent[] = []
  const ships = resolveShipTargets(effect.target, state, ctx)
  const lookup = buildCardLookup(state)
  const ownerId = effect.owner === 'self' ? ctx.controller : opponentOf(ctx.controller)
  for (const ship of ships) {
    const found = findShip(next, ship.instanceId)
    if (!found) continue
    const card = lookup(ship.cardId)
    if (!card) continue
    next = replaceShipInState(next, found.owner, ship.instanceId, null)
    next = {
      ...next,
      players: {
        ...next.players,
        [ownerId]: {
          ...next.players[ownerId],
          deck: [...next.players[ownerId].deck, card],
        },
      },
    }
    events.push({ type: 'SHIP_DESTROYED', shipId: ship.instanceId, cause: 'ability' })
  }
  return { state: next, emit: events }
}

function execDraw(
  effect: Extract<Effect, { op: 'draw' }>,
  state: GameState,
  ctx: EffectContext,
): ExecResult {
  const player = resolvePlayer(effect.player, ctx)
  const ps = state.players[player]
  const drawCount = Math.min(effect.n, ps.deck.length)
  if (drawCount === 0) return { state, emit: [] }
  const drawn = ps.deck.slice(0, drawCount)
  const newDeck = ps.deck.slice(drawCount)
  const next: GameState = {
    ...state,
    players: {
      ...state.players,
      [player]: { ...ps, hand: [...ps.hand, ...drawn], deck: newDeck },
    },
  }
  const events: GameEvent[] = drawn.map(() => ({ type: 'CARD_DRAWN' as const, player }))
  return { state: next, emit: events }
}

function execDiscard(
  effect: Extract<Effect, { op: 'discard' }>,
  state: GameState,
  ctx: EffectContext,
): ExecResult {
  const player = resolvePlayer(effect.target, ctx)
  const ps = state.players[player]
  if (ps.hand.length === 0) return { state, emit: [] }
  const candidates = effect.filter?.cardType
    ? ps.hand.filter((c) => c.type === effect.filter?.cardType)
    : ps.hand
  if (candidates.length === 0) return { state, emit: [] }
  const n = Math.min(effect.n, candidates.length)
  let toDiscard: Card[]
  if (effect.selection === 'random') {
    const rng = createRng(state.seed, state.rng)
    const shuffled = [...candidates]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = rng.nextInt(i + 1)
      const tmp = shuffled[i] as Card
      shuffled[i] = shuffled[j] as Card
      shuffled[j] = tmp
    }
    toDiscard = shuffled.slice(0, n)
  } else {
    // 'choice': sin UI todavía, descartamos los primeros N que match el filter.
    toDiscard = candidates.slice(0, n)
  }
  const newHand = ps.hand.filter((c) => !toDiscard.includes(c))
  return {
    state: {
      ...state,
      players: {
        ...state.players,
        [player]: { ...ps, hand: newHand, graveyard: [...ps.graveyard, ...toDiscard] },
      },
    },
    emit: [],
  }
}

function execMill(
  effect: Extract<Effect, { op: 'mill' }>,
  state: GameState,
  ctx: EffectContext,
): ExecResult {
  const player = resolvePlayer(effect.player, ctx)
  const ps = state.players[player]
  const n = Math.min(effect.n, ps.deck.length)
  if (n === 0) return { state, emit: [] }
  const milled = ps.deck.slice(0, n)
  return {
    state: {
      ...state,
      players: {
        ...state.players,
        [player]: { ...ps, deck: ps.deck.slice(n), graveyard: [...ps.graveyard, ...milled] },
      },
    },
    emit: [],
  }
}

function execSearch(
  effect: Extract<Effect, { op: 'search' }>,
  state: GameState,
  ctx: EffectContext,
): ExecResult {
  const player = resolvePlayer(effect.owner, ctx)
  const ps = state.players[player]
  const zone = effect.zone === 'deck' ? ps.deck : ps.graveyard
  const matches = zone.filter((c) => {
    if (effect.filter.cardType && c.type !== effect.filter.cardType) return false
    if (effect.filter.race && c.race !== effect.filter.race) return false
    return true
  })
  if (matches.length === 0) return { state, emit: [] }
  const found = matches.slice(0, effect.count)
  // Phase D solo soporta destination: 'hand'. 'play' se difiere a Phase F.
  if (effect.destination !== 'hand') return { state, emit: [] }
  const remaining = zone.filter((c) => !found.includes(c))
  return {
    state: {
      ...state,
      players: {
        ...state.players,
        [player]: {
          ...ps,
          ...(effect.zone === 'deck'
            ? { deck: remaining, hand: [...ps.hand, ...found] }
            : { graveyard: remaining, hand: [...ps.hand, ...found] }),
        },
      },
    },
    emit: [],
  }
}

function execModifyStrength(
  effect: Extract<Effect, { op: 'modify_strength' }>,
  state: GameState,
  ctx: EffectContext,
): ExecResult {
  let next = state
  const ships = resolveShipTargets(effect.target, state, ctx)
  for (const ship of ships) {
    const found = findShip(next, ship.instanceId)
    if (!found) continue
    const newStrength =
      effect.kind === 'set' ? effect.value : Math.max(0, found.ship.strength + effect.value)
    next = replaceShipInState(next, found.owner, ship.instanceId, {
      ...found.ship,
      strength: newStrength,
    })
  }
  return { state: next, emit: [] }
}

function execModifyHp(
  effect: Extract<Effect, { op: 'modify_hp' }>,
  state: GameState,
  ctx: EffectContext,
): ExecResult {
  let next = state
  const ships = resolveShipTargets(effect.target, state, ctx)
  for (const ship of ships) {
    const found = findShip(next, ship.instanceId)
    if (!found) continue
    let newHp: number
    if (effect.kind === 'set_to_max') {
      // v3.0.1: regenera al máximo de HP de la nave (ShipInstance.maxHp ya existe).
      newHp = found.ship.maxHp
    } else if (effect.kind === 'set') {
      newHp = effect.value
    } else {
      newHp = Math.max(0, found.ship.hp + effect.value)
    }
    next = replaceShipInState(next, found.owner, ship.instanceId, { ...found.ship, hp: newHp })
  }
  return { state: next, emit: [] }
}

function execGrantKeyword(
  effect: Extract<Effect, { op: 'grant_keyword' }>,
  state: GameState,
  ctx: EffectContext,
): ExecResult {
  let next = state
  const ships = resolveShipTargets(effect.target, state, ctx)
  for (const ship of ships) {
    const found = findShip(next, ship.instanceId)
    if (!found) continue
    if (found.ship.keywords.includes(effect.keyword)) continue
    next = replaceShipInState(next, found.owner, ship.instanceId, {
      ...found.ship,
      keywords: [...found.ship.keywords, effect.keyword],
    })
  }
  return { state: next, emit: [] }
}

function execGenerateEnergy(
  effect: Extract<Effect, { op: 'generate_energy' }>,
  state: GameState,
  ctx: EffectContext,
): ExecResult {
  const player = resolvePlayer(effect.player, ctx)
  const ps = state.players[player]
  return {
    state: {
      ...state,
      players: { ...state.players, [player]: { ...ps, energy: ps.energy + effect.n } },
    },
    emit: [],
  }
}

function execSacrifice(
  effect: Extract<Effect, { op: 'sacrifice' }>,
  state: GameState,
  ctx: EffectContext,
): ExecResult {
  let next = state
  const events: GameEvent[] = []
  const ships = resolveShipTargets(effect.target, state, ctx)
  for (const ship of ships) {
    const found = findShip(next, ship.instanceId)
    if (!found) continue
    next = replaceShipInState(next, found.owner, ship.instanceId, null)
    events.push({ type: 'SHIP_DESTROYED', shipId: ship.instanceId, cause: 'sacrifice' })
  }
  return { state: next, emit: events }
}

function execSequence(
  effect: Extract<Effect, { op: 'sequence' }>,
  state: GameState,
  ctx: EffectContext,
  depth: number,
): ExecResult {
  let next = state
  const allEvents: GameEvent[] = []
  for (const sub of effect.effects) {
    const r = executeEffectAt(sub, next, ctx, depth + 1)
    next = r.state
    for (const e of r.emit) allEvents.push(e)
  }
  return { state: next, emit: allEvents }
}

function execConditional(
  effect: Extract<Effect, { op: 'conditional' }>,
  state: GameState,
  ctx: EffectContext,
  depth: number,
): ExecResult {
  if (evaluateCondition(effect.condition, state, ctx)) {
    return executeEffectAt(effect.thenEffect, state, ctx, depth + 1)
  }
  if (effect.elseEffect) return executeEffectAt(effect.elseEffect, state, ctx, depth + 1)
  return { state, emit: [] }
}

function execForEach(
  effect: Extract<Effect, { op: 'for_each' }>,
  state: GameState,
  ctx: EffectContext,
  depth: number,
): ExecResult {
  const lookup = buildCardLookup(state)
  let count = 0
  for (const owner of ['p1', 'p2'] as const) {
    for (const ship of state.players[owner].fleet) {
      if (shipMatchesFilter(ship, effect.filter, lookup, ctx.controller)) count++
    }
  }
  let next = state
  const allEvents: GameEvent[] = []
  for (let i = 0; i < count; i++) {
    const r = executeEffectAt(effect.effect, next, ctx, depth + 1)
    next = r.state
    for (const e of r.emit) allEvents.push(e)
  }
  return { state: next, emit: allEvents }
}
