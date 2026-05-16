// PrivacyShield v4.1 — Hot-seat: pantalla completa entre cambios de jugador
// para que el entrante no vea info sensible del saliente.

import type { PlayerId } from '@/engine/types'

export function PrivacyShield({
  nextPlayer,
  onContinue,
}: {
  nextPlayer: PlayerId
  onContinue: () => void
}) {
  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-40 p-6">
      <div className="text-center space-y-6 max-w-md">
        <h2 className="text-2xl font-bold">
          Pasale el dispositivo al jugador {nextPlayer.toUpperCase()}
        </h2>
        <p className="text-slate-400">
          El otro jugador no debe ver tu mano ni tu planeta-elegido.
        </p>
        <button
          onClick={onContinue}
          className="px-6 py-3 bg-amber-600 text-slate-950 font-bold rounded-lg"
        >
          Estoy listo
        </button>
      </div>
    </div>
  )
}
