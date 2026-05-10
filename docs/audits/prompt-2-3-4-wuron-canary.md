# Canary Würon — Eventos, Reliquias y Tecnologías (Prompts 2/3/4)

**Fecha:** 2026-05-10
**Alcance:** **canary deploy sólo Würon**. 4 eventos nuevos + 2 reliquias adicionales + 2 tecnologías adicionales = **8 cartas**. Las otras 3 razas se generarán después si este output cierra bien.

> **Modo proposal — NO se han escrito JSONs.** Después de tu OK voy con commits separados:
>
> - `feat(events): würon eventos set base v3.0`
> - `feat(relics): würon reliquias set base v3.0`
> - `feat(tech): würon tech set base v3.0`

---

## Resumen ejecutivo

| #   | Nombre               | Tipo  | Costo | Rareza | Profile balance | Sinergia Külen | Idea breve                                                               |
| --- | -------------------- | ----- | ----- | ------ | --------------- | -------------- | ------------------------------------------------------------------------ |
| E1  | Eco del Brote        | event | 1     | common | hab_only        | ✅ directa     | Reaccionar al daño: la Würon herida gana +1 fuerza permanente.           |
| E2  | Brote Espinado       | event | 2     | common | hab_only        | ✅ indirecta   | Castigo al atacante: 2 daño al enemigo que ataque tu Würon.              |
| E3  | Savia Antigua        | event | 4     | rare   | hab_only        | ⚠️ indirecta   | Resucita una Würon que murió este turno con 1 HP (post-combate de raza). |
| E4  | Aullido del Bosque   | event | 3     | rare   | hab_only        | ✅ directa AoE | Hieres voluntariamente una Würon; toda tu flota Würon gana +1 fuerza.    |
| R1  | Trono de Lhülkan     | relic | 4     | rare   | hab_only        | ✅ amplifica   | Cada activación de Külen ahora da +2 fuerza en lugar de +1.              |
| R2  | Brotal de Üntu       | relic | 3     | common | hab_only        | ✅ habilita    | Inicio de turno: una Würon recibe 1 daño (auto-trigger Külen).           |
| T1  | Raíz Profunda        | tech  | 2     | common | hab_only        | ✅ refresh     | Una Würon sana al máximo y gana +1 fuerza permanente.                    |
| T2  | Despertar de la Raíz | tech  | 5     | rare   | hab_only        | ✅ pulso AoE   | Cada Würon en juego gana +1 fuerza permanente (Külen forzado AoE).       |

**Distribución de costos** (8 cartas): cost 1 (1) · cost 2 (2) · cost 3 (2) · cost 4 (2) · cost 5 (1). Cumple `≥1 cost 1-2`, `≥1 cost 4-5`, sin saturar cost 3.

**Distribución de rareza**: 3 common (E1, E2, R2, T1 → 4) wait — let me recount: E1c, E2c, E3r, E4r, R1r, R2c, T1c, T2r = **4 common, 4 rare**. Sobre 8 cartas, ratio 50/50, distinto del 60/30/10 de set base. Justificado: este pool añade soporte mecánico, no replicates de naves comunes — los rares hacen el trabajo conceptual nuevo. Si el ratio te incomoda, puedo bajar E4 a common (es la candidata más débil para rare; ver justificación abajo).

**Sinergia Külen**: 7 de 8 cartas tocan el ciclo reactivo de algún modo. **5 directamente** (E1, E4, R1, R2, T2). **2 indirecta** (E2 ayuda a sobrevivir → activar Külen; T1 cura para reactivar). **1 sin sinergia clara** (E3 — pertenece más a un patrón "post-combate de raza", ver Q3 abajo).

---

## E. Eventos (Prompt 2 — 4 nuevos)

### E1. Eco del Brote

- **Tipo:** event · **costo:** 1 · **rareza:** common
- **Keywords:** —
- **Habilidad:** _Al jugarse: una nave Würon tuya gana +1 fuerza permanente. Sólo puedes jugarlo si esa nave recibió daño este turno._
- **Effect tree sugerido:**
  ```json
  {
    "trigger": { "kind": "on_play" },
    "category": "reactive",
    "effect": {
      "op": "modify_strength",
      "target": { "kind": "chosen_ship", "filter": { "controller": "self", "race": "wuron" } },
      "kind": "delta",
      "value": 1,
      "duration": "permanent"
    },
    "description": "Al jugarse: una nave Würon tuya gana +1 fuerza permanente. Sólo puedes jugarlo si esa nave recibió daño este turno."
  }
  ```
  > **Nota:** la condición "recibió daño este turno" no está expresable directamente en los primitives actuales (`spec.ts` no expone un filtro `tookDamageThisTurn`). Opciones: (a) añadir primitive `was_damaged_this_turn` en una spec subsidiaria; (b) relajar el evento a "una Würon cualquiera gana +1 str perm" y aceptar que el flavor lleva la restricción narrativamente. Recomiendo (a). **Ver Q1.**
- **Flavor text:** _"El bosque guarda cada herida; al rato, todo lo que el bosque guarda crece."_ (94 chars)
- **Justificación de diseño:** evento barato que extiende Külen — convierte "+1 fuerza al sobrevivir un golpe" en "+2 si pago 1 mana de respuesta". Está en categoría reactiva por construcción narrativa (responde al dolor recibido). Sinergia firma directa.
- **Rol en mazo:** **stacker de tempo** en mazo Würon agresivo. Permite empujar daño temprano sin perder tablero porque cada hit que tomas se convierte en valor.

---

### E2. Brote Espinado

- **Tipo:** event · **costo:** 2 · **rareza:** common
- **Keywords:** —
- **Habilidad:** _Cuando una nave enemiga ataque a una de tus naves Würon, hace 2 daño al atacante. (Pongas en juego como respuesta al ataque.)_
- **Effect tree sugerido:**
  ```json
  {
    "trigger": {
      "kind": "on_event",
      "event": "ship_attacked",
      "filter": { "shipFilter": { "controller": "self", "race": "wuron" } }
    },
    "category": "reactive",
    "effect": {
      "op": "damage",
      "target": { "kind": "attacker" },
      "amount": 2
    },
    "description": "Cuando una nave enemiga ataque a una de tus naves Würon, hace 2 daño al atacante."
  }
  ```
  > **Nota schema:** `ship_attacked` no está en la lista actual de eventos (`ship_damaged`, `ship_destroyed`, `card_played`, `planet_activated`, `phase_start`, `phase_end`, `turn_start`, `age_changed`, `homeworld_damaged`, `card_drawn`). Tampoco existe `target.kind: 'attacker'`. Necesita primitives nuevos. Alternativa: usar `ship_damaged` + filtro al atacante (más complicado de modelar). **Ver Q2.**
- **Flavor text:** _"Tocás el bosque y el bosque vuelve a tocarte."_ (52 chars)
- **Justificación de diseño:** spike damage reactive. Castiga al atacante mientras la nave dañada activa Külen orgánicamente — combo natural. Cost 2 razonable: 2 daño es comparable a un removal barato.
- **Rol en mazo:** **anti-aggro defense**. Hace que atacar a tus Würon dañadas sea un mal trato para el oponente.

---

### E3. Savia Antigua

- **Tipo:** event · **costo:** 4 · **rareza:** rare
- **Keywords:** —
- **Habilidad:** _Al jugarse: regresa una nave Würon de tu Pozo Astral al campo con 1 HP. La nave entra dañada y mareada (no puede atacar este turno)._
- **Effect tree sugerido:**
  ```json
  {
    "trigger": { "kind": "on_play" },
    "category": "post_combat",
    "effect": {
      "op": "search",
      "owner": "self",
      "zone": "graveyard",
      "filter": { "race": "wuron" },
      "count": 1,
      "destination": "play"
    },
    "description": "Al jugarse: regresa una nave Würon de tu Pozo Astral al campo con 1 HP."
  }
  ```
  > **Nota:** el primitive `search ... destination: 'play'` existe. La parte de "con 1 HP" requiere chequeo del engine — puede que `search-to-play` ponga la nave a HP completo por default. Si es así, sumar un `modify_hp set 1` posterior, o añadir parámetro `entering_state` al search. **Ver Q3.**
- **Flavor text:** _"La savia antigua sube; lo que el bosque dio por muerto vuelve, herido."_ (70 chars)
- **Justificación de diseño:** **off-category intencional** — efecto post-combate (recupera de Pozo Astral) en raza Reactiva. Defendible porque el "dolor encarnado" del Würon resucita sintiendo aún la herida que lo mató. La nave entra a 1 HP precisamente para gatillar Külen al primer golpe siguiente. Cost 4 alto para evitar abuso con legendarias.
- **Rol en mazo:** **late-game grind**. Recupera tu legendaria Würon (Lhwentrü) o tu Raíz Ancestral. Sinergia con Trono de Lhülkan (R1) que duplica el siguiente Külen.
- **Flag:** marcar `intentionalOffCategory: true`.

---

### E4. Aullido del Bosque

- **Tipo:** event · **costo:** 3 · **rareza:** rare
- **Keywords:** —
- **Habilidad:** _Al jugarse: una nave Würon tuya recibe 1 daño (tú eliges cuál). Todas tus naves Würon ganan +1 fuerza permanente._
- **Effect tree sugerido:**
  ```json
  {
    "trigger": { "kind": "on_play" },
    "category": "reactive",
    "effect": {
      "op": "sequence",
      "effects": [
        {
          "op": "damage",
          "target": { "kind": "chosen_ship", "filter": { "controller": "self", "race": "wuron" } },
          "amount": 1
        },
        {
          "op": "for_each",
          "filter": { "controller": "self", "race": "wuron" },
          "effect": {
            "op": "modify_strength",
            "target": { "kind": "self" },
            "kind": "delta",
            "value": 1,
            "duration": "permanent"
          }
        }
      ]
    },
    "description": "Al jugarse: una nave Würon tuya recibe 1 daño (tú eliges cuál). Todas tus naves Würon ganan +1 fuerza permanente."
  }
  ```
- **Flavor text:** _"Una sola raíz grita; el bosque entero se levanta."_ (52 chars)
- **Justificación de diseño:** combo enabler explícito. Pagas 1 daño voluntario (+ riesgo: si la elegida está a 1 HP, muere y no se cuenta) para AoE permanente +1 fuerza. Sinergia firma directa: el daño voluntario tira Külen también si la nave sobrevive (stacking +2 a esa nave). Cost 3 + el daño autoinfligido balancean el AoE.
- **Rol en mazo:** **catalizador de masa**. Mejor en flotas de 3+ Würon. En manos solas no vale la pena.
- **Pregunta:** ver Q4 sobre si el daño autoinfligido cuenta como "daño recibido" para Külen.

---

## R. Reliquias adicionales (Prompt 3 — 2 nuevas; total Würon = 3)

> **Existing:** Bosque del Eco (cost 5, rare, "cada Würon gana +1 HP perm por cada otra Würon").

### R1. Trono de Lhülkan

- **Tipo:** relic · **costo:** 4 · **rareza:** rare
- **Keywords:** —
- **Habilidad:** _Pasivo permanente. Cada vez que una nave Würon tuya activa Külen (recibe daño y sobrevive), gana +2 fuerza permanente en lugar de +1._
- **Effect tree sugerido:**
  ```json
  {
    "trigger": { "kind": "continuous" },
    "category": "reactive",
    "effect": {
      "op": "noop",
      "description": "Implementación: el engine debe revisar este relic al disparar Külen y aumentar el delta de +1 a +2."
    },
    "description": "Pasivo permanente. Cada vez que una nave Würon tuya activa Külen, gana +2 fuerza permanente en lugar de +1."
  }
  ```
  > **Nota:** este efecto modifica la mecánica firma misma; necesita un primitive nuevo `keyword_amplifier { keyword: 'kulen', delta_bonus: 1 }` o lógica especial en el interpretador. **Ver Q5.**
- **Flavor text:** _"Donde el viejo árbol gobierna, cada herida vale dos."_ (54 chars)
- **Justificación de diseño:** **archetype-defining relic** para mazos Külen-stacking. Cost 4 commits un slot a la estrategia. Doble Külen es significativo pero no infinito (depende de cuántos hits recibas). Identifica claramente "estoy jugando Würon control reactiva".
- **Rol en mazo:** **win condition de Külen-stack**. Combo con Brotal de Üntu (R2 — auto-damage), Aullido del Bosque (E4 — daño dirigido), Lhwentrü (legendaria con AoE Külen).

---

### R2. Brotal de Üntu

- **Tipo:** relic · **costo:** 3 · **rareza:** common
- **Keywords:** —
- **Habilidad:** _Pasivo permanente. Al inicio de tu turno, una nave Würon tuya recibe 1 daño (tú eliges cuál)._
- **Effect tree sugerido:**
  ```json
  {
    "trigger": { "kind": "on_event", "event": "turn_start" },
    "category": "reactive",
    "effect": {
      "op": "damage",
      "target": { "kind": "chosen_ship", "filter": { "controller": "self", "race": "wuron" } },
      "amount": 1
    },
    "description": "Al inicio de tu turno: una nave Würon tuya recibe 1 daño (tú eliges cuál)."
  }
  ```
  > **Nota:** `turn_start` debería filtrarse al turno propio del controlador. Confirmar que el evento existente lo permite. Si no, agregar `phase_start: 'recoleccion'` con filter a `controller='self'`.
- **Flavor text:** _"En el brote duele todo el día; en el dolor crece todo el bosque."_ (66 chars)
- **Justificación de diseño:** **proactiviza** la economía Külen — ya no dependes del oponente para gatillar tu firma. Cost 3 común porque el riesgo es real (si te quedas sin Würon que aguante, te mata vos mismo). Sinergiza fuerte con Trono de Lhülkan (R1) y Lhwentrü (legendaria que es AoE Külen al recibir daño).
- **Rol en mazo:** **engine continuo** en builds de control. Convierte el tablero en un motor de buffs permanentes mientras tu rival no encuentra cómo capitalizar.
- **Pregunta:** ver Q6 sobre el efecto cuando no tenés ninguna Würon en juego.

---

## T. Tecnologías adicionales (Prompt 4 — 2 nuevas; total Würon = 3)

> **Existing:** Susurro del Bosque (cost 4, rare, "cada Würon gana +1 fuerza permanente por cada otra Würon" — buff cuadrático).

### T1. Raíz Profunda

- **Tipo:** tech · **costo:** 2 · **rareza:** common
- **Keywords:** —
- **Habilidad:** _Al jugarse: una nave Würon tuya recupera todo su HP, y gana +1 fuerza permanente._
- **Effect tree sugerido:**
  ```json
  {
    "trigger": { "kind": "on_play" },
    "category": "reactive",
    "effect": {
      "op": "sequence",
      "effects": [
        {
          "op": "modify_hp",
          "target": { "kind": "chosen_ship", "filter": { "controller": "self", "race": "wuron" } },
          "kind": "set_to_max",
          "value": 0,
          "duration": "permanent"
        },
        {
          "op": "modify_strength",
          "target": { "kind": "chosen_ship", "filter": { "controller": "self", "race": "wuron" } },
          "kind": "delta",
          "value": 1,
          "duration": "permanent"
        }
      ]
    },
    "description": "Al jugarse: una nave Würon tuya recupera todo su HP, y gana +1 fuerza permanente."
  }
  ```
  > **Nota:** primitive `modify_hp kind: 'set_to_max'` no existe (kinds actuales: `delta`, `set`). Alternativa: usar `set` con un valor calculado dinámicamente — necesita extension del DSL. **Ver Q7.**
- **Flavor text:** _"La raíz no se cura: vuelve a empezar."_ (39 chars)
- **Justificación de diseño:** **refresh + buff** para extender la vida de la nave dañada que ya cargó Külen. Cost 2 común llena hueco de tech barata (Susurro está en cost 4). Permite sostener una Würon herida por turnos extras de combate.
- **Rol en mazo:** **soporte de tempo**. Especialmente fuerte en una Würon legendaria (Lhwentrü) o rare (Raíz Ancestral) ya buffeada por Külen — la mantiene en juego más turnos.

---

### T2. Despertar de la Raíz

- **Tipo:** tech · **costo:** 5 · **rareza:** rare
- **Keywords:** —
- **Habilidad:** _Al jugarse: cada una de tus naves Würon en juego gana +1 fuerza permanente._
- **Effect tree sugerido:**
  ```json
  {
    "trigger": { "kind": "on_play" },
    "category": "reactive",
    "effect": {
      "op": "for_each",
      "filter": { "controller": "self", "race": "wuron" },
      "effect": {
        "op": "modify_strength",
        "target": { "kind": "self" },
        "kind": "delta",
        "value": 1,
        "duration": "permanent"
      }
    },
    "description": "Al jugarse: cada una de tus naves Würon en juego gana +1 fuerza permanente."
  }
  ```
- **Flavor text:** _"El bosque que se ha dolido entero, también se levanta entero."_ (62 chars)
- **Justificación de diseño:** **pulso AoE lineal** — diferente de Susurro (escala cuadrática: 4 Würon = +12 stat). Despertar con 4 Würon = +4 stat. Tempo distinto: Susurro es win condition explosiva en mazos masa, Despertar es push final de partida cerrada. Cost 5 le pone freno.
- **Rol en mazo:** **finisher** en builds reactivas que llegaron al late game con tablero parejo. Cierra la partida agregando 4-5 fuerza acumulada que el rival no puede revertir.
- **Pregunta:** ver Q8 sobre si tiene sentido conceptual incluir 2 techs Würon o si se duplica con Susurro.

---

## Decisiones que requieren OK del usuario

> Listadas en orden de bloqueo. Las marcadas **[bloqueante]** te recomiendo resolver antes de aplicar; las **[diferible]** podemos resolverlas durante implementación.

### Q1. [bloqueante] Filtro "recibió daño este turno" para Eco del Brote (E1)

La condición narrativa es importante (es lo que justifica cost 1 + permanent buff). Pero el DSL no tiene primitive `was_damaged_this_turn`. ¿Opciones?

a. **Añadir primitive `was_damaged_this_turn`** al DSL antes de aplicar este canary (spec subsidiaria pequeña: condition + interpreter check + renderer).
b. **Relajar la carta** a "una Würon cualquiera gana +1 str perm" (sin condición) — más fuerte mecánicamente, costo subiría a 2.
c. **Hacerlo en el flavor solo** (la regla escrita dice la condición, el engine no la chequea — el jugador la respeta por convención).

Mi recomendación: (a). ¿OK?

### Q2. [bloqueante] Trigger `ship_attacked` y target `attacker` para Brote Espinado (E2)

Ninguno de los dos existe en `spec.ts`. ¿Añadimos como primitives nuevos? Para "castigar atacantes" en general, son primitives valiosos a futuro (otras razas también podrían usarlos).

Alternativa: **modelar como reacción a `ship_damaged`** y deducir el atacante via state lookup en el engine. Más feo, no requiere DSL extension.

Mi recomendación: añadir primitives. ¿OK?

### Q3. [diferible] Categoría de Savia Antigua (E3)

Es revivir → función Post-combate. Pero el evento se juega como reacción a la pérdida → narrativamente Reactiva. Lo dejé en `category: post_combat` con `intentionalOffCategory: true` (alineado con la mecánica más que con la raza).

Alternativa: marcarlo `category: reactive` (alineado con raza) y dejarlo conceptualmente en la fricción. Cost 4 ya es alto suficiente como freno.

¿Te quedas con post_combat (off-category flag) o reactive (clean)?

### Q4. [bloqueante para implementación] ¿El daño autoinfligido cuenta para Külen?

Aullido del Bosque (E4) hace 1 daño voluntario a una Würon propia. Brotal de Üntu (R2) idem. La pregunta: ¿Külen, que dice "cuando esta nave recibe daño y sobrevive", se gatilla con daño autoinfligido?

- **Sí dispara** = combo más potente (E4 hace +1 a todas + +1 extra a la dañada por Külen = +2 a esa). R2 amplifica engines como Trono de Lhülkan.
- **No dispara** = el daño voluntario es "pago" de la habilidad, no "daño recibido por el oponente".

Mi recomendación: **sí dispara**. La regla escrita ("cuando esta nave recibe daño") no especifica fuente; mantenerla limpia evita reglas asterisco. ¿OK?

### Q5. [bloqueante] Trono de Lhülkan (R1) — primitive nuevo `keyword_amplifier`

Es un patrón potente y reusable (otras razas podrían tener "Quetlani amplifica Ignición", "Sumaq amplifica Formación Solar"). Vale agregar el primitive bien.

¿OK con añadir `keyword_amplifier { keyword, delta_bonus }` al DSL en el commit de relics?

### Q6. [diferible] Brotal de Üntu (R2) sin target válido

Si tenés 0 Würon en juego al inicio del turno, ¿el efecto se salta silenciosamente o el engine emite error/log? Default razonable: skip silencioso.

### Q7. [bloqueante para implementación] Primitive `modify_hp kind: 'set_to_max'`

Raíz Profunda (T1) cura al máximo. El DSL actual sólo tiene `set` y `delta`. ¿Agregamos `set_to_max`?

Alternativa: rebajar la carta a `delta +X` con un valor fijo (ej: +3 HP). Menos elegante; depende del cap de HP de la nave.

Mi recomendación: añadir `set_to_max`. ¿OK?

### Q8. [diferible] ¿2 techs o 1?

Despertar de la Raíz (T2) overlaps conceptualmente con Susurro (otro AoE buff Würon). Se diferencian:

- **Susurro**: cuadrático (4 Würon = +12 stat distribuido), cost 4, scaling con masa.
- **Despertar**: lineal (4 Würon = +4 stat distribuido), cost 5, push final.

Mi opinión: tienen roles distintos en mazos distintos. Vale tener ambas. Pero si te incomoda, **bajamos a 7 cartas (sólo T1)** y queda fuera de canary.

¿1 o 2 techs?

### Q9. [diferible] Distribución de rareza (4c/4r) vs canon (60/30/10)

El pool nuevo de 8 cartas tiene más rares de lo "esperado" según sec 6.5. Justificación: estas cartas hacen trabajo conceptual (combos, archetypes), no replican las naves comunes. Después de aplicar el canary completo (con las otras 3 razas), el ratio agregado del set base se reequilibra.

Si querés mantenerlo cerca de 60/30/10 ya en este canary, bajamos E4 a common (es la candidata más débil para rare — su efecto es chocante pero dependiente de tener flota). Te lo dejo a tu juicio.

### Q10. [bloqueante de proceso] Orden de commits con primitives nuevos

Si confirmas los primitives nuevos (Q1, Q2, Q5, Q7), el plan correcto es:

1. Commit 1: spec subsidiaria + DSL extensions (`was_damaged_this_turn`, `ship_attacked` event, `attacker` target, `keyword_amplifier`, `modify_hp set_to_max`) + interpreter + renderer + tests.
2. Commit 2: events JSON.
3. Commit 3: relics JSON.
4. Commit 4: tech JSON.

¿Querés que escriba la spec subsidiaria primero, o que aplique las cartas con descriptions y deje los engine pieces como TBD?

---

## Reporte breve (≤300 palabras)

**Producido:** 8 cartas Würon nuevas (4 events + 2 relics + 2 tech). Distribución de costo cumple las restricciones: 1, 2, 2, 3, 3, 4, 4, 5. Distribución de rareza 4c/4r — más rares que el 60/30/10 canon, justificado porque estas cartas hacen trabajo conceptual; el ratio se reequilibra al sumar las 3 razas restantes.

**Sinergia Külen:** 7 de 8 tocan el ciclo reactivo. 5 directamente (E1, E4, R1, R2, T2), 2 indirecta (E2, T1), 1 off-category intencional (E3 — revive). Cumple "mínimo 2 de 4 events sinergian con Külen" (E1, E4 directas; E2 indirecta; sólo E3 está off).

**Patrón emergente — "Külen-stacking" archetype:** R1 (Trono) + R2 (Brotal) + E4 (Aullido) + T1 (Raíz Profunda) + T2 (Despertar) forman un combo-engine donde el dolor autoinfligido se convierte en buffs permanentes amplificados. Es un win condition definido para Würon que antes no existía claramente con sólo las 11 naves base.

**Bloqueantes reales:** 5 primitives nuevos para implementar fielmente (Q1, Q2, Q5, Q7 + el target `attacker`). Si los aprobás, propongo commit 0 con spec subsidiaria del DSL antes de los 3 commits feat. Si no los aprobás, varias cartas pierden su versión "limpia" y caen a alternativas más débiles o requieren reglas asterisco.

**Preguntas abiertas:** 10 listadas; 5 son bloqueantes (Q1, Q2, Q4, Q5, Q7), 4 son diferibles (Q3, Q6, Q8, Q9), 1 es de proceso (Q10).

**Riesgo principal:** R1 (Trono de Lhülkan) puede ser muy fuerte combinado con Lhwentrü legendaria (la Sombra-Külen AoE x2 = +2 a todos los Würon en cada hit). Anotar para playtest.
