import { describe, expect, it, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { PrivacyShield } from '../PrivacyShield'
import { useGameStore } from '@/store/gameStore'

function reset() {
  useGameStore.setState({
    view: 'home',
    state: null,
    lastEvents: [],
    selectedAttackerId: null,
    privacyShield: false,
  })
}

describe('PrivacyShield', () => {
  beforeEach(reset)

  it('renders nothing when there is no game state', () => {
    const { container } = render(<PrivacyShield />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the handover screen when state exists', () => {
    useGameStore.getState().startGame('wuron', 'tezhal')
    render(<PrivacyShield />)
    expect(screen.getByText(/Hot-seat/i)).toBeInTheDocument()
    expect(screen.getByText(/Pasale el dispositivo/i)).toBeInTheDocument()
  })

  it('button click acknowledges and lowers shield', () => {
    useGameStore.getState().startGame('wuron', 'tezhal')
    useGameStore.setState({ privacyShield: true })
    render(<PrivacyShield />)
    const btn = screen.getByRole('button', { name: /empezar mi turno/i })
    fireEvent.click(btn)
    expect(useGameStore.getState().privacyShield).toBe(false)
  })

  it('reflects active player number in the message', () => {
    useGameStore.getState().startGame('wuron', 'tezhal')
    const expected =
      useGameStore.getState().state!.activePlayer === 'p1' ? '1' : '2'
    render(<PrivacyShield />)
    expect(screen.getAllByText(new RegExp(`Jugador ${expected}`)).length).toBeGreaterThan(0)
  })
})
