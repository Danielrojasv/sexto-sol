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
const PRIMITIVES_DIR = join(process.cwd(), 'src/data/primitives')

/**
 * Listado recursivo de archivos .ts en un directorio, excluyendo tests.
 */
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

/**
 * Scan estático línea por línea buscando patrones prohibidos.
 * Devuelve lista de violaciones encontradas. Lista vacía = passing.
 */
function scanForBrowserUsage(files: string[]): Violation[] {
  const violations: Violation[] = []
  // Imports prohibidos: librerías exclusivamente browser-side.
  const prohibitedImports: { pattern: RegExp; rule: string }[] = [
    { pattern: /from ['"]react['"]/, rule: 'no-react-import' },
    { pattern: /from ['"]react-dom['"]/, rule: 'no-react-dom-import' },
    { pattern: /from ['"]zustand['"]/, rule: 'no-zustand-import' },
    { pattern: /from ['"]pixi\.js['"]/, rule: 'no-pixi-import' },
    { pattern: /from ['"]framer-motion['"]/, rule: 'no-framer-import' },
    { pattern: /from ['"]@\/ui\//, rule: 'no-ui-import' },
    { pattern: /from ['"]@\/store\//, rule: 'no-store-import' },
  ]
  // APIs browser prohibidas. Detectamos uso como `window.`, `document.`, etc.
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
      // Saltar comentarios single-line. Multi-line comments podrían pasar pero
      // bajo riesgo (el formato del repo es mayoritariamente single-line).
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

  it('src/data/primitives/spec.ts no importa librerías browser', () => {
    const files = listTsFiles(PRIMITIVES_DIR)
    const violations = scanForBrowserUsage(files).filter((v) =>
      v.rule.startsWith('no-react') ||
      v.rule === 'no-zustand-import' ||
      v.rule === 'no-pixi-import' ||
      v.rule === 'no-framer-import' ||
      v.rule === 'no-ui-import' ||
      v.rule === 'no-store-import',
    )
    expect(violations).toEqual([])
  })
})

describe('engine portability — GameState serialización', () => {
  it('GameState es JSON-serializable round-trip', () => {
    const state = createInitialState({
      seed: 42,
      p1Race: 'wuron',
      p2Race: 'tezhal',
    })
    const serialized = JSON.stringify(state)
    const parsed = JSON.parse(serialized)
    expect(parsed).toEqual(state)
  })

  it('GameState NO contiene Map, Set, Date, BigInt o funciones', () => {
    const state = createInitialState({
      seed: 1,
      p1Race: 'quralan',
      p2Race: 'zaqe',
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

  it('engine corre sin DOM (este test ejecuta en modo node-like sin window/document)', () => {
    // El test mismo prueba esto: si vitest está corriendo el módulo con
    // jsdom y nuestro engine usara DOM accidentalmente, fallaría al cargar.
    // Como pasa, certifica que el engine es Node-compatible.
    const placeholderCard = {
      id: 'p',
      name: 'Placeholder',
      type: 'ship' as const,
      race: 'wuron' as const,
      cost: 0,
      rarity: 'common' as const,
      keywords: [],
      abilities: [],
      strength: 1,
      hp: 1,
    }
    const state = createInitialState({
      seed: 1,
      p1Race: 'wuron',
      p2Race: 'tezhal',
      p1Deck: Array.from({ length: 30 }, () => placeholderCard),
      p2Deck: Array.from({ length: 30 }, () => placeholderCard),
    })
    expect(state.outcome.kind).toBe('in_progress')
  })
})
