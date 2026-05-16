import { useState } from 'react'
import type { CardActionDef, CardPlanetDef } from '@/engine/types'

const CAT_COLOR: Record<string, string> = {
  Ataque: 'border-red-500 bg-red-950',
  Defensa: 'border-blue-500 bg-blue-950',
  Ritual: 'border-purple-500 bg-purple-950',
}

export function CardView({
  card,
  onClick,
  disabled,
  highlight,
  showTooltips,
  planetElegidoCategoria,
}: {
  card: CardActionDef
  onClick?: () => void
  disabled?: boolean
  highlight?: boolean
  showTooltips?: boolean
  planetElegidoCategoria?: string
}) {
  const [hover, setHover] = useState(false)
  const bonusPlaneta = showTooltips && planetElegidoCategoria === card.categoria
  const bonusActivo = hover && bonusPlaneta

  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      disabled={disabled}
      className={`relative text-left w-44 p-2 border-2 rounded ${CAT_COLOR[card.categoria]} ${
        highlight ? 'ring-2 ring-amber-400' : ''
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 transition-transform'}`}
    >
      <div className="flex justify-between items-baseline">
        <span className="font-bold text-sm leading-tight">{card.nombre}</span>
        <span className="text-xs bg-slate-800 px-1.5 rounded">{card.coste}</span>
      </div>
      <div className="text-xs text-slate-300 mt-1">
        {card.categoria} · {card.fuerzaBase} fuerza
      </div>
      <ul className="text-xs text-slate-300 mt-2 space-y-1">
        {card.condicionales.map((c, i) => (
          <li key={i}>· {c.efectoTexto ?? '(efecto)'}</li>
        ))}
      </ul>
      {bonusActivo && (
        <div className="absolute top-0 left-full ml-2 bg-amber-900 text-amber-100 text-xs p-2 rounded whitespace-nowrap z-10">
          +1 fuerza por tu planeta-elegido
        </div>
      )}
    </button>
  )
}

export function CardBack({ revealed }: { revealed?: boolean }) {
  return (
    <div
      className={`w-44 h-32 rounded border-2 ${
        revealed ? 'border-amber-400 bg-amber-950' : 'border-slate-600 bg-slate-800'
      } flex items-center justify-center text-slate-400 text-sm`}
    >
      {revealed ? 'Revelando…' : '⊕ Acción Oculta'}
    </div>
  )
}

export function PlanetCard({
  planet,
  onClick,
  selected,
}: {
  planet: CardPlanetDef
  onClick?: () => void
  selected?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-48 p-3 border-2 rounded ${CAT_COLOR[planet.categoria]} ${
        selected ? 'ring-2 ring-amber-400' : ''
      } text-left hover:scale-105 transition-transform`}
    >
      <div className="font-bold text-sm">{planet.nombre}</div>
      <div className="text-xs text-slate-300 mt-1">Planeta {planet.categoria}</div>
      <div className="text-xs italic text-slate-400 mt-2">{planet.flavor}</div>
    </button>
  )
}
