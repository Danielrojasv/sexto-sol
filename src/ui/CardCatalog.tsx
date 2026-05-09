// CardCatalog — página debug que renderiza las 42 cartas del set base
// agrupadas por raza, con su art + texto traducido por el renderer.

import { ALL_CARDS, cardsByRace } from '@/data/cards'
import type { Card, Race } from '@/engine/types'
import { renderAbility } from '@/data/abilityRenderer'
import { CardArt } from './CardArt'

const RACES: readonly { id: Race; label: string; subtitle: string }[] = [
  { id: 'wuron', label: 'Würon', subtitle: 'Pueblos del Sur Profundo · Reactiva' },
  { id: 'tezhal', label: 'Tezhal', subtitle: 'Devotos del Corazón Ardiente · Iniciativa' },
  { id: 'quralan', label: "Q'ralan", subtitle: 'Hijos del Sol Pétreo · Acumulativa' },
  { id: 'zaqe', label: 'Zaqe', subtitle: 'Mercaderes del Lago Cósmico · Post-combate' },
]

const RARITY_COLOR: Record<Card['rarity'], string> = {
  common: 'text-slate-300',
  rare: 'text-sky-300',
  legendary: 'text-amber-300',
}

function CardTile({ card }: { card: Card }) {
  return (
    <div className="bg-slate-900/60 rounded-lg overflow-hidden border border-slate-800 hover:border-slate-600 transition-colors">
      <CardArt card={card} width={220} className="rounded-t-lg" />
      <div className="p-3 space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className={`font-semibold text-sm leading-tight ${RARITY_COLOR[card.rarity]}`}>
            {card.name}
          </h3>
          <span className="text-xs text-slate-500 shrink-0 font-mono">
            {card.cost}c
            {card.strength !== undefined && card.hp !== undefined && (
              <>
                {' · '}
                {card.strength}/{card.hp}
              </>
            )}
          </span>
        </div>
        <p className="text-xs text-slate-400 uppercase tracking-wide">
          {card.type}
          {card.keywords.length > 0 && ` · ${card.keywords.join(', ')}`}
        </p>
        {card.abilities.map((ab, i) => (
          <p key={i} className="text-xs text-slate-300 leading-snug">
            {renderAbility(ab)}
          </p>
        ))}
        {card.flavorText && (
          <p className="text-xs text-slate-500 italic leading-snug border-t border-slate-800 pt-2">
            “{card.flavorText}”
          </p>
        )}
      </div>
    </div>
  )
}

export function CardCatalog() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <header className="max-w-6xl mx-auto mb-12">
        <h1 className="text-4xl font-semibold tracking-tight">Sexto Sol — Set base</h1>
        <p className="mt-2 text-slate-400">
          {ALL_CARDS.length} cartas · 4 razas · arte placeholder generado por IA
        </p>
      </header>

      <div className="max-w-6xl mx-auto space-y-16">
        {RACES.map((race) => {
          const cards = cardsByRace(race.id)
          return (
            <section key={race.id}>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold">{race.label}</h2>
                <p className="text-sm text-slate-500">{race.subtitle}</p>
                <p className="text-xs text-slate-600 mt-1 font-mono">
                  {cards.length} cartas
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {cards.map((card) => (
                  <CardTile key={card.id} card={card} />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
