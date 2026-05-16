import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { interpretCondicionales } from '../interpreter'
import { mockCard, mockPlanet } from './_helpers'
import type { Categoria, HeroEstado, Raza, Tramo } from '../types'

const categoriaArb = fc.constantFrom<Categoria>('Ataque', 'Defensa', 'Ritual')
const tramoArb = fc.constantFrom<Tramo>('nebulosa', 'estrellas', 'sexto_sol')
const heroEstadoArb = fc.constantFrom<HeroEstado>('neutral', 'despertado', 'ascendido')
const razaArb = fc.constantFrom<Raza>('Tezhal', 'Würon')

describe('invariantes (fast-check property tests)', () => {
  it('fuerza final de cualquier carta nunca es negativa', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 6 }),
        fc.integer({ min: -20, max: 20 }),
        categoriaArb,
        categoriaArb,
        categoriaArb,
        tramoArb,
        heroEstadoArb,
        razaArb,
        (fuerzaBase, fuerzaDelta, cardCat, miPrem, opPrem, tramo, heroEstado, raza) => {
          const card = mockCard({
            categoria: cardCat,
            fuerzaBase,
            condicionales: [{ tipo: 'premonicion_propia', valor: miPrem, fuerzaDelta }],
          })
          const result = interpretCondicionales({
            card,
            miPremonicion: miPrem,
            oponentePremonicion: opPrem,
            planetElegido: undefined,
            tramo,
            heroEstado,
            raza,
            owner: 'a',
          })
          expect(result.fuerzaFinal).toBeGreaterThanOrEqual(0)
        },
      ),
    )
  })

  it('bonus de planeta no aplica en sexto_sol', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 6 }),
        categoriaArb,
        categoriaArb,
        (fuerzaBase, cardCat, planetCat) => {
          const card = mockCard({ categoria: cardCat, fuerzaBase, condicionales: [{ tipo: 'premonicion_propia', valor: 'Ritual', fuerzaDelta: 0 }] })
          const planet = mockPlanet({ tramo: 'Nebulosa', categoria: planetCat })
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
          // En sexto_sol, fuerzaFinal === fuerzaBase (sin bonus de planeta).
          expect(result.fuerzaFinal).toBe(fuerzaBase)
        },
      ),
    )
  })

  it('múltiples condicionales suman aditivamente', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: -5, max: 5 }), { minLength: 1, maxLength: 3 }),
        (deltas) => {
          const card = mockCard({
            categoria: 'Ataque',
            fuerzaBase: 10,
            condicionales: deltas.map((d) => ({
              tipo: 'premonicion_propia' as const,
              valor: 'Ataque' as const,
              fuerzaDelta: d,
            })),
          })
          const result = interpretCondicionales({
            card,
            miPremonicion: 'Ataque', // todas las cláusulas se activan
            oponentePremonicion: 'Defensa',
            planetElegido: undefined,
            tramo: 'nebulosa',
            heroEstado: 'neutral',
            raza: 'Tezhal',
            owner: 'a',
          })
          const expected = Math.max(0, 10 + deltas.reduce((a, b) => a + b, 0))
          expect(result.fuerzaFinal).toBe(expected)
        },
      ),
    )
  })
})
