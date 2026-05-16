// Schema validators v4.2 — stub laxo durante Phase 1a.
//
// Phase 1b reescribe esto con validación estricta del nuevo formato de cartas
// (penalizacionAcierto, condicionales sobre estado del juego).
// Por ahora: acepta YAML v4.1 viejo + asigna defaults v4.2 para que el código compile.
// Los tests engine de Phase 1a NO dependen del pool real; usan mocks.

import type {
  CardActionDef,
  CardHeroDef,
  CardPlanetDef,
  Categoria,
  Raza,
} from '@/engine/types'

const CATEGORIAS: readonly Categoria[] = ['Ataque', 'Defensa', 'Ritual']
const RAZAS: readonly Raza[] = ['Tezhal', 'Würon']

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/**
 * v4.2 stub laxo: acepta YAML v4.1 viejo, asigna penalizacionAcierto=0 y
 * condicionales=[] (descarta cláusulas premonicion_* viejas).
 * Phase 1b reescribe esto con validación estricta v4.2.
 */
export function validateCardActionDef(raw: unknown): CardActionDef {
  if (!isObject(raw)) throw new Error('CardActionDef debe ser objeto')
  const id = String(raw.id ?? '')
  const nombre = String(raw.nombre ?? '')
  const raza = (raw.raza as Raza) ?? 'Tezhal'
  if (!RAZAS.includes(raza)) throw new Error(`Raza inválida en ${id}: ${raza}`)
  const categoria = (raw.categoria as Categoria) ?? 'Ataque'
  if (!CATEGORIAS.includes(categoria)) throw new Error(`Categoria inválida en ${id}`)
  const coste = Number(raw.coste ?? 1)
  const fuerzaBase = Number(raw.fuerza_base ?? raw.fuerzaBase ?? 0)
  const penalizacionAcierto = Number(raw.penalizacion_acierto ?? raw.penalizacionAcierto ?? 0)
  return {
    id,
    nombre,
    raza,
    categoria,
    coste,
    fuerzaBase,
    penalizacionAcierto,
    rareza: (raw.rareza as 'comun') ?? 'comun',
    condicionales: [], // Phase 1b reescribe con cláusulas v4.2
    flavor: String(raw.flavor ?? ''),
  }
}

export function validateCardPlanetDef(raw: unknown): CardPlanetDef {
  if (!isObject(raw)) throw new Error('CardPlanetDef debe ser objeto')
  return {
    id: String(raw.id ?? ''),
    nombre: String(raw.nombre ?? ''),
    tramo: (raw.tramo as 'Nebulosa') ?? 'Nebulosa',
    categoria: (raw.categoria as Categoria) ?? 'Ataque',
    flavor: String(raw.flavor ?? ''),
    efectoEspecial: null,
  }
}

export interface HeroEstadoYamlEntry {
  id: string
  nombre: string
  raza: Raza
  estado: 'Despertado' | 'Ascendido'
  activacion: string
  habilidad: string
  persona: string
  flavor: string
}

export function validateHeroEstadoYamlEntry(raw: unknown): HeroEstadoYamlEntry {
  if (!isObject(raw)) throw new Error('Hero entry debe ser objeto')
  return {
    id: String(raw.id ?? ''),
    nombre: String(raw.nombre ?? ''),
    raza: (raw.raza as Raza) ?? 'Tezhal',
    estado: (raw.estado as 'Despertado') ?? 'Despertado',
    activacion: String(raw.activacion ?? ''),
    habilidad: String(raw.habilidad ?? ''),
    persona: String(raw.persona ?? ''),
    flavor: String(raw.flavor ?? ''),
  }
}

export function combineHeroEntries(entries: HeroEstadoYamlEntry[]): Map<Raza, CardHeroDef> {
  const byRaza = new Map<
    Raza,
    {
      despertado?: HeroEstadoYamlEntry
      ascendido?: HeroEstadoYamlEntry
      nombreBase?: string
      persona?: string
    }
  >()
  for (const entry of entries) {
    const acc = byRaza.get(entry.raza) ?? {}
    if (entry.estado === 'Despertado') {
      acc.despertado = entry
      acc.nombreBase = entry.nombre.split(' — ')[0] ?? entry.nombre
      acc.persona = entry.persona
    } else {
      acc.ascendido = entry
    }
    byRaza.set(entry.raza, acc)
  }
  const out = new Map<Raza, CardHeroDef>()
  for (const [raza, acc] of byRaza) {
    if (!acc.despertado || !acc.ascendido) continue
    out.set(raza, {
      nombre: acc.nombreBase ?? raza,
      raza,
      persona: acc.persona ?? '',
      despertado: {
        id: acc.despertado.id,
        activacion: acc.despertado.activacion,
        habilidad: acc.despertado.habilidad,
        flavor: acc.despertado.flavor,
      },
      ascendido: {
        id: acc.ascendido.id,
        activacion: acc.ascendido.activacion,
        habilidad: acc.ascendido.habilidad,
        flavor: acc.ascendido.flavor,
      },
    })
  }
  return out
}
