// invariants.test.ts v4.2 — property tests con nuevo modelo.

import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { interpretCondicionales } from '../interpreter'
import { mockCard, mockPlanet } from './_helpers'
import type { Categoria, HeroEstado, Raza, Tramo } from '../types'

const categoriaArb = fc.constantFrom<Categoria>('Ataque', 'Defensa', 'Ritual')
const tramoArb = fc.constantFrom<Tramo>('nebulosa', 'estrellas', 'sexto_sol')
const heroEstadoArb = fc.constantFrom<HeroEstado>('neutral', 'despertado', 'ascendido')
const razaArb = fc.constantFrom<Raza>('Tezhal', 'Würon')

describe('invariantes (fast-check)', () => {
  it('fuerza final nunca negativa', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 6 }),
        fc.integer({ min: 0, max: 4 }),
        categoriaArb,
        categoriaArb,
        categoriaArb,
        tramoArb,
        heroEstadoArb,
        razaArb,
        (fuerzaBase, pen, cardCat, miPrem, opPrem, tramo, heroEstado, raza) => {
          const r = interpretCondicionales({
            card: mockCard({
              categoria: cardCat,
              fuerzaBase,
              penalizacionAcierto: pen,
            }),
            miPremonicion: miPrem,
            oponentePremonicion: opPrem,
            oponenteCategoria: undefined,
            planetElegido: undefined,
            tramo,
            heroEstado,
            raza,
            owner: 'a',
            atributosPropio: { fuerza: 0, resguardo: 0, resonancia: 0 },
            atributosOponente: { fuerza: 0, resguardo: 0, resonancia: 0 },
            eclipseActivo: false,
            eclipseInvocador: undefined,
          })
          expect(r.fuerzaFinal).toBeGreaterThanOrEqual(0)
        },
      ),
    )
  })

  it('bonus de planeta no aplica en sexto_sol', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 4 }),
        categoriaArb,
        categoriaArb,
        (fuerzaBase, cardCat, planetCat) => {
          const r1 = interpretCondicionales({
            card: mockCard({ categoria: cardCat, fuerzaBase, penalizacionAcierto: 0 }),
            miPremonicion: 'Ataque',
            oponentePremonicion: 'Ataque', // pen=0 → no afecta
            oponenteCategoria: undefined,
            planetElegido: mockPlanet({ tramo: 'Nebulosa', categoria: planetCat }),
            tramo: 'sexto_sol',
            heroEstado: 'neutral',
            raza: 'Würon', // sin bonus pasivo Tezhal
            owner: 'a',
            atributosPropio: { fuerza: 0, resguardo: 0, resonancia: 0 },
            atributosOponente: { fuerza: 0, resguardo: 0, resonancia: 0 },
            eclipseActivo: false,
            eclipseInvocador: undefined,
          })
          // En sexto_sol no hay bonus planeta. Resultado depende solo de base + lectura rival.
          // Acertó (Ataque == Ataque pero card.categoria es la de cardCat). Si cardCat===Ataque, acertó. Si no, falló.
          const ricoExpected = cardCat === 'Ataque' ? fuerzaBase : fuerzaBase + 1
          expect(r1.fuerzaFinal).toBe(Math.max(0, ricoExpected))
        },
      ),
    )
  })
})
