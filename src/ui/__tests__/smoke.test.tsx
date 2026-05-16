// Smoke tests UI v4.1 — verifican que los componentes renderizan sin error
// con props/store mínimo. No validan interacción detallada (eso queda para
// playtest manual + tests E2E futuros).

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AttributeCounters } from '../AttributeCounters'
import { HeroBadge } from '../HeroBadge'
import { PrivacyShield } from '../PrivacyShield'
import { HomeView } from '../HomeView'

describe('UI smoke tests', () => {
  it('AttributeCounters renderiza 3 atributos', () => {
    render(<AttributeCounters atributos={{ fuerza: 5, resguardo: 3, resonancia: 7 }} />)
    expect(screen.getByText('Fuerza')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('Resguardo')).toBeInTheDocument()
    expect(screen.getByText('Resonancia')).toBeInTheDocument()
  })

  it('HeroBadge muestra nombre + estado', () => {
    render(<HeroBadge raza="Tezhal" estado="despertado" />)
    expect(screen.getByText('Tlanixtli')).toBeInTheDocument()
    expect(screen.getByText('Despertado')).toBeInTheDocument()
  })

  it('HeroBadge Würon Neutral no muestra habilidades', () => {
    render(<HeroBadge raza="Würon" estado="neutral" />)
    expect(screen.getByText('Lhülkan')).toBeInTheDocument()
    expect(screen.getByText('Neutral')).toBeInTheDocument()
  })

  it('PrivacyShield renderiza mensaje + botón', () => {
    render(<PrivacyShield nextPlayer="b" onContinue={() => {}} />)
    expect(screen.getByText(/Pasale el dispositivo/i)).toBeInTheDocument()
    expect(screen.getByText('Estoy listo')).toBeInTheDocument()
  })

  it('HomeView renderiza selectores y botón Iniciar', () => {
    render(<HomeView />)
    expect(screen.getByText('Sexto Sol')).toBeInTheDocument()
    expect(screen.getByText('El Peregrinaje del Héroe — v4.1')).toBeInTheDocument()
    expect(screen.getByText('Iniciar Peregrinaje')).toBeInTheDocument()
    expect(screen.getByText('vs IA')).toBeInTheDocument()
    expect(screen.getByText(/Hot-seat/i)).toBeInTheDocument()
    expect(screen.getByText('Mostrar tooltips de ayuda')).toBeInTheDocument()
  })
})
