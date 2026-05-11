// PlayView — tablero jugable. Wire de acciones: PLAY_CARD, ACTIVATE_PLANET,
// DECLARE_ATTACK con target picker, END_PHASE, CONCEDE, DEPLOY_HERO.

import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { cardById } from '@/data/cards'
import { decideAction } from '@/engine/ai/scriptedAI'
import { getEffectiveStrength } from '@/engine/derive/strength'
import type { GameState, PlayerId, PlayerState, ShipInstance } from '@/engine/types'
import { MiniCard } from './MiniCard'
import { PrivacyShield } from './PrivacyShield'

/** Delay visual entre acciones IA (ms) — el usuario debe alcanzar a ver
 *  qué hace la IA antes de la siguiente acción. */
const AI_ACTION_DELAY_MS = 1200

const PHASE_LABEL: Record<string, string> = {
  recoleccion: 'Recolección',
  despliegue: 'Despliegue',
  combate: 'Combate',
  regroup: 'Regroup',
  eclipse: 'Eclipse',
}

const HAND_CAP = 7

function HPBar({ current, max }: { current: number; max: number }) {
  const pct = Math.max(0, (current / max) * 100)
  return (
    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-red-700 via-amber-600 to-emerald-600 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function FleetCard({
  ship,
  isOwn,
  isActive,
  selectedAttackerIds,
  state,
  onClick,
}: {
  ship: ShipInstance
  isOwn: boolean
  isActive: boolean
  selectedAttackerIds: readonly string[]
  state: GameState
  onClick?: () => void
}) {
  const cardDef = cardById(ship.cardId)
  const isSelected = selectedAttackerIds.includes(ship.instanceId)
  const hasSelection = selectedAttackerIds.length > 0
  const alreadyAttacked = ship.hasAttackedThisTurn === true
  const sickness = ship.summoningSickness === true && !ship.keywords.includes('embate')
  const canAttack = isOwn && isActive && !alreadyAttacked && !sickness
  const effStrength = getEffectiveStrength(ship, state)

  if (!cardDef) {
    return (
      <div className="flex-shrink-0 w-[90px] aspect-[2/3] rounded bg-slate-800 border border-slate-700 p-2">
        <div className="text-[10px] text-slate-300">{ship.cardId}</div>
        <div className="text-[10px] font-mono text-slate-400 mt-1">
          {effStrength}/{ship.hp}
        </div>
      </div>
    )
  }
  const highlight: 'selected' | 'valid' | 'invalid' | null = isSelected
    ? 'selected'
    : !isOwn && hasSelection
      ? 'valid' // target candidate
      : canAttack
        ? 'valid' // selectable attacker
        : alreadyAttacked || sickness
          ? 'invalid'
          : null
  return (
    <div className="relative">
      <MiniCard
        card={cardDef}
        compact
        shipInstance={ship}
        effectiveStrength={effStrength}
        onClick={onClick}
        highlight={highlight}
      />
      {alreadyAttacked && (
        <div className="absolute top-1 left-1 text-[8px] font-semibold px-1 rounded bg-red-900/80 text-red-200 pointer-events-none">
          atacó
        </div>
      )}
      {sickness && !alreadyAttacked && (
        <div className="absolute top-1 left-1 text-[8px] font-semibold px-1 rounded bg-slate-800/80 text-slate-300 pointer-events-none">
          mareo
        </div>
      )}
    </div>
  )
}

function PlayerSection({
  player,
  pState,
  isActive,
  isCurrentViewer,
  state,
}: {
  player: PlayerId
  pState: PlayerState
  isActive: boolean
  isCurrentViewer: boolean
  state: GameState
}) {
  const dispatch = useGameStore((s) => s.dispatch)
  const toggleAttacker = useGameStore((s) => s.toggleAttacker)
  const clearAttackers = useGameStore((s) => s.clearAttackers)
  const selectedAttackerIds = useGameStore((s) => s.selectedAttackerIds)

  const phase = state.phase
  const isOwn = isActive

  const handleHandCardClick = (cardId: string) => {
    if (!isOwn) return
    if (phase !== 'despliegue') return
    dispatch({ type: 'PLAY_CARD', cardId })
  }

  const handleFleetShipClick = (shipId: string, owner: PlayerId) => {
    if (phase !== 'combate') return
    if (state.outcome.kind !== 'in_progress') return

    // Click sobre nave propia: toggle multi-select (si puede atacar).
    if (owner === state.activePlayer) {
      const ship = state.players[owner].fleet.find((s) => s.instanceId === shipId)
      if (!ship) return
      const sickness = ship.summoningSickness && !ship.keywords.includes('embate')
      if (ship.hasAttackedThisTurn || sickness) return
      toggleAttacker(shipId)
      return
    }
    // Click sobre nave enemiga con atacantes seleccionados → dispatch N ataques.
    if (selectedAttackerIds.length > 0) {
      // Dispatchear secuencialmente: cada uno actualiza state via store, así
      // el segundo dispatch ve el state post-primer-ataque.
      for (const atkId of selectedAttackerIds) {
        dispatch({
          type: 'DECLARE_ATTACK',
          attackerShipId: atkId,
          target: { kind: 'ship', ref: shipId },
        })
      }
      clearAttackers()
    }
  }

  return (
    <section
      className={`p-3 sm:p-4 ${isActive ? 'bg-amber-950/30' : 'bg-slate-900/40'} ${
        player === 'p1' ? 'border-t' : 'border-b'
      } border-slate-800`}
    >
      <div className="flex items-center gap-3 mb-2 flex-wrap">
        <div
          className={`w-2 h-2 rounded-full ${isActive ? 'bg-amber-400 animate-pulse' : 'bg-slate-700'}`}
        />
        <div className="text-xs uppercase tracking-wider text-slate-400">
          Jugador {player === 'p1' ? '1' : '2'}{isActive && ' — activo'}
        </div>
        <div className="text-sm font-semibold capitalize">{pState.race}</div>
        <div className="ml-auto text-[11px] text-slate-400 font-mono">
          ⚡ {pState.energy} · 🃏 {pState.deck.length} · 💀 {pState.graveyard.length}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-[11px] font-mono text-slate-400 shrink-0 w-12">
          HP {pState.homeworld.hp}/{pState.homeworld.maxHp}
        </span>
        <HPBar current={pState.homeworld.hp} max={pState.homeworld.maxHp} />
        {/* Attack homeworld button — combate, ≥1 atacante seleccionado, oponente */}
        {phase === 'combate' && selectedAttackerIds.length > 0 && !isActive && (
          <button
            type="button"
            onClick={() => {
              for (const atkId of selectedAttackerIds) {
                dispatch({
                  type: 'DECLARE_ATTACK',
                  attackerShipId: atkId,
                  target: { kind: 'homeworld', ref: player },
                })
              }
              clearAttackers()
            }}
            className="ml-2 px-2 py-1 text-[10px] rounded bg-red-700 hover:bg-red-600 text-white shrink-0"
          >
            ⚔ Atacar natal ({selectedAttackerIds.length})
          </button>
        )}
      </div>

      {pState.fleet.length > 0 && (
        <div className="mb-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">
            Flota ({pState.fleet.length})
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {pState.fleet.map((ship) => (
              <FleetCard
                key={ship.instanceId}
                ship={ship}
                isOwn={player === state.activePlayer}
                isActive={phase === 'combate'}
                selectedAttackerIds={selectedAttackerIds}
                state={state}
                onClick={() => handleFleetShipClick(ship.instanceId, player)}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">
          Mano ({pState.hand.length}/{HAND_CAP})
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {pState.hand.map((card, i) => {
            const canPlay =
              isOwn && phase === 'despliegue' && card.type === 'ship' && card.cost <= pState.energy
            return (
              <MiniCard
                key={`${card.id}-${i}`}
                card={card}
                compact
                faceDown={!isCurrentViewer}
                onClick={canPlay ? () => handleHandCardClick(card.id) : undefined}
                highlight={canPlay ? 'valid' : null}
              />
            )
          })}
        </div>
      </div>

    </section>
  )
}

function ActionBar({ state }: { state: GameState }) {
  const dispatch = useGameStore((s) => s.dispatch)
  const selectedAttackerIds = useGameStore((s) => s.selectedAttackerIds)
  const clearAttackers = useGameStore((s) => s.clearAttackers)

  const phaseLabel = PHASE_LABEL[state.phase] ?? state.phase

  return (
    <div className="bg-slate-900 border-t border-slate-800 px-3 sm:px-4 py-2 flex items-center justify-between gap-2 flex-wrap text-[11px] text-slate-400">
      <div className="flex items-center gap-3 flex-wrap">
        <span>
          Turno <span className="text-slate-200 font-mono">{state.turn}</span>
        </span>
        <span>
          Fase <span className="text-slate-200 font-mono">{phaseLabel}</span>
        </span>
        {selectedAttackerIds.length > 0 && (
          <span className="text-amber-300">
            {selectedAttackerIds.length} nave{selectedAttackerIds.length > 1 ? 's' : ''} seleccionada{selectedAttackerIds.length > 1 ? 's' : ''} — elegí target
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {selectedAttackerIds.length > 0 && (
          <button
            type="button"
            onClick={() => clearAttackers()}
            className="px-2 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
          >
            Cancelar selección
          </button>
        )}
        <button
          type="button"
          onClick={() => dispatch({ type: 'CONCEDE', player: state.activePlayer })}
          className="px-2 py-1 text-[11px] rounded bg-slate-800 hover:bg-red-900 text-slate-200"
        >
          Conceder
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: 'END_PHASE' })}
          className="px-3 py-1 text-[11px] rounded bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold"
        >
          Fin de fase →
        </button>
      </div>
    </div>
  )
}

function GameOverModal({ state }: { state: GameState }) {
  const setView = useGameStore((s) => s.setView)
  if (state.outcome.kind === 'in_progress') return null

  let title = ''
  let subtitle = ''
  if (state.outcome.kind === 'win') {
    title = `Jugador ${state.outcome.winner === 'p1' ? '1' : '2'} gana`
    subtitle =
      state.outcome.reason === 'homeworld_destroyed'
        ? 'Mundo natal destruido'
        : state.outcome.reason === 'decking_out'
          ? 'Decking out'
          : 'Concesión'
  } else {
    title = 'Tablas'
    subtitle = 'Ambos mundos natales cayeron simultáneamente'
  }

  return (
    <div className="fixed inset-0 bg-slate-950/95 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-8 max-w-md text-center">
        <h2 className="text-3xl font-semibold mb-2">{title}</h2>
        <p className="text-slate-400 mb-6">{subtitle}</p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={() => setView('home')}
            className="px-4 py-2 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold"
          >
            Nueva partida
          </button>
        </div>
      </div>
    </div>
  )
}

export function PlayView() {
  const state = useGameStore((s) => s.state)
  const setView = useGameStore((s) => s.setView)
  const privacyShield = useGameStore((s) => s.privacyShield)
  const aiPlayer = useGameStore((s) => s.aiPlayer)
  const dispatch = useGameStore((s) => s.dispatch)

  // Trigger automático de IA: cuando es turno del AI player + partida en
  // progreso + no hay privacy shield, dispatchear decideAction con delay
  // visual. Re-corre con cada cambio relevante del state para encadenar
  // acciones del turno IA hasta que END_PHASE pase el turno.
  useEffect(() => {
    if (!state) return
    if (!aiPlayer) return
    if (state.activePlayer !== aiPlayer) return
    if (state.outcome.kind !== 'in_progress') return
    const timer = setTimeout(() => {
      const action = decideAction(state, aiPlayer)
      dispatch(action)
    }, AI_ACTION_DELAY_MS)
    return () => clearTimeout(timer)
  }, [state, aiPlayer, dispatch])

  if (!state) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <button onClick={() => setView('home')} className="underline">
          Sin partida — volver al home
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <PlayerSection
        player="p2"
        pState={state.players.p2}
        isActive={state.activePlayer === 'p2'}
        isCurrentViewer={state.activePlayer === 'p2' && !privacyShield}
        state={state}
      />

      {/* v3.0: planetas neutrales eliminados. Espacio central libre por ahora;
          Phase 2+ podría reintroducir territorio o sólo dejar arte central. */}
      <section className="flex-1 flex items-center justify-center p-3 sm:p-6 bg-slate-950">
        <div className="text-[11px] uppercase tracking-wider text-slate-700">
          Sexto Sol · Set 1
        </div>
      </section>

      <PlayerSection
        player="p1"
        pState={state.players.p1}
        isActive={state.activePlayer === 'p1'}
        isCurrentViewer={state.activePlayer === 'p1' && !privacyShield}
        state={state}
      />

      <ActionBar state={state} />

      <GameOverModal state={state} />

      {privacyShield && state.outcome.kind === 'in_progress' && <PrivacyShield />}
    </div>
  )
}
