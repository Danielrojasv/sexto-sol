import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CardCatalog } from '../CardCatalog'

describe('CardCatalog', () => {
  it('renders the title and total card count', () => {
    render(<CardCatalog />)
    expect(screen.getByRole('heading', { name: /Sexto Sol — Set base/i })).toBeInTheDocument()
    expect(screen.getByText(/4 razas/i)).toBeInTheDocument()
  })

  it('renders all 4 race sections', () => {
    render(<CardCatalog />)
    expect(screen.getByRole('heading', { name: 'Würon' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tezhal' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: "Q'ralan" })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Zaqe' })).toBeInTheDocument()
  })

  it('renders at least one Würon card with its name', () => {
    render(<CardCatalog />)
    expect(screen.getByText('Lhüpang del Río')).toBeInTheDocument()
  })

  it('shows keyword reminder text for Refluencia', () => {
    render(<CardCatalog />)
    // Refluencia reminder appears next to any Zaqe card with the keyword.
    expect(screen.getAllByText(/Pozo Astral/i).length).toBeGreaterThan(0)
  })

  it('shows Külen reminder text for Würon cards', () => {
    render(<CardCatalog />)
    expect(screen.getAllByText(/recibe daño y sobrevive/i).length).toBeGreaterThan(0)
  })
})
