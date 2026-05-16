import { describe, expect, it } from 'vitest'
import { aplicarBonusWuronDespertada, interpretCondicionales } from '../interpreter'
import { mockCard, mockPlanet } from './_helpers'

describe('interpretCondicionales — cláusulas básicas', () => {
  it('premonicion_propia activa cuando miPremonicion === valor', () => {
    const card = mockCard({
      categoria: 'Ataque',
      fuerzaBase: 3,
      condicionales: [{ tipo: 'premonicion_propia', valor: 'Ataque', fuerzaDelta: 2 }],
    })
    const result = interpretCondicionales({
      card,
      miPremonicion: 'Ataque',
      oponentePremonicion: 'Defensa',
      planetElegido: undefined,
      tramo: 'nebulosa',
      heroEstado: 'neutral',
      raza: 'Tezhal',
      owner: 'a',
    })
    expect(result.fuerzaFinal).toBe(5)
  })

  it('premonicion_propia NO activa si miPremonicion ≠ valor', () => {
    const card = mockCard({
      categoria: 'Ataque',
      fuerzaBase: 3,
      condicionales: [{ tipo: 'premonicion_propia', valor: 'Ataque', fuerzaDelta: 2 }],
    })
    const result = interpretCondicionales({
      card,
      miPremonicion: 'Defensa',
      oponentePremonicion: 'Defensa',
      planetElegido: undefined,
      tramo: 'nebulosa',
      heroEstado: 'neutral',
      raza: 'Tezhal',
      owner: 'a',
    })
    expect(result.fuerzaFinal).toBe(3)
  })

  it('premonicion_oponente activa cuando oponentePremonicion === valor', () => {
    const card = mockCard({
      categoria: 'Defensa',
      fuerzaBase: 2,
      condicionales: [{ tipo: 'premonicion_oponente', valor: 'Ataque', fuerzaDelta: 1 }],
    })
    const result = interpretCondicionales({
      card,
      miPremonicion: 'Defensa',
      oponentePremonicion: 'Ataque',
      planetElegido: undefined,
      tramo: 'nebulosa',
      heroEstado: 'neutral',
      raza: 'Würon',
      owner: 'a',
    })
    expect(result.fuerzaFinal).toBe(3)
  })

  it('premonicion_acierta activa si oponentePremonicion === card.categoria', () => {
    const card = mockCard({
      categoria: 'Defensa',
      fuerzaBase: 2,
      condicionales: [{ tipo: 'premonicion_acierta', fuerzaDelta: 3 }],
    })
    const result = interpretCondicionales({
      card,
      miPremonicion: 'Ataque',
      oponentePremonicion: 'Defensa',
      planetElegido: undefined,
      tramo: 'nebulosa',
      heroEstado: 'neutral',
      raza: 'Würon',
      owner: 'a',
    })
    expect(result.fuerzaFinal).toBe(5)
  })

  it('múltiples condicionales se suman', () => {
    const card = mockCard({
      categoria: 'Ataque',
      fuerzaBase: 3,
      condicionales: [
        { tipo: 'premonicion_propia', valor: 'Ataque', fuerzaDelta: 1 },
        { tipo: 'premonicion_oponente', valor: 'Defensa', fuerzaDelta: 2 },
        { tipo: 'premonicion_acierta', fuerzaDelta: -2 },
      ],
    })
    const result = interpretCondicionales({
      card,
      miPremonicion: 'Ataque',
      oponentePremonicion: 'Ataque', // acierta categoría Ataque de la carta
      planetElegido: undefined,
      tramo: 'nebulosa',
      heroEstado: 'neutral',
      raza: 'Tezhal',
      owner: 'a',
    })
    // base 3 + 1 (propia Atq) + 0 (oponente Def NO aplica, dijo Atq) − 2 (acierta) = 2
    expect(result.fuerzaFinal).toBe(2)
  })

  it('sideEffect se devuelve, no se aplica', () => {
    const card = mockCard({
      condicionales: [
        {
          tipo: 'premonicion_propia',
          valor: 'Ataque',
          sideEffect: { tipo: 'descarte', target: 'oponente', valor: 1 },
        },
      ],
    })
    const result = interpretCondicionales({
      card,
      miPremonicion: 'Ataque',
      oponentePremonicion: 'Defensa',
      planetElegido: undefined,
      tramo: 'nebulosa',
      heroEstado: 'neutral',
      raza: 'Tezhal',
      owner: 'a',
    })
    expect(result.sideEffects).toHaveLength(1)
    expect(result.sideEffects[0]).toEqual({ tipo: 'descarte', target: 'oponente', valor: 1 })
  })

  it('fuerza final nunca negativa (Math.max(0, ...))', () => {
    const card = mockCard({
      fuerzaBase: 2,
      condicionales: [
        { tipo: 'premonicion_propia', valor: 'Ataque', fuerzaDelta: -10 },
      ],
    })
    const result = interpretCondicionales({
      card,
      miPremonicion: 'Ataque',
      oponentePremonicion: 'Defensa',
      planetElegido: undefined,
      tramo: 'nebulosa',
      heroEstado: 'neutral',
      raza: 'Tezhal',
      owner: 'a',
    })
    expect(result.fuerzaFinal).toBe(0)
  })
})

describe('Bonus de planeta', () => {
  it('+1 cuando categoria de carta === categoria del planeta-elegido en Nebulosa', () => {
    const card = mockCard({ categoria: 'Ataque', fuerzaBase: 3, condicionales: [{ tipo: 'premonicion_propia', valor: 'Ritual', fuerzaDelta: 99 }] })
    const planet = mockPlanet({ tramo: 'Nebulosa', categoria: 'Ataque' })
    const result = interpretCondicionales({
      card,
      miPremonicion: 'Ataque',
      oponentePremonicion: 'Defensa',
      planetElegido: planet,
      tramo: 'nebulosa',
      heroEstado: 'neutral',
      raza: 'Tezhal',
      owner: 'a',
    })
    // base 3 + 0 (cláusula premonicion_propia Ritual no aplica, A=Atq) + 1 (bonus planeta) = 4
    expect(result.fuerzaFinal).toBe(4)
  })

  it('NO aplica bonus en Sexto Sol', () => {
    const card = mockCard({ categoria: 'Ataque', fuerzaBase: 3, condicionales: [{ tipo: 'premonicion_propia', valor: 'Ritual', fuerzaDelta: 99 }] })
    const planet = mockPlanet({ tramo: 'Nebulosa', categoria: 'Ataque' })
    const result = interpretCondicionales({
      card,
      miPremonicion: 'Ataque',
      oponentePremonicion: 'Defensa',
      planetElegido: planet,
      tramo: 'sexto_sol',
      heroEstado: 'neutral',
      raza: 'Tezhal',
      owner: 'a',
    })
    expect(result.fuerzaFinal).toBe(3)
  })

  it('NO aplica bonus si categoría no coincide', () => {
    const card = mockCard({ categoria: 'Defensa', fuerzaBase: 2, condicionales: [{ tipo: 'premonicion_propia', valor: 'Ritual', fuerzaDelta: 99 }] })
    const planet = mockPlanet({ tramo: 'Nebulosa', categoria: 'Ataque' })
    const result = interpretCondicionales({
      card,
      miPremonicion: 'Defensa',
      oponentePremonicion: 'Defensa',
      planetElegido: planet,
      tramo: 'nebulosa',
      heroEstado: 'neutral',
      raza: 'Tezhal',
      owner: 'a',
    })
    expect(result.fuerzaFinal).toBe(2)
  })
})

describe('Habilidades de héroe pasivas', () => {
  it('Tezhal Despertado: +1 a cartas Ataque', () => {
    const card = mockCard({ categoria: 'Ataque', fuerzaBase: 3, condicionales: [{ tipo: 'premonicion_propia', valor: 'Ritual', fuerzaDelta: 0 }] })
    const result = interpretCondicionales({
      card,
      miPremonicion: 'Ataque',
      oponentePremonicion: 'Defensa',
      planetElegido: undefined,
      tramo: 'sexto_sol',
      heroEstado: 'despertado',
      raza: 'Tezhal',
      owner: 'a',
    })
    expect(result.fuerzaFinal).toBe(4)
  })

  it('Tezhal Despertado: NO afecta cartas Defensa', () => {
    const card = mockCard({ categoria: 'Defensa', fuerzaBase: 3, condicionales: [{ tipo: 'premonicion_propia', valor: 'Ritual', fuerzaDelta: 0 }] })
    const result = interpretCondicionales({
      card,
      miPremonicion: 'Defensa',
      oponentePremonicion: 'Defensa',
      planetElegido: undefined,
      tramo: 'sexto_sol',
      heroEstado: 'despertado',
      raza: 'Tezhal',
      owner: 'a',
    })
    expect(result.fuerzaFinal).toBe(3)
  })

  it('Würon Despertada: +1 cuando mi premonición acierta categoría del oponente', () => {
    const bonus = aplicarBonusWuronDespertada({
      heroEstado: 'despertado',
      raza: 'Würon',
      miPremonicion: 'Ataque',
      categoriaJugadaPorOponente: 'Ataque',
    })
    expect(bonus).toBe(1)
  })

  it('Würon Despertada: NO da bonus si no acertó', () => {
    const bonus = aplicarBonusWuronDespertada({
      heroEstado: 'despertado',
      raza: 'Würon',
      miPremonicion: 'Ataque',
      categoriaJugadaPorOponente: 'Defensa',
    })
    expect(bonus).toBe(0)
  })

  it('Würon Despertada: NO da bonus si héroe Neutral', () => {
    const bonus = aplicarBonusWuronDespertada({
      heroEstado: 'neutral',
      raza: 'Würon',
      miPremonicion: 'Ataque',
      categoriaJugadaPorOponente: 'Ataque',
    })
    expect(bonus).toBe(0)
  })

  it('Würon Despertada: NO afecta a Tezhal', () => {
    const bonus = aplicarBonusWuronDespertada({
      heroEstado: 'despertado',
      raza: 'Tezhal',
      miPremonicion: 'Ataque',
      categoriaJugadaPorOponente: 'Ataque',
    })
    expect(bonus).toBe(0)
  })
})
