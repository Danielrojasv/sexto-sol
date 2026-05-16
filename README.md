# Sexto Sol

> _"El Quinto Sol está terminando. Cuatro razas espaciales pelean por quién controlará el Sexto. Pero el virus que las infecta fue traído del futuro al pasado por los Sabios que intentaban salvarlas."_

Un juego PVP de cartas entre cuatro razas espaciales — **Q'ralan, Würon, Tezhal, Zaqe** — descendientes de civilizaciones ancestrales de un mismo sistema estelar. Construido sobre un bucle causal cerrado tipo Evangelion / Dark / Steins;Gate.

Desde **v4.2 (mayo 2026)**, el juego es **"El Peregrinaje del Héroe — Premonición como Lectura"**: cada jugador comanda un héroe que se forja en un peregrinaje cósmico por 3 tramos (Nebulosa → Estrellas → Sexto Sol), nutriendo sus 3 atributos (**Fuerza**, **Resguardo**, **Resonancia**) con cada acción. En el clímax, los dos héroes se enfrentan comparando sus 3 atributos finales — **gana el héroe superior en al menos 2 de 3**.

## Innovación central

- **Acción oculta + Premonición oculta (lectura)**: cada turno los jugadores comprometen, en paralelo y oculto, (a) una carta boca abajo y (b) una predicción de qué categoría jugará el oponente. Al revelar: si tu predicción acierta, la carta del rival pierde su `penalizacion_acierto`; si falla, gana +1.
- **Duelo de héroes 2-de-3 estilo Marvel Snap**: el clímax compara 3 atributos lado a lado. Ganar Fuerza extrema y descuidar los otros dos te hace perder.
- **Elección secreta de planeta**: en Nebulosa y Estrellas, cada jugador elige uno de 3 planetas (Atq/Def/Rit) que da +1 fuerza a las cartas de su categoría durante el tramo.
- **Eclipse**: 1 vez por partida en el Sexto Sol — tu acción cuenta doble, el oponente roba 1 carta extra, la partida termina.

## Pilares de diseño

- **PVP coleccionable** estilo Marvel Snap / Legends of Runeterra.
- **Soft P2W** — F2P competitivo, monetización vía boosters + battle pass + cosmética.
- **Sustracción radical**: cada nueva regla debe primero preguntar "¿puedo resolverlo eliminando algo?".
- **Sin rotación** — las cartas no se descartan por tiempo, se balancean con nerfs/buffs.

## Ancla cultural

Las razas son **inventadas**. Las culturas precolombinas reales (Mapuche, Inca, Mexica, Muisca, Maya, etc.) aparecen como **ecos resonantes** en el lore — memoria parcial del camino correcto, no razas jugables. Ver `CANON-LORE.md`.

## Estado del proyecto

🚧 **v4.2 — engine + UI completos para playtest manual (mayo 2026).**

- Engine TypeScript v4.2 funcional con scriptedAI determinista. 154 tests verdes, 93%+ coverage global.
- UI React jugable: `pnpm dev` permite jugar vs IA o Hot-seat (Tezhal-Aggro vs Würon-Control).
- Modelo "Premonición como Lectura": premonición oculta, afecta la carta del rival (-pen_acierto si acierta, +1 si falla).
- 2 razas activas (Tezhal + Würon), 30 cartas de Acción + 6 planetas + 4 mazos preconstruidos.
- Q'ralan y Zaqe en lore vivo pero sin cartas activas — vuelven en set 2.

## Stack

TypeScript / Vite / React 18 / Zustand / Tailwind v4 / Framer Motion (uso mínimo) / Vitest + fast-check. Engine puro (reducer + interpreter) trasladable a Node.js sin browser deps (`portability.test.ts` lo garantiza).

## Documentación

- `CLAUDE.md` — contexto para colaboradores y agentes IA.
- `GAME-RULES.md` — reglas oficiales del juego (v4.2).
- `CANON-LORE.md` — cosmología y narrativa canónica.
- `ARCHITECTURE.md` — patrones técnicos del engine.
- `BACKLOG.md` — roadmap actual.
- `docs/specs/peregrinaje-v4.1.md` — spec del cambio de paradigma v3→v4.1 (heredada).
- `docs/specs/shipped/engine-v4.1-migration.md` — spec de la migración v3→v4.1 (cerrada).
- `docs/specs/shipped/engine-v4.2-migration.md` — spec del refactor v4.1→v4.2 (cerrada).
- `docs/playtest/cards-v4.2/` — pool de cartas YAML actual.
- `docs/playtest/decks-v4.1/` — 4 mazos preconstruidos (IDs compatibles con v4.2).
- `docs/archive/` — versiones anteriores (v2.0, v3.0, v4.0, v4.1 GAME-RULES).

## Cómo jugar localmente

```bash
pnpm install
pnpm dev
# Abrir http://localhost:5173/
```

Para correr tests:

```bash
pnpm test:run
pnpm test:coverage
```

Para validar pool de cartas:

```bash
pnpm validate:cards
```
