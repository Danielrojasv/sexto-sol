# Engine + UI Migration v3.0 → v4.1

**Status:** approved (rev 3)
**Owner:** Daniel
**Created:** 2026-05-15
**Last updated:** 2026-05-16 (rev 3: las 7 IQs abiertas cerradas)
**Related specs:** `peregrinaje-v4.1.md` (diseño v4.1 — approved, source of truth)
**Tiempo estimado:** 3-5 sesiones largas (engine + UI + IA + tests + cleanup)

---

## Revision 3 — IQs cerradas

Las 7 IQs abiertas de rev 2 fueron resueltas:

- **IQ1 — Eliminar event bus completo.** YAGNI: v4.1 lineal, sin triggers. Si vuelve en set 2, 1h de trabajo reintroducir.
- **IQ2 — Type guards manuales.** Cartas con ~5 campos no justifican `zod` (50KB bundle). ~30 LOC de guards.
- **IQ4 — Animación mínima al final de Phase 3.** Carta rotate Y 180deg (~400ms) + atributos tween 300ms. **Si Phase 3 se atrasa, bajar a B (sin animación) sin culpa.** Hacer al final, no al principio.
- **IQ5 — Modal confirm para Eclipse, no negociable.** Click accidental es catastrófico (Eclipse es 1×/partida, irreversible).
- **IQ6 — Tooltip de bonus con toggle.** Setting "Mostrar tooltips de ayuda" en HomeView, **default ON**. ~5 LOC, resuelve onboarding + density para jugadores avanzados.
- **IQ7 — IA con delay 150ms, sin texto.** No 0.8s (acumula 6-12 esperas/partida = 5-8% del tiempo total tirado). 150ms evita colapso de frames pero no es perceptible como "espera". Sin texto "el otro héroe lee el cosmos…" (se lee cute al principio, ruido a la 5ta partida).
- **IQ8 — Out of scope. Stretch si Phase 4 termina antes:** botón "Copiar log" en GameOverModal que dumpea JSON de actions al clipboard (~5min de trabajo, valor enorme para debug en playtest). **No prometido en spec**, solo si queda tiempo.

---

## Revision 2 — Cambios desde rev 1

Aplicados después del review:

- **Walkthrough test dividido** en estructural (obligatorio, robusto a re-balanceos) + numérico (opcional, skippable).
- **YAMLs de cards-v4.1 migrados a campos estructurados** (`fuerzaDelta`, `sideEffect`). Cierra IQ3.
- **Pseudocode de `CLOSE_TRAMO` explícito**: lógica per-jugador, no ambigua.
- **Reconciliación walkthrough ↔ pool** como step obligatorio antes de escribir `walkthrough.test.ts`.
- **Política de fallback por Phase** agregada: tests rojos → detener, no avanzar.
- **Bonus de planeta condicionado a tramo** (solo Nebulosa/Estrellas, NO Sexto Sol) explícito en pseudocode del interpreter.

---

## Why

El kernel TypeScript de Sexto Sol implementa hoy **v3.0** (HP del mundo natal, 5 fases de turno, counter wheel por categorías, 4 razas con mecánicas firma sobre event bus). Coverage 89.32% global, 347 tests verdes, CI green, `pnpm dev` jugable.

Pero el diseño v4.1 cerrado el 2026-05-15 ("El Peregrinaje del Héroe") es **estructuralmente incompatible** con el kernel actual:

- v4.1 no tiene HP, fases ni combate.
- v4.1 introduce 3 atributos del héroe (Fuerza/Resguardo/Resonancia) en lugar de un solo contador.
- v4.1 introduce elección secreta de planeta + bonus +1.
- v4.1 cambia la victoria de "HP a 0" a "ganar 2 de 3 atributos en duelo final".

Sin esta migración: no podemos jugar v4.1 contra IA, no podemos validar las 11 open questions empíricamente, no podemos correr simulaciones masivas (5+ partidas en paralelo, no a mano como hice en `SIM-RESULTS-v4.1.md`), y el repo queda con mismatch confuso entre diseño-canónico (v4.1) y código-funcional (v3.0).

**Decisión 2026-05-15:** eliminar v3.0 al cerrar v4.1. No mantener ambos. Más limpio.

---

## Goals

- [ ] **GameState v4.1** modela: 2 jugadores × {raza, atributos: {fuerza, resguardo, resonancia}, mazo, mano, pozo, heroState, planetElegidoNebulosa?, planetElegidoEstrellas?, mulligadeUsado}, tramo actual, turno actual (1-7), energía actual, premoniciones declaradas, acciones ocultas pendientes, eclipseInvocado, eclipseInvocador, rng.
- [ ] **Reducer puro v4.1** maneja todas las actions del flujo: `START_GAME`, `MULLIGAN`, `SELECT_PLANET`, `PLAY_HIDDEN`, `DECLARE_PREMONICION`, `REVEAL`, `CLOSE_TRAMO`, `INVOKE_ECLIPSE`, `END_GAME`. Determinismo total: misma seed + misma secuencia de actions → mismo log.
- [ ] **Interpreter de condicionales** evalúa las 3 cláusulas (`premonicion_propia`, `premonicion_oponente`, `premonicion_acierta`) contra las premoniciones declaradas y categoría intrínseca de la carta. Aplica bonus de planeta (+1 si categoría coincide con planeta-elegido). Devuelve fuerza final + side effects.
- [ ] **Loader v4.1** carga cartas desde `docs/playtest/cards-v4.1/*.yaml` (acción + héroes + planetas) y mazos desde `docs/playtest/decks-v4.1/*.yaml`. Validación de schema + integridad (20 cartas/mazo, max 2 copias, IDs válidos).
- [ ] **scriptedAI v4.1** implementa las 5 heurísticas §7.5 del SPEC v4.1 (mulligan, elección planeta, premonición tracking, elección acción por fuerza esperada, eclipse). Determinista vía seed.
- [ ] **HomeView v4.1** permite elegir raza (Tezhal/Würon) + modo (vs IA / Hot-seat) + mazo preconstruido (4 opciones, 2 por raza). Botón "Iniciar Peregrinaje" → /play.
- [ ] **PlayView v4.1** UI funcional con:
  - Header: tramo actual + turno + sub-paso del turno.
  - Zona enemigo: atributos visibles (3 contadores), héroe + estado, premonición declarada, conteo mazo/mano/pozo, planeta elegido (oculto hasta cierre tramo).
  - Centro: 3 contadores de atributos por jugador + zona de revelado simultáneo.
  - Zona propia: atributos, héroe + habilidades activas, energía, mano interactiva, planeta-elegido (visible para sí mismo), botones de premonición (Atq/Def/Rit).
  - Sub-flujo turno: robo automático → elegir carta (oculta) → declarar premonición → revelar → resolución animada → próxima.
  - Modal "Elegí tu Planeta" al inicio de Nebulosa y Estrellas (selección secreta, oculta al oponente en Hot-seat).
  - Modal "Cierre de Tramo" al final de T2/T4: revela planetas, muestra comparación + avance de héroe.
  - Botón "Invocar Eclipse" en turnos 5-7 (con confirm modal).
- [ ] **GameOverModal v4.1** muestra duelo de héroes lado a lado (3 atributos), tally 2-de-3, botones "Jugar de nuevo" / "Cambiar mazo".
- [ ] **Tests engine ≥ 85% coverage:**
  - Reducer: 1 test por action × camino feliz + edge cases.
  - Interpreter: 1 test por tipo de cláusula + bonus planeta.
  - Loader: validación de schema correcta + rechazo de mazos inválidos.
  - scriptedAI: determinismo (mismo seed = mismo log), heurísticas respetadas.
  - Property tests (fast-check): fuerza nunca negativa, energía = número de turno, máx 7 turnos por partida, 1 Eclipse máximo, atributos no se resetean entre tramos, héroe avanza solo al ganar atributo correspondiente.
  - **Walkthrough §11 reproducible (estructural)**: seeds determinísticos producen una partida donde Ana invoca Eclipse en T7 y gana el duelo 2-1. **No** se testean los números exactos de atributos — el test es robusto frente a re-balanceos de cartas. Test numérico paso a paso queda como opcional (skipped por default).
- [ ] **Tests UI smoke:**
  - HomeView renderiza correctamente con ambas razas + 4 mazos.
  - PlayView transiciona entre tramos correctamente.
  - GameOverModal muestra tally correcto.
- [ ] **Portabilidad Node.js preservada:** engine sigue siendo cero browser deps. `portability.test.ts` adaptado a v4.1.
- [ ] **CI verde:** lint + typecheck + test + build + validate-cards (este último ajustado al schema YAML v4.1).
- [ ] **v3.0 eliminado:** archivos de v3.0 borrados del repo (ver §"Plan archivo-por-archivo"). Kernel v3.0 queda solo en git history + `docs/archive/`.
- [ ] **Documentación actualizada:** `ARCHITECTURE.md`, `BACKLOG.md`, `README.md` reflejan v4.1 como single source of truth del código.

---

## Non-goals / Out of scope

- ✗ **Resolver Q1-Q11 de `OPEN-QUESTIONS-v4.1.md`.** El engine implementa los defaults documentados; el playtest empírico los valida y se cierran en otra spec si requieren cambios mecánicos.
- ✗ **Implementar Q'ralan y Zaqe.** Mantienen lore (§5 CANON-LORE) pero sin cartas activas hasta set 2.
- ✗ **Multiplayer online, WebSockets, backend.** Esta spec es local-only PWA.
- ✗ **Persistencia / replay system / save & load.** Partida ephemeral en memoria.
- ✗ **Animaciones premium con Framer Motion.** Solo reveal de carta + dominio de planeta. Sin polish visual.
- ✗ **PixiJS canvas.** v4.1 visualmente simple — DOM + Tailwind alcanza. **PixiJS se desinstala del package.json** (sustracción).
- ✗ **Sobres, crafting, colección, custom deck builder.** 4 mazos preconstruidos como único source.
- ✗ **IAP, paywall, billing, sonido, mobile native.** No aplica.
- ✗ **Modificar `CANON-LORE.md`, `GAME-RULES.md`, pool de cartas v4.1.** Diseño es source of truth. Si la implementación encuentra contradicciones, registrar en Decisions log + abrir cuestión, NO modificar diseño.
- ✗ **Tutorial in-app, onboarding.** Diferido al BACKLOG.
- ✗ **i18n.** Sigue español-Chile.
- ✗ **Optimizaciones de rendimiento prematuras.** Engine simple primero, perfil después si hace falta.

---

## User-facing changes

```
[HomeView]
  ├─ Header "Peregrinaje del Héroe"
  ├─ Selector raza
  │   ├─ Tezhal (icono pirámide ardiente)
  │   └─ Würon (icono raíz estelar)
  ├─ Selector modo
  │   ├─ vs IA (heurística scripted, oponente automático)
  │   └─ Hot-seat (2 humanos, mismo dispositivo, oculta info sensible vía PrivacyShield)
  ├─ Selector mazo preconstruido (depende de raza)
  │   ├─ Tezhal: tezhal-aggro | tezhal-sacrificio
  │   └─ Würon: wuron-control | wuron-ritual
  ├─ Toggle "Mostrar tooltips de ayuda" (default ON, IQ6)
  └─ Botón "Iniciar Peregrinaje" → /play

[PlayView]
  ├─ Header sticky
  │   ├─ Tramo: "Nebulosa" / "Estrellas" / "Sexto Sol"
  │   ├─ Turno N/7
  │   └─ Sub-paso: Robo → Energía → Acción → Premonición → Revelar
  ├─ Zona enemigo (top)
  │   ├─ Atributos: F/R/Res (visibles siempre)
  │   ├─ Héroe + estado (Neutral/Despertado/Ascendido)
  │   ├─ Conteo mazo + mano (sin reveal en Hot-seat con shield) + pozo
  │   ├─ Premonición declarada (visible cuando hecha)
  │   ├─ Planeta-elegido (oculto hasta cierre tramo)
  │   └─ Carta jugada boca abajo / revelada según sub-paso
  ├─ Centro
  │   ├─ 3 contadores de Atributos (F/R/Res) por jugador
  │   ├─ Indicador del tramo actual (Nebulosa/Estrellas/Sexto Sol)
  │   └─ Zona de revelado simultáneo (cartas se dan vuelta acá)
  ├─ Zona propia (bottom)
  │   ├─ Atributos: F/R/Res
  │   ├─ Héroe + estado + habilidades activas
  │   ├─ Energía disponible este turno
  │   ├─ Mano interactiva (cartas clickables, jugables resaltadas)
  │   ├─ Planeta-elegido (visible para sí mismo)
  │   └─ Botones de premonición: [Ataque] [Defensa] [Ritual]
  └─ Sub-flujo por turno:
       1. Robo automático (anim 0.5s)
       2. Energía actualizada (visual)
       3. Elegir carta: click → mostrar coste → confirm
       4. Carta colocada boca abajo en zona propia
       5. Declarar premonición (1 de los 3 botones)
       6. Esperar al oponente (vs IA: delay 0.8s; Hot-seat: pasar dispositivo)
       7. Ambas listas → Botón "Revelar"
       8. Cartas dan vuelta, condicionales muestran +/− fuerza, bonus planeta visible, atributos suben

[Modal "Elegí tu Planeta" — al iniciar Nebulosa y Estrellas]
  ├─ 3 cartas de planeta del tramo, mostradas
  ├─ Cada una con nombre, categoría, flavor
  ├─ Click selecciona
  ├─ Confirm: queda oculto al oponente
  └─ En Hot-seat: PrivacyShield antes de mostrar al siguiente jugador

[Modal "Cierre de Tramo" — fin turno 2 y turno 4]
  ├─ Revela planetas de ambos jugadores
  ├─ Muestra comparación del atributo correspondiente a cada planeta
  ├─ Indica ganador(es) del tramo + avance de héroe
  └─ Botón "Continuar" → siguiente tramo

[Modal "Invocar Eclipse" — disponible turnos 5-7]
  ├─ Confirm: "Tu acción este turno cuenta doble, el oponente roba 1 extra, la partida termina al final del turno"
  └─ [Cancelar] [Invocar]

[GameOverModal]
  ├─ Texto: "Has dominado el Sexto Sol" / "Tu peregrinaje fue leído"
  ├─ Duelo de Héroes:
  │   ├─ Tabla F/R/Res con valores ambos
  │   ├─ Indicador de quién ganó cada uno
  │   └─ Tally final (X-Y, max 3-0)
  ├─ Estado de héroe al final (ambos)
  └─ Botones: "Jugar de nuevo" / "Cambiar mazo"
```

---

## Approach

### Arquitectura

Reducer puro `(state, action) => newState` + tipos discriminados + RNG seedable + tests deterministas con seed conocido. Patrón heredado de v3.0 funcionando (CI green con 347 tests).

```
src/
├── engine/
│   ├── types.ts            ← v4.1 types: GameState, Player, Hero, HeroAttributes, etc.
│   ├── rng.ts              ← preservado (seedable, sin deps)
│   ├── initialState.ts     ← setup v4.1 (héroe Neutral, atributos 0, mazo barajado)
│   ├── actions.ts          ← discriminated union de Actions
│   ├── reducer.ts          ← reducer principal con switch sobre actions
│   ├── interpreter.ts      ← evalúa cláusulas condicionales de cartas
│   ├── ai/scriptedAI.ts    ← heurísticas §7.5
│   └── __tests__/          ← unit + property + replay tests
├── data/
│   ├── cards/loader.ts     ← carga YAMLs cards-v4.1
│   ├── decks/loader.ts     ← carga YAMLs decks-v4.1
│   ├── schema.ts           ← validación de YAML (zod o tipo manual)
│   └── __tests__/
├── store/
│   └── gameStore.ts        ← Zustand store, espejo de GameState + dispatcher
├── ui/
│   ├── HomeView.tsx
│   ├── PlayView.tsx
│   ├── GameOverModal.tsx
│   ├── PlanetChoiceModal.tsx
│   ├── EclipseConfirmModal.tsx
│   ├── TramoClosingModal.tsx
│   ├── CardView.tsx        ← rendering de carta de Acción
│   ├── HeroBadge.tsx       ← rendering de héroe + estado
│   ├── PlanetCard.tsx      ← rendering de carta de Planeta
│   ├── AttributeCounters.tsx ← 3 contadores F/R/Res
│   ├── PrivacyShield.tsx   ← preservado (Hot-seat)
│   └── __tests__/
├── App.tsx
└── main.tsx
```

### Tipos centrales (sketch)

```typescript
export type Categoria = 'Ataque' | 'Defensa' | 'Ritual'
export type Raza = 'Tezhal' | 'Würon'
export type Tramo = 'nebulosa' | 'estrellas' | 'sexto_sol'
export type HeroEstado = 'neutral' | 'despertado' | 'ascendido'
export type PremonicionTipo = 'premonicion_propia' | 'premonicion_oponente' | 'premonicion_acierta'

export interface Condicional {
  tipo: PremonicionTipo
  valor?: Categoria // para premonicion_propia / premonicion_oponente
  // Campos estructurados (parseados al cargar el YAML, NO en runtime):
  fuerzaDelta?: number // ±N a la fuerza final si la cláusula triggerea
  sideEffect?: { tipo: 'descarte' | 'robo' | 'anula'; valor: number; target: 'propio' | 'oponente' }
  // Campo opcional para UI:
  efectoTexto?: string // texto humano para tooltips/render, NO usado por el interpreter
}

export interface CardActionDef {
  id: string
  nombre: string
  raza: Raza
  categoria: Categoria
  coste: number
  fuerzaBase: number
  rareza: 'comun' | 'rara' | 'epica' | 'legendaria'
  condicionales: Condicional[]
  flavor: string
}

export interface CardPlanetDef {
  id: string
  nombre: string
  tramo: 'Nebulosa' | 'Estrellas'
  categoria: Categoria
  flavor: string
  efectoEspecial: null // reservado v4.2+
}

export interface CardHeroDef {
  id: string
  nombre: string
  raza: Raza
  habilidades: {
    despertado: { condicion: string; efecto: string }
    ascendido: { condicion: string; efecto: string }
  }
  flavor: string
}

export interface HeroAttributes {
  fuerza: number
  resguardo: number
  resonancia: number
}

export interface Player {
  id: 'a' | 'b'
  raza: Raza
  mazoRestante: string[] // ids de cartas en mazo
  mano: string[]
  pozo: string[]
  atributos: HeroAttributes
  heroEstado: HeroEstado
  mulliganUsado: boolean
  planetElegidoActual?: string // id del planet card, undefined fuera de Neb/Est
}

export interface GameState {
  seed: number
  rng: RngState
  tramo: Tramo
  turno: number // 1-7
  subPaso:
    | 'inicio_tramo'
    | 'robo'
    | 'energia'
    | 'accion_pendiente'
    | 'premonicion_pendiente'
    | 'revelar'
    | 'resolver'
    | 'cierre_tramo'
    | 'duelo_final'
  jugadorActivo: 'a' | 'b' // para Hot-seat pasar dispositivo; en vs IA siempre 'a'
  players: { a: Player; b: Player }
  poolPlanetasNebulosa: string[] // 3 ids
  poolPlanetasEstrellas: string[] // 3 ids
  energiaActual: number // = turno
  premoniciones: { a?: Categoria; b?: Categoria }
  accionesPendientes: { a?: string; b?: string } // card ids boca abajo
  eclipseInvocado: boolean
  eclipseInvocador?: 'a' | 'b'
  modo: 'vsIA' | 'hotseat'
  ganador?: 'a' | 'b' | 'empate'
  finalTally?: { a: number; b: number }
}
```

### Acciones del reducer

- `START_GAME`: setup inicial, baraja, robar manos, evaluar mulligan automático para vsIA, prompt mulligan para human.
- `MULLIGAN`: re-baraja mano, roba 4 nuevas.
- `SELECT_PLANET`: el jugador (humano o IA) elige planeta secreto al inicio del tramo.
- `DRAW`: robar 1 carta (al inicio de cada turno).
- `PLAY_HIDDEN`: jugar carta boca abajo, pagar coste. Si no puede pagar nada, declarar "Pasa".
- `DECLARE_PREMONICION`: declarar Atq/Def/Rit.
- `REVEAL`: revelar ambas cartas, ejecutar interpreter, sumar a atributos. Avanzar a siguiente turno o cerrar tramo.
- `CLOSE_TRAMO`: ejecuta la siguiente lógica:
  - Para cada jugador independientemente:
    - Determinar la categoría de SU planeta-elegido del tramo.
    - Comparar SU atributo de esa categoría contra el atributo del oponente en la **misma** categoría.
    - Si SU valor > valor del oponente: ese jugador gana SU tramo, SU héroe avanza un estado (Neutral→Despertado en Nebulosa, Despertado→Ascendido en Estrellas), se activan habilidades pasivas nuevas.
    - Si SU valor ≤ valor del oponente (empate o menor): SU héroe NO avanza.
  - Ambos jugadores pueden ganar SUS tramos simultáneamente si eligieron categorías distintas y cada uno supera al otro en la suya.
  - Reset de `accionesPendientes`, `premoniciones`, `planetElegidoActual`. Atributos **NO** se resetean.
  - Avanzar tramo: Nebulosa→Estrellas, Estrellas→Sexto Sol. En Sexto Sol no se cierra tramo (se va directo a `END_GAME` al final del T7 o al invocar Eclipse).
- `INVOKE_ECLIPSE`: marcar Eclipse, oponente roba 1 extra, próximo `REVEAL` aplica ×2.
- `END_GAME`: calcular duelo final 2-de-3, declarar ganador, escribir final_tally.

### Interpreter de condicionales

Función pura `interpretCondicionales(card, miPremonicion, oponentePremonicion, planetElegido, tramo, habilidadesHeroe) → { fuerzaFinal, sideEffects }`:

```
fuerza = card.fuerzaBase
sideEffects = []

for cond of card.condicionales:
  triggered = false
  if cond.tipo === 'premonicion_propia' && cond.valor === miPremonicion:
    triggered = true
  if cond.tipo === 'premonicion_oponente' && cond.valor === oponentePremonicion:
    triggered = true
  if cond.tipo === 'premonicion_acierta' && oponentePremonicion === card.categoria:
    triggered = true

  if triggered:
    if cond.fuerzaDelta != null:
      fuerza += cond.fuerzaDelta
    if cond.sideEffect != null:
      sideEffects.push(cond.sideEffect)

# Bonus de planeta: SOLO en Nebulosa y Estrellas, NUNCA en Sexto Sol.
if tramo !== 'sexto_sol' && planetElegido != null && planetElegido.categoria === card.categoria:
  fuerza += 1

# Habilidades de héroe activas (Tezhal Despertado: +1 Atq, etc.)
fuerza += aplicarHabilidadesHeroe(card, habilidadesHeroe, miPremonicion, oponentePremonicion)

return { fuerzaFinal: Math.max(0, fuerza), sideEffects }
```

**Notar:** el interpreter es puro y no muta state. Los `sideEffects` los resuelve el reducer después de calcular fuerza final de ambas cartas. No hay parsing de strings en runtime — los campos estructurados (`fuerzaDelta`, `sideEffect`) se parsean al cargar el YAML.

### scriptedAI

Función pura `decideAction(state, playerId, rng) → Action`:

```
switch state.subPaso:
  case 'inicio_tramo' && es turno de elegir planeta:
    return Heurística 2 (elegir planeta)
  case 'accion_pendiente':
    return Heurística 4 (elegir carta de mano, maximizar fuerza esperada paid)
  case 'premonicion_pendiente':
    return Heurística 3 (predecir categoría más frecuente del oponente)
  case 'sexto_sol' && eclipse posible:
    decisión Heurística 5 (invocar o no)
  default:
    return action defecto (avanzar sub-paso)
```

### UI

Zustand store espeja GameState. Componentes son funciones puras que renderizan state. Actions despachan via store.

Hot-seat con PrivacyShield: cuando le toca jugar al otro jugador, mostrar shield "Pasale el dispositivo a [nombre]". Botón "Estoy listo" pasa al otro lado.

vs IA: el "jugador B" es el scriptedAI. Cuando le toca jugar, ejecuta heurísticas con **delay 150ms** (IQ7 — no 0.8s ni texto flavor, evita acumulación de espera artificial en partidas repetidas de playtest).

---

## Plan archivo-por-archivo

### Crear (nuevos)

| Archivo                          | Notas                                                                                                                                                                                                                                                                   |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/engine/actions.ts`          | Discriminated union de Actions con payloads.                                                                                                                                                                                                                            |
| `src/data/cards/loader.ts`       | Reemplaza `cards/index.ts`. Carga YAMLs v4.1 con la lib `yaml`.                                                                                                                                                                                                         |
| `src/data/decks/loader.ts`       | Mantener archivo pero reescribir contenido.                                                                                                                                                                                                                             |
| `src/data/schema.ts`             | Validación runtime de YAML con type guards manuales. Verifica `fuerzaDelta` es number (si presente); `sideEffect` tiene los campos esperados (si presente); `categoria` ∈ {Ataque, Defensa, Ritual}; `coste` ∈ [1, 6]; `fuerzaBase` ≥ 0. Falla early con mensaje claro. |
| `src/ui/GameOverModal.tsx`       | Duelo de héroes 2-de-3.                                                                                                                                                                                                                                                 |
| `src/ui/PlanetChoiceModal.tsx`   | Selección secreta de planeta.                                                                                                                                                                                                                                           |
| `src/ui/EclipseConfirmModal.tsx` | Confirm de Eclipse.                                                                                                                                                                                                                                                     |
| `src/ui/TramoClosingModal.tsx`   | Revela planetas + comparación + avance héroe.                                                                                                                                                                                                                           |
| `src/ui/CardView.tsx`            | Rendering de carta de Acción (puede heredar de MiniCard).                                                                                                                                                                                                               |
| `src/ui/HeroBadge.tsx`           | Rendering de héroe + estado + habilidades activas.                                                                                                                                                                                                                      |
| `src/ui/PlanetCard.tsx`          | Rendering de carta de Planeta.                                                                                                                                                                                                                                          |
| `src/ui/AttributeCounters.tsx`   | 3 contadores F/R/Res, animados al cambiar.                                                                                                                                                                                                                              |

### Reescribir (mismo path, contenido nuevo)

| Archivo                       | Notas                                                                                                                                                       |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/engine/types.ts`         | v4.1: GameState, Player, HeroAttributes, etc. Sin Ship, HP, fases v3.0.                                                                                     |
| `src/engine/initialState.ts`  | Setup v4.1: héroe Neutral, atributos 0, barajar, mano 4.                                                                                                    |
| `src/engine/reducer.ts`       | Reducer v4.1 con switch sobre actions nuevas. Sin combate, sin fases.                                                                                       |
| `src/engine/interpreter.ts`   | Interpreter de condicionales v4.1 (3 cláusulas + bonus planeta). Sin primitives DSL v3.0. Lee directamente los campos estructurados, sin parser de strings. |
| `src/engine/eventBus.ts`      | Probablemente simplificar o eliminar (v4.1 es más lineal, no requiere event bus complejo).                                                                  |
| `src/engine/events.ts`        | Idem.                                                                                                                                                       |
| `src/engine/ai/scriptedAI.ts` | Heurísticas §7.5 v4.1.                                                                                                                                      |
| `src/store/gameStore.ts`      | Espejo de GameState v4.1 + dispatcher.                                                                                                                      |
| `src/ui/HomeView.tsx`         | Selector raza + modo + mazo v4.1.                                                                                                                           |
| `src/ui/PlayView.tsx`         | UI v4.1 completa (atributos visibles, modal planeta, eclipse, etc.).                                                                                        |
| `src/ui/MiniCard.tsx`         | Adaptar a formato cards-v4.1.                                                                                                                               |
| `src/ui/CardArt.tsx`          | Adaptar (sin Ship type, sin HP).                                                                                                                            |
| `src/ui/CardCatalog.tsx`      | Adaptar al pool v4.1 (decidir si seguir teniendo este componente).                                                                                          |
| `src/App.tsx`, `src/main.tsx` | Minor: actualizar imports.                                                                                                                                  |

### Eliminar

| Archivo                                           | Razón                                                |
| ------------------------------------------------- | ---------------------------------------------------- |
| `src/strategies/base.ts`                          | Counter-wheel por raza, no aplica en v4.1.           |
| `src/strategies/index.ts`                         | Idem.                                                |
| `src/strategies/quralan.ts`                       | Raza no implementada en v4.1.                        |
| `src/strategies/tezhal.ts`                        | La identidad Tezhal vive en data, no en strategy.    |
| `src/strategies/wuron.ts`                         | Idem.                                                |
| `src/strategies/zaqe.ts`                          | Raza no implementada.                                |
| `src/strategies/__tests__/strategies.test.ts`     | —                                                    |
| `src/engine/derive/strength.ts`                   | Formación Solar v3.0 (Q'ralan).                      |
| `src/engine/mechanics/kulen.ts`                   | Külen v3.0 (Würon mecánica firma).                   |
| `src/data/primitives/spec.ts`                     | DSL de primitives v3.0. v4.1 no usa primitives.      |
| `src/data/keywords.ts`                            | Keywords (Bastión, Embate, etc.) no aplican en v4.1. |
| `src/data/blocklist.ts`                           | Específico de v3.0.                                  |
| `src/data/abilityRenderer.ts`                     | Reemplazado por renderer simpler de condicionales.   |
| `src/data/cards/index.ts`                         | Reemplazado por `loader.ts`.                         |
| `src/data/cards/*/*.json`                         | Pool v3.0 archivado (cards-v3.0/).                   |
| `src/data/__tests__/*`                            | Tests de v3.0 data.                                  |
| `src/engine/__tests__/eventbus.test.ts`           | Si simplificamos eventBus.                           |
| `src/engine/__tests__/interpreter.test.ts` (v3.0) | Reescribir como nuevo test del interpreter v4.1.     |

### Preservar (sin cambios)

| Archivo                                    | Razón                                                              |
| ------------------------------------------ | ------------------------------------------------------------------ |
| `src/engine/rng.ts`                        | RNG seedable sin browser deps — reutilizable.                      |
| `src/engine/__tests__/rng.test.ts`         | Test del RNG.                                                      |
| `src/engine/__tests__/portability.test.ts` | Adaptar mínimo para apuntar a archivos v4.1, pero la lógica sigue. |
| `src/ui/PrivacyShield.tsx`                 | Hot-seat — reutilizable.                                           |
| `src/tests/setup.ts`                       | Setup de vitest.                                                   |

### Tests a reescribir

| Archivo                                            | Notas                                                                                                                                                                                                                            |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/engine/__tests__/initialState.test.ts`        | Verifica setup v4.1 (atributos 0, héroe Neutral, mano 4, mazo 16).                                                                                                                                                               |
| `src/engine/__tests__/reducer.test.ts`             | 1 test por action.                                                                                                                                                                                                               |
| `src/engine/__tests__/interpreter.test.ts`         | Cubrir las 3 cláusulas + bonus planeta + combinaciones.                                                                                                                                                                          |
| `src/engine/__tests__/invariants.test.ts`          | Property tests fast-check: fuerza final ≥ 0 (anulaciones llevan a 0 mínimo, nunca negativo); energía = turno; máx 7 turnos; 1 Eclipse máximo; atributos nunca decrecen; héroe avanza solo al ganar atributo del planeta-elegido. |
| `src/engine/__tests__/mechanics.test.ts`           | Eclipse (×2 al atributo correspondiente), bonus planeta, habilidades héroe Despertado/Ascendido.                                                                                                                                 |
| `src/engine/__tests__/replay.test.ts`              | Determinismo: misma seed + mismas actions = mismo log.                                                                                                                                                                           |
| `src/engine/__tests__/scriptedAI.test.ts`          | Heurísticas: tracking de premoniciones, elección de planeta por mano, mulligan, eclipse.                                                                                                                                         |
| `src/engine/__tests__/walkthrough.test.ts` (nuevo) | Test estructural (obligatorio) + test numérico (opcional/skipped). Ver §Test plan abajo para detalle.                                                                                                                            |
| `src/store/__tests__/gameStore.test.ts`            | Adaptar al store v4.1.                                                                                                                                                                                                           |
| `src/ui/__tests__/*.test.tsx`                      | Reescribir cada uno o eliminar y rehacer post-UI.                                                                                                                                                                                |

---

## Decisions log

### 2026-05-16 (rev 3) — Event bus eliminado completo (IQ1)

- **Considered:** mantener event emitter genérico simple (~50 LOC) para hooks de UI futuros.
- **Chose:** eliminar completo. `eventBus.ts` y `events.ts` se borran.
- **Why:** YAGNI. v4.1 lineal sin triggers reactivos. Acumular ~50 LOC ahora para algo que quizá nunca se use es exactamente el tipo de tech debt que la sustracción radical quiere evitar. Si vuelve la necesidad en set 2, reintroducir es 1h de trabajo.

### 2026-05-16 (rev 3) — Type guards manuales para validación de YAML (IQ2)

- **Considered:** instalar `zod`.
- **Chose:** type guards manuales (~30 LOC).
- **Why:** cartas tienen ~5 campos + condicionales con 3 tipos. zod justifica su peso (50KB bundle, mejor DX, mensajes de error) en schemas complejos con muchas relaciones. No es nuestro caso. Para un PWA donde el bundle size importa, no compensa.

### 2026-05-16 (rev 3) — Animación de revelado con Framer Motion mínima al final de Phase 3 (IQ4)

- **Considered:** sin animación (transición instantánea).
- **Chose:** anim mínima — carta rotate Y 180deg (~400ms), atributos suben con tween 300ms.
- **Why:** anim de carta dando vuelta es polish real. Pero **no es lo que define si el juego funciona**. Hacerla **al final de Phase 3**, no al principio. **Política explícita: si Phase 3 se atrasa, bajar a "sin animación" sin culpa.** Mejor un PlayView feo pero completo que uno bonito y a medias.

### 2026-05-16 (rev 3) — Modal confirm para Eclipse, no negociable (IQ5)

- **Considered:** botón directo sin confirm.
- **Chose:** modal confirm con explicación de efectos.
- **Why:** Eclipse es 1×/partida, irreversible. Click accidental es catastrófico para el playtest — el jugador pierde la partida y no sabe por qué. El costo del modal (1s de fricción intencional) está exactamente en el momento en que la fricción ayuda.

### 2026-05-16 (rev 3) — Tooltip de bonus de planeta con toggle (IQ6)

- **Considered:** tooltip siempre activo / sin tooltip.
- **Chose:** tooltip on hover de carta en mano, **con toggle "Mostrar tooltips de ayuda" en HomeView, default ON**.
- **Why:** sin toggle, le quita densidad a las partidas avanzadas. Sin tooltip, onboarding más difícil. El toggle resuelve los dos casos con 5 LOC: ON para las primeras 2-3 partidas (onboarding), OFF cuando el jugador interioriza la regla y quiere "competencia mental pura".

### 2026-05-16 (rev 3) — IA con delay 150ms, sin texto (IQ7)

- **Considered:** delay 0.8s con spinner + texto "El otro héroe lee el cosmos…" (default original) / sin delay.
- **Chose:** delay 150ms, **sin** texto.
- **Why:** 0.8s acumula 6-12 esperas de delay artificial por partida = 5-8% del tiempo total tirado. En un juego de 10-15 min que va a playtestearse muchas veces, eso es mucho. La "sensación de duelo" no la da un setTimeout falso — el jugador lo detecta y se siente condescendido. 150ms evita que frames colapsen pero no es perceptible como "espera". El texto del flavor se lee cute al principio y como ruido a la 5ta partida.

### 2026-05-16 (rev 3) — Replay/spectator out of scope; "Copiar log" como stretch en Phase 4 (IQ8)

- **Considered:** guardar log YAML al fin de partida con UI de replay.
- **Chose:** out of scope. **Stretch si Phase 4 termina antes:** botón "Copiar log" en `GameOverModal` que dumpea JSON de actions al clipboard (~5min de trabajo).
- **Why:** replay viewer es feature grande, no aporta al playtest inicial. Pero un dump simple del log al clipboard tiene valor enorme para debug — cuando algo se rompe en playtest, pegás el JSON en un issue y reproducís. **No prometido en spec**, solo si queda tiempo. Sin culpa si no llega.

### 2026-05-15 (rev 2) — YAMLs de cards-v4.1 migrados a formato estructurado

- **Considered:** mantener `efecto: string` y parsear al cargar (IQ3 opción a, default original).
- **Chose:** migrar YAMLs a campos estructurados (`fuerzaDelta`, `sideEffect`). Cierra IQ3.
- **Why:** parsing de strings es tarpit (variantes textuales, condicionales nuevas no contempladas, errores silenciosos). Migración es chica (~30 cartas) y aprovecha que todo el motor se reescribe. Interpreter más simple, menos bugs, less surface area. Campo `efectoTexto` opcional se preserva para mostrar en UI.

### 2026-05-15 (rev 2) — Walkthrough test dividido en estructural + numérico

- **Considered:** un solo test que reproduce números exactos de §11 con seeds determinísticos.
- **Chose:** dos tests separados. Estructural (obligatorio) valida flujo (Eclipse T7, Ana gana 2-1) sin atarse a números. Numérico (opcional, skipped) valida cálculo paso a paso con cartas mock.
- **Why:** los números exactos del walkthrough dependen del balance de cartas + heurísticas de IA. Cualquier ajuste futuro rompería el test numérico sin que indique un bug real. El test estructural sobrevive re-balanceos y sigue probando que el motor funciona end-to-end.

### 2026-05-15 (rev 2) — Política de fallback por Phase

- **Considered:** ejecutar todas las Phases secuencialmente, dejar al agente decidir si avanza ante fallas.
- **Chose:** detener ejecución y reportar al humano si el DoD de cualquier Phase no se cumple.
- **Why:** evita CI verde por casualidad con tests críticos skipeados. Cada Phase tiene DoD explícito; si falla, hay algo mal que requiere atención humana antes de seguir.

### 2026-05-15 — Stack técnico: mantener Vite + React + Zustand + Tailwind + framer-motion + vitest + fast-check

- **Considered:** migrar a Next.js / SvelteKit / Solid.
- **Chose:** mantener stack actual.
- **Why:** funciona, tests verdes, dev experience conocida. No hay razón para cambiar.

### 2026-05-15 — PixiJS DESINSTALADO

- **Considered:** mantener PixiJS para canvas del tablero (heredado del stack v3.0 que apuntaba a "sector estelar").
- **Chose:** eliminar `pixi.js` del package.json.
- **Why:** v4.1 visualmente simple — cartas reveladas + contadores de atributos. DOM + Tailwind alcanza. Sustracción radical.

### 2026-05-15 — Eliminar Strategy Pattern por raza

- **Considered:** mantener strategies/ para escalabilidad futura (más razas en set 2).
- **Chose:** eliminar completo.
- **Why:** v4.1 no tiene "counter wheel por mecánica firma de raza". La identidad de raza vive en el data del pool (cartas + héroe). Si vuelve la idea en set 2, se reintroduce con nueva spec.

### 2026-05-15 — Eliminar event bus complejo

- **Considered:** mantener event bus simple para extensibilidad.
- **Chose:** simplificar — v4.1 es lineal (cada turno tiene flujo fijo). Si después necesitamos triggers, reintroducir.
- **Why:** event bus fue clave en v3.0 para resolver mecánicas reactivas (Külen) en orden correcto. v4.1 no tiene eso.

### 2026-05-15 — Lib YAML: usar `yaml` (ya instalada 2.8.4)

- **Considered:** js-yaml o reescribir parser manual.
- **Chose:** `yaml` (ya en deps).
- **Why:** no instalar deps extras. Funciona en Node y browser.

### 2026-05-15 — Validación de YAML: tipo TypeScript manual + assert runtime

- **Considered:** zod / yup / ajv.
- **Chose:** validación manual con type guards.
- **Why:** sustracción radical. Tipos son simples (cartas tienen ~5 campos). zod agrega 100KB al bundle sin necesidad.

### 2026-05-15 — Hot-seat con PrivacyShield se preserva

- **Considered:** simplificar Hot-seat a "ambos jugadores ven todo siempre".
- **Chose:** preservar PrivacyShield para mantener la asimetría informacional clave del juego (acción oculta + planeta secreto).
- **Why:** v4.1 es **fundamentalmente** un juego de información asimétrica. Sin shield en Hot-seat, no funciona el bluff.

### 2026-05-15 — Orden de turno: acción primero, premonición después

- **Considered:** premonición primero (más común en juegos de lectura mutua).
- **Chose:** acción primero (como dice §7 de GAME-RULES v4.1).
- **Why:** decisión del SPEC de diseño. Open question Q1 puede invertir en playtest, pero implementamos el default documentado.

### 2026-05-15 — Cartas de Planeta como pool fijo (no aleatorio)

- **Considered:** sortear 3 planetas de un pool más grande cada partida (open question Q2).
- **Chose:** pool fijo (los mismos 3 por tramo).
- **Why:** Q2 default propuesto. Más simple, predecible.

### 2026-05-15 — Cap de mano: 7

- **Considered:** sin cap, cap 5.
- **Chose:** cap 7 (Q5 default).
- **Why:** Q5 default. Heredado de TCGs clásicos.

### 2026-05-15 — Validación de carta runtime

- **Considered:** asumir YAMLs son válidos (sin checks).
- **Chose:** validar al cargar — coste 1-6, fuerza ≥ 0, categoría ∈ {Atq, Def, Rit}, condicionales bien formados.
- **Why:** durante desarrollo del playtest los YAMLs pueden corromperse manualmente. Mejor fallar temprano con mensaje claro.

---

## Test plan / Definition of Done

### Engine tests

- **`initialState.test.ts`**: setup produce estado válido (atributos 0/0/0, héroe Neutral, mano 4, mazo 16, RNG seedable).
- **`reducer.test.ts`**:
  - START_GAME → state inicial.
  - MULLIGAN → re-baraja mano.
  - SELECT_PLANET → asigna planetElegido sin revelar al oponente.
  - DRAW → mano +1, mazo -1.
  - PLAY_HIDDEN → carta sale de mano, va a accionesPendientes, energía -coste.
  - PLAY_HIDDEN si no puede pagar → declara "Pasa".
  - DECLARE_PREMONICION → premoniciones[player] = Categoria.
  - REVEAL → ejecuta interpreter, suma a atributos correctos, side effects aplicados, avanza turno.
  - CLOSE_TRAMO → compara atributos, avanza héroe(s), reset accionesPendientes y premoniciones para siguiente tramo. Atributos NO se resetean.
  - INVOKE_ECLIPSE → marca flag, oponente roba 1 extra, próximo REVEAL aplica ×2.
  - END_GAME → calcula tally 2-de-3, declara ganador.
- **`interpreter.test.ts`**:
  - Cláusula `premonicion_propia` activa si `miPremonicion === valor` → aplica `fuerzaDelta` y/o `sideEffect`.
  - Cláusula `premonicion_oponente` activa si `oponentePremonicion === valor` → idem.
  - Cláusula `premonicion_acierta` activa si `oponentePremonicion === card.categoria` → idem.
  - Bonus de planeta (+1) si `card.categoria === planetElegido.categoria` **Y** `tramo !== 'sexto_sol'`.
  - Bonus de planeta NO se aplica en Sexto Sol aunque haya planet elegido residual.
  - Habilidad de héroe Tezhal Despertado: +1 fuerza a cartas Atq.
  - Habilidad de héroe Würon Despertado: +1 fuerza al acertar premonición.
  - Múltiples condicionales se suman (orden listado).
  - `sideEffects` (descarte, robo, anulación) se devuelven en array, no se aplican dentro del interpreter.
  - Fuerza final: `Math.max(0, ...)` — nunca negativa.
- **`invariants.test.ts` (fast-check property tests):**
  - Fuerza de cualquier carta nunca < 0 (anulaciones llevan a 0 mínimo).
  - Energía siempre === número de turno.
  - Máximo 7 turnos por partida.
  - Eclipse máximo 1 vez por partida.
  - Atributos del héroe nunca decrecen.
  - Héroe solo avanza si gana el atributo del planeta-elegido.
  - Hand size ≤ 7.
- **`mechanics.test.ts`**:
  - Eclipse aplica ×2 SOLO al atributo correspondiente.
  - Bonus de planeta solo activo en Nebulosa y Estrellas (NO Sexto Sol).
  - Bonus de planeta solo a cartas de la categoría del planeta-elegido.
  - Habilidades pasivas Despertado/Ascendido se activan al ganar atributo correspondiente, persisten resto de partida.
- **`replay.test.ts`**: misma seed + misma secuencia de actions = log idéntico (determinismo).
- **`scriptedAI.test.ts`**:
  - Mulligan: si mano sin coste ≤ 2 → mulligan.
  - Elección de planeta: distribución 70/15/15 según mano.
  - Premonición: tracking de últimos 3 turnos del oponente.
  - Elección de acción: max fuerza esperada paid.
  - Eclipse: solo invoca si está en Sexto Sol Y va perdiendo Y fuerza×2 ≥ 5.
- **`walkthrough.test.ts` (nuevo)**: dos tests separados:
  - **Estructural (obligatorio):** con seeds determinísticos para RNG + scripted moves para Ana (puppet IA), validar que (a) Ana invoca Eclipse en T7, (b) la partida termina al final del T7, (c) Ana gana el duelo 2-1, (d) ambos héroes llegan a Ascendido. **No** validar números exactos de atributos. Este test sobrevive re-balanceos de cartas.
  - **Numérico (opcional, `it.skip` por default):** con cartas mock controladas y scripted moves para ambos jugadores, validar paso a paso que el interpreter calcula los números del §11 (Ana 15/14/5, Bruno 5/11/17). Activable manualmente cuando se quiera validar el motor numéricamente. No corre en CI por default.

### UI smoke tests

- **HomeView**: renders, selector de raza/modo/mazo funciona, botón Iniciar transiciona.
- **PlayView**: muestra 3 atributos visibles, mano del jugador, botones de premonición. Click en carta + premonición + revelar → atributos actualizados.
- **GameOverModal**: muestra tabla F/R/Res, indicador de ganador por atributo, tally final.

### Otros

- **Portability test**: `src/engine/` no importa ninguna lib del DOM ni del browser.
- **Coverage ≥ 85% en `src/engine/`**.
- **CI verde**: lint + typecheck + test + build + validate-cards (este último adaptado a schema v4.1).
- **`pnpm dev` jugable**: arrancar el dev server, jugar Tezhal-Aggro vs Würon-Control en modo vs IA, terminar la partida con duelo final correcto.
- **`pnpm dev` Hot-seat**: jugar la misma partida con 2 humanos en modo Hot-seat, validar PrivacyShield funciona y planeta-secreto + acción oculta se preservan.
- **v3.0 archive verification**: `find src/strategies src/engine/derive src/engine/mechanics src/data/primitives -type f` retorna vacío.
- **Documentación**: ARCHITECTURE.md y BACKLOG.md actualizados a v4.1. README.md mantiene contexto general.

---

## Phases

**Política de fallback (aplicable a todas las Phases):** si el DoD de una Phase no se cumple (tests rojos, coverage bajo threshold, lint/typecheck error, sim divergente sin documentar), **detener ejecución y reportar al humano antes de avanzar**. No omitir/skipear tests para hacer pasar CI. No avanzar a la siguiente Phase con rojos.

### Phase 1 — Engine (1.5 sesiones)

**Deliverable:** state + reducer + interpreter + loader + tests engine pasando.

0. **Migrar YAMLs de `docs/playtest/cards-v4.1/*.yaml` a formato estructurado.** Para cada carta de Acción: parsear el campo `efecto: string` existente y producir `fuerzaDelta?: number` y/o `sideEffect?: {...}` en cada condicional. Mantener el texto original como `efectoTexto?: string` (opcional, solo para UI). Ejecutar como script one-shot, commitear el resultado, validar count y schema. Este step **debe completarse antes** de tocar `interpreter.ts`.
1. Reescribir `types.ts` con tipos v4.1.
2. Reescribir `initialState.ts`.
3. Crear `actions.ts`.
4. Reescribir `reducer.ts`.
5. Reescribir `interpreter.ts` (lee directamente los campos estructurados, sin parser de strings).
6. Crear `data/cards/loader.ts` y `data/decks/loader.ts` (carga + validación).
7. Reescribir tests engine: initialState, reducer, interpreter, invariants, replay, mechanics.
8. **Reconciliar walkthrough §11 vs pool de cartas.** Antes de escribir `walkthrough.test.ts`, verificar que los stats de las cartas referenciadas en el §11 de `GAME-RULES.md` (Ana vs Bruno) coinciden con los stats actuales en `cards-v4.1/*.yaml`. Si difieren: el **pool YAML es canónico**. Actualizar la descripción del walkthrough en `GAME-RULES.md` con los stats reales del pool. Si el resultado final cambia materialmente (Ana ya no gana 2-1), reportar al humano antes de continuar — puede ser señal de que el balance del pool no es coherente con el flujo del walkthrough.
9. Crear `walkthrough.test.ts` (estructural obligatorio + numérico skipped).
10. Eliminar archivos v3.0 listados arriba.
11. Verificar portability test pasa.

**DoD Phase 1:** `pnpm test` verde, coverage ≥ 85% en engine, walkthrough estructural reproducible. **Si no se cumple: detener y reportar antes de Phase 2.**

### Phase 2 — scriptedAI (0.5 sesión)

**Deliverable:** IA scripted v4.1 + tests determinismo.

1. Reescribir `ai/scriptedAI.ts` con heurísticas §7.5.
2. Tests scriptedAI: mulligan, elección planeta, premonición, elección acción, eclipse.
3. Tests integración: simular 5 partidas con scriptedAI vs scriptedAI seeds 1001-1005, comparar contra SIM-RESULTS-v4.1.md.

**DoD Phase 2:** `pnpm test` sigue verde. Las 5 sims auto-validation coinciden con los resultados documentados (o se documenta divergencia en SIM-RESULTS-v4.1.md). **Si no se cumple: detener y reportar antes de Phase 3.**

### Phase 3 — UI (1 sesión)

**Deliverable:** PlayView + HomeView + modales funcionando.

1. Reescribir `gameStore.ts` (Zustand v4.1).
2. Reescribir `HomeView.tsx` (incluye toggle "Mostrar tooltips de ayuda", default ON).
3. Reescribir `PlayView.tsx` (sin animación todavía — usar transiciones instantáneas).
4. Crear `GameOverModal.tsx`, `PlanetChoiceModal.tsx`, `EclipseConfirmModal.tsx` (con confirm modal, IQ5), `TramoClosingModal.tsx`.
5. Crear `CardView.tsx` (con tooltip de bonus condicionado al toggle, IQ6), `HeroBadge.tsx`, `PlanetCard.tsx`, `AttributeCounters.tsx`.
6. Adaptar `MiniCard.tsx`, `CardArt.tsx`.
7. Tests UI smoke.
8. Verificar `pnpm dev` jugable (Tezhal-Aggro vs Würon-Control, vs IA y Hot-seat).
9. **Animación de revelado (Framer Motion mínima, IQ4):** carta rotate Y 180deg + atributos tween 300ms. **Hacer este step al final.** Si el estimado de la Phase ya está saturado, bajar a "sin animación" sin culpa — `pnpm dev` jugable con transiciones instantáneas es DoD suficiente.

**DoD Phase 3:** dev server muestra partida completa vs IA Tezhal-Aggro vs Würon-Control. Hot-seat también funciona. Animación de revelado nice-to-have, no bloqueante. **Si no se cumple: detener y reportar antes de Phase 4.**

### Phase 4 — Cleanup + docs + CI (0.5 sesión)

**Deliverable:** repo limpio, docs actualizadas, CI verde, commit + push, spec movida a shipped/.

1. Limpiar package.json (desinstalar pixi.js, otros que no se usan).
2. Actualizar ARCHITECTURE.md a v4.1.
3. Actualizar BACKLOG.md (cerrar items v3.0, agregar items v4.2+).
4. Actualizar README.md.
5. Verificar CI verde end-to-end.
6. Commit + push.
7. `git mv docs/specs/engine-v4.1-migration.md docs/specs/shipped/`.

**Stretch (si Phase 4 termina antes del estimado, IQ8):** agregar botón "Copiar log" en `GameOverModal` que copia al clipboard el JSON de las actions ejecutadas durante la partida (~5min de trabajo, valor enorme para debug en playtest). **No bloqueante.**

**DoD Phase 4:** commit final pusheado, CI green, spec shipped. **Si CI no pasa: detener, no shippear el spec.**

---

## Open questions

> Todas las IQs cerradas en rev 3 (2026-05-16). Ver Decisions log para el detalle de cada una.

### IQ1. [CERRADA en rev 3] — Event bus eliminado completo

**Resuelta:** YAGNI. v4.1 lineal sin triggers reactivos. `eventBus.ts` y `events.ts` se borran. Si vuelve la necesidad en set 2, reintroducir es 1h de trabajo.

### IQ2. [CERRADA en rev 3] — Type guards manuales (sin zod)

**Resuelta:** cartas con ~5 campos + condicionales con 3 tipos = type guards ~30 LOC. zod no compensa 50KB de bundle para un PWA donde el bundle size importa.

### IQ3. [CERRADA en rev 2] — Condicionales como campos estructurados

**Resuelta:** YAMLs migrados a `fuerzaDelta` + `sideEffect`. Ver Decisions log "YAMLs de cards-v4.1 migrados a formato estructurado".

### IQ4. [CERRADA en rev 3] — Animación mínima al final de Phase 3

**Resuelta:** carta rotate Y 180deg (~400ms) + atributos tween 300ms. Hacer **al final de Phase 3**, no al principio. **Si Phase 3 se atrasa, bajar a "sin animación" sin culpa** — mejor PlayView feo pero completo que bonito y a medias.

### IQ5. [CERRADA en rev 3] — Modal confirm para Eclipse, no negociable

**Resuelta:** Eclipse es 1×/partida, irreversible. Click accidental es catastrófico para el playtest. El costo del modal (1s de fricción) está exactamente en el momento en que la fricción ayuda.

### IQ6. [CERRADA en rev 3] — Tooltip con toggle

**Resuelta:** tooltip on hover de carta en mano (`+1 fuerza por tu planeta-elegido` si la categoría coincide). **Setting "Mostrar tooltips de ayuda" en HomeView, default ON.** ~5 LOC, resuelve onboarding sin quitar densidad a partidas avanzadas.

### IQ7. [CERRADA en rev 3] — Delay 150ms, sin texto

**Resuelta:** delay 150ms (no 0.8s) — evita colapso de frames pero no es perceptible como "espera". **Sin** texto "el otro héroe lee el cosmos…" (cute al principio, ruido a la 5ta partida). 0.8s acumularía 6-12 esperas por partida = 5-8% del tiempo total tirado, inaceptable cuando se va a playtestear muchas veces.

### IQ8. [CERRADA en rev 3] — Out of scope, con stretch opcional en Phase 4

**Resuelta:** spectator/replay queda out of scope. **Stretch en Phase 4 si termina antes del estimado:** botón "Copiar log" en `GameOverModal` que copia al clipboard el JSON de las actions ejecutadas (~5min de trabajo, valor enorme para debug en playtest). **No prometido en spec** — solo si queda tiempo, sin culpa si no.

---

## Criterios de aceptación

El refactor está completo cuando:

- ✅ `pnpm dev` arranca y permite jugar partida completa Tezhal-Aggro vs Würon-Control (vs IA y Hot-seat).
- ✅ `pnpm test` pasa todos los tests, coverage engine ≥ 85%.
- ✅ `pnpm build` no rompe.
- ✅ `pnpm lint` verde.
- ✅ `pnpm typecheck` verde.
- ✅ CI green en GitHub Actions.
- ✅ Walkthrough §11 reproducible con tests determinísticos.
- ✅ `find src/strategies src/engine/derive src/engine/mechanics src/data/primitives src/data/cards -type f 2>/dev/null` → vacío (v3.0 limpio).
- ✅ `package.json` no incluye `pixi.js`.
- ✅ ARCHITECTURE.md, BACKLOG.md, README.md actualizados.
- ✅ Spec movida a `docs/specs/shipped/engine-v4.1-migration.md`.
- ✅ Commit final pusheado con CI verde.

---

## Links

- Spec de diseño v4.1: `docs/specs/peregrinaje-v4.1.md` (status: approved)
- Pool de cartas: `docs/playtest/cards-v4.1/`
- Mazos: `docs/playtest/decks-v4.1/`
- Reglas: `GAME-RULES.md`
- Lore: `CANON-LORE.md` §13
- Open questions diseño: `OPEN-QUESTIONS-v4.1.md`
- Simulaciones: `SIM-RESULTS-v4.1.md`
- v3.0 archive: `docs/archive/GAME-RULES-v3.0.md`, `docs/archive/cards-v3.0/`
- v4.0 archive: `docs/archive/GAME-RULES-v4.0.md`
