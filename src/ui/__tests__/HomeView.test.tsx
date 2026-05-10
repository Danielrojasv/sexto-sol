import { describe, expect, it, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { HomeView } from '../HomeView'
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

describe('HomeView', () => {
  beforeEach(reset)

  it('renders title and TOTAL_CARDS subtitle', () => {
    render(<HomeView />)
    expect(screen.getByRole('heading', { name: /Sexto Sol/i })).toBeInTheDocument()
    expect(screen.getByText(/cartas en el set base/i)).toBeInTheDocument()
  })

  it('shows the 4 race buttons twice (P1 + P2 columns)', () => {
    render(<HomeView />)
    // 2 columns × 4 races = 8 race buttons
    expect(screen.getAllByText("Q'ralan").length).toBe(2)
    expect(screen.getAllByText('Würon').length).toBe(2)
    expect(screen.getAllByText('Tezhal').length).toBe(2)
    expect(screen.getAllByText('Zaqe').length).toBe(2)
  })

  it('start button is disabled until both players pick a race', () => {
    render(<HomeView />)
    const startBtn = screen.getByRole('button', { name: /Empezar partida/i })
    expect(startBtn).toBeDisabled()
  })

  it('start button enables after both picks and starts game on click', () => {
    render(<HomeView />)
    const wuronBtns = screen.getAllByRole('button', { name: /Würon/i })
    fireEvent.click(wuronBtns[0]!) // P1 picks Würon
    const tezhalBtns = screen.getAllByRole('button', { name: /Tezhal/i })
    fireEvent.click(tezhalBtns[1]!) // P2 picks Tezhal
    const startBtn = screen.getByRole('button', { name: /Empezar partida/i })
    expect(startBtn).not.toBeDisabled()
    fireEvent.click(startBtn)
    const s = useGameStore.getState()
    expect(s.state).not.toBeNull()
    expect(s.state!.players.p1.race).toBe('wuron')
    expect(s.state!.players.p2.race).toBe('tezhal')
  })

  it('catalog link switches view to cards', () => {
    render(<HomeView />)
    fireEvent.click(screen.getByText(/Ver catálogo de cartas/i))
    expect(useGameStore.getState().view).toBe('cards')
  })
})
