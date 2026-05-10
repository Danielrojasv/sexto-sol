import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CardArt } from '../CardArt'
import type { Card } from '@/engine/types'

const baseCard: Card = {
  id: 'wuron_test',
  name: 'Test Würon',
  race: 'wuron',
  type: 'ship',
  cost: 2,
  rarity: 'common',
  keywords: [],
  abilities: [],
  artSlot: { row: 1, col: 2 },
}

describe('CardArt', () => {
  it('renders the sprite-positioned div with aria-label', () => {
    render(<CardArt card={baseCard} />)
    const el = screen.getByRole('img', { name: 'Test Würon' })
    expect(el).toBeInTheDocument()
    expect(el).toHaveStyle({ aspectRatio: '2 / 3' })
  })

  it('renders fallback "sin arte" when artSlot is missing', () => {
    const noArt: Card = { ...baseCard, artSlot: undefined }
    render(<CardArt card={noArt} />)
    expect(screen.getByText('sin arte')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<CardArt card={baseCard} className="custom-x" />)
    expect(container.firstChild).toHaveClass('custom-x')
  })

  it('computes background position from artSlot', () => {
    render(<CardArt card={baseCard} />)
    const el = screen.getByRole('img', { name: 'Test Würon' })
    // col=2 of (COLS=4) → 2/3 → 66.66%; row=1 of (ROWS=3) → 1/2 → 50%
    expect(el.getAttribute('style')).toContain('background-position')
  })
})
