// MiniCard — versión compacta de la carta para mano y fleet.
// Más chica que CardTile del catálogo. Optimizada para densidad.

import { useState } from 'react'
import type { Card, ShipInstance } from '@/engine/types'
import { getKeywordInfo } from '@/data/keywords'
import { renderAbility } from '@/data/abilityRenderer'
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
  /** Fuerza efectiva pre-calculada (incluye bonuses dinámicos como Formación
   *  Solar). Si está set, se muestra en lugar de shipInstance.strength.
   *  Si difiere de base se muestra como "eff (base)" para indicar el bonus. */
  effectiveStrength?: number
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
  effectiveStrength,
  className = '',
}: MiniCardProps) {
  const width = compact ? 90 : 120
  const ringClass = highlight ? HIGHLIGHT_BORDER[highlight] : ''
  const [detailOpen, setDetailOpen] = useState(false)

  if (faceDown) {
    return (
      <div
        className={`flex-shrink-0 rounded bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 ${className}`}
        style={{ width: `${width}px`, aspectRatio: '2 / 3' }}
      />
    )
  }

  return (
    <div
      className={`flex-shrink-0 relative rounded overflow-hidden bg-slate-900 border border-slate-700 hover:border-slate-500 transition-colors text-left ${ringClass} ${className}`}
      style={{ width: `${width}px` }}
    >
      <button
        type="button"
        aria-label={card.name}
        onClick={onClick}
        onContextMenu={(e) => {
          e.preventDefault()
          setDetailOpen(true)
        }}
        disabled={!onClick}
        className={`block w-full text-left ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <CardArt card={card} />
        <div className="p-1.5 space-y-0.5">
          <div className="flex items-center justify-between gap-1">
            <h4 className="text-[10px] font-semibold leading-tight truncate flex-1">
              {card.name}
            </h4>
            <span className="text-[9px] font-mono text-slate-400 shrink-0">{card.cost}c</span>
          </div>
          {card.type === 'ship' && card.strength !== undefined && card.hp !== undefined && (
            <div className="text-[9px] font-mono text-slate-300">
              {shipInstance ? (
                <>
                  {effectiveStrength !== undefined &&
                  effectiveStrength !== shipInstance.strength ? (
                    <span>
                      <span className="text-amber-300">{effectiveStrength}</span>
                      <span className="text-slate-500"> ({shipInstance.strength})</span>
                    </span>
                  ) : (
                    <>{effectiveStrength ?? shipInstance.strength}</>
                  )}
                  /{shipInstance.hp}
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
          {card.keywords.length > 0 && (
            <div className="flex flex-wrap gap-0.5">
              {card.keywords.map((kw) => {
                const info = getKeywordInfo(kw)
                return (
                  <span
                    key={kw}
                    title={info.reminder}
                    className="text-[8px] px-1 py-px rounded bg-slate-800 text-amber-200 leading-tight"
                  >
                    {info.label}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      </button>
      <button
        type="button"
        aria-label={`Info de ${card.name}`}
        onClick={() => setDetailOpen(true)}
        className="absolute top-1 right-1 px-1.5 py-0.5 text-[8px] rounded bg-slate-800/80 backdrop-blur hover:bg-slate-700 text-slate-300 hover:text-amber-300 leading-none"
      >
        ⓘ
      </button>
      {detailOpen && <CardDetailModal card={card} onClose={() => setDetailOpen(false)} />}
    </div>
  )
}

function CardDetailModal({ card, onClose }: { card: Card; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-lg max-w-sm w-full p-4 space-y-3 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold">{card.name}</h3>
            <div className="text-[10px] uppercase text-slate-400 tracking-wider">
              {card.race} · {card.type} · {card.rarity}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 text-xs"
          >
            cerrar
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-300">
            Costo <span className="text-amber-300 font-mono">{card.cost}</span>
          </span>
          {card.strength !== undefined && card.hp !== undefined && (
            <span className="text-slate-300">
              Stats <span className="font-mono">{card.strength}/{card.hp}</span>
            </span>
          )}
        </div>
        {card.keywords.length > 0 && (
          <div className="space-y-1">
            <div className="text-[10px] uppercase text-slate-500 tracking-wider">Keywords</div>
            <ul className="space-y-1">
              {card.keywords.map((kw) => {
                const info = getKeywordInfo(kw)
                return (
                  <li key={kw} className="text-xs">
                    <span className="font-semibold text-amber-200">{info.label}</span>
                    {info.reminder && (
                      <span className="text-slate-400"> — {info.reminder}</span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )}
        {card.abilities.length > 0 && (
          <div className="space-y-1">
            <div className="text-[10px] uppercase text-slate-500 tracking-wider">Habilidad</div>
            <ul className="space-y-1">
              {card.abilities.map((ab, i) => (
                <li key={i} className="text-xs text-slate-200 leading-snug">
                  {ab.description ?? renderAbility(ab)}
                </li>
              ))}
            </ul>
          </div>
        )}
        {card.flavorText && (
          <p className="text-[11px] italic text-slate-400 border-l-2 border-slate-700 pl-2">
            {card.flavorText}
          </p>
        )}
      </div>
    </div>
  )
}
