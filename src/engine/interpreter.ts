// Interpreter puro de condicionales de cartas de Acción — Sexto Sol v4.1.
//
// Input: definición de carta + premoniciones + planeta-elegido + tramo + estado y raza del héroe.
// Output: { fuerzaFinal, sideEffects, categoria, owner }.
//
// Sin parsing de strings — lee directamente los campos estructurados
// (fuerzaDelta, sideEffect) de las condicionales del YAML migrado. IQ3 cerrada en rev 2 del spec.
//
// El reducer aplica el bonus Würon Despertada en un segundo pase (después de saber
// la categoría jugada por el oponente), via aplicarBonusWuronDespertada().

import type {
  CardActionDef,
  CardPlanetDef,
  Categoria,
  HeroEstado,
  InterpretResult,
  PlayerId,
  PremonicionTipo,
  Raza,
  SideEffect,
  Tramo,
} from './types'

export interface InterpretInput {
  card: CardActionDef
  miPremonicion: Categoria
  oponentePremonicion: Categoria
  planetElegido: CardPlanetDef | undefined
  tramo: Tramo
  heroEstado: HeroEstado
  raza: Raza
  owner: PlayerId
}

/**
 * Evalúa las cláusulas condicionales de una carta y produce fuerza final + side effects.
 * Aplica:
 *   - Cláusulas premonicion_propia / premonicion_oponente / premonicion_acierta.
 *   - Bonus de planeta (+1) SOLO en Nebulosa y Estrellas, NUNCA en Sexto Sol.
 *   - Habilidad pasiva Tezhal Despertado: +1 fuerza a cartas Ataque.
 *
 * No aplica:
 *   - Eclipse ×2 — el reducer lo aplica después de anulaciones cruzadas.
 *   - Anulaciones — se devuelven como sideEffects; el reducer las cruza con la otra carta.
 *   - Bonus Würon Despertada — el reducer lo aplica en un segundo pase con info de
 *     la categoría jugada por el oponente, vía aplicarBonusWuronDespertada().
 *
 * La fuerza final nunca es negativa (Math.max(0, ...)).
 */
export function interpretCondicionales(input: InterpretInput): InterpretResult {
  const {
    card,
    miPremonicion,
    oponentePremonicion,
    planetElegido,
    tramo,
    heroEstado,
    raza,
    owner,
  } = input

  let fuerza = card.fuerzaBase
  const sideEffects: SideEffect[] = []

  // 1. Aplicar cláusulas condicionales (orden listado en la carta).
  for (const cond of card.condicionales) {
    if (
      !isClauseTriggered(cond.tipo, cond.valor, miPremonicion, oponentePremonicion, card.categoria)
    ) {
      continue
    }
    if (cond.fuerzaDelta !== undefined) {
      fuerza += cond.fuerzaDelta
    }
    if (cond.sideEffect !== undefined) {
      sideEffects.push(cond.sideEffect)
    }
  }

  // 2. Bonus de planeta: SOLO en Nebulosa y Estrellas, NUNCA en Sexto Sol.
  //    Y solo si la categoría de la carta coincide con la del planeta-elegido.
  if (
    tramo !== 'sexto_sol' &&
    planetElegido !== undefined &&
    planetElegido.categoria === card.categoria
  ) {
    fuerza += 1
  }

  // 3. Habilidad pasiva Tezhal Despertado/Ascendido: +1 fuerza a cartas Ataque.
  if (
    raza === 'Tezhal' &&
    (heroEstado === 'despertado' || heroEstado === 'ascendido') &&
    card.categoria === 'Ataque'
  ) {
    fuerza += 1
  }

  return {
    fuerzaFinal: Math.max(0, fuerza),
    sideEffects,
    categoria: card.categoria,
    owner,
  }
}

function isClauseTriggered(
  tipo: PremonicionTipo,
  valor: Categoria | undefined,
  miPremonicion: Categoria,
  oponentePremonicion: Categoria,
  cardCategoria: Categoria,
): boolean {
  switch (tipo) {
    case 'premonicion_propia':
      return valor !== undefined && miPremonicion === valor
    case 'premonicion_oponente':
      return valor !== undefined && oponentePremonicion === valor
    case 'premonicion_acierta':
      // "La premonición del oponente coincide con la categoría de esta carta."
      return oponentePremonicion === cardCategoria
  }
}

/**
 * Aplica el bonus Würon Despertada después de saber la categoría jugada por el oponente.
 * Llamado por el reducer en REVEAL después del primer pase de interpret de ambas cartas.
 *
 * Spec: "Würon Despertada: cuando tu premonición acierta la categoría del oponente,
 * +1 fuerza adicional este turno."
 *
 * "Acertar" = mi premonición sobre el oponente coincide con la categoría que él jugó.
 *
 * @returns Delta extra a la fuerza si aplica, 0 si no.
 */
export function aplicarBonusWuronDespertada(opts: {
  heroEstado: HeroEstado
  raza: Raza
  miPremonicion: Categoria
  categoriaJugadaPorOponente: Categoria | undefined
}): number {
  const { heroEstado, raza, miPremonicion, categoriaJugadaPorOponente } = opts
  if (raza !== 'Würon') return 0
  if (heroEstado !== 'despertado' && heroEstado !== 'ascendido') return 0
  if (categoriaJugadaPorOponente === undefined) return 0
  if (miPremonicion === categoriaJugadaPorOponente) return 1
  return 0
}
