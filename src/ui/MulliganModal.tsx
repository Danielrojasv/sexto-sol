// Mulligan inicial v4.2 — pantalla previa al primer turno.
//
// Daniel pidió esto explícitamente post-playtest: "Antes de comenzar debería
// ver mi mano y la posibilidad de hacer mulligan". El modal muestra la mano
// y dos opciones: cambiar la mano (MULLIGAN) o aceptar (KEEP_HAND). 1 mulligan
// máximo — si ya se usó, el botón cambia a "Aceptá esta mano".

import { POOL_REGISTRY } from '@/data/cards/loader'
import type { PlayerId } from '@/engine/types'
import { useGameStore } from '@/store/gameStore'
import { CardView } from './CardView'

export function MulliganModal({ playerId }: { playerId: PlayerId }) {
  const state = useGameStore((s) => s.state)
  const dispatch = useGameStore((s) => s.dispatch)
  if (!state) return null
  const player = state.players[playerId]
  if (player.manoAceptada) return null

  return (
    <div className="fixed inset-0 bg-slate-950/90 z-30 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 max-w-3xl w-full space-y-4">
        <header className="space-y-1">
          <h2 className="text-2xl font-bold">Mano inicial</h2>
          <p className="text-slate-400 text-sm">
            Mirá tu mano. Podés cambiarla una vez (mulligan) o aceptar para empezar el peregrinaje.
          </p>
        </header>
        <div className="flex gap-2 flex-wrap">
          {player.mano.map((cardId) => {
            const card = POOL_REGISTRY.cards.get(cardId)
            if (!card) return null
            return <CardView key={cardId} card={card} disabled />
          })}
        </div>
        <div className="flex justify-end gap-3 pt-2">
          {!player.mulliganUsado && (
            <button
              onClick={() => dispatch({ type: 'MULLIGAN', playerId })}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded font-semibold"
            >
              Cambiar mano (1 mulligan)
            </button>
          )}
          <button
            onClick={() => dispatch({ type: 'KEEP_HAND', playerId })}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded font-bold"
          >
            {player.mulliganUsado ? 'Aceptá esta mano' : 'Aceptar mano'}
          </button>
        </div>
      </div>
    </div>
  )
}
