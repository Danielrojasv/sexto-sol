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

**Sexto Sol** es un CCG (Collectible Card Game) PVP de cartas inspirado en una **reimaginación sci-fi de las civilizaciones pre-colombinas**. Las 4 facciones del set base — **Mexica, Inca, Muisca, Mapuche** — desarrollan civilizaciones avanzadas en sus propios planetas dentro de un mismo sistema estelar. El Quinto Sol cósmico está terminando; las civilizaciones pelean por controlar el Sexto.

Subvierte el trope colonialista de "los aliens ayudaron a las civilizaciones pre-colombinas a evolucionar" haciendo que cada civilización desarrollase su tecnología y cosmología independientemente — son aliens entre sí, ningún imperio europeo o externo las "ayudó".

### Pilares de diseño (no negociables)

1. **PVP** (jugador vs jugador, async o realtime — TBD)
2. **Coleccionable** (compra de sobres, crafting con polvo, intercambio TBD)
3. **Soft P2W** estilo Marvel Snap / LoR — F2P jugable competitivamente, monetización vía boosters + battle pass + cosmética. **NO MTG-tier brutal**, NO singles market.
4. **Balance histórico**: el counter wheel respeta hechos históricos reales, no la teoría TCG estándar. Ejemplo: **Mapuche > Inca** (ancla en la Batalla del Maule, donde el Tahuantinsuyu fue detenido por la resistencia mapuche descentralizada).
5. **Diferenciación mecánica de myl**: estructura de turnos por fases similar a myl pero **sin mana automático lineal** (eso es MTG). En su lugar, **energía territorial**: tu energía depende de los planetas que controlás.
6. **Espacial**: el tablero NO es abstracto, es un sistema estelar con planetas. Conquistar territorio = generar más recurso.
7. **Sin rotación tipo Standard**: las cartas no se descartan por tiempo. El meta se mantiene fresco vía nerfs/buffs (modelo Marvel Snap).

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

**El detalle vivo está en `GAME-RULES.md` y `docs/specs/design-v0.md`.** Acá el resumen para que Claude Code pueda razonar sin abrir esos archivos.

- **Win condition**: destruir el **mundo natal** (homeworld) del oponente. HP base 20.
- **Mazos**: 30 cartas (no 60 como MTG, no 100 como Commander; cercano a Snap/LoR).
- **Mano inicial**: 4 cartas, mulligan opcional una vez.
- **Recurso**: **energía territorial**. Tu mundo natal genera 1 energía/turno; cada planeta neutral conquistado +1; cada planeta enemigo conquistado +1 (-1 para el enemigo).
- **Turnos por fases** (estilo myl):
  1. **Recolección** — generás energía + robás 1 carta
  2. **Despliegue** — jugás cartas
  3. **Combate** — declarás ataques contra unidades, planetas neutros o el mundo natal enemigo
  4. **Regroup** — reposicionar naves
  5. **Vigilia** — habilidades activadas (myl-style)
- **3 Edades**: arco narrativo (no rounds independientes). Edad I los mundos natales son intocables; Edad II se pueden atacar; Edad III combate total.
- **4 Facciones** con archetypes distintos:
  - **Mexica** (aggro/sacrificio): mecánica firma `Ofrenda` — sacrificás cartas para potenciar la siguiente jugada
  - **Inca** (control imperial): mecánicas firma `Tributo` (cartas weak alimentan strong) + `Mit'a` (acumulación) + `Acllla` (descuentos)
  - **Muisca** (combo económico): mecánica firma `Sumergir` — cartas de oro al lago, regresan transformadas turnos después
  - **Mapuche** (midrange resiliente): mecánicas firma `Newen` (regeneran/+fuerza con daño) + `Lof` (clan auto-sinérgico sin líder)
- **Counter wheel**: Mexica → Muisca → Mapuche → Inca → Mexica. Matchups cruzados (Mexica vs Mapuche, Inca vs Muisca) son neutrales/skill.

---

## 3. Arquitectura y patrones (OBLIGATORIOS)

### Engine event-driven con reducer puro

- TODO el state del juego pasa por un **reducer puro** `(state, action) => newState`.
- **CERO mutación in-place**.
- **Cero LLM** en el motor de reglas. Mismo input → mismo output. Determinismo total.
- RNG **seedable** desde `src/engine/rng.ts`. Tests de regresión pasan seeds conocidas.
- **Event bus** interno con cola de eventos pendientes. Habilidades triggered escuchan eventos.

### Strategy pattern para reglas

- Cada **facción** implementa una `BaseFactionStrategy` con sus mecánicas firma (`Newen`, `Ofrenda`, etc.).
- Agregar facción nueva = nueva estrategia, sin tocar las existentes (Open/Closed).

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
  - Comentarios de lore/cultura: **español** (ej: `// Newen — fuerza espiritual mapuche`)
  - JSDoc: **español**
- **Imports** absolutos cuando sea posible (`@/engine/...` style).

### Sensibilidad cultural

Las facciones están inspiradas en culturas reales (Mexica, Inca, Muisca, Mapuche). Cuando llegue el momento de:

- Diseñar arte visual
- Escribir flavor text
- Bautizar cartas en lenguas indígenas (mapuzungun, quechua, náhuatl, muysccubun)

…**consultar con personas de esas culturas o expertos académicos**. La premisa del juego (sci-fi reimagining + alien plot subvertido) reduce el riesgo de apropiación, pero no lo elimina. No copiar glifos sagrados directos. No usar nombres de deidades vivas todavía-veneradas sin contexto.

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
