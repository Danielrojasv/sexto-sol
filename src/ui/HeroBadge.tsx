import { heroByRaza } from '@/data/cards/loader'
import type { HeroEstado, Raza } from '@/engine/types'

const ESTADO_LABEL: Record<HeroEstado, string> = {
  neutral: 'Neutral',
  despertado: 'Despertado',
  ascendido: 'Ascendido',
}

export function HeroBadge({ raza, estado }: { raza: Raza; estado: HeroEstado }) {
  const hero = heroByRaza(raza)
  if (!hero) return null

  const habilidadActiva =
    estado === 'ascendido'
      ? `${hero.despertado.habilidad} + ${hero.ascendido.habilidad}`
      : estado === 'despertado'
      ? hero.despertado.habilidad
      : 'Sin habilidades activas todavía'

  return (
    <div className="bg-slate-800 rounded p-3 space-y-1">
      <div className="flex items-baseline gap-2">
        <span className="font-bold">{hero.nombre}</span>
        <span className="text-xs text-amber-400 uppercase tracking-wide">
          {ESTADO_LABEL[estado]}
        </span>
      </div>
      <div className="text-xs text-slate-400 italic">{habilidadActiva}</div>
    </div>
  )
}
