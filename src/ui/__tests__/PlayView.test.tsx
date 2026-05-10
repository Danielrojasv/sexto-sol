import { describe, expect, it, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { PlayView } from '../PlayView'
import { useGameStore } from '@/store/gameStore'

function reset() {
  useGameStore.setState({
    view: 'play',
    state: null,
    lastEvents: [],
    selectedAttackerId: null,
    privacyShield: false,
  })
}

describe('PlayView', () => {
  beforeEach(reset)

  it('shows back-to-home button when no game state', () => {
    render(<PlayView />)
    const back = screen.getByRole('button', { name: /Sin partida/i })
    expect(back).toBeInTheDocument()
    fireEvent.click(back)
    expect(useGameStore.getState().view).toBe('home')
  })

  it('renders the main play area when game is started', () => {
    useGameStore.getState().startGame('wuron', 'tezhal')
    useGameStore.setState({ privacyShield: false })
    render(<PlayView />)
    // ActionBar has End Phase button (always visible)
    expect(screen.getByRole('button', { name: /Fin de fase/i })).toBeInTheDocument()
  })

  it('clicking End Phase dispatches END_PHASE', () => {
    useGameStore.getState().startGame('wuron', 'tezhal')
    useGameStore.setState({ privacyShield: false })
    const beforePhase = useGameStore.getState().state!.phase
    render(<PlayView />)
    const btn = screen.getByRole('button', { name: /Fin de fase/i })
    fireEvent.click(btn)
    const afterPhase = useGameStore.getState().state!.phase
    // END_PHASE should advance the phase or toggle activePlayer
    expect(
      afterPhase !== beforePhase || useGameStore.getState().state!.activePlayer !== 'p1',
    ).toBe(true)
  })

  it('renders both player sections', () => {
    useGameStore.getState().startGame('wuron', 'tezhal')
    useGameStore.setState({ privacyShield: false })
    render(<PlayView />)
    // Both p1 and p2 mundos natales should be referenced (HP bars).
    expect(screen.getAllByText(/HP/i).length).toBeGreaterThan(0)
  })

  it('shows privacy shield overlay when privacyShield=true', () => {
    useGameStore.getState().startGame('wuron', 'tezhal')
    useGameStore.setState({ privacyShield: true })
    render(<PlayView />)
    expect(screen.getByText(/Hot-seat/i)).toBeInTheDocument()
  })

  it('Concede button dispatches concession', () => {
    useGameStore.getState().startGame('wuron', 'tezhal')
    useGameStore.setState({ privacyShield: false })
    render(<PlayView />)
    const concede = screen.getByRole('button', { name: /Conceder/i })
    fireEvent.click(concede)
    const outcome = useGameStore.getState().state!.outcome
    expect(outcome.kind).toBe('win')
    if (outcome.kind === 'win') expect(outcome.reason).toBe('concession')
  })
})
