// Schema validators v4.2 — validación estricta del nuevo formato.
//
// Cambios v4.1 → v4.2:
//   - Campo top-level `penalizacion_acierto` (entero ≥ 0) obligatorio.
//   - Condicionales eliminaron premonicion_* — solo tipos sobre estado del juego.
//   - SideEffects ahora son top-level (no anidados en condicionales) o dentro
//     de una condicional, ambos formatos válidos.

import type {
  CardActionDef,
  CardHeroDef,
  CardPlanetDef,
  Categoria,
  Condicional,
  CondicionalTipo,
  HeroEstado,
  Raza,
  Rareza,
  SideEffect,
  SideEffectTipo,
  Tramo,
} from '@/engine/types'

const CATEGORIAS: readonly Categoria[] = ['Ataque', 'Defensa', 'Ritual']
const RAZAS: readonly Raza[] = ['Tezhal', 'Würon']
const RAREZAS: readonly Rareza[] = ['comun', 'rara', 'epica', 'legendaria']

const COND_TIPOS: readonly CondicionalTipo[] = [
  'heroe_estado',
  'tramo',
  'atributo_propio',
  'atributo_oponente',
  'eclipse_activo',
]

const SIDE_EFFECT_TIPOS: readonly SideEffectTipo[] = [
  'descarte_oponente',
  'robo_propio',
  'mirar_mazo_oponente',
  'bloqueo_planeta',
]

const HERO_ESTADOS: readonly HeroEstado[] = ['neutral', 'despertado', 'ascendido']
const TRAMOS: readonly Tramo[] = ['nebulosa', 'estrellas', 'sexto_sol']

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function validateSideEffect(raw: unknown, ctx: string): SideEffect {
  if (!isObject(raw)) throw new Error(`${ctx}: sideEffect debe ser objeto`)
  const tipo = raw.tipo as SideEffectTipo
  if (!SIDE_EFFECT_TIPOS.includes(tipo)) {
    throw new Error(`${ctx}: sideEffect.tipo inválido (${String(tipo)})`)
  }
  const valor = Number(raw.valor)
  if (!Number.isFinite(valor) || valor < 0) {
    throw new Error(`${ctx}: sideEffect.valor debe ser número ≥ 0`)
  }
  return { tipo, valor }
}

function validateCondicional(raw: unknown, ctx: string): Condicional {
  if (!isObject(raw)) throw new Error(`${ctx}: condicional debe ser objeto`)
  const tipo = raw.tipo as CondicionalTipo
  if (!COND_TIPOS.includes(tipo)) {
    throw new Error(`${ctx}: condicional.tipo inválido (${String(tipo)})`)
  }
  const out: Condicional = { tipo }

  switch (tipo) {
    case 'heroe_estado': {
      const valor = raw.valor as HeroEstado
      if (!HERO_ESTADOS.includes(valor)) {
        throw new Error(`${ctx}: heroe_estado.valor inválido (${String(valor)})`)
      }
      out.valor = valor
      break
    }
    case 'tramo': {
      const valor = raw.valor as Tramo
      if (!TRAMOS.includes(valor)) {
        throw new Error(`${ctx}: tramo.valor inválido (${String(valor)})`)
      }
      out.valor = valor
      break
    }
    case 'atributo_propio':
    case 'atributo_oponente': {
      const valorAtributo = raw.valorAtributo as Categoria
      if (!CATEGORIAS.includes(valorAtributo)) {
        throw new Error(`${ctx}: ${tipo}.valorAtributo inválido (${String(valorAtributo)})`)
      }
      const umbral = Number(raw.umbral)
      if (!Number.isFinite(umbral) || umbral < 0) {
        throw new Error(`${ctx}: ${tipo}.umbral debe ser número ≥ 0`)
      }
      out.valorAtributo = valorAtributo
      out.umbral = umbral
      break
    }
    case 'eclipse_activo':
      // sin parámetros adicionales
      break
  }

  if (raw.fuerzaDelta !== undefined) {
    const fd = Number(raw.fuerzaDelta)
    if (!Number.isFinite(fd)) throw new Error(`${ctx}: fuerzaDelta debe ser número`)
    out.fuerzaDelta = fd
  }
  if (raw.sideEffect !== undefined) {
    out.sideEffect = validateSideEffect(raw.sideEffect, `${ctx} (cond.sideEffect)`)
  }
  if (raw.efectoTexto !== undefined) {
    out.efectoTexto = String(raw.efectoTexto)
  }
  return out
}

export function validateCardActionDef(raw: unknown): CardActionDef {
  if (!isObject(raw)) throw new Error('CardActionDef debe ser objeto')
  const id = String(raw.id ?? '')
  if (!id) throw new Error('CardActionDef.id requerido')
  const ctx = `CardActionDef[${id}]`

  const nombre = String(raw.nombre ?? '')
  if (!nombre) throw new Error(`${ctx}: nombre requerido`)

  const raza = raw.raza as Raza
  if (!RAZAS.includes(raza)) throw new Error(`${ctx}: raza inválida (${String(raza)})`)

  const categoria = raw.categoria as Categoria
  if (!CATEGORIAS.includes(categoria)) {
    throw new Error(`${ctx}: categoria inválida (${String(categoria)})`)
  }

  const coste = Number(raw.coste)
  if (!Number.isInteger(coste) || coste < 0) {
    throw new Error(`${ctx}: coste debe ser entero ≥ 0`)
  }

  const fuerzaBase = Number(raw.fuerza_base ?? raw.fuerzaBase)
  if (!Number.isInteger(fuerzaBase) || fuerzaBase < 0) {
    throw new Error(`${ctx}: fuerza_base debe ser entero ≥ 0`)
  }

  const penalizacionAcierto = Number(raw.penalizacion_acierto ?? raw.penalizacionAcierto)
  if (!Number.isInteger(penalizacionAcierto) || penalizacionAcierto < 0) {
    throw new Error(`${ctx}: penalizacion_acierto debe ser entero ≥ 0`)
  }

  const rareza = raw.rareza as Rareza
  if (!RAREZAS.includes(rareza)) throw new Error(`${ctx}: rareza inválida (${String(rareza)})`)

  let condicionales: Condicional[] = []
  if (raw.condicionales !== undefined) {
    if (!Array.isArray(raw.condicionales)) {
      throw new Error(`${ctx}: condicionales debe ser array`)
    }
    condicionales = raw.condicionales.map((c, i) => validateCondicional(c, `${ctx}.cond[${i}]`))
  }

  let sideEffects: SideEffect[] | undefined
  if (raw.sideEffects !== undefined) {
    if (!Array.isArray(raw.sideEffects)) {
      throw new Error(`${ctx}: sideEffects debe ser array`)
    }
    sideEffects = raw.sideEffects.map((s, i) => validateSideEffect(s, `${ctx}.se[${i}]`))
  }

  return {
    id,
    nombre,
    raza,
    categoria,
    coste,
    fuerzaBase,
    penalizacionAcierto,
    rareza,
    condicionales,
    ...(sideEffects ? { sideEffects } : {}),
    flavor: String(raw.flavor ?? ''),
  }
}

export function validateCardPlanetDef(raw: unknown): CardPlanetDef {
  if (!isObject(raw)) throw new Error('CardPlanetDef debe ser objeto')
  const id = String(raw.id ?? '')
  if (!id) throw new Error('CardPlanetDef.id requerido')
  const tramo = raw.tramo as 'Nebulosa' | 'Estrellas'
  if (tramo !== 'Nebulosa' && tramo !== 'Estrellas') {
    throw new Error(`Planet[${id}]: tramo inválido`)
  }
  const categoria = raw.categoria as Categoria
  if (!CATEGORIAS.includes(categoria)) {
    throw new Error(`Planet[${id}]: categoria inválida`)
  }
  return {
    id,
    nombre: String(raw.nombre ?? ''),
    tramo,
    categoria,
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
  const id = String(raw.id ?? '')
  const raza = raw.raza as Raza
  if (!RAZAS.includes(raza)) throw new Error(`Hero[${id}]: raza inválida`)
  const estado = raw.estado as 'Despertado' | 'Ascendido'
  if (estado !== 'Despertado' && estado !== 'Ascendido') {
    throw new Error(`Hero[${id}]: estado inválido`)
  }
  return {
    id,
    nombre: String(raw.nombre ?? ''),
    raza,
    estado,
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
