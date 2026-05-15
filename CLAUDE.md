# CLAUDE.md — sexto-sol

Contexto del proyecto para Claude Code. Léelo antes de tocar código.

---

## 0. Autoridad narrativa — Arco del Jugador

> **CRÍTICO**: Antes de cualquier decisión narrativa (flavor text, cinemáticas, eventos, marketing, cartas legendarias, expansiones), validá contra `docs/lore/arco-del-jugador.md`. Es la biblia narrativa trans-expansiones. Cualquier decisión narrativa futura tiene que pasar los **5 filtros** del documento:
>
> 1. ¿Respeta la etapa del arco en la que estamos?
> 2. ¿Preserva la disciplina narrativa requerida en esta etapa?
> 3. ¿Acumula sin sustituir?
> 4. ¿Se puede leer en su propia capa sin necesitar conocimiento futuro?
> 5. ¿Le da al jugador material para inferir, no solo material para consumir?
>
> Si no pasa los 5, se ajusta o se posterga. Las **6 reglas transversales** (descubrimiento del jugador, capas independientes, pistas retroactivas, virus sin voz, Sabios no actúan, Tierra-tumba como espejo) son inviolables.

## 1. Spec-Driven Development (SDD)

Specs en `docs/specs/`. Antes de empezar feature ≥ 3 días, que toque mecánicas centrales del juego, normativa de balance, integración nueva, o decisiones de arquitectura del engine, escribir spec usando `docs/specs/_template.md`.

**Proceso canónico** (mecánica + lecciones de sprints reales): `~/.claude/skills/sdd/PROCESS.md`. El skill `sdd` activa automáticamente el flujo cuando el usuario pide armar una spec.

**Convención:**

- Antes de feature grande, leer `docs/specs/<feature>.md` si existe; si no existe pero el feature lo amerita, ofrecer crear uno usando el template.
- Cualquier cambio de scope durante el PR actualiza la spec en el mismo PR.
- Al cerrar feature, mover spec a `docs/specs/shipped/`.
- PRs grandes linkean la spec en el body.
- **Para cambios de balance o nuevas mecánicas centrales**: la spec es OBLIGATORIA aunque sea pequeña. Cambios incorrectos de balance pueden romper años de iteración.

**Spec viva:** `docs/specs/design-v0.md` es el documento maestro del juego. Iteramos sobre ese hasta que el set base esté lockeado y se mueva a shipped/.

---

## 1. Contexto del proyecto

**Sexto Sol** es un juego PVP de cartas entre **cuatro razas espaciales inventadas** — **Q'ralan, Würon, Tezhal, Zaqe** — descendientes de civilizaciones ancestrales de un sistema estelar. Desde la versión v4.0 (mayo 2026), la mecánica del juego es un **duelo de lectura mutua** llamado "Peregrinaje del Sexto Sol", donde cada jugador progresa por 3 estaciones cosmológicas (Nebulosa, Estrellas, Sexto Sol) declarando **Premoniciones públicas** sobre la categoría de Acción que el oponente jugará y respondiendo con una **Acción oculta** propia. Las cartas tienen efectos condicionales según ambas declaraciones. Inspiración estructural: Marvel Snap. Innovación propia: Acción oculta + Premonición pública.

> v4.0 reemplazó a v3.0, que era un TCG de combate clásico (HP, ataque/defensa con fuerza, counter-wheel explícito). v3.0 quedó archivada en `docs/archive/GAME-RULES-v3.0.md`. El código TypeScript en `src/` todavía implementa v3.0 — la migración del engine a v4.0 es un refactor futuro pendiente de su propia spec. v4.0 está **diseñada para playtest manual** (impresión de YAMLs en `docs/playtest/cards-v4.0/`).

Las culturas precolombinas reales (Mapuche, Inca, Mexica, Muisca, Maya, etc.) **NO son razas jugables** — aparecen como ecos resonantes en el lore (ver `CANON-LORE.md`). El proyecto se construye dentro de un **bucle causal cerrado** tipo Evangelion/Dark/Steins;Gate: el virus que infecta a las civilizaciones fue traído del futuro al pasado por los Sabios que intentaban salvarlas.

### Pilares de diseño (no negociables)

1. **PVP** (jugador vs jugador, async o realtime — TBD)
2. **Coleccionable** (sobres + crafting; sin singles market estilo MTG)
3. **Soft P2W** estilo Marvel Snap / LoR — F2P jugable competitivamente.
4. **Counter emergente vía interacción de condicionales**, no por reglas hardcoded de tipo "raza X vence raza Y". El SPEC v4.0 quitó el counter-wheel explícito de v3.0; ahora el counter cae como propiedad de cómo se cruzan las cláusulas (`premonicion_propia`, `premonicion_oponente`, `premonicion_acierta`) de las cartas en juego.
5. **Sustracción radical sobre agregado.** Cada nueva regla candidata debe primero responder: _¿puedo resolverlo eliminando algo en vez de agregar?_ La meta v4.0: el juego se aprende en menos de 3 minutos y se juega en 10-15.
6. **Las facciones se diferencian por cómo se sienten al jugarse**, no por tabla de bonus contra otras razas. Tezhal = aggro/sacrificio/comprometerse. Würon = control/resiliencia/lectura. Q'ralan y Zaqe vuelven en set 2.
7. **Sin rotación tipo Standard.** Las cartas no se descartan por tiempo. El meta se mantiene fresco vía nerfs/buffs (más eventualmente sets nuevos).
8. **3 planetas, no recursos compartidos.** v4.0 eliminó la capa de planetas neutrales con Dones de v3.0. Los planetas son las 3 estaciones del peregrinaje, con cuenta de fuerza independiente. Solo el Sexto Sol decide la partida.

### Stack técnico

| Componente              | Tecnología                                                       |
| ----------------------- | ---------------------------------------------------------------- |
| Lenguaje                | TypeScript 5+                                                    |
| Build                   | Vite                                                             |
| Engine                  | Reducer puro event-driven (port del kernel de myl-game)          |
| RNG                     | Seedable (`src/engine/rng.ts`)                                   |
| Test                    | Vitest + fast-check (property tests para invariantes)            |
| UI shell                | React 18 (web-first PWA — mobile/native después)                 |
| Canvas (sector estelar) | **PixiJS** (no Konva — performance superior para muchos sprites) |
| State management        | **Zustand** (lightweight)                                        |
| Styling                 | **Tailwind v4**                                                  |
| Animaciones de cartas   | **Framer Motion**                                                |
| Package manager         | pnpm                                                             |
| Node                    | 22+                                                              |

---

## 2. Reglas del juego (high-level v4.0)

**El detalle vivo está en `GAME-RULES.md` (v4.0) y el lore en `CANON-LORE.md` (§13 cubre el Peregrinaje).** Acá el resumen para que Claude Code pueda razonar sin abrir esos archivos.

- **Win condition**: mayor fuerza acumulada al cierre del **Sexto Sol** (último tramo). La fuerza de planetas previos NO se traspasa — cuenta independiente por planeta.
- **Estructura de partida**: 5-7 turnos en 3 tramos:
  - **Nebulosa** (turnos 1-2). Mismo planeta para ambos.
  - **Estrellas** (turnos 3-4). Cada jugador elige su planeta-Estrella de un pool de 3.
  - **Sexto Sol** (turnos 5-7, máx 3 turnos; terminable antes vía Eclipse).
- **Mazo**: 20 cartas de UNA raza, máx 2 copias por carta.
- **Mano inicial**: 4 cartas. Mulligan permitido una vez (re-baraja y roba 4).
- **Energía**: igual al número de turno (T1=1, …, T7=7). No acumula entre turnos.
- **Turno (fase compuesta única)**:
  1. Robo (ambos roban 1).
  2. Energía actualizada.
  3. Premonición PÚBLICA: ambos declaran qué categoría (Ataque/Defensa/Ritual) cree que jugará el oponente.
  4. Acción OCULTA: cada uno juega 1 carta boca abajo pagando su coste.
  5. Revelado simultáneo.
  6. Acumulación de fuerza al planeta actual.
- **Cartas de Acción** tienen: nombre, raza, coste 1-6, categoría intrínseca (Ataque/Defensa/Ritual), fuerza base, y hasta 3 cláusulas condicionales:
  - `premonicion_propia`: activa si YO declaré X
  - `premonicion_oponente`: activa si EL OPONENTE declaró X
  - `premonicion_acierta`: activa si la premonición del oponente coincide con la categoría de esta carta
- **Cierre de tramo**: el que acumuló más fuerza domina el planeta. Dominar avanza el estado del Héroe (Neutral → Despertado → Ascendido) que activa habilidades pasivas, y otorga un bonus de entrada al siguiente planeta.
- **Eclipse**: en cualquier turno del Sexto Sol, un jugador puede invocarlo (1 vez por partida). Su Acción cuenta doble, el oponente roba 1 carta extra antes de jugar, y la partida termina al final del turno.
- **Razas activas en v4.0**: **Tezhal** (aggro/sacrificio/comprometerse) y **Würon** (control/resiliencia/lectura). Q'ralan y Zaqe se mantienen en el canon pero no tienen cartas activas hasta el set 2.

### Pool y mazos preconstruidos

- Pool de Acción v4.0: `docs/playtest/cards-v4.0/tezhal.yaml` (15 cartas), `wuron.yaml` (15 cartas).
- Héroes: `docs/playtest/cards-v4.0/heroes.yaml` (4 cartas: 2 razas × 2 estados activos).
- Estrellas: `docs/playtest/cards-v4.0/stars.yaml` (3 cartas: Eco, Sangrante, Silenciosa).
- 4 mazos preconstruidos en `docs/playtest/decks-v4.0/`: tezhal-aggro, tezhal-sacrificio, wuron-control, wuron-ritual.
- Auto-validación inicial documentada en `SIM-RESULTS-v4.0.md`. Preguntas abiertas en `OPEN-QUESTIONS-v4.0.md`. Notas de playtest manual en `PLAYTEST-NOTES-v4.0.md`.

---

## 3. Arquitectura y patrones (OBLIGATORIOS)

### Engine event-driven con reducer puro

- TODO el state del juego pasa por un **reducer puro** `(state, action) => newState`.
- **CERO mutación in-place**.
- **Cero LLM** en el motor de reglas. Mismo input → mismo output. Determinismo total.
- RNG **seedable** desde `src/engine/rng.ts`. Tests de regresión pasan seeds conocidas.
- **Event bus** interno con cola de eventos pendientes. Habilidades triggered escuchan eventos.

### Strategy pattern para reglas

- Cada **raza** implementa una `BaseRaceStrategy` con su categoría de mecánica (`reactive` / `initiative` / `accumulative` / `post_combat`) y su mecánica firma (`Külen`, `Ignición`, `Formación Solar`, `Refluencia`).
- Agregar raza nueva = nueva estrategia, sin tocar las existentes (Open/Closed).
- El orden de resolución del event bus respeta las categorías; el counter wheel cae como propiedad emergente, no como switch hardcoded.

### Service / Repository

Cuando llegue persistencia (cuentas, mazos, partidas):

- Queries SQL en `repository.py` (o equivalente TS).
- Lógica de negocio en `service.ts`.
- Routers / handlers sólo orquestan HTTP, nada de SQL.

### Multi-tenancy

Cuando exista backend con accounts: TODA query DB filtra por `user_id` del jugador autenticado. Sin excepciones.

---

## 3.1 Reglas vivas (OBLIGATORIO leer antes de tocar áreas sensibles)

- [`SECURITY-RULES.md`](./SECURITY-RULES.md) — antes de tocar engine, RNG, persistencia, auth.
- [`PERFORMANCE-RULES.md`](./PERFORMANCE-RULES.md) — antes de tocar reducer, canvas (PixiJS), componentes que renderizan cartas.

Sub-agentes deben consultar estos archivos cuando entren a esas áreas. Si encontrás un patrón inseguro/lento repetido, agregá la regla acá en vez de fixearlo en silencio.

---

## 4. Convenciones de código

- **TypeScript strict** en todo. Sin `any` implícito.
- **Type hints** en todas las funciones (parámetros y retorno).
- **Funciones máx 30 líneas** — si supera, extraer función privada con nombre descriptivo.
- **Archivos máx 300 líneas** — si supera, dividir en submódulos.
- **JSDoc en español** en funciones públicas.
- **Idiomas**:
  - Código (variables, funciones, clases): **inglés**
  - Comentarios de lore/raza: **español** (ej: `// Külen — fuerza vital Würon, +1 fuerza al recibir daño`)
  - JSDoc: **español**
- **Imports** absolutos cuando sea posible (`@/engine/...` style).

### Sensibilidad cultural

Las razas son **inventadas** (Q'ralan, Würon, Tezhal, Zaqe). Inspiradas en cosmovisiones precolombinas pero **distintas y propias**. Las culturas terrestres reales aparecen solo como ecos resonantes en el lore (ver `CANON-LORE.md` §6.3). Antes de cualquier publicación de expansión que toque inspiración indígena, consultar con personas de las comunidades referenciadas — no es obligación legal, es buena práctica creativa y blindaje contra crítica legítima.

---

## 5. Comandos útiles

```bash
# Setup inicial (cuando el repo esté inicializado)
pnpm install

# Desarrollo
pnpm dev             # Vite dev server
pnpm test            # Vitest watch mode
pnpm test:run        # Single run
pnpm test:coverage   # Con cobertura

# Build
pnpm build
pnpm preview

# Lint + typecheck
pnpm lint
pnpm exec tsc -b --noEmit
```

---

## 6. Commit obligatorio al finalizar

> **CRÍTICO**: Todo sub-agente DEBE hacer `git add` + `git commit` de todos sus archivos antes de terminar.

```bash
git add <archivos>
git commit -m "feat(...): descripción

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- Nunca terminar una tarea dejando archivos sin commitear (`git status` debe mostrar limpio)
- Verificar con `git log --oneline -1` que el commit existe antes de reportar la tarea como terminada

---

## 7. Estructura del proyecto

```
sexto-sol/
├── CLAUDE.md              ← este archivo
├── README.md              ← qué es Sexto Sol (público)
├── GAME-RULES.md          ← reglas del juego (vivo)
├── ARCHITECTURE.md        ← engine + patrones técnicos
├── BACKLOG.md             ← roadmap, prioridades
├── docs/
│   └── specs/
│       ├── _template.md
│       ├── README.md
│       ├── design-v0.md   ← spec maestra del diseño del juego
│       └── shipped/       ← specs cerradas
├── src/
│   ├── engine/            ← motor de reglas (reducer puro, event bus)
│   │   ├── types.ts
│   │   ├── rng.ts
│   │   ├── reducer.ts
│   │   └── events.ts
│   ├── strategies/        ← Strategy pattern por facción
│   │   ├── base.ts
│   │   ├── mexica.ts
│   │   ├── inca.ts
│   │   ├── muisca.ts
│   │   └── mapuche.ts
│   ├── data/              ← card data (JSON, una por facción)
│   ├── ui/                ← React components (cuando arranque)
│   └── tests/
├── scripts/               ← tooling (card validators, etc.)
├── package.json
├── tsconfig.json
└── vite.config.ts
```

(Esta estructura es proyectiva — todavía estamos en pre-código).

---

_Sexto Sol — Inspirado en las civilizaciones del Quinto Sol_
