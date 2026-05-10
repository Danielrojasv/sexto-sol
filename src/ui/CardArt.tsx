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
  className?: string
}

/**
 * Renderiza el arte de una carta como div con background-image apuntando al
 * sprite sheet de su raza (/art/<race>.jpg) y background-position mapeado por
 * `card.artSlot`. El componente toma 100% del ancho de su container y usa
 * aspect-ratio 2:3 (matchea las celdas reales del sprite ~970×1085 / 4×3).
 *
 * Para tamaño explícito, envolvelo en un container con width fijo:
 *   <div style={{ width: 240 }}><CardArt card={c} /></div>
 */
export function CardArt({ card, className = '' }: CardArtProps) {
  if (!card.artSlot) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-900 text-slate-500 text-xs w-full ${className}`}
        style={{ aspectRatio: '2 / 3' }}
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
      className={`w-full ${className}`}
      style={{
        aspectRatio: '2 / 3',
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
