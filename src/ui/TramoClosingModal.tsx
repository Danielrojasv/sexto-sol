import { POOL_REGISTRY } from '@/data/cards/loader'
import type { Categoria, GameState } from '@/engine/types'
import { useGameStore } from '@/store/gameStore'

const CAT_TO_ATR: Record<Categoria, keyof GameState['players']['a']['atributos']> = {
  Ataque: 'fuerza',
  Defensa: 'resguardo',
  Ritual: 'resonancia',
}

export function TramoClosingModal({ state }: { state: GameState }) {
  const dispatch = useGameStore((s) => s.dispatch)
  const tramoLabel = state.tramo === 'nebulosa' ? 'Nebulosa' : 'Estrellas'

  const renderJugador = (pid: 'a' | 'b') => {
    const player = state.players[pid]
    if (!player.planetElegidoActual) return null
    const planet = POOL_REGISTRY.planets.get(player.planetElegidoActual)!
    const atrKey = CAT_TO_ATR[planet.categoria]
    const mi = player.atributos[atrKey]
    const oponente = state.players[pid === 'a' ? 'b' : 'a'].atributos[atrKey]
    const gano = mi > oponente
    return (
      <div className="bg-slate-800 p-4 rounded space-y-2">
        <div className="font-bold">Jugador {pid.toUpperCase()}</div>
        <div className="text-sm text-slate-300">
          Eligió: <span className="font-semibold">{planet.nombre}</span> ({planet.categoria})
        </div>
        <div className="text-sm">
          {planet.categoria} propio: <b>{mi}</b> vs oponente: {oponente}
        </div>
        <div className={`text-sm font-bold ${gano ? 'text-green-400' : 'text-slate-500'}`}>
          {gano ? '✓ Ganó el tramo → héroe avanza' : 'No avanza héroe'}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-30 flex items-center justify-center p-6">
      <div className="bg-slate-900 rounded-lg p-6 max-w-2xl w-full space-y-4">
        <h2 className="text-2xl font-bold">Cierre de {tramoLabel}</h2>
        <div className="grid grid-cols-2 gap-4">
          {renderJugador('a')}
          {renderJugador('b')}
        </div>
        <button
          onClick={() => dispatch({ type: 'CLOSE_TRAMO' })}
          className="w-full py-2 bg-amber-600 text-slate-950 font-bold rounded"
        >
          Continuar
        </button>
      </div>
    </div>
  )
}
