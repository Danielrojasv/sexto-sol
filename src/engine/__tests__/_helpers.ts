// Helpers de tests para Sexto Sol v4.2.
//
// Factories para crear card mocks + planet mocks + ReducerDeps + InitConfig.
// v4.2: cartas tienen `penalizacionAcierto` top-level + condicionales sobre estado del juego.

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
  penalizacionAcierto?: number
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
    penalizacionAcierto: opts.penalizacionAcierto ?? 1,
    rareza: 'comun',
    condicionales: opts.condicionales ?? [],
    flavor: 'mock flavor',
  }
}

export function mockPlanet(opts: {
  id?: string
  tramo?: 'Nebulosa' | 'Estrellas'
  categoria?: Categoria
}): CardPlanetDef {
  return {
    id:
      opts.id ??
      `PLN-${(opts.tramo ?? 'Nebulosa').slice(0, 3).toUpperCase()}-${(opts.categoria ?? 'Ataque').slice(0, 3).toUpperCase()}`,
    nombre: 'Mock Planet',
    tramo: opts.tramo ?? 'Nebulosa',
    categoria: opts.categoria ?? 'Ataque',
    flavor: 'mock planet flavor',
    efectoEspecial: null,
  }
}

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

export function mockDeckOf20(card: CardActionDef): string[] {
  return Array.from({ length: 20 }, () => card.id)
}

export function mixedDeck(cardA: CardActionDef, cardB: CardActionDef): string[] {
  return [...Array(10).fill(cardA.id), ...Array(10).fill(cardB.id)]
}
