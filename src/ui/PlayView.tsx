// PlayView v4.2 — orquestador del flujo de turno "Premonición como Lectura".
//
// Sub-pasos del turno:
//   mulligan_inicial   → MulliganModal (Daniel pidió mostrar la mano antes de empezar)
//   eleccion_planeta   → PlanetChoiceModal
//   robo               → botón "Robar y avanzar"
//   seleccion_secreta  → SecretSelectionPanel (premonición + carta ocultas en paralelo)
//   revelar            → botón "Revelar"
//   revisar_resolucion → ResolucionPanel (desglose paso a paso)
//   cierre_tramo       → TramoClosingModal
//   duelo_final        → botón "Ver duelo final"
//   terminado          → GameOverModal
//
// Auto-step para IA (vsIA, jugador B) con delay 150ms.

import { useEffect, useState } from 'react'
import { POOL_REGISTRY } from '@/data/cards/loader'
import type { Categoria, GameState, PlayerId } from '@/engine/types'
import { useGameStore } from '@/store/gameStore'
import { AttributeCounters } from './AttributeCounters'
import { CardBack, CardView } from './CardView'
import { EclipseConfirmModal } from './EclipseConfirmModal'
import { GameOverModal } from './GameOverModal'
import { HeroBadge } from './HeroBadge'
import { HistorialPanel } from './HistorialPanel'
import { MulliganModal } from './MulliganModal'
import { PlanetChoiceModal } from './PlanetChoiceModal'
import { ResolucionPanel } from './ResolucionPanel'
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
    // El humano controla revisar_resolucion (la IA no auto-avanza acá).
    if (state.subPaso === 'revisar_resolucion') return
    const t = setTimeout(() => {
      stepIA()
    }, 150)
    return () => clearTimeout(t)
  }, [state, stepIA, lastConfig])

  if (!state) return null

  const human: PlayerId = 'a'
  const enemy: PlayerId = 'b'
  const playerA = state.players[human]
  const playerB = state.players[enemy]
  const planetA = playerA.planetElegidoActual
    ? POOL_REGISTRY.planets.get(playerA.planetElegidoActual)
    : undefined

  const showMulligan = state.subPaso === 'mulligan_inicial' && !playerA.manoAceptada
  const showPlanetChoice = state.subPaso === 'eleccion_planeta' && !playerA.planetElegidoActual
  const showTramoClosing = state.subPaso === 'cierre_tramo'
  const showGameOver = state.subPaso === 'terminado'
  const showEclipseBtn =
    state.tramo === 'sexto_sol' &&
    !state.eclipseInvocado &&
    state.subPaso === 'seleccion_secreta' &&
    state.accionesPendientes[human] === undefined &&
    state.paseDeclarado[human] !== true

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 bg-slate-900 border-b border-slate-700 p-3 flex justify-between items-center z-10">
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

      <main className="p-4 space-y-4 max-w-5xl mx-auto">
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
          </div>
          {state.accionesPendientes[enemy] !== undefined &&
            state.subPaso !== 'revisar_resolucion' &&
            state.subPaso !== 'cierre_tramo' && (
              <div className="flex">
                <CardBack />
              </div>
            )}
          {state.subPaso === 'revisar_resolucion' && state.accionesPendientes[enemy] && (
            <RevealedCard cardId={state.accionesPendientes[enemy]!} />
          )}
        </section>

        {/* Zona central: resolución (solo en revisar_resolucion) */}
        {state.subPaso === 'revisar_resolucion' && <ResolucionPanel />}

        {/* Zona central — separador */}
        {state.subPaso !== 'revisar_resolucion' && (
          <div className="border-t border-slate-700 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-950 px-3 text-xs text-slate-500">
              ⋮ peregrinaje ⋮
            </div>
          </div>
        )}

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
          </div>

          {state.accionesPendientes[human] !== undefined &&
            state.subPaso !== 'revisar_resolucion' &&
            state.subPaso !== 'cierre_tramo' && (
              <div className="flex">
                <CardBack />
              </div>
            )}

          {state.subPaso === 'revisar_resolucion' && state.accionesPendientes[human] && (
            <RevealedCard cardId={state.accionesPendientes[human]!} />
          )}

          {/* Selección secreta — premonición + carta ocultas en paralelo */}
          {state.subPaso === 'seleccion_secreta' &&
            state.accionesPendientes[human] === undefined &&
            state.paseDeclarado[human] !== true && (
              <SecretSelectionPanel state={state} playerId={human} />
            )}

          {showEclipseBtn && (
            <button
              onClick={() => setEclipseModalOpen(true)}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-600 rounded font-semibold"
            >
              ☉ Invocar Eclipse
            </button>
          )}

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

        <HistorialPanel />
      </main>

      {showMulligan && <MulliganModal playerId={human} />}
      {showPlanetChoice && <PlanetChoiceModal state={state} playerId={human} />}
      {showTramoClosing && <TramoClosingModal state={state} />}
      {eclipseModalOpen && (
        <EclipseConfirmModal playerId={human} onClose={() => setEclipseModalOpen(false)} />
      )}
      {showGameOver && <GameOverModal state={state} />}
    </div>
  )
}

function SecretSelectionPanel({
  state,
  playerId,
}: {
  state: GameState
  playerId: PlayerId
}) {
  const dispatch = useGameStore((s) => s.dispatch)
  const lastConfig = useGameStore((s) => s.lastConfig)
  const [premonicion, setPremonicion] = useState<Categoria | null>(null)
  const player = state.players[playerId]
  const planet = player.planetElegidoActual
    ? POOL_REGISTRY.planets.get(player.planetElegidoActual)
    : undefined
  const showTooltips = lastConfig?.showTooltips ?? true

  return (
    <div className="space-y-3 border border-slate-700 rounded p-3 bg-slate-950/40">
      <div className="space-y-2">
        <div className="text-sm text-slate-300">
          1. Lee al rival — elegí qué categoría jugará (oculto):
        </div>
        <div className="flex gap-2">
          {CATEGORIAS.map((c) => (
            <button
              key={c}
              onClick={() => setPremonicion(c)}
              className={`px-3 py-2 rounded font-semibold transition ${
                premonicion === c
                  ? 'bg-amber-600 text-slate-950 ring-2 ring-amber-300'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        {showTooltips && (
          <div className="text-xs text-slate-500 italic">
            Si aciertas la categoría del rival, su carta pierde su penalización. Si fallás, su
            carta gana +1.
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="text-sm text-slate-300">
          2. Jugá tu carta (oculta hasta el revelado):
        </div>
        <div className="flex gap-2 flex-wrap">
          {player.mano.map((cardId) => {
            const card = POOL_REGISTRY.cards.get(cardId)
            if (!card) return null
            const jugable = card.coste <= state.turno && premonicion !== null
            return (
              <CardView
                key={cardId}
                card={card}
                disabled={!jugable}
                showTooltips={showTooltips}
                planetElegidoCategoria={planet?.categoria}
                onClick={() => {
                  if (premonicion === null) return
                  dispatch({
                    type: 'PLAY_HIDDEN',
                    playerId,
                    cardId,
                    premonicion,
                  })
                }}
              />
            )
          })}
        </div>
        <button
          onClick={() => {
            if (premonicion === null) return
            dispatch({ type: 'PASS_TURN', playerId, premonicion })
          }}
          disabled={premonicion === null}
          className="text-sm text-slate-400 hover:text-slate-200 underline disabled:opacity-50"
        >
          Pasar sin carta (solo declarás la premonición)
        </button>
      </div>
    </div>
  )
}

function prettySubPaso(s: GameState['subPaso']): string {
  switch (s) {
    case 'mulligan_inicial':
      return 'Mulligan'
    case 'eleccion_planeta':
      return 'Elegí planeta'
    case 'robo':
      return 'Robo'
    case 'seleccion_secreta':
      return 'Premonición + carta'
    case 'revelar':
      return 'Revelar'
    case 'revisar_resolucion':
      return 'Resolución'
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
