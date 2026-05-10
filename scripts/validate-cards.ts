// scripts/validate-cards.ts
// Validador de card data. Lee todos los .json en src/data/cards/<race>/ y
// reporta:
//   1. Schema check via zod (estructura, tipos, primitives existentes)
//   2. Stat curve: cost ≈ floor((s+hp)/2.5) ±1
//   3. Keyword discount adjustment
//   4. Ability cost discount
//   5. Mecánica firma off-category sin justificación
//   6. Naming blocklist match
//   7. Premonition soft cap (info, no error)
//
// Output: report en stdout. Exit 1 si hay errores duros, 0 si todo OK.
//
// Uso:
//   pnpm validate:cards
//   pnpm validate:cards --json   (JSON output para CI parsing)

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import { findBlocklistedTerm } from '../src/data/blocklist'
import {
  RACE_SIGNATURE_CATEGORY,
  type Ability,
  type Effect,
  type ShipFilter,
} from '../src/data/primitives/spec'
import type { Card, MechanicCategory, Race, ShipInstance } from '../src/engine/types'

// ---------------------------------------------------------------------------
// Schema (zod)
// ---------------------------------------------------------------------------

const RACE = z.enum(['quralan', 'wuron', 'tezhal', 'zaqe'])
const CARD_TYPE = z.enum(['ship', 'weapon', 'tech', 'relic', 'event'])
const RARITY = z.enum(['common', 'rare', 'legendary'])
const MECHANIC_CATEGORY = z.enum(['reactive', 'initiative', 'accumulative', 'post_combat'])
const DURATION = z.enum(['permanent', 'end_of_turn', 'end_of_age', 'this_turn', 'next_turn'])

// Recursive Effect schema — z.lazy is required for self-referencing.
const EffectSchema: z.ZodType<Effect> = z.lazy(() =>
  z.discriminatedUnion('op', [
    z.object({ op: z.literal('noop') }),
    z.object({ op: z.literal('damage'), target: TargetSchema, amount: z.number() }),
    z.object({
      op: z.literal('damage_homeworld'),
      player: z.enum(['self', 'opponent']),
      amount: z.number(),
    }),
    z.object({ op: z.literal('destroy'), target: TargetSchema }),
    z.object({
      op: z.literal('exile'),
      target: TargetSchema,
      // v3.0.3: pozo_astral agregado como canónico (graveyard legacy alias).
      fromZone: z.enum(['in_play', 'pozo_astral', 'graveyard', 'hand', 'deck']).optional(),
    }),
    z.object({ op: z.literal('bounce_to_hand'), target: TargetSchema }),
    z.object({
      op: z.literal('shuffle_to_deck'),
      target: TargetSchema,
      owner: z.enum(['self', 'opponent']),
    }),
    z.object({ op: z.literal('draw'), player: z.enum(['self', 'opponent']), n: z.number() }),
    z.object({
      op: z.literal('discard'),
      target: z.enum(['self', 'opponent']),
      n: z.number(),
      selection: z.enum(['random', 'choice']),
      filter: z.object({ cardType: CARD_TYPE.optional() }).optional(),
    }),
    z.object({ op: z.literal('mill'), player: z.enum(['self', 'opponent']), n: z.number() }),
    z.object({
      op: z.literal('search'),
      owner: z.enum(['self', 'opponent']),
      // v3.0.3: pozo_astral agregado como canónico (graveyard legacy alias).
      zone: z.enum(['deck', 'pozo_astral', 'graveyard']),
      // v3.0.2: filter extendido con costLte/costGte (mismos campos que ShipFilter).
      filter: z.object({
        cardType: CARD_TYPE.optional(),
        race: RACE.optional(),
        costLte: z.number().optional(),
        costGte: z.number().optional(),
      }),
      count: z.number(),
      destination: z.enum(['hand', 'play']),
    }),
    z.object({
      op: z.literal('modify_strength'),
      target: TargetSchema,
      kind: z.enum(['delta', 'set']),
      value: z.number(),
      duration: DURATION,
    }),
    z.object({
      op: z.literal('modify_hp'),
      target: TargetSchema,
      kind: z.enum(['delta', 'set', 'set_to_max']), // v3.0.1: set_to_max
      value: z.number(),
      duration: DURATION,
    }),
    z.object({
      op: z.literal('grant_keyword'),
      target: TargetSchema,
      keyword: z.string(),
      duration: DURATION,
    }),
    z.object({ op: z.literal('remove_ability'), target: TargetSchema, duration: DURATION }),
    z.object({
      op: z.literal('generate_energy'),
      player: z.enum(['self', 'opponent']),
      n: z.number(),
      duration: DURATION,
    }),
    z.object({ op: z.literal('sacrifice'), target: TargetSchema }),
    z.object({
      op: z.literal('prevent_damage'),
      target: TargetSchema,
      amount: z.number(),
      duration: DURATION,
    }),
    z.object({ op: z.literal('sequence'), effects: z.array(EffectSchema) }),
    z.object({
      op: z.literal('conditional'),
      condition: ConditionSchema,
      thenEffect: EffectSchema,
      elseEffect: EffectSchema.optional(),
    }),
    z.object({
      op: z.literal('for_each'),
      filter: ShipFilterSchema,
      effect: EffectSchema,
    }),
    // v3.0.1
    z.object({
      op: z.literal('keyword_amplifier'),
      keyword: z.string(),
      deltaBonus: z.number(),
    }),
    // v3.0.3
    z.object({
      op: z.literal('cost_modifier'),
      target: z.object({ keyword: z.string() }),
      delta: z.number(),
      minCost: z.number(),
    }),
  ]),
)

const ShipFilterSchema: z.ZodType<ShipFilter> = z.object({
  controller: z.enum(['self', 'opponent', 'any']).optional(),
  race: z.union([RACE, z.literal('any')]).optional(),
  cardType: CARD_TYPE.optional(),
  keywordsAny: z.array(z.string()).optional(),
  keywordsAll: z.array(z.string()).optional(),
  costLte: z.number().optional(),
  costGte: z.number().optional(),
  // v3.0.1
  wasDamagedThisTurn: z.boolean().optional(),
})

const PermanentFilterSchema = z.object({
  controller: z.enum(['self', 'opponent', 'any']).optional(),
  cardType: CARD_TYPE.optional(),
})

const TargetSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('self') }),
  z.object({ kind: z.literal('controller') }),
  z.object({ kind: z.literal('opponent') }),
  z.object({ kind: z.literal('all_ships'), filter: ShipFilterSchema.optional() }),
  z.object({ kind: z.literal('chosen_ship'), filter: ShipFilterSchema.optional() }),
  z.object({ kind: z.literal('random_ship'), filter: ShipFilterSchema.optional() }),
  z.object({ kind: z.literal('homeworld'), player: z.enum(['self', 'opponent']) }),
  // v3.0.1
  z.object({ kind: z.literal('attacker') }),
  // v3.0.3
  z.object({ kind: z.literal('chosen_permanent'), filter: PermanentFilterSchema.optional() }),
])

const ConditionSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('always') }),
  z.object({ kind: z.literal('in_age'), age: z.union([z.literal(1), z.literal(2), z.literal(3)]) }),
  z.object({
    kind: z.literal('in_age_gte'),
    age: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  }),
  z.object({
    kind: z.literal('count_filter'),
    filter: ShipFilterSchema,
    op: z.enum(['gte', 'lte', 'eq']),
    value: z.number(),
    // v3.0.3: zone/player opcionales para contar cartas en zonas distintas a fleet.
    zone: z.enum(['in_play', 'pozo_astral', 'disolucion', 'hand', 'deck']).optional(),
    player: z.enum(['self', 'opponent']).optional(),
  }),
  z.object({ kind: z.literal('self_has_keyword'), keyword: z.string() }),
  z.object({ kind: z.literal('controller_energy_gte'), value: z.number() }),
])

const TriggerSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('on_play') }),
  z.object({ kind: z.literal('on_destroy') }),
  z.object({
    kind: z.literal('on_event'),
    event: z.enum([
      'ship_damaged',
      'ship_destroyed',
      'ship_attacked', // v3.0.1
      'card_played',
      'planet_activated',
      'phase_start',
      'phase_end',
      'turn_start',
      'age_changed',
      'homeworld_damaged',
      'card_drawn',
    ]),
    filter: z
      .object({
        controller: z.enum(['self', 'opponent', 'any']).optional(),
        shipFilter: ShipFilterSchema.optional(),
        cardType: CARD_TYPE.optional(),
      })
      .optional(),
  }),
  z.object({ kind: z.literal('continuous'), while: ConditionSchema.optional() }),
  z.object({
    kind: z.literal('activated'),
    window: z.enum([
      'recoleccion',
      'despliegue',
      'combate',
      'regroup',
      'vigilia',
      'any_time',
    ]),
    usesPerTurn: z.number().optional(),
    cost: z
      .object({
        energy: z.number().optional(),
        sacrificeShip: ShipFilterSchema.optional(),
      })
      .optional(),
  }),
])

const AbilitySchema: z.ZodType<Ability> = z.object({
  trigger: TriggerSchema,
  category: MECHANIC_CATEGORY,
  premonition: z.boolean().optional(),
  effect: EffectSchema,
  description: z.string().optional(),
})

const CardSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(40),
  race: RACE,
  type: CARD_TYPE,
  cost: z.number().min(0).max(20),
  rarity: RARITY,
  strength: z.number().optional(),
  hp: z.number().optional(),
  keywords: z.array(z.string()),
  abilities: z.array(AbilitySchema),
  flavorText: z.string().max(100).optional(),
  artUrl: z.string().optional(),
  // Posición en el sprite sheet 4×3 de la raza.
  artSlot: z
    .object({
      row: z.number().int().min(0).max(2),
      col: z.number().int().min(0).max(3),
    })
    .optional(),
  // Metadata opcional para flag intencional de off-category.
  intentionalOffCategory: z.boolean().optional(),
})

// ---------------------------------------------------------------------------
// Reglas de balance
// ---------------------------------------------------------------------------

const STAT_CURVE_DIVISOR = 2.5
const STAT_CURVE_TOLERANCE = 1

const KEYWORD_VALUE: Readonly<Record<string, number>> = {
  bastion: 1,
  desgarro: 1,
  vuelo: 0.5,
}

const ABILITY_DISCOUNT: Readonly<Record<string, number>> = {
  on_play: 1,
  on_destroy: 1,
  continuous: 2,
  activated: 1,
  on_event: 1,
}

interface ValidationIssue {
  cardId: string
  severity: 'error' | 'warn' | 'info'
  rule: string
  message: string
}

function validateStatCurve(card: Card): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (card.type !== 'ship') return issues
  if (card.strength === undefined || card.hp === undefined) {
    issues.push({
      cardId: card.id,
      severity: 'error',
      rule: 'stat_curve.required',
      message: `Carta ship sin strength/hp`,
    })
    return issues
  }
  // Computar costo "esperado" descontando keywords + abilities.
  let stats = card.strength + card.hp
  for (const kw of card.keywords) {
    if (KEYWORD_VALUE[kw]) stats -= KEYWORD_VALUE[kw]
  }
  for (const ab of card.abilities) {
    const triggerKind = ab.trigger.kind
    const discount = ABILITY_DISCOUNT[triggerKind] ?? 1
    stats -= discount
  }
  const expected = Math.floor(stats / STAT_CURVE_DIVISOR)
  const diff = card.cost - expected
  if (Math.abs(diff) > STAT_CURVE_TOLERANCE) {
    issues.push({
      cardId: card.id,
      severity: 'warn',
      rule: 'stat_curve.deviation',
      message: `cost=${card.cost} expected~${expected} (diff ${diff > 0 ? '+' : ''}${diff})`,
    })
  }
  return issues
}

function validateMechanicCategory(card: Card): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const expected = RACE_SIGNATURE_CATEGORY[card.race]
  for (const ab of card.abilities) {
    if (ab.category !== expected && !card.intentionalOffCategory) {
      issues.push({
        cardId: card.id,
        severity: 'warn',
        rule: 'mechanic_category.off_signature',
        message: `Ability con category=${ab.category} pero raza ${card.race} firma=${expected}. Marcar intentionalOffCategory: true si es a propósito.`,
      })
    }
  }
  return issues
}

function validateNaming(card: Card): ValidationIssue[] {
  const term = findBlocklistedTerm(card.name)
  if (term) {
    return [
      {
        cardId: card.id,
        severity: 'error',
        rule: 'naming.blocklist',
        message: `Nombre "${card.name}" contiene término prohibido "${term}". Ver docs/lore/naming-conventions.md.`,
      },
    ]
  }
  return []
}

function validatePremonitionSoftCap(card: Card): ValidationIssue[] {
  // Soft cap: este script no chequea por mazo (no hay mazos), solo flagea cartas
  // individuales con premonition=true como info.
  const has = card.abilities.some((a) => a.premonition)
  if (has) {
    return [
      {
        cardId: card.id,
        severity: 'info',
        rule: 'premonition.usage',
        message: `Carta usa Premonición — recordá soft cap 1-2 por mazo (GAME-RULES §4.2).`,
      },
    ]
  }
  return []
}

function validateIdNamingConvention(card: Card): ValidationIssue[] {
  const expectedPrefix = `${card.race}_`
  if (!card.id.startsWith(expectedPrefix)) {
    return [
      {
        cardId: card.id,
        severity: 'warn',
        rule: 'id.race_prefix',
        message: `id "${card.id}" debería empezar con "${expectedPrefix}" (formato: <race>_<slug>).`,
      },
    ]
  }
  return []
}

// ---------------------------------------------------------------------------
// Loader
// ---------------------------------------------------------------------------

interface LoadResult {
  card?: Card
  issues: ValidationIssue[]
  filePath: string
}

function loadCard(filePath: string): LoadResult {
  const issues: ValidationIssue[] = []
  let raw: unknown
  try {
    raw = JSON.parse(readFileSync(filePath, 'utf-8'))
  } catch (e) {
    issues.push({
      cardId: filePath,
      severity: 'error',
      rule: 'json.parse',
      message: e instanceof Error ? e.message : String(e),
    })
    return { issues, filePath }
  }
  const parsed = CardSchema.safeParse(raw)
  if (!parsed.success) {
    for (const err of parsed.error.issues) {
      issues.push({
        cardId: typeof (raw as { id?: unknown }).id === 'string' ? String((raw as { id: string }).id) : filePath,
        severity: 'error',
        rule: `schema.${err.path.join('.')}`,
        message: err.message,
      })
    }
    return { issues, filePath }
  }
  return { card: parsed.data, issues, filePath }
}

function discoverCardFiles(rootDir: string): string[] {
  const files: string[] = []
  function walk(dir: string): void {
    let entries: string[]
    try {
      entries = readdirSync(dir)
    } catch {
      return
    }
    for (const entry of entries) {
      const full = join(dir, entry)
      const st = statSync(full)
      if (st.isDirectory()) walk(full)
      else if (st.isFile() && entry.endsWith('.json')) files.push(full)
    }
  }
  walk(rootDir)
  return files.sort()
}

// ---------------------------------------------------------------------------
// Public API (exportada para tests)
// ---------------------------------------------------------------------------

export interface ValidationReport {
  totalFiles: number
  totalCards: number
  totalErrors: number
  totalWarnings: number
  totalInfos: number
  issues: ValidationIssue[]
  byRace: Record<Race, number>
}

export function validateCard(card: Card): ValidationIssue[] {
  return [
    ...validateStatCurve(card),
    ...validateMechanicCategory(card),
    ...validateNaming(card),
    ...validatePremonitionSoftCap(card),
    ...validateIdNamingConvention(card),
  ]
}

export function validateCards(cardsDir: string): ValidationReport {
  const files = discoverCardFiles(cardsDir)
  const allIssues: ValidationIssue[] = []
  const byRace: Record<Race, number> = { quralan: 0, wuron: 0, tezhal: 0, zaqe: 0 }
  let totalCards = 0
  for (const f of files) {
    const result = loadCard(f)
    allIssues.push(...result.issues)
    if (result.card) {
      totalCards++
      byRace[result.card.race]++
      allIssues.push(...validateCard(result.card))
    }
  }
  return {
    totalFiles: files.length,
    totalCards,
    totalErrors: allIssues.filter((i) => i.severity === 'error').length,
    totalWarnings: allIssues.filter((i) => i.severity === 'warn').length,
    totalInfos: allIssues.filter((i) => i.severity === 'info').length,
    issues: allIssues,
    byRace,
  }
}

// ---------------------------------------------------------------------------
// CLI entry
// ---------------------------------------------------------------------------

function main(): void {
  const cardsDir = join(process.cwd(), 'src', 'data', 'cards')
  const report = validateCards(cardsDir)
  const jsonOutput = process.argv.includes('--json')

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2))
    process.exit(report.totalErrors > 0 ? 1 : 0)
  }

  console.log(`\n📋 Card validation report`)
  console.log(`   Files scanned: ${report.totalFiles}`)
  console.log(`   Cards loaded: ${report.totalCards}`)
  console.log(
    `   Distribution: Q'ralan=${report.byRace.quralan} Würon=${report.byRace.wuron} Tezhal=${report.byRace.tezhal} Zaqe=${report.byRace.zaqe}`,
  )
  console.log(
    `   Errors: ${report.totalErrors}  Warnings: ${report.totalWarnings}  Info: ${report.totalInfos}\n`,
  )

  if (report.issues.length === 0) {
    console.log(`✅ Todo OK.\n`)
    process.exit(0)
  }

  const grouped: Record<string, ValidationIssue[]> = {}
  for (const issue of report.issues) {
    grouped[issue.cardId] ??= []
    const list = grouped[issue.cardId]
    if (list) list.push(issue)
  }

  for (const [cardId, issues] of Object.entries(grouped)) {
    console.log(`\n  ${cardId}:`)
    for (const issue of issues) {
      const tag = issue.severity === 'error' ? '❌' : issue.severity === 'warn' ? '⚠️ ' : 'ℹ️ '
      console.log(`    ${tag} [${issue.rule}] ${issue.message}`)
    }
  }

  console.log()
  process.exit(report.totalErrors > 0 ? 1 : 0)
}

// Run when invoked directly (not when imported by tests).
// Vitest sets `import.meta.vitest` or similar; here we check argv.
if (process.argv[1] && process.argv[1].endsWith('validate-cards.ts')) {
  main()
}

// Avoid TS lint about unused types (used only in zod schemas).
type _UnusedShip = ShipInstance
type _UnusedCat = MechanicCategory
