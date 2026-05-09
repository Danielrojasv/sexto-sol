# Q'ralan — Sprite Sheet Prompt

**Grid:** 4 × 3 = 12 slots. 11 cartas Q'ralan + 1 placeholder.
**Slot:** 512×768 px. **Sheet:** 2048×2304 px. **Format:** PNG fondo neutro oscuro azul-noche cósmica.

---

## Style guide (Q'ralan)

> Sci-fi imperial solar. **Ciudadelas flotantes y naves-templo monumentales** orbitando un astro central. Arquitectura monumental jerárquica: cascos de **piedra dorada labrada con líneas geométricas precisas** (escalinatas, terrazas, glifos solares estilizados), **cristales de luz solar incrustados** que sirven de núcleo energético. Paleta: **dorado bruñido** (#C8A55B, #D4B86E), **piedra ámbar oscura** (#5A4220), **negro azabache pulido** (#0F0E0D), acentos de **luz solar incandescente** (#F4D170 → #FFFFFF blanca radiante). Fondo: **espacio iluminado por estrella naranja-dorada masiva** con halos de polvo cósmico, líneas de fuerza orbitales sutiles. Mood: solemne, jerárquico, monumental, eterno. Cada nave irradia "está bajo orden cósmica", luz emanando del interior del casco hacia afuera.

Sin texto. Sin marcos. Cada carta vista en 3/4, ángulo majestuoso desde abajo (worm's-eye perspective) que enfatiza tamaño y autoridad.

---

## Slots

### Fila 1

**(1,1) Q'illay del Hangar Solar** — Nave-cazador dorada despegando, casco labrado con motivos geométricos, una llama-cristal solar en el núcleo, estela de luz dorada saliendo del hangar parental visible al fondo (escalinatas orbitales).

**(1,2) Vigía del Sumaq-suyu** — Nave centinela de tamaño pequeño, casco circular tipo escudo solar, dos cristales-ojo en proa, postura defensiva flotando frente a una ciudadela orbital de fondo.

**(1,3) Escolta T'awa-pampa** — Cuatro naves idénticas en formación cuadrada perfecta (tipo flecha), todas pequeñas, doradas, sincronía visual obvia, líneas geométricas conectándolas como mandala viviente.

**(1,4) Q'aphaq del Cristal Orbital** — Nave mediana con un cristal solar masivo embebido en el centro del casco, irradiando luz blanca-dorada hacia afuera, otras siluetas de naves Q'ralan visibles en la distancia recibiendo el resplandor.

### Fila 2

**(2,1) Mit'a-wasi Coordinador** — Nave-templo mediana con cabina central tipo torre escalonada, antenas-cetro doradas extendiéndose, irradia ondas concéntricas que conectan a múltiples naves más pequeñas alrededor (red coordinada).

**(2,2) Phaqcha del Crisol Estelar** — Nave grande con un crisol-cuenco abierto en su superficie superior fundiendo luz solar visible, blindaje grueso de piedra dorada, contornos angulares geométricos, postura "mientras más naves, más resiliente".

**(2,3) Resonancia del Sumaq-Cristal** — Tecnología (no nave): un nodo de cristal solar central flotando, con seis prismas más chicos orbitándolo en formación hexagonal, ondas armónicas doradas resonando entre todos. Sin nave; el campo de cristales es el sujeto.

**(2,4) Inka-untay Tutelar** — **Legendaria.** Nave-templo colosal majestuosa, escalinatas cósmicas labradas en el fuselaje, núcleo solar enorme central irradiando como pequeño sol, escuadrones miniatura visibles bajo su sombra, halo divino de polvo dorado, máxima autoridad. Pieza monumental de la grilla.

### Fila 3

**(3,1) Lanza Solar K'iri** — Arma equipable: lanza-haz de cristal solar puro (no metal), montada en el casco de una nave Q'ralan parcialmente visible al borde. La lanza es el sujeto, 80% del slot, brilla con luz blanca-dorada cegadora.

**(3,2) Templo K'ana-suyu** — Reliquia (no nave): ciudadela monumental anclada literalmente en la superficie de un planeta visible debajo, terrazas escalonadas doradas elevándose al espacio, irradia luz que ilumina naves-hermana cruzando su órbita visible en el fondo.

**(3,3) Centinela Pétreo** _(carta smoke test)_ — Nave guardiana mediana, casco de piedra ámbar oscura sólido, dos cristales-ojo simétricos en proa, postura estática vigilante, una pequeña estela de polvo dorado debajo.

**(3,4)** _Slot vacío / placeholder_ — fondo de espacio dorado-bruñido con halos sutiles, sin nave.

---

## Prompt unificado para image generator

> Render a 4×3 grid sprite sheet of 12 portrait card-art slots (each 512×768 px, total 2048×2304 px), depicting alien spacecraft of the Q'ralan — an imperial solar spacefaring race. Their tech: floating citadels and temple-ships of carved golden stone with precise geometric lines (cosmic stairways, terraces, stylized solar glyphs), solar crystals embedded as energy cores. Color palette: burnished gold (#C8A55B, #D4B86E), dark amber stone (#5A4220), polished obsidian black (#0F0E0D), incandescent solar light (#F4D170 to #FFFFFF). Backdrop: space lit by a massive orange-gold star with cosmic dust halos, subtle orbital force-lines. Each ship in 3/4 perspective, slight worm's-eye angle emphasizing scale and authority. Mood: solemn, hierarchical, monumental, eternal — each ship radiates "under cosmic order," light emanating outward from within. No text, no UI, no card frames.
>
> (1,1) Golden hunter-ship taking off, hull engraved with geometric motifs, solar crystal core flame, golden trail leaving parental hangar (orbital stairways) visible behind. (1,2) Small sentinel ship, circular solar-shield hull, two crystal-eye prows, defensive pose against orbital citadel backdrop. (1,3) Four identical ships in perfect square formation (arrow-like), all small, golden, geometric lines connecting them as living mandala. (1,4) Mid-size ship with massive solar crystal embedded centrally in hull, radiating white-gold light outward, other Q'ralan ship silhouettes in distance receiving the glow. (2,1) Mid-temple-ship with central tiered tower cabin, golden scepter-antennas extending, radiating concentric waves connecting smaller ships around it (coordinated network). (2,2) Large ship with open crucible-bowl on upper surface visibly fusing solar light, thick golden stone armor, angular geometric contours. (2,3) Floating ritual node — central solar crystal surrounded by six smaller orbiting prisms in hexagonal formation, golden harmonic waves resonating; no ship. (2,4) **Legendary** colossal majestic temple-ship, cosmic stairways carved in fuselage, enormous central solar core radiating like miniature sun, miniature escort fleet visible below, golden divine dust halo — most monumental piece. (3,1) Equipable weapon: pure solar crystal lance (not metal) mounted on partially-visible Q'ralan ship at slot edge — lance is 80% of slot, blinding white-gold glow. (3,2) Floating relic citadel monumentally anchored on a visible planet surface below, golden tiered terraces rising to space, light illuminating sister ships crossing its orbit in background. (3,3) Mid-size guardian ship, solid dark-amber stone hull, two symmetric crystal-eye prows, static vigilant pose, faint golden-dust trail beneath. (3,4) Empty slot — burnished gold space with subtle halos, no ship.
>
> Style: cinematic concept art, painterly, monumental scale, color-graded warm gold tones, no text, no logos, no humans.

---

_Aspect ratio: 8:9 al image-gen para que la grilla entre completa._
