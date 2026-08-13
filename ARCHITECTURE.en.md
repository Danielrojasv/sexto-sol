# ARCHITECTURE.en.md — Sexto Sol

English version of `ARCHITECTURE.md`. Technical document about the engine and its patterns. Living document, updated to v4.1 ("The Hero Pilgrimage").

> The game rules, the canonical design and the specs live in the private repository of the project. This document covers only the technical side of the engine.

---

## 1. Engine philosophy

### Full determinism

- **No LLM** inside the rules engine.
- **Pure reducer**, `(state, action) => newState`. Same input, same output.
- **Seeded RNG**. Every random value goes through `createRng(seed, restoreState?)` in `src/engine/rng.ts`.
- Regression tests run on known seeds (see `src/engine/__tests__/replay.test.ts`).

### Radical subtraction (v4.1)

- v4.1 removed from the v3.0 engine, a complex event bus, a Strategy Pattern per race, a primitives DSL, keywords (Bastión, Embate and the rest), HP based combat, five phases per turn, and the counter wheel by mechanic category.
- `pixi.js` was uninstalled too. v4.1 is visually simple, so DOM plus Tailwind is enough.
- What is left, a pure reducer plus interpreter, scriptedAI, loaders, and a React, Zustand and framer-motion UI.

---

## 2. State shape (v4.1)

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
  accionesPendientes: { a?: string; b?: string } // face down cardIds
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
  planetElegidoActual?: string // planet card id, undefined outside Nebulosa and Estrellas
}
```

The code keeps Spanish identifiers on purpose. The game is written in Spanish and the rules document is the source of truth, so the names in the code match the names in the rules.

---

## 3. Reducer actions

Discriminated union in `src/engine/actions.ts`.

- `MULLIGAN` and `KEEP_HAND`, handle the opening hand.
- `SELECT_PLANET`, pick the secret planet (Nebulosa, Estrellas).
- `DRAW_BOTH`, both players draw one card at the start of the turn.
- `PLAY_HIDDEN` and `PASS_TURN`, play a card face down or declare a pass.
- `DECLARE_PREMONICION`, declare a category (Attack, Defense or Ritual).
- `REVEAL`, reveal both cards, run the interpreter, add to attributes, apply side effects.
- `CLOSE_TRAMO`, compare the attributes of the chosen planet and advance the winner hero.
- `INVOKE_ECLIPSE`, only in Sexto Sol, once per game.
- `END_GAME`, compute the two out of three tally plus tiebreakers.

---

## 4. Interpreter

`src/engine/interpreter.ts` is a pure function, `interpretCondicionales(input) → { fuerzaFinal, sideEffects }`.

It evaluates:

- The `premonicion_propia`, `premonicion_oponente` and `premonicion_acierta` clauses.
- The planet bonus (+1), ONLY in Nebulosa and Estrellas, never in Sexto Sol.
- The Tezhal Awakened passive ability (+1 strength on Attack cards).

It does not apply the following, which the reducer does inside `applyReveal`:

- The Eclipse double, which happens after cross cancellations.
- Cancellations (`sideEffect.tipo === 'anula'`) crossed between the two revealed cards.
- The Würon Awakened bonus, which needs to know the category the opponent played, so it runs in a second pass with `aplicarBonusWuronDespertada`.

Final strength is always zero or higher, `Math.max(0, ...)`.

---

## 5. Loaders

- `src/data/cards/loader.ts` holds `POOL_REGISTRY` with 30 cards, 6 planets and 2 heroes, loaded through a Vite glob from `docs/playtest/cards-v4.1/`.
- `src/data/decks/loader.ts` holds 4 preconstructed decks from `docs/playtest/decks-v4.1/`.
- `src/data/schema.ts` holds hand written type guards. No zod, by subtraction.

The YAML cards use a structured format (`fuerzaDelta`, `sideEffect`) produced by the script `scripts/migrate-v4.1-cards-to-structured.ts`. There is no string parsing at runtime.

---

## 6. scriptedAI

`src/engine/ai/scriptedAI.ts` implements the five heuristics of section 7.5 of the v4.1 spec.

1. `shouldMulligan`, true when the hand has two or fewer playable cards.
2. `pickPlanet`, a 70/15/15 distribution based on hand efficiency per category.
3. `pickPremonicion`, tracks the last three turns of the opponent and takes the top 70%.
4. `pickAccion`, maximum expected strength, including premonition, planet bonus and abilities.
5. `shouldInvokeEclipse`, only in Sexto Sol, only if it was not invoked before, only when losing and when strength times two is five or more.

It is deterministic through `createRng(state.seed, state.rng)`.

---

## 7. UI

- Stack, React 18, Zustand, Tailwind v4 and framer-motion with minimal use.
- `src/store/gameStore.ts` is a Zustand store that wraps the reducer and provides `stepIA()` for the versus AI mode, with a 150ms delay.
- `src/ui/` holds HomeView, PlayView, the modals (PlanetChoice, EclipseConfirm, TramoClosing, GameOver), CardView, AttributeCounters, HeroBadge, PlanetCard and PrivacyShield.

The UI is complete but not polished. The reveal animation is an optional TODO.

---

## 8. Node.js portability

The engine (`src/engine/`) does not import:

- React, React DOM, Zustand, PixiJS or Framer Motion.
- `@/ui/*` or `@/store/*`.
- `window`, `document`, `localStorage`, `fetch`, `Math.random` or `Date.now`.

This is guaranteed by `src/engine/__tests__/portability.test.ts`, which does a static scan of the engine source plus a JSON serialization round trip.

The point is practical. The engine can move to Fastify or Express for online multiplayer without a rewrite, and the test fails the build the day someone breaks that promise by accident.

---

## 9. Tests

- 14 test files, 124 passing and 1 skipped.
- Global coverage 91.74%, engine 93.93%, engine/ai 97.72%.
- Property tests with fast-check in `invariants.test.ts`.
- Determinism verified in `replay.test.ts` and `integration-batch.test.ts`.
- The structural walkthrough of section 11 is reproducible in `walkthrough.test.ts`, covering the Eclipse flow on turn 7 and a defined winner. The step by step numeric test is left as `it.skip` by default.

---

## 10. Roadmap after v4.1

Deferred to future specs:

- Implement Q'ralan and Zaqe (set 2).
- Online multiplayer. The portable engine supports it without changes.
- Persistence, replay viewer and spectator mode.
- Custom deck builder, packs and crafting.
- Premium animations with Framer Motion.
- Native mobile, as a React Native port.
- Internationalization.

Open questions about the game, not about the engine, live in `OPEN-QUESTIONS-v4.1.md`. Manual playtest notes live in `PLAYTEST-NOTES-v4.1.md`.
