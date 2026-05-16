import { useEffect, useState } from 'react'
import { POOL_REGISTRY } from '@/data/cards/loader'
import type { Categoria, GameState, PlayerId } from '@/engine/types'
import { useGameStore } from '@/store/gameStore'
import { AttributeCounters } from './AttributeCounters'
import { CardBack, CardView } from './CardView'
import { EclipseConfirmModal } from './EclipseConfirmModal'
import { GameOverModal } from './GameOverModal'
import { HeroBadge } from './HeroBadge'
import { PlanetChoiceModal } from './PlanetChoiceModal'
import { TramoClosingModal } from './TramoClosingModal'

const TRAMO_LABEL: Record<string, string> = {
  nebulosa: 'Nebulosa',
  estrellas: 'Estrellas',
  sexto_sol: 'Sexto Sol',
}

const CATEGORIAS: Categoria[] = ['Ataque', 'Defensa', 'Ritual']

export function PlayView() {
  const state = useGameStore((s) => s.state)
  const dispatch = useGameStore((s) => s.dispatch)
  const stepIA = useGameStore((s) => s.stepIA)
  const lastConfig = useGameStore((s) => s.lastConfig)
  const [eclipseModalOpen, setEclipseModalOpen] = useState(false)

  // Auto-step IA (vsIA) cuando sub-paso requiere acción de B.
  useEffect(() => {
    if (!state) return
    if (lastConfig?.modo !== 'vsIA') return
    if (state.subPaso === 'terminado') return
    // Delay 150ms (IQ7) entre actions de IA para no colapsar frames.
    const t = setTimeout(() => {
      stepIA()
    }, 150)
    return () => clearTimeout(t)
  }, [state, stepIA, lastConfig])

  if (!state) return null

  const showTooltips = lastConfig?.showTooltips ?? true
  const human: PlayerId = 'a'
  const enemy: PlayerId = 'b'
  const playerA = state.players[human]
  const playerB = state.players[enemy]
  const planetA = playerA.planetElegidoActual
    ? POOL_REGISTRY.planets.get(playerA.planetElegidoActual)
    : undefined

  const showPlanetChoice = state.subPaso === 'eleccion_planeta' && !playerA.planetElegidoActual
  const showTramoClosing = state.subPaso === 'cierre_tramo'
  const showGameOver = state.subPaso === 'terminado'
  const showEclipseBtn =
    state.tramo === 'sexto_sol' &&
    !state.eclipseInvocado &&
    (state.subPaso === 'accion_pendiente' || state.subPaso === 'premonicion_pendiente') &&
    state.accionesPendientes[human] === undefined &&
    state.paseDeclarado[human] !== true

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 bg-slate-900 border-b border-slate-700 p-3 flex justify-between items-center">
        <div>
          <span className="text-amber-400 font-bold">{TRAMO_LABEL[state.tramo]}</span>
          <span className="text-slate-400 ml-3">
            Turno {state.turno}/7 · {prettySubPaso(state.subPaso)}
          </span>
        </div>
        <div className="text-sm text-slate-400">
          Energía: <span className="text-amber-400 font-bold">{state.turno}</span>
        </div>
      </header>

      <main className="p-4 space-y-6 max-w-5xl mx-auto">
        {/* Zona enemigo */}
        <section className="bg-slate-900 p-4 rounded space-y-3">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="text-xs text-slate-400 uppercase">Oponente</div>
              <HeroBadge raza={playerB.raza} estado={playerB.heroEstado} />
            </div>
            <AttributeCounters atributos={playerB.atributos} />
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <span>Mazo: {playerB.mazoRestante.length}</span>
            <span>Mano: {playerB.mano.length}</span>
            <span>Pozo: {playerB.pozo.length}</span>
            {state.premoniciones[enemy] && (
              <span className="text-amber-400">
                Premonición declarada: <b>{state.premoniciones[enemy]}</b>
              </span>
            )}
          </div>
          {state.accionesPendientes[enemy] !== undefined && state.subPaso !== 'revelar' && (
            <div className="flex">
              <CardBack />
            </div>
          )}
          {state.subPaso === 'revelar' && state.accionesPendientes[enemy] && (
            <RevealedCard cardId={state.accionesPendientes[enemy]!} />
          )}
        </section>

        {/* Zona central — separador */}
        <div className="border-t border-slate-700 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-950 px-3 text-xs text-slate-500">
            ⋮ peregrinaje ⋮
          </div>
        </div>

        {/* Zona jugador (A) */}
        <section className="bg-slate-900 p-4 rounded space-y-3">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="text-xs text-slate-400 uppercase">Vos</div>
              <HeroBadge raza={playerA.raza} estado={playerA.heroEstado} />
            </div>
            <AttributeCounters atributos={playerA.atributos} />
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <span>Mazo: {playerA.mazoRestante.length}</span>
            <span>Pozo: {playerA.pozo.length}</span>
            {planetA && (
              <span className="text-amber-400">
                Planeta-elegido: <b>{planetA.nombre}</b> ({planetA.categoria})
              </span>
            )}
            {state.premoniciones[human] && (
              <span className="text-amber-400">
                Tu premonición: <b>{state.premoniciones[human]}</b>
              </span>
            )}
          </div>

          {state.accionesPendientes[human] !== undefined && state.subPaso !== 'revelar' && (
            <div className="flex">
              <CardBack />
            </div>
          )}

          {state.subPaso === 'revelar' && state.accionesPendientes[human] && (
            <RevealedCard cardId={state.accionesPendientes[human]!} />
          )}

          {/* Botones de premonición */}
          {state.subPaso === 'premonicion_pendiente' && !state.premoniciones[human] && (
            <div className="space-y-2">
              <div className="text-sm text-slate-300">Declará tu premonición:</div>
              <div className="flex gap-2">
                {CATEGORIAS.map((c) => (
                  <button
                    key={c}
                    onClick={() =>
                      dispatch({ type: 'DECLARE_PREMONICION', playerId: human, categoria: c })
                    }
                    className="px-4 py-2 bg-amber-700 hover:bg-amber-600 rounded font-semibold"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showEclipseBtn && (
            <button
              onClick={() => setEclipseModalOpen(true)}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-600 rounded font-semibold"
            >
              ☉ Invocar Eclipse
            </button>
          )}

          {/* Mano del jugador */}
          {state.subPaso === 'accion_pendiente' &&
            state.accionesPendientes[human] === undefined &&
            state.paseDeclarado[human] !== true && (
              <div className="space-y-2">
                <div className="text-sm text-slate-300">Tu mano:</div>
                <div className="flex gap-2 flex-wrap">
                  {playerA.mano.map((cardId) => {
                    const card = POOL_REGISTRY.cards.get(cardId)
                    if (!card) return null
                    const jugable = card.coste <= state.turno
                    return (
                      <CardView
                        key={cardId}
                        card={card}
                        disabled={!jugable}
                        showTooltips={showTooltips}
                        planetElegidoCategoria={planetA?.categoria}
                        onClick={() => dispatch({ type: 'PLAY_HIDDEN', playerId: human, cardId })}
                      />
                    )
                  })}
                </div>
                <button
                  onClick={() => dispatch({ type: 'PASS_TURN', playerId: human })}
                  className="text-sm text-slate-400 hover:text-slate-200 underline"
                >
                  Declarar "Pasa" (no jugar nada)
                </button>
              </div>
            )}

          {/* Botón continuar revelado / siguiente turno */}
          {state.subPaso === 'revelar' && (
            <button
              onClick={() => dispatch({ type: 'REVEAL' })}
              className="px-4 py-2 bg-amber-600 text-slate-950 font-bold rounded"
            >
              Revelar y resolver
            </button>
          )}
          {state.subPaso === 'robo' && (
            <button
              onClick={() => dispatch({ type: 'DRAW_BOTH' })}
              className="px-4 py-2 bg-slate-700 rounded"
            >
              Robar y avanzar
            </button>
          )}
          {state.subPaso === 'duelo_final' && (
            <button
              onClick={() => dispatch({ type: 'END_GAME' })}
              className="px-4 py-2 bg-amber-600 text-slate-950 font-bold rounded"
            >
              Ver duelo final
            </button>
          )}
        </section>
      </main>

      {showPlanetChoice && <PlanetChoiceModal state={state} playerId={human} />}
      {showTramoClosing && <TramoClosingModal state={state} />}
      {eclipseModalOpen && (
        <EclipseConfirmModal playerId={human} onClose={() => setEclipseModalOpen(false)} />
      )}
      {showGameOver && <GameOverModal state={state} />}
    </div>
  )
}

function prettySubPaso(s: GameState['subPaso']): string {
  switch (s) {
    case 'eleccion_planeta':
      return 'Elegí planeta'
    case 'robo':
      return 'Robo'
    case 'accion_pendiente':
      return 'Jugá una carta'
    case 'premonicion_pendiente':
      return 'Declará premonición'
    case 'revelar':
      return 'Revelar'
    case 'cierre_tramo':
      return 'Cierre de tramo'
    case 'duelo_final':
      return 'Duelo final'
    case 'terminado':
      return 'Partida terminada'
  }
}

function RevealedCard({ cardId }: { cardId: string }) {
  const card = POOL_REGISTRY.cards.get(cardId)
  if (!card) return null
  return (
    <div className="flex">
      <CardView card={card} disabled />
    </div>
  )
}
