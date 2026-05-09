// Zaqe — "Mercaderes del Lago Cósmico"
// Categoría: Post-combate. Mecánica firma: Refluencia (naves derrotadas vuelven al fondo del mazo).
//
// Phase 1: skeleton vacío. Implementación real en Phase 3.

import type { EventHandler } from '@/engine/events'
import type { BaseRaceStrategy } from './base'

export const zaqeStrategy: BaseRaceStrategy = {
  race: 'zaqe',
  category: 'post_combat',
  signatureKeyword: 'refluencia',
  startingDeck: [],
  heroOptions: [],
  registerKeywords(): readonly EventHandler[] {
    return []
  },
  registerPassives() {
    return []
  },
}
