// Tests del validator. Cada regla se ejercita con cartas mock que pasan/fallan.

import { describe, expect, it } from 'vitest'
import { validateCard } from '../validate-cards'
import type { Card } from '@/engine/types'

function vanilla(over: Partial<Card> = {}): Card {
  return {
    id: 'wuron_test',
    name: 'Carta Test',
    race: 'wuron',
    type: 'ship',
    cost: 2,
    rarity: 'common',
    keywords: [],
    abilities: [],
    strength: 2,
    hp: 3,
    ...over,
  }
}

describe('validateCard — stat curve', () => {
  it('vanilla 2/3 a costo 2 pasa (2+3=5, 5/2.5=2)', () => {
    const issues = validateCard(vanilla({ strength: 2, hp: 3, cost: 2 }))
    expect(issues.filter((i) => i.rule === 'stat_curve.deviation')).toHaveLength(0)
  })

  it('overstats: 5/5 a costo 0 falla curva', () => {
    const issues = validateCard(vanilla({ strength: 5, hp: 5, cost: 0 }))
    expect(issues.find((i) => i.rule === 'stat_curve.deviation')).toBeTruthy()
  })

  it('keyword bastion descuenta 1 hp del costo', () => {
    // 2/4 con bastion: stats efectivos = 2+4-1 = 5; cost esperado floor(5/2.5)=2
    const issues = validateCard(
      vanilla({ strength: 2, hp: 4, keywords: ['bastion'], cost: 2 }),
    )
    expect(issues.filter((i) => i.rule === 'stat_curve.deviation')).toHaveLength(0)
  })

  it('keyword desgarro descuenta 1 strength del costo', () => {
    // 4/2 con desgarro: stats efectivos = 4+2-1 = 5; cost esperado floor(5/2.5)=2
    const issues = validateCard(
      vanilla({ strength: 4, hp: 2, keywords: ['desgarro'], cost: 2 }),
    )
    expect(issues.filter((i) => i.rule === 'stat_curve.deviation')).toHaveLength(0)
  })

  it('on_play ability descuenta 1 stat', () => {
    // 3/3 con on_play: stats = 3+3-1 = 5; cost esperado 2
    const issues = validateCard(
      vanilla({
        strength: 3,
        hp: 3,
        cost: 2,
        abilities: [
          {
            trigger: { kind: 'on_play' },
            category: 'reactive',
            effect: { op: 'noop' },
          },
        ],
      }),
    )
    expect(issues.filter((i) => i.rule === 'stat_curve.deviation')).toHaveLength(0)
  })

  it('continuous ability descuenta 2 stats', () => {
    // 3/3 con continuous: stats = 3+3-2 = 4; cost esperado 1
    const issues = validateCard(
      vanilla({
        strength: 3,
        hp: 3,
        cost: 1,
        abilities: [
          {
            trigger: { kind: 'continuous' },
            category: 'reactive',
            effect: { op: 'noop' },
          },
        ],
      }),
    )
    expect(issues.filter((i) => i.rule === 'stat_curve.deviation')).toHaveLength(0)
  })

  it('non-ship cards no chequean stat curve', () => {
    const issues = validateCard(
      vanilla({ id: 'wuron_tech', type: 'tech', strength: undefined, hp: undefined, cost: 1 }),
    )
    expect(issues.filter((i) => i.rule === 'stat_curve.deviation')).toHaveLength(0)
  })

  it('ship sin strength/hp es error', () => {
    const issues = validateCard(vanilla({ strength: undefined, hp: undefined }))
    expect(issues.find((i) => i.rule === 'stat_curve.required')).toBeTruthy()
  })
})

describe('validateCard — mechanic firma off-category', () => {
  it('Würon con ability initiative warn (firma es reactive)', () => {
    const issues = validateCard(
      vanilla({
        race: 'wuron',
        abilities: [
          { trigger: { kind: 'on_play' }, category: 'initiative', effect: { op: 'noop' } },
        ],
      }),
    )
    expect(issues.find((i) => i.rule === 'mechanic_category.off_signature')).toBeTruthy()
  })

  it('flag intentionalOffCategory suprime el warn', () => {
    const issues = validateCard(
      vanilla({
        race: 'wuron',
        intentionalOffCategory: true,
        abilities: [
          { trigger: { kind: 'on_play' }, category: 'initiative', effect: { op: 'noop' } },
        ],
      }),
    )
    expect(issues.filter((i) => i.rule === 'mechanic_category.off_signature')).toHaveLength(0)
  })

  it('Q\'ralan con ability accumulative no warn (es la firma)', () => {
    const issues = validateCard(
      vanilla({
        id: 'quralan_test',
        race: 'quralan',
        abilities: [
          { trigger: { kind: 'continuous' }, category: 'accumulative', effect: { op: 'noop' } },
        ],
      }),
    )
    expect(issues.filter((i) => i.rule === 'mechanic_category.off_signature')).toHaveLength(0)
  })
})

describe('validateCard — naming blocklist', () => {
  it('nombre con deidad activa (Inti) → error', () => {
    const issues = validateCard(vanilla({ name: 'Inti del Sol' }))
    expect(issues.find((i) => i.rule === 'naming.blocklist')).toBeTruthy()
  })

  it('nombre con líder histórico (Lautaro) → error', () => {
    const issues = validateCard(vanilla({ name: 'Lautaro del Sur' }))
    expect(issues.find((i) => i.rule === 'naming.blocklist')).toBeTruthy()
  })

  it('nombre con pueblo eco (Mapuche) → error', () => {
    const issues = validateCard(vanilla({ name: 'Guerrero Mapuche' }))
    expect(issues.find((i) => i.rule === 'naming.blocklist')).toBeTruthy()
  })

  it('nombre inventado válido → sin error de naming', () => {
    const issues = validateCard(vanilla({ name: 'Lhüpang del Brote' }))
    expect(issues.filter((i) => i.rule === 'naming.blocklist')).toHaveLength(0)
  })

  it('match es case-insensitive', () => {
    const issues = validateCard(vanilla({ name: 'INTI del Cosmos' }))
    expect(issues.find((i) => i.rule === 'naming.blocklist')).toBeTruthy()
  })
})

describe('validateCard — id race prefix', () => {
  it('id sin prefix de raza → warn', () => {
    const issues = validateCard(vanilla({ id: 'random_id', race: 'wuron' }))
    expect(issues.find((i) => i.rule === 'id.race_prefix')).toBeTruthy()
  })

  it('id correcto wuron_xxx → sin warn', () => {
    const issues = validateCard(vanilla({ id: 'wuron_explorador', race: 'wuron' }))
    expect(issues.filter((i) => i.rule === 'id.race_prefix')).toHaveLength(0)
  })
})

describe('validateCard — premonition soft cap', () => {
  it('carta con premonition emite info', () => {
    const issues = validateCard(
      vanilla({
        abilities: [
          {
            trigger: { kind: 'on_play' },
            category: 'reactive',
            premonition: true,
            effect: { op: 'noop' },
          },
        ],
      }),
    )
    expect(issues.find((i) => i.rule === 'premonition.usage')).toBeTruthy()
    expect(issues.find((i) => i.rule === 'premonition.usage')?.severity).toBe('info')
  })

  it('carta sin premonition no emite info', () => {
    const issues = validateCard(vanilla())
    expect(issues.filter((i) => i.rule === 'premonition.usage')).toHaveLength(0)
  })
})

// v3.0.1 — schema-only acceptance of new primitives. Engine impl pending Phase 1.
describe('validateCard — v3.0.1 DSL extensions accepted', () => {
  it('accepts ship_attacked event in trigger', () => {
    const issues = validateCard(
      vanilla({
        type: 'event',
        cost: 2,
        strength: undefined,
        hp: undefined,
        abilities: [
          {
            trigger: { kind: 'on_event', event: 'ship_attacked' },
            category: 'reactive',
            effect: { op: 'damage', target: { kind: 'attacker' }, amount: 2 },
          },
        ],
      }),
    )
    expect(issues.filter((i) => i.rule.startsWith('schema'))).toHaveLength(0)
  })

  it('accepts attacker target', () => {
    const issues = validateCard(
      vanilla({
        type: 'event',
        cost: 2,
        strength: undefined,
        hp: undefined,
        abilities: [
          {
            trigger: { kind: 'on_play' },
            category: 'reactive',
            effect: { op: 'damage', target: { kind: 'attacker' }, amount: 2 },
          },
        ],
      }),
    )
    expect(issues.filter((i) => i.rule.startsWith('schema'))).toHaveLength(0)
  })

  it('accepts wasDamagedThisTurn in ShipFilter', () => {
    const issues = validateCard(
      vanilla({
        type: 'event',
        cost: 1,
        strength: undefined,
        hp: undefined,
        abilities: [
          {
            trigger: { kind: 'on_play' },
            category: 'reactive',
            effect: {
              op: 'modify_strength',
              target: {
                kind: 'chosen_ship',
                filter: { controller: 'self', wasDamagedThisTurn: true },
              },
              kind: 'delta',
              value: 1,
              duration: 'permanent',
            },
          },
        ],
      }),
    )
    expect(issues.filter((i) => i.rule.startsWith('schema'))).toHaveLength(0)
  })

  it('accepts modify_hp kind set_to_max', () => {
    const issues = validateCard(
      vanilla({
        type: 'tech',
        cost: 2,
        strength: undefined,
        hp: undefined,
        abilities: [
          {
            trigger: { kind: 'on_play' },
            category: 'reactive',
            effect: {
              op: 'modify_hp',
              target: { kind: 'chosen_ship', filter: { controller: 'self' } },
              kind: 'set_to_max',
              value: 0,
              duration: 'permanent',
            },
          },
        ],
      }),
    )
    expect(issues.filter((i) => i.rule.startsWith('schema'))).toHaveLength(0)
  })

  it('accepts keyword_amplifier effect', () => {
    const issues = validateCard(
      vanilla({
        type: 'relic',
        cost: 4,
        strength: undefined,
        hp: undefined,
        abilities: [
          {
            trigger: { kind: 'continuous' },
            category: 'reactive',
            effect: { op: 'keyword_amplifier', keyword: 'kulen', deltaBonus: 1 },
          },
        ],
      }),
    )
    expect(issues.filter((i) => i.rule.startsWith('schema'))).toHaveLength(0)
  })
})
