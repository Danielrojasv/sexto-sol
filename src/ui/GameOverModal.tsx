import type { GameState } from '@/engine/types'
import { useGameStore } from '@/store/gameStore'

export function GameOverModal({ state }: { state: GameState }) {
  const goHome = useGameStore((s) => s.goHome)
  const startGame = useGameStore((s) => s.startGame)
  const lastConfig = useGameStore((s) => s.lastConfig)

  const a = state.players.a.atributos
  const b = state.players.b.atributos
  const winner = state.ganador

  const row = (label: string, va: number, vb: number) => {
    const ganaA = va > vb
    const ganaB = vb > va
    return (
      <tr className="border-b border-slate-700">
        <td className="py-1 px-3 text-slate-400">{label}</td>
        <td className={`py-1 px-3 text-center font-bold tabular-nums ${ganaA ? 'text-green-400' : ''}`}>
          {va}
        </td>
        <td className={`py-1 px-3 text-center font-bold tabular-nums ${ganaB ? 'text-green-400' : ''}`}>
          {vb}
        </td>
      </tr>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-30 flex items-center justify-center p-6">
      <div className="bg-slate-900 rounded-lg p-6 max-w-md w-full space-y-4">
        <h2 className="text-3xl font-bold text-center">
          {winner === 'a' && 'Ganaste el Sexto Sol'}
          {winner === 'b' && 'Tu peregrinaje fue leído'}
          {winner === 'empate' && 'Empate técnico'}
        </h2>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-600">
              <th className="py-2 px-3 text-left">Atributo</th>
              <th className="py-2 px-3">Tú (A)</th>
              <th className="py-2 px-3">Rival (B)</th>
            </tr>
          </thead>
          <tbody>
            {row('Fuerza', a.fuerza, b.fuerza)}
            {row('Resguardo', a.resguardo, b.resguardo)}
            {row('Resonancia', a.resonancia, b.resonancia)}
          </tbody>
        </table>
        {state.finalTally && (
          <div className="text-center text-amber-400 text-xl font-bold">
            Tally: {state.finalTally.a} - {state.finalTally.b}
          </div>
        )}
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => lastConfig && startGame(lastConfig)}
            className="px-4 py-2 bg-amber-600 text-slate-950 font-bold rounded"
          >
            Jugar de nuevo
          </button>
          <button onClick={goHome} className="px-4 py-2 bg-slate-700 rounded">
            Cambiar mazo
          </button>
        </div>
      </div>
    </div>
  )
}
