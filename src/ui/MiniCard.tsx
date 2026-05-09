// MiniCard — versión compacta de la carta para mano y fleet.
// Más chica que CardTile del catálogo. Optimizada para densidad.

import type { Card, ShipInstance } from '@/engine/types'
import { CardArt } from './CardArt'

interface MiniCardProps {
  card: Card
  /** Si la carta está face-down (oponente). */
  faceDown?: boolean
  /** Modo compact (mano de 6+ cartas). */
  compact?: boolean
  /** Click handler — opcional, para interactividad. */
  onClick?: () => void
  /** Visual: highlighted (selected, valid target, etc). */
  highlight?: 'selected' | 'valid' | 'invalid' | null
  /** Si es una nave en fleet, muestra el HP/strength current. */
  shipInstance?: ShipInstance
  className?: string
}

const HIGHLIGHT_BORDER: Record<NonNullable<MiniCardProps['highlight']>, string> = {
  selected: 'ring-2 ring-amber-400',
  valid: 'ring-2 ring-emerald-400 cursor-pointer',
  invalid: 'opacity-50',
}

export function MiniCard({
  card,
  faceDown = false,
  compact = false,
  onClick,
  highlight,
  shipInstance,
  className = '',
}: MiniCardProps) {
  const width = compact ? 90 : 120
  const ringClass = highlight ? HIGHLIGHT_BORDER[highlight] : ''

  if (faceDown) {
    return (
      <div
        className={`flex-shrink-0 rounded bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 ${className}`}
        style={{ width: `${width}px`, aspectRatio: '2 / 3' }}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`flex-shrink-0 rounded overflow-hidden bg-slate-900 border border-slate-700 hover:border-slate-500 transition-colors text-left ${onClick ? 'cursor-pointer' : 'cursor-default'} ${ringClass} ${className}`}
      style={{ width: `${width}px` }}
    >
      <CardArt card={card} />
      <div className="p-1.5 space-y-0.5">
        <div className="flex items-center justify-between gap-1">
          <h4 className="text-[10px] font-semibold leading-tight truncate flex-1">{card.name}</h4>
          <span className="text-[9px] font-mono text-slate-400 shrink-0">
            {card.cost}c
          </span>
        </div>
        {card.type === 'ship' && card.strength !== undefined && card.hp !== undefined && (
          <div className="text-[9px] font-mono text-slate-300">
            {shipInstance ? (
              <>
                {shipInstance.strength}/{shipInstance.hp}
                {shipInstance.hp < (shipInstance.maxHp ?? card.hp) && (
                  <span className="text-red-400 ml-1">·dmg</span>
                )}
              </>
            ) : (
              <>
                {card.strength}/{card.hp}
              </>
            )}
          </div>
        )}
        {card.type !== 'ship' && (
          <div className="text-[9px] uppercase text-slate-500">{card.type}</div>
        )}
      </div>
    </button>
  )
}
