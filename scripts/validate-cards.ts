// scripts/validate-cards.ts — Validador v4.1.
//
// Lee los YAMLs de docs/playtest/cards-v4.1/ y docs/playtest/decks-v4.1/ con fs,
// los valida con los type guards de src/data/schema.ts, y reporta:
//   - Pool de acción: 30 cartas (15 Tezhal + 15 Würon), IDs únicos.
//   - Pool de planetas: 6 cartas (3 por tramo), una por categoría.
//   - Héroes: 4 entradas (2 razas × 2 estados).
//   - Mazos: 4 mazos, cada uno 20 cartas con max 2 copias, IDs válidos del pool.
//
// Uso: pnpm tsx scripts/validate-cards.ts
// Sale con código != 0 si algo falla.

import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from 'yaml'
import {
  validateCardActionDef,
  validateCardPlanetDef,
  validateHeroEstadoYamlEntry,
  combineHeroEntries,
} from '../src/data/schema'

const ROOT = resolve(process.cwd())
const CARDS_DIR = resolve(ROOT, 'docs/playtest/cards-v4.1')
const DECKS_DIR = resolve(ROOT, 'docs/playtest/decks-v4.1')

let errors = 0
function fail(msg: string): void {
  console.error(`✗ ${msg}`)
  errors++
}

// ===== Pool de Acción =======================================================

const cardIds = new Set<string>()
let totalActionCards = 0
for (const filename of ['tezhal.yaml', 'wuron.yaml']) {
  try {
    const raw = readFileSync(resolve(CARDS_DIR, filename), 'utf8')
    const doc = parse(raw) as { cards?: unknown[] }
    if (!doc.cards || !Array.isArray(doc.cards)) {
      fail(`${filename}: 'cards' debe ser array`)
      continue
    }
    for (const entry of doc.cards) {
      try {
        const card = validateCardActionDef(entry)
        if (cardIds.has(card.id)) {
          fail(`Card ID duplicado: ${card.id}`)
        }
        cardIds.add(card.id)
        totalActionCards++
      } catch (e) {
        fail(`${filename}: ${(e as Error).message}`)
      }
    }
  } catch (e) {
    fail(`No se pudo leer ${filename}: ${(e as Error).message}`)
  }
}
if (totalActionCards !== 30) {
  fail(`Se esperaban 30 cartas de Acción, se encontraron ${totalActionCards}`)
}
console.log(`✓ Pool de acción: ${totalActionCards} cartas`)

// ===== Pool de Planetas =====================================================

const planetIds = new Set<string>()
try {
  const raw = readFileSync(resolve(CARDS_DIR, 'planets.yaml'), 'utf8')
  const doc = parse(raw) as { planets?: unknown[] }
  if (!doc.planets || !Array.isArray(doc.planets)) {
    fail(`planets.yaml: 'planets' debe ser array`)
  } else {
    const byTramo = new Map<string, Set<string>>()
    for (const entry of doc.planets) {
      try {
        const planet = validateCardPlanetDef(entry)
        if (planetIds.has(planet.id)) {
          fail(`Planet ID duplicado: ${planet.id}`)
        }
        planetIds.add(planet.id)
        const cats = byTramo.get(planet.tramo) ?? new Set()
        if (cats.has(planet.categoria)) {
          fail(`Tramo ${planet.tramo}: categoría ${planet.categoria} duplicada`)
        }
        cats.add(planet.categoria)
        byTramo.set(planet.tramo, cats)
      } catch (e) {
        fail(`planets.yaml: ${(e as Error).message}`)
      }
    }
    for (const tramo of ['Nebulosa', 'Estrellas']) {
      const cats = byTramo.get(tramo)
      if (!cats || cats.size !== 3) {
        fail(`Tramo ${tramo}: se esperan 3 planetas (Atq/Def/Rit), got ${cats?.size ?? 0}`)
      }
    }
  }
} catch (e) {
  fail(`No se pudo leer planets.yaml: ${(e as Error).message}`)
}
console.log(`✓ Pool de planetas: ${planetIds.size} cartas`)

// ===== Héroes ===============================================================

try {
  const raw = readFileSync(resolve(CARDS_DIR, 'heroes.yaml'), 'utf8')
  const doc = parse(raw) as { heroes?: unknown[] }
  if (!doc.heroes || !Array.isArray(doc.heroes)) {
    fail(`heroes.yaml: 'heroes' debe ser array`)
  } else {
    if (doc.heroes.length !== 4) {
      fail(`Se esperan 4 entradas (2 razas × 2 estados), got ${doc.heroes.length}`)
    }
    const entries = doc.heroes.map((e) => validateHeroEstadoYamlEntry(e))
    const heroes = combineHeroEntries(entries)
    if (heroes.size !== 2) {
      fail(`Se esperan 2 héroes combinados (Tezhal + Würon), got ${heroes.size}`)
    }
  }
} catch (e) {
  fail(`Héroes: ${(e as Error).message}`)
}
console.log(`✓ Héroes: 4 entradas → 2 héroes combinados`)

// ===== Mazos preconstruidos =================================================

const deckFiles = readdirSync(DECKS_DIR).filter((f) => f.endsWith('.yaml'))
if (deckFiles.length !== 4) {
  fail(`Se esperan 4 mazos preconstruidos, got ${deckFiles.length}: ${deckFiles.join(', ')}`)
}
for (const filename of deckFiles) {
  try {
    const raw = readFileSync(resolve(DECKS_DIR, filename), 'utf8')
    const doc = parse(raw) as { deck?: { name?: string; race?: string; hero?: string; cards?: Array<{ id: string; copies: number }> } }
    if (!doc.deck || !doc.deck.cards) {
      fail(`${filename}: deck.cards no encontrado`)
      continue
    }
    let total = 0
    for (const entry of doc.deck.cards) {
      if (!entry.id || typeof entry.copies !== 'number') {
        fail(`${filename}: entry inválida ${JSON.stringify(entry)}`)
        continue
      }
      if (entry.copies > 2) {
        fail(`${filename}: ${entry.id} tiene ${entry.copies} copias (max 2)`)
      }
      if (!cardIds.has(entry.id)) {
        fail(`${filename}: card ${entry.id} no existe en pool`)
      }
      total += entry.copies
    }
    if (total !== 20) {
      fail(`${filename}: tiene ${total} cartas (esperado 20)`)
    }
  } catch (e) {
    fail(`${filename}: ${(e as Error).message}`)
  }
}
console.log(`✓ Mazos preconstruidos: ${deckFiles.length}`)

// ===== Resumen ==============================================================

if (errors > 0) {
  console.error(`\n✗ ${errors} error(es). Validación falló.`)
  process.exit(1)
}
console.log('\n✓ Validación completa OK.')
