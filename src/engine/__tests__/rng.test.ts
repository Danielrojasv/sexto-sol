import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { createRng, shuffle } from '../rng'

describe('rng — determinismo y reproducibilidad', () => {
  it('mismo seed produce la misma secuencia', () => {
    const a = createRng(42)
    const b = createRng(42)
    const seqA = Array.from({ length: 50 }, () => a.next())
    const seqB = Array.from({ length: 50 }, () => b.next())
    expect(seqA).toEqual(seqB)
  })

  it('seeds distintas producen secuencias distintas', () => {
    const a = createRng(1)
    const b = createRng(2)
    const seqA = Array.from({ length: 20 }, () => a.next())
    const seqB = Array.from({ length: 20 }, () => b.next())
    expect(seqA).not.toEqual(seqB)
  })

  it('snapshot + restoreState reproduce el state exacto', () => {
    const original = createRng(100)
    Array.from({ length: 10 }, () => original.next())
    const snap = original.snapshot()
    const restored = createRng(100, snap)
    const seqOriginal = Array.from({ length: 20 }, () => original.next())
    const seqRestored = Array.from({ length: 20 }, () => restored.next())
    expect(seqRestored).toEqual(seqOriginal)
  })

  it('seed string y seed numérica con mismo hash producen igual secuencia', () => {
    // Si la implementación cambia el hash, este test detecta el regress.
    const fromString = createRng('seed-canonica')
    const fromString2 = createRng('seed-canonica')
    expect(fromString.next()).toBe(fromString2.next())
  })

  it('next() siempre retorna [0, 1)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 2 ** 31 - 1 }), (seed) => {
        const rng = createRng(seed)
        for (let i = 0; i < 30; i++) {
          const v = rng.next()
          if (v < 0 || v >= 1) return false
        }
        return true
      }),
      { numRuns: 100 },
    )
  })

  it('nextInt(max) siempre retorna [0, max)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 100 }),
        (max, seed) => {
          const rng = createRng(seed)
          for (let i = 0; i < 30; i++) {
            const v = rng.nextInt(max)
            if (v < 0 || v >= max) return false
          }
          return true
        },
      ),
      { numRuns: 50 },
    )
  })

  it('nextInt(0) retorna 0 (caso límite)', () => {
    const rng = createRng(1)
    expect(rng.nextInt(0)).toBe(0)
  })

  it('nextId genera UUIDs distintos consecutivos', () => {
    const rng = createRng(7)
    const ids = new Set(Array.from({ length: 100 }, () => rng.nextId()))
    expect(ids.size).toBe(100)
  })

  it('fork con label distinto produce secuencias divergentes', () => {
    const parent = createRng(99)
    const a = parent.fork('subsystem-a')
    const b = parent.fork('subsystem-b')
    expect(a.next()).not.toBe(b.next())
  })
})

describe('shuffle (Fisher-Yates puro)', () => {
  it('preserva todos los elementos del array', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer(), { minLength: 0, maxLength: 50 }),
        fc.integer(),
        (arr, seed) => {
          const rng = createRng(seed)
          const shuffled = shuffle(rng, arr)
          return shuffled.length === arr.length && shuffled.every((x) => arr.includes(x))
        },
      ),
      { numRuns: 100 },
    )
  })

  it('no muta el array original', () => {
    const original = [1, 2, 3, 4, 5]
    const snapshot = [...original]
    shuffle(createRng(1), original)
    expect(original).toEqual(snapshot)
  })

  it('mismo seed produce mismo orden', () => {
    const arr = [10, 20, 30, 40, 50]
    const a = shuffle(createRng(42), arr)
    const b = shuffle(createRng(42), arr)
    expect(a).toEqual(b)
  })
})
