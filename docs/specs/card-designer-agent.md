# Card Designer Agent

**Status:** in-progress
**Owner:** Daniel
**Created:** 2026-05-09
**Related specs:** —

---

## Why

Sexto Sol necesita ~120-150 cartas para el set base (~30 por raza × 4 razas). Diseñar cartas a mano, una por una, no es solo lento — también es propenso a:

- **Romper balance**: cartas con stats que ignoran el costo curve, keywords sumados sin descontar stats, mecánicas firma sobre-eficientes en cards específicas.
- **Romper canon**: nombres que copian directamente culturas precolombinas reales (CANON-LORE §6.3 lo prohíbe), flavor text incoherente con la cosmovisión de la raza, voces narrativas mezcladas.
- **Inconsistencia de schema**: cada carta como TS code libre vuelve imposible que el front muestre el texto traducido sin parsear AST.

La solución es un **sub-agente de Claude Code** especializado en diseñar cartas: tiene contexto de las reglas (GAME-RULES.md), el lore (CANON-LORE.md), las primitives del engine, las patterns fonéticas por raza, y un set documentado de reglas de balance. El agente puede crear cartas individuales o batches, con nombres inventados que respeten el canon, abilities expresadas como árboles JSON de primitives (no TS code libre), y validaciones automáticas que detectan cartas rotas antes del merge.

Sin este agente, el set base se vuelve un proyecto de 6+ meses de diseño manual con riesgo alto de inconsistencias acumuladas. Con él, podemos generar cartas en horas, validarlas con un script, y delegar el diseño a un proceso reproducible que el resto del equipo (humano o agente) puede invocar uniformemente.

---

## Goals

- [ ] Sub-agente `card-designer` definido en `/opt/sexto-sol/.claude/agents/card-designer.md` con system prompt completo (rules + lore + primitives + balance + naming).
- [ ] Schema de Card v2 (TS) con `abilities: Ability[]` donde cada Ability es un árbol JSON de primitives (no TS code libre).
- [ ] Set inicial de **15-25 primitives** documentadas en `src/data/primitives/spec.ts` y `docs/specs/primitives.md`. Recicla del DSL de myl-game donde aplique, adaptando zonas/eventos a sexto-sol.
- [ ] Interpreter en engine: `src/engine/interpreter.ts` ejecuta abilities consumiendo el primitive tree, integrado con event bus + categoría de mecánica.
- [ ] Renderer i18n: `src/data/abilityRenderer.ts` traduce un Ability tree a texto en español. Test cubre cada primitive con ≥1 caso.
- [ ] Validador: `pnpm validate:cards` lee toda la card data y reporta:
  - Stats fuera de la curva esperada (con tolerancia ±1)
  - Keywords no descontadas en stats
  - Habilidades referenciando primitives inexistentes
  - Nombres que match patterns prohibidos (deidades vivas, glifos sagrados — lista en `naming-conventions.md`)
  - Categoría de mecánica del ability ≠ categoría firma de la raza (sin justificación)
- [ ] Naming guide: `docs/lore/naming-conventions.md` con patterns fonéticos por raza + lista de términos prohibidos.
- [ ] Set inicial de **8-10 cartas por raza × 4 = 32-40 cartas** generadas por el agente y commiteadas como prueba del flujo end-to-end.

---

## Non-goals / Out of scope

- ✗ **Generación automática de arte**. Las cartas tienen `artUrl?: string` opcional — placeholder hasta Phase 4 (Kickstarter art).
- ✗ **Set completo de 120-150 cartas**. Esta spec entrega el agente y un MVP de 32-40 cartas. La expansión al set completo es trabajo iterativo que el agente facilita pero no entrega aquí.
- ✗ **Localización a inglés/portugués**. El renderer es i18n-ready (recibe `lang` param) pero solo entregamos templates en español-Chile. EN/PT vienen con localización post-launch.
- ✗ **Hero designs completos**. Esta spec se enfoca en cartas regulares (Naves, Armas, Tecnologías, Reliquias, Eventos). Los héroes (1-3 por raza) son un proyecto aparte que puede usar el mismo agente con un schema extendido.
- ✗ **Automated playtest balance**. El validador chequea curva estática de stats/keywords. Detección de combos rotos via simulación de partidas viene en una spec posterior.
- ✗ **Editor visual de cartas**. El input al agente es prompt textual; el output son archivos JSON. No hay GUI para diseñar cartas en esta spec.
- ✗ **Keyword Resonancia activa**. La memoria de "cartas jugadas por Edad" se difiere a una spec subsidiaria (cuando empecemos Mini 1.1, donde Resonancia se vuelve narrativamente crítica). Las cartas iniciales no usan Resonancia. Aditivo — agregarlo después no rompe nada.
- ✗ **Strategy / deck-builder agent**. Pospuesto hasta que tengamos ~30 cartas por raza. Sin cartas, el agente no tiene material. El usuario lo levanta más adelante si lo necesita.

---

## User-facing changes

No hay UI en esta spec. Lo "user-facing" es el flujo que el usuario (Daniel u otro humano) sigue para invocar el agente:

**Flujo de invocación (vía Claude Code):**

```
1. Usuario invoca el agente:
   > "card-designer crea 5 naves Würon con costo 2-4 que jueguen con Külen"

2. Agente lee:
   - .claude/agents/card-designer.md (su system prompt)
   - GAME-RULES.md
   - CANON-LORE.md (sección 5.2 Würon)
   - docs/lore/naming-conventions.md (patterns Würon)
   - src/data/primitives/spec.ts (primitives disponibles)
   - src/data/cards/wuron/*.json (cartas existentes para evitar duplicados)

3. Agente genera 5 cartas en src/data/cards/wuron/<slug>.json,
   cada una con: id, name, race, type, cost, strength, hp, keywords,
   abilities (árbol de primitives), flavorText, rarity.

4. Validador corre:
   $ pnpm validate:cards
   → Reporta cualquier desviación de la curva, primitives inválidas,
     nombres prohibidos, etc.

5. Si hay issues, agente itera. Si no, commit.

6. Front lee las cartas y usa abilityRenderer para mostrar texto en
   español al jugador.
```

**Output del agente — ejemplo de carta:**

```json
{
  "id": "wuron_explorador_brote",
  "name": "Explorador del Brote",
  "race": "wuron",
  "type": "ship",
  "cost": 2,
  "strength": 2,
  "hp": 3,
  "rarity": "common",
  "keywords": ["kulen"],
  "abilities": [
    {
      "trigger": "on_event",
      "event": "ship_damaged",
      "filter": { "kind": "self" },
      "category": "reactive",
      "effect": {
        "op": "modify_strength",
        "target": "self",
        "delta": 1,
        "duration": "permanent"
      }
    }
  ],
  "flavorText": "Cada herida es una raíz que profundiza."
}
```

---

## Approach

### Schema (Card v2)

`src/data/types.ts` ya tiene `Card` con `keywords: readonly string[]`. Phase 3 lo extiende con:

```ts
export interface Card {
  id: string // formato: <race>_<slug>
  name: string // nombre canónico en español
  race: Race
  type: CardType
  cost: number
  rarity: Rarity
  strength?: number // solo para ships
  hp?: number // solo para ships
  keywords: readonly string[] // bastion, desgarro, vuelo, etc.
  abilities: readonly Ability[]
  flavorText?: string
  artUrl?: string // placeholder until Phase 4
}

export type Trigger =
  | { kind: 'on_play' } // when this card enters play
  | { kind: 'on_destroy' } // when this card leaves play
  | { kind: 'on_event'; event: EventType; filter?: Filter } // arbitrary event
  | { kind: 'continuous'; while?: Condition } // always-on while in play
  | { kind: 'activated'; window: ActivationWindow; cost?: Cost } // player invokes

export interface Ability {
  trigger: Trigger
  category: MechanicCategory // dicta orden de resolución (ya existe en types.ts)
  premonition?: boolean // si true, salta al frente del bus
  effect: Effect // árbol de primitives
  description?: string // override del renderer si la primitive no es suficiente
}

export type Effect =
  | DamagePrimitive
  | HealPrimitive
  | DrawPrimitive
  | DiscardPrimitive
  | ModifyStrengthPrimitive
  | GrantKeywordPrimitive
  | DestroyPrimitive
  | ExilePrimitive
  | BounceToHandPrimitive
  | ShuffleToDeckPrimitive
  | SearchPrimitive
  | GenerateEnergyPrimitive
  | SacrificePrimitive
  | SequencePrimitive // composición: efecto1 + efecto2 + …
  | ConditionalPrimitive // if cond, then effect, else effect2
```

### Primitives — set inicial

Recicladas/adaptadas del DSL de myl-game (`/opt/myl-game/scripts/card-algorithms/primitives.yaml`). Las que aplican directamente:

**Acciones de movimiento:**

- `destroy(target)`
- `exile(target, from_zone?)`
- `bounce_to_hand(target)`
- `shuffle_to_deck(target, owner)` — equivalente a myl `shuffle_to_castle`

**Card flow:**

- `draw(player, n)`
- `discard(target, n, selection)`
- `mill(player, n)`
- `search(owner, zones, filter, count, destination)`

**Stats/keywords:**

- `modify_strength(target, kind, value, duration)`
- `modify_hp(target, kind, value, duration)`
- `grant_keyword(target, keyword, duration)`
- `remove_ability(target, duration)`

**Recursos:**

- `generate_energy(player, n, duration)`
- `sacrifice(target)` — solo permite sacrificios de naves propias

**Combate:**

- `damage(target, amount, source)`
- `damage_homeworld(player, amount, source)`
- `prevent_damage(target, amount, duration)`

**Composición:**

- `sequence([effect1, effect2, …])`
- `conditional(condition, then_effect, else_effect?)`
- `for_each(filter, effect)`

Las nuevas / adaptadas vs myl-game:

- Sin `castle_damage` → `damage_homeworld`
- Sin `gold_reserve` → `energy` (no acumulable, así que zona conceptual)
- Nuevo: `for_each` (myl tenía expressions; en sexto-sol modelamos como primitive)
- Nuevo: `damage_homeworld` específico para pasar daño residual de Desgarro

### Filters y Targets

```ts
export type Target =
  | { kind: 'self' }
  | { kind: 'controller' }
  | { kind: 'opponent' }
  | { kind: 'all_ships'; filter?: Filter }
  | { kind: 'chosen_ship'; filter?: Filter }
  | { kind: 'random_ship'; filter?: Filter }
  | { kind: 'homeworld'; player: 'self' | 'opponent' }

export interface Filter {
  controller?: 'self' | 'opponent' | 'any'
  race?: Race | 'any'
  type?: CardType
  keywords_any?: readonly string[]
  keywords_all?: readonly string[]
  cost_lte?: number
  cost_gte?: number
}
```

### Interpreter

`src/engine/interpreter.ts`:

```ts
export function executeEffect(
  effect: Effect,
  state: GameState,
  ctx: EffectContext,
): { state: GameState; emit: readonly GameEvent[] }
```

Cada primitive tiene su handler. Composiciones (`sequence`, `conditional`, `for_each`) reducen sobre sub-effects. El interpreter es **puro** — devuelve nuevo state, no muta. Se integra con el event bus existente: cada primitive puede emitir eventos (SHIP_DAMAGED, CARD_DRAWN, etc.) que después se procesan en orden de categoría.

### Renderer i18n

`src/data/abilityRenderer.ts`:

```ts
export function renderAbility(ability: Ability, lang: 'es' = 'es'): string
```

Templates por primitive:

- `damage` → `"Hace {amount} daño a {target}."`
- `modify_strength` (delta=1, duration=permanent, target=self) → `"Esta nave gana +1 a la fuerza permanentemente."`
- `draw` → `"{owner} roba {n} carta(s)."`
- `sequence` → `"{ef1} {ef2}"` con punto al final.

Tests del renderer cubren cada primitive con ≥1 caso, ≥1 caso compuesto.

### Validator

`scripts/validate-cards.ts` (corre con `pnpm validate:cards`):

1. **Schema check**: cada `.json` en `src/data/cards/<race>/` valida contra `Card` schema (zod).
2. **Stat curve**: `cost ≈ floor((strength + hp) / 2.5)` con tolerancia ±1.
3. **Keyword adjustment**: cada keyword tiene un valor en stats; si la carta lleva keyword, descuenta:
   - `bastion` → -1 hp efectivo
   - `desgarro` → -1 strength efectivo
   - `vuelo` → -0.5 stat efectivo
4. **Ability cost**: cada ability descuenta:
   - `on_play` → -1 stat efectivo
   - `on_destroy` → -1 stat efectivo
   - `passive` (continuous) → -2 stat efectivo
   - `activated` → -1 stat efectivo
5. **Mechanic firma**: ability con `category` ≠ categoría firma de la raza requiere flag `intentional_off_category: true` en metadata.
6. **Primitives existence**: cada primitive referenciado debe estar en `spec.ts`.
7. **Naming**: nombre no matchea regex prohibidos (lista deidades, glifos sagrados, etc.).

Output: report en stdout + exit code 1 si hay errores. CI lo corre en su propio job `validate-cards`.

### Sub-agente

`/opt/sexto-sol/.claude/agents/card-designer.md`:

```yaml
---
name: card-designer
description: Diseñador especialista en cartas de Sexto Sol. Crea cartas individuales o batches respetando reglas, balance, lore y naming conventions. Usar cuando el usuario pida crear cartas, expandir el set, o diseñar variantes.
tools: Read, Write, Edit, Grep, Glob, Bash
model: sonnet
---
[
  System prompt con: rules summary,
  lore por raza,
  primitives reference,
  balance methodology,
  naming patterns,
  output format,
  ejemplos.,
]
```

El agente carga al inicio:

- GAME-RULES.md (resumen)
- CANON-LORE.md (sección de la raza objetivo)
- docs/lore/naming-conventions.md
- src/data/primitives/spec.ts
- src/data/cards/<race>/\*.json (cartas existentes para evitar duplicados / mantener voz)

Output siempre vía Write a `src/data/cards/<race>/<slug>.json`. Después corre `pnpm validate:cards` y itera si hay errores.

### Naming conventions

`docs/lore/naming-conventions.md`:

- **Q'ralan**: fonemas inspirados en Quechua/Aymara libre (ay, k', q, ñ, ll, ch). Patterns: `[Sustantivo] del [Objeto cosmológico]`. Ejemplos válidos: "Q'illay del Sol", "Inti-Wasi". **PROHIBIDO**: "Inti", "Pachamama", "Wiracocha" (deidades vivas).
- **Würon**: fonemas inspirados en Mapuzungun libre (w, ñ, tr, lh). Patterns: `[Adjetivo] [Sustantivo] del [Geografía]`. Ejemplos válidos: "Lhüpang del Brote", "Mañke del Sur". **PROHIBIDO**: nombres de machis, ngenes, longkos históricos reales.
- **Tezhal**: fonemas inspirados en Náhuatl libre (tz, tl, x, qu). Patterns: `[Sustantivo]-[Adjetivo Ritual]`. Ejemplos válidos: "Tezhal-tlani", "Xolot del Corazón". **PROHIBIDO**: Quetzalcóatl, Huitzilopochtli, Tlaloc (deidades).
- **Zaqe**: fonemas inspirados en Muysccubun libre (sq, zh, gu). Patterns: `[Sustantivo] del [Lago Cósmico]`. Ejemplos válidos: "Zaqe-Bochica del Espejo", "Guazha del Agua". **PROHIBIDO**: Bochica directo, Bachué, Chiminigagua.

Lista de términos prohibidos (ampliable): `LORE_BLOCKLIST: readonly string[]` exportada en `src/data/blocklist.ts`. Validator chequea cada nombre.

---

## Decisions log

### 2026-05-09 — JSON declarativo en lugar de TS code inline o DSL custom

- **Considered:** TS code inline (`effect: (ctx) => {...}`), DSL string custom.
- **Chose:** JSON declarativo con primitives.
- **Why:** Permite que el front renderice texto sin parsear AST; permite i18n directa; permite validación schema (zod); se puede serializar para storage/multiplayer; alinea con cómo lo hace Hearthstone bajo el capó. TS inline rompe i18n; DSL custom es bug magnet.
- **Cost:** Diseñar set inicial de primitives (~15-25). Mitigado al reciclar de myl-game.

### 2026-05-09 — Reciclar primitives de myl-game donde aplique

- **Considered:** Diseñar set fresh from scratch.
- **Chose:** Reciclar `/opt/myl-game/scripts/card-algorithms/primitives.yaml` adaptando zonas (castle→homeworld, gold_reserve→energy) y agregando primitives nuevas para mecánicas específicas de sexto-sol (`damage_homeworld`, `for_each`).
- **Why:** myl-game tiene un DSL probado en 900+ cartas. Empezar de cero re-descubriría los mismos issues. La adaptación es ~20% del trabajo vs reescribir 100%.
- **Cost:** Algunas primitives de myl no aplican (ej. response_play asume stack tipo myl que sexto-sol no tiene). Hay que filtrar conscientemente.

### 2026-05-09 — Renderer en `src/data/`, no en `src/ui/`

- **Considered:** Renderer en `ui/` cerca de los componentes que muestran cartas.
- **Chose:** `src/data/abilityRenderer.ts`.
- **Why:** El renderer es pura traducción de data → string. No depende de React, Pixi, ni nada de UI. Vive con el resto de la card data y su test es de unidad pura. UI solo importa la función.

### 2026-05-09 — Validator como script standalone, no como test de Vitest

- **Considered:** Tests de Vitest que iteran sobre todas las cartas.
- **Chose:** Script TS standalone corrido por `pnpm validate:cards` + job CI separado.
- **Why:** El report es legible (cuál carta falla qué regla); el script puede correr en pre-commit cuando solo cambian `src/data/cards/**`; el job de CI puede fallar específicamente "validate-cards" sin afectar el job principal de tests.

### 2026-05-09 — Resonancia diferida a spec subsidiaria

- **Considered:** Implementar `resonate(target_card_id, age)` en esta spec (incluyendo `cardsPlayedByAge` en state).
- **Chose:** Diferir. Las cartas iniciales no usan Resonancia. Agregarlo después es aditivo.
- **Why:** Agrega state-tracking + ~1-2 días de trabajo extra que no necesitamos para las primeras 32-40 cartas. Resonancia se vuelve crítica recién en Mini 1.1 ("Las Estrellas Recuerdan") — por la temática narrativa, no por el set base.

### 2026-05-09 — Premonición como soft cap (validator info, no error)

- **Considered:** Validator falla CI si un mazo tiene > 2 cartas con Premonición.
- **Chose:** Soft cap — validator reporta info ("Mazo X tiene 3 cartas con Premonición") sin fallar.
- **Why:** GAME-RULES dice "máximo 1-2 cartas con Premonición por mazo (sugerido)". Es guía de balance, no regla dura. Mantenemos info para calibrar después con playtest, pero no bloqueamos al diseñador en Phase F.

### 2026-05-09 — Daño directo Edad III en el interpreter, no en el reducer

- **Considered:** Reducer valida `age ≥ 3` antes de ejecutar PLAY_CARD sobre cartas que tocan homeworld.
- **Chose:** El interpreter valida cuando una primitive con `target: homeworld` se ejecuta y la edad < 3, falla la primitive (efecto se considera no aplicable).
- **Why:** Es propiedad de la _resolución_ del efecto, no del _play_. Una carta puede tener múltiples efectos donde solo uno apunta al homeworld; ese efecto en particular se ignora en Edad I/II. Al reducer lo dejamos puramente acción-driven.

---

## Test plan / Definition of Done

- [ ] `src/data/types.ts` extendido con `Card v2` (Trigger, Ability, Effect, Filter, Target).
- [ ] `src/data/primitives/spec.ts` exporta el set de 15-25 primitives con shapes zod-validables.
- [ ] `docs/specs/primitives.md` documenta cada primitive con descripción, params, ejemplos.
- [ ] `src/engine/interpreter.ts` ejecuta cada primitive. Tests cubren cada una con ≥1 caso unitario.
- [ ] `src/data/abilityRenderer.ts` con tests: ≥1 caso por primitive, ≥3 casos compuestos.
- [ ] `scripts/validate-cards.ts` corre y reporta correctamente. Tests cubren reglas con cartas mock que pasan/fallan cada regla.
- [ ] `pnpm validate:cards` script en `package.json`.
- [ ] CI job `validate-cards` agregado al workflow.
- [ ] `docs/lore/naming-conventions.md` con patterns por raza + LORE_BLOCKLIST.
- [ ] `.claude/agents/card-designer.md` con system prompt completo (frontmatter + body ~150-300 líneas).
- [ ] 8-10 cartas por raza × 4 razas = **32-40 cartas iniciales** generadas por el agente y validadas. JSON en `src/data/cards/<race>/`.
- [ ] Las 32-40 cartas pasan `pnpm validate:cards` sin errores.
- [ ] Cobertura del interpreter ≥85% (mantiene gate de Phase 1).
- [ ] Spec movida a `shipped/` después del merge.

---

## Phases

### Phase D — Schema + Interpreter + Renderer (semana 1)

- Extender Card v2 types.
- Diseñar set inicial de 15-25 primitives en `spec.ts` + doc.
- Implementar interpreter en engine con tests unitarios por primitive.
- Implementar renderer i18n con tests.
- DoD: `pnpm test:run` verde, cobertura sobre threshold.

### Phase E — Agent + Naming + Validator (semana 2)

- Escribir `.claude/agents/card-designer.md` con system prompt completo.
- Escribir `naming-conventions.md` + `LORE_BLOCKLIST`.
- Escribir `scripts/validate-cards.ts` + integrar en CI.
- Tests del validator con cartas mock que disparan cada regla.
- DoD: validador detecta cartas rotas en fixtures, CI falla cuando se introducen.

### Phase F — Set inicial 32-40 cartas (semana 3)

- Invocar el agente para diseñar 8-10 cartas por raza.
- Cada batch: agente genera, validator corre, agente itera, commit por raza.
- Front consume las cartas — tests de smoke leen y rendean.
- DoD: 32-40 cartas en `src/data/cards/<race>/`, todas pasan validator, todas se rendean.

---

## Open questions

Resueltas en draft, dejadas acá para registro del razonamiento:

- [x] **Stat curve**: `cost ≈ floor((strength + hp) / 2.5)` con tolerancia ±1. Calibración fina con playtest.
- [x] **Composición de primitives**: cap profundidad 3 para `sequence`/`conditional`/`for_each` anidados.
- [x] **Premonition cap por mazo**: soft cap. Validator reporta info, no falla CI. Calibración con playtest.
- [x] **Daño directo Edad III**: en el interpreter — primitives con `target: homeworld` se ignoran si `age < 3`.
- [x] **Resonancia**: out-of-scope. Spec subsidiaria cuando llegue Mini 1.1.
- [x] **Cobertura de keywords por raza**: al ojo del diseñador. Validator no enforza distribución.

---

## Links

- PR-D: <pendiente>
- PR-E: <pendiente>
- PR-F: <pendiente>
- Reciclado de: `/opt/myl-game/scripts/card-algorithms/primitives.yaml`
- Reglas oficiales: `../../GAME-RULES.md`
- Lore canónico: `../../CANON-LORE.md`
- Engine actual: `../../src/engine/` (post-Phase 2)
