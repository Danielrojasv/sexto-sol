// Tests de portabilidad del engine — garantizan que `src/engine/` es
// trasladable a un contexto Node.js (Fase 6 multiplayer backend) sin
// reescritura. Scan estático detecta imports/usos prohibidos del browser.
//
// Pasar estos tests = el engine puede ejecutarse en Fastify/Express sin
// polyfills ni shims.

import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { createInitialState } from '../initialState'

const ENGINE_DIR = join(process.cwd(), 'src/engine')

function listTsFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      if (entry === '__tests__' || entry === 'node_modules') continue
      out.push(...listTsFiles(full))
    } else if (entry.endsWith('.ts')) {
      out.push(full)
    }
  }
  return out
}

interface Violation {
  file: string
  line: number
  text: string
  rule: string
}

function scanForBrowserUsage(files: string[]): Violation[] {
  const violations: Violation[] = []
  const prohibitedImports: { pattern: RegExp; rule: string }[] = [
    { pattern: /from ['"]react['"]/, rule: 'no-react-import' },
    { pattern: /from ['"]react-dom['"]/, rule: 'no-react-dom-import' },
    { pattern: /from ['"]zustand['"]/, rule: 'no-zustand-import' },
    { pattern: /from ['"]pixi\.js['"]/, rule: 'no-pixi-import' },
    { pattern: /from ['"]framer-motion['"]/, rule: 'no-framer-import' },
    { pattern: /from ['"]@\/ui\//, rule: 'no-ui-import' },
    { pattern: /from ['"]@\/store\//, rule: 'no-store-import' },
  ]
  const prohibitedApis: { pattern: RegExp; rule: string }[] = [
    { pattern: /\bwindow\./, rule: 'no-window' },
    { pattern: /\bdocument\./, rule: 'no-document' },
    { pattern: /\blocalStorage\b/, rule: 'no-localStorage' },
    { pattern: /\bsessionStorage\b/, rule: 'no-sessionStorage' },
    { pattern: /\bfetch\s*\(/, rule: 'no-fetch' },
    { pattern: /\bMath\.random\s*\(/, rule: 'no-math-random' },
    { pattern: /\bDate\.now\s*\(/, rule: 'no-date-now' },
  ]
  for (const file of files) {
    const lines = readFileSync(file, 'utf8').split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? ''
      const trimmed = line.trim()
      if (trimmed.startsWith('//')) continue
      for (const { pattern, rule } of prohibitedImports) {
        if (pattern.test(line)) {
          violations.push({ file, line: i + 1, text: line.trim(), rule })
        }
      }
      for (const { pattern, rule } of prohibitedApis) {
        if (pattern.test(line)) {
          violations.push({ file, line: i + 1, text: line.trim(), rule })
        }
      }
    }
  }
  return violations
}

describe('engine portability — scan estático', () => {
  it('src/engine/ no importa librerías exclusivamente browser', () => {
    const files = listTsFiles(ENGINE_DIR)
    const violations = scanForBrowserUsage(files).filter((v) =>
      v.rule.startsWith('no-react') ||
      v.rule === 'no-zustand-import' ||
      v.rule === 'no-pixi-import' ||
      v.rule === 'no-framer-import' ||
      v.rule === 'no-ui-import' ||
      v.rule === 'no-store-import',
    )
    if (violations.length > 0) {
      const detail = violations
        .map((v) => `  ${v.file}:${v.line} (${v.rule}) — ${v.text}`)
        .join('\n')
      throw new Error(`Imports browser detectados en src/engine/:\n${detail}`)
    }
    expect(violations).toEqual([])
  })

  it('src/engine/ no usa APIs del browser (window, document, localStorage, fetch)', () => {
    const files = listTsFiles(ENGINE_DIR)
    const violations = scanForBrowserUsage(files).filter(
      (v) =>
        v.rule === 'no-window' ||
        v.rule === 'no-document' ||
        v.rule === 'no-localStorage' ||
        v.rule === 'no-sessionStorage' ||
        v.rule === 'no-fetch',
    )
    if (violations.length > 0) {
      const detail = violations
        .map((v) => `  ${v.file}:${v.line} (${v.rule}) — ${v.text}`)
        .join('\n')
      throw new Error(`APIs browser detectadas en src/engine/:\n${detail}`)
    }
    expect(violations).toEqual([])
  })

  it('src/engine/ no usa Math.random (debe usar RNG embebido en state)', () => {
    const files = listTsFiles(ENGINE_DIR)
    const violations = scanForBrowserUsage(files).filter((v) => v.rule === 'no-math-random')
    if (violations.length > 0) {
      const detail = violations
        .map((v) => `  ${v.file}:${v.line} — ${v.text}`)
        .join('\n')
      throw new Error(`Math.random detectado en src/engine/:\n${detail}`)
    }
    expect(violations).toEqual([])
  })

  it('src/engine/ no usa Date.now (la "fecha" del juego es turn count)', () => {
    const files = listTsFiles(ENGINE_DIR)
    const violations = scanForBrowserUsage(files).filter((v) => v.rule === 'no-date-now')
    if (violations.length > 0) {
      const detail = violations
        .map((v) => `  ${v.file}:${v.line} — ${v.text}`)
        .join('\n')
      throw new Error(`Date.now detectado en src/engine/:\n${detail}`)
    }
    expect(violations).toEqual([])
  })
})

const SAMPLE_DECK = Array.from({ length: 20 }, (_, i) => `TZH-${String(i + 1).padStart(3, '0')}`)
const SAMPLE_DECK_B = Array.from({ length: 20 }, (_, i) => `WUR-${String(i + 1).padStart(3, '0')}`)

describe('engine portability — GameState serialización', () => {
  it('GameState es JSON-serializable round-trip', () => {
    const state = createInitialState({
      seed: 42,
      modo: 'vsIA',
      deckA: { raza: 'Tezhal', cardIds: SAMPLE_DECK, heroId: 'HRO-TEZHAL' },
      deckB: { raza: 'Würon', cardIds: SAMPLE_DECK_B, heroId: 'HRO-WURON' },
      planetIdsNebulosa: ['PLN-NEB-ATQ', 'PLN-NEB-DEF', 'PLN-NEB-RIT'],
      planetIdsEstrellas: ['PLN-EST-ATQ', 'PLN-EST-DEF', 'PLN-EST-RIT'],
    })
    const serialized = JSON.stringify(state)
    const parsed = JSON.parse(serialized)
    expect(parsed).toEqual(state)
  })

  it('GameState NO contiene Map, Set, Date, BigInt o funciones', () => {
    const state = createInitialState({
      seed: 1,
      modo: 'vsIA',
      deckA: { raza: 'Tezhal', cardIds: SAMPLE_DECK, heroId: 'HRO-TEZHAL' },
      deckB: { raza: 'Würon', cardIds: SAMPLE_DECK_B, heroId: 'HRO-WURON' },
      planetIdsNebulosa: ['PLN-NEB-ATQ', 'PLN-NEB-DEF', 'PLN-NEB-RIT'],
      planetIdsEstrellas: ['PLN-EST-ATQ', 'PLN-EST-DEF', 'PLN-EST-RIT'],
    })
    function checkPlainValue(v: unknown, path: string): void {
      if (v === null) return
      const t = typeof v
      if (t === 'function') {
        throw new Error(`Función en GameState en ${path}`)
      }
      if (t !== 'object') return
      if (v instanceof Map) throw new Error(`Map en GameState en ${path}`)
      if (v instanceof Set) throw new Error(`Set en GameState en ${path}`)
      if (v instanceof Date) throw new Error(`Date en GameState en ${path}`)
      if (typeof v === 'bigint') throw new Error(`BigInt en GameState en ${path}`)
      if (Array.isArray(v)) {
        v.forEach((item, i) => checkPlainValue(item, `${path}[${i}]`))
        return
      }
      for (const k of Object.keys(v as Record<string, unknown>)) {
        checkPlainValue((v as Record<string, unknown>)[k], `${path}.${k}`)
      }
    }
    expect(() => checkPlainValue(state, 'state')).not.toThrow()
  })

  it('engine corre sin DOM', () => {
    const state = createInitialState({
      seed: 99,
      modo: 'vsIA',
      deckA: { raza: 'Tezhal', cardIds: SAMPLE_DECK, heroId: 'HRO-TEZHAL' },
      deckB: { raza: 'Würon', cardIds: SAMPLE_DECK_B, heroId: 'HRO-WURON' },
      planetIdsNebulosa: ['PLN-NEB-ATQ', 'PLN-NEB-DEF', 'PLN-NEB-RIT'],
      planetIdsEstrellas: ['PLN-EST-ATQ', 'PLN-EST-DEF', 'PLN-EST-RIT'],
    })
    expect(state.tramo).toBe('nebulosa')
    expect(state.turno).toBe(1)
  })
})
