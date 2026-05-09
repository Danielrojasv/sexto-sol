// CardArt — renderiza el art de una carta usando el sprite sheet de su raza.
//
// Cada raza tiene un sprite sheet 4 cols × 3 rows en /public/art/<race>.jpg.
// La carta tiene `artSlot: { row, col }` que indica su posición.
//
// Implementación: div con background-image + background-position. Sin <img>
// para evitar 42 HTTP requests; un solo PNG por raza se cachea agresivamente.

import type { Card } from '@/engine/types'

const COLS = 4
const ROWS = 3

interface CardArtProps {
  card: Card
  /** Ancho del slot en px. Alto se computa con ratio 5:7 portrait. */
  width?: number
  className?: string
}

export function CardArt({ card, width = 200, className = '' }: CardArtProps) {
  const height = (width * 7) / 5
  if (!card.artSlot) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-900 text-slate-500 text-xs ${className}`}
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        sin arte
      </div>
    )
  }
  const { row, col } = card.artSlot
  const xPct = (col / (COLS - 1)) * 100
  const yPct = (row / (ROWS - 1)) * 100
  return (
    <div
      className={className}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundImage: `url(/art/${card.race}.jpg)`,
        backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
        backgroundPosition: `${xPct}% ${yPct}%`,
        backgroundRepeat: 'no-repeat',
      }}
      role="img"
      aria-label={card.name}
    />
  )
}
