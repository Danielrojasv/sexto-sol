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

**Sexto Sol** es un TCG (Trading Card Game) PVP de combate directo entre **cuatro razas espaciales inventadas** — **Q'ralan, Würon, Tezhal, Zaqe** — descendientes de civilizaciones ancestrales de un sistema estelar. Cada raza pelea según una **categoría de mecánica** distinta (Reactiva / Iniciativa / Acumulativa / Post-combate), y el orden natural de resolución produce un counter wheel emergente.

Las culturas precolombinas reales (Mapuche, Inca, Mexica, Muisca, Maya, etc.) **NO son razas jugables** — aparecen como ecos resonantes en el lore (ver `CANON-LORE.md`). El proyecto se construye dentro de un **bucle causal cerrado** tipo Evangelion/Dark/Steins;Gate: el virus que infecta a las civilizaciones fue traído del futuro al pasado por los Sabios que intentaban salvarlas.

### Pilares de diseño (no negociables)

1. **PVP** (jugador vs jugador, async o realtime — TBD)
2. **Coleccionable** (sobres + crafting; sin singles market estilo MTG)
3. **Soft P2W** estilo Marvel Snap / LoR — F2P jugable competitivamente.
4. **Counter wheel emergente**: el orden de resolución entre categorías de mecánica (Reactiva→Iniciativa→Acumulativa→Post-combate) produce el counter wheel naturalmente. **Sin reglas hardcodeadas de tipo "raza X vence raza Y"**.
5. **Habilidades duales Luz/Sombra** en Legendarias: Sombra activa bajo condición específica de la mecánica firma de la raza.
6. **3 Edades como escalada de poder narrativo**: Edad I firma cuesta +1, Edad II costo normal + Resonancia, Edad III firma x2 + daño directo desde mano. Transición global turno 5/9.
7. **Sin rotación tipo Standard**: las cartas no se descartan por tiempo. Meta se mantiene fresco vía nerfs/buffs.
8. **Energía territorial con planetas no conquistables**: planetas son recursos compartidos con Dones únicos; activarlos cuesta 1 energía y otorga +1 esa fase. No hay control persistente de planeta.

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

## 2. Reglas del juego (high-level)

**El detalle vivo está en `GAME-RULES.md` (v2.0) y el lore en `CANON-LORE.md`.** Acá el resumen para que Claude Code pueda razonar sin abrir esos archivos.

- **Win condition**: destruir el mundo natal del oponente (HP 20). También gana por decking out o concesión.
- **Mazos**: 30 cartas de UNA raza, máx 3 copias (Legendarias 1).
- **Mano inicial**: 4 cartas (5 para segundo jugador). Mulligan: una vez, mano completa, 1 al fondo. Cap mano: 7.
- **Recurso (Energía Territorial)**: no acumulable entre turnos. Mundo natal +1/turno. Planetas neutrales **no se conquistan** — activarlos cuesta 1, otorga +1 esa fase y agota el planeta hasta tu siguiente turno. Cada planeta tiene un **Don** único revelado al setup (12-16 Dones distintos en el set inicial; cada partida usa 3).
- **Turnos por fases**:
  1. **Recolección** — recibís energía + robás 1
  2. **Despliegue** — jugás cartas (Naves/Armas/Tecnologías/Reliquias)
  3. **Combate** — atacás. Combate simultáneo, daño = fuerza. Bloqueo solo via keyword **Bastión**; daño residual solo via **Desgarro**
  4. **Regroup** — mover naves gratis (en Despliegue cuesta 1)
  5. **Vigilia** — habilidades activadas y respuestas. Energía no gastada se pierde
- **3 Edades** (transición global turno 5 → II, turno 9 → III):
  - **Edad I "El Despertar"**: firma cuesta +1, stats base
  - **Edad II "Las Estrellas Recuerdan"**: firma costo normal, **Resonancia** activa
  - **Edad III "El Sexto Sol"**: firma x2, **daño directo desde la mano** habilitado
- **4 Razas** (cada una con una categoría de mecánica):
  - **Q'ralan** "Hijos del Sol Pétreo" — Acumulativa. Firma: **Formación Solar** (+1 fuerza por cada otra nave Q'ralan en juego)
  - **Würon** "Pueblos del Sur Profundo" — Reactiva. Firma: **Külen** (cada daño recibido = +1 fuerza permanente)
  - **Tezhal** "Devotos del Corazón Ardiente" — Iniciativa. Firma: **Ignición** (sacrificás nave propia para potenciar otra acción)
  - **Zaqe** "Mercaderes del Lago Cósmico" — Post-combate. Firma: **Refluencia** (naves derrotadas vuelven al fondo del mazo, -1 al ser robadas de nuevo)
- **Sistema de Resolución por Naturaleza de Mecánica**: toda interacción simultánea resuelve en orden Reactiva→Iniciativa→Acumulativa→Post-combate. **Counter wheel emergente** (Würon > Q'ralan > Tezhal > Zaqe > Würon) sin reglas hardcoded por raza. Keyword **Premonición** rompe el orden con preparación de mazo.
- **Héroe**: 1 por mazo. Edad I vive en mundo natal (hero power 1-2 activadas/turno). Edad II despliega como Nave Legendaria. Edad III ataca natales. Si muere vuelve al natal con 1 turno de cooldown.

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
