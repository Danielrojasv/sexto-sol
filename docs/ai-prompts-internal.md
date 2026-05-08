# AI Prompts — Internal Beta Only

> ⚠️ **CRITICAL**: Estos prompts son SOLO para placeholder visual durante beta interna y desarrollo. **NUNCA usar AI-generated art en builds públicos, marketing, App Store, Steam, redes sociales.** El backlash contra AI art en CCGs es real y violento (WotC tuvo 3 incidentes públicos en 2 años). El art final será creado por ilustradores humanos.
>
> Uso permitido:
> - ✅ Beta cerrada interna (Daniel + ~5-10 testers privados)
> - ✅ Mood boards compartidos con ilustradores humanos como referencia
> - ✅ Iteración de diseño visual antes de commit a artistas reales
>
> Uso prohibido:
> - ❌ Cualquier publicación pública (Steam, App Store, redes sociales, marketing)
> - ❌ Beta abierta o early access pública
> - ❌ Cualquier build que se distribuya fuera del círculo interno

**Tool recomendado:** Midjourney v6+ (mejor calidad para sci-fi stylizado). Alternativas: Flux (open source via Replicate), DALL-E 3 (más restrictivo), Leonardo.ai (game-asset specific).

**Convenciones de prompt:**
- Sintaxis Midjourney: `prompt --ar W:H --style raw --v 6`
- `--style raw` reduce el "MJ default look" para que no se vea genérico
- Aspect ratios: cards 5:7 (vertical), banners 16:9, fondos 1:1 o 21:9

---

## 1. Visual Identity — Mood Board General

Antes de generar cards, generá 8-12 imágenes de mood board para fijar el "look" del juego. Estas NO se usan en producción, sirven para:
- Mostrar a Daniel + ilustradores humanos en la futura contratación
- Definir paletas de color por facción
- Validar que el "sci-fi pre-Columbian" no se ve ridículo

```
Cinematic concept art of a futuristic civilization that fuses pre-Columbian American
aesthetics with sci-fi technology. Stone temples reimagined as orbital stations,
ceremonial textiles as space suit fabric, ancient glyphs glowing as HUD elements.
Golden hour lighting, deep contrast, painterly digital art style. Anti-derivative:
not Aztec-themed Star Wars, not generic fantasy. Inspired by the work of Pablo
Olivera, Ricardo Molina, and Pixar's Coco visual identity. Earthy palette with
neon accents. --ar 16:9 --style raw --v 6
```

**Variantes para explorar tonos**:
- Reemplazar "Cinematic concept art" por "Detailed digital painting", "Stylized 3D render", "Hand-painted illustration"
- Reemplazar "Golden hour lighting" por "Twilight purple sky", "Eclipsed sun", "Orbital sunset"

---

## 2. Logo y Title Treatment

```
Logo design for a sci-fi card game called "SEXTO SOL". Typography fuses Mayan
codex glyphs with futuristic geometry. Two suns motif: one fading (5th sun
ending), one rising (6th sun emerging). Color palette: deep gold, obsidian
black, cosmic violet. Center-aligned, balanced, suitable for app icon and game
title screen. Vector-style clean lines, no skeuomorphism. --ar 1:1 --style raw --v 6
```

```
Animated title card style: "SEXTO SOL — la guerra por la próxima era". Sci-fi
text overlay on a sector of space showing 4 planets with distinct civilizations.
Subtle parallax-ready composition with 3 visual planes (foreground planets,
midground stars, background nebula). Cinematic widescreen. --ar 21:9 --style raw --v 6
```

---

## 3. Card Frame por Facción

El **frame** es el "template" donde va la ilustración + texto. Genera 1 prompt por facción y luego el diseñador gráfico humano consolida en producción.

### Frame Mexica
```
Trading card game frame design, vertical orientation, sci-fi pre-Columbian
aesthetic. Mexica/Aztec inspired: jaguar warrior glyphs, obsidian black border
with turquoise inlay, sun-stone motif at top, blood-red accents. Top corner: cost
gem in obsidian + gold. Center area: large rectangular illustration window.
Bottom area: name banner in stone-tablet style, stat box with skull/sun icon for
strength. Rules text box parchment-textured. Border thickness 8% of card width.
Suitable for digital card game UI. Clean vector + slight texture. --ar 5:7 --style raw --v 6
```

### Frame Inca
```
Trading card game frame design, vertical orientation, sci-fi pre-Columbian
aesthetic. Inca/Andean inspired: geometric step-pattern border (chakana motif),
gold leaf inlay on red base, woven textile texture at corners, Sapa Inca royal
aesthetic. Top corner: cost gem in gold + crystal. Center: large illustration
window. Bottom: name banner in carved stone style, stat box with condor/sun icon.
Rules text box on linen-textured background. Border 8% width. --ar 5:7 --style raw --v 6
```

### Frame Muisca
```
Trading card game frame design, vertical orientation, sci-fi pre-Columbian
aesthetic. Muisca/Chibcha inspired: golden balsa raft motifs at corners, lake-
ripple pattern border, deep blue + gold + emerald palette, Bochica wisdom
symbols. Top corner: cost gem as droplet of liquid gold. Center: large
illustration window. Bottom: name banner styled as El Dorado golden plaque.
Rules text box on water-rippled background. --ar 5:7 --style raw --v 6
```

### Frame Mapuche
```
Trading card game frame design, vertical orientation, sci-fi pre-Columbian
aesthetic. Mapuche inspired: kultrun drum circular motif at top, witralwe loom
geometric patterns at borders, palette of black + red + ochre + silver, obsidian
and silver-meteorite accents. Top corner: cost gem in polished obsidian. Center:
large illustration window. Bottom: name banner in carved-wood texture, stat box
with kultrun symbol. Rules text box on cured-leather background. --ar 5:7 --style raw --v 6
```

---

## 4. Hero Card Illustrations

Para cada facción, genera ~5 cards "hero" para el set base. Esto da 20 cards iniciales para el placeholder beta. Reemplazás con humano más adelante.

### Mexica — Hero Cards

**Toqui Mexica (Águila Estelar)**
```
A Mexica eagle warrior in sci-fi armor, bioluminescent feather patterns on
plated obsidian armor, ceremonial face paint in turquoise and gold, holding a
macuahuitl (obsidian-bladed sword) that glows with energy. Standing on a
floating temple platform in deep space, Tenochtitlan-Sol orbital city behind.
Painterly digital art, dramatic lighting, deep red and turquoise palette.
Avoid generic fantasy or Aztec-themed Iron Man. --ar 5:7 --style raw --v 6
```

**Sacerdote del Quinto Sol**
```
A Mexica priest in cosmic ritual robes, codex glyphs floating around him as
holographic data, sacrificial obsidian knife in one hand, ceremonial incense
burner in the other emitting glowing tonalpohualli calendar symbols. Behind
him: the dying Fifth Sun, a red giant star. Atmosphere of cosmic urgency.
Painterly digital art, red + black + gold palette. --ar 5:7 --style raw --v 6
```

**Coatlicue Orbital**
```
A massive serpent-skirted goddess Coatlicue reimagined as a planetary defense
station, hundreds of mechanical snakes coiled around a central tower covered in
turquoise mosaics. Operating in low orbit. Maternal but terrifying, ancient
but futuristic. Sense of overwhelming scale. --ar 5:7 --style raw --v 6
```

**Águila de Combate**
```
A Mexica orbital strike fighter shaped like a stylized eagle, jaguar-spotted
hull plating, bioluminescent wing-fins. Diving towards a planet through clouds
of red dust. Action shot, dynamic composition. --ar 5:7 --style raw --v 6
```

**Ofrenda al Quinto Sol**
```
A Mexica ceremony in zero gravity: floating obsidian altar, several warriors in
ritual postures sacrificing their own life-energy as glowing red threads
flowing toward a cracked dying sun. Sacred but tragic. Symbolic, not literal
gore. --ar 5:7 --style raw --v 6
```

### Inca — Hero Cards

**Sapa Inca de Cusco-9**
```
A regal Inca emperor in sci-fi royal regalia, mantle of golden alpaca-fiber
embroidered with quipu data nodes, headdress incorporating mountain-temple
motifs and a holographic sun crown. Standing on a terraced orbital platform
overlooking a hyperdense star system. Painterly art, gold + red + white
palette, atmosphere of imperial dignity. --ar 5:7 --style raw --v 6
```

**Quipucamayoc Estelar**
```
An Inca quipu master surrounded by floating thread-data: hundreds of glowing
multi-colored cords arranged in computational patterns, like a 3D abacus
combined with a server room. Wearing geometric Andean textile robes in cosmic
indigo and gold. Mathematical, contemplative atmosphere. --ar 5:7 --style raw --v 6
```

**Pururauca (Soldado de Piedra)**
```
A massive stone-hewn warrior reimagined as a sci-fi automaton, geometric Andean
patterns carved into its surface, glowing inca-gold seams. The Inca legend says
they were stones that turned into warriors during siege. Sense of unstoppable
mass. --ar 5:7 --style raw --v 6
```

**Ushnu Orbital**
```
An Inca ceremonial platform (ushnu) reimagined as a space station: trapezoidal
geometric architecture in stacked terraces, gold mosaic surfaces catching
starlight, ceremonial trumpets emerging from the structure. Floating above a
mountainous planet. --ar 5:7 --style raw --v 6
```

**Apu (Espíritu de la Montaña)**
```
A massive mountain-spirit being, half-mountain half-cosmic-entity, with
condor wings spreading across multiple kilometers, eyes like ancient stars,
body composed of geological strata interlaced with cosmic energy. Ethereal,
ancient, terrifying. --ar 5:7 --style raw --v 6
```

### Muisca — Hero Cards

**Cacique Dorado de Guatavita-Prime**
```
A Muisca cacique covered head-to-toe in liquid gold, standing on a ceremonial
balsa-raft floating in zero-gravity over a planet whose entire surface is a
golden ocean. Emerald and turquoise jewelry. Behind him, a glowing column of
suspended gold offerings. El Dorado myth made literal. --ar 5:7 --style raw --v 6
```

**Balsa Ceremonial**
```
A Muisca ceremonial raft as a spaceship: gold-covered curved hull, four
priestly figures at the cardinal points, central figure with offering-bowl
containing emerald and gold tribute. Drifting through nebular gold dust.
--ar 5:7 --style raw --v 6
```

**Bochica el Sabio**
```
A Muisca cosmic sage figure, ancient bearded man with skin of gold leaf, eyes
glowing with prophetic insight, robes embroidered with rainbow constellations.
Holding a staff topped with the rainbow that legend says he created. Wisdom
incarnate. --ar 5:7 --style raw --v 6
```

**Sumergir Ritual**
```
A ritual ship being submerged into a lake of liquid gold, glowing through the
golden surface, ceremonial figures performing the offering rite. The water
ripples reveal the ship transforming during submersion (visible in the deeper
glow patterns). --ar 5:7 --style raw --v 6
```

**Zaque de Hunza**
```
A Muisca regional ruler in golden ceremonial regalia, less imposing than the
Cacique but more militarily organized. Standing among warriors with golden
spears, before a strategic map of the Muisca confederation realm. --ar 5:7 --style raw --v 6
```

### Mapuche — Hero Cards

**Toqui de Wallmapu Prime**
```
A Mapuche war leader (toqui) in sci-fi battle gear, palette of black, red,
silver-meteorite. Holding a metawe (ceremonial weapon-staff). Cape woven in
witralwe loom patterns. Standing in a field of blue Patagonian space-flora.
Defiant posture. Eyes show calm intensity, not aggression. --ar 5:7 --style raw --v 6
```

**Machi (Sanadora-Chamán)**
```
A Mapuche machi (female shaman-healer) seated on her rewe (ceremonial altar
ladder reaching skyward), holding a kultrun drum that glows with healing
energy. Surrounded by spirit-flames in obsidian and silver. Cosmic but earthy.
Sacred dignity. --ar 5:7 --style raw --v 6
```

**Weichafe (Guerrero)**
```
A Mapuche warrior in lightweight obsidian-plated armor, facial paint in
geometric red patterns, wielding a wooden lance with energy-tip. Posture
suggests guerrilla tactics — half-hidden in tactical shadow. --ar 5:7 --style raw --v 6
```

**Lafken-Ñeñ (Espíritu del Mar)**
```
A massive whale-spirit being, half-organic half-stellar, swimming through deep
space waters, geometric Mapuche patterns flowing across its hide like aurora.
Ancient, oceanic, vast. Lafken-ñeñ is the spirit of the sea in Mapuche
cosmology. --ar 5:7 --style raw --v 6
```

**Kultrun Cósmico**
```
A massive ceremonial kultrun drum floating in space, its drum-head a window
into another dimension showing star-patterns and ancestral spirits.
Geometric Mapuche markings on its rim glow with stored Newen energy. Sacred
artifact made cosmic. --ar 5:7 --style raw --v 6
```

---

## 5. Environment / Background Art

### Sector Estelar (mapa del tablero)
```
Top-down map of a star system with 4 distinct planets, sci-fi UI overlay.
Each planet has its own visual identity: red-orange Mexica world with floating
pyramids, gold-terraced Inca world, blue-and-gold ocean Muisca world, dark
green Mapuche world covered in forests. Background: nebula in violet-cosmic
tones. Style: clean game UI map, not photorealistic. Suitable for in-game
strategy view. --ar 16:9 --style raw --v 6
```

### Mundo Natal Mexica — Tenochtitlan-Sol
```
A Mexica orbital city: floating pyramids interconnected by golden bridges,
floating gardens (chinampas) suspended in zero-gravity, jaguar-statue gates,
red and turquoise decoration, smoking obsidian altars at each pyramid summit.
Backdrop: dying red giant star (5th sun). --ar 21:9 --style raw --v 6
```

### Mundo Natal Inca — Cusco-9
```
An Inca orbital city: stepped golden terraces ascending through the sky,
mountain-temple architecture in low orbit, quipu data-cables streaming between
buildings, condors soaring through the city. Sapa Inca palace at the apex.
Geometric Andean motifs everywhere. --ar 21:9 --style raw --v 6
```

### Mundo Natal Muisca — Guatavita-Prime
```
A Muisca world: ocean-planet whose surface is liquid gold, ceremonial cities
floating on the gold-water like rafts, spires emerging from the depths,
ceremonial pathways made of intertwined emerald roots. Cacique's central
floating temple visible. --ar 21:9 --style raw --v 6
```

### Mundo Natal Mapuche — Wallmapu Prime
```
A Mapuche world: dense araucaria-forest covering rugged terrain, wooden ruka
(traditional dwellings) integrated into the landscape, the volcanic Llaima
mountain in the distance, kultrun-drum-shaped ceremonial structures, river
systems flowing in geometric patterns. Twilight sky. --ar 21:9 --style raw --v 6
```

---

## 6. UI Elements

### Ícono de Newen (keyword Mapuche)
```
Game UI keyword icon for "Newen" (Mapuche spiritual force). Stylized circular
icon: kultrun drum design with radial energy waves emanating outward. Palette:
obsidian black + silver. Flat vector style suitable for HUD. Square aspect.
--ar 1:1 --style raw --v 6
```

### Ícono de Ofrenda (keyword Mexica)
```
Game UI keyword icon for "Ofrenda" (Mexica sacrifice mechanic). Stylized
circular icon: obsidian knife above a sun-disc. Palette: deep red + gold +
black. Flat vector style. --ar 1:1 --style raw --v 6
```

### Ícono de Tributo (keyword Inca)
```
Game UI keyword icon for "Tributo" (Inca tribute mechanic). Stylized circular
icon: pyramid of small offerings ascending toward a central crown. Palette:
gold + red. Flat vector style. --ar 1:1 --style raw --v 6
```

### Ícono de Sumergir (keyword Muisca)
```
Game UI keyword icon for "Sumergir" (Muisca lake-offering mechanic). Stylized
circular icon: ceremonial raft sinking into liquid gold with ripples. Palette:
gold + deep blue. Flat vector style. --ar 1:1 --style raw --v 6
```

---

## 7. Negative Prompts (Lo que evitar)

Anexar a tus prompts:

```
--no generic fantasy, MTG-style, Warcraft-style, dragons, elves, orcs, dwarves,
medieval European, knights, gothic, Tolkien, anime style, cartoon, chibi,
photorealistic faces, modern military, AK-47, neon cyberpunk Tokyo, Star Wars
storm troopers, Fortnite cartoon
```

Esto previene que el modelo derrape hacia los visual-clichés más comunes.

---

## 8. Style Reference Anchors

Si la herramienta soporta style reference (Midjourney `--sref`, Flux LoRA, etc.), pasale referencias visuales. Sugerencias de obras públicas que capturan el feel:

- **Pixar's Coco** — para la fusión moderna-tradicional respetuosa
- **The Road to El Dorado** (DreamWorks) — colorimetría latinoamericana cinematográfica
- **Apocalypto** (cine) — texturas y acción pre-colombina
- **Aztec Codex Borgia / Codex Mendoza** — glyph systems
- **Andean textile patterns** — geometría
- **Octopath Traveler** — illustration meets pixel art aesthetic

---

## 9. Workflow recomendado

1. **Día 1-2**: 50-100 generaciones de mood board general (sin commitments). Curá las 10-15 que mejor capturan el feel.
2. **Día 3-4**: Frames por facción (4 prompts × 5 variantes cada uno = 20 imágenes). Elegí el frame ganador por facción.
3. **Día 5-7**: Hero cards (5 por facción × 3 variantes = 60 imágenes). Curá las 20 best.
4. **Día 8**: Environments (4 mundos natales + sector estelar = 5 piezas × 3 variantes = 15 imágenes).
5. **Día 9**: UI icons (keywords, currencies, rarezas).
6. **Día 10**: Consolidar en pack visual completo. Backup en `/opt/sexto-sol/internal-art/` (git-ignored).

---

## 10. Crítica importante para Daniel

**Prompts no son arte.** Por más detallados, la AI va a generar cosas que se sienten "MJ-default" — composición central, lighting genérico, falta de coherencia entre cards. Esto es OK para placeholder pero MUY visible al ojo entrenado.

**El verdadero valor del placeholder AI** no es "casi-arte-real", es: **te permite probar el frame layout con imágenes que no son rectángulos blancos**. Eso ayuda a debuggear UI, animaciones, balance de carta-vs-fondo. Después de probar mecánicas con 20-50 testers en beta cerrada, vas a contratar artistas humanos para REEMPLAZAR todo. NO para "iterar sobre el placeholder".

**Riesgo de filtrado**: si screenshots del juego con AI art se filtran a redes (testers compartiendo capturas), el daño reputacional es inmediato. Por eso:
- Marca al beta tester con TOS clara: "no compartir capturas"
- Watermark sutil en builds de beta interna
- Plan de "art replacement deadline" antes de cualquier release público

---

*Última actualización: 2026-05-08. Doc vivo. Cuando se reemplace el AI art con artistas humanos, este archivo se mueve a `docs/specs/shipped/` con commit que documenta el cambio.*
