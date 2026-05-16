# SPEC v4.2 — Migración a "Premonición como Lectura" (Modelo B2)

**Status:** shipped
**Owner:** Daniel
**Created:** 2026-05-16
**Shipped:** 2026-05-16
**Source:** SPEC v4.2 PDF (recibido por Telegram 2026-05-16) + feedback playtest v4.1
**Reemplaza:** v4.1 (engine-v4.1-migration.md, también shipped/)
**Tiempo real:** ~4 horas autónomas (Phases 1a+1b+2+3+4)

---

## Why

Durante playtest manual de v4.1, Daniel reportó: **"la resolución está mal parece"**.

El problema raíz: el concepto de "premonición" tenía 3 significados distintos
mezclados en el mismo campo:

1. **Postura propia** — declaraba qué categoría iba a jugar.
2. **Input pasivo** — gateaba mis propias cláusulas (`premonicion_propia`,
   `premonicion_oponente`).
3. **Lectura del rival** — gateaba mis cláusulas reactivas (`premonicion_acierta`).

Tres cosas con el mismo nombre y diferentes mecánicas → resolución confusa para
el jugador, especialmente en el momento del revelado.

v4.2 colapsa los tres significados en **uno solo**: la premonición es
_solamente_ una lectura sobre el rival, **oculta** hasta el revelado.

---

## Goals

- ✅ Premonición pasa a ser un único concepto: predicción oculta sobre la
  categoría del rival.
- ✅ Acierto: la carta del rival pierde su `penalizacion_acierto`.
- ✅ Fallo: la carta del rival gana +1.
- ✅ Cláusulas `premonicion_*` eliminadas del schema; reemplazadas por cláusulas
  sobre estado del juego (héroe, tramo, atributos, eclipse).
- ✅ UI v4.2 que muestre el flujo correctamente: mulligan inicial → selector
  secreto paralelo (prem + carta) → revelar → revisar_resolucion con desglose.

---

## Out of scope

- No re-balancear las 30 cartas: la migración asigna `penalizacion_acierto`
  intencional con asimetría Tezhal (bajo) vs Würon (alto) pero no se intenta
  reconciliar con SIM-RESULTS v4.1.
- No introducir nuevas razas (Q'ralan, Zaqe quedan en set 2).
- No agregar animaciones nuevas (sigue UI simple post-Phase 3 v4.1).
- No tocar lore/CANON.

---

## Approach (Phases ejecutadas)

### Phase 1a — Engine puro (commit 71207b2)

- `types.ts`: nuevo `SubPaso seleccion_secreta` (reemplaza
  `accion_pendiente` + `premonicion_pendiente`). `CardActionDef` con
  `penalizacionAcierto` top-level. `CondicionalTipo` limpio. `GameState` con
  `historialPremoniciones[]`.
- `actions.ts`: `PLAY_HIDDEN` / `PASS_TURN` llevan premonición en payload;
  `DECLARE_PREMONICION` eliminada.
- `interpreter.ts`: nuevo orden §4.2 SPEC con `penalizacionPorPasarConAcierto`.
- `reducer.ts`: `applyReveal` computa con nuevo interpreter + registra historial;
  pasar-con-acierto aplica -1 al rival.
- Tests engine (79 passed): interpreter, reducer-edge, invariantes,
  determinismo replay, initialState.

### Phase 1b — Pool migrado a mano + sanity check (commit 46b2a16)

- 30 cartas reescritas a mano en `docs/playtest/cards-v4.2/`:
  - **Tezhal**: aggro, fuerza_base alto y `pen_acierto` bajo (resiste lectura).
  - **Würon**: control, más leíble, compensa con sideEffects.
- Schema estricto restaurado.
- `validate-cards.ts` con asserts:
  - `Tezhal.pen_acierto promedio (1.13) < Würon.pen_acierto promedio (2.00)` ✓
  - `Tezhal.fuerza_base promedio (3.73) > Würon.fuerza_base promedio (2.87)` ✓

### Phase 2 — scriptedAI + walkthrough + integration-batch (commit d1ea90e)

- scriptedAI v4.2: tracking del rival desde `state.historialPremoniciones`
  (no AIHistory local). pickPremonicion distribución 70/15/15.
- pickAccion: maximiza fuerza esperada considerando probabilidad de ser leído,
  condicionales sobre estado, sideEffects (pesos heurísticos).
- shouldInvokeEclipse: simula la decisión con `eclipseActivo=true`,
  compara fuerza esperada × 2 contra umbral 5.
- Walkthrough §11 + integration-batch (5 seeds) verdes.

### Phase 3 — UI v4.2 (commit 292c5c3)

- `MulliganModal`: pantalla inicial con la mano + opción mulligan.
- `SecretSelectionPanel` (en `PlayView`): selector secreto premonición → carta;
  hasta que no elijas premonición, las cartas + pass están disabled.
- `ResolucionPanel`: desglose paso a paso de fuerza por jugador
  (base + lectura + bonus planeta + condicionales + héroe + eclipse).
- `HistorialPanel`: detalle colapsable de últimos 5 turnos.
- `CardView`: muestra `penalizacion_acierto` y `sideEffects`.

### Phase 4 — Cleanup + docs + ship (este commit)

- `GAME-RULES.md` actualizado a v4.2; v4.1 archivada.
- `README.md` actualizado.
- Esta spec → shipped/.

---

## Decisions log

- **2026-05-16** — _Premonición OCULTA, no pública_. Rationale: si fuera
  pública, el rival siempre jugaría la categoría contraria a tu predicción
  y la mecánica colapsa en pura adivinación. Ocultando ambos lados se
  preserva la tensión.
- **2026-05-16** — _Penalización en la carta DEL RIVAL, no en la propia_.
  Discutido con Daniel: la otra opción (B1) era que tu propia carta pierde
  fuerza si te leen. Elegimos B2 (rival pierde) porque hace la lectura un
  arma ofensiva, no defensiva. Más en línea con "leer es atacar".
- **2026-05-16** — _Phase 1 dividido en 1a (engine) + 1b (pool manual)_.
  Daniel pidió específicamente sanity check con asserts por raza para
  catchear regresiones de balance antes de seguir.
- **2026-05-16** — _Sub-paso `revisar_resolucion` separado_. Daniel post-playtest
  pidió "podemos poner una etapa de revisión donde revise que hizo mi oponente".
  No mezclar con revelar (que es atómico).
- **2026-05-16** — _Mulligan inicial visible en UI_. Daniel: "antes de comenzar
  debería ver mi mano y la posibilidad de hacer mulligan". 1 mulligan máximo.

---

## DoD (verificado)

- ✅ `pnpm typecheck` + `pnpm lint` + `pnpm build` verdes
- ✅ `pnpm test:run`: 154 passed, 0 skipped
- ✅ `pnpm test:coverage` thresholds CI (lines/funcs/stmts ≥85%, branches ≥70%)
- ✅ `pnpm validate:cards`: pool + asserts de balance OK
- ✅ Demo manual con playwright: flujo end-to-end (mulligan → planeta →
  seleccion_secreta → revelar → revisar_resolucion → turno 2) funciona vsIA.
- ✅ 4 commits pusheados a main, CI verde en cada uno.

---

## Commits

- `71207b2` Phase 1a — engine v4.2
- `46b2a16` Phase 1b — pool migrado + sanity check
- `d1ea90e` Phase 2 — scriptedAI + walkthrough + integration-batch
- `292c5c3` Phase 3 — UI v4.2 (mulligan + selector secreto + resolución)
- (este commit) Phase 4 — cleanup + docs + ship
