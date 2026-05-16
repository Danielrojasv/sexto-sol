// HistorialPanel v4.2 — muestra premoniciones reveladas de turnos anteriores.
//
// El SPEC v4.2 §6 dice: "tras cada revelado, las premoniciones quedan visibles
// públicamente". Este panel muestra hasta los últimos 5 turnos, con un hint de
// quién acertó.

import type { Categoria, GameState } from '@/engine/types'
import { useGameStore } from '@/store/gameStore'

export function HistorialPanel() {
  const state = useGameStore((s) => s.state)
  if (!state) return null
  if (state.historialPremoniciones.length === 0) return null
  const last5 = state.historialPremoniciones.slice(-5)

  return (
    <details className="bg-slate-900 rounded p-3 text-sm">
      <summary className="cursor-pointer text-slate-300 font-semibold">
        Historial de premoniciones ({state.historialPremoniciones.length} turnos)
      </summary>
      <table className="mt-2 w-full text-xs">
        <thead>
          <tr className="text-slate-500">
            <th className="text-left p-1">Turno</th>
            <th className="text-left p-1">Tramo</th>
            <th className="text-left p-1">Vos · prem→carta</th>
            <th className="text-left p-1">Oponente · prem→carta</th>
          </tr>
        </thead>
        <tbody>
          {last5.map((e) => (
            <tr key={e.turno} className="border-t border-slate-700">
              <td className="p-1">{e.turno}</td>
              <td className="p-1 text-slate-400">{e.tramo}</td>
              <td className="p-1">
                <span className={hit(e.a, e.cardCategoriaB)}>{e.a}</span> →{' '}
                <span className="text-slate-300">{e.cardCategoriaA}</span>
              </td>
              <td className="p-1">
                <span className={hit(e.b, e.cardCategoriaA)}>{e.b}</span> →{' '}
                <span className="text-slate-300">{e.cardCategoriaB}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  )
}

function hit(prem: Categoria, rivalCard: Categoria): string {
  return prem === rivalCard ? 'text-emerald-400 font-semibold' : 'text-rose-400'
}

// Type-only re-export for consumers (not used here, but documents the shape).
export type { GameState }
