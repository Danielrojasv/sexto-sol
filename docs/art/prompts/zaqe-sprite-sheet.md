# Zaqe — Sprite Sheet Prompt

**Grid:** 4 × 3 = 12 slots. 10 cartas Zaqe + 2 placeholders.
**Slot:** 512×768 px. **Sheet:** 2048×2304 px. **Format:** PNG fondo agua-luz cósmica.

---

## Style guide (Zaqe)

> Sci-fi contemplativo-comercial. **Balsas-nave que navegan "lagos de luz" — anomalías energéticas estelares.** Cascos de **oro líquido** que parece moverse como mercurio iridiscente, **superficies-espejo** reflejando el cosmos, **cuerpos pintados** con motivos rituales acuáticos, balsas ceremoniales con flotabilidad imposible. Paleta: **dorado iridiscente** (#D4B454, #F1D36C), **azul-turquesa de agua estelar** (#2E5A85, #4FA6C9), **violeta-lago profundo** (#3A2D5A), **blanco-luz líquida** (#FFFFFF con glow turquesa), acentos **cobre-balsa** (#A86A3A). Fondo: **lago de luz cósmico** — anomalía energética con olas concéntricas blanco-turquesa, espejos del cielo reflejándose en sí mismos, partículas doradas suspendidas. Mood: contemplativo, transformador, paciente — como ver agua moverse en gravedad cero.

Sin texto. Sin marcos. Cada balsa-nave en 3/4, suavemente iluminada desde abajo (como si flotara sobre un lago), reflejos múltiples del oro en el agua estelar.

---

## Slots

### Fila 1

**(1,1) Navegante de Sumzhua** — Balsa-nave pequeña tipo canoa estelar, casco de oro iridiscente, dos figuras-pintadas talladas como bajorrelieve en el fuselaje, leve estela de luz líquida turquesa, postura exploradora.

**(1,2) Balsa Áurea** — Balsa-nave mediana, casco de oro líquido más prominente con superficie espejada, simbolos rituales acuáticos grabados, una vela-membrana iridiscente translúcida desplegada, atrás se intuye un lago de luz.

**(1,3) Cuchilla del Espejo Áureo** — Arma equipable: hoja-cuchilla de oro-espejo gigante, mineral líquido solidificado en filo, montada como apéndice en una balsa-nave parcialmente visible al borde. La hoja es el sujeto, 80%, refleja distorsionadamente el cosmos en su superficie.

**(1,4) Guata Iridiscente** — Balsa-nave mediana, casco que CAMBIA de color iridiscente (oro→turquesa→violeta) según el ángulo, dos balsas-escolta más pequeñas alrededor leyendo "el mapa del lago" reflejado en el casco principal, atmosfera mística.

### Fila 2

**(2,1) Inmersión Áurea** — Tecnología (no nave): una balsa-nave fantasma mitad-emergida desde un "lago de luz" cósmico vertical (sí, vertical en el espacio — el lago es una anomalía 3D), gotas de luz líquida cayendo del casco, ondas concéntricas. Sin nave principal completa; el momento de inmersión es el sujeto.

**(2,2) Espejo Estelar Sqhaguata** — Balsa-nave grande con todo el casco superior funcionando como un único gran espejo plano que refleja la batalla del cielo (siluetas de otras naves visibles en el reflejo), proa que apunta hacia abajo a un lago de luz visible debajo.

**(2,3) Hangar de Aguas Doradas** — Reliquia (no nave): hangar-balsa enorme, estructura semicircular abierta como un cuenco gigante de oro, contiene un mini-lago de luz líquida dentro, naves pequeñas Zaqe entran y emergen del cuenco transformadas. El hangar-cuenco es el sujeto.

**(2,4) Bohzhica del Lago de Luz** — Balsa-buque de vanguardia (rare), casco grande blindado de oro y cobre, escudo-bastión visible al frente, ya parcialmente sumergido en un lago de luz cósmico que cubre la base de la nave, postura "de hundirse a transmutarse".

### Fila 3

**(3,1) Sqhanguata Reliquia Solar** — Balsa-templo flotante con espejos solares colgantes alrededor del casco (4-5 espejos), cuerpo de la nave alargado, transmuta luz visible (rayos amarillo-dorados entrando, rayos turquesa-líquidos saliendo).

**(3,2) Sumzhua del Sexto Sol** — **Legendaria.** Nave-balsa colosal arquetípica, casco de oro líquido con ondas pintadas en relieve dinámico, superficie completamente espejada por arriba reflejando una "anomalía estelar" enorme, atmosfera de "el último sol antes del Sexto", halo iridiscente. Pieza más imponente.

**(3,3)** _Slot vacío / placeholder_ — fondo de lago de luz cósmico con olas concéntricas, sin nave.

**(3,4)** _Slot vacío / placeholder_ — mismo fondo.

---

## Prompt unificado para image generator

> Render a 4×3 grid sprite sheet of 12 portrait card-art slots (each 512×768 px, total 2048×2304 px), depicting alien spacecraft of the Zaqe — a contemplative-commercial spacefaring race. **They sail "light-lakes" — stellar energetic anomalies — on raft-ships.** Hulls of liquid gold that flows like iridescent mercury, mirror-surfaces reflecting the cosmos, painted bodies with aquatic ritual motifs, ceremonial rafts with impossible buoyancy. Color palette: iridescent gold (#D4B454, #F1D36C), turquoise stellar-water blue (#2E5A85, #4FA6C9), deep-lake violet (#3A2D5A), liquid white-light (#FFFFFF with turquoise glow), copper-raft accents (#A86A3A). Backdrop: cosmic light-lake — energetic anomaly with concentric white-turquoise waves, sky-mirrors reflecting themselves, suspended golden particles. Mood: contemplative, transformative, patient — like watching water move in zero-gravity. Each raft-ship in 3/4 perspective, softly lit from below (as if floating on a lake), multiple gold reflections in the stellar water. No text, no UI, no card frames.
>
> (1,1) Small stellar canoe-style raft-ship, iridescent gold hull, two painted-figure bas-reliefs carved in fuselage, faint turquoise liquid-light wake, exploring pose. (1,2) Mid raft-ship, more prominent liquid-gold mirror-surface hull, engraved aquatic ritual symbols, one deployed iridescent translucent membrane-sail, distant light-lake hinted behind. (1,3) Equipable weapon: massive gold-mirror blade, solidified liquid mineral edge, mounted as appendage on partially-visible raft-ship at slot edge — blade is 80%, distortedly reflects cosmos. (1,4) Mid raft-ship, hull SHIFTS iridescent color (gold→turquoise→violet) by angle, two smaller escort rafts around it reading "the lake's map" reflected in main hull, mystic atmosphere. (2,1) Floating tech: phantom raft-ship half-emerging from a vertical cosmic light-lake (yes, vertical in space — the lake is 3D anomaly), liquid-light drops falling from hull, concentric waves; no full main ship. (2,2) Large raft-ship with entire upper hull functioning as single flat mirror reflecting sky-battle (other ship silhouettes visible in reflection), prow pointing downward to visible light-lake below. (2,3) Floating relic huge raft-hangar, semicircular structure open like giant gold bowl, contains mini-light-lake inside, small Zaqe ships enter and emerge transformed; the hangar-bowl is the subject. (2,4) Vanguard armored raft (rare), large gold-and-copper hull, visible bastion-shield at front, already partially submerged in cosmic light-lake covering the ship's base, "sinking to transmute" pose. (3,1) Floating temple-raft with solar mirrors hanging around hull (4-5 mirrors), elongated body, transmutes visible light (yellow-gold rays in, turquoise-liquid rays out). (3,2) **Legendary** colossal archetypal raft-ship, liquid-gold hull with dynamic relief-painted waves, fully mirrored top reflecting an enormous "stellar anomaly," atmosphere of "the last sun before the Sixth," iridescent halo — most imposing piece. (3,3) Empty slot — cosmic light-lake with concentric waves, no ship. (3,4) Empty slot — same.
>
> Style: cinematic concept art, painterly, water-cosmos hybrid lighting, color-graded turquoise/gold/violet, no text, no logos, no humans.

---

_Aspect ratio: 8:9 al image-gen._
