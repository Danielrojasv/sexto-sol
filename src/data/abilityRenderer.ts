// Renderer i18n: traduce un Ability tree a texto en español.
//
// El front consume esta función para mostrar el texto de la carta. La función
// es PURA — no depende de React ni Pixi ni nada de UI. Vive con la card data
// para que su test sea unitario puro.
//
// Phase D entrega templates en español-Chile. EN/PT vienen con localización
// post-launch (se agrega un parámetro `lang` al render y un mapping por idioma).

import type { Ability, Condition, Effect, ShipFilter, Target, Trigger, TriggerEvent } from './primitives/spec'

export type Lang = 'es'

/** Render principal: ability completa = trigger + efecto. */
export function renderAbility(ability: Ability, lang: Lang = 'es'): string {
  if (ability.description) return ability.description
  const triggerText = renderTrigger(ability.trigger, lang)
  const effectText = renderEffect(ability.effect, lang)
  if (triggerText.length === 0) return ensurePeriod(effectText)
  return ensurePeriod(`${triggerText} ${effectText}`)
}

function ensurePeriod(s: string): string {
  const trimmed = s.trim()
  if (trimmed.length === 0) return trimmed
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`
}

// ---------------------------------------------------------------------------
// Trigger rendering
// ---------------------------------------------------------------------------

function renderTrigger(trigger: Trigger, lang: Lang): string {
  switch (trigger.kind) {
    case 'on_play':
      return 'Cuando entra en juego,'
    case 'on_destroy':
      return 'Cuando es destruida,'
    case 'on_event':
      return renderTriggerEvent(trigger.event)
    case 'continuous':
      return 'Mientras esté en juego,'
    case 'activated':
      return renderActivated(trigger, lang)
  }
}

function renderTriggerEvent(event: TriggerEvent): string {
  switch (event) {
    case 'ship_damaged':
      return 'Cuando recibe daño,'
    case 'ship_destroyed':
      return 'Cuando una nave es destruida,'
    case 'ship_attacked':
      return 'Cuando una nave es atacada,'
    case 'card_played':
      return 'Cuando se juega una carta,'
    case 'phase_start':
      return 'Al inicio de una fase,'
    case 'phase_end':
      return 'Al final de una fase,'
    case 'turn_start':
      return 'Al inicio del turno,'
    case 'homeworld_damaged':
      return 'Cuando un mundo natal recibe daño,'
    case 'card_drawn':
      return 'Cuando se roba una carta,'
    default:
      return ''
  }
}

function renderActivated(
  trigger: Extract<Trigger, { kind: 'activated' }>,
  _lang: Lang,
): string {
  const window =
    trigger.window === 'any_time'
      ? 'En cualquier momento'
      : `Durante la fase de ${capitalize(trigger.window)}`
  const cost: string[] = []
  if (trigger.cost?.energy && trigger.cost.energy > 0)
    cost.push(`paga ${trigger.cost.energy} energía`)
  if (trigger.cost?.sacrificeShip) cost.push('sacrifica una nave')
  const costPart = cost.length > 0 ? `${cost.join(' y ')}: ` : ''
  return `${window}, ${costPart}`
}

function capitalize(s: string): string {
  if (s.length === 0) return s
  return s[0]?.toUpperCase() + s.slice(1)
}

// ---------------------------------------------------------------------------
// Effect rendering
// ---------------------------------------------------------------------------

export function renderEffect(effect: Effect, lang: Lang = 'es'): string {
  switch (effect.op) {
    case 'noop':
      return ''
    case 'damage':
      return `hace ${effect.amount} daño a ${renderTarget(effect.target)}`
    case 'damage_homeworld':
      return `hace ${effect.amount} daño al mundo natal ${effect.player === 'self' ? 'propio' : 'enemigo'}`
    case 'destroy':
      return `destruye ${renderTarget(effect.target)}`
    case 'exile':
      return `exilia ${renderTarget(effect.target)}`
    case 'bounce_to_hand':
      return `regresa ${renderTarget(effect.target)} a la mano de su dueño`
    case 'shuffle_to_deck':
      return `mezcla ${renderTarget(effect.target)} en el mazo de ${effect.owner === 'self' ? 'su dueño' : 'el oponente'}`
    case 'draw': {
      const subj = effect.player === 'self' ? 'el controlador roba' : 'el oponente roba'
      return `${subj} ${effect.n} carta${effect.n === 1 ? '' : 's'}`
    }
    case 'discard': {
      const subj = effect.target === 'self' ? 'el controlador descarta' : 'el oponente descarta'
      const sel = effect.selection === 'random' ? 'al azar' : 'a elección'
      return `${subj} ${effect.n} carta${effect.n === 1 ? '' : 's'} ${sel}`
    }
    case 'mill': {
      const subj = effect.player === 'self' ? 'el controlador molla' : 'el oponente molla'
      return `${subj} ${effect.n} carta${effect.n === 1 ? '' : 's'}`
    }
    case 'search': {
      const owner = effect.owner === 'self' ? 'el controlador' : 'el oponente'
      const zone =
        effect.zone === 'deck'
          ? 'el mazo'
          : effect.zone === 'pozo_astral'
            ? 'el Pozo Astral'
            : 'el cementerio'
      const dest = effect.destination === 'play' ? ' y la pone en juego' : ''
      return `${owner} busca ${effect.count} carta${effect.count === 1 ? '' : 's'} en ${zone}${dest}`
    }
    case 'modify_strength':
      return effect.kind === 'set'
        ? `${renderTarget(effect.target)} pasa a tener ${effect.value} de fuerza ${renderDuration(effect.duration)}`
        : `${renderTarget(effect.target)} ${effect.value >= 0 ? 'gana' : 'pierde'} ${Math.abs(effect.value)} a la fuerza ${renderDuration(effect.duration)}`
    case 'modify_hp':
      if (effect.kind === 'set_to_max') {
        return `${renderTarget(effect.target)} regenera al máximo de HP`
      }
      return effect.kind === 'set'
        ? `${renderTarget(effect.target)} pasa a tener ${effect.value} HP ${renderDuration(effect.duration)}`
        : `${renderTarget(effect.target)} ${effect.value >= 0 ? 'gana' : 'pierde'} ${Math.abs(effect.value)} HP ${renderDuration(effect.duration)}`
    case 'grant_keyword':
      return `${renderTarget(effect.target)} gana ${capitalize(effect.keyword)} ${renderDuration(effect.duration)}`
    case 'remove_ability':
      return `${renderTarget(effect.target)} pierde sus habilidades ${renderDuration(effect.duration)}`
    case 'generate_energy': {
      const subj = effect.player === 'self' ? 'el controlador gana' : 'el oponente gana'
      return `${subj} ${effect.n} energía ${renderDuration(effect.duration)}`
    }
    case 'sacrifice':
      return `sacrifica ${renderTarget(effect.target)}`
    case 'prevent_damage':
      return `previene los próximos ${effect.amount} de daño a ${renderTarget(effect.target)} ${renderDuration(effect.duration)}`
    case 'sequence':
      return effect.effects.map((e) => renderEffect(e, lang)).join('; ')
    case 'conditional': {
      const ifPart = `si ${renderCondition(effect.condition)}, ${renderEffect(effect.thenEffect, lang)}`
      return effect.elseEffect
        ? `${ifPart}; en otro caso, ${renderEffect(effect.elseEffect, lang)}`
        : ifPart
    }
    case 'for_each':
      return `por cada ${renderShipFilter(effect.filter)}, ${renderEffect(effect.effect, lang)}`
    case 'keyword_amplifier':
      return `cada vez que ${capitalize(effect.keyword)} se active en una nave que controlas, su efecto se incrementa en +${effect.deltaBonus}`
    case 'cost_modifier': {
      const sign = effect.delta < 0 ? 'menos' : 'más'
      const abs = Math.abs(effect.delta)
      return `las activaciones de ${capitalize(effect.target.keyword)} cuestan ${abs} energía ${sign} (mínimo ${effect.minCost})`
    }
  }
}

function renderTarget(target: Target): string {
  switch (target.kind) {
    case 'self':
      return 'esta nave'
    case 'controller':
      return 'el controlador'
    case 'opponent':
      return 'el oponente'
    case 'all_ships':
      return target.filter ? `todas las naves ${renderShipFilter(target.filter)}` : 'todas las naves'
    case 'chosen_ship':
      return target.filter ? `una nave a elección ${renderShipFilter(target.filter)}` : 'una nave a elección'
    case 'random_ship':
      return target.filter
        ? `una nave al azar ${renderShipFilter(target.filter)}`
        : 'una nave al azar'
    case 'homeworld':
      return target.player === 'self' ? 'el mundo natal propio' : 'el mundo natal enemigo'
    case 'attacker':
      return 'la nave atacante'
    case 'chosen_permanent': {
      const f = target.filter
      if (!f) return 'una carta permanente a elección'
      const parts: string[] = []
      if (f.controller && f.controller !== 'any') {
        parts.push(f.controller === 'self' ? 'aliada' : 'enemiga')
      }
      if (f.cardType) parts.push(`de tipo ${f.cardType}`)
      const tail = parts.length > 0 ? ` ${parts.join(' ')}` : ''
      return `una carta permanente a elección${tail}`
    }
  }
}

function renderShipFilter(filter: ShipFilter): string {
  const parts: string[] = []
  if (filter.controller && filter.controller !== 'any') {
    parts.push(filter.controller === 'self' ? 'aliada' : 'enemiga')
  }
  if (filter.race && filter.race !== 'any') parts.push(`de raza ${capitalize(filter.race)}`)
  if (filter.cardType) parts.push(`de tipo ${filter.cardType}`)
  if (filter.keywordsAny && filter.keywordsAny.length > 0)
    parts.push(`con ${filter.keywordsAny.map(capitalize).join(' o ')}`)
  if (filter.keywordsAll && filter.keywordsAll.length > 0)
    parts.push(`con ${filter.keywordsAll.map(capitalize).join(' y ')}`)
  if (filter.costLte !== undefined) parts.push(`de costo ≤ ${filter.costLte}`)
  if (filter.costGte !== undefined) parts.push(`de costo ≥ ${filter.costGte}`)
  if (filter.wasDamagedThisTurn) parts.push('que recibió daño este turno')
  return parts.length > 0 ? parts.join(' ') : ''
}

function renderDuration(duration: string): string {
  switch (duration) {
    case 'permanent':
      return 'permanentemente'
    case 'end_of_turn':
      return 'hasta el final del turno'
    case 'end_of_age':
      return 'hasta el final de la Edad'
    case 'this_turn':
      return 'durante este turno'
    case 'next_turn':
      return 'durante el próximo turno'
    default:
      return ''
  }
}

function renderCondition(cond: Condition): string {
  switch (cond.kind) {
    case 'always':
      return 'siempre'
    case 'count_filter': {
      const opTxt = cond.op === 'gte' ? '≥' : cond.op === 'lte' ? '≤' : '='
      const zone = cond.zone && cond.zone !== 'in_play' ? renderZone(cond.zone) : null
      const player = cond.player === 'opponent' ? 'del oponente' : 'propio'
      if (zone) {
        return `hay ${opTxt} ${cond.value} cartas ${renderShipFilter(cond.filter)} en ${zone} ${player}`.trim()
      }
      return `hay ${opTxt} ${cond.value} naves ${renderShipFilter(cond.filter)}`
    }
    case 'self_has_keyword':
      return `esta nave tiene ${capitalize(cond.keyword)}`
    case 'controller_energy_gte':
      return `el controlador tiene ≥ ${cond.value} energía`
  }
}

function renderZone(zone: string): string {
  switch (zone) {
    case 'pozo_astral':
      return 'el Pozo Astral'
    case 'disolucion':
      return 'Disolución'
    case 'hand':
      return 'la mano'
    case 'deck':
      return 'el mazo'
    case 'in_play':
      return 'el campo'
    default:
      return zone
  }
}
