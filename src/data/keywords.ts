// Display labels y reminder text para keywords del Set 1.
// Reglas v3.0 sec 8 — glosario completo.
// Referencia: GAME-RULES.md sec 8.

export interface KeywordInfo {
  /** ID en `keywords` array (lowercase, sin tilde). */
  id: string
  /** Nombre canónico para mostrar al jugador. */
  label: string
  /** Texto recordatorio entre paréntesis. */
  reminder: string
}

const ENTRIES: readonly KeywordInfo[] = [
  {
    id: 'bastion',
    label: 'Bastión',
    reminder: 'debe ser atacada antes que otras unidades en su zona',
  },
  {
    id: 'embate',
    label: 'Embate',
    reminder: 'puede atacar el turno que entra al juego',
  },
  {
    id: 'desgarro',
    label: 'Desgarro',
    reminder: 'el daño excedente pasa al objetivo siguiente',
  },
  {
    id: 'vuelo',
    label: 'Vuelo',
    reminder: 'solo puede ser bloqueada por unidades con Vuelo o Bastión',
  },
  {
    id: 'premonition',
    label: 'Premonición',
    reminder: 'resuelve antes que cualquier categoría de mecánica',
  },
  {
    id: 'kulen',
    label: 'Külen',
    reminder: 'cuando esta nave recibe daño y sobrevive, gana +1 fuerza permanente',
  },
  {
    id: 'formacion_solar',
    label: 'Formación Solar',
    reminder: 'esta nave gana +1 fuerza por cada otra nave Q’ralan que controles',
  },
  {
    id: 'ignicion',
    label: 'Ignición',
    reminder: 'puedes sacrificar una nave Tezhal aliada para activar el efecto descrito en la carta',
  },
  {
    id: 'refluencia',
    label: 'Refluencia',
    reminder:
      'al morir va al Pozo Astral; puedes pagar su costo durante tu Despliegue para revivirla; si muere de nuevo, va a Disolución',
  },
] as const

const BY_ID: Record<string, KeywordInfo> = Object.fromEntries(ENTRIES.map((e) => [e.id, e]))

export function getKeywordInfo(id: string): KeywordInfo {
  return BY_ID[id] ?? { id, label: id, reminder: '' }
}

/** "Bastión (debe ser atacada…)" — nombre + recordatorio entre paréntesis. */
export function formatKeyword(id: string): string {
  const info = getKeywordInfo(id)
  return info.reminder ? `${info.label} (${info.reminder})` : info.label
}
