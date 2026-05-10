// LORE_BLOCKLIST — términos prohibidos en nombres de cartas.
//
// Las razas de Sexto Sol son inventadas. Las culturas precolombinas reales son
// ecos resonantes en el lore (CANON-LORE §6.3) — NO razas jugables ni nombres
// directos en cartas. Esta lista bloquea:
//
//   1. Deidades vivas o todavía-veneradas en culturas indígenas reales.
//   2. Nombres de líderes/héroes históricos reales.
//   3. Glifos / símbolos sagrados específicos.
//   4. Instituciones, conceptos religiosos y términos rituales reales.
//
// El validator (`scripts/validate-cards.ts`) chequea cada Card.name contra
// esta lista usando **word boundaries** (case-insensitive). Esto evita falsos
// positivos: "mita" no matchea "ermita" o "vomita". Términos con apóstrofe
// (ej. "mit'a") usan boundary igualmente porque el apóstrofe es no-word char.
//
// Lista expandible. Si encontrás un término que debería estar acá, agregalo
// con un comentario que justifique el bloqueo.

export const LORE_BLOCKLIST: readonly string[] = [
  // --- Deidades mexica/náhuatl (todavía referenciadas en ceremonias vivas) ---
  'huitzilopochtli',
  'quetzalcoatl',
  'quetzalcóatl',
  'tlaloc',
  'tláloc',
  'tezcatlipoca',
  'mictlantecuhtli',
  'xipe-totec',
  'coatlicue',
  'tonatiuh',
  'coyolxauhqui',

  // --- Deidades inca/quechua/aymara ---
  'inti', // Sol como deidad
  'pachamama',
  'wiracocha',
  'viracocha',
  'pachacamac',
  'mama-quilla',
  'illapa',

  // --- Deidades muisca/chibcha ---
  'bochica',
  'bachué',
  'chiminigagua',
  'chibchacum',
  'cuchavira',

  // --- Espíritus/ngenes mapuche (vivos, parte del kimun activo) ---
  'ngenechen',
  'ngenmapu',
  'pillan',
  'kalku',
  'machi', // rol espiritual sagrado, no usar como nombre de carta

  // --- Líderes/héroes históricos reales ---
  'lautaro',
  'caupolicán',
  'caupolican',
  'galvarino',
  'cuauhtemoc',
  'cuauhtémoc',
  'moctezuma',
  'atahualpa',
  'tupac-amaru',
  'tupac amaru',
  'mama-ocllo',

  // --- Pueblos reales (no usar como nombre de carta — son razas eco) ---
  'mexica',
  'inca',
  'inka', // variante ortográfica directa del imperio Inca
  'muisca',
  'mapuche',
  'maya',
  'mochica',
  'tupi-guarani',
  'tupi guarani',
  'olmeca',
  'tairona',
  'selknam',
  "selk'nam",

  // --- Instituciones / conceptos rituales reales ---
  "mit'a", // institución andina real de tributo laboral
  'mita', // sin apóstrofe — boundary evita matchear "ermita"/"vomita"
  'cuauhtli', // guerrero águila náhuatl, dimensión ritual
  'mañke', // cóndor en mapudungun, animal con peso ceremonial
  'tonalli', // concepto religioso náhuatl (alma-fuego)
  'tezontli', // piedra volcánica usada en arquitectura/ritual mexica
] as const

/**
 * Chequea si un nombre de carta contiene algún término del blocklist.
 * Comparación case-insensitive con word boundaries (`\b`) — "mita" NO matchea
 * dentro de "ermita", pero "Inca del Sur" SÍ matchea "inca".
 *
 * Las word boundaries tratan los caracteres no-word (apóstrofes, guiones,
 * espacios, tildes) como delimitadores, lo cual es exactamente lo que
 * queremos para nombres de cartas en español-precolombino.
 */
export function findBlocklistedTerm(name: string): string | null {
  for (const term of LORE_BLOCKLIST) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(`\\b${escaped}\\b`, 'i')
    if (re.test(name)) return term
  }
  return null
}
