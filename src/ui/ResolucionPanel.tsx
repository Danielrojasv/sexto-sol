// ResolucionPanel v4.2 — desglose del revelado.
//
// Daniel pidió esto post-playtest: "podemos poner una etapa de revisión donde
// revise que hizo mi oponente y que hice yo para definir y que luego pase al
// siguiente turno?". Aparece en sub-paso `revisar_resolucion` (después de REVEAL)
// y muestra, para cada jugador, el cálculo de fuerza paso a paso:
//
//   fuerza_base ± lectura_rival + bonus_planeta ± condicionales ± héroe × eclipse
//
// Sin re-correr el interpreter — usamos el último entry de historialPremoniciones
// para conocer qué premonición declaró cada uno y qué carta jugó.

import { POOL_REGISTRY } from '@/data/cards/loader'
import { penalizacionPorPasarConAcierto } from '@/engine/interpreter'
import type { Categoria, GameState, PlayerId } from '@/engine/types'
import { useGameStore } from '@/store/gameStore'

export function ResolucionPanel() {
  const state = useGameStore((s) => s.state)
  const dispatch = useGameStore((s) => s.dispatch)
  if (!state) return null
  if (state.subPaso !== 'revisar_resolucion') return null
  const ultimo = state.historialPremoniciones[state.historialPremoniciones.length - 1]
  if (!ultimo) return null

  return (
    <section className="bg-slate-900 border-2 border-amber-600 rounded p-4 space-y-3">
      <header className="flex justify-between items-baseline">
        <h3 className="text-lg font-bold text-amber-400">Resolución del turno {ultimo.turno}</h3>
        <span className="text-xs text-slate-400">tramo: {ultimo.tramo}</span>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <PlayerResolutionBreakdown state={state} playerId="a" />
        <PlayerResolutionBreakdown state={state} playerId="b" />
      </div>
      <div className="flex justify-end pt-2">
        <button
          onClick={() => dispatch({ type: 'CONTINUE_TURN' })}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded font-bold"
        >
          Continuar al siguiente paso
        </button>
      </div>
    </section>
  )
}

function PlayerResolutionBreakdown({
  state,
  playerId,
}: {
  state: GameState
  playerId: PlayerId
}) {
  const player = state.players[playerId]
  const oponenteId: PlayerId = playerId === 'a' ? 'b' : 'a'
  const oponente = state.players[oponenteId]
  const ultimo = state.historialPremoniciones[state.historialPremoniciones.length - 1]!
  const cardId = state.accionesPendientes[playerId]
  const card = cardId ? POOL_REGISTRY.cards.get(cardId) : undefined
  const miPremonicion: Categoria = playerId === 'a' ? ultimo.a : ultimo.b
  const oponentePremonicion: Categoria = playerId === 'a' ? ultimo.b : ultimo.a
  const oponenteCategoria: Categoria = playerId === 'a' ? ultimo.cardCategoriaB : ultimo.cardCategoriaA
  const planet = player.planetElegidoActual
    ? POOL_REGISTRY.planets.get(player.planetElegidoActual)
    : undefined

  const lineas: Array<{ label: string; delta: number | string; nota?: string }> = []

  if (!card) {
    // Pasó. Solo aplica penalización mínima si acertó.
    const pen = penalizacionPorPasarConAcierto(miPremonicion, oponenteCategoria)
    if (pen > 0) {
      lineas.push({
        label: 'Pasaste con acierto',
        delta: '-1 al rival',
        nota: `tu premonición ${miPremonicion} === categoría rival`,
      })
    } else {
      lineas.push({ label: 'Pasaste sin acierto', delta: 0 })
    }
  } else {
    lineas.push({ label: `Fuerza base de ${card.nombre}`, delta: card.fuerzaBase })

    // 1. Lectura del rival.
    if (oponentePremonicion === card.categoria) {
      lineas.push({
        label: `Rival leyó ${oponentePremonicion} ✓`,
        delta: -card.penalizacionAcierto,
        nota: 'acierto: pierdes penalización',
      })
    } else {
      lineas.push({
        label: `Rival leyó ${oponentePremonicion} ✗`,
        delta: +1,
        nota: 'fallo: ganás +1',
      })
    }

    // 2. Bonus planeta.
    if (
      planet &&
      state.tramo !== 'sexto_sol' &&
      planet.categoria === card.categoria
    ) {
      lineas.push({
        label: `Bonus planeta (${planet.nombre})`,
        delta: +1,
      })
    }

    // 3. Condicionales sobre estado del juego.
    for (const cond of card.condicionales) {
      const trigger = evaluarCondicional(cond, state, player, oponente)
      if (trigger && cond.fuerzaDelta !== undefined) {
        lineas.push({
          label: cond.efectoTexto ?? `Condicional ${cond.tipo}`,
          delta: cond.fuerzaDelta,
        })
      }
    }

    // 4. Habilidades de héroe.
    if (
      player.raza === 'Tezhal' &&
      (player.heroEstado === 'despertado' || player.heroEstado === 'ascendido') &&
      card.categoria === 'Ataque'
    ) {
      lineas.push({ label: 'Tezhal despertado: ataque', delta: +1 })
    }
    if (
      player.raza === 'Würon' &&
      (player.heroEstado === 'despertado' || player.heroEstado === 'ascendido') &&
      miPremonicion === oponenteCategoria
    ) {
      lineas.push({ label: 'Würon despertado: lectura acertada', delta: +1 })
    }

    // 5. Eclipse.
    if (state.eclipseInvocado && state.eclipseInvocador === playerId) {
      lineas.push({ label: 'Eclipse × 2', delta: '×2' })
    }
  }

  // Calcular fuerza final aproximada (suma de deltas numéricos, sin ×2 logic).
  let suma = 0
  let hayEclipse = false
  for (const l of lineas) {
    if (typeof l.delta === 'number') suma += l.delta
    if (l.delta === '×2') hayEclipse = true
  }
  if (hayEclipse) suma *= 2
  const final = Math.max(0, suma)

  return (
    <div className="bg-slate-800 rounded p-3 space-y-2">
      <div className="flex justify-between items-baseline">
        <h4 className="font-bold">{playerId === 'a' ? 'Vos' : 'Oponente'}</h4>
        <span className="text-xs text-slate-400">
          {card ? card.nombre : 'pasó turno'} · prem. {miPremonicion}
        </span>
      </div>
      <ul className="text-xs space-y-1">
        {lineas.map((l, i) => (
          <li key={i} className="flex justify-between gap-2">
            <span className="text-slate-300">{l.label}</span>
            <span className="font-mono text-amber-300">
              {typeof l.delta === 'number'
                ? (l.delta > 0 ? `+${l.delta}` : `${l.delta}`)
                : l.delta}
            </span>
          </li>
        ))}
      </ul>
      {card && (
        <div className="pt-2 border-t border-slate-700 flex justify-between items-baseline">
          <span className="text-sm text-slate-400">Fuerza final</span>
          <span className="text-xl font-bold text-amber-400">{final}</span>
        </div>
      )}
    </div>
  )
}

type CondDef = {
  tipo:
    | 'heroe_estado'
    | 'tramo'
    | 'atributo_propio'
    | 'atributo_oponente'
    | 'eclipse_activo'
  valor?: string
  valorAtributo?: Categoria
  umbral?: number
  fuerzaDelta?: number
}

function evaluarCondicional(
  cond: CondDef,
  state: GameState,
  player: GameState['players']['a'],
  oponente: GameState['players']['a'],
): boolean {
  switch (cond.tipo) {
    case 'heroe_estado':
      return cond.valor === player.heroEstado
    case 'tramo':
      return cond.valor === state.tramo
    case 'atributo_propio': {
      if (!cond.valorAtributo || cond.umbral === undefined) return false
      const key = catToAtr(cond.valorAtributo)
      return player.atributos[key] >= cond.umbral
    }
    case 'atributo_oponente': {
      if (!cond.valorAtributo || cond.umbral === undefined) return false
      const key = catToAtr(cond.valorAtributo)
      return oponente.atributos[key] >= cond.umbral
    }
    case 'eclipse_activo':
      return state.eclipseInvocado
  }
}

function catToAtr(cat: Categoria): 'fuerza' | 'resguardo' | 'resonancia' {
  return cat === 'Ataque' ? 'fuerza' : cat === 'Defensa' ? 'resguardo' : 'resonancia'
}
