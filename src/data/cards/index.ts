// Auto-loader del catálogo de cartas. Vite glob-importa todos los .json
// dentro de src/data/cards/<race>/ en build time.
//
// Uso:
//   import { ALL_CARDS, cardsByRace } from '@/data/cards'

import type { Card, Race } from '@/engine/types'

const modules = import.meta.glob<Card>('./*/*.json', { eager: true, import: 'default' })

export const ALL_CARDS: readonly Card[] = Object.values(modules).sort((a, b) => {
  if (a.race !== b.race) return a.race.localeCompare(b.race)
  return a.cost - b.cost || a.name.localeCompare(b.name)
})

export function cardsByRace(race: Race): readonly Card[] {
  return ALL_CARDS.filter((c) => c.race === race)
}

export function cardById(id: string): Card | undefined {
  return ALL_CARDS.find((c) => c.id === id)
}
