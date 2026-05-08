# ARCHITECTURE.md — Sexto Sol

Documento técnico del engine y patrones. Vivo.

> Para reglas de juego: `GAME-RULES.md`. Para diseño de alto nivel: `docs/specs/design-v0.md`.

---

## 1. Filosofía del engine

### Determinismo total
- **Cero LLM** en el motor de reglas.
- **Reducer puro**: `(state, action) => newState`. Mismo input → mismo output.
- **RNG seedable**: toda aleatoriedad pasa por un PRNG con seed conocida (estilo `seedrandom` o `xorshift32`).
- Tests de regresión pasan seeds y replays exactos.

### Por qué este approach
- Replay determinista para PVP async (envías la lista de acciones, el cliente reproduce el game state)
- Testabilidad extrema (property tests + invariant tests con `fast-check`)
- Anti-cheat: el server puede re-validar cualquier acción
- Spectator mode trivial: replay desde seed + acciones

---

## 2. Estructura del state

```ts
type GameState = {
  seed: number               // RNG seed (immutable)
  rngState: number           // current RNG state (mutable across turns)
  turn: number               // global turn counter
  age: 1 | 2 | 3             // current Edad
  activePlayer: 'p1' | 'p2'
  phase: TurnPhase           // 'recoleccion' | 'despliegue' | 'combate' | 'regroup' | 'vigilia'

  players: {
    p1: PlayerState
    p2: PlayerState
  }

  sector: SectorState        // tablero espacial
  pendingEvents: GameEvent[] // event bus queue
  log: GameAction[]          // action log para replay
}

type PlayerState = {
  faction: 'mexica' | 'inca' | 'muisca' | 'mapuche'
  homeworld: { hp: number, maxHp: number, position: PlanetId }
  hand: Card[]
  deck: Card[]               // ordered, top of deck = index 0
  graveyard: Card[]
  energy: number             // current turn energy (gastable)
  energyIncome: number       // base income from territory
  controlledPlanets: PlanetId[]
}

type SectorState = {
  planets: Record<PlanetId, PlanetState>
}

type PlanetState = {
  id: PlanetId
  name: string
  controller: 'p1' | 'p2' | 'neutral' | 'hidden'   // 'hidden' = todavía no revelado
  garrison: ShipInstance[]
  modifier?: PlanetModifier  // efectos especiales (ej. Trayenko: +1 Newen al final de Edad)
}
```

---

## 3. Acciones (lo que el jugador puede hacer)

```ts
type GameAction =
  | { type: 'PLAY_CARD'; cardId: string; targets?: Target[] }
  | { type: 'DECLARE_ATTACK'; attackerShipId: string; target: Target }
  | { type: 'DECLARE_BLOCK'; blockerShipId: string; attackerShipId: string }
  | { type: 'MOVE_SHIP'; shipId: string; from: PlanetId; to: PlanetId }
  | { type: 'ACTIVATE_ABILITY'; sourceId: string; abilityId: string }
  | { type: 'END_PHASE' }
  | { type: 'CONCEDE'; player: 'p1' | 'p2' }
```

El reducer aplica una acción y devuelve `{ newState, eventsTriggered }`. Los eventos se procesan después por el event bus.

---

## 4. Event bus

Habilidades triggered escuchan eventos. Cuando un evento ocurre, todas las habilidades suscriptas se evalúan en orden:

```ts
type GameEvent =
  | { type: 'SHIP_DESTROYED'; shipId: string; cause: 'combat' | 'sacrifice' | 'tech' }
  | { type: 'SHIP_DAMAGED'; shipId: string; amount: number; source: string }
  | { type: 'PLANET_CONQUERED'; planetId: string; newController: PlayerId }
  | { type: 'PHASE_START'; phase: TurnPhase; player: PlayerId }
  | { type: 'AGE_CHANGED'; from: number; to: number }
  | { type: 'CARD_PLAYED'; cardId: string; player: PlayerId }
  // ... más
```

Las habilidades se registran como:
```ts
{
  trigger: 'SHIP_DAMAGED',
  filter: (event, ctx) => event.shipId === ctx.selfId,  // newen activa cuando el self recibe daño
  effect: (event, state) => /* +1 fuerza permanente */
}
```

---

## 5. Strategy pattern por facción

Cada facción implementa `BaseFactionStrategy`:

```ts
interface BaseFactionStrategy {
  faction: FactionId
  startingDeck: Card[]              // mazo inicial sugerido
  homeworldId: PlanetId             // mundo natal por defecto

  // Mecánicas firma — hooks específicos por facción
  registerKeywords(): KeywordHandler[]
  registerPassives(): PassiveEffect[]
}
```

Ejemplo: `MapucheStrategy` registra el keyword `newen` que se hookea a `SHIP_DAMAGED` para sumar fuerza permanente. `MexicaStrategy` registra `ofrenda` que permite consumir naves propias para potenciar la siguiente jugada.

---

## 6. Port del kernel desde myl-game

`/opt/myl-game/src/engine/` tiene piezas reutilizables que se portan poco a poco a `sexto-sol`:

- ✅ `rng.ts` — RNG seedable
- ✅ `types.ts` — patrón de tipos básicos (algunos)
- ✅ Estructura de Strategy pattern
- ✅ Event bus skeleton
- ❌ Card data (myl-specific, no se porta)
- ❌ Reglas específicas de myl (combate al castillo directo, oro como cartas, etc.)

El port se hace **a demanda** — copiamos cuando necesitamos, no por defecto. Cada pieza portada se renombra/refactoriza para Sexto Sol.

---

## 7. Testing

### Niveles
- **Unit**: cada reducer action, cada keyword handler.
- **Integration**: secuencias de acciones representando partidas reales.
- **Property tests**: invariantes del juego que NUNCA pueden romperse:
  - Total HP nunca negativo
  - Energy income nunca negativo
  - Planetas controlados ⊆ planetas existentes
  - Cards en mano + deck + graveyard = constante (modulo cartas exiliadas)
  - Después de aplicar + revertir una acción, state es idéntico (excepto rng state)
- **Replay tests**: seed + lista de acciones produce siempre el mismo estado final.

### Cobertura objetivo
- Engine puro: ≥90%
- UI: ≥70%
- Globales: ≥80%

---

## 8. UI (cuando arranque)

- **Web-first PWA** (Vite + React 18). Mobile nativo después de validar mecánicas.
- Stack lockeado:
  - TypeScript strict
  - **Tailwind v4** para styling rápido
  - **PixiJS** para canvas del sector estelar (planetas, naves, combat animations, particles)
  - **Framer Motion** para animaciones de cartas (industria estándar para CCGs en React)
  - **Zustand** para game state (sin React Context — Zustand directo)
  - DOM/CSS para cartas en mano y UI (drag/drop nativo, accesibilidad)
- Razón Pixi vs Konva: el sector estelar va a tener muchos sprites animados (naves, partículas, efectos de habilidades). PixiJS es WebGL-first y maneja mejor cantidad. Konva es DOM-canvas-fallback, sufre con sprites pesados.
- HTTP client: TBD cuando haya backend.

---

## 9. Roadmap técnico

### Fase 0 — Infraestructura (semana 1-2)
- [ ] `git init` + repo `Danielrojasv/sexto-sol`
- [ ] `pnpm init` + Node 22 + TypeScript + Vite
- [ ] ESLint + Prettier + Vitest + fast-check
- [ ] CI básico (GitHub Actions: lint + typecheck + test)
- [ ] Pre-commit hook (gitleaks + lint-staged)

### Fase 1 — Engine kernel (semana 3-4)
- [ ] Port RNG seedable desde myl-game
- [ ] Definir GameState types
- [ ] Reducer puro skeleton
- [ ] Event bus
- [ ] Tests baseline (property tests con fast-check)

### Fase 2 — Mecánicas core (semana 5-8)
- [ ] Despliegue básico de naves
- [ ] Combate básico
- [ ] Energía territorial
- [ ] Conquista de planetas
- [ ] Win condition (homeworld destroyed)

### Fase 3 — 4 facciones (semana 9-14)
- [ ] Mapuche con `Newen` + `Lof` (primera, ancla histórica)
- [ ] Inca con `Tributo` + `Mit'a` + `Acllla`
- [ ] Mexica con `Ofrenda`
- [ ] Muisca con `Sumergir`
- [ ] ~30 cartas por facción para set base mínimo

### Fase 4 — UI playable (semana 15-20)
- [ ] React shell
- [ ] Canvas del sector estelar (Konva)
- [ ] Mano + deck + tablero
- [ ] AI greedy básica para playtest solo

### Fase 5 — Multiplayer (TBD)
- [ ] Backend: arquitectura TBD (Node + WebSocket? Cloudflare Workers Durable Objects?)
- [ ] Async PVP estilo Marvel Snap: enviar acciones, replay
- [ ] Matchmaking básico

### Fase 6 — Beta cerrada
- [ ] 50 jugadores invitados
- [ ] Telemetría de balance
- [ ] Iteración de meta

---

*Vivo. Última actualización: 2026-05-08.*
