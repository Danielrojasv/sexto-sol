// Home — selector de modo + razas + start game.

import { useState } from 'react'
import { useGameStore, TOTAL_CARDS, type GameMode } from '@/store/gameStore'
import { cardsByRace } from '@/data/cards'
import type { Race } from '@/engine/types'

const RACES: { id: Race; label: string; subtitle: string; color: string }[] = [
  {
    id: 'wuron',
    label: 'Würon',
    subtitle: 'Reactiva · Külen',
    color: 'from-emerald-900 to-slate-900',
  },
  {
    id: 'tezhal',
    label: 'Tezhal',
    subtitle: 'Iniciativa · Ignición',
    color: 'from-red-900 to-slate-900',
  },
  {
    id: 'quralan',
    label: "Q'ralan",
    subtitle: 'Acumulativa · Formación Solar',
    color: 'from-amber-900 to-slate-900',
  },
  {
    id: 'zaqe',
    label: 'Zaqe',
    subtitle: 'Post-combate · Refluencia',
    color: 'from-cyan-900 to-slate-900',
  },
]

function RacePicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: Race | null
  onChange: (r: Race) => void
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm uppercase tracking-wider text-slate-400">{label}</h3>
      <div className="grid grid-cols-2 gap-2">
        {RACES.map((r) => {
          const active = value === r.id
          const count = cardsByRace(r.id).length
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onChange(r.id)}
              className={`text-left rounded-lg p-3 transition-colors bg-gradient-to-br ${r.color} border ${active ? 'border-white' : 'border-slate-800 hover:border-slate-600'}`}
            >
              <div className="font-semibold">{r.label}</div>
              <div className="text-xs text-slate-300 opacity-80">{r.subtitle}</div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">{count} cartas</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ModeToggle({
  value,
  onChange,
}: {
  value: GameMode
  onChange: (m: GameMode) => void
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm uppercase tracking-wider text-slate-400">Modo</h3>
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            { id: 'vs-ai' as const, label: 'vs IA', subtitle: 'Jugá contra una IA scripted' },
            { id: 'hot-seat' as const, label: 'Hot-seat', subtitle: 'Dos humanos, mismo dispositivo' },
          ] satisfies { id: GameMode; label: string; subtitle: string }[]
        ).map((m) => {
          const active = value === m.id
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange(m.id)}
              className={`text-left rounded-lg p-3 transition-colors bg-slate-900 border ${active ? 'border-white' : 'border-slate-800 hover:border-slate-600'}`}
            >
              <div className="font-semibold">{m.label}</div>
              <div className="text-xs text-slate-300 opacity-80">{m.subtitle}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function HomeView() {
  const [mode, setMode] = useState<GameMode>('vs-ai')
  const [p1, setP1] = useState<Race | null>(null)
  const [p2, setP2] = useState<Race | null>(null)
  const startGame = useGameStore((s) => s.startGame)
  const setView = useGameStore((s) => s.setView)

  const ready = p1 !== null && p2 !== null

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-10">
      <header className="max-w-3xl mx-auto mb-12">
        <h1 className="text-4xl font-semibold tracking-tight">Sexto Sol</h1>
        <p className="mt-2 text-slate-400">
          {TOTAL_CARDS} cartas en el set base · 4 razas
        </p>
      </header>

      <div className="max-w-3xl mx-auto mb-8">
        <ModeToggle value={mode} onChange={setMode} />
      </div>

      <div className="max-w-3xl mx-auto grid sm:grid-cols-2 gap-8">
        <RacePicker label={mode === 'vs-ai' ? 'Tu raza' : 'Jugador 1'} value={p1} onChange={setP1} />
        <RacePicker label={mode === 'vs-ai' ? 'Raza IA' : 'Jugador 2'} value={p2} onChange={setP2} />
      </div>

      <div className="max-w-3xl mx-auto mt-10 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setView('cards')}
          className="text-sm text-slate-400 hover:text-slate-200 underline underline-offset-4"
        >
          Ver catálogo de cartas
        </button>

        <button
          type="button"
          disabled={!ready}
          onClick={() => p1 && p2 && startGame(p1, p2, mode)}
          className="px-6 py-3 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-slate-950 font-semibold transition-colors"
        >
          Empezar partida
        </button>
      </div>
    </div>
  )
}
