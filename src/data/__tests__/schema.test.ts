// Schema tests v4.2 — validación estricta de CardActionDef.

import { describe, expect, it } from 'vitest'
import {
  combineHeroEntries,
  validateCardActionDef,
  validateCardPlanetDef,
  validateHeroEstadoYamlEntry,
} from '../schema'

function baseCard(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'TZH-X',
    nombre: 'Test',
    raza: 'Tezhal',
    categoria: 'Ataque',
    coste: 2,
    fuerza_base: 3,
    penalizacion_acierto: 1,
    rareza: 'comun',
    condicionales: [],
    flavor: 'flv',
    ...over,
  }
}

describe('validateCardActionDef — happy path', () => {
  it('acepta carta v4.2 mínima', () => {
    const out = validateCardActionDef(baseCard())
    expect(out.id).toBe('TZH-X')
    expect(out.penalizacionAcierto).toBe(1)
    expect(out.condicionales).toEqual([])
  })

  it('acepta condicional heroe_estado', () => {
    const out = validateCardActionDef(
      baseCard({
        condicionales: [{ tipo: 'heroe_estado', valor: 'despertado', fuerzaDelta: 2 }],
      }),
    )
    expect(out.condicionales[0]?.tipo).toBe('heroe_estado')
    expect(out.condicionales[0]?.valor).toBe('despertado')
    expect(out.condicionales[0]?.fuerzaDelta).toBe(2)
  })

  it('acepta condicional atributo_propio', () => {
    const out = validateCardActionDef(
      baseCard({
        condicionales: [
          { tipo: 'atributo_propio', valorAtributo: 'Ataque', umbral: 5, fuerzaDelta: 2 },
        ],
      }),
    )
    expect(out.condicionales[0]?.umbral).toBe(5)
    expect(out.condicionales[0]?.valorAtributo).toBe('Ataque')
  })

  it('acepta sideEffects top-level', () => {
    const out = validateCardActionDef(
      baseCard({ sideEffects: [{ tipo: 'descarte_oponente', valor: 1 }] }),
    )
    expect(out.sideEffects?.[0]?.tipo).toBe('descarte_oponente')
  })

  it('acepta condicional eclipse_activo sin parámetros', () => {
    const out = validateCardActionDef(
      baseCard({ condicionales: [{ tipo: 'eclipse_activo', fuerzaDelta: 3 }] }),
    )
    expect(out.condicionales[0]?.tipo).toBe('eclipse_activo')
    expect(out.condicionales[0]?.fuerzaDelta).toBe(3)
  })
})

describe('validateCardActionDef — rechazos', () => {
  it('rechaza raza inválida', () => {
    expect(() => validateCardActionDef(baseCard({ raza: 'Zaqe' }))).toThrow(/raza/)
  })

  it('rechaza categoria inválida', () => {
    expect(() => validateCardActionDef(baseCard({ categoria: 'Magia' }))).toThrow(/categoria/)
  })

  it('rechaza penalizacion_acierto negativa', () => {
    expect(() => validateCardActionDef(baseCard({ penalizacion_acierto: -1 }))).toThrow(/penalizacion/)
  })

  it('rechaza penalizacion_acierto faltante', () => {
    const card = baseCard()
    delete card.penalizacion_acierto
    expect(() => validateCardActionDef(card)).toThrow(/penalizacion/)
  })

  it('rechaza fuerza_base negativa', () => {
    expect(() => validateCardActionDef(baseCard({ fuerza_base: -1 }))).toThrow(/fuerza_base/)
  })

  it('rechaza condicional con tipo desconocido', () => {
    expect(() =>
      validateCardActionDef(
        baseCard({ condicionales: [{ tipo: 'premonicion_propia', valor: 'Ataque' }] }),
      ),
    ).toThrow(/condicional.tipo/)
  })

  it('rechaza sideEffect tipo inválido', () => {
    expect(() =>
      validateCardActionDef(baseCard({ sideEffects: [{ tipo: 'anula', valor: 3 }] })),
    ).toThrow(/sideEffect.tipo/)
  })

  it('rechaza atributo_propio sin umbral', () => {
    expect(() =>
      validateCardActionDef(
        baseCard({ condicionales: [{ tipo: 'atributo_propio', valorAtributo: 'Ataque' }] }),
      ),
    ).toThrow(/umbral/)
  })

  it('rechaza heroe_estado con valor inválido', () => {
    expect(() =>
      validateCardActionDef(
        baseCard({ condicionales: [{ tipo: 'heroe_estado', valor: 'super' }] }),
      ),
    ).toThrow(/heroe_estado/)
  })
})

describe('validateCardActionDef — más rechazos', () => {
  it('rechaza coste negativo', () => {
    expect(() => validateCardActionDef(baseCard({ coste: -1 }))).toThrow(/coste/)
  })

  it('rechaza rareza inválida', () => {
    expect(() => validateCardActionDef(baseCard({ rareza: 'mythic' }))).toThrow(/rareza/)
  })

  it('rechaza id vacío', () => {
    expect(() => validateCardActionDef(baseCard({ id: '' }))).toThrow(/id/)
  })

  it('rechaza condicionales no-array', () => {
    expect(() => validateCardActionDef(baseCard({ condicionales: 'foo' }))).toThrow(/condicionales/)
  })

  it('rechaza tramo con valor inválido en condicional', () => {
    expect(() =>
      validateCardActionDef(baseCard({ condicionales: [{ tipo: 'tramo', valor: 'big-bang' }] })),
    ).toThrow(/tramo.valor/)
  })

  it('rechaza atributo_oponente sin valorAtributo', () => {
    expect(() =>
      validateCardActionDef(
        baseCard({ condicionales: [{ tipo: 'atributo_oponente', umbral: 3 }] }),
      ),
    ).toThrow(/valorAtributo/)
  })

  it('rechaza sideEffect.valor negativo', () => {
    expect(() =>
      validateCardActionDef(
        baseCard({ sideEffects: [{ tipo: 'descarte_oponente', valor: -1 }] }),
      ),
    ).toThrow(/valor/)
  })
})

describe('validateHeroEstadoYamlEntry + combineHeroEntries', () => {
  it('acepta entrada válida', () => {
    const out = validateHeroEstadoYamlEntry({
      id: 'HRO-TEZHAL-DESP',
      nombre: 'Tlanixtli — Despertado',
      raza: 'Tezhal',
      estado: 'Despertado',
      activacion: 'gana planeta nebulosa',
      habilidad: '+1 atq',
      persona: 'guerrero',
      flavor: 'flv',
    })
    expect(out.raza).toBe('Tezhal')
    expect(out.estado).toBe('Despertado')
  })

  it('rechaza raza inválida en hero', () => {
    expect(() =>
      validateHeroEstadoYamlEntry({
        id: 'X',
        raza: 'Zaqe',
        estado: 'Despertado',
      }),
    ).toThrow(/raza/)
  })

  it('rechaza estado inválido en hero', () => {
    expect(() =>
      validateHeroEstadoYamlEntry({
        id: 'X',
        raza: 'Tezhal',
        estado: 'super',
      }),
    ).toThrow(/estado/)
  })

  it('combineHeroEntries empareja Despertado + Ascendido por raza', () => {
    const entries = [
      validateHeroEstadoYamlEntry({
        id: 'A',
        nombre: 'X — Despertado',
        raza: 'Tezhal',
        estado: 'Despertado',
        activacion: 'a',
        habilidad: 'h',
        persona: 'p',
        flavor: 'f',
      }),
      validateHeroEstadoYamlEntry({
        id: 'B',
        nombre: 'X — Ascendido',
        raza: 'Tezhal',
        estado: 'Ascendido',
        activacion: 'a',
        habilidad: 'h',
        persona: 'p',
        flavor: 'f',
      }),
    ]
    const out = combineHeroEntries(entries)
    expect(out.size).toBe(1)
    expect(out.get('Tezhal')?.despertado.id).toBe('A')
    expect(out.get('Tezhal')?.ascendido.id).toBe('B')
  })

  it('combineHeroEntries omite raza incompleta', () => {
    const entries = [
      validateHeroEstadoYamlEntry({
        id: 'A',
        raza: 'Tezhal',
        estado: 'Despertado',
      }),
    ]
    const out = combineHeroEntries(entries)
    expect(out.size).toBe(0)
  })
})

describe('validateCardPlanetDef', () => {
  it('acepta planeta válido', () => {
    const out = validateCardPlanetDef({
      id: 'PLN-NEB-ATQ',
      nombre: 'X',
      tramo: 'Nebulosa',
      categoria: 'Ataque',
      flavor: 'flv',
    })
    expect(out.id).toBe('PLN-NEB-ATQ')
    expect(out.efectoEspecial).toBeNull()
  })

  it('rechaza tramo inválido', () => {
    expect(() =>
      validateCardPlanetDef({
        id: 'PLN-X',
        nombre: 'X',
        tramo: 'Sol',
        categoria: 'Ataque',
        flavor: '',
      }),
    ).toThrow(/tramo/)
  })

  it('rechaza categoria inválida', () => {
    expect(() =>
      validateCardPlanetDef({
        id: 'PLN-X',
        nombre: 'X',
        tramo: 'Nebulosa',
        categoria: 'Magia',
        flavor: '',
      }),
    ).toThrow(/categoria/)
  })

  it('rechaza id vacío', () => {
    expect(() =>
      validateCardPlanetDef({
        id: '',
        nombre: 'X',
        tramo: 'Nebulosa',
        categoria: 'Ataque',
        flavor: '',
      }),
    ).toThrow(/id/)
  })
})
