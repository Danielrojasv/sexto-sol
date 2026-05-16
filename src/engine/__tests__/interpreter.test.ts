// interpreter.test.ts v4.2 — "Premonición como Lectura"
//
// Tests del nuevo orden de aplicación §4.2:
//   base → lectura rival → bonus planeta → condicionales → habilidades héroe → eclipse

import { describe, expect, it } from 'vitest'
import { interpretCondicionales, penalizacionPorPasarConAcierto } from '../interpreter'
import { mockCard, mockPlanet } from './_helpers'
import type { HeroAttributes, InterpretResult } from '../types'

const ZERO: HeroAttributes = { fuerza: 0, resguardo: 0, resonancia: 0 }

function baseInput(opts: Partial<Parameters<typeof interpretCondicionales>[0]> = {}) {
  return {
    card: mockCard({ categoria: 'Ataque', fuerzaBase: 3, penalizacionAcierto: 2 }),
    miPremonicion: 'Ataque' as const,
    oponentePremonicion: 'Defensa' as const,
    oponenteCategoria: undefined,
    planetElegido: undefined,
    tramo: 'nebulosa' as const,
    heroEstado: 'neutral' as const,
    raza: 'Tezhal' as const,
    owner: 'a' as const,
    atributosPropio: ZERO,
    atributosOponente: ZERO,
    eclipseActivo: false,
    eclipseInvocador: undefined,
    ...opts,
  }
}

describe('interpretCondicionales — lectura del rival', () => {
  it('rival acertó → carta pierde penalizacionAcierto', () => {
    const input = baseInput({
      card: mockCard({ categoria: 'Ataque', fuerzaBase: 5, penalizacionAcierto: 2 }),
      oponentePremonicion: 'Ataque', // acertó mi categoría
    })
    const r = interpretCondicionales(input)
    // base 5 - 2 (acierto) = 3
    expect(r.fuerzaFinal).toBe(3)
  })

  it('rival falló → carta gana +1', () => {
    const input = baseInput({
      card: mockCard({ categoria: 'Ataque', fuerzaBase: 3, penalizacionAcierto: 2 }),
      oponentePremonicion: 'Defensa', // falló
    })
    const r = interpretCondicionales(input)
    // base 3 + 1 (fallo) = 4
    expect(r.fuerzaFinal).toBe(4)
  })

  it('penalizacionAcierto = 0 → acertar no debilita', () => {
    const input = baseInput({
      card: mockCard({ categoria: 'Ataque', fuerzaBase: 3, penalizacionAcierto: 0 }),
      oponentePremonicion: 'Ataque',
    })
    const r = interpretCondicionales(input)
    expect(r.fuerzaFinal).toBe(3)
  })
})

describe('Bonus de planeta', () => {
  it('+1 si categoria coincide en Nebulosa', () => {
    const input = baseInput({
      card: mockCard({ categoria: 'Ataque', fuerzaBase: 3, penalizacionAcierto: 0 }),
      oponentePremonicion: 'Ataque', // rival acertó, pero pen=0
      planetElegido: mockPlanet({ categoria: 'Ataque' }),
      tramo: 'nebulosa',
    })
    const r = interpretCondicionales(input)
    // base 3 + 0 (acertó pero pen=0) + 1 (bonus planeta) = 4
    expect(r.fuerzaFinal).toBe(4)
  })

  it('NO bonus en Sexto Sol aunque haya planet residual', () => {
    const input = baseInput({
      card: mockCard({ categoria: 'Ataque', fuerzaBase: 3, penalizacionAcierto: 0 }),
      oponentePremonicion: 'Ataque',
      planetElegido: mockPlanet({ categoria: 'Ataque' }),
      tramo: 'sexto_sol',
    })
    const r = interpretCondicionales(input)
    // base 3 + 0 + 0 (sin bonus) = 3
    expect(r.fuerzaFinal).toBe(3)
  })
})

describe('Condicionales sobre estado del juego', () => {
  it('heroe_estado triggera si héroe está en valor', () => {
    const input = baseInput({
      card: mockCard({
        categoria: 'Defensa', // evita Tezhal Despertado +1 (que solo aplica a Atq)
        fuerzaBase: 3,
        penalizacionAcierto: 0,
        condicionales: [{ tipo: 'heroe_estado', valor: 'despertado', fuerzaDelta: 2 }],
      }),
      oponentePremonicion: 'Defensa', // pen=0, no afecta
      heroEstado: 'despertado',
    })
    const r = interpretCondicionales(input)
    // base 3 + 0 + 2 (clause) = 5
    expect(r.fuerzaFinal).toBe(5)
  })

  it('tramo: triggera si tramo coincide', () => {
    const input = baseInput({
      card: mockCard({
        categoria: 'Ataque',
        fuerzaBase: 3,
        penalizacionAcierto: 0,
        condicionales: [{ tipo: 'tramo', valor: 'sexto_sol', fuerzaDelta: 2 }],
      }),
      oponentePremonicion: 'Ataque',
      tramo: 'sexto_sol',
    })
    const r = interpretCondicionales(input)
    expect(r.fuerzaFinal).toBe(5)
  })

  it('atributo_propio: triggera si umbral cumplido', () => {
    const input = baseInput({
      card: mockCard({
        categoria: 'Ataque',
        fuerzaBase: 3,
        penalizacionAcierto: 0,
        condicionales: [
          { tipo: 'atributo_propio', valorAtributo: 'Defensa', umbral: 5, fuerzaDelta: 2 },
        ],
      }),
      oponentePremonicion: 'Ataque',
      atributosPropio: { fuerza: 0, resguardo: 5, resonancia: 0 },
    })
    const r = interpretCondicionales(input)
    expect(r.fuerzaFinal).toBe(5)
  })

  it('eclipse_activo: triggera si Eclipse invocado', () => {
    const input = baseInput({
      card: mockCard({
        categoria: 'Ataque',
        fuerzaBase: 3,
        penalizacionAcierto: 0,
        condicionales: [{ tipo: 'eclipse_activo', fuerzaDelta: 2 }],
      }),
      oponentePremonicion: 'Ataque',
      eclipseActivo: true,
    })
    const r = interpretCondicionales(input)
    // base 3 + 0 + 2 (clause) = 5 (no se duplica porque no es invocador)
    expect(r.fuerzaFinal).toBe(5)
  })
})

describe('Habilidades de héroe', () => {
  it('Tezhal Despertado: +1 a cartas Ataque', () => {
    const input = baseInput({
      card: mockCard({ categoria: 'Ataque', fuerzaBase: 3, penalizacionAcierto: 0 }),
      oponentePremonicion: 'Ataque',
      heroEstado: 'despertado',
      raza: 'Tezhal',
    })
    const r = interpretCondicionales(input)
    // base 3 + 0 + 1 (Tezhal Despertado) = 4
    expect(r.fuerzaFinal).toBe(4)
  })

  it('Würon Despertado: +1 si MI premonición acierta categoría del rival', () => {
    const input = baseInput({
      card: mockCard({ categoria: 'Defensa', fuerzaBase: 3, penalizacionAcierto: 0 }),
      miPremonicion: 'Ataque', // predijo Ataque
      oponentePremonicion: 'Ritual', // su predicción sobre mí
      oponenteCategoria: 'Ataque', // el oponente jugó Ataque → MI predicción Ataque acierta
      heroEstado: 'despertado',
      raza: 'Würon',
    })
    const r = interpretCondicionales(input)
    // base 3 + 1 (rival falló — predijo Ritual, mi carta es Defensa) + 1 (Würon Despertado acertó) = 5
    expect(r.fuerzaFinal).toBe(5)
  })
})

describe('Eclipse', () => {
  it('×2 al total si owner invocó', () => {
    const input = baseInput({
      card: mockCard({ categoria: 'Ataque', fuerzaBase: 3, penalizacionAcierto: 0 }),
      oponentePremonicion: 'Ataque',
      eclipseActivo: true,
      eclipseInvocador: 'a',
      owner: 'a',
    })
    const r = interpretCondicionales(input)
    // (3 + 0) * 2 = 6
    expect(r.fuerzaFinal).toBe(6)
  })

  it('NO ×2 si el invocador es el otro jugador', () => {
    const input = baseInput({
      card: mockCard({ categoria: 'Ataque', fuerzaBase: 3, penalizacionAcierto: 0 }),
      oponentePremonicion: 'Ataque',
      eclipseActivo: true,
      eclipseInvocador: 'b',
      owner: 'a',
    })
    const r = interpretCondicionales(input)
    expect(r.fuerzaFinal).toBe(3)
  })
})

describe('Side effects', () => {
  it('Side effect de condicional triggereada se devuelve', () => {
    const input = baseInput({
      card: mockCard({
        categoria: 'Ataque',
        fuerzaBase: 3,
        penalizacionAcierto: 0,
        condicionales: [
          {
            tipo: 'heroe_estado',
            valor: 'despertado',
            sideEffect: { tipo: 'descarte_oponente', valor: 1 },
          },
        ],
      }),
      oponentePremonicion: 'Ataque',
      heroEstado: 'despertado',
    })
    const r: InterpretResult = interpretCondicionales(input)
    expect(r.sideEffects).toHaveLength(1)
    expect(r.sideEffects[0]).toEqual({ tipo: 'descarte_oponente', valor: 1 })
  })
})

describe('Fuerza nunca negativa', () => {
  it('Math.max(0, ...) clampea', () => {
    const input = baseInput({
      card: mockCard({ categoria: 'Ataque', fuerzaBase: 1, penalizacionAcierto: 99 }),
      oponentePremonicion: 'Ataque',
    })
    const r = interpretCondicionales(input)
    expect(r.fuerzaFinal).toBe(0)
  })
})

describe('penalizacionPorPasarConAcierto', () => {
  it('acertaste sin carta → -1 al rival', () => {
    expect(penalizacionPorPasarConAcierto('Ataque', 'Ataque')).toBe(1)
  })

  it('fallaste sin carta → 0', () => {
    expect(penalizacionPorPasarConAcierto('Defensa', 'Ataque')).toBe(0)
  })

  it('rival también pasó → 0', () => {
    expect(penalizacionPorPasarConAcierto('Ataque', undefined)).toBe(0)
  })
})
