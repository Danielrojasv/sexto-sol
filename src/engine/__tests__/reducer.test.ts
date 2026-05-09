import { describe, expect, it } from 'vitest'
import { createInitialState } from '../initialState'
import { apply } from '../reducer'
import type { GameAction, GameState } from '../types'

function fresh(): GameState {
  return createInitialState({ seed: 1, p1Race: 'wuron', p2Race: 'tezhal' })
}

describe('reducer — CONCEDE', () => {
  it('concesión de p1 hace ganar a p2', () => {
    const { state, events } = apply(fresh(), { type: 'CONCEDE', player: 'p1' })
    expect(state.outcome.kind).toBe('win')
    if (state.outcome.kind === 'win') {
      expect(state.outcome.winner).toBe('p2')
      expect(state.outcome.reason).toBe('concession')
    }
    expect(events).toContainEqual({
      type: 'GAME_OVER',
      outcome: { kind: 'win', winner: 'p2', reason: 'concession' },
    })
  })

  it('concesión sobre partida ya terminada es no-op', () => {
    const finished = apply(fresh(), { type: 'CONCEDE', player: 'p1' }).state
    const second = apply(finished, { type: 'CONCEDE', player: 'p2' })
    expect(second.state).toBe(finished)
    expect(second.events).toEqual([])
  })

  it('CONCEDE se loggea', () => {
    const { state } = apply(fresh(), { type: 'CONCEDE', player: 'p1' })
    expect(state.log).toHaveLength(1)
    expect(state.log[0]).toEqual({ type: 'CONCEDE', player: 'p1' })
  })
})

describe('reducer — END_PHASE', () => {
  it('avanza recolección → despliegue → combate → regroup → vigilia → recolección (turno+1)', () => {
    let s = fresh()
    expect(s.phase).toBe('recoleccion')
    expect(s.activePlayer).toBe('p1')
    expect(s.turn).toBe(1)

    s = apply(s, { type: 'END_PHASE' }).state
    expect(s.phase).toBe('despliegue')
    s = apply(s, { type: 'END_PHASE' }).state
    expect(s.phase).toBe('combate')
    s = apply(s, { type: 'END_PHASE' }).state
    expect(s.phase).toBe('regroup')
    s = apply(s, { type: 'END_PHASE' }).state
    expect(s.phase).toBe('vigilia')

    s = apply(s, { type: 'END_PHASE' }).state
    expect(s.phase).toBe('recoleccion')
    expect(s.activePlayer).toBe('p2')
    expect(s.turn).toBe(2)
  })

  it('emite PHASE_END + PHASE_START en avance dentro del mismo turno', () => {
    const { events } = apply(fresh(), { type: 'END_PHASE' })
    expect(events.map((e) => e.type)).toEqual(['PHASE_END', 'PHASE_START'])
  })

  it('emite TURN_START cuando el turno cambia', () => {
    let s = fresh()
    for (let i = 0; i < 4; i++) s = apply(s, { type: 'END_PHASE' }).state
    const { events } = apply(s, { type: 'END_PHASE' })
    const types = events.map((e) => e.type)
    expect(types).toContain('TURN_START')
    expect(types).toContain('PHASE_START')
  })

  it('transición a Edad II al inicio del turno 5', () => {
    let s = fresh()
    while (s.turn < 5) s = apply(s, { type: 'END_PHASE' }).state
    // Empieza turno 5: la transición se gatilla cuando turn pasa a 5.
    expect(s.age).toBe(2)
  })

  it('emite AGE_CHANGED en la transición', () => {
    let s = fresh()
    while (s.turn < 4 || s.phase !== 'vigilia') s = apply(s, { type: 'END_PHASE' }).state
    // Próximo END_PHASE incrementa turn a 5 y dispara la transición.
    const result = apply(s, { type: 'END_PHASE' })
    const ageChanged = result.events.find((e) => e.type === 'AGE_CHANGED')
    expect(ageChanged).toEqual({ type: 'AGE_CHANGED', from: 1, to: 2 })
  })

  it('transición a Edad III al inicio del turno 9', () => {
    let s = fresh()
    while (s.turn < 9) s = apply(s, { type: 'END_PHASE' }).state
    expect(s.age).toBe(3)
  })

  it('después de Edad III no hay más transiciones', () => {
    let s = fresh()
    while (s.turn < 9) s = apply(s, { type: 'END_PHASE' }).state
    expect(s.age).toBe(3)
    // Avanzá varios turnos más — la edad sigue siendo 3.
    for (let i = 0; i < 30; i++) s = apply(s, { type: 'END_PHASE' }).state
    expect(s.age).toBe(3)
  })

  it('END_PHASE sobre partida terminada es no-op', () => {
    const finished = apply(fresh(), { type: 'CONCEDE', player: 'p1' }).state
    const result = apply(finished, { type: 'END_PHASE' })
    expect(result.state).toBe(finished)
    expect(result.events).toEqual([])
  })
})

describe('reducer — acciones diferidas a Phase 2+', () => {
  it.each<GameAction>([
    { type: 'PLAY_CARD', cardId: 'placeholder' },
    {
      type: 'DECLARE_ATTACK',
      attackerShipId: 'ship-1',
      target: { kind: 'homeworld', ref: 'p2' },
    },
    { type: 'ACTIVATE_PLANET', planetId: 'planet_1' },
    { type: 'ACTIVATE_HERO_POWER', abilityId: 'hp-1' },
    { type: 'DEPLOY_HERO' },
    { type: 'ACTIVATE_ABILITY', sourceId: 'src-1', abilityId: 'ab-1' },
  ])('acción %s no muta state ni emite eventos', (action) => {
    const before = fresh()
    const { state, events } = apply(before, action)
    expect(state).toBe(before)
    expect(events).toEqual([])
  })
})
