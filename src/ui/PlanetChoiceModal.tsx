import { POOL_REGISTRY } from '@/data/cards/loader'
import type { GameState, PlayerId } from '@/engine/types'
import { useGameStore } from '@/store/gameStore'
import { PlanetCard } from './CardView'

export function PlanetChoiceModal({
  state,
  playerId,
}: {
  state: GameState
  playerId: PlayerId
}) {
  const dispatch = useGameStore((s) => s.dispatch)
  const pool = state.tramo === 'nebulosa' ? state.poolPlanetasNebulosa : state.poolPlanetasEstrellas
  const tramoLabel = state.tramo === 'nebulosa' ? 'Nebulosa' : 'Estrellas'

  return (
    <div className="fixed inset-0 bg-black/80 z-30 flex items-center justify-center p-6">
      <div className="bg-slate-900 rounded-lg p-6 max-w-3xl w-full space-y-4">
        <h2 className="text-2xl font-bold">
          Jugador {playerId.toUpperCase()} — Elegí tu planeta de {tramoLabel}
        </h2>
        <p className="text-slate-400 text-sm">
          Elección secreta. Las cartas de tu categoría elegida ganan +1 fuerza durante este tramo.
        </p>
        <div className="flex gap-4 flex-wrap">
          {pool.map((id) => {
            const planet = POOL_REGISTRY.planets.get(id)
            if (!planet) return null
            return (
              <PlanetCard
                key={id}
                planet={planet}
                onClick={() => dispatch({ type: 'SELECT_PLANET', playerId, planetId: id })}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
