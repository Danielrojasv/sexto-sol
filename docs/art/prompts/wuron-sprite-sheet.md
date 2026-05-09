# Würon — Sprite Sheet Prompt

**Grid:** 4 columnas × 3 filas = 12 slots. 11 cartas Würon + 1 slot vacío (placeholder).
**Slot dimensions:** 512×768 px (cada carta — ratio 5:7 portrait).
**Total sheet:** 2048 × 2304 px.
**Format:** PNG con transparency opcional / fondo neutro oscuro #0E1614.

---

## Style guide unificado (Würon)

> Sci-fi tribal-orgánico. Naves-organismos crecidas (no construidas) navegando un sistema estelar. Cada nave es una **fusión de biotecnología simbiótica** — cascos vegetales fosilizados, motores que respiran como hongos bioluminiscentes, raíces estelares colgando del fuselaje. La paleta domina **verde profundo musgoso** (#1F3A2A, #2D5A3D), **café-bronce de raíz** (#5C3A1F), **acentos turquesa-glow** de bio-luz (#3DD9C5), **negro espacial profundo** (#0A0E0F) como fondo. Iluminación: punto de luz cálido fragmentado, niebla atmosférica volumétrica. Cada nave en su slot, vista en 3/4 lateral, ligero ángulo aéreo, contra fondo de **nebulosa verde profunda con raíces estelares** trenzadas en el espacio.

Sin texto en la imagen. Sin marcos. Cada carta ocupa su slot completo. Mood: tragic resilience, ancestral, heavy.

---

## Slots (de izquierda a derecha, fila por fila)

### Fila 1

**(1,1) Brotador Trülke** — Pequeña nave-cuerpo orgánico, casco de corteza joven brotando ramificaciones de raíz, motor único pulsante turquesa, una grieta en el casco con savia bioluminiscente brotando. Costo bajo, frágil pero crece.

**(1,2) Lhüpang del Río** — Nave fluvial-cósmica, casco alargado curvo como balsa estelar, vetas de río luminoso recorriendo el fuselaje, dos motores gemelos que dejan estela líquido-celeste, raíces colgantes goteando luz.

**(1,3) Cuchilla Lhüf** — Arma equipable: hoja-raíz fosilizada gigante, mineralizada, montada como apéndice externo en una nave fragmentaria visible al borde. La hoja es el sujeto principal, ocupa 80% del slot.

**(1,4) Mañke Cazador** — Nave depredadora silenciosa, perfil bajo aerodinámico vegetal, ojos-sensores ámbar incandescentes en la proa, alas-membranosas semitransparentes como follaje espacial, postura de acecho.

### Fila 2

**(2,1) Wütrüpang Resistente** — Nave-tronco macizo, casco como tronco viejo de árbol cósmico con corteza gruesa fosilizada, motores embebidos en nudos de raíz, escudo orgánico visible al frente (Bastión).

**(2,2) Ñgepang del Sur** — Nave de combate frontal, perfil agresivo pero anclado, mástil-raíz vertical posterior con bio-luz ascendente, cañón frontal único de cristal-savia, pintura de guerra orgánica en el casco.

**(2,3) Susurro del Bosque** — Tecnología (no nave): un objeto ritual flotante en el espacio — esfera de cristal hueca con un brote interno bioluminiscente que irradia ondas concéntricas verde-turquesa al cosmos. Sin nave; el efecto es el sujeto.

**(2,4) Raíz Ancestral** — Nave-matriarca, gigantesca, casco totalmente fosilizado, raíces masivas extendiéndose al espacio circundante, núcleo central pulsante turquesa profundo, escudo orgánico denso (Bastión).

### Fila 3

**(3,1) Bosque del Eco** — Reliquia (no nave): un fragmento de planeta-bosque flotando en el cosmos, con árboles vivos creciendo en perpendicular al eje, ecos lumínicos verdes ondulando entre las copas. Sin nave; el bioma flotante es el sujeto.

**(3,2) Lhwentrü de las Raíces** — **Legendaria.** Nave colosal majestuosa, el "árbol más viejo del sur" — fuselaje arborescente de proporciones catedralicias, raíces estelares gigantescas orbitando, núcleo central de luz dorada-verdosa intensa, atmosfera de aura ancestral, halo bioluminiscente. La pieza más imponente de la grilla.

**(3,3) Explorador del Brote** _(carta inicial smoke test)_ — Nave exploradora chica-mediana, casco con brotes nuevos asomándose por las costuras, dos pequeños drones-semilla orbitando alrededor, postura de avanzada en territorio desconocido.

**(3,4)** _Slot vacío / placeholder_ — fondo de nebulosa verde profunda, sin nave, simplemente el cosmos Würon. Permite que slots futuros se ensamblen sin regenerar.

---

## Prompt unificado para image generator (Midjourney / DALL·E 3 / Stable Diffusion XL)

> Render a 4×3 grid sprite sheet of 12 portrait card-art slots (each slot 512×768 px, total 2048×2304 px), depicting alien spacecraft of the Würon — a tribal-organic spacefaring race. Each ship is a living biotechnological organism grown rather than built: hulls of fossilized bark, engines that breathe like bioluminescent fungi, dangling stellar roots, glowing turquoise sap-veins. Color palette: deep mossy greens (#1F3A2A, #2D5A3D), bronze-root browns (#5C3A1F), turquoise bioluminescent accents (#3DD9C5), deep space black (#0A0E0F). Each ship rendered in 3/4 perspective from slight aerial angle, against a backdrop of **deep green nebula with stellar roots woven through the void**. Volumetric atmospheric mist, fragmented warm point-light. Mood: tragic resilience, ancestral, heavy. No text, no UI, no card frames. Each slot's content listed below — render each in its position:
>
> (1,1) Small organic ship, sapling bark hull, single pulsing turquoise engine, sap-light leaking from a hull crack. (1,2) Long curved riverine vessel, river-light veins in fuselage, twin trailing engines leaving liquid-celeste wake, dripping roots. (1,3) Massive fossilized root-blade weapon mounted as external appendage on a partially-visible ship — blade is 80% of slot. (1,4) Predatory silent ship, low aerodynamic vegetal profile, amber sensor eyes, translucent membrane-wings like spatial foliage, stalking pose. (2,1) Trunk-bodied warship, thick fossilized bark hull, engines embedded in root-knots, visible organic frontal shield. (2,2) Aggressive combat ship anchored by vertical rear root-mast with rising bioluminescence, single sap-crystal frontal cannon, organic war-paint. (2,3) Floating ritual object — hollow crystal sphere containing internal luminous sprout radiating concentric green-turquoise waves; no ship. (2,4) Gigantic matriarch ship, fully fossilized hull, massive stellar roots extending outward, deep turquoise pulsing core, dense organic shield. (3,1) Floating planet-forest fragment with trees growing perpendicular to axis, green light-echoes rippling between canopies; no ship. (3,2) **Legendary** colossal cathedral-proportioned arborescent ship, gigantic stellar roots in orbit, intense golden-greenish core, ancestral aura halo — the most imposing piece. (3,3) Small-medium scout ship with new sprouts pushing through hull seams, two seed-drones orbiting. (3,4) Empty slot — pure deep green nebula, no ship.
>
> Style: cinematic concept art, painterly, dense detail, color-graded, no text, no logos, no human figures.

---

_Ratio aspecto recomendado al image-gen: 8:9 (close to square) para que la grilla 4×3 entre completa._
