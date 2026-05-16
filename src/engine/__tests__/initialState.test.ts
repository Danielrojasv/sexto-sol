import { describe, expect, it } from 'vitest'
import { createInitialState, isInitialState, type InitConfig } from '../initialState'

const SAMPLE_DECK = Array.from({ length: 20 }, (_, i) => `TZH-${String(i + 1).padStart(3, '0')}`)
const SAMPLE_DECK_B = Array.from({ length: 20 }, (_, i) => `WUR-${String(i + 1).padStart(3, '0')}`)

function sampleConfig(overrides?: Partial<InitConfig>): InitConfig {
  return {
    seed: 42,
    modo: 'vsIA',
    deckA: { raza: 'Tezhal', cardIds: SAMPLE_DECK, heroId: 'HRO-TEZHAL' },
    deckB: { raza: 'Würon', cardIds: SAMPLE_DECK_B, heroId: 'HRO-WURON' },
    planetIdsNebulosa: ['PLN-NEB-ATQ', 'PLN-NEB-DEF', 'PLN-NEB-RIT'],
    planetIdsEstrellas: ['PLN-EST-ATQ', 'PLN-EST-DEF', 'PLN-EST-RIT'],
    ...overrides,
  }
}

describe('createInitialState', () => {
  it('produce state válido según isInitialState', () => {
    const state = createInitialState(sampleConfig())
    expect(isInitialState(state)).toBe(true)
  })

  it('atributos en 0/0/0 para ambos jugadores', () => {
    const state = createInitialState(sampleConfig())
    expect(state.players.a.atributos).toEqual({ fuerza: 0, resguardo: 0, resonancia: 0 })
    expect(state.players.b.atributos).toEqual({ fuerza: 0, resguardo: 0, resonancia: 0 })
  })

  it('héroe en estado Neutral al inicio', () => {
    const state = createInitialState(sampleConfig())
    expect(state.players.a.heroEstado).toBe('neutral')
    expect(state.players.b.heroEstado).toBe('neutral')
  })

  it('mano inicial 4 cartas, mazo restante 16 cartas', () => {
    const state = createInitialState(sampleConfig())
    expect(state.players.a.mano.length).toBe(4)
    expect(state.players.b.mano.length).toBe(4)
    expect(state.players.a.mazoRestante.length).toBe(16)
    expect(state.players.b.mazoRestante.length).toBe(16)
  })

  it('tramo nebulosa, turno 1, subPaso mulligan_inicial', () => {
    const state = createInitialState(sampleConfig())
    expect(state.tramo).toBe('nebulosa')
    expect(state.turno).toBe(1)
    expect(state.subPaso).toBe('mulligan_inicial')
  })

  it('energía 1 en turno 1', () => {
    const state = createInitialState(sampleConfig())
    expect(state.energiaActual).toBe(1)
  })

  it('eclipse no invocado, planetas asignados, historial vacío', () => {
    const state = createInitialState(sampleConfig())
    expect(state.eclipseInvocado).toBe(false)
    expect(state.poolPlanetasNebulosa).toHaveLength(3)
    expect(state.poolPlanetasEstrellas).toHaveLength(3)
    expect(state.historialPremoniciones).toEqual([])
  })

  it('determinismo: misma seed produce mismo state', () => {
    const a = createInitialState(sampleConfig({ seed: 100 }))
    const b = createInitialState(sampleConfig({ seed: 100 }))
    expect(a.players.a.mano).toEqual(b.players.a.mano)
    expect(a.players.b.mano).toEqual(b.players.b.mano)
  })

  it('seeds distintas producen barajados distintos', () => {
    const a = createInitialState(sampleConfig({ seed: 1 }))
    const b = createInitialState(sampleConfig({ seed: 2 }))
    // Es muy improbable que coincidan exactamente con seeds distintas y 16 cartas en mazo.
    const handsEqual = a.players.a.mano.join() === b.players.a.mano.join()
    expect(handsEqual).toBe(false)
  })

  it('rechaza deck con tamaño incorrecto', () => {
    expect(() =>
      createInitialState(
        sampleConfig({ deckA: { raza: 'Tezhal', cardIds: ['x'], heroId: 'HRO-TEZHAL' } }),
      ),
    ).toThrow(/20 cartas/)
  })

  it('rechaza pool de planetas con tamaño incorrecto', () => {
    expect(() =>
      createInitialState(sampleConfig({ planetIdsNebulosa: ['solo-1'] })),
    ).toThrow(/3 elementos/)
  })
})
