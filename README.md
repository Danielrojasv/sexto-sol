# Sexto Sol

> *"El Quinto Sol está terminando. Las cuatro civilizaciones de los cuatro mundos pelean por quién controlará el Sexto."*

Un CCG (Collectible Card Game) PVP inspirado en una **reimaginación sci-fi de las civilizaciones pre-colombinas**. Las facciones — Mexica, Inca, Muisca, Mapuche — desarrollaron tecnología y cosmología avanzadas en sus propios planetas dentro de un mismo sistema estelar.

## Premisa

Subvierte el trope colonialista de "los aliens ayudaron a las civilizaciones pre-colombinas a evolucionar". En Sexto Sol, las civilizaciones son auto-suficientes y aliens entre sí — ningún imperio externo (europeo o galáctico) las "salvó" del primitivismo. El Quinto Sol cósmico (la era actual según la cosmología mexica) está terminando. Cuatro civilizaciones pelean por controlar el Sexto.

## Pilares de diseño

- **PVP coleccionable** estilo Marvel Snap / Legends of Runeterra
- **Soft P2W** — F2P competitivo, monetización vía boosters + battle pass + cosmética. NO MTG-tier brutal.
- **Balance histórico** — el counter wheel respeta hechos reales (Mapuche resistió al imperio Inca → Mapuche cuenta como counter del Inca en el juego)
- **Energía territorial** — sin mana automático lineal; tu recurso depende de los planetas que controlás
- **Sin rotación** — las cartas no se descartan por tiempo (se balancean con nerfs/buffs estilo Marvel Snap)
- **Espacial** — el tablero es un sistema estelar con planetas, no abstracto

## Estado del proyecto

🚧 **Pre-alpha — diseño en curso.** Spec maestra viva en `docs/specs/design-v0.md`.

## Stack

TypeScript / Vite / React 18 / Vitest. Engine event-driven con reducer puro (port del kernel `myl-game`).

## Documentación

- `CLAUDE.md` — contexto para colaboradores y agentes IA
- `GAME-RULES.md` — reglas del juego (vivo)
- `ARCHITECTURE.md` — patrones técnicos del engine
- `BACKLOG.md` — roadmap actual
- `docs/specs/` — Spec-Driven Development

## Sensibilidad cultural

Las facciones están inspiradas en pueblos pre-colombinos reales. La premisa sci-fi reduce el riesgo de apropiación, pero no lo elimina. Nos comprometemos a consultar con personas y expertos de esas culturas para arte, flavor text y nombres en lenguas indígenas (mapuzungun, quechua, náhuatl, muysccubun).
