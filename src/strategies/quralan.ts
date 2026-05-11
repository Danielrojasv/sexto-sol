// Q'ralan — "Hijos del Sol Pétreo"
// Categoría: Acumulativa. Mecánica firma: Formación Solar (+1 fuerza por cada otra nave Q'ralan).
//
// Phase 1: skeleton vacío. Implementación real en Phase 3.

import type { EventHandler } from '@/engine/events'
import type { BaseRaceStrategy } from './base'

export const quralanStrategy: BaseRaceStrategy = {
  race: 'quralan',
  category: 'accumulative',
  signatureKeyword: 'formacion_solar',
  startingDeck: [],
  registerKeywords(): readonly EventHandler[] {
    return []
  },
  registerPassives() {
    return []
  },
}
