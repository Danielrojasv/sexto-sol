// Tests del renderer i18n. Cada primitive tiene ≥1 caso simple.
// Composiciones: ≥3 casos.

import { describe, expect, it } from 'vitest'
import { renderAbility, renderEffect } from '../abilityRenderer'
import type { Ability, Effect } from '../primitives/spec'

const ab = (over: Partial<Ability> & { effect: Effect }): Ability => ({
  trigger: { kind: 'on_play' },
  category: 'initiative',
  ...over,
})

describe('renderAbility — triggers', () => {
  it('on_play', () => {
    const txt = renderAbility(ab({ effect: { op: 'noop' }, trigger: { kind: 'on_play' } }))
    expect(txt).toContain('Cuando entra en juego')
  })

  it('on_destroy', () => {
    const txt = renderAbility(ab({ effect: { op: 'noop' }, trigger: { kind: 'on_destroy' } }))
    expect(txt).toContain('Cuando es destruida')
  })

  it('on_event ship_damaged', () => {
    const txt = renderAbility(
      ab({
        effect: { op: 'noop' },
        trigger: { kind: 'on_event', event: 'ship_damaged' },
      }),
    )
    expect(txt).toContain('Cuando recibe daño')
  })

  it('continuous', () => {
    const txt = renderAbility(ab({ effect: { op: 'noop' }, trigger: { kind: 'continuous' } }))
    expect(txt).toContain('Mientras esté en juego')
  })

  it('activated con costo de energía', () => {
    const txt = renderAbility(
      ab({
        effect: { op: 'noop' },
        trigger: { kind: 'activated', window: 'vigilia', cost: { energy: 2 } },
      }),
    )
    expect(txt).toContain('Vigilia')
    expect(txt).toContain('2 energía')
  })

  it('description override toma precedencia', () => {
    const txt = renderAbility({
      trigger: { kind: 'on_play' },
      category: 'initiative',
      effect: { op: 'noop' },
      description: 'Texto custom de la carta.',
    })
    expect(txt).toBe('Texto custom de la carta.')
  })
})

describe('renderEffect — primitives', () => {
  it('noop', () => {
    expect(renderEffect({ op: 'noop' })).toBe('')
  })

  it('damage a un target chosen', () => {
    expect(
      renderEffect({
        op: 'damage',
        target: { kind: 'chosen_ship' },
        amount: 3,
      }),
    ).toContain('3 daño')
  })

  it('damage_homeworld', () => {
    expect(
      renderEffect({ op: 'damage_homeworld', player: 'opponent', amount: 4 }),
    ).toContain('4 daño al mundo natal enemigo')
  })

  it('destroy', () => {
    expect(renderEffect({ op: 'destroy', target: { kind: 'chosen_ship' } })).toContain('destruye')
  })

  it('exile', () => {
    expect(renderEffect({ op: 'exile', target: { kind: 'self' } })).toContain('exilia')
  })

  it('bounce_to_hand', () => {
    expect(renderEffect({ op: 'bounce_to_hand', target: { kind: 'chosen_ship' } })).toContain(
      'mano de su dueño',
    )
  })

  it('shuffle_to_deck', () => {
    expect(
      renderEffect({ op: 'shuffle_to_deck', target: { kind: 'self' }, owner: 'self' }),
    ).toContain('mezcla')
  })

  it('draw plural', () => {
    expect(renderEffect({ op: 'draw', player: 'self', n: 2 })).toContain('2 cartas')
  })

  it('draw singular', () => {
    expect(renderEffect({ op: 'draw', player: 'self', n: 1 })).toContain('1 carta')
  })

  it('discard al azar', () => {
    expect(
      renderEffect({ op: 'discard', target: 'opponent', n: 2, selection: 'random' }),
    ).toContain('al azar')
  })

  it('mill', () => {
    expect(renderEffect({ op: 'mill', player: 'opponent', n: 3 })).toContain('3 cartas')
  })

  it('search', () => {
    expect(
      renderEffect({
        op: 'search',
        owner: 'self',
        zone: 'deck',
        filter: { cardType: 'tech' },
        count: 1,
        destination: 'hand',
      }),
    ).toContain('busca')
  })

  it('modify_strength delta positivo', () => {
    expect(
      renderEffect({
        op: 'modify_strength',
        target: { kind: 'self' },
        kind: 'delta',
        value: 1,
        duration: 'permanent',
      }),
    ).toContain('gana 1 a la fuerza')
  })

  it('modify_strength set', () => {
    expect(
      renderEffect({
        op: 'modify_strength',
        target: { kind: 'self' },
        kind: 'set',
        value: 5,
        duration: 'end_of_turn',
      }),
    ).toContain('pasa a tener 5 de fuerza')
  })

  it('modify_hp delta', () => {
    expect(
      renderEffect({
        op: 'modify_hp',
        target: { kind: 'self' },
        kind: 'delta',
        value: 2,
        duration: 'permanent',
      }),
    ).toContain('2 HP')
  })

  it('grant_keyword', () => {
    expect(
      renderEffect({
        op: 'grant_keyword',
        target: { kind: 'self' },
        keyword: 'bastion',
        duration: 'permanent',
      }),
    ).toContain('Bastion')
  })

  it('remove_ability', () => {
    expect(
      renderEffect({
        op: 'remove_ability',
        target: { kind: 'chosen_ship' },
        duration: 'end_of_turn',
      }),
    ).toContain('pierde sus habilidades')
  })

  it('generate_energy', () => {
    expect(
      renderEffect({ op: 'generate_energy', player: 'self', n: 2, duration: 'this_turn' }),
    ).toContain('2 energía')
  })

  it('sacrifice', () => {
    expect(renderEffect({ op: 'sacrifice', target: { kind: 'self' } })).toContain('sacrifica')
  })

  it('prevent_damage', () => {
    expect(
      renderEffect({
        op: 'prevent_damage',
        target: { kind: 'self' },
        amount: 3,
        duration: 'this_turn',
      }),
    ).toContain('3 de daño')
  })
})

describe('renderEffect — conditions (vía conditional)', () => {
  it('always', () => {
    expect(
      renderEffect({
        op: 'conditional',
        condition: { kind: 'always' },
        thenEffect: { op: 'noop' },
      }),
    ).toContain('si siempre')
  })

  it('in_age_gte', () => {
    expect(
      renderEffect({
        op: 'conditional',
        condition: { kind: 'in_age_gte', age: 2 },
        thenEffect: { op: 'noop' },
      }),
    ).toContain('II o posterior')
  })

  it('count_filter gte', () => {
    expect(
      renderEffect({
        op: 'conditional',
        condition: {
          kind: 'count_filter',
          filter: { controller: 'self' },
          op: 'gte',
          value: 3,
        },
        thenEffect: { op: 'noop' },
      }),
    ).toContain('≥ 3')
  })

  it('count_filter lte', () => {
    expect(
      renderEffect({
        op: 'conditional',
        condition: {
          kind: 'count_filter',
          filter: { race: 'wuron' },
          op: 'lte',
          value: 1,
        },
        thenEffect: { op: 'noop' },
      }),
    ).toContain('≤ 1')
  })

  it('count_filter eq', () => {
    expect(
      renderEffect({
        op: 'conditional',
        condition: {
          kind: 'count_filter',
          filter: {},
          op: 'eq',
          value: 0,
        },
        thenEffect: { op: 'noop' },
      }),
    ).toContain('= 0')
  })

  it('self_has_keyword', () => {
    expect(
      renderEffect({
        op: 'conditional',
        condition: { kind: 'self_has_keyword', keyword: 'desgarro' },
        thenEffect: { op: 'noop' },
      }),
    ).toContain('Desgarro')
  })

  it('controller_energy_gte', () => {
    expect(
      renderEffect({
        op: 'conditional',
        condition: { kind: 'controller_energy_gte', value: 3 },
        thenEffect: { op: 'noop' },
      }),
    ).toContain('≥ 3 energía')
  })
})

describe('renderEffect — targets', () => {
  it('all_ships sin filter', () => {
    expect(renderEffect({ op: 'destroy', target: { kind: 'all_ships' } })).toContain('todas las naves')
  })

  it('homeworld self', () => {
    expect(
      renderEffect({ op: 'damage', target: { kind: 'homeworld', player: 'self' }, amount: 1 }),
    ).toContain('mundo natal propio')
  })

  it('opponent target', () => {
    expect(renderEffect({ op: 'destroy', target: { kind: 'opponent' } })).toContain('oponente')
  })

  it('controller target', () => {
    expect(renderEffect({ op: 'destroy', target: { kind: 'controller' } })).toContain('controlador')
  })

  it('chosen_ship con filter completo', () => {
    expect(
      renderEffect({
        op: 'destroy',
        target: {
          kind: 'chosen_ship',
          filter: {
            controller: 'opponent',
            race: 'tezhal',
            keywordsAny: ['bastion'],
            keywordsAll: ['vuelo'],
            costLte: 3,
            costGte: 1,
          },
        },
      }),
    ).toMatch(/enemiga.*Tezhal/)
  })
})

describe('renderEffect — composition', () => {
  it('sequence concatena con punto y coma', () => {
    expect(
      renderEffect({
        op: 'sequence',
        effects: [
          { op: 'draw', player: 'self', n: 1 },
          {
            op: 'modify_strength',
            target: { kind: 'self' },
            kind: 'delta',
            value: 1,
            duration: 'permanent',
          },
        ],
      }),
    ).toMatch(/;/)
  })

  it('conditional renderiza if/else', () => {
    expect(
      renderEffect({
        op: 'conditional',
        condition: { kind: 'in_age', age: 3 },
        thenEffect: { op: 'damage_homeworld', player: 'opponent', amount: 5 },
        elseEffect: { op: 'draw', player: 'self', n: 1 },
      }),
    ).toContain('si es Edad III')
  })

  it('for_each menciona "por cada"', () => {
    expect(
      renderEffect({
        op: 'for_each',
        filter: { controller: 'opponent' },
        effect: {
          op: 'modify_strength',
          target: { kind: 'self' },
          kind: 'delta',
          value: 1,
          duration: 'permanent',
        },
      }),
    ).toContain('por cada')
  })
})

describe('renderAbility — flujo completo', () => {
  it('Külen-style ability', () => {
    const txt = renderAbility({
      trigger: { kind: 'on_event', event: 'ship_damaged' },
      category: 'reactive',
      effect: {
        op: 'modify_strength',
        target: { kind: 'self' },
        kind: 'delta',
        value: 1,
        duration: 'permanent',
      },
    })
    expect(txt).toContain('Cuando recibe daño')
    expect(txt).toContain('gana 1 a la fuerza')
    expect(txt).toMatch(/\.$/)
  })
})
