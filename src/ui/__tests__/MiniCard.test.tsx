import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MiniCard } from '../MiniCard'
import type { Card, ShipInstance } from '@/engine/types'

const ship: Card = {
  id: 'wuron_test',
  name: 'Lhüpang Test',
  race: 'wuron',
  type: 'ship',
  cost: 2,
  rarity: 'common',
  keywords: [],
  abilities: [],
  strength: 2,
  hp: 4,
  artSlot: { row: 0, col: 0 },
}

const tech: Card = {
  ...ship,
  id: 'wuron_tech_test',
  name: 'Tech Test',
  type: 'tech',
  strength: undefined,
  hp: undefined,
}

describe('MiniCard', () => {
  it('renders ship name + cost + stats', () => {
    render(<MiniCard card={ship} />)
    expect(screen.getByText('Lhüpang Test')).toBeInTheDocument()
    expect(screen.getByText(/2c/)).toBeInTheDocument()
    expect(screen.getByText(/2\/4/)).toBeInTheDocument()
  })

  it('renders type instead of stats for non-ship cards', () => {
    render(<MiniCard card={tech} />)
    expect(screen.getByText('tech')).toBeInTheDocument()
    expect(screen.queryByText(/\d+\/\d+/)).not.toBeInTheDocument()
  })

  it('renders face-down placeholder when faceDown=true', () => {
    const { container } = render(<MiniCard card={ship} faceDown />)
    // No name shown when face down
    expect(screen.queryByText('Lhüpang Test')).not.toBeInTheDocument()
    expect(container.firstChild).toBeInTheDocument()
  })

  it('uses compact width when compact=true', () => {
    const { container } = render(<MiniCard card={ship} compact />)
    const btn = container.querySelector('button')
    expect(btn?.getAttribute('style')).toContain('90px')
  })

  it('fires onClick when clickable', () => {
    const onClick = vi.fn()
    render(<MiniCard card={ship} onClick={onClick} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('disables button when no onClick given', () => {
    render(<MiniCard card={ship} />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('shows ship instance stats and damage marker', () => {
    const instance: ShipInstance = {
      instanceId: 's1',
      cardId: ship.id,
      controller: 'p1',
      strength: 3,
      hp: 1,
      maxHp: 4,
      damageTaken: 3,
      keywords: [],
    }
    render(<MiniCard card={ship} shipInstance={instance} />)
    expect(screen.getByText(/3\/1/)).toBeInTheDocument()
    expect(screen.getByText(/dmg/)).toBeInTheDocument()
  })

  it('applies highlight ring when highlight is set', () => {
    const { container } = render(
      <MiniCard card={ship} highlight="selected" onClick={() => {}} />,
    )
    const btn = container.querySelector('button')
    expect(btn?.className).toContain('ring-amber-400')
  })
})
