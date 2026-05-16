// Type guards manuales para validación runtime de YAML cargado.
// IQ2 cerrada: sin zod (justifica solo en schemas complejos con muchas relaciones).
//
// Cada validate*() lanza con mensaje claro si la estructura es inválida.
// Acepta `unknown` y narrowa al tipo definitivo.

import type {
  CardActionDef,
  CardHeroDef,
  CardPlanetDef,
  Categoria,
  Condicional,
  PremonicionTipo,
  Raza,
  Rareza,
  SideEffect,
} from '@/engine/types'

const CATEGORIAS: readonly Categoria[] = ['Ataque', 'Defensa', 'Ritual']
const RAZAS: readonly Raza[] = ['Tezhal', 'Würon']
const RAREZAS: readonly Rareza[] = ['comun', 'rara', 'epica', 'legendaria']
const PREMONICION_TIPOS: readonly PremonicionTipo[] = [
  'premonicion_propia',
  'premonicion_oponente',
  'premonicion_acierta',
]

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function assertString(v: unknown, field: string, ctx: string): string {
  if (typeof v !== 'string' || v.length === 0) {
    throw new Error(`${ctx}: ${field} debe ser string no vacío (got: ${JSON.stringify(v)})`)
  }
  return v
}

function assertNumber(v: unknown, field: string, ctx: string): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    throw new Error(`${ctx}: ${field} debe ser número (got: ${JSON.stringify(v)})`)
  }
  return v
}

function assertIntegerInRange(
  v: unknown,
  field: string,
  ctx: string,
  min: number,
  max: number,
): number {
  const n = assertNumber(v, field, ctx)
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new Error(`${ctx}: ${field} debe ser entero en [${min}, ${max}] (got: ${n})`)
  }
  return n
}

function assertEnum<T extends string>(
  v: unknown,
  field: string,
  ctx: string,
  allowed: readonly T[],
): T {
  const s = assertString(v, field, ctx)
  if (!allowed.includes(s as T)) {
    throw new Error(
      `${ctx}: ${field} debe ser uno de [${allowed.join(', ')}] (got: ${s})`,
    )
  }
  return s as T
}

function validateSideEffect(raw: unknown, ctx: string): SideEffect {
  if (!isObject(raw)) {
    throw new Error(`${ctx}: sideEffect debe ser objeto`)
  }
  const tipo = assertEnum(raw.tipo, 'sideEffect.tipo', ctx, ['descarte', 'robo', 'anula'] as const)
  const target = assertEnum(raw.target, 'sideEffect.target', ctx, ['propio', 'oponente'] as const)
  const valor = assertIntegerInRange(raw.valor, 'sideEffect.valor', ctx, 1, 99)
  return { tipo, target, valor }
}

function validateCondicional(raw: unknown, ctx: string): Condicional {
  if (!isObject(raw)) {
    throw new Error(`${ctx}: condicional debe ser objeto`)
  }
  const tipo = assertEnum(raw.tipo, 'tipo', ctx, PREMONICION_TIPOS)
  const out: Condicional = { tipo }

  if (raw.valor !== undefined) {
    out.valor = assertEnum(raw.valor, 'valor', ctx, CATEGORIAS)
  }
  // premonicion_propia y premonicion_oponente requieren valor;
  // premonicion_acierta NO debe tener valor (es categoría intrínseca de la carta).
  if (tipo === 'premonicion_propia' || tipo === 'premonicion_oponente') {
    if (out.valor === undefined) {
      throw new Error(`${ctx}: ${tipo} requiere campo 'valor' (categoria)`)
    }
  }

  if (raw.fuerzaDelta !== undefined) {
    const n = assertNumber(raw.fuerzaDelta, 'fuerzaDelta', ctx)
    if (!Number.isInteger(n)) {
      throw new Error(`${ctx}: fuerzaDelta debe ser entero (got: ${n})`)
    }
    out.fuerzaDelta = n
  }

  if (raw.sideEffect !== undefined) {
    out.sideEffect = validateSideEffect(raw.sideEffect, ctx)
  }

  if (out.fuerzaDelta === undefined && out.sideEffect === undefined) {
    throw new Error(`${ctx}: condicional debe tener al menos fuerzaDelta o sideEffect`)
  }

  if (raw.efectoTexto !== undefined) {
    out.efectoTexto = assertString(raw.efectoTexto, 'efectoTexto', ctx)
  }
  return out
}

export function validateCardActionDef(raw: unknown): CardActionDef {
  if (!isObject(raw)) {
    throw new Error('CardActionDef debe ser objeto')
  }
  const id = assertString(raw.id, 'id', 'CardActionDef')
  const ctx = `CardActionDef[${id}]`
  const nombre = assertString(raw.nombre, 'nombre', ctx)
  const raza = assertEnum(raw.raza, 'raza', ctx, RAZAS)
  const categoria = assertEnum(raw.categoria, 'categoria', ctx, CATEGORIAS)
  const coste = assertIntegerInRange(raw.coste, 'coste', ctx, 1, 6)
  // Campo en YAML se llama `fuerza_base` (snake) → mapear a `fuerzaBase` (camel).
  const fuerzaBaseRaw = raw.fuerzaBase ?? raw.fuerza_base
  const fuerzaBase = assertIntegerInRange(fuerzaBaseRaw, 'fuerza_base', ctx, 0, 99)
  const rareza = assertEnum(raw.rareza, 'rareza', ctx, RAREZAS)

  if (!Array.isArray(raw.condicionales)) {
    throw new Error(`${ctx}: condicionales debe ser array`)
  }
  if (raw.condicionales.length === 0) {
    throw new Error(`${ctx}: cada carta debe tener al menos 1 condicional (no vanilla)`)
  }
  const condicionales = raw.condicionales.map((c, i) => validateCondicional(c, `${ctx}.cond[${i}]`))

  const flavor = assertString(raw.flavor, 'flavor', ctx)

  return { id, nombre, raza, categoria, coste, fuerzaBase, rareza, condicionales, flavor }
}

export function validateCardPlanetDef(raw: unknown): CardPlanetDef {
  if (!isObject(raw)) {
    throw new Error('CardPlanetDef debe ser objeto')
  }
  const id = assertString(raw.id, 'id', 'CardPlanetDef')
  const ctx = `CardPlanetDef[${id}]`
  const nombre = assertString(raw.nombre, 'nombre', ctx)
  const tramo = assertEnum(raw.tramo, 'tramo', ctx, ['Nebulosa', 'Estrellas'] as const)
  const categoria = assertEnum(raw.categoria, 'categoria', ctx, CATEGORIAS)
  const flavor = assertString(raw.flavor, 'flavor', ctx)
  if (raw.efectoEspecial !== null && raw.efectoEspecial !== undefined) {
    throw new Error(`${ctx}: efectoEspecial debe ser null en v4.1 (reservado v4.2+)`)
  }
  return { id, nombre, tramo, categoria, flavor, efectoEspecial: null }
}

/** Validación de UN entry YAML de hero (formato 4 entries: 2 razas × 2 estados). */
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
  if (!isObject(raw)) {
    throw new Error('Hero entry debe ser objeto')
  }
  const id = assertString(raw.id, 'id', 'Hero entry')
  const ctx = `Hero[${id}]`
  const nombre = assertString(raw.nombre, 'nombre', ctx)
  const raza = assertEnum(raw.raza, 'raza', ctx, RAZAS)
  const estado = assertEnum(raw.estado, 'estado', ctx, ['Despertado', 'Ascendido'] as const)
  const activacion = assertString(raw.activacion, 'activacion', ctx)
  const habilidad = assertString(raw.habilidad, 'habilidad', ctx)
  const persona = assertString(raw.persona, 'persona', ctx)
  const flavor = assertString(raw.flavor, 'flavor', ctx)
  return { id, nombre, raza, estado, activacion, habilidad, persona, flavor }
}

/**
 * Combina las 4 entradas YAML (2 razas × 2 estados) en 2 CardHeroDef
 * (uno por raza, con .despertado y .ascendido).
 */
export function combineHeroEntries(entries: HeroEstadoYamlEntry[]): Map<Raza, CardHeroDef> {
  const byRaza = new Map<Raza, { despertado?: HeroEstadoYamlEntry; ascendido?: HeroEstadoYamlEntry; nombreBase?: string; persona?: string }>()

  for (const entry of entries) {
    const acc = byRaza.get(entry.raza) ?? {}
    if (entry.estado === 'Despertado') {
      acc.despertado = entry
      // El nombre del héroe es lo que aparece antes de "— Despertado" en el YAML.
      acc.nombreBase = entry.nombre.split(' — ')[0] ?? entry.nombre
      acc.persona = entry.persona
    } else {
      acc.ascendido = entry
    }
    byRaza.set(entry.raza, acc)
  }

  const out = new Map<Raza, CardHeroDef>()
  for (const [raza, acc] of byRaza) {
    if (!acc.despertado || !acc.ascendido) {
      throw new Error(`Hero ${raza}: falta estado Despertado o Ascendido`)
    }
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
