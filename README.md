# Sexto Sol

> _"El Quinto Sol está terminando. Cuatro razas espaciales pelean por quién controlará el Sexto. Pero el virus que las infecta fue traído del futuro al pasado por los Sabios que intentaban salvarlas."_

Un TCG de combate directo entre cuatro razas espaciales — **Q'ralan, Würon, Tezhal, Zaqe** — descendientes de civilizaciones ancestrales de un mismo sistema estelar. Construido sobre un bucle causal cerrado tipo Evangelion / Dark / Steins;Gate.

## Innovación central

- **Sistema de Resolución por Naturaleza de Mecánica**: cada raza pelea según una categoría (Reactiva / Iniciativa / Acumulativa / Post-combate), y el orden natural de resolución produce un counter wheel emergente sin reglas hardcodeadas.
- **Capas de habilidad por carta**: stats + keywords + habilidad individual única. Mecánicas firma (Külen, Formación Solar, Ignición, Refluencia) son keywords explícitas, imprimibles por carta.
- **Cuatro archetypes ortogonales validados**: Külen-stacking (Würon), Kamikaze-tempo (Tezhal), Formación Solar masa-control (Q'ralan), Persistencia económica (Zaqe).

## Pilares de diseño

- **PVP coleccionable** estilo Marvel Snap / Legends of Runeterra.
- **Soft P2W** — F2P competitivo, monetización vía boosters + battle pass + cosmética. Sin singles market estilo MTG.
- **Counter wheel emergente** del sistema de resolución, no hardcoded.
- **Energía automática creciente** (+1/turno, cap 10) en v3.0. Otras capas (planetas neutrales, Edades, héroes pasivos) están removidas temporalmente para validar el core; pueden volver en versiones futuras.
- **Sin rotación** — las cartas no se descartan por tiempo, se balancean con nerfs/buffs.

## Ancla cultural

Las razas son **inventadas**. Las culturas precolombinas reales (Mapuche, Inca, Mexica, Muisca, Maya, etc.) aparecen como **ecos resonantes** en el lore — memoria parcial del camino correcto, no razas jugables. Ver `CANON-LORE.md`.

## Estado del proyecto

🚧 **Pre-alpha — diseño v3.0 (mayo 2026).**

**Lo que está validado:**

- Set base v3.0 cerrado: 74 cartas únicas (Q'ralan 19, Würon 19, Tezhal 18, Zaqe 18).
- 4 mecánicas firma con texto canónico estable (Külen, Formación Solar, Ignición, Refluencia).
- DSL v3.0.3 schema-eado para los efectos de cartas (`src/data/primitives/spec.ts`).
- Loop de validación completo: 4 agents IA (`card-designer`, `deck-builder`, `game-simulator`, `balance-analyst`) operativos en `.claude/agents/`.
- 12 mazos canónicos del meta para playtesting offline (`docs/playtest/decks/`).
- Auditorías de los 4 canarys del set base en `docs/audits/`.

**Lo que sigue:**

- Phase 1: Engine kernel TypeScript funcional (interpreter de primitives).
- Web MVP jugable (single-player vs IA + hot-seat).

## Stack

TypeScript / Vite / React 18 / Vitest. Engine event-driven con reducer puro. Canvas con PixiJS, animaciones con Framer Motion, state con Zustand, styling con Tailwind v4. Validación offline con tooling Python (`scripts/sim/`, `scripts/analyst/`) — independiente del runtime web.

## Documentación

- `CLAUDE.md` — contexto para colaboradores y agentes IA.
- `GAME-RULES.md` — reglas oficiales del juego (v3.0).
- `CANON-LORE.md` — cosmología y narrativa canónica (v2.0).
- `ARCHITECTURE.md` — patrones técnicos del engine.
- `BACKLOG.md` — roadmap actual.
- `docs/audits/` — auditorías de los 4 canarys del set base.
- `docs/specs/` — Spec-Driven Development.
- `docs/playtest/` — mazos canónicos, logs de validación offline, análisis de balance.
- `docs/lore/arco-del-jugador.md` — biblia narrativa trans-expansiones.

## Estado del v2.0

GAME-RULES v2.0 archivado en `docs/archive/GAME-RULES-v2.0.md` como referencia histórica. Capas removidas temporalmente en v3.0 (planetas neutrales, Edades I/II/III, héroes pasivos en mundo natal, Luz/Sombra en Legendarias, Resonancia) están listadas para posible re-introducción gradual en versiones futuras una vez que el core esté validado — ver `BACKLOG.md`.
