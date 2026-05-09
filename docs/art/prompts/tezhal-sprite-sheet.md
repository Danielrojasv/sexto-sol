# Tezhal — Sprite Sheet Prompt

**Grid:** 4 × 3 = 12 slots. 10 cartas Tezhal + 2 placeholders.
**Slot:** 512×768 px. **Sheet:** 2048×2304 px. **Format:** PNG fondo neutro rojo-noche.

---

## Style guide (Tezhal)

> Sci-fi ritualista de sacrificio. **Naves se mueven porque alguien decidió no hacer otra cosa con su tonalli** — combustible psíquico ofrendado voluntariamente. Cascos de **obsidiana negra brillante** con **vetas de fuego ritual** rojo-naranja brillando desde dentro como si estuvieran al rojo vivo, **plumajes ceremoniales** colgando del fuselaje (no orgánicos — más bien capas/banderas rituales que se mueven solas), **espejos-pirámide de obsidiana orbitales** que capturan luz solar y la canalizan por ritual. Paleta: **negro obsidiana** (#0B0A0C), **rojo sangre cósmica** (#9B1B1B, #C24E1B), **naranja brasa** (#E27D2F), **dorado ritual atenuado** (#A88634), **detalles plumaje turquesa-jaguar** (#3D8A8B). Fondo: **espacio rojo-noche con polvo cósmico ardiendo**, una estrella moribunda visible al horizonte. Mood: intenso, voluntario, sagrado pero violento, fuego que se ofrenda.

Sin texto. Sin marcos. Cada nave en 3/4, ángulo dramático con iluminación lateral fuerte que crea contraste obsidiana ↔ brasa.

---

## Slots

### Fila 1

**(1,1) Brasa Tlani** — Nave pequeña encendida, casco de obsidiana con grietas-fuego visibles, motor único pulsando rojo-incandescente, plumas-ritual chamuscadas colgando, pose de "ofrenda saltando del hangar".

**(1,2) Iniciado Xocotzin** — Nave de novicio, más pequeña, casco menos labrado pero con un solo glifo de fuego central destacado, postura tímida pero decidida, una pluma ceremonial corta colgando.

**(1,3) Piloto de Obsidiana** — Vista cercana de una cabina-cápsula de obsidiana brillante con plumaje de tezontli rojo-marrón rodeándola, daga ritual integrada al casco visible al frente, ángulo más íntimo que las otras naves.

**(1,4) Hangar de Tlapetl** — Nave-nodriza grande, hangar abierto en un costado del casco con una nave hermana asomando por la apertura ardiendo (ofrendándose), llamas rituales saliendo del hangar al espacio.

### Fila 2

**(2,1) Espejo-Pirámide Tzactli** — Nave con espejos-pirámide orbitales (3-4) flotando alrededor del casco principal en formación, cada espejo refleja y enfoca luz solar amarillo-naranja de vuelta a la proa de la nave, sinergia ritual visible.

**(2,2) Ofrenda del Cuauhtli** — Tecnología (no nave): una nave fantasma medio-disuelta en órbita, "convirtiéndose en humo", el humo del casco se eleva en forma de águila estilizada hacia un hangar lejano. Sin nave principal; el momento de la ofrenda es el sujeto.

**(2,3) Navío Tlanixtli** — Nave de combate grande, casco musculoso de obsidiana, cañones rituales múltiples (3-4) en proa cargando luz roja-naranja, plumajes laterales prominentes, postura agresiva.

**(2,4) Obsidiana Ardiente** — Arma equipable: hoja-filo de obsidiana ritual sostenida en el casco de una nave parcialmente visible al borde. La hoja brilla rojo-incandescente desde dentro, plumas pequeñas decorativas en la empuñadura del casco. Hoja es 80% del slot.

### Fila 3

**(3,1) Pirámide Orbital Quetlani** — Reliquia (no nave): pirámide-espejo escalonada de obsidiana orbitando un planeta visible debajo, sus caras reflejan visiones de naves caídas (siluetas fantasmagóricas), humo ritual asciende desde la cúspide al cosmos. Sin nave; pirámide es el sujeto.

**(3,2) Xolot Cuauhtli Ardiente** — **Legendaria.** Nave colosal en forma de águila-pirámide, casco labrado en pirámide-espejo gigante, plumajes masivos rojos-dorados extendiéndose como alas, cañones rituales múltiples visibles, núcleo central que ARDE intensamente, atmosfera de aura de dios-guerrero, halo rojo-dorado. Pieza más imponente.

**(3,3)** _Slot vacío / placeholder_ — fondo de espacio rojo-noche con polvo ardiente, sin nave.

**(3,4)** _Slot vacío / placeholder_ — mismo fondo.

---

## Prompt unificado para image generator

> Render a 4×3 grid sprite sheet of 12 portrait card-art slots (each 512×768 px, total 2048×2304 px), depicting alien spacecraft of the Tezhal — a ritual-sacrifice spacefaring race. **Their ships move because someone offered their tonalli (psychic fuel) voluntarily.** Hulls of glossy black obsidian with ritual-fire veins glowing red-orange from within (as if red-hot internally), ceremonial plumage hanging from the fuselage (not organic — more like ritual cloaks/banners moving on their own), orbital obsidian step-pyramid mirrors that capture solar light and channel it through rite. Color palette: obsidian black (#0B0A0C), cosmic blood red (#9B1B1B, #C24E1B), ember orange (#E27D2F), muted ritual gold (#A88634), turquoise-jaguar plumage detail (#3D8A8B). Backdrop: red-night space with burning cosmic dust, a dying star at horizon. Each ship in 3/4 perspective, dramatic side lighting creating obsidian↔ember contrast. Mood: intense, voluntary, sacred-but-violent, fire offered. No text, no UI, no card frames.
>
> (1,1) Small ignited ship, obsidian hull with visible fire-cracks, single engine pulsing red-incandescent, charred ritual feathers hanging, pose of "offering leaping from hangar." (1,2) Smaller novice ship, less carved hull but a single prominent central fire-glyph, timid-yet-determined pose, one short ceremonial feather. (1,3) Close view of an obsidian capsule-cockpit surrounded by red-brown tezontli plumage, ritual dagger integrated into hull at front, more intimate angle. (1,4) Large mother-ship, side-hangar open with a sister ship visibly burning as it leaves (offering itself), ritual flames spilling into space. (2,1) Mid-ship with 3-4 orbital pyramid-mirrors floating around main hull in formation, each mirror reflects and focuses yellow-orange solar light back to the ship's prow, ritual synergy visible. (2,2) Floating ghost-ship half-dissolving in orbit, "turning to smoke," hull-smoke rises in stylized eagle-shape toward distant hangar; no main ship. (2,3) Large combat ship, muscular obsidian hull, multiple ritual cannons (3-4) on prow charging red-orange light, prominent lateral plumage, aggressive pose. (2,4) Equipable weapon: ritual obsidian blade held by partially-visible ship at slot edge — blade glows red-incandescent from within, small decorative feathers on hull's grip; blade is 80% of slot. (3,1) Floating relic stepped pyramid-mirror of obsidian orbiting a visible planet below, its faces reflect ghostly silhouettes of fallen ships, ritual smoke rising from apex into cosmos; no ship. (3,2) **Legendary** colossal eagle-pyramid-shaped ship, hull carved as giant pyramid-mirror, massive red-gold plumage extending like wings, multiple visible ritual cannons, intensely BURNING central core, war-god aura, red-gold halo — most imposing piece. (3,3) Empty slot — red-night space with burning dust, no ship. (3,4) Empty slot — same.
>
> Style: cinematic concept art, painterly, dramatic chiaroscuro, color-graded red/black/gold, no text, no logos, no humans.

---

_Aspect ratio: 8:9 al image-gen._
