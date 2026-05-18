// HomeView v4.2 — Selector raza + modo + mazo preconstruido + toggle tooltips
// + sección de logs (descargar consolidado de partidas guardadas, limpiar).

import { useEffect, useState } from 'react'
import { decksByRaza } from '@/data/decks/loader'
import type { Modo, Raza } from '@/engine/types'
import { useGameStore } from '@/store/gameStore'

const RAZAS: Raza[] = ['Tezhal', 'Würon']
const MODOS: Array<{ value: Modo; label: string }> = [
  { value: 'vsIA', label: 'vs IA' },
  { value: 'hotseat', label: 'Hot-seat (2 jugadores)' },
]

export function HomeView() {
  const startGame = useGameStore((s) => s.startGame)
  const [razaA, setRazaA] = useState<Raza>('Tezhal')
  const [razaB, setRazaB] = useState<Raza>('Würon')
  const [modo, setModo] = useState<Modo>('vsIA')
  const [showTooltips, setShowTooltips] = useState(true)
  const decksA = decksByRaza(razaA)
  const decksB = decksByRaza(razaB)
  const [deckA, setDeckA] = useState(decksA[0]?.id ?? '')
  const [deckB, setDeckB] = useState(decksB[0]?.id ?? '')

  const handleRazaA = (r: Raza) => {
    setRazaA(r)
    setDeckA(decksByRaza(r)[0]?.id ?? '')
  }
  const handleRazaB = (r: Raza) => {
    setRazaB(r)
    setDeckB(decksByRaza(r)[0]?.id ?? '')
  }

  const handleStart = () => {
    if (!deckA || !deckB) return
    startGame({ modo, razaA, razaB, deckA_id: deckA, deckB_id: deckB, showTooltips })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <header>
          <h1 className="text-4xl font-bold tracking-tight">Sexto Sol</h1>
          <p className="text-slate-400 mt-1">Premonición como Lectura — v4.2</p>
        </header>

        <section className="space-y-3 bg-slate-900 p-4 rounded-lg">
          <h2 className="text-lg font-semibold">Modo</h2>
          <div className="flex gap-3">
            {MODOS.map((m) => (
              <button
                key={m.value}
                onClick={() => setModo(m.value)}
                className={`px-4 py-2 rounded ${
                  modo === m.value ? 'bg-amber-600 text-slate-950' : 'bg-slate-700 text-slate-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3 bg-slate-900 p-4 rounded-lg">
          <h2 className="text-lg font-semibold">Jugador A {modo === 'vsIA' ? '(vos)' : ''}</h2>
          <RazaSelector value={razaA} onChange={handleRazaA} />
          <DeckSelector decks={decksA} value={deckA} onChange={setDeckA} />
        </section>

        <section className="space-y-3 bg-slate-900 p-4 rounded-lg">
          <h2 className="text-lg font-semibold">
            Jugador B {modo === 'vsIA' ? '(IA)' : '(humano)'}
          </h2>
          <RazaSelector value={razaB} onChange={handleRazaB} />
          <DeckSelector decks={decksB} value={deckB} onChange={setDeckB} />
        </section>

        <section className="bg-slate-900 p-4 rounded-lg">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showTooltips}
              onChange={(e) => setShowTooltips(e.target.checked)}
              className="w-5 h-5"
            />
            <span>
              <span className="font-semibold">Mostrar tooltips de ayuda</span>
              <span className="text-slate-400 text-sm block">
                Recomendado para las primeras partidas. Apagalo cuando ya conozcas el flujo.
              </span>
            </span>
          </label>
        </section>

        <button
          onClick={handleStart}
          className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-lg"
        >
          Iniciar Peregrinaje
        </button>

        <GameLogsSection />
      </div>
    </div>
  )
}

function GameLogsSection() {
  const [count, setCount] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const refresh = async () => {
    try {
      const res = await fetch('/api/logs/count')
      if (!res.ok) return
      const data = (await res.json()) as { count: number }
      setCount(data.count)
    } catch {
      setCount(null)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const handleDownload = async () => {
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch('/api/logs/all')
      if (!res.ok) throw new Error('fetch falló')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'sexto-sol-logs.json'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setMsg('Descargado.')
    } catch (e) {
      setMsg(`Error: ${(e as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  const handleClear = async () => {
    if (!confirm('¿Borrar todos los logs guardados?')) return
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch('/api/logs', { method: 'DELETE' })
      if (!res.ok) throw new Error('delete falló')
      const data = (await res.json()) as { deleted: number }
      setMsg(`Borrados ${data.deleted} logs.`)
      await refresh()
    } catch (e) {
      setMsg(`Error: ${(e as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="bg-slate-900 p-4 rounded-lg space-y-2">
      <h2 className="text-lg font-semibold">📂 Logs de partidas</h2>
      <p className="text-sm text-slate-400">
        {count === null ? (
          <span className="italic">Sin conexión al server de logs (dev mode requerido).</span>
        ) : (
          <>
            <b>{count}</b> partida{count === 1 ? '' : 's'} guardada{count === 1 ? '' : 's'} en{' '}
            <code className="text-xs">logs/games/</code>. Cada partida se postea automáticamente al terminar.
          </>
        )}
      </p>
      {count !== null && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleDownload}
            disabled={busy || count === 0}
            className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 rounded text-sm font-semibold"
          >
            ⬇ Descargar consolidado (.json)
          </button>
          <button
            onClick={handleClear}
            disabled={busy || count === 0}
            className="px-3 py-2 bg-rose-800 hover:bg-rose-700 disabled:opacity-40 rounded text-sm font-semibold"
          >
            🗑 Limpiar
          </button>
          <button
            onClick={refresh}
            disabled={busy}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 rounded text-sm font-semibold"
          >
            ↻ Refrescar
          </button>
        </div>
      )}
      {msg && <div className="text-xs text-amber-300">{msg}</div>}
    </section>
  )
}

function RazaSelector({ value, onChange }: { value: Raza; onChange: (r: Raza) => void }) {
  return (
    <div className="flex gap-2">
      {RAZAS.map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={`px-3 py-2 rounded ${
            value === r ? 'bg-amber-700 text-slate-100' : 'bg-slate-700 text-slate-300'
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  )
}

function DeckSelector({
  decks,
  value,
  onChange,
}: {
  decks: ReturnType<typeof decksByRaza>
  value: string
  onChange: (id: string) => void
}) {
  return (
    <div className="space-y-1">
      {decks.map((d) => (
        <label key={d.id} className="flex items-start gap-2 cursor-pointer">
          <input
            type="radio"
            checked={value === d.id}
            onChange={() => onChange(d.id)}
            className="mt-1"
          />
          <span>
            <span className="font-semibold">{d.name}</span>
            <span className="text-slate-400 text-sm block">{d.archetype}</span>
          </span>
        </label>
      ))}
    </div>
  )
}
