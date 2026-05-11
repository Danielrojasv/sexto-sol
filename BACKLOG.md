# BACKLOG — Sexto Sol

Formato: `[status] título — nota`. Status: ` ` pending, `x` done, `~` in progress, `-` cancelled.

> Para detalles técnicos, ver `ARCHITECTURE.md`. Para diseño, ver `GAME-RULES.md`. Para auditorías de los canarys del set base, ver `docs/audits/`.

---

## Fase 0 — Infraestructura ✅

- [x] Scaffold del repo (`/opt/sexto-sol/`).
- [x] CLAUDE.md, README.md, GAME-RULES.md, ARCHITECTURE.md, BACKLOG.md, docs/specs/\_template.md.
- [x] Spec maestra `design-v0.md` viva.
- [x] `git init` + push a repo (público).
- [x] `pnpm init` + Node 22 + TypeScript + Vite scaffold.
- [x] ESLint + Prettier + Vitest + fast-check.
- [x] CI básico (lint + typecheck + test + build + gitleaks).
- [x] Pre-commit hook (husky + tsc + lint-staged + gitleaks graceful).
- [x] SECURITY-RULES.md y PERFORMANCE-RULES.md (placeholders vivos).
- [ ] Coverage gate diferido a Phase 1 (cuando engine tenga tests reales).

---

## Fase 1 — Diseño del set base v3.0 ✅

Resultado: 74 cartas únicas, 4 archetypes ortogonales, criterios objetivos de nerf documentados por raza.

- [x] GAME-RULES v3.0 cerrado (simplificación post-canarys: sin Edades, sin planetas, sin Luz/Sombra, energía automática creciente).
- [x] CANON-LORE v2.0 cerrado (bucle causal, razas inventadas, ecos terrestres).
- [x] Canary Würon (8 cartas + DSL v3.0.1) — archetype Külen-stacking.
- [x] Canary Tezhal (8 cartas + DSL v3.0.2) — archetype Kamikaze-tempo.
- [x] Canary Q'ralan (8 cartas) — archetype Formación Solar masa-control.
- [x] Canary Zaqe (8 cartas + DSL v3.0.3) — archetype Persistencia económica.
- [x] Pool total: 74 cartas (Q'ralan 19, Würon 19, Tezhal 18, Zaqe 18).
- [x] DSL v3.0.3 schema-only (interpreter pending Phase 3).

Auditorías canary en `docs/audits/`.

---

## Fase 2 — Loop de validación offline ✅

4 agents operativos para validación cuantitativa offline (no se ejecutan en producción — son tooling de diseño).

- [x] SPEC 1: card-designer agent actualizado con compendio de restricciones inviolables del set base (`.claude/agents/card-designer.md`).
- [x] SPEC 2: deck-builder agent + 12 mazos canónicos del meta (`docs/playtest/decks/`).
- [x] SPEC 3: game-simulator agent (Python tooling, IA scripted) + sim-validation initial baseline (`docs/playtest/sim-validation/initial-tests.yaml`).
- [x] SPEC 4: balance-analyst agent + analysis-validation initial baseline (`docs/playtest/analysis-validation/initial-tests.yaml`).
- [~] Known limitation: IA del simulator no es variant-aware. Pendiente para mejora opcional (ver Opcional A).

---

## Fase 3 — Engine kernel TypeScript (Phase 1 técnica) 🚧

Implementar el interpreter de primitives DSL v3.0.3 en TypeScript puro. Habilita Phase 4 (web MVP jugable) y Phase 5 (playtesting humano).

- [ ] Port `rng.ts` (splitmix32 + xoshiro128\*\*, seed determinista).
- [ ] `GameState` types completos.
- [ ] Reducer puro skeleton + acciones (CONCEDE, END_PHASE, PLAY_CARD, ATTACK, ACTIVATE_ABILITY).
- [ ] Event bus con resolución por categoría (Reactive → Initiative → Accumulative → Post-combat) + Premonition.
- [ ] Interpreter para los primitives v3.0.3 (was_damaged_this_turn, ship_attacked, attacker target, keyword_amplifier, set_to_max, cost_modifier, chosen_permanent, count_filter con zone, search con zone pozo_astral).
- [ ] Strategy pattern base para las 4 razas.
- [ ] Property tests baseline con fast-check (invariantes).
- [ ] Replay tests: seed + acciones producen mismo state.
- [ ] Coverage gate ≥ 85% para `src/engine/`.

---

## Fase 4 — Web MVP jugable 🚧

Conectar el engine TS (Fase 3) con la UI existente. Habilita primer playtesting humano.

- [ ] Reemplazar `PlayView` placeholder con vista de juego real.
- [ ] Loader de mazos: consumir formato YAML del deck-builder (`docs/playtest/decks/`).
- [ ] IA scripted simple integrada al frontend (referencia: simulator Python).
- [ ] Modo single-player vs IA + hot-seat.
- [ ] Tutorial inline básico.
- [ ] Animaciones de combate con Framer Motion + PixiJS.
- [ ] Drag & drop de cartas.
- [ ] Deploy MVP (Vercel / Netlify / GitHub Pages).

---

## Opcional A — Mejorar IA simulator (variant-aware) 🟡

Resuelve `known_limitation` de Fase 2. Sube confidence cross-profile de balance-analyst a high.

- [ ] Implementar heurísticas por archetype.variant (Aggro / Midrange / Control / Combo) en `scripts/sim/simulator.py`.
- [ ] Re-correr validation tests.
- [ ] Diff vs baseline original.

Se puede hacer en paralelo o después de Fase 4. NO bloquea web MVP.

---

## Fase 5 — Playtesting humano + ajustes 🔮

Después del MVP web jugable. Recolección de feedback cualitativo + validación cuantitativa con humanos.

- [ ] Reclutamiento de playtesters (10-20 inicial).
- [ ] Métricas de UX (¿se entiende?, ¿es divertido?, ¿quiero volver?).
- [ ] Validación de criterios objetivos de nerf con simulator v1+.
- [ ] Iteración de balance basada en data (Fase 2 + Fase 5 combinadas).
- [ ] Decisión: ¿reintroducir Edades / planetas / héroes pasivos? (Phase 2/3 del juego).

---

## Fase 6 — Producción (futuro) 🔮

Cuando el MVP esté validado y haya comunidad.

- [ ] Decisión: launch en Steam, mobile (RN/Capacitor), web (PWA)?
- [ ] Multiplayer arquitectura (Node + WebSocket vs Cloudflare DO vs otro).
- [ ] Esquema de cuenta + auth.
- [ ] Async PVP estilo Marvel Snap.
- [ ] Matchmaking básico.
- [ ] Persistencia de mazos.
- [ ] Telemetría.
- [ ] Sobres (5 cartas, 1 Rara+, pity timer cada 10).
- [ ] Crafting con polvo (25/100/400/1600).
- [ ] Pase del Sol ($9.99/mes).
- [ ] Bundles.
- [ ] Cosméticos premium.
- [ ] Localización (es + en lanzamiento, pt con expansión Tupi-Guaraní).

---

## Fase de Lore (paralela a las técnicas)

Derivada del **Arco del Jugador** (`docs/lore/arco-del-jugador.md` v1.0). Estos son los próximos pasos sugeridos al final de ese documento — son requisitos para diseñar cualquier carta o cinemática del set base con autoridad narrativa.

- [ ] **Cuatro despertares** — material foundational del set base. Cómo cada civilización (Mexica, Inca, Muisca, Mapuche) descubrió/desarrolló su tecnología espacial en aislamiento, narrado desde su propia cosmología. Sirve como ancla narrativa de cada faction.
- [ ] **Perfiles detallados de los 4 líderes legendarios** — uno por civilización para el set base. Cada uno con sus sospechas privadas (que el jugador NO lee directamente — están implícitas en flavor text, no explícitas).
- [ ] **Catálogo concreto de pistas de los Sabios para set base** — qué pistas se siembran en cartas/eventos del set base que solo se revelarán como pistas en Mini 1.1+. Disciplina: deben pasar desapercibidas en su momento (Regla 3 del arco).
- [ ] **Diseño de las 6-10 cartas de "susurro mecánico"** — cartas del set base que tienen efectos extraños/inexplicables que en Mini 1.2 se reinterpretarán como manifestaciones tempranas del virus. Cuáles son, qué efecto raro tienen, cómo se reinterpretan.
- [ ] **Spec de las "5 rutas del Sexto Sol"** — qué representa cada ruta cosmológicamente, cómo se determina canónicamente cuál ruta predomina al cierre del bloque inicial (encuesta entre jugadores? meta de torneos? evento global? decisión narrativa del equipo?), cómo se ofrece la "sexta opción" (romper el bucle) al jugador.
- [ ] **Sub-spec del virus** — Regla 4 (no tiene voz, no se personifica). Cómo se manifiesta mecánicamente (efectos de Corrupción, propagación, espejos oscuros). Cómo se invoca sin invocar.
- [ ] **Sub-spec de la Tierra-tumba** — Regla 6 (espejo, no escenario). Cómo se referencia en flavor text del set base sin desarrollarse, cómo se desarrolla parcialmente en Mini 1.3, cómo se mantiene fuera de cuadro a perpetuidad.

---

## Roadmap de ediciones (post-lanzamiento)

### Set base — "Sexto Sol" (v3.0)

4 razas: Q'ralan, Würon, Tezhal, Zaqe. 74 cartas validadas.

### Expansiones futuras (TBD)

Mecanismos canónicos para introducir nuevas razas (ver `CANON-LORE.md` §10):

- **Semillas tardías** — semillas que viajaron más lento por el espacio-tiempo y recién despiertan.
- **Civilizaciones terrestres que escaparon** — pueblos que preservaron suficiente conexión con su semilla original como para emerger después como civilizaciones espaciales jóvenes.
- **Civilizaciones de otros sistemas estelares** — semillas que cayeron en mundos imprevistos.

Para cada raza nueva: nombre propio inventado, cosmovisión inspirada pero distinta, categoría de mecánica (Reactiva / Iniciativa / Acumulativa / Post-combate o nueva), eco terrestre en lore (sin nombrarlo como raza jugable).

### Re-introducción de capas v2.0 (TBD)

Capas removidas temporalmente en v3.0 para validar el core. Posibles candidatos a re-introducir post-validación:

- **Edades I/II/III** — sistema de escalado de poder narrativo. Removido en v3.0. Posiblemente vuelva con set 2 si simulación valida que el core funciona sin ellas.
- **Planetas neutrales con Dones** — recursos compartidos. Removido en v3.0. Posible re-introducción como expansión de modo de juego.
- **Héroes pasivos en mundo natal** — héroe como comandante de Edad I. Simplificado a Naves Legendarias en v3.0.
- **Luz/Sombra en Legendarias** — habilidad dual condicional. Posible mecánica de expansión, no del set base.

### Posible facción "Espejo Oscuro"

Versiones tecno-industriales corruptas de cada raza, manifestación del virus. Material para Edición 2 o 3, no del set inicial. Ver `CANON-LORE.md` §6.4.

---

## Open questions / decisiones pendientes

- [ ] Multiplayer realtime o async?
- [ ] Async tipo Marvel Snap (turnos enviados) vs LoR (sesiones live)?
- [ ] Engine híbrido determinista + UI procedural (animations)?
- [ ] Voice acting / soundtrack original?
- [ ] Cuándo reintroducir Edades (post-MVP humano? con set 2?)
- [ ] Cuándo reintroducir planetas (post-MVP humano? con set 2?)

---

_Vivo. Última actualización: 2026-05-11._
