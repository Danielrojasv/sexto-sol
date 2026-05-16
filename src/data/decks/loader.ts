// Loader de mazos canónicos v4.1 desde YAML en docs/playtest/decks-v4.1/.
//
// Formato esperado:
//   deck:
//     name: "..."
//     race: "Tezhal" | "Würon"
//     hero: "HRO-TEZHAL" | "HRO-WURON"
//     archetype: "..."
//     win_plan: "..."
//     weakness: "..."
//     cards:
//       - { id: "TZH-001", copies: 2 }
//       - ...
//
// Output: CanonicalDeck con cardIds expandidos (20 elementos, con duplicados según copies).

import { parse as parseYaml } from 'yaml'
import type { Raza } from '@/engine/types'
import { POOL_REGISTRY } from '@/data/cards/loader'

export interface CanonicalDeck {
  /** ID derivado del nombre de archivo (ej: "tezhal-aggro"). */
  id: string
  name: string
  race: Raza
  /** ID del héroe (usado solo informativamente; las habilidades se resuelven por raza). */
  heroId: string
  archetype: string
  winPlan: string
  weakness: string
  /** Card IDs expandidos con copies (20 elementos). */
  cardIds: string[]
}

interface RawDeckFile {
  deck?: {
    name?: string
    race?: string
    hero?: string
    archetype?: string
    win_plan?: string
    weakness?: string
    cards?: Array<{ id: string; copies: number }>
  }
}

const MAZO_SIZE = 20
const MAX_COPIES = 2

const allDeckYamlRaw = import.meta.glob('/docs/playtest/decks-v4.1/*.yaml', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

function loadCanonicalDecksImpl(): readonly CanonicalDeck[] {
  const decks: CanonicalDeck[] = []
  for (const [path, rawContent] of Object.entries(allDeckYamlRaw)) {
    const parsed = parseYaml(rawContent) as RawDeckFile
    if (!parsed?.deck) continue
    const { deck } = parsed
    if (!deck.name || !deck.race || !deck.cards || !deck.hero) {
      throw new Error(`Deck ${path}: faltan campos obligatorios (name/race/hero/cards)`)
    }
    if (deck.race !== 'Tezhal' && deck.race !== 'Würon') {
      throw new Error(`Deck ${path}: raza inválida ${deck.race}`)
    }
    const id = derivIdFromPath(path)
    const cardIds: string[] = []
    for (const entry of deck.cards) {
      if (!entry.id || typeof entry.copies !== 'number') {
        throw new Error(`Deck ${id}: entry inválida ${JSON.stringify(entry)}`)
      }
      if (entry.copies > MAX_COPIES) {
        throw new Error(
          `Deck ${id}: ${entry.id} tiene ${entry.copies} copies (max ${MAX_COPIES})`,
        )
      }
      if (!POOL_REGISTRY.cards.has(entry.id)) {
        throw new Error(`Deck ${id}: card ${entry.id} no existe en el registry`)
      }
      for (let i = 0; i < entry.copies; i++) {
        cardIds.push(entry.id)
      }
    }
    if (cardIds.length !== MAZO_SIZE) {
      throw new Error(`Deck ${id}: tiene ${cardIds.length} cartas (esperado ${MAZO_SIZE})`)
    }
    decks.push({
      id,
      name: deck.name,
      race: deck.race as Raza,
      heroId: deck.hero,
      archetype: deck.archetype ?? '',
      winPlan: deck.win_plan ?? '',
      weakness: deck.weakness ?? '',
      cardIds,
    })
  }
  return decks
}

function derivIdFromPath(path: string): string {
  // path: "/docs/playtest/decks-v4.1/tezhal-aggro.yaml"
  const parts = path.split('/')
  const file = parts[parts.length - 1]?.replace(/\.yaml$/, '') ?? 'unknown'
  return file
}

/** Lista cacheada de los mazos canónicos v4.1. */
export const CANONICAL_DECKS: readonly CanonicalDeck[] = loadCanonicalDecksImpl()

export function deckById(id: string): CanonicalDeck | undefined {
  return CANONICAL_DECKS.find((d) => d.id === id)
}

/** Mazos representativos por raza para el HomeView (2 opciones por raza). */
export function decksByRaza(raza: Raza): CanonicalDeck[] {
  return CANONICAL_DECKS.filter((d) => d.race === raza)
}
