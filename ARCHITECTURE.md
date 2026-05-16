# ARCHITECTURE.md — Sexto Sol

Documento técnico del engine y patrones. Vivo. Actualizado a v4.1 ("El Peregrinaje del Héroe").

> Para reglas del juego: `GAME-RULES.md`. Para diseño v4.1 canónico: `docs/specs/peregrinaje-v4.1.md`. Para historia de la migración del engine: `docs/specs/shipped/engine-v4.1-migration.md`.

---

## 1. Filosofía del engine

### Determinismo total

- **Cero LLM** en el motor de reglas.
- **Reducer puro**: `(state, action) => newState`. Mismo input → mismo output.
- **RNG seedable**: toda aleatoriedad pasa por `createRng(seed, restoreState?)` en `src/engine/rng.ts`.
- Tests de regresión pasan con seeds conocidas (ver `src/engine/__tests__/replay.test.ts`).

### Sustracción radical (v4.1)

- v4.1 eliminó del engine v3.0: event bus complejo, Strategy Pattern por raza, primitives DSL, keywords (Bastión/Embate/etc.), combate con HP, 5 fases por turno, counter wheel por categoría de mecánica.
- También se desinstaló `pixi.js` (v4.1 visualmente simple — DOM + Tailwind alcanzan).
- Lo que queda: reducer puro + interpreter + scriptedAI + loaders + UI React/Zustand/framer-motion.

---

## 2. Estructura del state (v4.1)

```ts
interface GameState {
  seed: number
  rng: RngState
  tramo: 'nebulosa' | 'estrellas' | 'sexto_sol'
  turno: number // 1-7
  subPaso:
    | 'eleccion_planeta'
    | 'robo'
    | 'accion_pendiente'
    | 'premonicion_pendiente'
    | 'revelar'
    | 'cierre_tramo'
    | 'duelo_final'
    | 'terminado'
  jugadorActivo: 'a' | 'b'
  players: { a: Player; b: Player }
  poolPlanetasNebulosa: string[] // 3 ids
  poolPlanetasEstrellas: string[] // 3 ids
  energiaActual: number // = turno (base)
  premoniciones: { a?: Categoria; b?: Categoria }
  accionesPendientes: { a?: string; b?: string } // cardIds boca abajo
  paseDeclarado: { a?: boolean; b?: boolean }
  eclipseInvocado: boolean
  eclipseInvocador?: 'a' | 'b'
  modo: 'vsIA' | 'hotseat'
  ganador?: 'a' | 'b' | 'empate'
  finalTally?: { a: number; b: number }
}

interface Player {
  id: 'a' | 'b'
  raza: 'Tezhal' | 'Würon'
  mazoRestante: string[]
  mano: string[]
  pozo: string[]
  atributos: { fuerza: number; resguardo: number; resonancia: number }
  heroEstado: 'neutral' | 'despertado' | 'ascendido'
  mulliganUsado: boolean
  planetElegidoActual?: string // id del planet card; undefined fuera de Neb/Est
}
```

---

## 3. Acciones del reducer

Discriminated union en `src/engine/actions.ts`:

- `MULLIGAN` / `KEEP_HAND` — manejar mano inicial.
- `SELECT_PLANET` — elegir planeta secreto (Nebulosa, Estrellas).
- `DRAW_BOTH` — robar 1 carta a ambos al inicio del turno.
- `PLAY_HIDDEN` / `PASS_TURN` — jugar carta boca abajo o declarar "Pasa".
- `DECLARE_PREMONICION` — declarar categoría (Atq/Def/Rit).
- `REVEAL` — revelar ambas cartas, ejecutar interpreter, sumar a atributos, side effects.
- `CLOSE_TRAMO` — comparar atributos del planeta-elegido, avanzar héroe del ganador.
- `INVOKE_ECLIPSE` — solo Sexto Sol, una vez por partida.
- `END_GAME` — calcular tally 2-de-3 + tiebreakers.

---

## 4. Interpreter

`src/engine/interpreter.ts` — función pura `interpretCondicionales(input) → { fuerzaFinal, sideEffects }`.

Evalúa:

- Cláusulas `premonicion_propia`, `premonicion_oponente`, `premonicion_acierta`.
- Bonus de planeta (+1) SOLO en Nebulosa y Estrellas (NUNCA Sexto Sol).
- Habilidad pasiva Tezhal Despertado (+1 fuerza a cartas Ataque).

NO aplica (los hace el reducer en `applyReveal`):

- Eclipse ×2 (después de anulaciones cruzadas).
- Anulaciones (`sideEffect.tipo === 'anula'`) cruzadas entre cartas reveladas.
- Bonus Würon Despertada (requiere conocer categoría jugada por el oponente — segundo pase con `aplicarBonusWuronDespertada`).

Fuerza final siempre ≥ 0 (`Math.max(0, ...)`).

---

## 5. Loaders

- `src/data/cards/loader.ts` — `POOL_REGISTRY` con 30 cartas + 6 planetas + 2 héroes, cargados via Vite glob desde `docs/playtest/cards-v4.1/`.
- `src/data/decks/loader.ts` — 4 mazos preconstruidos desde `docs/playtest/decks-v4.1/`.
- `src/data/schema.ts` — type guards manuales (IQ2 cerrada — sin zod, sustracción).

Las cartas YAML están en formato estructurado (`fuerzaDelta`, `sideEffect`) parseado por el script `scripts/migrate-v4.1-cards-to-structured.ts`. No hay parsing de strings en runtime.

---

## 6. scriptedAI

`src/engine/ai/scriptedAI.ts` — 5 heurísticas §7.5 del SPEC v4.1:

1. `shouldMulligan`: true si mano sin coste ≤ 2.
2. `pickPlanet`: distribución 70/15/15 según eficiencia de mano por categoría.
3. `pickPremonicion`: tracking de últimos 3 turnos del oponente, top 70%.
4. `pickAccion`: max fuerza esperada considerando premonición + bonus planeta + habilidades.
5. `shouldInvokeEclipse`: solo Sexto Sol + no invocado previo + voy perdiendo Y fuerza×2 ≥ 5.

Determinista vía `createRng(state.seed, state.rng)`.

---

## 7. UI

- Stack: React 18, Zustand, Tailwind v4, framer-motion (uso mínimo).
- `src/store/gameStore.ts`: store Zustand que envuelve el reducer + provee `stepIA()` para vsIA con delay 150ms (IQ7).
- `src/ui/`: HomeView, PlayView, modales (PlanetChoice, EclipseConfirm, TramoClosing, GameOver), CardView, AttributeCounters, HeroBadge, PlanetCard, PrivacyShield.

UI completa pero sin polish visual. Animación de revelado (IQ4) queda como TODO opcional.

---

## 8. Portabilidad Node.js

El engine (`src/engine/`) NO importa:

- React, React-DOM, Zustand, PixiJS, Framer Motion.
- `@/ui/*`, `@/store/*`.
- `window`, `document`, `localStorage`, `fetch`, `Math.random`, `Date.now`.

Garantizado por `src/engine/__tests__/portability.test.ts` (scan estático + serialización JSON round-trip).

El engine se puede mover a Fastify/Express (Fase 6 multiplayer) sin reescritura.

---

## 9. Tests

- 14 archivos de tests, 124 pass + 1 skipped.
- Coverage global 91.74%, engine 93.93%, engine/ai 97.72%.
- Property tests con fast-check (`invariants.test.ts`).
- Determinismo verificado (`replay.test.ts`, `integration-batch.test.ts`).
- Walkthrough §11 estructural reproducible (`walkthrough.test.ts`) — flow Eclipse T7, ganador definido. Test numérico paso a paso queda como `it.skip` por default.

---

## 10. Roadmap post-v4.1

Diferido a futuras specs:

- Implementar Q'ralan y Zaqe (set 2).
- Multiplayer online (Fase 6) — el engine portable lo soporta sin cambios.
- Persistencia / replay viewer / spectator mode.
- Custom deck builder, sobres, crafting.
- Animaciones premium con Framer Motion.
- Mobile native (RN port).
- i18n.

Open questions del juego (no del engine) en `OPEN-QUESTIONS-v4.1.md`. Notas de playtest manual en `PLAYTEST-NOTES-v4.1.md`.
