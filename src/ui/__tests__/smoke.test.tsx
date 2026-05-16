// Smoke tests UI v4.2 — verifican render sin error con props mínimas.

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AttributeCounters } from '../AttributeCounters'
import { CardView } from '../CardView'
import { HeroBadge } from '../HeroBadge'
import { HomeView } from '../HomeView'
import { PrivacyShield } from '../PrivacyShield'
import { mockCard } from '../../engine/__tests__/_helpers'

describe('UI smoke tests v4.2', () => {
  it('AttributeCounters renderiza 3 atributos', () => {
    render(<AttributeCounters atributos={{ fuerza: 5, resguardo: 3, resonancia: 7 }} />)
    expect(screen.getByText('Fuerza')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('Resguardo')).toBeInTheDocument()
    expect(screen.getByText('Resonancia')).toBeInTheDocument()
  })

  it('HeroBadge muestra raza + estado', () => {
    render(<HeroBadge raza="Tezhal" estado="despertado" />)
    expect(screen.getByText(/Despertado/i)).toBeInTheDocument()
  })

  it('HomeView renderiza selectores + título v4.2', () => {
    render(<HomeView />)
    expect(screen.getByText('Sexto Sol')).toBeInTheDocument()
    expect(screen.getByText(/v4\.2/i)).toBeInTheDocument()
    expect(screen.getByText('Iniciar Peregrinaje')).toBeInTheDocument()
    expect(screen.getByText('vs IA')).toBeInTheDocument()
  })

  it('CardView muestra penalizacion_acierto v4.2', () => {
    const card = mockCard({
      id: 'TST-1',
      categoria: 'Ataque',
      fuerzaBase: 3,
      penalizacionAcierto: 2,
    })
    render(<CardView card={card} disabled />)
    expect(screen.getByText(/Mock Card/i)).toBeInTheDocument()
    expect(screen.getByText(/Si el rival lee: -2/i)).toBeInTheDocument()
  })

  it('PrivacyShield renderiza mensaje + botón', () => {
    render(<PrivacyShield nextPlayer="b" onContinue={() => {}} />)
    expect(screen.getByText(/Pasale el dispositivo/i)).toBeInTheDocument()
    expect(screen.getByText('Estoy listo')).toBeInTheDocument()
  })
})
