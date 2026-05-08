# Sexto Sol — Spec maestra de diseño v0

**Status:** in-progress (vivo)
**Owner:** Daniel
**Created:** 2026-05-08
**Related specs:** —

> Esta es la spec viva del diseño del juego. Iteramos directamente sobre este archivo durante toda la fase de pre-código. Cuando el set base esté lockeado y producción arranque, partes se moverán a sub-specs (mecánicas por facción, balance, etc.).

---

## Why

Daniel quiere construir un CCG (Collectible Card Game) PVP que resuelva problemas concretos que tiene **Mitos y Leyendas (myl)** — un juego que conoce a fondo y le sirve como referencia técnica y emotiva, pero que tiene defectos de diseño que se han acumulado en 25+ años de iteración.

**Problemas de myl que Sexto Sol resuelve:**

1. **Falta de balance entre razas/facciones**: en myl, cuando aparece una raza meta, todos juegan esa raza. No hay counter dinámico. Pokemon y MTG resuelven esto con un sistema de tipos/colores donde siempre hay un counter para cada raza meta.
2. **Tema saturado**: myl cubre mitos&leyendas universales y se siente derivativo de MTG. El espacio "mitos&leyendas occidentales" está saturado en CCGs.
3. **Mana lineal automático**: el +1 mana automático cada turno (estilo MTG) es la firma del género; quien lo tiene no se diferencia.

**Decisiones derivadas:**
- Counter wheel **anclado a hechos históricos reales** (Mapuche resistió a Inca → Mapuche cuenta como counter de Inca en el juego). Esto hace al balance único y narrativamente sólido.
- **Re-imaginación sci-fi de civilizaciones pre-colombinas** — espacio inexplorado en CCGs.
- **Energía territorial**: el recurso depende de los planetas que controlás, no sube por defecto. Une recurso y posición espacial en una sola decisión.

**Sin este diseño** vos seguirías con myl (un juego genial pero ajeno, sin posibilidad de monetización legítima por la IP), o construirías "otro CCG genérico" sin diferenciación.

---

## Goals

### Diseño
- [ ] Set base con 4 facciones balanceadas (Mexica, Inca, Muisca, Mapuche) y counter wheel funcional
- [ ] Counter wheel anclado a hecho histórico (Mapuche > Inca, Batalla del Maule)
- [ ] Mecánica firma única por facción (Newen, Ofrenda, Tributo, Sumergir)
- [ ] Energía territorial como diferenciador del mana automático
- [ ] 3 Edades narrativas como arco de partida (no rounds)
- [ ] Win condition vía destrucción del mundo natal (HP 20)

### Producto
- [ ] Soft P2W estilo Marvel Snap (F2P competitivo viable)
- [ ] Sin rotación tipo Standard (cartas balanceadas vía nerfs/buffs)
- [ ] Coleccionable con sobres + crafting con polvo
- [ ] Battle pass + cosméticos como subsidio del F2P
- [ ] Localización vinculada a expansiones culturales (portugués → Tupi-Guaraní)

### Técnico
- [ ] Engine event-driven con reducer puro (port del kernel `myl-game`)
- [ ] RNG seedable + replay determinista
- [ ] Property tests (fast-check) sobre invariantes del juego
- [ ] Cobertura mínima 80% global, 90% engine puro

---

## Non-goals / Out of scope

- ✗ **MTG-tier P2W** — no singles market, no cartas individuales en venta directa
- ✗ **Rotación tipo Standard** — las cartas no caducan
- ✗ **Mana lineal automático** — no copiamos la firma de MTG/Hearthstone/LoR
- ✗ **Apropiación cultural directa** — no copiar glifos sagrados ni nombres de deidades vivas todavía-veneradas sin contexto/consultoría
- ✗ **PVE puro** (modo run de Slay the Spire) — el juego es PVP first; modo single-player puede venir después como entrenamiento contra IA
- ✗ **Esperar 100% de claridad antes de codear** — la spec se itera mientras se prototipa

---

## Pilares de diseño (no negociables)

1. **PVP** (jugador vs jugador, decisión async vs realtime TBD)
2. **Coleccionable** (sobres + crafting, sin singles market)
3. **Soft P2W** estilo Marvel Snap / Legends of Runeterra
4. **Balance histórico**: counter wheel respeta hechos reales, no teoría TCG estándar
5. **Energía territorial** (no mana automático)
6. **Espacial**: tablero es sistema estelar con planetas
7. **Sin rotación**: nerfs/buffs en lugar de descartar cartas viejas

---

## Tema y narrativa

> **Autoridad narrativa:** El arco del jugador trans-expansiones está documentado en `docs/lore/arco-del-jugador.md` (v1.0, 2026-05-08). Ese doc es la biblia narrativa: 5 etapas de descubrimiento (Set base → Mini 1.1 → Mini 1.2 → Mini 1.3 → Edición 2+), 6 reglas transversales inviolables, 5 filtros de validación obligatorios para toda decisión narrativa futura. Todo flavor text, cinemática, evento, carta legendaria, mecánica narrativa o expansión debe chequearse contra ese documento. Esta sección de design-v0 captura el resumen del worldbuilding superficial (Etapa 1 — set base); las capas profundas viven en el arco.

### Premisa
*"El Quinto Sol está terminando. Las cuatro civilizaciones de los cuatro mundos pelean por quién controlará el Sexto."*

### Worldbuilding
- Las **4 facciones** son **reimaginaciones sci-fi** de civilizaciones pre-colombinas: Mexica, Inca, Muisca, Mapuche.
- Cada civilización **desarrolló su tecnología independientemente en su propio planeta** dentro del mismo sistema estelar. No hubo "ayuda externa" — son aliens entre sí.
- Las cuatro civilizaciones convivieron en aislamiento por siglos. **El Quinto Sol está terminando** (cosmología mexica) y se vuelven a contactar — para pelear por el Sexto.
- La iconografía pre-colombina (textiles, oro, glifos, cosmología) se preserva como **estética visual y filosofía cultural**, pero en armaduras espaciales y naves rituales. Mexica con cascos jaguar bioluminiscentes, naves Mapuche talladas en madera y obsidiana, ciudades flotantes Inca con terrazas en órbita, naves doradas Muisca recubiertas en oro real.

### Subversión del trope colonialista
- Trope que se subvierte: "los aliens visitaron a las civilizaciones pre-colombinas y les enseñaron astronomía/arquitectura porque los humanos sudamericanos no podrían haberlo hecho solos" (Daniken, "Chariots of the Gods").
- La inversión: **las civilizaciones eran avanzadas por mérito propio**. Si hay aliens en el lore (mini-expansión "Las Estrellas Recuerdan"), es porque vinieron a APRENDER, no a enseñar.

### Sensibilidad cultural
La premisa sci-fi reduce el riesgo de apropiación pero no lo elimina. Cuando lleguemos a:
- Arte visual
- Flavor text
- Nombres de cartas en lenguas indígenas (mapuzungun, quechua, náhuatl, muysccubun)

…se consultará con personas y expertos académicos de esas culturas. NO se copian glifos sagrados directos ni nombres de deidades vivas todavía-veneradas sin contexto.

---

## 4 Facciones del set base

### 🌞 Inca — Imperio del Sol

**Anchor cultural:** Tahuantinsuyu (los 4 suyos), terrazas, quipus, Inti (sol), Pachamama, los caminos del Inca, mit'a (sistema de trabajo rotatorio), aclla (mujeres elegidas).

**Archetype:** **Control imperial.** Cartas duraderas, expansión territorial, build-up económico. Te desgasta en el largo plazo.

**Mecánicas firma:**
- **Tributo** — cartas weak alimentan a las strong (representa el sistema mit'a)
- **Mit'a** — acumulación: planetas controlados sinergizán entre sí
- **Acllla** — descuentos en cadena (la próxima carta cuesta -1)

**Lore:** Imperio interestelar con una capital flotante en órbita sobre Cusco-9. Su sistema de mit'a planetario les permite extraer recursos de cada mundo conquistado de forma sostenible. Llegaron al Maule galáctico y se detuvieron al toparse con los Mapuche.

---

### ⚔️ Mexica — Hijos del Quinto Sol

**Anchor cultural:** jaguar/águila warriors, calendario tonalpohualli, Tenochtitlan, Huitzilopochtli, codices, sacrificio para mantener al sol moviéndose.

**Archetype:** **Aggro de sacrificio.** Partidas rápidas, intercambia recursos por poder. Si no remata rápido, pierde.

**Mecánica firma:**
- **Ofrenda** — sacrificás cartas en juego para potenciar la siguiente jugada (refleja la cosmología mexica de sacrificio para mantener el orden cósmico)

**Lore:** Civilización guerrera-ritual cuyo planeta orbita una estrella moribunda. Saben que el Quinto Sol está terminando y creen que sólo a través de ofrendas pueden detenerlo. Su arquitectura de pirámides escalonadas se eleva en órbita como ciudades-templo.

---

### 🪙 Muisca — Guardianes del Dorado

**Anchor cultural:** lago Guatavita, ritual del cacique cubierto en oro, balsas ceremoniales, Bochica, mito de El Dorado, confederación de zipas y zaques.

**Archetype:** **Combo económico.** Acumular oro/recursos para jugadas explosivas que cambian la partida.

**Mecánica firma:**
- **Sumergir** — cartas de oro se "ofrendan al lago", regresan transformadas N turnos después (encaja perfecto con el twist cíclico del juego)

**Lore:** Civilización ritual con un planeta-océano dorado donde sus naves son ofrendadas a las profundidades. Las naves "sumergidas" reaparecen siglos después, transformadas por las profundidades en algo más poderoso.

---

### 🌲 Mapuche — Pueblo de la Tierra

**Anchor cultural:** machi (chamanas), kultrun (tambor sagrado), ngillatun (ceremonia), resistencia ante incas y españoles (400 años), mapuzungun (lengua viva), lof (clan), newen (fuerza espiritual), Wallmapu (tierra del pueblo), Bío-Bío (frontera), Tratado de Quilín (1641, primer tratado europeo con pueblo originario).

**Archetype:** **Midrange resiliente.** Defiende, contraataca, se recupera. NO se rinde.

**Mecánicas firma:**
- **Newen** — cuando una nave Mapuche recibe daño, gana +1 fuerza permanente. La fuerza espiritual se acumula con la adversidad.
- **Lof** — clan auto-sinérgico: 2+ naves Mapuche en el mismo planeta se buffean entre sí, sin necesitar un líder. Refleja la descentralización política mapuche real (no había un "Inca" mapuche que capturar).

**Lore:** Pueblo planetario que ha resistido a TODOS los imperios que han intentado conquistarlo. El Imperio Inca llegó y se detuvo en el Maule galáctico. Los conquistadores cósmicos siguientes también fracasaron. Wallmapu Prime no se rinde — y cada herida la hace más fuerte.

---

## Counter wheel (balance histórico)

```
   Mexica (aggro) ──vence──→ Muisca (combo)
       ↑                           ↓
     vence                       vence
       │                           ↓
    Inca (control) ←──vence── Mapuche (midrange)
                                                  ⭐ HISTORICO
```

- **Mexica > Muisca** — aggro mata combos antes de armarse (Tenochtitlan vs ritual de oro acumulativo)
- **Muisca > Mapuche** — el oro y el ritual penetran donde el combate frontal no logra (Muisca culturalmente influyó hacia el sur)
- **Mapuche > Inca** ⭐ **anchored**: Newen punisha la estrategia de control. Cada removal del Inca alimenta el contraataque mapuche. Histórico: Batalla del Maule.
- **Inca > Mexica** — control imperial supera agresión sostenida (los dos imperios más grandes nunca se enfrentaron en realidad, pero mecánicamente: la disciplina mit'a aguanta el desgaste mexica)

**Matchups cruzados** (no en el cycle, neutral / decididos por skill):
- **Mexica vs Mapuche** — ambos pueblos guerreros, decisión depende de listas/jugador
- **Inca vs Muisca** — Inca expandió hacia Colombia pero nunca chocó directo con Muisca

**Insight de diseño:** el Mapuche > Inca como anchor histórico **fuerza al juego a no ser otro CCG genérico**. La mecánica `Newen` no puede ser opcional, tiene que ser CENTRAL al diseño de la facción Mapuche. Cada removal punishe al jugador de Inca. Es elegante mecánica + narrativamente.

---

## Mecánicas core

### Win condition primaria
**Destruir el mundo natal del oponente** (HP 20).

### Recurso: Energía territorial
- Mundo natal: 1 energía/turno base
- Cada planeta neutral conquistado: +1 energía/turno
- Cada planeta enemigo conquistado: +1 vos, -1 enemigo (decisión doble)
- **NO sube +1 automático cada turno**. Más recurso requiere conquistar territorio.

### Estructura de turno (estilo myl)
1. **Recolección** — generás energía + robás 1 carta
2. **Despliegue** — jugás cartas
3. **Combate** — atacás unidades, planetas neutros, mundo enemigo
4. **Regroup** — reposicionar naves
5. **Vigilia** — habilidades activadas

Cada jugador toma su turno completo (no alternado estilo LoR).

### 3 Edades (arco narrativo, NO rounds)

- **Edad I — "El Despertar"**: 2-3 planetas neutrales. Mundos natales intocables. Mecánicas básicas. ~4-5 turnos.
- **Edad II — "Las Estrellas Recuerdan"**: 1-2 planetas adicionales revelados. Mundos natales atacables. Cartas con `Eco` se activan.
- **Edad III — "El Sexto Sol"**: todos los planetas activos. Combate total.

Las Edades NO resetean state. Son fases del arco. Transición gatillada por turn-counter o evento narrativo.

### Tipos de carta (vocabulario myl recontextualizado)

| Sexto Sol | myl equivalent | Función |
|---|---|---|
| **Nave** | Aliado | Unidad de combate (fuerza/vida) |
| **Arma** | Arma | Equipa una nave aliada |
| **Tecnología** | Talismán | Efecto inmediato + descarte |
| **Reliquia** | Tótem | Efecto pasivo continuo |
| **Evento** | — | Response card en turno enemigo |

---

## Roadmap de ediciones

### Set base — "Sexto Sol" (lanzamiento)
- 4 facciones: Mexica, Inca, Muisca, Mapuche
- ~120-150 cartas
- Refresh visual fuerte. Todo el año se construye lore alrededor.

### Mini 1.1 — "Las Estrellas Recuerdan" (~3 meses)
- Plot reveal: los aliens vinieron a aprender, no a enseñar
- Keyword `Eco` (cartas se repiten en ciclos posteriores)
- ~40-60 cartas

### Mini 1.2 — "Pachacuti" (~6 meses)
- Facción **Maya** entra (astronomía, manipulación temporal)
- Mecánica firma propuesta: `Calendario` (eventos pre-anunciados que dispan en turnos futuros específicos)
- ~40-60 cartas

### Mini 1.3 — "El Quinto Sol" (~9 meses)
- Climax narrativo
- Las civilizaciones deben aliarse o competir por el Sexto Sol
- Keyword `Alianza` (cartas que requieren 2 facciones distintas)

### Edición 2 — "Eclipse" (~12 meses)
- Segunda edición base
- Convergencia
- Posible nueva facción: **Mochica** (sangre/cerámica/místico, archetype TBD)

### Localizaciones que desbloquean facciones
- 🇵🇹/🇧🇷 Lanzamiento portugués → **Tupi-Guaraní** (selva/swarm)
- 🇮🇹/🇪🇸 Lanzamiento europeo → **Olmecas** (lore "ancient mystery")
- 🇨🇴/🇻🇪 Lanzamiento norte sudamericano → profundización **Tairona** (oro/economía)
- 🇨🇱 Edición especial → **Selk'nam** (austral, Tierra del Fuego)

### Cadencia
- 1 set base por año (~120-150 cartas)
- 3 mini-expansiones por año (~40-60 cartas cada una)
- Total: ~250-330 cartas/año
- Sostenible para equipo indie (1-2 personas full + freelance art)

### Sin rotación
Estilo Marvel Snap: las cartas NO caducan. El meta se mantiene fresco vía balance patches (nerfs/buffs). Esto cumple el pilar "soft P2W" — no fuerza compras nuevas para mantenerse competitivo.

---

## Monetización: Pase del Sol + boosters + crafting + bundles

**Filosofía rectora:** soft P2W estilo Legends of Runeterra (best in class del mercado). El que paga obtiene **MÁS RÁPIDO** la misma colección que un F2P consigue eventualmente. **NO obtiene cartas exclusivas competitivas.** Cualquier "exclusiva del mes/temporada" es SIEMPRE cosmética (variantes art, finishers, frames, avatares). Si una sola carta exclusiva del Pase rompe meta, se pierde el principio.

Referencias positivas: Marvel Snap, Legends of Runeterra (especialmente LoR), Pokémon Pocket.
Anti-referencias: MTG paper, Pokémon TCG paper, Yu-Gi-Oh paper (P2W brutal), Hearthstone (medium-P2W por ausencia de pity timer).

### Tres monedas

| Moneda | Cómo se obtiene | Para qué |
|---|---|---|
| 🪙 **Oro** | Quests, victorias, ranked. NUNCA con plata. | Comprar sobres, daily packs |
| 💨 **Polvo** | Desencantar cartas duplicadas | Crafting target de cartas específicas (anti-RNG) |
| 💎 **Cristales** | Plata real (microtransacciones) | Cosméticos, battle pass, bundles. **NO compra cartas individuales (no singles market)** |

### Sobres (boosters)

- **5 cartas por sobre**, 1 garantizada Rara+
- Costo: **150 Oro** (~3-4 partidas) **O $1.99 USD real** (cualquiera de los dos paths)
- 4 rarezas con probabilidades anchored en Hearthstone:
  - Común 70%
  - Rara 22%
  - Épica 5%
  - Legendaria 3%
- **Pity timer** (anti-mala-suerte):
  - F2P: cada 10 sobres garantiza Épica+; cada 30 sobres garantiza Legendaria
  - Suscriptor del Pase del Sol: cada 8 sobres garantiza Épica+; cada 25 sobres garantiza Legendaria
- **Sobres temáticos** (en lanzamiento de expansión): "Sobre del Sexto Sol" / "Sobre Mexica" filtra cartas de esa expansión/facción específica.

### Pase del Sol (suscripción mensual)

**$9.99 USD/mes** o **$24.99 quarterly = $7.99/mes** (commit de 3 meses)

**Beneficios pasivos** (todos los días, durante la suscripción activa):
- **+25% Oro** en todas las victorias (jugás 5 partidas → 60 Oro vs 50 Oro F2P)
- **+1 sobre garantizado/día** (vs free track: 1 sobre cada 3 días)
- **Daily quest bonus**: +50 Oro extra al completar quests del día
- **Pity timer mejorado**: 8 sobres → Épica+ (vs 10 F2P)

**Track premium del battle pass** (~50 niveles a lo largo del mes):
- ~6-8 sobres premium adicionales
- ~3-5 cartas garantizadas (mix de rarezas, algunas exclusivas-de-temporada — **cosmética flair-only**, NO cards exclusivas que rompan balance)
- Polvo bonus (~500-1000 polvo/temporada)
- Avatar + título exclusivo
- 1 variante de carta exclusiva del mes (cosmética)

**Track free** (lo que un F2P recibe igual cada mes):
- ~3-5 sobres a lo largo del mes vía progresión
- ~2 cartas garantizadas
- Avatar genérico de la temporada

**Hook de bienvenida**: primer mes gratis o $4.99 promo (conversión típica industria: 15-25% al mes 2).

### Crafting con Polvo

- Desencantar Común: 25 polvo
- Desencantar Rara: 100 polvo
- Desencantar Épica: 400 polvo
- Desencantar Legendaria: 1600 polvo
- Crafting cuesta 4× el desencanto: 100 / 400 / 1600 / 6400 polvo
- (Tasas anchored en Hearthstone — pueden ajustarse a LoR-tier más generoso si playtest sugiere)

### Bundles (en lanzamientos)

- **"Set base completo"** — $59.99 USD: garantiza TODOS los Communes y Raras del set base. Las Épicas/Legendarias siguen vía sobres/crafting. **Ancla "no MTG-tier"**: el jugador que quiere todo accesible con compra única lo logra por menos de $100.
- **"Bundle de facción"** — $19.99 USD: 8 sobres temáticos de una facción + 1 cosmético exclusivo de esa civilización
- **"Pase del Sol + 30 sobres"** — $19.99 USD: bundle de inicio premium

### Cosméticos premium (no-cartas)

- **Variantes de carta** (alternate art): drops aleatorios + crafteables con Cristales
- **Tableros temáticos**: Cusco-9 orbital, lago Guatavita en órbita, Wallmapu Prime austral, Tenochtitlan-Sol
- **Finishers de partida** (animación de victoria épica)
- **Avatares de jugador**
- **Marcos de carta** por facción: oro mexica, jade muisca, plata-meteorito mapuche, obsidiana inca

### Lo que NO hacemos (anti-pillars)

- ❌ **No singles market** — cartas individuales NO se venden con plata directa. Sólo vía sobres + crafting.
- ❌ **No trading entre jugadores en v1** — abre arbitraje, mercado gris, dificulta balance. Evaluar después de tener 50+ jugadores activos.
- ❌ **No exclusivas competitivas detrás de paywall** — cualquier carta competitiva es accesible vía F2P (eventualmente)
- ❌ **No FOMO mecánico** — no "esta carta sólo está disponible esta semana". Las exclusivas son cosméticas, no mecánicas.

### Math F2P vs Suscriptor (a validar en playtest)

| | F2P | Suscriptor ($9.99/mes) |
|---|---|---|
| Sobres/mes | ~12 | ~22 (12 base + 30 daily) |
| Polvo/mes | ~800 | ~1800 |
| Cartas/mes | ~60 | ~110 |
| Tiempo a colección base completa | ~3 meses | ~5-6 semanas |

El suscriptor llega antes pero NO es imbatible. Un F2P comprometido cae en la misma colección sin pagar — sólo necesita más tiempo. Esto es exactamente lo que separa "soft P2W" (LoR/Snap) de "hard P2W" (MTG/Pokémon paper).

---

## Approach técnico

### Stack
- TypeScript 5+ strict
- Vite + React 18 (UI shell)
- **PixiJS** para el canvas del sector estelar (planetas, naves, animaciones de combate)
- DOM/CSS para cartas en mano y UI (drag/drop nativo, accesibilidad)
- **Zustand** para state management (lightweight, pattern conocido)
- **Tailwind v4** para styling (iteración visual rápida)
- **Framer Motion** para animaciones de cartas (industria estándar para CCGs en React)
- Vitest + fast-check (tests)
- pnpm + Node 22+
- Engine: reducer puro event-driven (port del kernel `myl-game`)

### Plataforma target
**Web-first PWA** en el lanzamiento de pre-alpha/alpha. Permite:
- Iteración 10x más rápida que mobile nativo (necesario en fase de validar mecánicas)
- Instalable en iOS/Android como PWA, sin pasar App Store gates
- Deploy en Cloudflare Pages (gratis, CDN global)
- Sin IAP funcional durante pre-alpha — está bien porque NO se monetiza en pre-alpha

Cuando las mecánicas estén validadas con 50-100 jugadores beta web, se decide:
- Migrar a React Native (mobile nativo, IAP funcional, mejor feel)
- O empacar PWA con Capacitor (codebase única, IAP via plugin, tradeoff de performance)
- Marvel Snap + LoR son mobile-first nativo — el mercado CCG está en mobile a largo plazo

### Determinismo
- Cero LLM en el motor de reglas
- RNG seedable (`src/engine/rng.ts`)
- Reducer puro: `(state, action) => newState`
- Replay determinista para PVP async

### Strategy pattern por facción
- Cada facción es una `BaseFactionStrategy` que registra keywords y passives
- Agregar facción nueva = nueva estrategia, sin tocar las existentes (Open/Closed)

### Roadmap técnico (resumen)
Ver `ARCHITECTURE.md` Fase 0-6 para detalle. Highlights:
- Fase 0-1 (semanas 1-4): scaffold + engine kernel
- Fase 2-3 (semanas 5-14): mecánicas core + 4 facciones
- Fase 4 (semanas 15-20): UI playable contra IA
- Fase 5+ (TBD): multiplayer, monetización, lanzamiento

---

## Decisions log

### 2026-05-08 — Tema sci-fi pre-colombino (Opción A)
- **Considered:** A) Reimaginación sci-fi pre-colombina, B) Pivote total a sci-fi sin anchor cultural, C) Pre-colombino terrestre + 5ta facción alien literal
- **Chose:** A
- **Why:** Conserva el work cultural (Mapuche > Inca anchor histórico, identidades culturales fuertes). La iconografía pre-colombina en sci-fi es un look visual que NADIE ha hecho. La premisa "civilizaciones desarrolladas independientemente, son aliens entre sí" elimina el trope colonialista de "los aliens ayudaron".
- **Cost:** Hay que diseñar el visual sci-fi-pre-colombino con cuidado para que NO se vea ridículo (ej: Mexica con jetpacks-jaguar). Más demanda artística.

### 2026-05-08 — Win condition: destruir mundo natal (no scoring de planetas)
- **Considered:** A) HP del mundo natal estilo myl, B) Scoring por presencia en planetas estilo Marvel Snap, C) Best-of-3 rondas estilo Gwent
- **Chose:** A
- **Why:** Daniel pidió "que se acerque más a myl". El push-pull de defender vs atacar el "castillo" es la dinámica clásica del CCG y se siente coherente con el resto de la estructura myl-style.
- **Cost:** No exploramos la elegancia del 3-rondas Gwent. Si en playtest la partida se sienten muy lineal, podemos agregar mid-game objectives.

### 2026-05-08 — Energía territorial (NO mana automático)
- **Considered:** A) Mana lineal +1/turno (MTG/Hearthstone), B) Energía generada por planetas controlados, C) Doble función carta-recurso (Eternal-style)
- **Chose:** B
- **Why:** Daniel rechazó A explícitamente ("se parece a Magic"). B fusiona recurso + posición espacial en una sola decisión, encaja perfecto con el setting de planetas, y es genuinamente diferente del género.
- **Cost:** Más complejidad para nuevos jugadores. Riesgo de "snowball": el que conquista primero sigue ganando energía. Se mitiga con mecánicas de re-conquista barata + protección de mundo natal en Edad I.

### 2026-05-08 — Counter wheel anclado en historia (Mapuche > Inca)
- **Considered:** A) Counter wheel TCG estándar (Aggro > Control > Midrange > Aggro), B) Counter wheel con anchor histórico (Mapuche > Inca por Batalla del Maule)
- **Chose:** B
- **Why:** Daniel detectó que la opción A (Inca > Mapuche por ser control vs midrange) traicionaba la historia. La opción B fuerza una mecánica única (`Newen` punisha removal) y crea diferenciación inmediata en el meta.
- **Cost:** El balance se vuelve menos predecible — no podés copiar matrices estándar de TCG. Requiere playtest extensivo. Pero es exactamente lo que diferencia al juego.

### 2026-05-08 — 4 facciones lanzamiento (no 5+)
- **Considered:** A) 4 facciones, B) 5-6 facciones, C) Empezar con 4 y agregar Maya en mini 1.x
- **Chose:** A (con C como roadmap)
- **Why:** 4 factions = 6 matchups balanceables por equipo indie. 5+ se vuelve infierno (10+ matchups). Maya queda como evento de expansión (más impacto narrativo).
- **Cost:** Se sacrifica la mecánica astronómica/temporal de Maya para el lanzamiento. Pero el twist cíclico se preserva como mecánica global del juego.

### 2026-05-08 — Faccions de lanzamiento: Mexica, Inca, Muisca, Mapuche
- **Considered:** Mexica + Maya + Inca + Mapuche (sesgo geográfico — 50% Mesoamérica, 50% Cono Sur). Daniel detectó el sesgo.
- **Chose:** Mexica + Inca + **Muisca** + Mapuche
- **Why:** Mejor spread geográfico (Mesoamérica + Andes + Norte sudamericano + Sur austral). Muisca trae el mito El Dorado, archetype combo económico. Tupi-Guaraní queda para lanzamiento portugués.
- **Cost:** Se posterga Maya (mecánica astronómica). Maya entra en mini 1.x.

### 2026-05-08 — Working title "Sexto Sol"
- **Considered:** Pachacuti, Quinto Sol, Tahuantin, Pacha, Sexto Sol, Chakana, Hanan Pacha
- **Chose:** Sexto Sol (luego de descartar Quinto Sol por conflicto con indie game existente)
- **Why:** Sexto Sol = "lo que viene después del Quinto Sol que está terminando". Hook narrativo de una línea ("la guerra por el Sexto Sol"). Verificado libre en Steam y rounds-ups indie 2026.
- **Cost:** Mexica-centric en origen (cosmología del 5to/6to sol es mexica), aunque el concepto cíclico es trans-cultural pre-colombino. Mitigado por la premisa narrativa que distribuye el "ocaso del 5to sol" entre las 4 civilizaciones.

### 2026-05-08 — Repo nuevo `/opt/sexto-sol/` (no fork de myl-game)
- **Considered:** A) Fork de myl-game con rebrand, B) Repo nuevo + port a demanda de pieces del engine
- **Chose:** B
- **Why:** Sexto Sol es un juego distinto (espacio, energía territorial, edades, 4 facciones nuevas, win condition diferente). Nada del card data ni del rules engine de myl-game se reutiliza tal cual. Fork arrastraría 174 cartas inútiles + tech debt + naming confusion.
- **Cost:** Doble setup de tooling (pnpm, ts, vitest, etc.). Se mitiga porque el setup es estándar y rápido.

### 2026-05-08 — PixiJS para canvas (no Konva)
- **Considered:** Konva (lo usado en fasico-web), PixiJS, Three.js, Phaser
- **Chose:** PixiJS
- **Why:** Mejor performance para muchos sprites animados — el sector estelar va a tener naves, planetas, efectos de combate, partículas. PixiJS está optimizado para esto (Marvel Snap-tier). Konva es más simple pero pelea con cantidad de sprites. Three.js sería overkill 3D y mata performance mobile. Phaser saca del ecosistema React.
- **Cost:** Curva de aprendizaje un poco más alta que Konva. Daniel acepta el tradeoff.

### 2026-05-08 — Web-first PWA (no mobile nativo en pre-alpha)
- **Considered:** A) Web-first PWA, B) Mobile-first React Native, C) Web + Capacitor híbrido, D) React Native + react-native-web
- **Chose:** A para pre-alpha/alpha; reevaluar antes de beta cerrada
- **Why:** Iteración 10x más rápida que mobile nativo en fase de validar mecánicas. Marvel Snap + LoR son mobile-first nativo, pero esos equipos validaron mecánicas web/internamente antes. Cuando las mecánicas de Sexto Sol estén lockeadas, se decide migración.
- **Cost:** Sin IAP funcional durante pre-alpha. Está bien — NO se monetiza en pre-alpha. Mobile feel inferior temporal.

### 2026-05-08 — Modelo soft P2W con Pase del Sol + sobres + crafting + bundles
- **Considered:** A) Marvel Snap-style Collection Level (sin sobres, cards drip-feed), B) LoR/Hearthstone-style sobres + crafting + battle pass, C) Híbrido con suscripción que da bonificaciones pasivas
- **Chose:** B + C — sobres + crafting con polvo + Pase del Sol mensual con beneficios pasivos
- **Why:** Daniel pidió explícitamente que se vendan sobres ("la gente entiende sobres"). LoR es el mejor referente de soft P2W con sobres (mejor que Hearthstone gracias al pity timer + crafting target). Pase del Sol agrega vector de revenue recurrente con beneficios pasivos (más oro/sobres) que NO comprometen el principio "soft P2W" — el suscriptor paga por velocidad, no por poder.
- **Cost:** Más complejidad económica (3 monedas, pity timers, battle pass tracks). Necesita math validado en playtest. Pero el upside es preserve "soft P2W" mientras se monetiza decentemente.

---

## Test plan / Definition of Done para esta spec

Esta spec se considera "v0 lista para producción" cuando:

- [ ] Las 4 facciones tienen 5-10 cartas iniciales diseñadas (al menos en papel) y testeadas en pseudo-playtest
- [ ] Counter wheel validado: simulamos 50 partidas pseudo-aleatorias y los winrates entre facciones son consistentes con el wheel diseñado (Mapuche gana ~55-60% vs Inca, etc.)
- [ ] Edades transición funciona en simulación
- [ ] Energía territorial no resulta en snowball desbalanceado (winrate del primero en conquistar < 65%)
- [ ] Mecánicas firma están diferenciadas en juego (no se sienten genéricas)
- [ ] Spec movida a `shipped/` (cuando arranque producción del set base)

---

## Phases

Ver `BACKLOG.md` para fases de implementación detalladas. Resumen:

- **Fase 0**: Infraestructura del repo
- **Fase 1**: Engine kernel
- **Fase 2**: Mecánicas core
- **Fase 3**: 4 facciones (Mapuche primero por ser ancla histórica)
- **Fase 4**: UI playable + AI greedy
- **Fase 5**: Multiplayer
- **Fase 6**: Beta + monetización
- **Fase 7**: Lanzamiento

---

## Open questions

### Diseño
- [ ] ¿Cuántos turnos exactos dura cada Edad? (Edad I ~4-5, Edad II ~3-4, Edad III ~3-4 → partida ~10-13 turnos por jugador. Validar en playtest.)
- [ ] Reglas exactas de bloqueo en combate (¿defensor elige? ¿se declara primero attacker?)
- [ ] Daño residual: ¿pasa al planeta? ¿al mundo natal? Ambos?
- [ ] Sistema de mulligan exacto (¿una vez? ¿con cost?)
- [ ] ¿Limite de cartas por turno? (¿como Hearthstone, sin límite? ¿una sola carta por fase Despliegue?)
- [ ] Win condition alternativa por scoring de planetas — descartado por ahora pero podría volver si playtest sugiere

### Producto
- [ ] PVP async (Marvel Snap-style) vs realtime (LoR-style)?
- [ ] Mobile-first o web-first?
- [ ] Lanzamiento Steam, mobile (iOS+Android), o web?
- [ ] Repo público o privado al inicio?

### Cultural
- [ ] ¿Cómo organizamos consultorías culturales? (Mapuche, Inca, Muisca, Mexica especialistas)
- [ ] ¿Voice acting en lenguas originarias? (mapuzungun, quechua, náhuatl, muysccubun)
- [ ] ¿Soundtrack original con instrumentos pre-colombinos? (kultrun mapuche, quena andina, teponaztli mexica)

### Técnico
- [ ] Cuándo arrancamos a codear vs seguir iterando spec?
- [ ] Backend stack: Node + WebSocket vs Cloudflare Durable Objects vs otro?
- [ ] Persistencia: PostgreSQL vs SQLite vs algo más liviano?

---

## Links

- Repo: `/opt/sexto-sol/` (no inicializado git todavía)
- Engine reference: `/opt/myl-game/` (kernel a portar)
- CLAUDE.md: contexto para colaboradores y agentes IA
- GAME-RULES.md: reglas vivas del juego
- ARCHITECTURE.md: patrones técnicos
- BACKLOG.md: roadmap

---

*Vivo. Última actualización: 2026-05-08.*
