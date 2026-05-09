# Naming Conventions — Sexto Sol

Documento normativo para el card-designer agent y cualquier humano que diseñe cartas. **Las razas son inventadas.** Las culturas precolombinas reales son ecos resonantes en el lore (CANON-LORE §6.3) — NO se nombran directamente.

> Antes de cualquier publicación comercial, consultar con personas de las comunidades referenciadas. Esta guía es buena práctica creativa, no certificación.

---

## 1. Reglas inviolables

1. **Nunca** usar nombres de deidades vivas o todavía-veneradas (Inti, Bochica, Quetzalcóatl, Ngenechén, etc.).
2. **Nunca** usar nombres de líderes históricos reales como nombre de carta (Lautaro, Atahualpa, Moctezuma).
3. **Nunca** copiar glifos sagrados directos (ojo de Pachacamac, kultrun ritual exacto).
4. **Nunca** usar el nombre directo del pueblo eco (Mapuche, Inca, Mexica, Muisca) como sufijo/prefijo de carta.
5. **Sí** usar fonemas y patterns lingüísticos que evoquen sin copiar — exactamente lo que vos sentís cuando leés "Q'ralan" o "Tezhal" pero no podés mapear a una palabra real.

El archivo `src/data/blocklist.ts` exporta `LORE_BLOCKLIST` con la lista cerrada de términos prohibidos que el validator chequea automáticamente.

---

## 2. Patterns por raza

### 2.1. Q'ralan — "Hijos del Sol Pétreo"

**Eco terrestre:** civilizaciones imperiales andinas (Inca + andino general).

**Fonemas característicos** (libres, no copiar palabras reales):

- Apóstrofes glotalizados: `q'`, `k'`, `t'` (ej: `Q'ralan`, `K'illay`, `T'awa`).
- Vocales abiertas, simétricas: `a`, `i`, `u`.
- Consonantes: `ñ`, `ll`, `ch`, `q`, `r`.
- Sufijos plausibles: `-suyu`, `-wasi`, `-pampa`, `-ay`, `-illay`, `-untay`.

**Patrones de nombre:**

- `[Sustantivo Solar] del [Objeto Cósmico]` — "Q'illay del Sol", "Sumqa del Tránsito"
- `[Sustantivo]-[Sufijo cosmológico]` — "Inti-Wasi", "Punq'una-Ayllu"
- `[Adjetivo cualitativo] [Sustantivo]` — "Pétreo Sumaj", "Ñawi del Tahuantin"

**Voz narrativa para flavor text:** formal, ceremonial, jerárquica. "En formación somos una sola luz." Mucho "nosotros" colectivo.

**Ejemplos válidos:**

- ✅ "Q'illay del Sol" (Q'illay = nombre inventado fonéticamente cercano a Quechua)
- ✅ "Sumqa Pétreo"
- ✅ "Ayllu de Cristal"

**Ejemplos prohibidos:**

- ❌ "Inti del Sur" (Inti = deidad viva)
- ❌ "Atahualpa Pétreo" (líder histórico real)
- ❌ "Tahuantinsuyu Eterno" (el imperio inca real, no es eco — es referencia directa)

---

### 2.2. Würon — "Pueblos del Sur Profundo"

**Eco terrestre:** Mapuche y pueblos del sur americano.

**Fonemas característicos** (libres):

- Diptongos pesados: `aw`, `ow`, `ew`.
- Trí-consonantes: `tr`, `lh`, `ñg`.
- Vocales largas: `ü`, `ä`.
- Sufijos plausibles: `-pang`, `-mapu` no (es real), usar `-mapun`, `-rüf`, `-üntu`, `-ñke`.

**Patrones de nombre:**

- `[Sustantivo natural] del [Geografía cósmica]` — "Lhüpang del Brote", "Trülke del Sur"
- `[Adjetivo de fuerza] [Sustantivo]` — "Mañke Profundo", "Ñgenüf del Bosque"
- Sin estructura imperial — los Würon son descentralizados, los nombres también.

**Voz narrativa:** orgánica, anclada en cuerpo y tierra, pesada. "Cada herida es una raíz que profundiza." Imágenes de bosque, brote, raíz, río.

**Ejemplos válidos:**

- ✅ "Lhüpang del Brote"
- ✅ "Mañke del Sur Profundo"
- ✅ "Trülke Verde"

**Ejemplos prohibidos:**

- ❌ "Ngenechén del Sur" (espíritu vivo en kimün mapuche)
- ❌ "Lautaro Cósmico" (líder histórico)
- ❌ "Wallmapu Eterno" (territorio mapuche real)
- ❌ "Machi del Brote" (rol espiritual sagrado)

---

### 2.3. Tezhal — "Devotos del Corazón Ardiente"

**Eco terrestre:** culturas mesoamericanas precolombinas (Mexica, Maya).

**Fonemas característicos** (libres):

- Combinaciones únicas: `tz`, `tl`, `xt`, `hu`, `qu`.
- Sílabas pesadas terminadas en consonante: `-tl`, `-tli`.
- Sufijos plausibles: `-tlani`, `-xochitl-libre`, `-tzin`, `-cuauhtli` (cuidado: cuauhtli = águila ritual; usar fonético cercano como `kwauhtli`).

**Patrones de nombre:**

- `[Sustantivo]-[Adjetivo Ritual]` — "Tezhal-tlani", "Xolot del Corazón"
- `[Adjetivo de fuego] [Sustantivo]` — "Ardiente Quetzal-libre" (no usar Quetzalcóatl), "Tlali Sangrante"
- Énfasis en sacrificio, ofrenda, fuego ritual.

**Voz narrativa:** ritualizada, intensa, voluntaria. "El corazón que se ofrenda enciende el siguiente sol." Imágenes de fuego, obsidiana, plumaje, sangre cósmica.

**Ejemplos válidos:**

- ✅ "Tezhal-tlani del Corazón"
- ✅ "Xolot Ardiente"
- ✅ "Tonatzin de Obsidiana" (Tonatzin = inventado fonéticamente, NO Tonantzin que es real)

**Ejemplos prohibidos:**

- ❌ "Huitzilopochtli del Tonalli" (deidad)
- ❌ "Quetzalcóatl Eterno" (deidad)
- ❌ "Moctezuma Solar" (líder histórico)

---

### 2.4. Zaqe — "Mercaderes del Lago Cósmico"

**Eco terrestre:** Muisca / Chibcha.

**Fonemas característicos** (libres):

- Combinaciones suaves: `sq`, `zh`, `gu`.
- Vocales redondeadas: `o`, `u`.
- Sufijos plausibles: `-sqha`, `-zhua`, `-guata`, `-zaqe` (es la raza).

**Patrones de nombre:**

- `[Sustantivo] del [Lago/Espejo Cósmico]` — "Zaqe-Bochica del Espejo" (cuidado: Bochica está prohibido directo, usar `Bohzhica` o similar), "Guazha del Agua"
- `[Adjetivo dorado] [Sustantivo]` — "Áureo Sumzha", "Tundama Iridiscente"
- Imágenes acuáticas, oro líquido, transmutación.

**Voz narrativa:** contemplativa, transformadora, paciente. "Lo que se hunde en el lago no muere; se transmuta." Imágenes de agua, balsa, espejo, oro fundido.

**Ejemplos válidos:**

- ✅ "Bohzhica del Lago" (fonéticamente cercano a Bochica pero NO Bochica)
- ✅ "Sumzha de Oro"
- ✅ "Guazha del Espejo Estelar"

**Ejemplos prohibidos:**

- ❌ "Bochica del Lago" (deidad real)
- ❌ "Bachué Eterna" (deidad real)
- ❌ "Muisca Dorado" (nombre del pueblo eco)

---

## 3. Reglas universales (todas las razas)

### Tipos de carta y nombre

- **Naves:** sustantivo concreto + adjetivo o de+lugar. "Explorador del Brote", "Centinela Pétreo".
- **Armas:** objeto evocativo. "Cuchilla de Obsidiana", "Lanza Solar".
- **Tecnologías:** acción ritual. "Inversión del Tonalli", "Susurro del Lago".
- **Reliquias:** lugar/símbolo permanente. "Templo de Cristal", "Bosque del Eco".
- **Eventos:** momento narrativo. "Despertar del Sol", "Caída de la Estrella".

### Idioma

- Nombres en **español** (con fonemas que evocan la cosmovisión raza).
- Flavor text en **español-Chile** (tú).
- IDs internos en **inglés/snake_case**: `wuron_explorador_brote`.

### Longitud

- Nombre canónico: **2-5 palabras**, máximo 40 caracteres.
- Flavor text: **1 frase**, máximo 100 caracteres.

---

## 4. Flujo del agente

Cuando el card-designer agent crea una carta:

1. Lee la sección de la raza objetivo en CANON-LORE.md.
2. Lee este archivo (la sección correspondiente).
3. Inventa nombre siguiendo los patterns. Verifica contra `LORE_BLOCKLIST`.
4. Si el nombre matchea blocklist → lo descarta y prueba otro.
5. Genera el flavor text con la voz narrativa de la raza.
6. Después corre `pnpm validate:cards` que confirma el bloqueo no fue burlado.

---

## 5. Crecimiento del blocklist

Si en el proceso de diseño aparece un término que debería estar bloqueado pero no está:

1. Agregalo a `src/data/blocklist.ts` con un comentario que justifique el bloqueo (ej: "Tonantzin = deidad mariana sincrética viva").
2. Re-correr el validator para detectar cartas existentes que matcheen.
3. Si alguna existente matchea, renombrar.

---

_Vivo. Última actualización: 2026-05-09 (Phase E inicial)._
