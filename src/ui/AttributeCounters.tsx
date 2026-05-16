import type { HeroAttributes } from '@/engine/types'

const LABELS = [
  { key: 'fuerza' as const, label: 'Fuerza', short: 'F', color: 'text-red-400' },
  { key: 'resguardo' as const, label: 'Resguardo', short: 'R', color: 'text-blue-400' },
  { key: 'resonancia' as const, label: 'Resonancia', short: 'Res', color: 'text-purple-400' },
]

export function AttributeCounters({
  atributos,
  highlight,
}: {
  atributos: HeroAttributes
  highlight?: 'fuerza' | 'resguardo' | 'resonancia'
}) {
  return (
    <div className="flex gap-4">
      {LABELS.map((l) => (
        <div
          key={l.key}
          className={`px-3 py-2 rounded ${
            highlight === l.key ? 'bg-slate-700 ring-2 ring-amber-400' : 'bg-slate-800'
          }`}
        >
          <div className={`text-xs ${l.color}`}>{l.label}</div>
          <div className="text-2xl font-bold tabular-nums">{atributos[l.key]}</div>
        </div>
      ))}
    </div>
  )
}
