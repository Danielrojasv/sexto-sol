import { describe, expect, it } from 'vitest'
import {
  combineHeroEntries,
  validateCardActionDef,
  validateCardPlanetDef,
  validateHeroEstadoYamlEntry,
} from '../schema'

describe('validateCardActionDef', () => {
  it('acepta carta válida', () => {
    const raw = {
      id: 'TZH-001',
      nombre: 'Lanza Solar',
      raza: 'Tezhal',
      categoria: 'Ataque',
      coste: 2,
      fuerza_base: 3,
      rareza: 'comun',
      condicionales: [{ tipo: 'premonicion_propia', valor: 'Ataque', fuerzaDelta: 2 }],
      flavor: 'flavor',
    }
    const card = validateCardActionDef(raw)
    expect(card.id).toBe('TZH-001')
    expect(card.fuerzaBase).toBe(3)
    expect(card.condicionales).toHaveLength(1)
  })

  it('rechaza coste fuera de [1, 6]', () => {
    expect(() =>
      validateCardActionDef({
        id: 'X',
        nombre: 'x',
        raza: 'Tezhal',
        categoria: 'Ataque',
        coste: 0,
        fuerza_base: 1,
        rareza: 'comun',
        condicionales: [{ tipo: 'premonicion_propia', valor: 'Ataque', fuerzaDelta: 1 }],
        flavor: 'f',
      }),
    ).toThrow(/coste/)
    expect(() =>
      validateCardActionDef({
        id: 'X',
        nombre: 'x',
        raza: 'Tezhal',
        categoria: 'Ataque',
        coste: 7,
        fuerza_base: 1,
        rareza: 'comun',
        condicionales: [{ tipo: 'premonicion_propia', valor: 'Ataque', fuerzaDelta: 1 }],
        flavor: 'f',
      }),
    ).toThrow(/coste/)
  })

  it('rechaza categoría inválida', () => {
    expect(() =>
      validateCardActionDef({
        id: 'X',
        nombre: 'x',
        raza: 'Tezhal',
        categoria: 'Magic',
        coste: 1,
        fuerza_base: 1,
        rareza: 'comun',
        condicionales: [{ tipo: 'premonicion_propia', valor: 'Ataque', fuerzaDelta: 1 }],
        flavor: 'f',
      }),
    ).toThrow(/categoria/)
  })

  it('rechaza condicional sin fuerzaDelta ni sideEffect', () => {
    expect(() =>
      validateCardActionDef({
        id: 'X',
        nombre: 'x',
        raza: 'Tezhal',
        categoria: 'Ataque',
        coste: 1,
        fuerza_base: 1,
        rareza: 'comun',
        condicionales: [{ tipo: 'premonicion_propia', valor: 'Ataque' }],
        flavor: 'f',
      }),
    ).toThrow(/al menos/)
  })

  it('rechaza premonicion_propia sin valor', () => {
    expect(() =>
      validateCardActionDef({
        id: 'X',
        nombre: 'x',
        raza: 'Tezhal',
        categoria: 'Ataque',
        coste: 1,
        fuerza_base: 1,
        rareza: 'comun',
        condicionales: [{ tipo: 'premonicion_propia', fuerzaDelta: 1 }],
        flavor: 'f',
      }),
    ).toThrow(/requiere campo 'valor'/)
  })

  it('rechaza condicionales vacíos', () => {
    expect(() =>
      validateCardActionDef({
        id: 'X',
        nombre: 'x',
        raza: 'Tezhal',
        categoria: 'Ataque',
        coste: 1,
        fuerza_base: 1,
        rareza: 'comun',
        condicionales: [],
        flavor: 'f',
      }),
    ).toThrow(/al menos 1 condicional/)
  })

  it('acepta sideEffect bien formado', () => {
    const card = validateCardActionDef({
      id: 'X',
      nombre: 'x',
      raza: 'Tezhal',
      categoria: 'Ataque',
      coste: 1,
      fuerza_base: 1,
      rareza: 'comun',
      condicionales: [
        {
          tipo: 'premonicion_oponente',
          valor: 'Defensa',
          sideEffect: { tipo: 'descarte', target: 'oponente', valor: 1 },
        },
      ],
      flavor: 'f',
    })
    expect(card.condicionales[0]!.sideEffect).toEqual({
      tipo: 'descarte',
      target: 'oponente',
      valor: 1,
    })
  })
})

describe('validateCardPlanetDef', () => {
  it('acepta planet válido', () => {
    const p = validateCardPlanetDef({
      id: 'PLN-NEB-ATQ',
      nombre: 'X',
      tramo: 'Nebulosa',
      categoria: 'Ataque',
      flavor: 'f',
      efectoEspecial: null,
    })
    expect(p.id).toBe('PLN-NEB-ATQ')
  })

  it('rechaza efectoEspecial no-null en v4.1', () => {
    expect(() =>
      validateCardPlanetDef({
        id: 'X',
        nombre: 'X',
        tramo: 'Nebulosa',
        categoria: 'Ataque',
        flavor: 'f',
        efectoEspecial: 'algo',
      }),
    ).toThrow(/v4.1/)
  })
})

describe('combineHeroEntries', () => {
  it('combina 4 entries en 2 héroes', () => {
    const entries = [
      validateHeroEstadoYamlEntry({
        id: 'HRO-TEZHAL-DESPERTADO',
        nombre: 'Tlanixtli — Despertado',
        raza: 'Tezhal',
        estado: 'Despertado',
        activacion: 'a',
        habilidad: 'h',
        persona: 'p',
        flavor: 'f',
      }),
      validateHeroEstadoYamlEntry({
        id: 'HRO-TEZHAL-ASCENDIDO',
        nombre: 'Tlanixtli — Ascendido',
        raza: 'Tezhal',
        estado: 'Ascendido',
        activacion: 'a',
        habilidad: 'h',
        persona: 'p',
        flavor: 'f',
      }),
      validateHeroEstadoYamlEntry({
        id: 'HRO-WURON-DESPERTADO',
        nombre: 'Lhülkan — Despertada',
        raza: 'Würon',
        estado: 'Despertado',
        activacion: 'a',
        habilidad: 'h',
        persona: 'p',
        flavor: 'f',
      }),
      validateHeroEstadoYamlEntry({
        id: 'HRO-WURON-ASCENDIDO',
        nombre: 'Lhülkan — Ascendida',
        raza: 'Würon',
        estado: 'Ascendido',
        activacion: 'a',
        habilidad: 'h',
        persona: 'p',
        flavor: 'f',
      }),
    ]
    const combined = combineHeroEntries(entries)
    expect(combined.size).toBe(2)
    expect(combined.get('Tezhal')?.nombre).toBe('Tlanixtli')
    expect(combined.get('Würon')?.nombre).toBe('Lhülkan')
  })
})
