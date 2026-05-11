import { describe, expect, it } from 'vitest'
import { dispatch, dequeueEvent, enqueueEvents, sortHandlers } from '../events'
import type { EventHandler } from '../events'
import { createInitialState, type NewGameSetup } from '../initialState'
import { apply } from '../reducer'
import {
  TRIGGER_EVENT_TO_GAME_TYPE,
  deriveHandlersFromAbilities,
  processEventWithCascade,
  runTriggers,
} from '../eventBus'
import type { Ability } from '@/data/primitives/spec'
import type { Card, GameAction, GameEvent, GameState, MechanicCategory } from '../types'

function makeHandler(
  category: MechanicCategory,
  premonition: boolean,
  tag: string,
): EventHandler {
  return {
    trigger: 'SHIP_DAMAGED',
    category,
    premonition,
    context: { selfId: tag, selfController: 'p1' },
    filter: () => true,
    effect: (_event, state) => ({ state, emit: [] }),
  }
}

function fresh(): GameState {
  return createInitialState({ seed: 1, p1Race: 'wuron', p2Race: 'tezhal' })
}

describe('event bus — orden de resolución', () => {
  it('orden: reactive → initiative → accumulative → post_combat', () => {
    const handlers: EventHandler[] = [
      makeHandler('post_combat', false, 'post'),
      makeHandler('accumulative', false, 'accum'),
      makeHandler('initiative', false, 'init'),
      makeHandler('reactive', false, 'react'),
    ]
    const sorted = sortHandlers(handlers)
    expect(sorted.map((h) => h.context.selfId)).toEqual(['react', 'init', 'accum', 'post'])
  })

  it('Premonition resuelve antes que cualquier categoría', () => {
    const handlers: EventHandler[] = [
      makeHandler('reactive', false, 'react'),
      makeHandler('post_combat', true, 'premon-post'),
      makeHandler('initiative', false, 'init'),
      makeHandler('accumulative', true, 'premon-accum'),
    ]
    const sorted = sortHandlers(handlers)
    // Los dos Premonition primero (en orden de registro), después por categoría.
    expect(sorted.map((h) => h.context.selfId)).toEqual([
      'premon-post',
      'premon-accum',
      'react',
      'init',
    ])
  })

  it('handlers de la misma categoría preservan orden de registro (estable)', () => {
    const handlers: EventHandler[] = [
      makeHandler('reactive', false, 'react-1'),
      makeHandler('reactive', false, 'react-2'),
      makeHandler('reactive', false, 'react-3'),
    ]
    const sorted = sortHandlers(handlers)
    expect(sorted.map((h) => h.context.selfId)).toEqual(['react-1', 'react-2', 'react-3'])
  })

  it('dispatch ejecuta efectos en orden y acumula eventos emitidos', () => {
    const events: string[] = []
    const handlers: EventHandler[] = [
      {
        trigger: 'SHIP_DAMAGED',
        category: 'post_combat',
        premonition: false,
        context: { selfId: 'A', selfController: 'p1' },
        filter: () => true,
        effect: (_e, s) => {
          events.push('A')
          return { state: s, emit: [] }
        },
      },
      {
        trigger: 'SHIP_DAMAGED',
        category: 'reactive',
        premonition: false,
        context: { selfId: 'B', selfController: 'p1' },
        filter: () => true,
        effect: (_e, s) => {
          events.push('B')
          return { state: s, emit: [] }
        },
      },
    ]
    const evt: GameEvent = { type: 'SHIP_DAMAGED', shipId: 'x', amount: 1, source: 'test' }
    dispatch(fresh(), evt, handlers)
    expect(events).toEqual(['B', 'A'])
  })

  it('handler con filter() = false no se ejecuta', () => {
    let executed = false
    const handler: EventHandler = {
      trigger: 'SHIP_DAMAGED',
      category: 'reactive',
      premonition: false,
      context: { selfId: 'X', selfController: 'p1' },
      filter: () => false,
      effect: (_e, s) => {
        executed = true
        return { state: s, emit: [] }
      },
    }
    const evt: GameEvent = { type: 'SHIP_DAMAGED', shipId: 'x', amount: 1, source: 'test' }
    dispatch(fresh(), evt, [handler])
    expect(executed).toBe(false)
  })

  it('handler de tipo de evento distinto se ignora', () => {
    let executed = false
    const handler: EventHandler = {
      trigger: 'CARD_PLAYED',
      category: 'reactive',
      premonition: false,
      context: { selfId: 'X', selfController: 'p1' },
      filter: () => true,
      effect: (_e, s) => {
        executed = true
        return { state: s, emit: [] }
      },
    }
    const evt: GameEvent = { type: 'SHIP_DAMAGED', shipId: 'x', amount: 1, source: 'test' }
    dispatch(fresh(), evt, [handler])
    expect(executed).toBe(false)
  })

  it('dispatch acumula eventos emitidos por efectos', () => {
    const handler: EventHandler = {
      trigger: 'SHIP_DAMAGED',
      category: 'reactive',
      premonition: false,
      context: { selfId: 'X', selfController: 'p1' },
      filter: () => true,
      effect: (e, s) => ({
        state: s,
        emit: [
          {
            type: 'SHIP_DESTROYED',
            shipId: e.type === 'SHIP_DAMAGED' ? e.shipId : 'unknown',
            cause: 'ability',
          },
        ],
      }),
    }
    const evt: GameEvent = { type: 'SHIP_DAMAGED', shipId: 'x', amount: 1, source: 'test' }
    const result = dispatch(fresh(), evt, [handler])
    expect(result.emit).toEqual([{ type: 'SHIP_DESTROYED', shipId: 'x', cause: 'ability' }])
  })
})

describe('event queue helpers', () => {
  it('enqueueEvents agrega al final de pendingEvents', () => {
    const s = fresh()
    expect(s.pendingEvents).toEqual([])
    const e: GameEvent = { type: 'CARD_PLAYED', cardId: 'c1', player: 'p1' }
    const next = enqueueEvents(s, [e])
    expect(next.pendingEvents).toEqual([e])
  })

  it('enqueueEvents con array vacío devuelve el mismo state (referencial)', () => {
    const s = fresh()
    expect(enqueueEvents(s, [])).toBe(s)
  })

  it('dequeueEvent retorna el primero y avanza la cola', () => {
    let s = fresh()
    const e1: GameEvent = { type: 'CARD_PLAYED', cardId: 'c1', player: 'p1' }
    const e2: GameEvent = { type: 'CARD_PLAYED', cardId: 'c2', player: 'p1' }
    s = enqueueEvents(s, [e1, e2])
    const a = dequeueEvent(s)
    expect(a.event).toEqual(e1)
    expect(a.state.pendingEvents).toEqual([e2])
    const b = dequeueEvent(a.state)
    expect(b.event).toEqual(e2)
    expect(b.state.pendingEvents).toEqual([])
  })

  it('dequeueEvent sobre cola vacía retorna null', () => {
    const s = fresh()
    const r = dequeueEvent(s)
    expect(r.event).toBeNull()
    expect(r.state).toBe(s)
  })
})

// ---------------------------------------------------------------------------
// Bridge `eventBus.ts` — deriva handlers desde abilities y los procesa via
// el bus primitivo. Cubre el ciclo completo reducer → bus → interpreter.
// ---------------------------------------------------------------------------

function deck(size: number, overrides?: Partial<Card>): Card[] {
  return Array.from({ length: size }, (_, i) => ({
    id: `c${i}`,
    name: `Carta ${i}`,
    type: 'ship',
    race: 'wuron',
    cost: 0,
    rarity: 'common',
    keywords: [],
    abilities: [],
    strength: 1,
    hp: 1,
    ...overrides,
  }))
}

function freshGame(over?: Partial<NewGameSetup>): GameState {
  return createInitialState({
    seed: 1,
    p1Race: 'wuron',
    p2Race: 'tezhal',
    p1Deck: deck(30),
    p2Deck: deck(30),
    ...over,
  })
}

describe('eventBus bridge — mapping de trigger events', () => {
  it('mapea todos los TriggerEvent del DSL a constantes engine (v3.0)', () => {
    expect(TRIGGER_EVENT_TO_GAME_TYPE.ship_damaged).toBe('SHIP_DAMAGED')
    expect(TRIGGER_EVENT_TO_GAME_TYPE.ship_destroyed).toBe('SHIP_DESTROYED')
    expect(TRIGGER_EVENT_TO_GAME_TYPE.ship_attacked).toBe('SHIP_ATTACKED')
    expect(TRIGGER_EVENT_TO_GAME_TYPE.card_played).toBe('CARD_PLAYED')
    expect(TRIGGER_EVENT_TO_GAME_TYPE.phase_start).toBe('PHASE_START')
    expect(TRIGGER_EVENT_TO_GAME_TYPE.phase_end).toBe('PHASE_END')
    expect(TRIGGER_EVENT_TO_GAME_TYPE.turn_start).toBe('TURN_START')
    expect(TRIGGER_EVENT_TO_GAME_TYPE.homeworld_damaged).toBe('HOMEWORLD_DAMAGED')
    expect(TRIGGER_EVENT_TO_GAME_TYPE.card_drawn).toBe('CARD_DRAWN')
  })
})

describe('eventBus bridge — deriveHandlersFromAbilities', () => {
  it('extrae handlers de naves con abilities on_event', () => {
    const reactiveDraw: Ability = {
      trigger: { kind: 'on_event', event: 'ship_damaged' },
      category: 'reactive',
      effect: { op: 'draw', player: 'self', n: 1 },
    }
    const reactiveCard: Card = {
      id: 'reactive',
      name: 'Reactive Ship',
      type: 'ship',
      race: 'wuron',
      cost: 0,
      rarity: 'common',
      keywords: [],
      abilities: [reactiveDraw],
      strength: 2,
      hp: 3,
    }
    let s = freshGame({ p1Deck: [reactiveCard, ...deck(30)] })
    s = apply(s, { type: 'END_PHASE' }).state
    s = apply(s, { type: 'PLAY_CARD', cardId: 'reactive' }).state
    const handlers = deriveHandlersFromAbilities(s)
    expect(handlers).toHaveLength(1)
    expect(handlers[0]?.trigger).toBe('SHIP_DAMAGED')
    expect(handlers[0]?.category).toBe('reactive')
  })

  it('ignora abilities con trigger on_play (las maneja el reducer directamente)', () => {
    const onPlayAbility: Ability = {
      trigger: { kind: 'on_play' },
      category: 'reactive',
      effect: { op: 'draw', player: 'self', n: 1 },
    }
    const card: Card = {
      id: 'play-only',
      name: 'Play Only',
      type: 'ship',
      race: 'wuron',
      cost: 0,
      rarity: 'common',
      keywords: [],
      abilities: [onPlayAbility],
      strength: 1,
      hp: 1,
    }
    let s = freshGame({ p1Deck: [card, ...deck(30)] })
    s = apply(s, { type: 'END_PHASE' }).state
    s = apply(s, { type: 'PLAY_CARD', cardId: 'play-only' }).state
    const handlers = deriveHandlersFromAbilities(s)
    expect(handlers).toHaveLength(0)
  })

  it('ignora abilities con trigger continuous (derive layer)', () => {
    const continuousAbility: Ability = {
      trigger: { kind: 'continuous' },
      category: 'reactive',
      effect: { op: 'keyword_amplifier', keyword: 'kulen', deltaBonus: 1 },
    }
    const relic: Card = {
      id: 'relic',
      name: 'Relic',
      type: 'relic',
      race: 'wuron',
      cost: 4,
      rarity: 'rare',
      keywords: [],
      abilities: [continuousAbility],
    }
    const s = freshGame({ p1Deck: [relic, ...deck(30)] })
    const handlers = deriveHandlersFromAbilities(s)
    expect(handlers).toHaveLength(0)
  })

  it('múltiples abilities reactivas en distintas naves → un handler por (ship, ability)', () => {
    const reactive: Ability = {
      trigger: { kind: 'on_event', event: 'ship_damaged' },
      category: 'reactive',
      effect: { op: 'noop' },
    }
    const cardA: Card = {
      id: 'a',
      name: 'A',
      type: 'ship',
      race: 'wuron',
      cost: 0,
      rarity: 'common',
      keywords: [],
      abilities: [reactive],
      strength: 1,
      hp: 1,
    }
    const cardB: Card = { ...cardA, id: 'b', name: 'B' }
    let s = freshGame({ p1Deck: [cardA, cardB, ...deck(30)] })
    s = apply(s, { type: 'END_PHASE' }).state
    s = apply(s, { type: 'PLAY_CARD', cardId: 'a' }).state
    s = apply(s, { type: 'PLAY_CARD', cardId: 'b' }).state
    const handlers = deriveHandlersFromAbilities(s)
    expect(handlers).toHaveLength(2)
    expect(handlers.map((h) => h.context.selfId).sort()).toEqual(
      s.players.p1.fleet.map((sh) => sh.instanceId).sort(),
    )
  })
})

describe('eventBus bridge — runTriggers', () => {
  it('handler con trigger matching ejecuta su effect', () => {
    const reactiveDraw: Ability = {
      trigger: { kind: 'on_event', event: 'ship_damaged' },
      category: 'reactive',
      effect: { op: 'draw', player: 'self', n: 1 },
    }
    const card: Card = {
      id: 'r',
      name: 'R',
      type: 'ship',
      race: 'wuron',
      cost: 0,
      rarity: 'common',
      keywords: [],
      abilities: [reactiveDraw],
      strength: 1,
      hp: 1,
    }
    let s = freshGame({ p1Deck: [card, ...deck(30)] })
    s = apply(s, { type: 'END_PHASE' }).state
    s = apply(s, { type: 'PLAY_CARD', cardId: 'r' }).state
    const handBefore = s.players.p1.hand.length
    const shipId = s.players.p1.fleet[0]?.instanceId as string
    const damaged: GameEvent = { type: 'SHIP_DAMAGED', shipId, amount: 1, source: 'test' }
    const { state: after, emit } = runTriggers(s, damaged)
    expect(after.players.p1.hand.length).toBe(handBefore + 1)
    expect(emit).toEqual([{ type: 'CARD_DRAWN', player: 'p1' }])
  })

  it('handler con trigger distinto no se dispara', () => {
    const reactive: Ability = {
      trigger: { kind: 'on_event', event: 'ship_destroyed' },
      category: 'reactive',
      effect: { op: 'draw', player: 'self', n: 1 },
    }
    const card: Card = {
      id: 'x',
      name: 'X',
      type: 'ship',
      race: 'wuron',
      cost: 0,
      rarity: 'common',
      keywords: [],
      abilities: [reactive],
      strength: 1,
      hp: 1,
    }
    let s = freshGame({ p1Deck: [card, ...deck(30)] })
    s = apply(s, { type: 'END_PHASE' }).state
    s = apply(s, { type: 'PLAY_CARD', cardId: 'x' }).state
    const handBefore = s.players.p1.hand.length
    const damagedEvt: GameEvent = {
      type: 'SHIP_DAMAGED',
      shipId: 'irrelevant',
      amount: 1,
      source: 'test',
    }
    const { state: after } = runTriggers(s, damagedEvt)
    expect(after.players.p1.hand.length).toBe(handBefore)
  })
})

describe('eventBus bridge — processEventWithCascade', () => {
  it('cap de profundidad detiene cascade infinita', () => {
    // Una ability que dispara SHIP_DAMAGED a sí misma genera cascade indefinido.
    // damage 1 mantiene a la nave viva (hp=99) por más de MAX_TRIGGER_CASCADE_DEPTH.
    const selfDamager: Ability = {
      trigger: { kind: 'on_event', event: 'ship_damaged' },
      category: 'reactive',
      effect: { op: 'damage', target: { kind: 'self' }, amount: 1 },
    }
    const card: Card = {
      id: 'sd',
      name: 'SelfDamager',
      type: 'ship',
      race: 'wuron',
      cost: 0,
      rarity: 'common',
      keywords: [],
      abilities: [selfDamager],
      strength: 1,
      hp: 99,
    }
    let s = freshGame({ p1Deck: [card, ...deck(30)] })
    s = apply(s, { type: 'END_PHASE' }).state
    s = apply(s, { type: 'PLAY_CARD', cardId: 'sd' }).state
    const shipId = s.players.p1.fleet[0]?.instanceId as string
    const evts: GameEvent[] = []
    const evt: GameEvent = { type: 'SHIP_DAMAGED', shipId, amount: 1, source: 'test' }
    const after = processEventWithCascade(s, evt, evts)
    // Sin cap, esto sería un loop. Con cap, retorna y la cascade está acotada.
    expect(evts.length).toBeGreaterThan(0)
    expect(evts.length).toBeLessThanOrEqual(32)
    expect(after).toBeDefined()
  })
})

describe('reducer integration — SHIP_ATTACKED se emite en DECLARE_ATTACK', () => {
  it('combate ship vs ship emite SHIP_ATTACKED antes que SHIP_DAMAGED', () => {
    const att: Card = {
      id: 'att',
      name: 'Atacante',
      type: 'ship',
      race: 'wuron',
      cost: 0,
      rarity: 'common',
      abilities: [],
      keywords: [],
      strength: 2,
      hp: 5,
    }
    const def: Card = {
      id: 'def',
      name: 'Defensor',
      type: 'ship',
      race: 'tezhal',
      cost: 0,
      rarity: 'common',
      abilities: [],
      keywords: [],
      strength: 2,
      hp: 4,
    }
    let s = freshGame({
      p1Deck: [att, ...deck(30)],
      p2Deck: [def, ...deck(30)],
    })
    s = apply(s, { type: 'END_PHASE' }).state
    s = apply(s, { type: 'PLAY_CARD', cardId: 'att' }).state
    while (!(s.activePlayer === 'p2' && s.phase === 'despliegue')) {
      s = apply(s, { type: 'END_PHASE' }).state
    }
    s = apply(s, { type: 'PLAY_CARD', cardId: 'def' }).state
    while (!(s.activePlayer === 'p1' && s.phase === 'combate')) {
      s = apply(s, { type: 'END_PHASE' }).state
    }
    const attackerId = s.players.p1.fleet[0]?.instanceId as string
    const defenderId = s.players.p2.fleet[0]?.instanceId as string
    const action: GameAction = {
      type: 'DECLARE_ATTACK',
      attackerShipId: attackerId,
      target: { kind: 'ship', ref: defenderId },
    }
    const r = apply(s, action)
    const attackedIdx = r.events.findIndex((e) => e.type === 'SHIP_ATTACKED')
    const firstDamagedIdx = r.events.findIndex((e) => e.type === 'SHIP_DAMAGED')
    expect(attackedIdx).toBeGreaterThanOrEqual(0)
    expect(firstDamagedIdx).toBeGreaterThan(attackedIdx)
    const attacked = r.events[attackedIdx]
    if (attacked?.type === 'SHIP_ATTACKED') {
      expect(attacked.attackerId).toBe(attackerId)
      expect(attacked.defenderId).toBe(defenderId)
    }
  })

  it('combate ship vs homeworld emite SHIP_ATTACKED con defenderId = playerId', () => {
    const att: Card = {
      id: 'att',
      name: 'Atacante',
      type: 'ship',
      race: 'wuron',
      cost: 0,
      rarity: 'common',
      abilities: [],
      keywords: ['embate'], // sin mareo de invocación
      strength: 3,
      hp: 5,
    }
    let s = freshGame({ p1Deck: [att, ...deck(30)] })
    s = apply(s, { type: 'END_PHASE' }).state
    s = apply(s, { type: 'PLAY_CARD', cardId: 'att' }).state
    while (!(s.activePlayer === 'p1' && s.phase === 'combate')) {
      s = apply(s, { type: 'END_PHASE' }).state
    }
    const attackerId = s.players.p1.fleet[0]?.instanceId as string
    const r = apply(s, {
      type: 'DECLARE_ATTACK',
      attackerShipId: attackerId,
      target: { kind: 'homeworld', ref: 'p2' },
    })
    const attacked = r.events.find((e) => e.type === 'SHIP_ATTACKED')
    expect(attacked).toBeDefined()
    if (attacked?.type === 'SHIP_ATTACKED') {
      expect(attacked.attackerId).toBe(attackerId)
      expect(attacked.defenderId).toBe('p2')
    }
  })
})
