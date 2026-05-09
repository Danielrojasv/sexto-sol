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
  seed: number // RNG seed (immutable)
  rngState: number // current RNG state (mutable across turns)
  turn: number // global turn counter
  age: 1 | 2 | 3 // current Edad
  activePlayer: 'p1' | 'p2'
  phase: TurnPhase // 'recoleccion' | 'despliegue' | 'combate' | 'regroup' | 'vigilia'

  players: {
    p1: PlayerState
    p2: PlayerState
  }

  sector: SectorState // tablero espacial
  pendingEvents: GameEvent[] // event bus queue
  log: GameAction[] // action log para replay
}

type PlayerState = {
  race: 'quralan' | 'wuron' | 'tezhal' | 'zaqe'
  homeworld: { hp: number; maxHp: number } // HP base 20
  hero: HeroInstance | null // 1 héroe por mazo
  hand: Card[]
  deck: Card[] // ordered, top of deck = index 0
  graveyard: Card[]
  energy: number // gastable este turno (no acumula)
  fleet: ShipInstance[] // naves desplegadas en el campo
}

type SectorState = {
  planets: PlanetState[] // 3 planetas neutrales con Don revelado al setup
}

type PlanetState = {
  id: PlanetId
  name: string
  gift: PlanetGift // efecto único activable (Don del Archivo, etc.)
  exhausted: boolean // true después de activarse, hasta el próximo turno del activador
  exhaustedBy: PlayerId | null // quién lo agotó (vuelve disponible al inicio de su turno)
}

// Categorías de mecánica que dictan el orden de resolución del event bus.
type MechanicCategory = 'reactive' | 'initiative' | 'accumulative' | 'post_combat'

type Age = 1 | 2 | 3 // I, II, III; transición global en turnos 5 y 9
```

---

## 3. Acciones (lo que el jugador puede hacer)

```ts
type GameAction =
  | { type: 'PLAY_CARD'; cardId: string; targets?: Target[] }
  | { type: 'DECLARE_ATTACK'; attackerShipId: string; target: Target } // sin DECLARE_BLOCK — bloqueo solo via Bastión
  | { type: 'ACTIVATE_PLANET'; planetId: PlanetId } // activa Don del planeta, agota
  | { type: 'ACTIVATE_HERO_POWER'; abilityId: string } // hero power Edad I+
  | { type: 'DEPLOY_HERO' } // Edad II+
  | { type: 'ACTIVATE_ABILITY'; sourceId: string; abilityId: string }
  | { type: 'END_PHASE' }
  | { type: 'CONCEDE'; player: 'p1' | 'p2' }
```

El reducer aplica una acción y devuelve `{ newState, eventsTriggered }`. Los eventos se procesan después por el event bus.

---

## 4. Event bus + Resolución por Naturaleza de Mecánica

Habilidades triggered escuchan eventos. Cuando un evento ocurre, todas las habilidades suscriptas se evalúan **en orden de categoría de mecánica**:

1. **Reactive** (Würon)
2. **Initiative** (Tezhal)
3. **Accumulative** (Q'ralan)
4. **Post-combat** (Zaqe)

Este orden es la regla central del juego. Produce el counter wheel emergente sin lógica hardcodeada por raza. La keyword `Premonition` permite a una habilidad romper el orden y resolver primero.

```ts
type GameEvent =
  | { type: 'SHIP_DESTROYED'; shipId: string; cause: 'combat' | 'sacrifice' | 'ability' }
  | { type: 'SHIP_DAMAGED'; shipId: string; amount: number; source: string }
  | { type: 'PLANET_ACTIVATED'; planetId: string; activatedBy: PlayerId }
  | { type: 'PHASE_START'; phase: TurnPhase; player: PlayerId }
  | { type: 'AGE_CHANGED'; from: Age; to: Age }
  | { type: 'CARD_PLAYED'; cardId: string; player: PlayerId }
  | { type: 'HERO_DEPLOYED' | 'HERO_RETURNED'; player: PlayerId }
// ... más
```

Las habilidades se registran como:

```ts
{
  trigger: 'SHIP_DAMAGED',
  category: 'reactive',                                  // dicta el orden de resolución
  premonition: false,                                    // si true, salta antes de cualquier categoría
  filter: (event, ctx) => event.shipId === ctx.selfId,   // ej. Külen activa cuando el self recibe daño
  effect: (event, state) => /* +1 fuerza permanente */
}
```

---

## 5. Strategy pattern por raza

Cada raza implementa `BaseRaceStrategy`:

```ts
interface BaseRaceStrategy {
  race: RaceId // 'quralan' | 'wuron' | 'tezhal' | 'zaqe'
  category: MechanicCategory // categoría firma (reactive | initiative | accumulative | post_combat)
  signatureKeyword: string // 'kulen' | 'ignicion' | 'formacion_solar' | 'refluencia'
  startingDeck: Card[] // mazo inicial sugerido
  heroOptions: HeroDefinition[] // 1-3 héroes elegibles

  // Mecánicas firma — hooks específicos por raza
  registerKeywords(): KeywordHandler[]
  registerPassives(): PassiveEffect[]
}
```

Ejemplos:

- `WuronStrategy` registra el keyword `kulen` que se hookea a `SHIP_DAMAGED` (categoría `reactive`) para sumar +1 fuerza permanente al receptor.
- `TezhalStrategy` registra `ignicion` (categoría `initiative`) que permite consumir naves propias para potenciar otra acción.
- `QuralanStrategy` registra `formacion_solar` (categoría `accumulative`): cada nave Q'ralan en el campo otorga +1 fuerza a las demás.
- `ZaqeStrategy` registra `refluencia` (categoría `post_combat`): naves derrotadas vuelven al fondo del mazo, -1 al ser robadas otra vez.

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

### Fase 0 — Infraestructura ✅

- Scaffold Vite + React 18 + TS strict, ESLint + Prettier + Vitest + fast-check, CI con gitleaks, husky pre-commit. Cerrada 2026-05-08.

### Fase 1 — Engine kernel

- [ ] Port RNG seedable desde myl-game (splitmix32 + xoshiro128\*\*)
- [ ] Definir GameState types (con `MechanicCategory`, `Age`, `PlanetGift`, `Hero`)
- [ ] Reducer puro skeleton + acciones triviales (CONCEDE, END_PHASE)
- [ ] Event bus con resolución por categoría (Reactive→Initiative→Accumulative→Post-combat) + Premonition
- [ ] Strategy pattern base + 4 esqueletos (Q'ralan, Würon, Tezhal, Zaqe)
- [ ] Property tests baseline (fast-check) sobre invariantes
- [ ] Replay tests deterministas

### Fase 2 — Mecánicas core

- [ ] Despliegue de naves
- [ ] Combate simultáneo (sin DECLARE_BLOCK; bloqueo solo via Bastión)
- [ ] Daño residual via Desgarro
- [ ] Energía territorial: mundo natal +1, planetas neutros activables (gastá 1 → +1)
- [ ] Activación de Don de planeta (efecto único + agotamiento)
- [ ] Transición de Edades (turno 5 → II, turno 9 → III) con costo +1 / normal / x2 a la firma
- [ ] Win condition: mundo natal HP 0
- [ ] Sistema de Héroe (Edad I residente, Edad II desplegable, Edad III natales)

### Fase 3 — 4 razas (set base mínimo, ~30 cartas por raza)

- [ ] Würon con `Külen` (Reactiva) — primera por ancla narrativa
- [ ] Q'ralan con `Formación Solar` (Acumulativa)
- [ ] Tezhal con `Ignición` (Iniciativa)
- [ ] Zaqe con `Refluencia` (Post-combate)
- [ ] Habilidades duales Luz/Sombra en Legendarias
- [ ] 1-3 héroes por raza
- [ ] 12-16 Dones de planetas únicos

### Fase 4 — UI playable

- [ ] React shell + routing
- [ ] Canvas del sector estelar (PixiJS)
- [ ] Mano + deck + tablero + héroe en mundo natal
- [ ] AI scripted ("si puedo matar, mato; si no, defiendo")
- [ ] Modo "Playtest local" (1 humano vs IA + hot-seat)

### Fase 5 — Multiplayer (TBD)

- [ ] Backend: arquitectura TBD (Node + WebSocket vs Cloudflare Durable Objects)
- [ ] Async PVP estilo Marvel Snap: enviar acciones, replay
- [ ] Matchmaking básico

### Fase 6 — Beta cerrada

- [ ] 50 jugadores invitados
- [ ] Telemetría de balance por raza
- [ ] Iteración de meta

---

_Vivo. Última actualización: 2026-05-09._
