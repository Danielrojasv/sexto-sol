// Strategy pattern por raza.
//
// Cada raza implementa BaseRaceStrategy con su categoría de mecánica
// (reactive | initiative | accumulative | post_combat) y su mecánica firma.
// Agregar raza nueva = nueva estrategia, sin tocar las existentes (Open/Closed).

import type { EventHandler } from '@/engine/events'
import type { Card, HeroDefinition, MechanicCategory, Race } from '@/engine/types'

export interface RacePassive {
  id: string
  description: string
}

export interface BaseRaceStrategy {
  /** Identificador de la raza (ej. 'wuron'). */
  race: Race
  /** Categoría de la mecánica firma. Define el orden de resolución del event bus. */
  category: MechanicCategory
  /**
   * Identificador de la mecánica firma (ej. 'kulen', 'ignicion', 'formacion_solar', 'refluencia').
   * Provisional v0.1 — confirmar nombres definitivos en próxima iteración.
   */
  signatureKeyword: string
  /** Mazo inicial sugerido para draft / starter deck. */
  startingDeck: readonly Card[]
  /** 1-3 héroes elegibles por la raza al armar mazo. */
  heroOptions: readonly HeroDefinition[]
  /** Hooks de keywords/triggers que registra esta raza en el event bus. */
  registerKeywords(): readonly EventHandler[]
  /** Pasivas globales de la raza (efectos siempre-on). */
  registerPassives(): readonly RacePassive[]
}
