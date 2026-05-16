import type { PlayerId } from '@/engine/types'
import { useGameStore } from '@/store/gameStore'

export function EclipseConfirmModal({
  playerId,
  onClose,
}: {
  playerId: PlayerId
  onClose: () => void
}) {
  const dispatch = useGameStore((s) => s.dispatch)
  const handleInvoke = () => {
    dispatch({ type: 'INVOKE_ECLIPSE', playerId })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-30 flex items-center justify-center p-6">
      <div className="bg-slate-900 rounded-lg p-6 max-w-md space-y-4">
        <h2 className="text-2xl font-bold">Invocar Eclipse</h2>
        <ul className="text-slate-300 space-y-1 text-sm">
          <li>· Tu acción este turno cuenta <b>doble</b> al atributo correspondiente.</li>
          <li>· El oponente roba <b>1 carta extra</b> antes de jugar.</li>
          <li>· La partida <b>termina al final</b> de este turno.</li>
          <li>· Solo 1 vez por partida (cualquier jugador).</li>
        </ul>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-slate-700 rounded">
            Cancelar
          </button>
          <button
            onClick={handleInvoke}
            className="px-4 py-2 bg-amber-600 text-slate-950 font-bold rounded"
          >
            Invocar
          </button>
        </div>
      </div>
    </div>
  )
}
