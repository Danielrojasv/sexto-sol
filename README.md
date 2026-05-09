# Sexto Sol

> _"El Quinto Sol está terminando. Cuatro razas espaciales pelean por quién controlará el Sexto. Pero el virus que las infecta fue traído del futuro al pasado por los Sabios que intentaban salvarlas."_

Un TCG de combate directo entre cuatro razas espaciales — **Q'ralan, Würon, Tezhal, Zaqe** — descendientes de civilizaciones ancestrales de un mismo sistema estelar. Construido sobre un bucle causal cerrado tipo Evangelion / Dark / Steins;Gate.

## Innovación central

- **Sistema de Resolución por Naturaleza de Mecánica**: cada raza pelea según una categoría (Reactiva / Iniciativa / Acumulativa / Post-combate), y el orden natural de resolución produce un counter wheel emergente sin reglas hardcodeadas.
- **Habilidades duales Luz/Sombra** en Legendarias.
- **3 Edades como escalada de poder narrativo**: firma cuesta +1 en Edad I, normal en II, x2 en III + daño directo desde la mano.

## Pilares de diseño

- **PVP coleccionable** estilo Marvel Snap / Legends of Runeterra
- **Soft P2W** — F2P competitivo, monetización vía boosters + battle pass + cosmética. NO MTG-tier brutal, sin singles market.
- **Counter wheel emergente** del sistema de resolución, no hardcoded
- **Energía territorial** con planetas no conquistables (recursos compartidos con Dones únicos)
- **Sin rotación** — las cartas no se descartan por tiempo, se balancean con nerfs/buffs

## Ancla cultural

Las razas son **inventadas**. Las culturas precolombinas reales (Mapuche, Inca, Mexica, Muisca, Maya, etc.) aparecen como **ecos resonantes** en el lore — memoria parcial del camino correcto, no razas jugables. Ver `CANON-LORE.md`.

## Estado del proyecto

🚧 **Pre-alpha — diseño v2.0 (mayo 2026).** Phase 0 técnica cerrada, Phase 1 (engine kernel) en planeamiento.

## Stack

TypeScript / Vite / React 18 / Vitest. Engine event-driven con reducer puro. Canvas con PixiJS, animaciones con Framer Motion, state con Zustand, styling con Tailwind v4.

## Documentación

- `CLAUDE.md` — contexto para colaboradores y agentes IA
- `GAME-RULES.md` — reglas oficiales del juego (v2.0, vivo)
- `CANON-LORE.md` — cosmología y narrativa canónica (v2.0, vivo)
- `ARCHITECTURE.md` — patrones técnicos del engine
- `BACKLOG.md` — roadmap actual
- `docs/specs/` — Spec-Driven Development
- `docs/lore/arco-del-jugador.md` — biblia narrativa trans-expansiones
