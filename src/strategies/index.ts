// Registro de estrategias por raza. Un solo punto de import para el engine.

import type { Race } from '@/engine/types'
import type { BaseRaceStrategy } from './base'
import { quralanStrategy } from './quralan'
import { tezhalStrategy } from './tezhal'
import { wuronStrategy } from './wuron'
import { zaqeStrategy } from './zaqe'

export const STRATEGIES: Readonly<Record<Race, BaseRaceStrategy>> = {
  quralan: quralanStrategy,
  wuron: wuronStrategy,
  tezhal: tezhalStrategy,
  zaqe: zaqeStrategy,
}

export function strategyFor(race: Race): BaseRaceStrategy {
  return STRATEGIES[race]
}
