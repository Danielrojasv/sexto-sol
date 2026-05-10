# Canary Zaqe — Eventos, Reliquias y Tecnologías (Prompts 2/3/4)

**Fecha:** 2026-05-10
**Alcance:** **canary deploy sólo Zaqe**. 4 eventos nuevos + 2 reliquias adicionales + 2 tecnologías adicionales = **8 cartas**. Mismo patrón que los canarys Würon (`prompt-2-3-4-wuron-canary.md`), Tezhal (`prompt-2-3-4-tezhal-canary.md`) y Q'ralan (`prompt-2-3-4-qralan-canary.md`). **Es el último canary del set base.** Después de este queda completo: 74 cartas, 4 razas, 4 archetypes ortogonales, criterios de nerf por raza, DSL v3.0.3.

> **Modo proposal — NO se han escrito JSONs.** Después de tu OK voy con commits separados:
>
> 0. `docs(rules): agregar revival reset + HP máximo al reminder Refluencia sec 7.4` (canónico — pre-respondido en handoff, ver Q3)
> 1. `feat(dsl): primitives v3.0.3 (zone pozo_astral + cost_modifier + chosen_permanent)` — schema-only, engine impl pending Phase 1 kernel
> 2. `feat(events): zaqe eventos set base v3.0` (E1, E2, E3, E4)
> 3. `feat(relics): zaqe reliquias set base v3.0` (R1, R2 — criterios de nerf en commit message de R2)
> 4. `feat(tech): zaqe tech set base v3.0` (T1, T2)
> 5. `test(cards-index): update counts post-Zaqe canary` (ALL_CARDS=74, zaqe=18)
>
> **Se requieren 3 extensiones DSL** schema-only (ver sección "DSL extensions" + Q1 al pie). Mismo patrón que Würon canary `keyword_amplifier` y Q'ralan/Tezhal canary `costLte` — schema, renderer y validator aceptan los shapes; interpreter stub-ea con TODOs explícitos hasta Phase 1.

---

## Contexto del archetype

**Archetype objetivo:** **persistencia económica de partidas largas**. Zaqe es el archetype de desgaste. Las naves no son amenazas duraderas (Würon), ni combustible (Tezhal), ni masa (Q'ralan): son **recursos persistentes** que vuelven una vez vía Refluencia, generando ventaja de cartas y agotando al rival progresivamente. Win condition: ventaja de cartas + presencia constante hasta que el rival se queda sin respuestas. Pico turno 8+. Mejor en partidas largas (10+ turnos). Recurso central: energía + tempo de revival + Pozo Astral. Mano ideal: 2-3 naves con Refluencia + utility + sustain anti-removal.

**Test de no-recaída** (verificado en cada carta):

- Zaqe NO escala por daño recibido (eso es Würon) → ningún trigger `ship_damaged` ni `wasDamagedThisTurn` filter, ningún buff "+1 fuerza al sobrevivir golpe".
- Zaqe NO sacrifica naves voluntariamente para activar efectos (eso es Tezhal) → ningún `op: sacrifice` ni `cost: sacrificeShip` en mis cartas. **Excepción:** E3 (Velo Sqhanguata) usa `bounce_to_hand` activo sobre nave propia — **no es sacrificio**, es escape preservativo (la nave no muere, va a mano, conserva eligibilidad de Refluencia). Marco como `intentionalOffCategory: true` para señalar que rompe el molde post_combat.
- Zaqe NO escala por presencia múltiple simultánea (eso es Q'ralan) → ningún `count_filter { race: 'zaqe' }` evaluado sobre el board para amplificar stats de mis naves nuevas. Las únicas count-conditions miden el **Pozo Astral** (recurso temporal/serial Zaqe), no el board.

### Tabla comparativa 4 razas (en contexto del archetype)

| Eje               | Würon (Külen-stacking) | Tezhal (Kamikaze-tempo)        | Q'ralan (FS masa)             | **Zaqe (Persistencia económica)**        |
| ----------------- | ---------------------- | ------------------------------ | ----------------------------- | ---------------------------------------- |
| Trigger           | Pasivo reactivo (daño) | Activo voluntario (sacrificio) | Pasivo posicional (presencia) | **Pasivo terminal (muerte)**             |
| Tempo             | Retención turnos 7+    | Burst turnos 4-5               | Despliegue 2-7                | **Desgaste turnos 8+**                   |
| Value             | Acumulativo por daño   | Single-turn explosivo          | Cuadrático por masa           | **Recurrente por reciclado**             |
| Mano ideal        | 3-4 unidades vivas     | Vaciar board buscando lethal   | 4-5 unidades vivas turno 5+   | **2-3 unidades + utility para extender** |
| Recurso central   | HP propio              | Cartas-combustible 1c          | Slots de board                | **Energía + Pozo Astral**                |
| Win condition     | Buff stack permanente  | Swing decisivo turno corto     | Dominio progresivo            | **Agotamiento del rival**                |
| Mata el archetype | Removal AoE temprano   | Quedarse sin combustible       | Removal masa simultánea       | **Exilio masivo a Disolución**           |

Ortogonalidad obligatoria: si el archetype emergente Zaqe se parece a Würon (acumulación), Tezhal (burst) o Q'ralan (masa), el diseño falló. Mi diseño se sostiene en estas señales:

- **Trigger pasivo terminal**: las cartas que escalan o devuelven valor lo hacen al MORIR la nave (Refluencia, R1 turn-based long-game), no al sobrevivir golpes ni al sacrificar voluntariamente.
- **Recurso serial**: las naves Zaqe rotan de combate → Pozo Astral → revivida → Disolución. Es una secuencia temporal, no una pila simultánea como Q'ralan. R1 + E4 miden tiempo (Edad), R2 reduce el costo del ciclo de revival.
- **Curva**: el peak de Zaqe llega turno 8+ cuando el rival se queda sin respuestas y vos seguís reciclando. R1 (Edad II/III scaling) materializa este pico explícitamente.

### Cumplimiento de las 8 restricciones específicas Zaqe

| #   | Restricción                                                       | Cómo se cumple                                                                                                                                                                                                                                                                                                     |
| --- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Disolución es terminal (NO `from_zone: "disolucion"`)             | Ninguna carta tiene `zone: "disolucion"` ni `from_zone: "disolucion"` en su effect tree. E1, E3, E4 y R2 referencian solo `zone: "pozo_astral"` (DSL ext 1). Verificado en grep mental sobre cada árbol.                                                                                                           |
| 2   | No revival gratis (mínimo 1 energía)                              | R2 (Espejo del Reflujo Áureo) reduce costo Refluencia en 1 con tope mínimo 1 (parámetro `minCost: 1` del primitive `cost_modifier`, DSL ext 2). E1 (mass-revival) NO discount-ea individuales: paga su cost-card 5 + tax discard 2 — friction explícita.                                                           |
| 3   | Mass-revival con fricción                                         | E1 (Reflujo del Lago de Luz): cost 5 + descartar 2 cartas + cap por costo individual (`costLte: 3`) + cap por count (max 2). Total tax explicit. Sin "revive todas" ni "revive sin tax". Verificado: 5 mana card + 2 cards discard ≥ 4-6 mana ships revividos.                                                     |
| 4   | Counter wheel obligatorio Zaqe > Würon (≥1 carta anti-Würon)      | **Tres pieces** anti-Würon: (a) E2 Eclipse del Pozo Astral — 3 dmg AoE a ships con kw `kulen`. (b) T2 Coraza del Lago Áureo — sustain perm/temp Zaqe vs Külen-stacking. (c) T1 Disolutorio Sqhaguata — anti-Reliquia universal incluye Trono de Lhülkan + Brotal de Üntu (engines Külen). Sobra: ≥1 era el mínimo. |
| 5   | Defensa anti-Tezhal NO neutralizadora                             | T2 (Coraza) da +1 HP perm + prevent 1 dmg — sustain incremental, NO inmunidad a exilio. E3 (Velo) bouncea a mano una nave Zaqe — preservativa, NO anula exilio enemigo (si Tezhal exila otra nave Zaqe, sigue exilándose). Cero `grant_keyword: "exile_immune"`. Wheel Tezhal > Zaqe se preserva.                  |
| 6   | Partidas largas como recurso explícito (≥1-2 cartas miden tiempo) | R1 (Reloj del Pozo Áureo): activa diferencialmente en Edad II (≥turno 5) y Edad III (≥turno 9). E4 (Visión del Pozo Astral): scala draw con Edad. **2 cartas** miden tiempo explícito vía `in_age_gte`. Cumple el mínimo "1-2".                                                                                    |
| 7   | Refluencia revival reset (stats base)                             | Pre-respondido en handoff (Pregunta 1, respuesta canónica NO buffs). Actualización propuesta a sec 7.4 GAME-RULES en commit 0. Mis cartas no agregan nada que rompa esto: no hay carta que diga "la próxima Refluencia mantiene buffs".                                                                            |
| 8   | HP máximo al revivir                                              | Pre-respondido en handoff (Pregunta 2, respuesta canónica HP máximo). Mismo commit 0 lo formaliza. Mis cartas no usan `modify_hp set_to_max` redundante porque la firma `refluencia` ya lo hace por engine.                                                                                                        |

### Cumplimiento de las restricciones inviolables heredadas

| #   | Restricción                             | Cómo se cumple                                                                                                                                              |
| --- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | GAME-RULES sec 6.4/6.5 balance          | Cartas no-ship: validator usa fórmula heurística por op/trigger. Cada justificación incluye costo↔valor.                                                    |
| 2   | Naming Zaqe (sq, zh, gu, sufijos canon) | 8/8 nombres usan fonemas Zaqe o prefijos canonizados (Sumzhua, Sqhaguata, Sqhanguata, Bohzhica) o lore común (Lago de Luz, Pozo Astral, Reflujo, Áureo).    |
| 3   | Blocklist con word boundaries           | 8/8 nombres verificados contra `LORE_BLOCKLIST` — cero matches.                                                                                             |
| 4   | Distribución de costos                  | 2 (×2) · 3 (×2) · 4 (×2) · 5 (×2). ≥1 cost 1-2 ✓, ≥1 cost 4-5 ✓, max 2 por slot — sin concentración.                                                        |
| 5   | No cambios mecánicos a las 10 viejas    | No toco JSONs existentes en `src/data/cards/zaqe/*.json`. Solo agrego archivos nuevos. Inmersión Áurea queda con `zone: "graveyard"` legacy (Q6 diferible). |
| 6   | DSL primitives — flag extensions        | 3 extensiones flagged en Q1 al pie. Todas schema-only + interpreter TODOs documentados. Ninguna primitive ad-hoc sin marcar.                                |
| 7   | Categorización por naturaleza           | E3 marcada `intentionalOffCategory: true` (initiative en lugar de post_combat). Resto cumple firma post_combat.                                             |
| 8   | 5 inviolables verificadas con tabla     | Esta tabla.                                                                                                                                                 |

---

## Resumen ejecutivo

| #   | Nombre                   | Tipo  | Costo | Rareza | Profile balance | Sinergia archetype                      | Idea breve                                                                          |
| --- | ------------------------ | ----- | ----- | ------ | --------------- | --------------------------------------- | ----------------------------------------------------------------------------------- |
| E1  | Reflujo del Lago de Luz  | event | 5     | rare   | hab_only        | ✅ mass-revival con fricción            | Descartá 2: hasta 2 naves Zaqe ≤3c del Pozo Astral vuelven con stats base + HP máx. |
| E2  | Eclipse del Pozo Astral  | event | 3     | rare   | hab_only        | ✅ counter wheel anti-Würon             | 3 dmg AoE a cada nave enemiga con keyword `kulen`.                                  |
| E3  | Velo Sqhanguata          | event | 2     | common | hab_only        | ✅ escape route (anti-targeted-removal) | Una nave Zaqe aliada vuelve a tu mano. Robás 1 carta.                               |
| E4  | Visión del Pozo Astral   | event | 2     | common | hab_only        | ✅ card draw escalado por tiempo        | Robá 1. En Edad II o sup., robá 1 más. En Edad III, robá otra adicional.            |
| R1  | Reloj del Pozo Áureo     | relic | 5     | rare   | hab_only        | ✅ engine de tiempo (long-game)         | Al inicio de tu turno: en Edad II robás 1, en Edad III ganás 2 hp y robás 2.        |
| R2  | Espejo del Reflujo Áureo | relic | 4     | rare   | hab_only        | ✅ reducción costo Refluencia           | Pasivo: las Refluencias que pagues cuestan 1 menos (mínimo 1 energía).              |
| T1  | Disolutorio Sqhaguata    | tech  | 3     | common | hab_only        | ✅ counter wheel universal anti-engine  | Exilia una Reliquia enemiga.                                                        |
| T2  | Coraza del Lago Áureo    | tech  | 4     | common | hab_only        | ✅ defensa anti-Würon (no neutraliza)   | Cada nave Zaqe aliada gana +1 HP permanente.                                        |

**Distribución de costos** (8 cartas): 2 (×2) · 3 (×2) · 4 (×2) · 5 (×2). Cumple `≥1 cost 1-2` y `≥1 cost 4-5`. Sin concentración (max 2 por slot — más spread que canarys anteriores).

**Distribución de rareza:** 4 común (E3, E4, T1, T2) + 4 rare (E1, E2, R1, R2) = **4/4**. Mismo ratio que canarys Würon, Tezhal y Q'ralan.

**Diversificación mecánica:**

- **Engine ciclo Refluencia** (mass-revival, cost-reducer, escape preservativo): E1 + R2 + E3 (3 cartas).
- **Long-game scaling** (premia partidas largas): R1 + E4 (2 cartas).
- **Counter wheel anti-Würon** (orthogonal): E2 + T2 + T1 indirecto (3 cartas).
- **Card flow / value engine** (tutoreo / draw): E4 (1 carta).

Las 8 cartas se reparten en los 3 ejes obligatorios del handoff: ciclo Refluencia (3), long-game (2), counter wheel (3 contando T1 universal). Cero cartas redundantes.

---

## DSL extensions necesarias (v3.0.3 schema-only)

Mismo patrón que canarys anteriores: schema, validator y renderer aceptan los shapes desde commit 1. Interpreter stub-ea con TODOs explícitos hasta Phase 1 kernel. Tests `.skip` hasta des-stub.

| #   | Extension                                                                                         | Aplicación                                                                                        | Cartas que la usan |
| --- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------ |
| 1   | `zone: "pozo_astral"` (enum value)                                                                | `Search.zone` y eventualmente `count_filter.zone`. Distinguir Pozo Astral de graveyard.           | E1                 |
| 2   | `op: "cost_modifier"` con `target: { keyword: "refluencia" }`, `delta: number`, `minCost: number` | Reduce el costo de pagar Refluencia revival. Tope mínimo configurable (siempre 1 en este canary). | R2                 |
| 3   | `target.kind: "chosen_permanent"` con `cardType` filter                                           | Permite targetear cartas no-ship (relics) para `exile`. Extensión natural de `chosen_ship`.       | T1                 |

**Engine TODOs** (a registrar con `git log --grep="TODO Phase 1 kernel (v3.0.3)"`):

- `interpreter.ts` `searchInZone` — case `"pozo_astral"` → leer del nuevo state field `state.players[*].pozoAstral` (separado de `graveyard`).
- `reducer.ts` `SHIP_DESTROYED` — si la nave es race=zaqe Y `keywords.includes("refluencia")` Y aún no fue revivida una vez → mover a `pozoAstral`. Si ya fue revivida → mover a `disolucion` (zone terminal, sin search ops).
- `reducer.ts` `PAY_REFLUENCIA` — handler nuevo para revival: descontar costo (modulado por `costModifiers["refluencia"]` con clamp `Math.max(1, cost - delta)`), reset stats base, set HP a `maxHp`, mover de `pozoAstral` → `fleet`. Marcar la nave con `revivedOnce: true`.
- `interpreter.ts` `cost_modifier` op → registrar en `state.costModifiers` (Map por keyword → { delta, minCost }). Limpiar al destruir la fuente.
- `interpreter.ts` `resolveTargets` — case `chosen_permanent` con `cardType` filter → buscar en `relics` y `tech_in_play` además de `fleet`. (T1 solo necesita relics; pero el filter generaliza.)
- `validator` — extender `validateZone` para aceptar `"pozo_astral"`. Extender `validateTarget` para aceptar `chosen_permanent`. Extender `validateOp` para aceptar `cost_modifier`.

Inmersión Áurea (existing) usa `zone: "graveyard"` — **se queda como está** en este canary (Restricción inviolable 5: no cambios mecánicos a viejas). Q6 diferido para refactor en otro PR.

---

## E. Eventos (Prompt 2 — 4 nuevos)

### E1. Reflujo del Lago de Luz

- **Tipo:** event · **costo:** 5 · **rareza:** rare
- **Keywords:** —
- **Habilidad:** _Al jugarse: descartá 2 cartas. Hasta 2 naves Zaqe de tu Pozo Astral con costo ≤ 3 vuelven al campo con stats base y HP máximo._
- **Effect tree sugerido:**
  ```json
  {
    "trigger": { "kind": "on_play" },
    "category": "post_combat",
    "effect": {
      "op": "sequence",
      "effects": [
        { "op": "discard", "player": "self", "n": 2 },
        {
          "op": "search",
          "owner": "self",
          "zone": "pozo_astral",
          "filter": { "race": "zaqe", "costLte": 3 },
          "count": 2,
          "destination": "play"
        }
      ]
    },
    "description": "Al jugarse: descartá 2 cartas. Hasta 2 naves Zaqe de tu Pozo Astral con costo ≤ 3 vuelven al campo con stats base y HP máximo."
  }
  ```
  > **Nota:** usa `zone: "pozo_astral"` (DSL ext 1) y `costLte` (DSL v3.0.2 existing). Engine impl: TODO Phase 1 kernel. La cláusula "stats base y HP máximo" es **engine-driven** vía la firma `refluencia` (commit 0 sec 7.4) — no hace falta `modify_strength reset` ni `modify_hp set_to_max` en el árbol.
- **Flavor text:** _"El reflujo del lago empuja dos balsas a la superficie a la vez; la corriente cobra dos órdenes en pago."_ (109 chars — ajustar a ≤100 al aplicar)
- **Justificación de diseño:** **mass-revival con fricción explícita** (Restricción 3). Cost 5 + descartar 2 cartas = ~9 mana de recurso. Ships Zaqe ≤3c son Navegante de Sumzhua (1c 1/2), Balsa Áurea (2c 3/3), Cuchilla del Espejo Áureo (2c weapon, no aplica filter race=zaqe ship), Guata Iridiscente (3c 4/5). 2 ships revividos = 2-6 mana de stats. Card cost 5 + tax 2 cards ≥ ships value 2-6. Sin "revive todas". Sin discount al pagar revival individual. **Cap de costo `≤3`** evita revivir Sumzhua del Sexto Sol legendaria (6c) o Sqhanguata Reliquia Solar (5c) gratis. Cumple "el costo total debe ser >= suma de costos individuales + tax adicional".
- **Rol en mazo:** **swing de regreso** en partidas mid-late. Mejor jugarla cuando 2-3 naves Zaqe están en Pozo Astral (turno 6+) con todavía cartas en mano para discard. Sinergia con R2 (cost reducer): si tenés R2 en juego, las Refluencias individuales bajan a 1 mana — E1 sigue siendo eficiente porque revive 2 a la vez sin pagar individuales.
- **Diversificación check:** sin keyword `refluencia`. Mecánica: revival múltiple — extensión natural del archetype Refluencia individual.
- **Restricción 3 check:** ✅ Total tax (5 mana + 2 cards) > sum costs revivados (max 6 mana en peor caso) + friction extra. NO escala lineal sin freno.

---

### E2. Eclipse del Pozo Astral

- **Tipo:** event · **costo:** 3 · **rareza:** rare
- **Keywords:** —
- **Habilidad:** _Al jugarse: hace 3 daño a cada nave enemiga con la keyword `kulen`._
- **Effect tree sugerido:**
  ```json
  {
    "trigger": { "kind": "on_play" },
    "category": "post_combat",
    "effect": {
      "op": "for_each",
      "filter": { "controller": "opponent", "keywordsAny": ["kulen"] },
      "effect": {
        "op": "damage",
        "target": { "kind": "self" },
        "amount": 3
      }
    },
    "description": "Al jugarse: hace 3 daño a cada nave enemiga con la keyword Külen."
  }
  ```
- **Flavor text:** _"El espejo del Pozo Astral apaga el latido del Brote: cada herida abierta vuelve al lago."_ (89 chars)
- **Justificación de diseño:** **counter wheel mecánico anti-Würon** (Restricción 4). Vs Würon: mata Explorador del Brote (2c 2/3 → 2/0 = muere), Centinela Mawe (2c 2/2 → 2/-1 = muere), daña Aullador del Bosque (3c 3/4 → 3/1), daña Tronco-Buque Lhülkan (5c 5/6 → 5/3). El payoff Würon "Külen-stacking → buff +N permanent" se rompe porque las stackers mueren ANTES de acumular buffs significativos. Vs otras razas: cero impacto (Tezhal/Q'ralan/Zaqe no tienen `kulen`). Sideboard tech como E3 Eclipse del K'illay del canary Q'ralan. Cost 3 + AoE 3 dmg condicional = removal premium con downside vs no-Würon. Categoría `post_combat` (firma Zaqe) aunque el efecto se ejecuta on_play — tag firma se decide por la raza, no por el efecto.
- **Rol en mazo:** **anti-Würon explícito** (counter wheel hardpoint). En matchup Würon: prioritario en turnos 3-4 (cuando hay 2-3 ships con Külen pero los buffs todavía no escalaron). Se vuelve dead-card vs Q'ralan/Tezhal/Zaqe — pesar al armar mazo: 1-2 copias en main, 2-3 en sideboard (criterio análogo a E3 K'illay del canary Q'ralan).
- **Diversificación check:** sin keyword `refluencia`. Mecánica orthogonal (counter-tech).
- **Restricción 4 check:** ✅ pieza explícita anti-Würon, mata stackers tempranos.

---

### E3. Velo Sqhanguata

- **Tipo:** event · **costo:** 2 · **rareza:** common
- **Keywords:** —
- **Habilidad:** _Al jugarse: una nave Zaqe aliada vuelve a tu mano. Robás 1 carta._
- **Effect tree sugerido:**
  ```json
  {
    "trigger": { "kind": "on_play" },
    "category": "initiative",
    "effect": {
      "op": "sequence",
      "effects": [
        {
          "op": "bounce_to_hand",
          "target": {
            "kind": "chosen_ship",
            "filter": { "controller": "self", "race": "zaqe" }
          }
        },
        { "op": "draw", "player": "self", "n": 1 }
      ]
    },
    "description": "Al jugarse: una nave Zaqe aliada vuelve a tu mano. Robás 1 carta."
  }
  ```
  > **Nota:** marcada `intentionalOffCategory: true` (categoría `initiative` en lugar de post_combat firma). Justificación: bounce-activo no es post_combat. Convertir a categoría firma forzaría el tag pero no respeta naturaleza del efecto.
- **intentionalOffCategory:** `true`
- **Flavor text:** _"El velo del Sqhanguata cubre la balsa: cuando el filo enemigo busca el casco, ya no hay nave a la vista."_ (105 chars — ajustar)
- **Justificación de diseño:** **escape route preservativa** (Restricción 5: defensa NO neutralizadora). Si una nave Zaqe ya fue revivida una vez (1 vida usada en Pozo Astral, 1 vida usada al re-deploy), está marcada para ir a Disolución la próxima vez que muera. **Velo bouncea a mano ANTES** de que el rival la mate, devolviéndola al estado "fresca" (sin marca `revivedOnce`). Re-desplegar paga el costo normal. Pero **NO neutraliza Tezhal Espejo Disolutorio** — ese tech exilia targeted desde el board: si Velo no se jugó previamente, Espejo Disolutorio aplica normalmente. Wheel Tezhal > Zaqe se preserva (E3 es solo 1 carta, no infinita protección).
- **Rol en mazo:** **utility de protección targeted**. Combo: turno 6, una nave Zaqe revivida ataca, queda en peligro de removal → al inicio del turno siguiente, jugar E3 para bouncearla y robar 1. Trade-off: pierde un turno de tempo (la nave deja el board) pero gana 1 carta + preserva la nave para Refluencia futura. Sinergia con R2 (cost-reducer): re-deployar la nave bounceada cuesta menos.
- **Diversificación check:** sin keyword `refluencia`. Mecánica: bounce + cantrip (alt al ciclo Refluencia tradicional).
- **Test de no-recaída:** ✅ NO es sacrificio voluntario por valor (no genera buff ni daño). Es una operación de **save**, no de **fuel**. Distinto de Tezhal Ignición (que sí intercambia muerte por valor activo).

---

### E4. Visión del Pozo Astral

- **Tipo:** event · **costo:** 2 · **rareza:** common
- **Keywords:** —
- **Habilidad:** _Al jugarse: robás 1 carta. En Edad II o superior, robás 1 carta más. En Edad III, robás otra carta adicional._
- **Effect tree sugerido:**
  ```json
  {
    "trigger": { "kind": "on_play" },
    "category": "post_combat",
    "effect": {
      "op": "sequence",
      "effects": [
        { "op": "draw", "player": "self", "n": 1 },
        {
          "op": "conditional",
          "condition": { "kind": "in_age_gte", "age": 2 },
          "thenEffect": { "op": "draw", "player": "self", "n": 1 }
        },
        {
          "op": "conditional",
          "condition": { "kind": "in_age_gte", "age": 3 },
          "thenEffect": { "op": "draw", "player": "self", "n": 1 }
        }
      ]
    },
    "description": "Al jugarse: robás 1 carta. En Edad II o superior, robás 1 más. En Edad III, robás otra adicional."
  }
  ```
- **Flavor text:** _"El espejo del Pozo se aclara con la edad del cielo; tres miradas en la última hora del Sol Sexto."_ (98 chars)
- **Justificación de diseño:** **card draw escalado por tiempo** (Restricción 6 — partidas largas como recurso). Cost 2 + draw 1-3 según Edad. En Edad I (turno 1-4): cantrip vanilla 1 carta. En Edad II (turno 5-8): 2 cartas — buen tempo. En Edad III (turno 9+): 3 cartas — premia explícitamente al Zaqe que sobrevivió hasta el late game. Cero impacto si el rival cierra rápido (escape valve para Tezhal kamikaze: si llegás a Edad II vos ya estás generando ventaja). Comparable a Q'ralan E2 Despliegue del Sumaq-Wasi (cost 4, 2 ships) en términos de "value cost-effective" al peak del archetype, pero sin requerir condición de board.
- **Rol en mazo:** **engine de cartas late-game**. En matchup vs Tezhal kamikaze: si el cierre fall, E4 te repone cartas Edad III. Vs Würon Külen: en partidas largas (Würon también escala lento), E4 te da munición para mantener el reciclado Refluencia. Combo natural con E1 (Reflujo) — E4 te llena la mano en Edad II/III, y E1 te pide discard 2 que ya tenés cubiertos.
- **Diversificación check:** sin keyword `refluencia`. Mecánica alt: card draw escalado.
- **Restricción 6 check:** ✅ usa `in_age_gte` para escalar — premia explícito partidas largas.

---

## R. Reliquias adicionales (Prompt 3 — 2 nuevas; total Zaqe = 2)

> **Existing:** Hangar de Aguas Doradas (cost 4, rare, "al destruirse una Zaqe aliada, robás 1 carta" — engine de cartas reactivo).

### R1. Reloj del Pozo Áureo

- **Tipo:** relic · **costo:** 5 · **rareza:** rare
- **Keywords:** —
- **Habilidad:** _Pasivo. Al inicio de tu turno: si estás en Edad II o superior, robás 1 carta. Si estás en Edad III, además ganás 2 hp en tu mundo natal y robás 1 carta más._
- **Effect tree sugerido:**
  ```json
  {
    "trigger": { "kind": "on_event", "event": "turn_start", "filter": { "controller": "self" } },
    "category": "post_combat",
    "effect": {
      "op": "sequence",
      "effects": [
        {
          "op": "conditional",
          "condition": { "kind": "in_age_gte", "age": 2 },
          "thenEffect": { "op": "draw", "player": "self", "n": 1 }
        },
        {
          "op": "conditional",
          "condition": { "kind": "in_age_gte", "age": 3 },
          "thenEffect": {
            "op": "sequence",
            "effects": [
              { "op": "draw", "player": "self", "n": 1 },
              {
                "op": "modify_hp",
                "target": { "kind": "homeworld", "owner": "self" },
                "kind": "delta",
                "value": 2,
                "duration": "permanent"
              }
            ]
          }
        }
      ]
    },
    "description": "Al inicio de tu turno: en Edad II robás 1 carta; en Edad III además ganás 2 hp en tu mundo natal y robás 1 más."
  }
  ```
  > **Nota:** `target.kind: "homeworld"` con `owner: "self"` — verificar si renderer/interpreter aceptan target homeworld para `modify_hp`. Es la operación natural para `damage_homeworld` reverse. Si no, usar `op: "heal_homeworld"` (potencial DSL ext 4 sub-bloqueante; ver Q4).
- **Flavor text:** _"El reloj del Pozo marca tres horas: la mano se llena, el casco natal se cierra y la última hora del Sexto Sol llega."_ (118 chars — ajustar)
- **Justificación de diseño:** **engine de tiempo archetype-defining** (Restricción 6). Cost 5 commits un slot a la estrategia long-game. Activación nula en Edad I (turnos 1-4) — el relic NO da valor hasta turno 5+ (Edad II), alineado con la curva ideal Zaqe. Edad II: +1 carta/turno = 4 mana de valor por 5 mana inicial → break-even a turno 9. Edad III (turno 9+): escalada a +2 cartas + 2 hp natal → valor masivo en partidas que llegan a turno 10+. Materializa "win condition narrativo: si llegamos a turno X, gano". Cero sinergia con archetype rápido — selecciona explícito decks long-game.
- **Rol en mazo:** **win condition** del archetype persistencia económica. Combo natural con R2 (cost-reducer Refluencia) + E1 (mass-revival con discard 2 — R1 Edad II te alimenta las cartas para discard) + E4 (Visión del Pozo Astral — doble draw en Edad III, escalada agresiva). Identifica claramente "estoy jugando Zaqe long-game".
- **Restricción 6 check:** ✅ activa diferencialmente por Edad — premia explícito partidas largas. Cero valor antes de Edad II.

---

### R2. Espejo del Reflujo Áureo

- **Tipo:** relic · **costo:** 4 · **rareza:** rare
- **Keywords:** —
- **Habilidad:** _Pasivo. Las Refluencias que pagues cuestan 1 energía menos (mínimo 1)._
- **Effect tree sugerido:**
  ```json
  {
    "trigger": { "kind": "continuous" },
    "category": "post_combat",
    "effect": {
      "op": "cost_modifier",
      "target": { "keyword": "refluencia" },
      "delta": -1,
      "minCost": 1
    },
    "description": "Pasivo: las Refluencias que pagues cuestan 1 energía menos (mínimo 1)."
  }
  ```
  > **Nota:** usa `op: cost_modifier` (DSL ext 2). El `minCost: 1` clamp es **inviolable** (Restricción 2). Engine impl: registra el modifier en `state.costModifiers` al desplegarse el relic; lo aplica al calcular el costo de revival; lo limpia al destruirse el relic.
- **Flavor text:** _"El espejo abarata la corriente del lago: el casco vuelve casi sin pagar peaje, pero el lago siempre cobra una luz."_ (114 chars — ajustar)
- **Justificación de diseño:** **engine ciclo Refluencia con tope mínimo 1** (Restricción 2 inviolable). Cost 4 relic continuous. Reduce cada Refluencia individual en 1 mana, con tope mínimo 1 — Navegante de Sumzhua (1c) sigue costando 1 al revivir (no llega a 0). Balsa Áurea (2c) → 1c. Espejo Estelar Sqhaguata (4c) → 3c. Sumzhua del Sexto Sol legendaria (6c) → 5c. Break-even: amortiza cost 4 con 4 Refluencias hechas — viable en partidas Edad III. NO compone con E1 (Reflujo): E1 paga su cost-card 5 + discard 2 sin revivals individuales, así que cost_modifier NO aplica al search dentro de E1 (el target del modifier es la **acción de revival individual** vía Refluencia, no `op: search`). Esto preserva la fricción explícita de E1.
- **Rol en mazo:** **engine ciclo Refluencia** del archetype. Mejor jugar turno 4-5 cuando ya tenés 1-2 ships en Pozo Astral. Sinergia: R1 (Reloj) te da las cartas; R2 te baja el costo de revival; E3 (Velo) te bouncea ships en peligro; E1 (Reflujo) hace mass-revival sin discount. Stack completo Edad II-III.
- **Restricción 2 check:** ✅ minCost 1 hard-coded en el primitive. Sin "revive gratis".
- **Criterios de nerf** (a registrar en commit message): si playtests muestran win-rate Zaqe > 60% vs cualquier raza con build "R1 + R2 + 3-4 Refluencias por turno", capear delta a -1 una sola vez por turno (R2 modificado a "la primera Refluencia que pagues por turno cuesta 1 menos") o subir cost a 5.

---

## T. Tecnologías adicionales (Prompt 4 — 2 nuevas; total Zaqe = 2)

> **Existing:** Inmersión Áurea (cost 3, rare, "busca 1 Zaqe del graveyard a tu mano", `intentionalOffCategory`).

### T1. Disolutorio Sqhaguata

- **Tipo:** tech · **costo:** 3 · **rareza:** common
- **Keywords:** —
- **Habilidad:** _Al jugarse: exilia una Reliquia enemiga._
- **Effect tree sugerido:**
  ```json
  {
    "trigger": { "kind": "on_play" },
    "category": "post_combat",
    "effect": {
      "op": "exile",
      "target": {
        "kind": "chosen_permanent",
        "filter": { "controller": "opponent", "cardType": "relic" }
      },
      "fromZone": "in_play"
    },
    "description": "Al jugarse: exilia una Reliquia enemiga."
  }
  ```
  > **Nota:** usa `target.kind: "chosen_permanent"` con `cardType: "relic"` filter (DSL ext 3). Engine impl: extender `resolveTargets` para buscar en `relics_in_play` además de `fleet`. `op: exile` con `fromZone: "in_play"` ya existe en spec; solo necesitamos el target generalizado.
- **Flavor text:** _"El disolutorio derrama gota de Pozo sobre el engine ajeno: el cristal enemigo se vuelve luz líquida y se va."_ (110 chars — ajustar)
- **Justificación de diseño:** **counter wheel universal anti-engine** (Restricción 4 — cubre Würon engines). Targets explícitos: Trono de Lhülkan (Würon, engine Külen-amplifier), Brotal de Üntu (Würon, engine de buff), Hangar del Sol Pétreo (Q'ralan, engine de masa), Templo K'ana-suyu (Q'ralan, +1 HP cuadrático), Hangar Eterno (Tezhal, recycled ships), Templo del Hangar Sumaq (Q'ralan, tutor lento). **Anti-Würon directo** vía Trono+Brotal — sirve la Restricción 4 (Zaqe > Würon explícito). Vs Tezhal: exilia Hangar Eterno (kill el engine de re-spawn). Vs Q'ralan: exilia Hangar del Sol Pétreo (kill el engine de masa). Sideboard universal — útil en ≥3 matchups, dead-card solo en mirror Zaqe sin relics enemigas (raro). Cost 3 + exile permanent = removal premium (paralelo a Q'ralan T1 Cristal del Eclipse Pétreo cost 2 single-target ship; T1 Zaqe es cost 3 single-target relic, similar pricing).
- **Rol en mazo:** **anti-Reliquia universal** + indirecto anti-Würon. En matchup Würon: prioridad turno 4-5 cuando aparezca Trono o Brotal. Sigue siendo útil en otros matchups (Q'ralan/Tezhal). Mejor que cartas anti-Würon-puro porque tiene aplicación universal.
- **Diversificación check:** sin keyword `refluencia`. Mecánica orthogonal (counter-tech).
- **Restricción 4 check:** ✅ vía suggested handoff "Tech anti-Reliquia: vs Trono + Brotal". Universal pero anti-Würon-relevant.

---

### T2. Coraza del Lago Áureo

- **Tipo:** tech · **costo:** 4 · **rareza:** common
- **Keywords:** —
- **Habilidad:** _Al jugarse: cada nave Zaqe aliada gana +1 HP permanente._
- **Effect tree sugerido:**
  ```json
  {
    "trigger": { "kind": "on_play" },
    "category": "post_combat",
    "effect": {
      "op": "for_each",
      "filter": { "controller": "self", "race": "zaqe" },
      "effect": {
        "op": "modify_hp",
        "target": { "kind": "self" },
        "kind": "delta",
        "value": 1,
        "duration": "permanent"
      }
    },
    "description": "Al jugarse: cada nave Zaqe aliada gana +1 HP permanente."
  }
  ```
- **Flavor text:** _"La coraza del Lago Áureo se vierte sobre el casco: el filo enemigo encuentra una capa más antes del lago."_ (105 chars — ajustar)
- **Justificación de diseño:** **defensa anti-Würon AoE NO neutralizadora** (Restricción 5). +1 HP permanente AoE Zaqe vs Külen-stacking: las naves Würon necesitan 1 daño extra para matar cada Zaqe → menos ataques exitosos → menos triggers de Külen propio (porque las Würon que recibieron daño Y mataron una Zaqe son las que stack-ean). NO neutraliza Külen (los Würon que reciben daño y sobreviven siguen escalando), solo retrasa el ciclo. Cost 4 + AoE +1 HP perm = ~6-8 mana de valor con board lleno (4-5 Zaqes). Análogo a Q'ralan T2 Espejo del K'ana (cost 3 +1 HP perm + premonition); T2 Zaqe es 1 mana más por NO incluir premonition (Zaqe firma post_combat no aprovecha tanto premonition como Q'ralan). **Nota: Restricción 7 (revival reset stats base) garantiza que el +1 HP perm dado por T2 NO persiste tras una Refluencia** — la nave revivida vuelve a HP base + max. Esto evita el combo "T2 → buff +1 → muere → revive con buff → T2 otra vez → buff +2" que rompería el archetype.
- **Rol en mazo:** **sustain estructural anti-Würon**. En matchup Würon: jugar turno 4 antes de que Külen stack. Sinergia con Hangar de Aguas Doradas (relic existing): cada Zaqe que muera con +1 HP perm costó al rival 1 daño extra, retrasando el plan Würon. Combo con E2 (Eclipse del Pozo Astral): turno 3 Eclipse mata Würon stackers tempranos, turno 4 Coraza prepara las Zaqes para el contraataque.
- **Diversificación check:** sin keyword `refluencia`. Mecánica alt: sustain plano permanente.
- **Restricción 5 check:** ✅ NO es immunidad ni `grant_keyword exile_immune`. Es buff incremental.
- **Restricción 7 check:** ✅ buff perm se resetea al revivir (engine-driven).

---

## Decisiones que requieren OK del usuario

> Listadas en orden de bloqueo. **[bloqueante]** = resolver antes de aplicar JSONs. **[diferible]** = resolver durante implementación.

### Q1. [bloqueante] Aprobar las 3 DSL extensions v3.0.3 (schema-only)

Las 3 extensiones (zone `pozo_astral`, op `cost_modifier`, target `chosen_permanent`) van como commit 1 separado **antes** de los `feat(events|relics|tech)`. Schema, validator y renderer aceptan los shapes inmediatamente; interpreter stub-ea con TODOs explícitos hasta Phase 1 kernel.

**Alternativas si querés evitar DSL extensions:**

- (a) **Status quo**: aprobar las 3 extensiones, mismo patrón que canarys anteriores. Mi recomendación.
- (b) **Workaround sin extensiones**:
  - E1 usa `zone: "graveyard"` legacy (mismo que Inmersión Áurea) — mezcla Pozo Astral con graveyard, conceptualmente sucio pero funcional pre-Phase 1.
  - R2 reframea a "+1 energía adicional al inicio de tu turno" (con existing `generate_energy`) — pierde la cláusula "Refluencias cuestan 1 menos" pero mantiene el efecto económico.
  - T1 reframea a "Exilia una nave o reliquia enemiga, a elección" — necesita igual extender el target. O cambiar T1 a anti-ship single-target (pierde el rol anti-engine universal).
- (c) **Solo aprobar 1-2 extensiones**: priorizar `zone: pozo_astral` (la más fundamental) y `cost_modifier`. Reframear T1 sin `chosen_permanent`.

**Mi recomendación:** (a). Las 3 extensiones son naturales para v3.0 ("Pozo Astral" como zona explícita es base del archetype; `cost_modifier` es primitive general útil más allá de Refluencia; `chosen_permanent` generaliza targeting a non-ship cards — necesario tarde o temprano). **¿OK?**

### Q2. [bloqueante] Confirmar zone `pozo_astral` semantics (Pozo Astral vs graveyard)

En v3.0, `pozo_astral` es zona separada de `graveyard`. Política propuesta:

- **Pozo Astral**: ships race=zaqe con keyword `refluencia` que murieron por primera vez. Eligibles para revival.
- **Disolución**: ships race=zaqe con keyword `refluencia` que murieron por segunda vez (después de un revival). Zona terminal — NO puede ser referenciada por ningún `from_zone` ni `zone` filter (Restricción 1). Solo `disolucion` zone NAME existe; engine no expone ops para sacar cartas de ahí.
- **Graveyard**: todas las demás cartas (non-Zaqe ships, eventos jugados, weapons rotos, tech expirado, etc.).

**Inmersión Áurea (existing)** sigue usando `zone: "graveyard"` con `filter: race=zaqe`. **¿Update simultáneo a `zone: "pozo_astral"` o lo dejamos como deuda técnica?** Mi recomendación: dejarlo legacy en este canary (Restricción inviolable 5 — no cambios mecánicos a viejas), abrir Q6 diferido.

**Confirmar:** ¿OK con la separación pozo_astral / disolucion / graveyard?

### Q3. [bloqueante de docs] Aprobar commit 0 docs(rules) sec 7.4 actualización

El handoff pre-respondió las 2 ambigüedades de Refluencia (revival reset stats base, HP máximo). Propuesta de update sec 7.4:

```diff
- > **Refluencia** *(al morir va al Pozo Astral; puedes pagar su costo durante tu Despliegue para revivirla; si muere de nuevo, va a Disolución)*
+ > **Refluencia** *(al morir va al Pozo Astral; puedes pagar su costo durante tu Despliegue para revivirla con stats base y HP máximo; si muere de nuevo, va a Disolución)*
```

Mismo update al glosario sec 8 (Refluencia keyword reminder). **¿OK con commit 0 antes del DSL commit?**

### Q4. [diferible] R1 `target.kind: "homeworld"` para `modify_hp`

R1 (Reloj del Pozo Áureo) en Edad III hace `modify_hp` con target `homeworld`. Verificar si renderer/interpreter aceptan target homeworld para `modify_hp` — actualmente `modify_hp` está documentado para naves. Si no acepta:

- (a) **Sub-extension**: agregar `homeworld` como target válido para `modify_hp`. Mínima — paralelo a `damage_homeworld` que ya existe.
- (b) **Reframear R1**: en Edad III dar +2 fuerza permanente AoE Zaqe en lugar de heal natal. Cambia el sabor pero usa primitive existing.

**Mi recomendación:** (a) — una sub-extension trivial (homeworld target ya existe en `damage_homeworld`, solo falta wire en `modify_hp`). **¿OK?**

### Q5. [diferible] T2 Coraza categoría — post_combat o accumulative?

T2 (Coraza del Lago Áureo) hace `for_each Zaqe → modify_hp +1 perm`. El efecto **escala con el número de naves** — eso es naturaleza accumulative (Q'ralan firma). Actualmente la marqué `category: "post_combat"` (firma Zaqe).

**Alternativas:**

- (a) `post_combat` (mi diseño): tag firma Zaqe. Razonamiento: el orden de resolución se decide por raza; el efecto interno (escala con masa) no flippea la firma.
- (b) `accumulative` con `intentionalOffCategory: true`: marca explícito que el efecto es accumulative-shaped. Más coherente con la naturaleza del op.

**Mi recomendación:** (a). Mismo precedente que Q'ralan E3 Eclipse del K'illay (AoE damage condicional a keyword, marcada `accumulative` por raza no por efecto). **¿OK con `post_combat`?**

### Q6. [diferible] Inmersión Áurea legacy — update zone después del canary?

Inmersión Áurea usa `zone: "graveyard"` pre-v3.0. Post-canary, la decisión correcta es actualizar a `zone: "pozo_astral"` para alinear con la zona canónica. Pero Restricción inviolable 5 dice "no cambios mecánicos a las 10 viejas".

**Propuesta:** abrir issue/PR separado post-canary para refactor `Inmersión Áurea` + cualquier otro existing que usa `zone: "graveyard"` para race=zaqe. NO incluir en este canary.

**¿OK con diferir?**

### Q7. [bloqueante de proceso] Orden de commits y ALL_CARDS counts

8 cartas nuevas Zaqe → ALL_CARDS pasa de 66 a 74. Zaqe pasa de 10 a 18.

Plan de commits:

0. `docs(rules): agregar revival reset + HP máximo al reminder Refluencia sec 7.4` (pre-aprobado por handoff)
1. `feat(dsl): primitives v3.0.3 schema-only (zone pozo_astral + cost_modifier + chosen_permanent)`
2. `feat(events): zaqe eventos set base v3.0` (E1, E2, E3, E4)
3. `feat(relics): zaqe reliquias set base v3.0` (R1, R2 — criterios de nerf en commit message de R2)
4. `feat(tech): zaqe tech set base v3.0` (T1, T2)
5. `test(cards-index): update counts post-Zaqe canary` (ALL_CARDS=74, zaqe=18)

**¿OK con el orden?**

### Q8. [diferible] Distribución de costos balance

Cost dist: 2 (×2), 3 (×2), 4 (×2), 5 (×2). Spread perfecto pero **menos cartas en cost 1** que canarys anteriores. ¿Querés que baje E3 (Velo Sqhanguata) a cost 1 para tener un play turno 1?

- E3 cost 1: bounce + draw 1 = potente, casi auto-include. Riesgo: combo loop bounce-replay-bounce con cost reducer.
- E3 cost 2 (mi diseño): tempo razonable, cap natural al loop.

**Mi recomendación:** dejar cost 2. **¿OK?**

---

## Riesgos de balance flagged

1. **R1 + R2 + E1 stack en Edad III**: el combo "Reloj + Espejo + Reflujo" en Edad III genera 4-5 cartas/turno + 2 Refluencias baratas + mass-revival cada 5 turnos. Si playtests muestran win-rate Zaqe > 60% vs Q'ralan/Tezhal en partidas que llegan a turno 10+, **nerf primario** sería bajar R2 a "primera Refluencia por turno cuesta 1 menos" o subir R1 cost a 6.

2. **E1 con Sumzhua del Sexto Sol legendaria (6c)**: el cap `costLte: 3` de E1 evita revivir la legendaria gratis. Pero si Hangar de Aguas Doradas (existing relic, +1 carta por Zaqe destruida) está en juego + E1 revive 2 ships → suben a Pozo Astral, mueren otra vez → 2 cartas extras por R-existing. **Combo-engine inesperado**. Pesar en playtest si hace falta capear `Hangar de Aguas Doradas` a "max 2 draws por turno".

3. **T1 Disolutorio Sqhaguata vs mirror Zaqe**: en mirror Zaqe, T1 puede exilar Hangar de Aguas Doradas o R1/R2 enemigos turno 4 → corta el archetype del rival sin contraplay. Pesar si necesita restricción ("solo Reliquias non-Zaqe").

4. **E3 Velo + R2 cost-reducer combo cycling**: bouncear Sumzhua legendaria a mano (cost 6 fresh) → re-deploy → bouncear de nuevo. Costoso (cost 2 + cost 6 cada cycle), no inmediato, pero potencial loop. Si playtest muestra abuse, agregar restricción "no podés jugar Velo dos veces sobre la misma nave en un turno" o limitar Velo a `costLte: 5`.

5. **Anti-Tezhal balance**: T2 (Coraza) +1 HP perm AoE puede mitigar parcialmente Espejo Disolutorio Tezhal si las Zaqes ya están en board. Pero Espejo Disolutorio exilia targeted desde el board — independiente del HP. El wheel Tezhal > Zaqe se preserva. Pesar en playtest si Espejo Disolutorio sigue siendo "mata el archetype" (deseable per la matriz comparativa).

---

## Reporte breve (≤300 palabras)

**Producido:** 8 cartas Zaqe nuevas (4 events + 2 relics + 2 tech) + commit 0 docs(rules) update sec 7.4 + commit 1 DSL v3.0.3 (3 extensiones schema-only). Distribución de costo perfecta: 2/2/3/3/4/4/5/5 — sin concentración. Distribución de rareza 4 común / 4 rare — mismo ratio que canarys Würon, Tezhal y Q'ralan.

**Archetype emergente — "Zaqe Persistencia Económica de Partidas Largas"**: ortogonal a los otros 3 archetypes por construcción. Trigger pasivo terminal (muerte) vía Refluencia. Tempo desgaste turnos 8+. Value recurrente por reciclado serial (no apilado simultáneo). Mano ideal 2-3 unidades + utility para extender. Recurso central energía + Pozo Astral. Win condition agotamiento del rival. Engine ciclo Refluencia (E1 + R2 + E3) + long-game scaling (R1 + E4) + counter wheel anti-Würon (E2 + T2 + T1 indirecto).

**Cumplimiento de las 8 restricciones específicas Zaqe:** todas verificadas con tabla explícita. Restricción 1 (Disolución terminal): cero `from_zone: "disolucion"`. Restricción 2 (no revival gratis): R2 con minCost 1 hard-coded. Restricción 3 (mass-revival con fricción): E1 cost 5 + discard 2 + cap costLte 3. Restricción 4 (counter wheel anti-Würon): 3 piezas (E2 + T2 + T1 indirecto). Restricción 5 (defensa NO neutralizadora vs Tezhal): T2 sustain + E3 escape, sin `exile_immune`. Restricción 6 (partidas largas): 2 cartas con `in_age_gte`. Restricción 7+8 (revival reset + HP máximo): formalizadas en commit 0 docs(rules).

**Bloqueantes reales:** Q1 (DSL extensions v3.0.3), Q2 (zone semantics), Q3 (commit 0 docs), Q7 (orden commits). 4 bloqueantes pre-aprobables — ninguno requiere rework de cartas. Q4-Q8 diferibles.

**Riesgo principal:** combo R1+R2+E1 en Edad III. Anotar para playtest con criterios de nerf análogos a Würon/Tezhal/Q'ralan: win rate vs cualquier raza > 60%, tiempo promedio de cierre < 11 turnos.

---

## Resolución post-feedback usuario (2026-05-10)

**Issue #1 — Edades no existen en v3.0 (sec 0):** rediseñadas E4 y R1 sin `in_age_gte`, usando `count_filter` con `zone: 'pozo_astral'` (que es semánticamente equivalente — más turnos = más muertes = más Pozo Astral — y MÁS coherente con el archetype Zaqe).

- E4 Visión del Pozo Astral: "Robá 1. Si tenés 3+ cartas en tu Pozo Astral, robá 1 más. Si tenés 6+, robá otra adicional."
- R1 Reloj del Pozo Áureo: "Al inicio de tu turno: si tenés 5+ cartas en tu Pozo Astral, robás 1. Si tenés 10+, ganás 2 hp en mundo natal y robás 1 más."

Flavor texts de E4 y R1 rephraseados para evitar referencias temporales a "Edad" / "última hora" / "Sol Sexto".

**Issue #2 — Categorización por naturaleza, no por raza:** corregidas a `initiative` + `intentionalOffCategory: true`:

- E2 Eclipse del Pozo Astral (AoE damage al jugar)
- E4 Visión del Pozo Astral (card draw al jugar)
- T1 Disolutorio Sqhaguata (exile al jugar)
- T2 Coraza del Lago Áureo (AoE buff inmediato al jugar)

Mantenidas `post_combat` (firma Zaqe natural):

- E1 Reflujo del Lago de Luz (revival desde Pozo Astral)
- R1 Reloj del Pozo Áureo (pasivo turn_start)
- R2 Espejo del Reflujo Áureo (modifica costo de revival)

Mantenida `initiative` con flag (ya correcto desde la propuesta inicial):

- E3 Velo Sqhanguata

**Decisiones aplicadas:**

- Q1 ✅ Aprobadas las 3 DSL extensions v3.0.3 — implementadas en commit `feat(dsl)`.
- Q2 ✅ Pozo Astral = zona universal (rename canónico de graveyard per GAME-RULES sec 0). Disolución = exilio terminal. Graveyard deprecated (sigue como alias hasta Phase 2). Inmersión Áurea migrada a `pozo_astral` en commit `chore(cards)`.
- Q3 ✅ Aplicado commit 0 `docs(rules)` con update sec 7.4 + glosario sec 8.
- Q4 ✅ `target.kind: 'homeworld'` ya estaba en el spec — no requirió sub-extension. R1 mantiene heal natal en threshold 10 cartas.
- Q5 ✅ Corregida T2 a initiative + flag (Issue #2).
- Q6 ✅ NO diferido: Inmersión Áurea migrada a `pozo_astral` en mismo canary (chore commit, rename canónico, Restricción 5 preservada).
- Q7 ✅ Orden ajustado a 7 commits: docs(rules) → feat(dsl) → chore(cards) → feat(events) → feat(relics) → feat(tech) → test(cards-index).
- Q8 ✅ Distribución de costos sin cambios (E3 mantiene cost 2).

**Criterios objetivos de nerf Zaqe** (anotados en commit message de R2 `feat(relics)`):

1. Win rate Zaqe > 60% vs cualquier raza en partidas turn 10+ → nerf.
2. R1 + R2 + E1 aparecen los 3 en > 80% de mazos Zaqe competitivos → nerf alguno.
3. Combo R1 + Hangar de Aguas Doradas existing genera > 5 cartas/turno → cap retroactivo.
4. Tiempo promedio de cierre Zaqe < 10 turnos → revisar (debería ser long-game).
5. T1 Disolutorio Sqhaguata pick rate > 85% en mirror Zaqe → considerar restricción "non-Zaqe relics only".

**Estado final del set base v3.0:** 74 cartas (Q'ralan=19 + Würon=19 + Tezhal=18 + Zaqe=18). 4 archetypes ortogonales documentados con criterios de nerf por raza. DSL v3.0.3 schema-only (interpreter TODOs Phase 1 kernel). 279/279 tests passing. Próxima fase: deck-builder agent + game-simulator agent + balance-analyst agent para validación masiva.
