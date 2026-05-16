// scripts/migrate-v4.1-cards-to-structured.ts
//
// Phase 1 step 0 del SPEC engine-v4.1-migration.md:
// Migra los YAMLs de cards-v4.1/{tezhal,wuron}.yaml del formato v4.0
// (efecto: string) al formato v4.1 estructurado (fuerzaDelta + sideEffect)
// preservando el texto original como efectoTexto para uso en UI.
//
// Uso: pnpm tsx scripts/migrate-v4.1-cards-to-structured.ts
//
// Side effects:
// - Re-escribe docs/playtest/cards-v4.1/tezhal.yaml y wuron.yaml in-place.
// - Imprime resumen + cards/condicionales detectados.
// - Sale con código != 0 si encuentra algún efecto no parseable (fail early).

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse, stringify } from 'yaml'

type SideEffect = {
  tipo: 'descarte' | 'robo' | 'anula'
  target: 'propio' | 'oponente'
  valor: number
}

type Parsed = {
  fuerzaDelta?: number
  sideEffect?: SideEffect
}

/** Parser por reglas explícitas. Devuelve undefined si la string no se reconoce.
 *  Output siempre con keys en orden canónico: { fuerzaDelta, sideEffect }. */
function parseEfecto(efecto: string): Parsed | undefined {
  let fuerzaDelta: number | undefined
  let sideEffect: SideEffect | undefined

  // 1. Anular fuerza enemiga (con o sin "este turno", con o sin "de la carta")
  //    Soporta sufijo " y +N fuerza propia".
  const anulaMatch = efecto.match(
    /anula (\d+) fuerza( de la carta)? enemiga( este turno)?(?: y \+(\d+) fuerza propia)?/i,
  )
  if (anulaMatch) {
    sideEffect = {
      tipo: 'anula',
      target: 'oponente',
      valor: parseInt(anulaMatch[1]!, 10),
    }
    if (anulaMatch[4]) {
      fuerzaDelta = parseInt(anulaMatch[4]!, 10)
    }
    return normalize({ fuerzaDelta, sideEffect })
  }

  // 2. Descarte forzado al oponente
  if (/el oponente descarta (\d+) cartas?/i.test(efecto)) {
    const m = efecto.match(/el oponente descarta (\d+) cartas?/i)!
    sideEffect = {
      tipo: 'descarte',
      target: 'oponente',
      valor: parseInt(m[1]!, 10),
    }
    return normalize({ fuerzaDelta, sideEffect })
  }

  // 3. Descarte propio "de tu mano" (con o sin sufijo de fuerza)
  const descartePropioMatch = efecto.match(/descartá (\d+) cartas? de tu mano/i)
  if (descartePropioMatch) {
    sideEffect = {
      tipo: 'descarte',
      target: 'propio',
      valor: parseInt(descartePropioMatch[1]!, 10),
    }
    const fuerzaMatch = efecto.match(/\+(\d+) fuerza|-(\d+) fuerza/)
    if (fuerzaMatch) {
      const pos = fuerzaMatch[1] ? parseInt(fuerzaMatch[1], 10) : 0
      const neg = fuerzaMatch[2] ? -parseInt(fuerzaMatch[2], 10) : 0
      fuerzaDelta = pos + neg
    }
    return normalize({ fuerzaDelta, sideEffect })
  }

  // 4. Robo propio ("robá N cartas") — solo si NO está prefijado por "el oponente"
  if (/(?<!el oponente )(?:\b)robá (\d+) cartas?/i.test(efecto)) {
    const m = efecto.match(/(?<!el oponente )(?:\b)robá (\d+) cartas?/i)!
    sideEffect = {
      tipo: 'robo',
      target: 'propio',
      valor: parseInt(m[1]!, 10),
    }
    const fuerzaMatch = efecto.match(/\+(\d+) fuerza/)
    if (fuerzaMatch) {
      fuerzaDelta = parseInt(fuerzaMatch[1]!, 10)
    }
    return normalize({ fuerzaDelta, sideEffect })
  }

  // 5. Solo fuerza (positiva o negativa). Captura "+N fuerza" o "-N fuerza"
  const fuerzaSolaMatch = efecto.match(/^([+-]\d+) fuerza(?: adicional)?$/i)
  if (fuerzaSolaMatch) {
    fuerzaDelta = parseInt(fuerzaSolaMatch[1]!, 10)
    return normalize({ fuerzaDelta, sideEffect })
  }

  return undefined
}

/** Orden canónico de keys: { fuerzaDelta, sideEffect }. */
function normalize(p: Parsed): Parsed {
  const out: Parsed = {}
  if (p.fuerzaDelta !== undefined) out.fuerzaDelta = p.fuerzaDelta
  if (p.sideEffect !== undefined) out.sideEffect = p.sideEffect
  return out
}

/** Verifica que los efectos esperados parsean correctamente. */
function selfTest(): void {
  const cases: Array<[string, Parsed]> = [
    ['+2 fuerza', { fuerzaDelta: 2 }],
    ['+1 fuerza', { fuerzaDelta: 1 }],
    ['+3 fuerza', { fuerzaDelta: 3 }],
    ['+1 fuerza adicional', { fuerzaDelta: 1 }],
    ['+2 fuerza adicional', { fuerzaDelta: 2 }],
    ['-1 fuerza', { fuerzaDelta: -1 }],
    ['-2 fuerza', { fuerzaDelta: -2 }],
    ['-3 fuerza', { fuerzaDelta: -3 }],
    [
      '+3 fuerza, y descartá 1 carta de tu mano',
      { fuerzaDelta: 3, sideEffect: { tipo: 'descarte', target: 'propio', valor: 1 } },
    ],
    [
      '+1 fuerza y robá 1 carta',
      { fuerzaDelta: 1, sideEffect: { tipo: 'robo', target: 'propio', valor: 1 } },
    ],
    [
      '+2 fuerza adicional y robá 1 carta',
      { fuerzaDelta: 2, sideEffect: { tipo: 'robo', target: 'propio', valor: 1 } },
    ],
    [
      '+3 fuerza adicional y robá 1 carta',
      { fuerzaDelta: 3, sideEffect: { tipo: 'robo', target: 'propio', valor: 1 } },
    ],
    [
      'descartá 1 carta de tu mano, +3 fuerza',
      { fuerzaDelta: 3, sideEffect: { tipo: 'descarte', target: 'propio', valor: 1 } },
    ],
    [
      'descartá 2 cartas de tu mano, +6 fuerza',
      { fuerzaDelta: 6, sideEffect: { tipo: 'descarte', target: 'propio', valor: 2 } },
    ],
    ['descartá 1 carta de tu mano', { sideEffect: { tipo: 'descarte', target: 'propio', valor: 1 } }],
    [
      'anula 3 fuerza de la carta enemiga este turno',
      { sideEffect: { tipo: 'anula', target: 'oponente', valor: 3 } },
    ],
    [
      'anula 2 fuerza de la carta enemiga y +2 fuerza propia',
      { fuerzaDelta: 2, sideEffect: { tipo: 'anula', target: 'oponente', valor: 2 } },
    ],
    [
      'anula 3 fuerza enemiga este turno',
      { sideEffect: { tipo: 'anula', target: 'oponente', valor: 3 } },
    ],
    [
      'anula 4 fuerza enemiga y +1 fuerza propia',
      { fuerzaDelta: 1, sideEffect: { tipo: 'anula', target: 'oponente', valor: 4 } },
    ],
    [
      'anula 2 fuerza enemiga este turno',
      { sideEffect: { tipo: 'anula', target: 'oponente', valor: 2 } },
    ],
    [
      'anula 3 fuerza enemiga este turno y +1 fuerza propia',
      { fuerzaDelta: 1, sideEffect: { tipo: 'anula', target: 'oponente', valor: 3 } },
    ],
    [
      'el oponente descarta 1 carta',
      { sideEffect: { tipo: 'descarte', target: 'oponente', valor: 1 } },
    ],
    ['robá 1 carta', { sideEffect: { tipo: 'robo', target: 'propio', valor: 1 } }],
  ]

  let failed = 0
  for (const [input, expected] of cases) {
    const got = parseEfecto(input)
    if (JSON.stringify(got) !== JSON.stringify(expected)) {
      console.error(`✗ "${input}"`)
      console.error(`   expected: ${JSON.stringify(expected)}`)
      console.error(`   got:      ${JSON.stringify(got)}`)
      failed++
    }
  }
  if (failed > 0) {
    console.error(`\n${failed} self-test cases failed. Fix parser.`)
    process.exit(1)
  }
  console.log(`✓ Self-test: ${cases.length} cases pasaron.`)
}

type Condicional = {
  tipo: string
  valor?: string
  efecto?: string // input (a migrar)
  efectoTexto?: string // output (preservado)
  fuerzaDelta?: number
  sideEffect?: SideEffect
}

type Card = {
  id: string
  nombre: string
  raza: string
  categoria: string
  coste: number
  fuerza_base: number
  rareza: string
  condicionales: Condicional[]
  flavor: string
}

type CardsFile = { cards: Card[] }

function migrateCondicional(cond: Condicional, cardId: string): Condicional {
  const efectoOriginal = cond.efecto
  if (typeof efectoOriginal !== 'string') {
    throw new Error(`Card ${cardId}: condicional sin campo 'efecto: string'.`)
  }
  const parsed = parseEfecto(efectoOriginal)
  if (!parsed) {
    throw new Error(`Card ${cardId}: efecto no parseable: "${efectoOriginal}"`)
  }
  const out: Condicional = { tipo: cond.tipo }
  if (cond.valor) out.valor = cond.valor
  if (parsed.fuerzaDelta !== undefined) out.fuerzaDelta = parsed.fuerzaDelta
  if (parsed.sideEffect !== undefined) out.sideEffect = parsed.sideEffect
  out.efectoTexto = efectoOriginal
  return out
}

function migrateFile(path: string): { cardsCount: number; condCount: number } {
  console.log(`\n→ Migrando ${path}`)
  const raw = readFileSync(path, 'utf8')
  const doc = parse(raw) as CardsFile
  if (!doc.cards || !Array.isArray(doc.cards)) {
    throw new Error(`${path}: no se encontró 'cards' como lista.`)
  }
  let condCount = 0
  for (const card of doc.cards) {
    card.condicionales = card.condicionales.map((c) => migrateCondicional(c, card.id))
    condCount += card.condicionales.length
  }
  // Re-escribir con stringify de yaml lib (preserva comentarios solo si parseDocument se usa,
  // por simplicidad re-pegamos el header de comentarios del original).
  const headerMatch = raw.match(/^(#[^\n]*\n)+/m)
  const header = headerMatch ? headerMatch[0] + '\n' : ''
  const body = stringify(doc, { lineWidth: 0 })
  writeFileSync(path, header + body, 'utf8')
  console.log(`  ${doc.cards.length} cartas, ${condCount} condicionales migrados.`)
  return { cardsCount: doc.cards.length, condCount }
}

// MAIN
selfTest()

const base = resolve(process.cwd(), 'docs/playtest/cards-v4.1')
const stats1 = migrateFile(resolve(base, 'tezhal.yaml'))
const stats2 = migrateFile(resolve(base, 'wuron.yaml'))

console.log('\n=== Migración completada ===')
console.log(`Total cards: ${stats1.cardsCount + stats2.cardsCount} (esperado: 30)`)
console.log(`Total condicionales: ${stats1.condCount + stats2.condCount}`)

if (stats1.cardsCount + stats2.cardsCount !== 30) {
  console.error('✗ Count de cards != 30. Algo falló.')
  process.exit(1)
}

console.log('\n✓ Step 0 OK. Validar manualmente los YAMLs y continuar con Phase 1 step 1.')
