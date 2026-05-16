# BACKLOG — Sexto Sol

Formato: `[status] título — nota`. Status: ` ` pending, `x` done, `~` in progress, `-` cancelled.

> Para detalles técnicos: `ARCHITECTURE.md`. Para reglas: `GAME-RULES.md`. Para diseño v4.1: `docs/specs/peregrinaje-v4.1.md`.

---

## Fase 0-1 — v3.0 ✅ (archivada)

74 cartas v3.0, 4 razas con counter wheel, engine TS funcional, 347 tests verdes. **Archivada** en `docs/archive/GAME-RULES-v3.0.md` + `docs/archive/cards-v3.0/`. Reemplazada por v4.1 — el código TS de v3.0 fue eliminado en el commit de Phase 1 de engine-v4.1-migration.

## v4.0 ✅ (intermedia, archivada)

Refactor radical a "Peregrinaje del Sexto Sol". Doc-only (sin implementación TS). Archivada en `docs/archive/GAME-RULES-v4.0.md`.

## v4.1 — "El Peregrinaje del Héroe" ✅ (vigente, código + docs)

3 atributos del héroe (Fuerza/Resguardo/Resonancia), elección secreta de planeta por tramo, duelo final 2-de-3, Eclipse.

### Diseño

- [x] `GAME-RULES.md` v4.1 (12 secciones, walkthrough §11 incluido).
- [x] `CANON-LORE.md` §13 "El Peregrinaje del Héroe".
- [x] 30 cartas de Acción + 4 héroes + 6 planetas (`docs/playtest/cards-v4.1/`).
- [x] 4 mazos preconstruidos (`docs/playtest/decks-v4.1/`).
- [x] PLAYTEST-NOTES + OPEN-QUESTIONS + SIM-RESULTS (simulaciones a mano).
- [x] Spec `docs/specs/peregrinaje-v4.1.md` (status: approved).

### Engine + UI

- [x] **Phase 1 — Engine v4.1** (commit `ba19f1c`): types/initialState/actions/reducer/interpreter/loaders + tests engine ≥85% coverage.
- [x] **Phase 2 — scriptedAI** (commit `8e88e2d`): 5 heurísticas §7.5 + tests integración 5 partidas.
- [x] **Phase 3 — UI** (commit `983737f`): HomeView, PlayView, 4 modales, gameStore Zustand.
- [x] **Phase 4 — Cleanup + docs + CI** (este commit): pixi.js desinstalado, docs actualizadas, spec a shipped/.

### Pendiente post-Phase 4

- [ ] **Stretch IQ8**: botón "Copiar log" en GameOverModal (JSON de actions al clipboard). 5min de trabajo, valor enorme para debug.
- [ ] **Animación reveal IQ4**: carta rotate Y 180deg + atributos tween 300ms con framer-motion. Diferido — UI funciona con transiciones instantáneas.
- [ ] **Primer playtest manual** con Daniel — validar Q1-Q11 empíricamente.
- [ ] **Reconciliación walkthrough §11 vs pool**: el §11 narrativo usa cards ilustrativas que no coinciden 1:1 con IDs del pool. Si en playtest el flow narrativo no cuadra, actualizar §11 con stats reales del pool (el pool es canónico).

---

## v4.2+ — futuro post-playtest

### Resolver open questions de v4.1

Las 11 preguntas en `OPEN-QUESTIONS-v4.1.md` (Q1-Q11):

- Q1: orden acción ↔ premonición.
- Q2: planetas pool fijo vs aleatorio.
- Q5: cap mano 7 vs sin cap vs 5.
- Q7: planeta elegido antes/después de mulligan.
- (Resto: ver el archivo).

### Razas faltantes

- [ ] **Q'ralan** activa (lore vive en `CANON-LORE.md` §5).
- [ ] **Zaqe** activa.
- [ ] Pool expandido a 4 razas × 15 cartas = 60 cartas de Acción.
- [ ] 4 héroes nuevos.

### Diseño del juego

- [ ] Cartas de planeta con efecto especial (`efectoEspecial` ya está reservado en YAML).
- [ ] Estrellas o modificadores adicionales (eliminadas en v4.1, podrían volver).
- [ ] Tutorial in-app + onboarding.
- [ ] i18n (en/pt/etc).

### Multiplayer

- [ ] Fase 6: backend Node.js (Fastify/Express) reutilizando engine portable.
- [ ] WebSockets, async vs realtime.
- [ ] Persistencia de partidas, replay viewer, spectator mode.

### Producto

- [ ] Mobile native (React Native port).
- [ ] Custom deck builder.
- [ ] Sobres / crafting / colección.
- [ ] IAP / paywall (TBD modelo).
- [ ] Sonido / música original.

---

## Autoridad narrativa (Arco del Jugador)

Derivada de `docs/lore/arco-del-jugador.md` v1.0. Pendientes para diseñar cartas / cinemáticas del set base con autoridad narrativa:

- [ ] Cuatro despertares (cada civilización descubre su tecnología espacial).
- [ ] Perfiles detallados de los 4 líderes legendarios.
- [ ] Catálogo de pistas de los Sabios para set base.
- [ ] Diseño de "susurros mecánicos" (6-10 cartas con efectos extraños).
- [ ] Spec de las 5 rutas del Sexto Sol.
- [ ] Sub-spec del virus (sin voz, no se personifica).
- [ ] Sub-spec de la Tierra-tumba (espejo, no escenario).

---

_Vivo. Última actualización: 2026-05-16 (post Phase 4 engine-v4.1-migration)._
