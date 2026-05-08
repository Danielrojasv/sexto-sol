# BACKLOG — Sexto Sol

Formato: `[status] título — nota`. Status: ` ` pending, `x` done, `~` in progress, `-` cancelled.

> Para detalles técnicos, ver `ARCHITECTURE.md` Fase X. Para diseño, ver `docs/specs/design-v0.md`.

---

## Fase 0 — Infraestructura (en curso)

- [x] Crear scaffold del repo (`/opt/sexto-sol/`)
- [x] CLAUDE.md, README.md, GAME-RULES.md, ARCHITECTURE.md, BACKLOG.md, docs/specs/_template.md
- [x] Spec maestra `design-v0.md` viva
- [ ] `git init` + push a repo `Danielrojasv/sexto-sol` (pendiente decisión: privado vs público)
- [ ] `pnpm init` + Node 22 + TypeScript + Vite scaffold
- [ ] ESLint + Prettier + Vitest + fast-check
- [ ] CI básico (lint + typecheck + test)
- [ ] Pre-commit hook (gitleaks + lint-staged + coverage gate)
- [ ] SECURITY-RULES.md y PERFORMANCE-RULES.md (cuando haya código)

## Fase 1 — Engine kernel

- [ ] Port `rng.ts` desde myl-game (con seed conocida)
- [ ] Definir `GameState` types
- [ ] Reducer puro skeleton + acciones básicas
- [ ] Event bus + queue de eventos pendientes
- [ ] Strategy pattern base + skeleton vacío para las 4 facciones
- [ ] Property tests baseline con fast-check (invariantes)
- [ ] Replay tests: seed + acciones producen mismo state

## Fase 2 — Mecánicas core

- [ ] Despliegue de naves
- [ ] Combate (atacante / defensor / daño simultáneo)
- [ ] Energía territorial (mundo natal genera 1, conquistar planeta = +1)
- [ ] Conquista de planetas neutrales
- [ ] Reconquista de planetas enemigos
- [ ] Win condition: homeworld destruido
- [ ] Transición entre Edades (turn-based)

## Fase 3 — Facciones (set base)

### Mapuche (PRIMERA — ancla histórica del balance)
- [ ] `Newen` keyword: nave gana +1 fuerza permanente cuando recibe daño
- [ ] `Lof` keyword: 2+ naves Mapuche en mismo planeta se buffean
- [ ] ~30 cartas iniciales (placeholder design)

### Inca
- [ ] `Tributo` keyword
- [ ] `Mit'a` keyword
- [ ] `Acllla` keyword
- [ ] ~30 cartas

### Mexica
- [ ] `Ofrenda` keyword
- [ ] ~30 cartas

### Muisca
- [ ] `Sumergir` keyword
- [ ] ~30 cartas

## Fase 4 — UI playable

- [ ] React shell + routing
- [ ] Canvas del sector estelar (Konva)
- [ ] Mano + deck + tablero
- [ ] Drag & drop de cartas
- [ ] Animaciones de combate básicas
- [ ] AI greedy básica (port de myl-game greedy AI)
- [ ] Modo "Playtest local" (1 humano vs AI)

## Fase 5 — Multiplayer (TBD)

- [ ] Decidir arquitectura backend (Node + WebSocket vs Cloudflare Durable Objects vs otro)
- [ ] Esquema de cuenta de usuario + auth
- [ ] Async PVP estilo Marvel Snap
- [ ] Matchmaking básico
- [ ] Persistencia de mazos
- [ ] Telemetría básica

## Fase 6 — Beta + monetización

- [ ] 50 jugadores invitados
- [ ] Métricas de balance (winrate por facción)
- [ ] **Sobres**: 5 cartas, 1 garantizada Rara+, 150 oro o $1.99 USD; pity timer cada 10 sobres
- [ ] **Crafting de cartas con polvo**: 25/100/400/1600 desencanto, 4× para craft
- [ ] **Pase del Sol** (suscripción mensual $9.99): +25% oro, +1 sobre/día, pity timer mejorado, battle pass premium
- [ ] **Bundles**: set base completo $59.99, faction bundles $19.99, starter bundle $19.99
- [ ] **Cosméticos premium**: variantes de carta, tableros, finishers, avatars, marcos por facción
- [ ] **Math F2P validation**: ~3 meses a colección base completa para F2P, ~5-6 semanas para suscriptor
- [ ] Decisión: launch en Steam, mobile (RN/Capacitor), web (PWA)?

## Fase 7 — Lanzamiento

- [ ] Localización español + inglés (lanzamiento)
- [ ] Localización portugués (con expansión Tupi-Guaraní)
- [ ] Marketing inicial
- [ ] Tournaments comunitarios

---

## Roadmap de ediciones (post-lanzamiento)

### Set base — "Sexto Sol" (lanzamiento)
4 facciones: Mexica, Inca, Muisca, Mapuche. ~120-150 cartas.

### Mini 1.1 — "Las Estrellas Recuerdan" (~3 meses post-lanzamiento)
Plot reveal: los aliens vinieron a aprender, no a enseñar. Keyword `Eco` (cartas se repiten en ciclos posteriores). ~40-60 cartas.

### Mini 1.2 — "Pachacuti" (~6 meses)
Facción **Maya** entra (astronomía / manipulación temporal). ~40-60 cartas.

### Mini 1.3 — "El Quinto Sol" (~9 meses)
Climax narrativo. Las civilizaciones deben aliarse o competir por el Sexto Sol. Keyword `Alianza`.

### Edición 2 — "Eclipse" (~12 meses)
Segunda edición base. Convergencia de las facciones. Posible facción nueva: **Mochica**.

### Localizaciones que desbloquean facciones
- 🇵🇹/🇧🇷 **Lanzamiento portugués**: facción Tupi-Guaraní
- 🇮🇹/🇪🇸 **Lanzamiento europeo**: ¿Olmecas? (lore "ancient mystery")
- 🇨🇴/🇻🇪 **Lanzamiento norte sudamericano**: profundización de Muisca + Tairona
- 🇨🇱 **Edición especial**: Selk'nam (austral, Tierra del Fuego)

---

## Open questions / decisiones pendientes

- [ ] Repo público o privado al inicio?
- [ ] Stack frontend mobile-first o web-first?
- [ ] Multiplayer realtime o async?
- [ ] Async tipo Marvel Snap (turnos enviados) vs LoR (sesiones live)?
- [ ] Sobres como modelo principal o subscripción?
- [ ] Engine híbrido determinista + UI procedural (para animations)?
- [ ] Voice acting / soundtrack original?

---

*Vivo. Última actualización: 2026-05-08.*
