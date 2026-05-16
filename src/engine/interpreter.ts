// Interpreter puro de Sexto Sol v4.2 — "Premonición como Lectura".
//
// Nuevo orden de aplicación (§4.2 SPEC v4.2):
//   1. Fuerza base de la carta.
//   2. Lectura del rival sobre tu carta:
//      - Si rival ACERTÓ categoría: tu carta pierde `penalizacionAcierto`.
//      - Si rival FALLÓ: tu carta gana +1.
//   3. Bonus de planeta (+1 si categoría coincide con planeta-elegido, solo Neb/Est).
//   4. Condicionales propias sobre estado del juego (heroe_estado, tramo, atributos, eclipse).
//   5. Habilidades de héroe activas:
//      - Tezhal Despertado: +1 a cartas Ataque.
//      - Würon Despertado: +1 si MI premonición acertó (sobre la carta rival).
//   6. Eclipse ×2 sobre todo (si el owner invocó Eclipse este turno).
//
// Math.max(0, fuerzaFinal) — nunca negativa, pero puede ser 0.
//
// El interpreter NO aplica side effects al state; los devuelve para que el reducer
// los procese después de calcular fuerza de ambas cartas.

import type {
  CardActionDef,
  CardPlanetDef,
  Categoria,
  HeroAttributes,
  HeroEstado,
  InterpretResult,
  PlayerId,
  Raza,
  SideEffect,
  Tramo,
} from './types'

export interface InterpretInput {
  card: CardActionDef
  /** Premonición declarada por el owner de esta carta (sobre el rival). */
  miPremonicion: Categoria
  /** Premonición declarada por el rival (sobre esta carta). */
  oponentePremonicion: Categoria
  /** Categoría de la carta jugada por el oponente este turno (para Würon Despertado). */
  oponenteCategoria: Categoria | undefined
  planetElegido: CardPlanetDef | undefined
  tramo: Tramo
  heroEstado: HeroEstado
  raza: Raza
  owner: PlayerId
  atributosPropio: HeroAttributes
  atributosOponente: HeroAttributes
  /** Si Eclipse fue invocado este turno por algún jugador. */
  eclipseActivo: boolean
  /** ID del jugador que invocó Eclipse, si alguno. */
  eclipseInvocador: PlayerId | undefined
}

export function interpretCondicionales(input: InterpretInput): InterpretResult {
  const {
    card,
    miPremonicion,
    oponentePremonicion,
    oponenteCategoria,
    planetElegido,
    tramo,
    heroEstado,
    raza,
    owner,
    atributosPropio,
    atributosOponente,
    eclipseActivo,
    eclipseInvocador,
  } = input

  let fuerza = card.fuerzaBase
  const sideEffects: SideEffect[] = []

  // 1. Lectura del rival sobre tu carta.
  if (oponentePremonicion === card.categoria) {
    // Rival acertó → tu carta pierde penalizacionAcierto.
    fuerza -= card.penalizacionAcierto
  } else {
    // Rival falló → tu carta gana +1.
    fuerza += 1
  }

  // 2. Bonus de planeta (solo Neb/Est, NUNCA Sexto Sol).
  if (
    tramo !== 'sexto_sol' &&
    planetElegido !== undefined &&
    planetElegido.categoria === card.categoria
  ) {
    fuerza += 1
  }

  // 3. Condicionales propias sobre estado del juego.
  for (const cond of card.condicionales) {
    let trigger = false
    switch (cond.tipo) {
      case 'heroe_estado':
        trigger = cond.valor === heroEstado
        break
      case 'tramo':
        trigger = cond.valor === tramo
        break
      case 'atributo_propio':
        if (cond.valorAtributo && cond.umbral !== undefined) {
          const key = categoriaToAtributo(cond.valorAtributo)
          trigger = atributosPropio[key] >= cond.umbral
        }
        break
      case 'atributo_oponente':
        if (cond.valorAtributo && cond.umbral !== undefined) {
          const key = categoriaToAtributo(cond.valorAtributo)
          trigger = atributosOponente[key] >= cond.umbral
        }
        break
      case 'eclipse_activo':
        trigger = eclipseActivo
        break
    }
    if (trigger) {
      if (cond.fuerzaDelta !== undefined) fuerza += cond.fuerzaDelta
      if (cond.sideEffect !== undefined) sideEffects.push(cond.sideEffect)
    }
  }

  // 4. Habilidades de héroe activas.
  if (
    raza === 'Tezhal' &&
    (heroEstado === 'despertado' || heroEstado === 'ascendido') &&
    card.categoria === 'Ataque'
  ) {
    fuerza += 1
  }
  if (
    raza === 'Würon' &&
    (heroEstado === 'despertado' || heroEstado === 'ascendido') &&
    oponenteCategoria !== undefined &&
    miPremonicion === oponenteCategoria
  ) {
    fuerza += 1
  }

  // 5. Side effects incondicionales declarados al tope de la carta.
  if (card.sideEffects) {
    for (const eff of card.sideEffects) sideEffects.push(eff)
  }

  // 6. Eclipse ×2 sobre el total (si owner invocó).
  if (eclipseActivo && eclipseInvocador === owner) {
    fuerza *= 2
  }

  return {
    fuerzaFinal: Math.max(0, fuerza),
    sideEffects,
    categoria: card.categoria,
    owner,
  }
}

function categoriaToAtributo(cat: Categoria): keyof HeroAttributes {
  switch (cat) {
    case 'Ataque':
      return 'fuerza'
    case 'Defensa':
      return 'resguardo'
    case 'Ritual':
      return 'resonancia'
  }
}

/**
 * Calcula penalización mínima para un jugador que "Pasó" sin carta pero acertó
 * su premonición. §4.3 SPEC v4.2: pasar con acierto aplica -1 fijo al rival.
 *
 * Si miPremonicion === categoría de la carta del rival → -1 a su fuerza.
 * Si falló → no aplica nada (el rival no recibe el +1 universal, porque acá no jugamos carta).
 */
export function penalizacionPorPasarConAcierto(
  miPremonicion: Categoria,
  oponenteCategoria: Categoria | undefined,
): number {
  if (oponenteCategoria === undefined) return 0
  if (miPremonicion === oponenteCategoria) return 1
  return 0
}
