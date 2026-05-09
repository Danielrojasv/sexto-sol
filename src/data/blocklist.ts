// LORE_BLOCKLIST — términos prohibidos en nombres de cartas.
//
// Las razas de Sexto Sol son inventadas. Las culturas precolombinas reales son
// ecos resonantes en el lore (CANON-LORE §6.3) — NO razas jugables ni nombres
// directos en cartas. Esta lista bloquea:
//
//   1. Deidades vivas o todavía-veneradas en culturas indígenas reales.
//   2. Nombres de líderes/héroes históricos reales.
//   3. Glifos / símbolos sagrados específicos.
//
// El validator (`scripts/validate-cards.ts`) chequea cada Card.name contra
// esta lista. Match (case-insensitive, subword) → error duro, CI falla.
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
] as const

/**
 * Chequea si un nombre de carta contiene algún término del blocklist.
 * Comparación case-insensitive, subword (substring match).
 */
export function findBlocklistedTerm(name: string): string | null {
  const norm = name.toLowerCase()
  for (const term of LORE_BLOCKLIST) {
    if (norm.includes(term)) return term
  }
  return null
}
