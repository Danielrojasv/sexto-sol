// PlayView — STUB Phase 1a v4.2.
//
// La UI completa se reescribe en Phase 3 con:
//   - Selector secreto de premonición integrado al modal de elección de carta.
//   - Historial visible de premoniciones reveladas.
//   - ResolucionPanel con desglose lectura del rival + bonus planeta + clauses.
//
// Por ahora, este stub solo muestra el estado de la partida + un mensaje
// indicando que la UI v4.2 está en construcción.

import { useGameStore } from '@/store/gameStore'

export function PlayView() {
  const state = useGameStore((s) => s.state)
  const goHome = useGameStore((s) => s.goHome)
  if (!state) return null
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Sexto Sol — v4.2 (UI en migración)</h1>
        <div className="bg-slate-900 p-4 rounded space-y-2 text-sm">
          <div>Tramo: <b>{state.tramo}</b></div>
          <div>Turno: <b>{state.turno}/7</b></div>
          <div>Sub-paso: <b>{state.subPaso}</b></div>
          <div className="pt-2 border-t border-slate-700">
            <div>Jugador A ({state.players.a.raza}): F {state.players.a.atributos.fuerza} / R {state.players.a.atributos.resguardo} / Res {state.players.a.atributos.resonancia}</div>
            <div>Jugador B ({state.players.b.raza}): F {state.players.b.atributos.fuerza} / R {state.players.b.atributos.resguardo} / Res {state.players.b.atributos.resonancia}</div>
          </div>
        </div>
        <p className="text-amber-400">
          UI v4.2 en construcción — Phase 3 del refactor restaura el flujo completo con
          selector secreto de premonición + historial visible.
        </p>
        <button
          onClick={goHome}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  )
}
