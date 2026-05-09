// Tezhal — "Devotos del Corazón Ardiente"
// Categoría: Iniciativa. Mecánica firma: Ignición (sacrificás nave propia para potenciar otra acción).
//
// Phase 1: skeleton vacío. Implementación real en Phase 3.

import type { EventHandler } from '@/engine/events'
import type { BaseRaceStrategy } from './base'

export const tezhalStrategy: BaseRaceStrategy = {
  race: 'tezhal',
  category: 'initiative',
  signatureKeyword: 'ignicion',
  startingDeck: [],
  heroOptions: [],
  registerKeywords(): readonly EventHandler[] {
    return []
  },
  registerPassives() {
    return []
  },
}
