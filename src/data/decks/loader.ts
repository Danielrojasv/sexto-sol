// Loader de mazos canónicos desde YAML en docs/playtest/decks/.
//
// Los YAMLs los genera el deck-builder agent (SPEC 2). Tienen el formato:
//
//   deck:
//     name: "..."
//     race: "..."
//     archetype: "..."
//     variant: "..."
//     cards:
//       - { name: "Lhüpang del Río", count: 3 }
//       - { name: "...", count: N }
//
// Las cartas se referencian por NAME (no por id), así que el loader resuelve
// name → Card consultando ALL_CARDS. Si una card no se encuentra, error.
//
// Vite bundlea los YAMLs en build time via import.meta.glob.

import { parse as parseYaml } from 'yaml'
import { ALL_CARDS } from '@/data/cards'
import type { Card, Race } from '@/engine/types'

/** Mazo canónico cargado desde YAML, ya resuelto a Card[]. */
export interface CanonicalDeck {
  /** ID derivado del path del YAML (ej: "wuron/midrange-tank"). */
  id: string
  /** Nombre display del mazo (campo `deck.name`). */
  name: string
  race: Race
  archetype: string
  variant: string
  /** Cartas resueltas: tarjeta + count. La lista plana de cartas se construye
   *  via `flattenDeck()`. */
  cards: ReadonlyArray<{ card: Card; count: number }>
}

interface RawDeck {
  deck?: {
    name?: string
    race?: string
    archetype?: string
    variant?: string
    cards?: Array<{ name: string; count: number }>
  }
}

/**
 * Carga todos los mazos YAML de docs/playtest/decks/ — sync, Vite resuelve
 * el glob en build time. Cache en module-level vía CANONICAL_DECKS const.
 */
function loadCanonicalDecksImpl(): readonly CanonicalDeck[] {
  const modules = import.meta.glob('/docs/playtest/decks/*/*.yaml', {
    eager: true,
    query: '?raw',
    import: 'default',
  })
  const cardByName = new Map<string, Card>(ALL_CARDS.map((c) => [c.name, c]))
  const decks: CanonicalDeck[] = []
  for (const [path, rawContent] of Object.entries(modules)) {
    const yamlText = rawContent as string
    const parsed = parseYaml(yamlText) as RawDeck
    if (!parsed?.deck) continue
    const { deck } = parsed
    if (!deck.race || !deck.name || !deck.cards) continue
    const id = derivIdFromPath(path)
    const cards: { card: Card; count: number }[] = []
    for (const entry of deck.cards) {
      const card = cardByName.get(entry.name)
      if (!card) {
        throw new Error(
          `[deckLoader] Carta no encontrada en catálogo: "${entry.name}" (mazo ${id})`,
        )
      }
      cards.push({ card, count: entry.count })
    }
    validateDeckLegality(id, cards)
    decks.push({
      id,
      name: deck.name,
      race: deck.race as Race,
      archetype: deck.archetype ?? 'unknown',
      variant: deck.variant ?? 'unknown',
      cards,
    })
  }
  return decks
}

/** Lista cacheada de los mazos canónicos. Evaluada una vez al cargar el módulo. */
export const CANONICAL_DECKS: readonly CanonicalDeck[] = loadCanonicalDecksImpl()

/**
 * Promise wrapper de la lista cacheada. Mantenido para compatibilidad con
 * APIs async (ej: futuro backend Phase 6). El resolve es inmediato.
 */
export function loadCanonicalDecks(): Promise<readonly CanonicalDeck[]> {
  return Promise.resolve(CANONICAL_DECKS)
}

/**
 * Aplana un CanonicalDeck a array flat de Cards repitiendo cada entrada
 * `count` veces. Usado por el engine como `p1Deck` / `p2Deck`.
 */
export function flattenDeck(deck: CanonicalDeck): Card[] {
  const flat: Card[] = []
  for (const { card, count } of deck.cards) {
    for (let i = 0; i < count; i++) flat.push(card)
  }
  return flat
}

/**
 * Validación de legalidad básica del set base v3.0:
 *   - Total 30 cartas.
 *   - Max 3 copias por carta common/rare; max 1 por legendary.
 *
 * Lanza error con detalle si algo falla.
 */
function validateDeckLegality(
  deckId: string,
  cards: readonly { card: Card; count: number }[],
): void {
  const total = cards.reduce((sum, c) => sum + c.count, 0)
  if (total !== 30) {
    throw new Error(`[deckLoader] Mazo ${deckId} tiene ${total} cartas (esperado 30)`)
  }
  for (const { card, count } of cards) {
    const max = card.rarity === 'legendary' ? 1 : 3
    if (count > max) {
      throw new Error(
        `[deckLoader] Mazo ${deckId}: "${card.name}" (${card.rarity}) tiene ${count} copias (max ${max})`,
      )
    }
  }
}

function derivIdFromPath(path: string): string {
  // path: "/docs/playtest/decks/wuron/wuron-midrange-tank.yaml"
  const parts = path.split('/')
  const file = parts[parts.length - 1]?.replace(/\.yaml$/, '') ?? 'unknown'
  const race = parts[parts.length - 2] ?? 'unknown'
  return `${race}/${file}`
}

/** Mazos representativos por raza para el MVP UI (uno por raza, el más estándar). */
export const REPRESENTATIVE_DECK_IDS: Readonly<Record<Race, string>> = {
  wuron: 'wuron/wuron-midrange-tank',
  tezhal: 'tezhal/tezhal-full-aggro',
  quralan: 'quralan/qralan-masa-pura',
  zaqe: 'zaqe/zaqe-long-game-pure',
}

/**
 * Conveniencia: filtra a los 4 mazos representativos del MVP. Los restantes
 * 8 siguen accesibles via loadCanonicalDecks() pero no se exponen en UI hasta
 * que se haga deck-builder visual.
 */
export function pickRepresentativeDecks(
  all: readonly CanonicalDeck[],
): Readonly<Record<Race, CanonicalDeck | undefined>> {
  return {
    wuron: all.find((d) => d.id === REPRESENTATIVE_DECK_IDS.wuron),
    tezhal: all.find((d) => d.id === REPRESENTATIVE_DECK_IDS.tezhal),
    quralan: all.find((d) => d.id === REPRESENTATIVE_DECK_IDS.quralan),
    zaqe: all.find((d) => d.id === REPRESENTATIVE_DECK_IDS.zaqe),
  }
}
