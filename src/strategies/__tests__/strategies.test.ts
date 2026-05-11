import { describe, expect, it } from 'vitest'
import { STRATEGIES, strategyFor } from '..'
import type { Race, MechanicCategory } from '@/engine/types'

const ALL_RACES: readonly Race[] = ['quralan', 'wuron', 'tezhal', 'zaqe']

const EXPECTED_CATEGORY: Record<Race, MechanicCategory> = {
  wuron: 'reactive',
  tezhal: 'initiative',
  quralan: 'accumulative',
  zaqe: 'post_combat',
}

const EXPECTED_KEYWORD: Record<Race, string> = {
  wuron: 'kulen',
  tezhal: 'ignicion',
  quralan: 'formacion_solar',
  zaqe: 'refluencia',
}

describe('strategies — contrato Phase 1', () => {
  it.each(ALL_RACES)('%s tiene la categoría firma esperada', (race) => {
    expect(strategyFor(race).category).toBe(EXPECTED_CATEGORY[race])
  })

  it.each(ALL_RACES)('%s tiene el keyword firma esperado', (race) => {
    expect(strategyFor(race).signatureKeyword).toBe(EXPECTED_KEYWORD[race])
  })

  it.each(ALL_RACES)('%s.registerKeywords() devuelve [] en Phase 1', (race) => {
    expect(strategyFor(race).registerKeywords()).toEqual([])
  })

  it.each(ALL_RACES)('%s.registerPassives() devuelve [] en Phase 1', (race) => {
    expect(strategyFor(race).registerPassives()).toEqual([])
  })

  it.each(ALL_RACES)('%s arranca con starting deck vacío (Phase 3 lo poblará)', (race) => {
    const s = strategyFor(race)
    expect(s.startingDeck).toEqual([])
  })

  it('STRATEGIES expone las 4 razas con keys exactos', () => {
    expect(Object.keys(STRATEGIES).sort()).toEqual([...ALL_RACES].sort())
  })

  it('todas las categorías firma son únicas (counter wheel emergente)', () => {
    const cats = ALL_RACES.map((r) => strategyFor(r).category)
    expect(new Set(cats).size).toBe(4)
  })
})
