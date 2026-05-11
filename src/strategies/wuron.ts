// Würon — "Pueblos del Sur Profundo"
// Categoría: Reactiva. Mecánica firma: Külen (cada daño recibido = +1 fuerza permanente).
//
// Phase 1: skeleton vacío. Implementación real de Külen + Lof en Phase 3.

import type { EventHandler } from '@/engine/events'
import type { BaseRaceStrategy } from './base'

export const wuronStrategy: BaseRaceStrategy = {
  race: 'wuron',
  category: 'reactive',
  signatureKeyword: 'kulen',
  startingDeck: [],
  registerKeywords(): readonly EventHandler[] {
    return []
  },
  registerPassives() {
    return []
  },
}
