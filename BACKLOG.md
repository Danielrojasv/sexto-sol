# BACKLOG — Sexto Sol

Formato: `[status] título — nota`. Status: ` ` pending, `x` done, `~` in progress, `-` cancelled.

> Para detalles técnicos, ver `ARCHITECTURE.md` Fase X. Para diseño, ver `docs/specs/design-v0.md`.

---

## Fase 0 — Infraestructura ✅

- [x] Crear scaffold del repo (`/opt/sexto-sol/`)
- [x] CLAUDE.md, README.md, GAME-RULES.md, ARCHITECTURE.md, BACKLOG.md, docs/specs/\_template.md
- [x] Spec maestra `design-v0.md` viva
- [x] `git init` + push a repo `Danielrojasv/sexto-sol` (privado)
- [x] `pnpm init` + Node 22 + TypeScript + Vite scaffold
- [x] ESLint + Prettier + Vitest + fast-check
- [x] CI básico (lint + typecheck + test + build + gitleaks)
- [x] Pre-commit hook (husky + tsc + lint-staged + gitleaks graceful)
- [x] SECURITY-RULES.md y PERFORMANCE-RULES.md (placeholders, vivos)
- [ ] Coverage gate diferido a Phase 1 (cuando haya tests reales)

## Fase 1 — Engine kernel

- [ ] Port `rng.ts` desde myl-game (splitmix32 + xoshiro128\*\*, seed conocida)
- [ ] Definir `GameState` types (con `MechanicCategory`, `Age`, `PlanetGift`, `Hero`)
- [ ] Reducer puro skeleton + acciones triviales (CONCEDE, END_PHASE)
- [ ] Event bus con resolución por categoría (Reactive→Initiative→Accumulative→Post-combat) + Premonition
- [ ] Strategy pattern base + skeleton vacío para las 4 razas (Q'ralan, Würon, Tezhal, Zaqe)
- [ ] Property tests baseline con fast-check (invariantes)
- [ ] Replay tests: seed + acciones producen mismo state

## Fase 2 — Mecánicas core

- [ ] Despliegue de naves
- [ ] Combate simultáneo (sin DECLARE_BLOCK; bloqueo solo via Bastión)
- [ ] Daño residual via Desgarro
- [ ] Energía territorial: mundo natal +1, activación de planetas neutros (gastá 1 → +1)
- [ ] Dones de planetas (efecto único + agotamiento hasta el próximo turno del activador)
- [ ] Transición entre Edades (turnos 5/9 globales) con costo +1 / normal / x2 a la firma
- [ ] Win condition: mundo natal HP 0
- [ ] Sistema de Héroe (Edad I residente / Edad II desplegable / Edad III natales)

## Fase 3 — Razas (set base, ~30 cartas por raza)

### Würon (PRIMERA — categoría Reactiva, ancla narrativa)

- [ ] `Külen`: nave gana +1 fuerza permanente al recibir daño
- [ ] `Lof`: clanes vinculados se buffean entre sí
- [ ] ~30 cartas iniciales (placeholder design)

### Q'ralan (Acumulativa)

- [ ] `Formación Solar`: +1 fuerza por cada otra nave Q'ralan en juego
- [ ] `Mit'a interno` (submecánica): tributo acumulado activa habilidades especiales
- [ ] ~30 cartas

### Tezhal (Iniciativa)

- [ ] `Ignición`: sacrificás nave propia para potenciar otra acción
- [ ] ~30 cartas

### Zaqe (Post-combate)

- [ ] `Refluencia`: naves derrotadas vuelven al fondo del mazo, -1 al ser robadas otra vez
- [ ] ~30 cartas

### Cross-raza

- [ ] Habilidades duales Luz/Sombra en Legendarias (Sombra activa por condición de la firma)
- [ ] 1-3 héroes por raza
- [ ] 12-16 Dones de planetas únicos

## Fase 4 — UI playable

- [ ] React shell + routing
- [ ] Canvas del sector estelar (PixiJS)
- [ ] Mano + deck + tablero + héroe en mundo natal
- [ ] Drag & drop de cartas
- [ ] Animaciones de combate básicas
- [ ] AI scripted ("si puedo matar, mato; si no, defiendo")
- [ ] Modo "Playtest local" (1 humano vs IA + hot-seat)

## Fase 5 — Multiplayer (TBD)

- [ ] Decidir arquitectura backend (Node + WebSocket vs Cloudflare Durable Objects vs otro)
- [ ] Esquema de cuenta de usuario + auth
- [ ] Async PVP estilo Marvel Snap
- [ ] Matchmaking básico
- [ ] Persistencia de mazos
- [ ] Telemetría básica

## Fase de Lore (paralela a las técnicas)

Derivada del **Arco del Jugador** (`docs/lore/arco-del-jugador.md` v1.0). Estos son los próximos pasos sugeridos al final de ese documento — son requisitos para diseñar cualquier carta o cinemática del set base con autoridad narrativa.

- [ ] **Cuatro despertares** — material foundational del set base. Cómo cada civilización (Mexica, Inca, Muisca, Mapuche) descubrió/desarrolló su tecnología espacial en aislamiento, narrado desde su propia cosmología. Sirve como ancla narrativa de cada faction.
- [ ] **Perfiles detallados de los 4 líderes legendarios** — uno por civilización para el set base. Cada uno con sus sospechas privadas (que el jugador NO lee directamente — están implícitas en flavor text, no explícitas).
- [ ] **Catálogo concreto de pistas de los Sabios para set base** — qué pistas se siembran en cartas/eventos del set base que solo se revelarán como pistas en Mini 1.1+. Disciplina: deben pasar desapercibidas en su momento (Regla 3 del arco).
- [ ] **Diseño de las 6-10 cartas de "susurro mecánico"** — cartas del set base que tienen efectos extraños/inexplicables que en Mini 1.2 se reinterpretarán como manifestaciones tempranas del virus. Cuáles son, qué efecto raro tienen, cómo se reinterpretan.
- [ ] **Spec de las "5 rutas del Sexto Sol"** — qué representa cada ruta cosmológicamente, cómo se determina canónicamente cuál ruta predomina al cierre del bloque inicial (encuesta entre jugadores? meta de torneos? evento global? decisión narrativa del equipo?), cómo se ofrece la "sexta opción" (romper el bucle) al jugador.
- [ ] **Sub-spec del virus** — Regla 4 (no tiene voz, no se personifica). Cómo se manifiesta mecánicamente (efectos de Corrupción, propagación, espejos oscuros). Cómo se invoca sin invocar.
- [ ] **Sub-spec de la Tierra-tumba** — Regla 6 (espejo, no escenario). Cómo se referencia en flavor text del set base sin desarrollarse, cómo se desarrolla parcialmente en Mini 1.3, cómo se mantiene fuera de cuadro a perpetuidad.

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

4 razas: Q'ralan, Würon, Tezhal, Zaqe. ~120-150 cartas.

### Expansiones futuras (TBD)

Mecanismos canónicos para introducir nuevas razas (ver `CANON-LORE.md` §10):

- **Semillas tardías** — semillas que viajaron más lento por el espacio-tiempo y recién despiertan.
- **Civilizaciones terrestres que escaparon** — pueblos que preservaron suficiente conexión con su semilla original como para emerger después como civilizaciones espaciales jóvenes.
- **Civilizaciones de otros sistemas estelares** — semillas que cayeron en mundos imprevistos.

Para cada raza nueva: nombre propio inventado, cosmovisión inspirada pero distinta, categoría de mecánica (Reactiva / Iniciativa / Acumulativa / Post-combate o nueva), eco terrestre en lore (sin nombrarlo como raza jugable).

### Posible facción "Espejo Oscuro"

Versiones tecno-industriales corruptas de cada raza, manifestación del virus. Material para Edición 2 o 3, no del set inicial. Ver `CANON-LORE.md` §6.4.

---

## Open questions / decisiones pendientes

- [ ] Multiplayer realtime o async?
- [ ] Async tipo Marvel Snap (turnos enviados) vs LoR (sesiones live)?
- [ ] Sobres como modelo principal o subscripción?
- [ ] Engine híbrido determinista + UI procedural (para animations)?
- [ ] Voice acting / soundtrack original?
- [ ] Lista cerrada de Dones de planetas (target: 12-16)
- [ ] Confirmación de nombres definitivos de mecánicas firma (Külen, Ignición, Formación Solar, Refluencia son provisionales)
- [ ] Diseño de los 4 héroes principales (1 por raza para v0.1)
- [ ] Reglas para cartas multi-categoría (si las habrá)

---

_Vivo. Última actualización: 2026-05-08._
