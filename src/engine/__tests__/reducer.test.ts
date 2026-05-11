import { describe, expect, it } from 'vitest'
import { createInitialState, type NewGameSetup } from '../initialState'
import { apply } from '../reducer'
import type { Card, GameAction, GameState, HeroDefinition } from '../types'

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

function fresh(over?: Partial<NewGameSetup>): GameState {
  return createInitialState({
    seed: 1,
    p1Race: 'wuron',
    p2Race: 'tezhal',
    p1Deck: deck(30),
    p2Deck: deck(30),
    ...over,
  })
}

const HERO: HeroDefinition = {
  id: 'hero1',
  name: 'Héroe',
  race: 'wuron',
  passives: [],
  activePowers: ['power-1'],
  combatStrength: 3,
  combatHp: 5,
}

function advancePhases(state: GameState, count: number): GameState {
  let s = state
  for (let i = 0; i < count; i++) s = apply(s, { type: 'END_PHASE' }).state
  return s
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

  it('emite TURN_START + PHASE_START + CARD_DRAWN al cambiar turno', () => {
    const after4 = advancePhases(fresh(), 4)
    const { events } = apply(after4, { type: 'END_PHASE' })
    const types = events.map((e) => e.type)
    expect(types).toContain('TURN_START')
    expect(types).toContain('PHASE_START')
    expect(types).toContain('CARD_DRAWN')
  })

  it('p2 recibe energía + carta al iniciar su turno', () => {
    const after5 = advancePhases(fresh(), 5)
    expect(after5.activePlayer).toBe('p2')
    expect(after5.players.p2.energy).toBe(1)
    expect(after5.players.p2.hand).toHaveLength(6) // 5 setup + 1 turn-start
  })

  it('transición a Edad II al inicio del turno 5', () => {
    let s = fresh()
    while (s.turn < 5) s = apply(s, { type: 'END_PHASE' }).state
    expect(s.age).toBe(2)
  })

  it('emite AGE_CHANGED en la transición', () => {
    let s = fresh()
    while (s.turn < 4 || s.phase !== 'vigilia') s = apply(s, { type: 'END_PHASE' }).state
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
    let s = fresh({ p1Deck: deck(60), p2Deck: deck(60) })
    while (s.turn < 9) s = apply(s, { type: 'END_PHASE' }).state
    expect(s.age).toBe(3)
    for (let i = 0; i < 30; i++) s = apply(s, { type: 'END_PHASE' }).state
    expect(s.age).toBe(3)
  })

  it('END_PHASE sobre partida terminada es no-op', () => {
    const finished = apply(fresh(), { type: 'CONCEDE', player: 'p1' }).state
    const result = apply(finished, { type: 'END_PHASE' })
    expect(result.state).toBe(finished)
    expect(result.events).toEqual([])
  })

  it('decking out: si el mazo está vacío al iniciar turno → derrota', () => {
    // p2 con mazo de 1: setup hand=5 toma 1, deja 0. Al primer turn-start de p2,
    // intenta robar de mazo vacío → decking out.
    const s = fresh({ p1Deck: deck(20), p2Deck: deck(1) })
    const after5 = advancePhases(s, 5)
    expect(after5.outcome.kind).toBe('win')
    if (after5.outcome.kind === 'win') {
      expect(after5.outcome.winner).toBe('p1')
      expect(after5.outcome.reason).toBe('decking_out')
    }
  })

  it('mano cap 7 al final de vigilia: descarta excedente', () => {
    // p1 con mazo grande va a tener mano grande tras varios turnos.
    let s = fresh({ p1Deck: deck(30), p2Deck: deck(30) })
    // Inflar mano de p1 manualmente para test directo.
    s = {
      ...s,
      players: {
        ...s.players,
        p1: {
          ...s.players.p1,
          hand: deck(10, { id: 'h-x' }), // 10 cartas — excede cap 7
        },
      },
    }
    // Ir hasta vigilia de p1 y disparar END_PHASE.
    s = advancePhases(s, 4) // recolección → despliegue → combate → regroup → vigilia
    // pero advancePhases ya avanza hasta el end de la 4ta fase. Veamos...
    // Después de 4 END_PHASE, estamos en vigilia. El siguiente END_PHASE dispara cap.
    expect(s.phase).toBe('vigilia')
    s = apply(s, { type: 'END_PHASE' }).state
    expect(s.players.p1.hand.length).toBeLessThanOrEqual(7)
    expect(s.players.p1.graveyard.length).toBeGreaterThan(0)
  })
})

describe('reducer — PLAY_CARD (Naves)', () => {
  it('jugar nave en Despliegue mueve carta a fleet y descuenta energía', () => {
    const cardX: Card = {
      id: 'x',
      name: 'Nave X',
      type: 'ship',
      race: 'wuron',
      cost: 1,
      rarity: 'common',
      abilities: [],
      keywords: [],
      strength: 2,
      hp: 3,
    }
    let s = fresh({ p1Deck: [cardX, ...deck(30)] })
    s = apply(s, { type: 'END_PHASE' }).state // recolección → despliegue
    expect(s.phase).toBe('despliegue')
    const handBefore = s.players.p1.hand.length
    const energyBefore = s.players.p1.energy
    const r = apply(s, { type: 'PLAY_CARD', cardId: 'x' })
    expect(r.events).toContainEqual({ type: 'CARD_PLAYED', cardId: 'x', player: 'p1' })
    expect(r.state.players.p1.hand.length).toBe(handBefore - 1)
    expect(r.state.players.p1.fleet.length).toBe(1)
    expect(r.state.players.p1.fleet[0]?.strength).toBe(2)
    expect(r.state.players.p1.fleet[0]?.hp).toBe(3)
    expect(r.state.players.p1.energy).toBe(energyBefore - 1)
  })

  it('jugar carta sin energía suficiente es no-op', () => {
    const cardExpensive: Card = {
      id: 'x',
      name: 'Nave Cara',
      type: 'ship',
      race: 'wuron',
      cost: 99,
      rarity: 'common',
      abilities: [],
      keywords: [],
      strength: 5,
      hp: 5,
    }
    let s = fresh({ p1Deck: [cardExpensive, ...deck(30)] })
    s = apply(s, { type: 'END_PHASE' }).state
    const before = s
    const r = apply(s, { type: 'PLAY_CARD', cardId: 'x' })
    expect(r.state).toBe(before)
    expect(r.events).toEqual([])
  })

  it('jugar carta fuera de fase Despliegue es no-op', () => {
    const s = fresh()
    expect(s.phase).toBe('recoleccion')
    const r = apply(s, { type: 'PLAY_CARD', cardId: 'c0' })
    expect(r.state).toBe(s)
  })

  it('jugar tecnología sin abilities continuous entra a techInPlay (Phase 1 kernel)', () => {
    // v3.0.3: relics y tech permanentes ahora se procesan vía handlePlayCard.
    // Una tech sin abilities especiales entra a techInPlay del owner.
    const tech: Card = {
      id: 't',
      name: 'Tech',
      type: 'tech',
      race: 'wuron',
      cost: 0,
      rarity: 'common',
      abilities: [],
      keywords: [],
    }
    let s = fresh({ p1Deck: [tech, ...deck(30)] })
    s = apply(s, { type: 'END_PHASE' }).state
    const r = apply(s, { type: 'PLAY_CARD', cardId: 't' })
    expect(r.state.players.p1.techInPlay).toHaveLength(1)
    expect(r.state.players.p1.techInPlay[0]?.cardId).toBe('t')
    expect(r.state.players.p1.hand.find((c) => c.id === 't')).toBeUndefined()
  })
})

describe('reducer — ACTIVATE_PLANET', () => {
  it('activar planeta lo deja exhausted con exhaustedBy = activePlayer', () => {
    const s = fresh()
    const r = apply(s, { type: 'ACTIVATE_PLANET', planetId: 'planet_1' })
    const planet = r.state.sector.planets.find((p) => p.id === 'planet_1')
    expect(planet?.exhausted).toBe(true)
    expect(planet?.exhaustedBy).toBe('p1')
    expect(r.events).toContainEqual({
      type: 'PLANET_ACTIVATED',
      planetId: 'planet_1',
      activatedBy: 'p1',
    })
  })

  it('activar planeta da +1 energía neta (rules §2.1)', () => {
    const s = fresh()
    const before = s.players.p1.energy
    const r = apply(s, { type: 'ACTIVATE_PLANET', planetId: 'planet_1' })
    expect(r.state.players.p1.energy).toBe(before + 1)
  })

  it('activar planeta agotado es no-op', () => {
    let s = fresh()
    s = apply(s, { type: 'ACTIVATE_PLANET', planetId: 'planet_1' }).state
    const before = s
    const r = apply(s, { type: 'ACTIVATE_PLANET', planetId: 'planet_1' })
    expect(r.state).toBe(before)
  })

  it('activar planeta sin energía es no-op', () => {
    const s0 = fresh()
    const drained: GameState = {
      ...s0,
      players: { ...s0.players, p1: { ...s0.players.p1, energy: 0 } },
    }
    const r = apply(drained, { type: 'ACTIVATE_PLANET', planetId: 'planet_1' })
    expect(r.state).toBe(drained)
  })

  it('planeta agotado por p1 vuelve disponible al inicio del turno de p1', () => {
    let s = fresh({ p1Deck: deck(60), p2Deck: deck(60) })
    s = apply(s, { type: 'ACTIVATE_PLANET', planetId: 'planet_1' }).state
    expect(s.sector.planets.find((p) => p.id === 'planet_1')?.exhausted).toBe(true)
    // Avanzar al turno de p2 y luego de vuelta a p1.
    s = advancePhases(s, 10) // 5 fases p1 + 5 fases p2
    expect(s.activePlayer).toBe('p1')
    expect(s.turn).toBe(3)
    expect(s.sector.planets.find((p) => p.id === 'planet_1')?.exhausted).toBe(false)
  })
})

describe('reducer — DECLARE_ATTACK', () => {
  function setupCombat(): GameState {
    const att: Card = {
      id: 'att',
      name: 'Atacante',
      type: 'ship',
      race: 'wuron',
      cost: 0,
      rarity: 'common',
      abilities: [],
      keywords: [],
      strength: 3,
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
    let s = fresh({
      p1Deck: [att, ...deck(30)],
      p2Deck: [def, ...deck(30)],
    })
    s = apply(s, { type: 'END_PHASE' }).state // p1 despliegue
    s = apply(s, { type: 'PLAY_CARD', cardId: 'att' }).state
    // Avanzar hasta turno de p2 despliegue para que p2 juegue su carta.
    while (!(s.activePlayer === 'p2' && s.phase === 'despliegue')) {
      s = apply(s, { type: 'END_PHASE' }).state
    }
    s = apply(s, { type: 'PLAY_CARD', cardId: 'def' }).state
    // Avanzar al combate de p1 turno 2.
    while (!(s.activePlayer === 'p1' && s.phase === 'combate')) {
      s = apply(s, { type: 'END_PHASE' }).state
    }
    return s
  }

  it('combate ship-ship simultáneo aplica daño = fuerza del otro', () => {
    const s = setupCombat()
    const attackerId = s.players.p1.fleet[0]?.instanceId as string
    const defenderId = s.players.p2.fleet[0]?.instanceId as string
    const r = apply(s, {
      type: 'DECLARE_ATTACK',
      attackerShipId: attackerId,
      target: { kind: 'ship', ref: defenderId },
    })
    const atk = r.state.players.p1.fleet.find((sh) => sh.instanceId === attackerId)
    const def = r.state.players.p2.fleet.find((sh) => sh.instanceId === defenderId)
    expect(atk?.hp).toBe(5 - 2)
    expect(def?.hp).toBe(4 - 3)
  })

  it('combate ship-homeworld baja HP del mundo natal sin retorno', () => {
    const s = setupCombat()
    const attackerId = s.players.p1.fleet[0]?.instanceId as string
    const r = apply(s, {
      type: 'DECLARE_ATTACK',
      attackerShipId: attackerId,
      target: { kind: 'homeworld', ref: 'p2' },
    })
    expect(r.state.players.p2.homeworld.hp).toBe(20 - 3)
    expect(r.state.players.p1.fleet[0]?.hp).toBe(5)
  })

  it('atacar mundo natal con Bastión defensor es ilegal — no-op', () => {
    const att: Card = {
      id: 'att',
      name: 'Atacante',
      type: 'ship',
      race: 'wuron',
      cost: 0,
      rarity: 'common',
      abilities: [],
      keywords: [],
      strength: 3,
      hp: 5,
    }
    const bastion: Card = {
      id: 'bas',
      name: 'Bastión',
      type: 'ship',
      race: 'tezhal',
      cost: 0,
      rarity: 'common',
      abilities: [],
      keywords: ['bastion'],
      strength: 1,
      hp: 5,
    }
    let s = fresh({ p1Deck: [att, ...deck(30)], p2Deck: [bastion, ...deck(30)] })
    s = apply(s, { type: 'END_PHASE' }).state
    s = apply(s, { type: 'PLAY_CARD', cardId: 'att' }).state
    while (!(s.activePlayer === 'p2' && s.phase === 'despliegue')) {
      s = apply(s, { type: 'END_PHASE' }).state
    }
    s = apply(s, { type: 'PLAY_CARD', cardId: 'bas' }).state
    while (!(s.activePlayer === 'p1' && s.phase === 'combate')) {
      s = apply(s, { type: 'END_PHASE' }).state
    }
    const attackerId = s.players.p1.fleet[0]?.instanceId as string
    const before = s
    const r = apply(s, {
      type: 'DECLARE_ATTACK',
      attackerShipId: attackerId,
      target: { kind: 'homeworld', ref: 'p2' },
    })
    expect(r.state).toBe(before)
  })

  it('Desgarro: exceso pasa al mundo natal cuando el atacante mata al defensor', () => {
    const att: Card = {
      id: 'att',
      name: 'Atacante Desgarro',
      type: 'ship',
      race: 'wuron',
      cost: 0,
      rarity: 'common',
      abilities: [],
      keywords: ['desgarro'],
      strength: 5,
      hp: 5,
    }
    const def: Card = {
      id: 'def',
      name: 'Defensor débil',
      type: 'ship',
      race: 'tezhal',
      cost: 0,
      rarity: 'common',
      abilities: [],
      keywords: [],
      strength: 1,
      hp: 2,
    }
    let s = fresh({ p1Deck: [att, ...deck(30)], p2Deck: [def, ...deck(30)] })
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
    const r = apply(s, {
      type: 'DECLARE_ATTACK',
      attackerShipId: attackerId,
      target: { kind: 'ship', ref: defenderId },
    })
    // Atacante 5 fuerza vs defensor 2 hp → mata, exceso 3 al natal.
    expect(r.state.players.p2.homeworld.hp).toBe(20 - 3)
  })

  it('mundo natal a HP 0 → win por homeworld_destroyed', () => {
    // Ataque masivo via Desgarro contra defensor débil + natal a 1 hp.
    const att: Card = {
      id: 'att',
      name: 'Megacañón',
      type: 'ship',
      race: 'wuron',
      cost: 0,
      rarity: 'common',
      abilities: [],
      keywords: [],
      strength: 25,
      hp: 5,
    }
    let s = fresh({ p1Deck: [att, ...deck(30)] })
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
    expect(r.state.outcome.kind).toBe('win')
    if (r.state.outcome.kind === 'win') {
      expect(r.state.outcome.winner).toBe('p1')
      expect(r.state.outcome.reason).toBe('homeworld_destroyed')
    }
  })
})

describe('reducer — Hero', () => {
  it('DEPLOY_HERO en Edad I es no-op', () => {
    const s = fresh({ p1Hero: HERO })
    const before = s
    const r = apply(s, { type: 'DEPLOY_HERO' })
    expect(r.state).toBe(before)
  })

  it('DEPLOY_HERO en Edad II + fase Despliegue mueve hero al fleet', () => {
    let s = fresh({ p1Deck: deck(60), p2Deck: deck(60), p1Hero: HERO })
    while (s.turn < 5) s = apply(s, { type: 'END_PHASE' }).state // hasta Edad II
    while (!(s.activePlayer === 'p1' && s.phase === 'despliegue')) {
      s = apply(s, { type: 'END_PHASE' }).state
    }
    const r = apply(s, { type: 'DEPLOY_HERO' })
    expect(r.events).toContainEqual({ type: 'HERO_DEPLOYED', player: 'p1' })
    expect(r.state.players.p1.fleet.some((sh) => sh.isHero)).toBe(true)
    expect(r.state.players.p1.hero?.inHomeworld).toBe(false)
  })

  it('hero muerto en combate vuelve al mundo natal con cooldown=1', () => {
    let s = fresh({ p1Deck: deck(60), p2Deck: deck(60), p1Hero: HERO })
    // Avanzar a Edad II despliegue de p1 y desplegar al héroe.
    while (s.turn < 5) s = apply(s, { type: 'END_PHASE' }).state
    while (!(s.activePlayer === 'p1' && s.phase === 'despliegue')) {
      s = apply(s, { type: 'END_PHASE' }).state
    }
    s = apply(s, { type: 'DEPLOY_HERO' }).state
    // p2 juega un buster con suficiente fuerza para matar al hero (5 hp).
    const buster: Card = {
      id: 'bust',
      name: 'Buster',
      type: 'ship',
      race: 'tezhal',
      cost: 0,
      rarity: 'common',
      abilities: [],
      keywords: [],
      strength: 6,
      hp: 1,
    }
    while (!(s.activePlayer === 'p2' && s.phase === 'despliegue')) {
      s = apply(s, { type: 'END_PHASE' }).state
    }
    // Inyectar la carta en mano de p2 directamente (test fixture).
    s = {
      ...s,
      players: {
        ...s.players,
        p2: { ...s.players.p2, hand: [...s.players.p2.hand, buster] },
      },
    }
    s = apply(s, { type: 'PLAY_CARD', cardId: 'bust' }).state
    // p2 fase combate: ataca al héroe.
    while (!(s.activePlayer === 'p2' && s.phase === 'combate')) {
      s = apply(s, { type: 'END_PHASE' }).state
    }
    const attackerId = s.players.p2.fleet.find((sh) => sh.cardId === 'bust')?.instanceId as string
    const heroId = s.players.p1.fleet.find((sh) => sh.isHero)?.instanceId as string
    const r = apply(s, {
      type: 'DECLARE_ATTACK',
      attackerShipId: attackerId,
      target: { kind: 'ship', ref: heroId },
    })
    expect(r.events).toContainEqual({ type: 'HERO_RETURNED', player: 'p1' })
    expect(r.state.players.p1.fleet.some((sh) => sh.isHero)).toBe(false)
    expect(r.state.players.p1.hero?.inHomeworld).toBe(true)
    expect(r.state.players.p1.hero?.reactivationCooldown).toBe(1)
  })

  it('ACTIVATE_HERO_POWER cuenta hasta cap 2 por turno', () => {
    const s = fresh({ p1Hero: HERO })
    let next = apply(s, { type: 'ACTIVATE_HERO_POWER', abilityId: 'power-1' }).state
    expect(next.players.p1.hero?.powersUsedThisTurn).toBe(1)
    next = apply(next, { type: 'ACTIVATE_HERO_POWER', abilityId: 'power-1' }).state
    expect(next.players.p1.hero?.powersUsedThisTurn).toBe(2)
    const before = next
    next = apply(next, { type: 'ACTIVATE_HERO_POWER', abilityId: 'power-1' }).state
    expect(next).toBe(before) // tercera activación no cuenta
  })
})

describe('reducer — acciones diferidas a Phase 3+', () => {
  it.each<GameAction>([{ type: 'ACTIVATE_ABILITY', sourceId: 'src-1', abilityId: 'ab-1' }])(
    'acción %s no muta state ni emite eventos',
    (action) => {
      const before = fresh()
      const { state, events } = apply(before, action)
      expect(state).toBe(before)
      expect(events).toEqual([])
    },
  )
})
