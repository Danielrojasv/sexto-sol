// PrivacyShield — pantalla full-screen entre turnos en hot-seat para que el
// jugador entrante no vea la mano del saliente accidentalmente.

import { useGameStore } from '@/store/gameStore'

export function PrivacyShield() {
  const state = useGameStore((s) => s.state)
  const acknowledge = useGameStore((s) => s.acknowledgePrivacy)

  if (!state) return null
  const next = state.activePlayer === 'p1' ? '1' : '2'

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-40 p-6">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-amber-400 text-sm uppercase tracking-widest">Hot-seat</div>
        <h2 className="text-3xl sm:text-4xl font-semibold">
          Pasale el dispositivo al Jugador {next}
        </h2>
        <p className="text-slate-400">
          Para mantener oculta tu mano, no revelés esta pantalla hasta que esté listo.
        </p>
        <button
          type="button"
          onClick={acknowledge}
          className="mt-4 px-6 py-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold"
        >
          Soy el Jugador {next} — empezar mi turno
        </button>
      </div>
    </div>
  )
}
