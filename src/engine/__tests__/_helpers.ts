// Helpers de tests para Sexto Sol v4.1.
//
// Factories para crear card mocks + planet mocks + ReducerDeps + InitConfig.
// Mantiene los tests aislados del loader real (que requiere import.meta.glob).

import type {
  CardActionDef,
  CardPlanetDef,
  Categoria,
  Condicional,
} from '../types'
import type { ReducerDeps } from '../reducer'

let mockCardCounter = 0

export function mockCard(opts: {
  id?: string
  raza?: 'Tezhal' | 'Würon'
  categoria?: Categoria
  coste?: number
  fuerzaBase?: number
  condicionales?: Condicional[]
}): CardActionDef {
  mockCardCounter++
  return {
    id: opts.id ?? `MOCK-${String(mockCardCounter).padStart(4, '0')}`,
    nombre: 'Mock Card',
    raza: opts.raza ?? 'Tezhal',
    categoria: opts.categoria ?? 'Ataque',
    coste: opts.coste ?? 1,
    fuerzaBase: opts.fuerzaBase ?? 2,
    rareza: 'comun',
    condicionales: opts.condicionales ?? [
      { tipo: 'premonicion_propia', valor: 'Ataque', fuerzaDelta: 1 },
    ],
    flavor: 'mock flavor',
  }
}

export function mockPlanet(opts: {
  id?: string
  tramo?: 'Nebulosa' | 'Estrellas'
  categoria?: Categoria
}): CardPlanetDef {
  return {
    id: opts.id ?? `PLN-${(opts.tramo ?? 'Nebulosa').slice(0, 3).toUpperCase()}-${(opts.categoria ?? 'Ataque').slice(0, 3).toUpperCase()}`,
    nombre: 'Mock Planet',
    tramo: opts.tramo ?? 'Nebulosa',
    categoria: opts.categoria ?? 'Ataque',
    flavor: 'mock planet flavor',
    efectoEspecial: null,
  }
}

/** ReducerDeps con un set de cartas conocidas + 6 planetas estándar (3+3). */
export function mockDeps(cards: CardActionDef[]): ReducerDeps {
  const cardMap = new Map<string, CardActionDef>()
  for (const c of cards) cardMap.set(c.id, c)

  const planets = [
    mockPlanet({ id: 'PLN-NEB-ATQ', tramo: 'Nebulosa', categoria: 'Ataque' }),
    mockPlanet({ id: 'PLN-NEB-DEF', tramo: 'Nebulosa', categoria: 'Defensa' }),
    mockPlanet({ id: 'PLN-NEB-RIT', tramo: 'Nebulosa', categoria: 'Ritual' }),
    mockPlanet({ id: 'PLN-EST-ATQ', tramo: 'Estrellas', categoria: 'Ataque' }),
    mockPlanet({ id: 'PLN-EST-DEF', tramo: 'Estrellas', categoria: 'Defensa' }),
    mockPlanet({ id: 'PLN-EST-RIT', tramo: 'Estrellas', categoria: 'Ritual' }),
  ]
  const planetMap = new Map<string, CardPlanetDef>()
  for (const p of planets) planetMap.set(p.id, p)
  return { cards: cardMap, planets: planetMap }
}

/** Mazo de 20 cartas mockeadas (repetidas para llegar a 20). */
export function mockDeckOf20(card: CardActionDef): string[] {
  return Array.from({ length: 20 }, () => card.id)
}

/** Mazo de 20 cartas mixtas: 10 de cardA + 10 de cardB. */
export function mixedDeck(cardA: CardActionDef, cardB: CardActionDef): string[] {
  return [...Array(10).fill(cardA.id), ...Array(10).fill(cardB.id)]
}
