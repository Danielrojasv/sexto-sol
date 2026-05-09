// Seedable deterministic RNG. Splitmix32 para expansión de seed + xoshiro128**
// como generador. Mismo input → mismo output, siempre. Reemplaza Math.random
// y crypto.randomUUID en todo el código del engine.
//
// Port de /opt/myl-game/src/engine/rng.ts (sin cambios estructurales).

export interface Rng {
  /** Devuelve un float en [0, 1). */
  next(): number
  /** Devuelve un int en [0, max). */
  nextInt(max: number): number
  /** Devuelve un identificador estilo UUID determinista. */
  nextId(): string
  /** Forkea un nuevo RNG con seed derivada (útil para sub-sistemas). */
  fork(label: string): Rng
  /** Snapshot del estado interno. */
  snapshot(): RngState
}

export interface RngState {
  s0: number
  s1: number
  s2: number
  s3: number
  counter: number
}

function splitmix32(a: number): number {
  a |= 0
  a = (a + 0x9e3779b9) | 0
  let t = a ^ (a >>> 16)
  t = Math.imul(t, 0x21f0aaad)
  t = t ^ (t >>> 15)
  t = Math.imul(t, 0x735a2d97)
  return (t ^ (t >>> 15)) >>> 0
}

function hashString(str: string): number {
  let h = 0x811c9dc5 | 0
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

function stateFromSeed(seed: number): RngState {
  const s0 = splitmix32(seed)
  const s1 = splitmix32(s0)
  const s2 = splitmix32(s1)
  const s3 = splitmix32(s2)
  return { s0, s1, s2, s3, counter: 0 }
}

export function createRng(seed: number | string, restoreState?: RngState): Rng {
  const seedNum = typeof seed === 'string' ? hashString(seed) : seed >>> 0
  const state: RngState = restoreState ? { ...restoreState } : stateFromSeed(seedNum)

  function nextRaw(): number {
    const result = (Math.imul(state.s1, 5) << 7) | (Math.imul(state.s1, 5) >>> 25)
    const rotResult = (Math.imul(result, 9) | 0) >>> 0
    const t = (state.s1 << 9) | 0
    state.s2 ^= state.s0
    state.s3 ^= state.s1
    state.s1 ^= state.s2
    state.s0 ^= state.s3
    state.s2 ^= t
    state.s3 = ((state.s3 << 11) | (state.s3 >>> 21)) | 0
    state.counter = (state.counter + 1) | 0
    return rotResult >>> 0
  }

  return {
    next() {
      return nextRaw() / 0x100000000
    },
    nextInt(max: number) {
      if (max <= 0) return 0
      return nextRaw() % max
    },
    nextId() {
      const a = nextRaw().toString(16).padStart(8, '0')
      const b = nextRaw().toString(16).padStart(8, '0')
      const c = nextRaw().toString(16).padStart(8, '0')
      const d = nextRaw().toString(16).padStart(8, '0')
      return `${a}-${b.slice(0, 4)}-4${b.slice(4, 7)}-${c.slice(0, 4)}-${c}${d.slice(0, 4)}`
    },
    fork(label: string) {
      return createRng(seedNum ^ hashString(label) ^ state.counter)
    },
    snapshot() {
      return { ...state }
    },
  }
}

/** Fisher-Yates shuffle usando el RNG provisto. Puro: devuelve un array nuevo. */
export function shuffle<T>(rng: Rng, arr: readonly T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1)
    const tmp = a[i] as T
    a[i] = a[j] as T
    a[j] = tmp
  }
  return a
}
