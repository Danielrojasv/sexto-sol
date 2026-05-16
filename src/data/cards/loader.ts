// Loader del pool de cartas v4.2.
//
// Carga vía Vite glob (eager) todos los YAMLs de docs/playtest/cards-v4.2/
// y los normaliza a las definiciones tipadas del engine (CardActionDef,
// CardPlanetDef, CardHeroDef).
//
// v4.2 schema: penalizacion_acierto + condicionales sobre estado del juego.
// Ver docs/specs/engine-v4.2-migration.md y SPEC v4.2 §5.

import { parse as parseYaml } from 'yaml'
import type {
  CardActionDef,
  CardHeroDef,
  CardPlanetDef,
  Raza,
} from '@/engine/types'
import {
  combineHeroEntries,
  validateCardActionDef,
  validateCardPlanetDef,
  validateHeroEstadoYamlEntry,
} from '@/data/schema'

interface CardsYamlDoc {
  cards?: unknown[]
}

interface PlanetsYamlDoc {
  planets?: unknown[]
}

interface HeroesYamlDoc {
  heroes?: unknown[]
}

const allYamlRaw = import.meta.glob('/docs/playtest/cards-v4.2/*.yaml', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

function pickYaml(filename: string): string {
  const key = Object.keys(allYamlRaw).find((p) => p.endsWith(`/${filename}`))
  if (!key) {
    throw new Error(`Pool loader: archivo ${filename} no encontrado en cards-v4.2/`)
  }
  return allYamlRaw[key]!
}

function loadActionCards(): Map<string, CardActionDef> {
  const map = new Map<string, CardActionDef>()
  for (const filename of ['tezhal.yaml', 'wuron.yaml']) {
    const raw = pickYaml(filename)
    const doc = parseYaml(raw) as CardsYamlDoc
    if (!doc.cards || !Array.isArray(doc.cards)) {
      throw new Error(`${filename}: 'cards' debe ser array`)
    }
    for (const entry of doc.cards) {
      const card = validateCardActionDef(entry)
      if (map.has(card.id)) {
        throw new Error(`Card ID duplicado: ${card.id} en ${filename}`)
      }
      map.set(card.id, card)
    }
  }
  return map
}

function loadPlanetCards(): Map<string, CardPlanetDef> {
  const map = new Map<string, CardPlanetDef>()
  const raw = pickYaml('planets.yaml')
  const doc = parseYaml(raw) as PlanetsYamlDoc
  if (!doc.planets || !Array.isArray(doc.planets)) {
    throw new Error(`planets.yaml: 'planets' debe ser array`)
  }
  for (const entry of doc.planets) {
    const planet = validateCardPlanetDef(entry)
    if (map.has(planet.id)) {
      throw new Error(`Planet ID duplicado: ${planet.id}`)
    }
    map.set(planet.id, planet)
  }
  return map
}

function loadHeroCards(): Map<Raza, CardHeroDef> {
  const raw = pickYaml('heroes.yaml')
  const doc = parseYaml(raw) as HeroesYamlDoc
  if (!doc.heroes || !Array.isArray(doc.heroes)) {
    throw new Error(`heroes.yaml: 'heroes' debe ser array`)
  }
  const entries = doc.heroes.map(validateHeroEstadoYamlEntry)
  return combineHeroEntries(entries)
}

/** Registry combinado del pool v4.1. */
export interface PoolRegistry {
  cards: Map<string, CardActionDef>
  planets: Map<string, CardPlanetDef>
  heroes: Map<Raza, CardHeroDef>
  /** Helpers: planetas por tramo (en orden Atq, Def, Rit). */
  planetasNebulosa: string[]
  planetasEstrellas: string[]
}

function buildPoolRegistry(): PoolRegistry {
  const cards = loadActionCards()
  const planets = loadPlanetCards()
  const heroes = loadHeroCards()

  // Generar pools de planetas por tramo, ordenados por categoría (Atq, Def, Rit).
  const orderCat = (c: string) => (c === 'Ataque' ? 0 : c === 'Defensa' ? 1 : 2)
  const planetasNebulosa = [...planets.values()]
    .filter((p) => p.tramo === 'Nebulosa')
    .sort((a, b) => orderCat(a.categoria) - orderCat(b.categoria))
    .map((p) => p.id)
  const planetasEstrellas = [...planets.values()]
    .filter((p) => p.tramo === 'Estrellas')
    .sort((a, b) => orderCat(a.categoria) - orderCat(b.categoria))
    .map((p) => p.id)

  if (planetasNebulosa.length !== 3) {
    throw new Error(`Nebulosa debe tener 3 planetas (got: ${planetasNebulosa.length})`)
  }
  if (planetasEstrellas.length !== 3) {
    throw new Error(`Estrellas debe tener 3 planetas (got: ${planetasEstrellas.length})`)
  }
  if (heroes.size !== 2) {
    throw new Error(`Debe haber 2 héroes (Tezhal + Würon), got: ${heroes.size}`)
  }
  if (cards.size !== 30) {
    throw new Error(`Debe haber 30 cartas de acción (got: ${cards.size})`)
  }

  return { cards, planets, heroes, planetasNebulosa, planetasEstrellas }
}

/** Registry singleton — evaluado una vez al cargar el módulo. */
export const POOL_REGISTRY: PoolRegistry = buildPoolRegistry()

/** Helpers convenience. */
export function cardById(id: string): CardActionDef | undefined {
  return POOL_REGISTRY.cards.get(id)
}
export function planetById(id: string): CardPlanetDef | undefined {
  return POOL_REGISTRY.planets.get(id)
}
export function heroByRaza(raza: Raza): CardHeroDef | undefined {
  return POOL_REGISTRY.heroes.get(raza)
}
