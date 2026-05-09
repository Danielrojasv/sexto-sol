// PlayView — tablero jugable. Wire de acciones: PLAY_CARD, ACTIVATE_PLANET,
// DECLARE_ATTACK con target picker, END_PHASE, CONCEDE, DEPLOY_HERO.

import { useGameStore } from '@/store/gameStore'
import { cardById } from '@/data/cards'
import type { GameState, PlayerId, PlayerState, ShipInstance } from '@/engine/types'
import { MiniCard } from './MiniCard'
import { PrivacyShield } from './PrivacyShield'

const PHASE_LABEL: Record<string, string> = {
  recoleccion: 'Recolección',
  despliegue: 'Despliegue',
  combate: 'Combate',
  regroup: 'Regroup',
  vigilia: 'Vigilia',
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
  selectedAttackerId,
  onClick,
}: {
  ship: ShipInstance
  isOwn: boolean
  isActive: boolean
  selectedAttackerId: string | null
  onClick?: () => void
}) {
  const cardDef = cardById(ship.cardId)
  const isSelected = selectedAttackerId === ship.instanceId
  const canAttack = isOwn && isActive

  if (!cardDef) {
    return (
      <div className="flex-shrink-0 w-[90px] aspect-[2/3] rounded bg-slate-800 border border-slate-700 p-2">
        <div className="text-[10px] text-slate-300">{ship.cardId}</div>
        <div className="text-[10px] font-mono text-slate-400 mt-1">
          {ship.strength}/{ship.hp}
        </div>
      </div>
    )
  }
  return (
    <MiniCard
      card={cardDef}
      compact
      shipInstance={ship}
      onClick={onClick}
      highlight={
        isSelected
          ? 'selected'
          : !isOwn && selectedAttackerId
            ? 'valid' // target candidate
            : canAttack && !selectedAttackerId
              ? 'valid' // selectable attacker
              : null
      }
    />
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
  const selectAttacker = useGameStore((s) => s.selectAttacker)
  const selectedAttackerId = useGameStore((s) => s.selectedAttackerId)

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

    if (selectedAttackerId === null) {
      // Seleccionar atacante (debe ser propio)
      if (owner === state.activePlayer) {
        selectAttacker(shipId)
      }
      return
    }
    // Si ya hay atacante, este click elige target (debe ser enemigo)
    if (owner !== state.activePlayer) {
      dispatch({
        type: 'DECLARE_ATTACK',
        attackerShipId: selectedAttackerId,
        target: { kind: 'ship', ref: shipId },
      })
    } else if (shipId === selectedAttackerId) {
      // Click en el mismo → deselect
      selectAttacker(null)
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
        {/* Attack homeworld button — solo en combate, atacante seleccionado, oponente */}
        {phase === 'combate' && selectedAttackerId !== null && !isActive && (
          <button
            type="button"
            onClick={() => {
              dispatch({
                type: 'DECLARE_ATTACK',
                attackerShipId: selectedAttackerId,
                target: { kind: 'homeworld', ref: player },
              })
            }}
            className="ml-2 px-2 py-1 text-[10px] rounded bg-red-700 hover:bg-red-600 text-white shrink-0"
          >
            ⚔ Atacar mundo natal
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
                selectedAttackerId={selectedAttackerId}
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

      {pState.hero && (
        <div className="mt-2 text-[10px] text-slate-500">
          Héroe: {pState.hero.defId}
          {pState.hero.inHomeworld ? ' (en mundo natal)' : ' (en flota)'}
          {pState.hero.reactivationCooldown > 0 &&
            ` · cooldown ${pState.hero.reactivationCooldown}t`}
        </div>
      )}
    </section>
  )
}

function ActionBar({ state }: { state: GameState }) {
  const dispatch = useGameStore((s) => s.dispatch)
  const selectedAttackerId = useGameStore((s) => s.selectedAttackerId)
  const selectAttacker = useGameStore((s) => s.selectAttacker)

  const phaseLabel = PHASE_LABEL[state.phase] ?? state.phase
  const ageRoman = state.age === 1 ? 'I' : state.age === 2 ? 'II' : 'III'
  const canDeployHero =
    state.age >= 2 &&
    state.phase === 'despliegue' &&
    !!state.players[state.activePlayer].hero?.inHomeworld &&
    state.players[state.activePlayer].hero?.reactivationCooldown === 0

  return (
    <div className="bg-slate-900 border-t border-slate-800 px-3 sm:px-4 py-2 flex items-center justify-between gap-2 flex-wrap text-[11px] text-slate-400">
      <div className="flex items-center gap-3 flex-wrap">
        <span>
          Turno <span className="text-slate-200 font-mono">{state.turn}</span>
        </span>
        <span>
          Edad <span className="text-amber-400 font-mono">{ageRoman}</span>
        </span>
        <span>
          Fase <span className="text-slate-200 font-mono">{phaseLabel}</span>
        </span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {selectedAttackerId !== null && (
          <button
            type="button"
            onClick={() => selectAttacker(null)}
            className="px-2 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
          >
            Cancelar ataque
          </button>
        )}
        {canDeployHero && (
          <button
            type="button"
            onClick={() => dispatch({ type: 'DEPLOY_HERO' })}
            className="px-2 py-1 text-[11px] rounded bg-purple-700 hover:bg-purple-600 text-white"
          >
            Desplegar héroe
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

function PlanetButton({
  planet,
  state,
}: {
  planet: GameState['sector']['planets'][number]
  state: GameState
}) {
  const dispatch = useGameStore((s) => s.dispatch)
  const ps = state.players[state.activePlayer]
  const canActivate = !planet.exhausted && ps.energy >= 1 && state.outcome.kind === 'in_progress'
  return (
    <button
      type="button"
      onClick={canActivate ? () => dispatch({ type: 'ACTIVATE_PLANET', planetId: planet.id }) : undefined}
      disabled={!canActivate}
      className={`flex-1 max-w-[180px] aspect-square rounded-full border-2 transition-colors flex flex-col items-center justify-center text-center p-3 ${
        planet.exhausted
          ? 'border-slate-700 bg-slate-900/60 opacity-60 cursor-not-allowed'
          : canActivate
            ? 'border-amber-700 bg-amber-950/40 hover:border-amber-500 cursor-pointer'
            : 'border-amber-900/50 bg-amber-950/20 cursor-not-allowed'
      }`}
    >
      <div className="text-[9px] uppercase text-slate-500">{planet.id}</div>
      <div className="text-xs font-semibold mt-1 leading-tight">{planet.gift.name}</div>
      <div className="text-[9px] text-slate-500 mt-1.5 line-clamp-3 leading-tight">
        {planet.gift.description}
      </div>
      {planet.exhausted && (
        <div className="text-[9px] uppercase tracking-wider text-amber-400 mt-1.5">
          Agotado
        </div>
      )}
    </button>
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

      <section className="flex-1 flex items-center justify-center p-3 sm:p-6 gap-3 sm:gap-6 bg-slate-950">
        {state.sector.planets.map((p) => (
          <PlanetButton key={p.id} planet={p} state={state} />
        ))}
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
