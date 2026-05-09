import { describe, expect, it } from 'vitest'
import { dispatch, dequeueEvent, enqueueEvents, sortHandlers } from '../events'
import type { EventHandler } from '../events'
import { createInitialState } from '../initialState'
import type { GameEvent, GameState, MechanicCategory } from '../types'

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
