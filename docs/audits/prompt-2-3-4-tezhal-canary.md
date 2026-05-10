# Canary Tezhal — Eventos, Reliquias y Tecnologías (Prompts 2/3/4)

**Fecha:** 2026-05-10
**Alcance:** **canary deploy sólo Tezhal**. 4 eventos nuevos + 2 reliquias adicionales + 2 tecnologías adicionales = **8 cartas**. Mismo patrón que el canary Würon (`prompt-2-3-4-wuron-canary.md`). Q'ralan y Zaqe se generarán después si este output cierra bien.

> **Modo proposal — NO se han escrito JSONs.** Después de tu OK voy con commits separados (mismo orden que Würon):
>
> - `feat(dsl): primitives v3.0.2 — extend search.filter (Tezhal canary)` (si confirma Q1)
> - `feat(events): tezhal eventos set base v3.0`
> - `feat(relics): tezhal reliquias set base v3.0`
> - `feat(tech): tezhal tech set base v3.0`

---

## Contexto del archetype

**Archetype objetivo**: kamikaze-tempo puro. Las naves Tezhal son combustible, no amenazas duraderas. Ignición convierte el board en daño/efecto explosivo en una sola vuelta. Ortogonal a Külen-stacking por construcción:

| Eje             | Würon Külen-stacking      | Tezhal Kamikaze-tempo          |
| --------------- | ------------------------- | ------------------------------ |
| Trigger         | Pasivo (al recibir daño)  | Activo (vos elegís sacrificar) |
| Curva           | Acumulación (turno 7+)    | Burst (turno 4-5)              |
| Mano ideal      | 3-4 unidades vivas late   | Vaciar board buscando lethal   |
| Recurso central | HP del board propio       | Cartas-combustible (1c Tezhal) |
| Win condition   | Cuadrático buff acumulado | Daño explosivo single turn     |

**Test de no-recaída en Külen-stacking:** ningún trigger de Ignición es `on_destroy` ni `ship_damaged`. Todos son `on_play` (eventos/tech) o `activated` (en cartas existentes). El sacrificio es **siempre** voluntario y proactivo dentro del turno propio.

**Cumplimiento de restricciones inviolables:**

| #   | Restricción                                            | Cómo se cumple                                                                                                            |
| --- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| 1   | Test de Iniciativa pura (trigger activo)               | Todos los triggers son `on_play` (events/tech) — el jugador elige el momento del sacrificio dentro de su turno            |
| 2   | Balance Ignición: efecto ≈ costo nave + 1-2 tempo      | Cada carta paga cost N + ship sacrificado (~2 mana), entrega efecto valuado en N+2~N+4 mana. Ver justificaciones.         |
| 3   | Target sacrificio: aliada **Y** raza Tezhal            | Cada `sacrifice` op apunta a `chosen_ship` con `filter: { controller: 'self', race: 'tezhal' }` explícito                 |
| 4   | Generadores de carne                                   | R1 (Hangar Eterno) auto-spawnea 1c Tezhal cada turno propio — provee munición sostenida. Ver Q1 (DSL extension).          |
| 5   | Counter wheel Tezhal > Zaqe (Pozo Astral / Disolución) | T1 (Espejo Disolutorio) exilia naves enemigas a Disolución directa, saltándose Pozo Astral → no puede gatillar Refluencia |

---

## Resumen ejecutivo

| #   | Nombre                  | Tipo  | Costo | Rareza | Profile balance | Sinergia Ignición  | Idea breve                                                                  |
| --- | ----------------------- | ----- | ----- | ------ | --------------- | ------------------ | --------------------------------------------------------------------------- |
| E1  | Plumaje Encendido       | event | 1     | common | hab_only        | ✅ face-rush       | Sacrificá una Tezhal: 2 daño al hangar enemigo.                             |
| E2  | Salva Ritual            | event | 4     | rare   | hab_only        | ✅ AoE removal     | Sacrificá una Tezhal: 2 daño a todas las naves enemigas.                    |
| E3  | Cuchilla del Quinto Sol | event | 3     | common | hab_only        | ✅ swing single    | Sacrificá una Tezhal: una Tezhal aliada gana +3 fuerza y Embate este turno. |
| E4  | Cántico Tlapetl         | event | 5     | rare   | hab_only        | ✅ lethal AoE      | Sacrificá una Tezhal: cada otra Tezhal aliada gana +2 fuerza y Embate.      |
| R1  | Hangar Eterno           | relic | 4     | rare   | hab_only        | ✅ generador carne | Cada inicio de turno: spawn 1c Tezhal del deck. (necesita DSL ext, ver Q1)  |
| R2  | Brasero del Sol Quinto  | relic | 3     | common | hab_only        | ✅ loop económico  | Cada Tezhal aliada cost ≤ 2 que muera: +1 energía este turno.               |
| T1  | Espejo Disolutorio      | tech  | 3     | rare   | hab_only        | ✅ counter Zaqe    | Sacrificá una Tezhal: exiliá una nave enemiga (a Disolución).               |
| T2  | Filo del Tonatzin       | tech  | 3     | common | hab_only        | ✅ anti-Würon      | Sacrificá una Tezhal: destruí una nave enemiga de costo ≤ 4.                |

**Distribución de costos** (8 cartas): cost 1 (1) · cost 3 (4) · cost 4 (2) · cost 5 (1). Cumple `≥1 cost 1-2`, `≥1 cost 4-5`. Concentración en cost 3 — ver Q8 si te incomoda.

**Distribución de rareza**: 4c (E1, E3, R2, T2) + 4r (E2, E4, R1, T1) = **4 común / 4 rare**. Mismo ratio 50/50 que Würon canary; mismo argumento: el pool nuevo aporta soporte mecánico arquetípico, no naves comunes — los rares hacen el trabajo conceptual nuevo. Se reequilibra cuando agreguemos Q'ralan + Zaqe.

**Sinergia Ignición** (firma + archetype): 8 de 8 cartas tocan el ciclo activo. 7 con keyword `ignicion` explícita (todas excepto R2, que es trigger pasivo `on_event ship_destroyed` y por convención no lleva la keyword). 1 carta es el **generador de carne** (R1). 1 carta es el **counter wheel** explícito (T1). 1 carta es **anti-Würon stacking** (T2). 4 cartas son **payoffs de Ignición** (E1-E4). 1 carta es **loop económico** (R2).

---

## E. Eventos (Prompt 2 — 4 nuevos)

### E1. Plumaje Encendido

- **Tipo:** event · **costo:** 1 · **rareza:** common
- **Keywords:** `ignicion`
- **Habilidad:** _Ignición: hacé 2 daño al hangar enemigo._
- **Effect tree sugerido:**
  ```json
  {
    "trigger": { "kind": "on_play" },
    "category": "initiative",
    "effect": {
      "op": "sequence",
      "effects": [
        {
          "op": "sacrifice",
          "target": {
            "kind": "chosen_ship",
            "filter": { "controller": "self", "race": "tezhal" }
          }
        },
        {
          "op": "damage_homeworld",
          "player": "opponent",
          "amount": 2
        }
      ]
    },
    "description": "Ignición: hacé 2 daño al hangar enemigo."
  }
  ```
- **Flavor text:** _"Una proa se apaga; el plumaje arde directo contra la ciudadela."_ (62 chars)
- **Justificación de diseño:** chip damage al rostro a costo bajo. Cost 1 + sacrificio (≈2 mana de carne 1c) → 2 face damage. Comparable a "jugar 2c 2/2 ship + atacar homeworld" pero sin defensores — la Ignición salta las naves enemigas. El tradeoff: gastás una carta extra (el evento) en lugar de presionar con el body. Aggro temprano.
- **Rol en mazo:** **race finisher temprano**. Combinado con Iniciado Xocotzin (1c 1/1 Tezhal existente) hace 2 face damage a costo total 2 mana + 2 cartas → presión 8-12 face damage en 4-5 turnos si tenés flujo de carne.

---

### E2. Salva Ritual

- **Tipo:** event · **costo:** 4 · **rareza:** rare
- **Keywords:** `ignicion`
- **Habilidad:** _Ignición: hacé 2 daño a todas las naves enemigas._
- **Effect tree sugerido:**
  ```json
  {
    "trigger": { "kind": "on_play" },
    "category": "initiative",
    "effect": {
      "op": "sequence",
      "effects": [
        {
          "op": "sacrifice",
          "target": {
            "kind": "chosen_ship",
            "filter": { "controller": "self", "race": "tezhal" }
          }
        },
        {
          "op": "for_each",
          "filter": { "controller": "opponent" },
          "effect": {
            "op": "damage",
            "target": { "kind": "self" },
            "amount": 2
          }
        }
      ]
    },
    "description": "Ignición: hacé 2 daño a todas las naves enemigas."
  }
  ```
- **Flavor text:** _"El sector entero se enciende cuando una sola nave se ofrenda."_ (61 chars)
- **Justificación de diseño:** AoE 2 dmg = 4-6 mana de valor con board parejo. Cost 4 + sacrificio (≈2 mana) = 6 mana cost. Fair contra board lleno; lossy con board vacío (no tirarla en seco). Counter natural a Würon stacking (limpia 1-2 HP enemies que no llegaron a stackear) y a Q'ralan Formación Solar (rompe la masa con +1/each).
- **Rol en mazo:** **board control**. Mejor en turno 5-6 cuando el oponente desplegó masa. En matchups aggro pierde tempo (tu propio board también está liviano y la suma de targets enemigos puede ser baja).
- **Pregunta:** ver Q3 sobre la coherencia de keyword `ignicion` en eventos con sacrificio mandatory.

---

### E3. Cuchilla del Quinto Sol

- **Tipo:** event · **costo:** 3 · **rareza:** common
- **Keywords:** `ignicion`
- **Habilidad:** _Ignición: una nave Tezhal aliada gana +3 fuerza y Embate este turno._
- **Effect tree sugerido:**
  ```json
  {
    "trigger": { "kind": "on_play" },
    "category": "initiative",
    "effect": {
      "op": "sequence",
      "effects": [
        {
          "op": "sacrifice",
          "target": {
            "kind": "chosen_ship",
            "filter": { "controller": "self", "race": "tezhal" }
          }
        },
        {
          "op": "modify_strength",
          "target": {
            "kind": "chosen_ship",
            "filter": { "controller": "self", "race": "tezhal" }
          },
          "kind": "delta",
          "value": 3,
          "duration": "end_of_turn"
        },
        {
          "op": "grant_keyword",
          "target": {
            "kind": "chosen_ship",
            "filter": { "controller": "self", "race": "tezhal" }
          },
          "keyword": "embate",
          "duration": "end_of_turn"
        }
      ]
    },
    "description": "Ignición: una nave Tezhal aliada gana +3 fuerza y Embate este turno."
  }
  ```
  > **Nota:** las dos ops post-sacrificio (`modify_strength` y `grant_keyword`) usan `chosen_ship` por separado. Convención del pool actual (ej: Obsidiana Ardiente) deja al jugador elegir el mismo target en ambas ops. El renderer debería describir como "una sola nave"; el interpreter lo trata como dos selecciones independientes (asumimos buena fe del jugador). Ver Q4 si querés un mecanismo de "binding" formal.
- **Flavor text:** _"El novicio se ofrenda en el hangar; la cuchilla aliada despierta con sed propia."_ (84 chars)
- **Justificación de diseño:** el evento de **swing single-target** del archetype. Una Navío Tlanixtli (4c 4/4) buffeada con E3 + Iniciado Xocotzin sacrificado → 7 fuerza con Embate. Lethal puzzle. Cost 3 + ship (~2 mana) = 5 mana → +3/+0 + Embate ≈ 5-6 mana de valor. Fair.
- **Rol en mazo:** **lethal puzzle late**. Especialmente con Espejo-Pirámide Tzactli (3c 3/3 que se buffea +3 con Ignición propia) — apilás Cuchilla encima y obtenés un 9 de fuerza con Embate.

---

### E4. Cántico Tlapetl

- **Tipo:** event · **costo:** 5 · **rareza:** rare
- **Keywords:** `ignicion`
- **Habilidad:** _Ignición: cada otra nave Tezhal aliada gana +2 fuerza y Embate este turno._
- **Effect tree sugerido:**
  ```json
  {
    "trigger": { "kind": "on_play" },
    "category": "initiative",
    "effect": {
      "op": "sequence",
      "effects": [
        {
          "op": "sacrifice",
          "target": {
            "kind": "chosen_ship",
            "filter": { "controller": "self", "race": "tezhal" }
          }
        },
        {
          "op": "for_each",
          "filter": { "controller": "self", "race": "tezhal" },
          "effect": {
            "op": "sequence",
            "effects": [
              {
                "op": "modify_strength",
                "target": { "kind": "self" },
                "kind": "delta",
                "value": 2,
                "duration": "end_of_turn"
              },
              {
                "op": "grant_keyword",
                "target": { "kind": "self" },
                "keyword": "embate",
                "duration": "end_of_turn"
              }
            ]
          }
        }
      ]
    },
    "description": "Ignición: cada otra nave Tezhal aliada gana +2 fuerza y Embate este turno."
  }
  ```
  > **Nota:** asumo que `for_each.effect` con `target: { kind: 'self' }` resuelve a "la nave de la iteración actual". Si el interpretador no soporta esta semántica, hay que extender el spec o usar workaround. Ver Q5.
- **Flavor text:** _"Cuando una nave canta su última órbita, todo el sector la corea."_ (64 chars)
- **Justificación de diseño:** **finisher AoE** del archetype. Cost 5 + sacrificio (~2 mana) = 7 mana → AoE +2 + Embate sobre cada Tezhal aliada. Con 3 ships restantes = +6 swing total + 3 Embate triggers ≈ 9-12 mana de valor en una vuelta. Lethal-on-curve si llegás a turno 6-7 con flota pareja.
- **Rol en mazo:** **finisher late game**. Builds Tezhal masa-tempo: Hangar Eterno (R1) sostiene 2-3 cuerpos de carne, E4 sacrifica uno y los otros 2 dan swing letal con Embate.
- **Pregunta:** ver Q5 sobre la semántica `target: 'self'` dentro de `for_each`.

---

## R. Reliquias adicionales (Prompt 3 — 2 nuevas; total Tezhal = 3)

> **Existing:** Pirámide Orbital Quetlani (cost 5, rare, "cada Tezhal aliada destruida → +1 energía EoT").

### R1. Hangar Eterno

- **Tipo:** relic · **costo:** 4 · **rareza:** rare
- **Keywords:** —
- **Habilidad:** _Pasivo. Al inicio de tu turno, si controlás menos de 3 naves Tezhal, busca en tu deck una nave Tezhal de costo ≤ 1 y ponela en juego._
- **Effect tree sugerido:**
  ```json
  {
    "trigger": { "kind": "on_event", "event": "turn_start", "filter": { "controller": "self" } },
    "category": "initiative",
    "effect": {
      "op": "conditional",
      "condition": {
        "kind": "count_filter",
        "filter": { "controller": "self", "race": "tezhal" },
        "op": "lte",
        "value": 2
      },
      "thenEffect": {
        "op": "search",
        "owner": "self",
        "zone": "deck",
        "filter": { "race": "tezhal", "costLte": 1 },
        "count": 1,
        "destination": "play"
      }
    },
    "description": "Al inicio de tu turno, si tenés menos de 3 naves Tezhal, busca en tu deck una nave Tezhal de costo ≤ 1 y ponla en juego."
  }
  ```
  > **Nota schema:** `search.filter` actual sólo tiene `cardType` y `race`. Necesita extenderse a `costLte`/`costGte` (mismos campos que ya existen en `ShipFilter`). **Ver Q1.** Sin esta extensión la carta no puede limitarse a cost-1 Tezhal — pulsaría cualquier Tezhal incluyendo legendarias (Xolot Quetlani Ardiente). Ese roll free es inviable de balancear.
- **Flavor text:** _"El hangar nodriza nunca duerme; siempre hay una nave nueva esperando ofrendarse."_ (84 chars)
- **Justificación de diseño:** **generador de carne** — el habilitador estructural del archetype. Cost 4, primera activación turno 5+, free 1c body cada turno mientras tu board no esté lleno. La condición "less than 3 Tezhal" evita que el relic spame board cuando ya tenés flota: solo activa cuando necesitás munición. ROI: 4 mana invertido amortiza en 4 turnos (4 × 1c body = 4 mana). Kamikaze-tempo necesita esto: sin generador, te quedás sin naves para sacrificar a turno 6+.
- **Rol en mazo:** **engine continuo del archetype**. Particularmente fuerte con Brasero del Sol Quinto (R2) — auto-spawn → sacrificio → +1 energía → permite jugar otra Ignición ese turno → loop infinito en miniatura.
- **Pregunta:** ver Q1 sobre la extensión DSL.

---

### R2. Brasero del Sol Quinto

- **Tipo:** relic · **costo:** 3 · **rareza:** common
- **Keywords:** —
- **Habilidad:** _Pasivo. Cada vez que una nave Tezhal aliada de costo ≤ 2 sea destruida, generás 1 energía este turno._
- **Effect tree sugerido:**
  ```json
  {
    "trigger": {
      "kind": "on_event",
      "event": "ship_destroyed",
      "filter": {
        "shipFilter": {
          "controller": "self",
          "race": "tezhal",
          "costLte": 2
        }
      }
    },
    "category": "initiative",
    "effect": {
      "op": "generate_energy",
      "player": "self",
      "n": 1,
      "duration": "end_of_turn"
    },
    "description": "Cuando una nave Tezhal aliada de costo ≤ 2 sea destruida, generás 1 energía este turno."
  }
  ```
- **Flavor text:** _"La obsidiana se quiebra y el calor sube al hangar; otra orden ya está en marcha."_ (82 chars)
- **Justificación de diseño:** **loop económico**. Cada Iniciado Xocotzin (1c 1/1) o Brasa Tlani (1c 2/1) sacrificado → +1 energía. Convierte el "pago de Ignición" de costoso a casi-gratis: una Cuchilla del Quinto Sol (E3, cost 3) cuesta efectivamente 2 mana neto (3 - 1 refund). Cost 3 común porque es un payoff lineal, no exponencial; depende de tener carne y el carne tiene que morir.
- **Rol en mazo:** **economy engine**. Combo natural con Hangar Eterno (R1, auto-genera carne) y Brasa Tlani / Iniciado Xocotzin (1c bodies que ya estaban en pool).
- **Pregunta:** ver Q6 sobre si `ship_destroyed` se gatilla con sacrificios voluntarios (Ignición), o sólo con muertes en combate.

---

## T. Tecnologías adicionales (Prompt 4 — 2 nuevas; total Tezhal = 2)

> **Existing:** Ofrenda del Xocotzin (tech, cost 2, common, "sacrificá una Tezhal: robá 2 cartas").

### T1. Espejo Disolutorio

- **Tipo:** tech · **costo:** 3 · **rareza:** rare
- **Keywords:** `ignicion`
- **Habilidad:** _Ignición: exiliá una nave enemiga (va a Disolución, no a Pozo Astral)._
- **Effect tree sugerido:**
  ```json
  {
    "trigger": { "kind": "on_play" },
    "category": "initiative",
    "effect": {
      "op": "sequence",
      "effects": [
        {
          "op": "sacrifice",
          "target": {
            "kind": "chosen_ship",
            "filter": { "controller": "self", "race": "tezhal" }
          }
        },
        {
          "op": "exile",
          "target": {
            "kind": "chosen_ship",
            "filter": { "controller": "opponent" }
          },
          "fromZone": "in_play"
        }
      ]
    },
    "description": "Ignición: exiliá una nave enemiga (va a Disolución, no a Pozo Astral)."
  }
  ```
- **Flavor text:** _"Lo que se ofrenda al espejo no resurge: el escuadrón enemigo termina en humo."_ (78 chars)
- **Justificación de diseño:** **counter wheel Tezhal > Zaqe**. La nave enemiga exiliada nunca toca Pozo Astral → Refluencia no puede dispararse. Cost 3 + sacrificio (~2 mana) = 5 mana → exilia cualquier nave enemiga. Premium spot removal que CASTIGA el archetype Zaqe. Contra otras razas también es removal puro, así que la carta no es muerta en otros matchups.
- **Rol en mazo:** **anti-Zaqe + tech-removal universal**. En matchup Zaqe: prioridad-1 contra ships con Refluencia (Balsa Áurea, etc.) — gasta el espejo en el target Refluencia para cerrar la puerta del revival. En otros matchups: removal premium, mismo rol que destroy pero sin pasar por Pozo Astral (también cuenta contra cualquier carta que recicle muertes).
- **Cumplimiento restricción 5:** "muerte por Ignición va a Disolución directa" — la versión cardable. La nave enemiga elegida muere por la Ignición de T1 y termina en Disolución (exile). El counter mecánicamente emerge.

---

### T2. Filo del Tonatzin

- **Tipo:** tech · **costo:** 3 · **rareza:** common
- **Keywords:** `ignicion`
- **Habilidad:** _Ignición: destruí una nave enemiga de costo ≤ 4._
- **Effect tree sugerido:**
  ```json
  {
    "trigger": { "kind": "on_play" },
    "category": "initiative",
    "effect": {
      "op": "sequence",
      "effects": [
        {
          "op": "sacrifice",
          "target": {
            "kind": "chosen_ship",
            "filter": { "controller": "self", "race": "tezhal" }
          }
        },
        {
          "op": "destroy",
          "target": {
            "kind": "chosen_ship",
            "filter": { "controller": "opponent", "costLte": 4 }
          }
        }
      ]
    },
    "description": "Ignición: destruí una nave enemiga de costo ≤ 4."
  }
  ```
- **Flavor text:** _"El filo del sol nuevo encuentra la médula de cada armadura ajena."_ (66 chars)
- **Justificación de diseño:** **anti-Würon stacking** vía cost-cap. Las naves Würon más peligrosas en Külen-stack son cost 2-4 (Brotador Trülke, Lhüpang del Río, Lhunke Cazador, Wutrupang Resistente) — todas dentro del filtro `costLte: 4`. Cost 3 + sacrificio (~2 mana) = 5 mana → destruí enemy ship cost ≤ 4. Premium pero limitado: no kills legendary Würon (Lhwentrü cost 6+). Common porque es removal con cap; el Espejo Disolutorio (T1) es el rare por exilar sin restricción de costo.
- **Rol en mazo:** **answer to Külen-stacked threats**. La Würon stackeada que llegó a 6 fuerza pero base cost 2 sigue siendo cost 2 → Filo la mata sin discusión. Counters el archetype rival sin romper la regla "no asterisk rules" — el cost cap es un freno limpio.
- **Pregunta:** ver Q5 sobre el nombre "Tonatzin".

---

## Decisiones que requieren OK del usuario

> Listadas en orden de bloqueo. **[bloqueante]** = resolver antes de aplicar JSONs. **[diferible]** = resolver durante implementación.

### Q1. [bloqueante] Extensión `search.filter` con `costLte`/`costGte` (R1 Hangar Eterno)

`search` actual:

```ts
filter: { cardType?: CardType; race?: Race }
```

Necesitamos:

```ts
filter: { cardType?: CardType; race?: Race; costLte?: number; costGte?: number }
```

Hangar Eterno depende de poder pulsar específicamente **cost ≤ 1** Tezhal del deck. Sin esto, el efecto pulsaría cualquier Tezhal incluyendo Xolot legendaria (cost 6) → free Xolot cada turno = roto.

**Alternativas si no se aprueba la extensión:**

- (a) Cambiar R1 a "spawn token" — necesita primitive nuevo `spawn_token` con un template de nave inline. Más invasivo.
- (b) Bajar R1 al efecto "cada turno robás una carta Tezhal de tu deck a tu mano" (no entra en juego directo) — más débil, no es generador de carne real.
- (c) Eliminar R1 del canary y dejar al archetype sin generador de carne — rompe Restricción 4.

**Mi recomendación:** (a) extensión `search.filter`. Mismo patrón que ShipFilter ya tiene, mínima extensión, reusable para Q'ralan/Zaqe canary también. **¿OK?**

### Q2. [bloqueante] Coherencia entre `keyword: ignicion` y trigger `on_play` en eventos/tech

Las cartas E1-E4 + T1 + T2 tienen `keyword: ignicion` pero trigger `on_play` con sacrificio mandatory dentro del effect.

El reminder oficial dice: _"podés sacrificar una nave Tezhal aliada para activar el efecto descrito en la carta"_. La palabra "podés" sugiere opcionalidad — coherente con `activated` triggers, NO con `on_play` mandatory.

**Opciones:**

- (a) **Aceptar la inconsistencia**: keyword `ignicion` señala el motivo narrativo y el sacrificio dentro del `on_play` es la implementación. El renderer prefija "Ignición:" en la descripción. Engine no necesita cambios.
- (b) **Restringir keyword**: `ignicion` solo en cartas con `activated` trigger. Eventos/tech con sacrificio NO llevan la keyword (siguen el patrón de Ofrenda del Xocotzin existente). Pierde consistencia visual pero mantiene semántica estricta.
- (c) **Refrasear el reminder**: cambiar a _"requiere sacrificar una nave Tezhal aliada para activar el efecto descrito en la carta"_ — quita el "podés" y normaliza tanto activated como on_play.

**Mi recomendación:** (a) — keyword es marker narrativo, validator no chequea opcionalidad. Pero si querés purismo, (c) es más limpio. **¿Cuál?**

### Q3. [bloqueante para implementación] ¿Qué eventos del engine emite el sacrificio voluntario?

Brasero del Sol Quinto (R2) escucha `ship_destroyed`. Si el sacrificio Ignición emite `ship_destroyed` (mismo evento que muerte combate), R2 funciona como diseñado.

Si NO lo emite (sacrificio = path separado en el engine), R2 está roto: solo gatilla cuando los enemigos matan tu Tezhal en combate, no cuando vos sacrificás voluntariamente.

**Mi recomendación:** sacrificio debe emitir `ship_destroyed` con un payload extra opcional `cause: 'sacrifice' | 'combat'` que las cartas que lo necesiten puedan filtrar. R2 no filtra por causa, así que captura ambos. Esto también afecta a Pirámide Orbital Quetlani (existing relic con la misma mecánica). **¿OK?**

### Q4. [diferible] Selección de target en sequences multi-step

E3 y T1 tienen sequences con múltiples ops sobre `chosen_ship` — convención del pool actual deja al jugador elegir el mismo target en cada `chosen_ship` (ej. Obsidiana Ardiente). Funciona en práctica pero es frágil (jugador despistado puede elegir distintos ships).

**Opciones:**

- (a) Status quo: trust the player.
- (b) Agregar primitive de binding: `with_target { selection: chosen_ship_filter, effects: Effect[] }` — selecciona una vez, aplica varios effects sobre la misma referencia.

**Mi recomendación:** (a) por ahora; agregar (b) cuando aparezca un caso donde la fricción importa. Las 2 cartas afectadas son legibles si el renderer dice "una nave aliada Tezhal gana +3 y Embate" (singular). **¿OK?**

### Q5. [diferible] Semántica `target: 'self'` dentro de `for_each`

E4 (Cántico Tlapetl) usa `for_each` con effect interno cuyo target es `{ kind: 'self' }`. Asumo que el interpreter substituye `self` por la nave de la iteración actual. Si no, el effect tree no se valida.

Buscando en el pool actual: **no hay precedente claro** — la mayoría de `for_each` aplican a un target externo (`chosen_ship`, `controller`, `homeworld`). Los efectos AoE Würon (Despertar de la Raíz) lo usan así también:

```json
"effect": { "op": "for_each", "filter": { "controller": "self", "race": "wuron" }, "effect": { "op": "modify_strength", "target": { "kind": "self" }, ... } }
```

Despertar ya está aplicado y commiteado. Asumo que la convención `target: 'self'` en for_each = "iteración actual" es válida. **Confirmar con engine impl Phase 1.**

### Q6. [diferible] R2 Brasero — ¿debería filtrar también por cause de muerte?

Diseño actual: R2 dispara con cualquier muerte de Tezhal cost ≤ 2 (sacrificio voluntario, daño combate, exile). Eso recompensa al rival también — si el oponente mata tu Iniciado Xocotzin, vos ganás +1 energía.

**Opciones:**

- (a) Status quo: cualquier muerte. Defensa pasiva contra aggro. Coherente con la "voz Tezhal" — toda nave caída es ofrenda al sol quinto.
- (b) Restringir a sacrificio voluntario: necesita nuevo `cause` filter en TriggerFilter (ver Q3). Solo recompensa el archetype activo.

**Mi recomendación:** (a) — coherente con voz narrativa, no necesita primitive nuevo. **¿OK?**

### Q7. [diferible] Restricción 5 — ¿T1 cumple la "interacción con Pozo Astral enemigo"?

La restricción dice: _"al menos 1 de las 8 cartas con interacción explícita con Pozo Astral enemigo o Disolución como castigo"_.

T1 (Espejo Disolutorio) hace: nave enemiga **en juego** → exiliada a **Disolución directa**. NO toca el Pozo Astral enemigo (las cartas que ya están allí). Exilia desde `in_play`.

**¿Esto cumple la restricción?**

- Mi lectura: SÍ — la nave enemiga termina en Disolución (la zona de exile permanente) en lugar del Pozo Astral. Cumple "Disolución como castigo". Bypassa el ciclo Refluencia preventivamente.
- Lectura alternativa más estricta: la restricción quiere que la carta interactúe con cartas que YA están en Pozo Astral enemigo (ej. exilia top-2 del Pozo Astral del rival). Eso requiere primitive nuevo `exile_from_zone { player, zone, count }`.

Si querés la versión estricta, T1 cambia a:

- **T1 alt. Mirada del Hangar** (cost 3, rare, kw `ignicion`): _Ignición: exiliá hasta 2 cartas del Pozo Astral enemigo._
- Effect tree: `sequence(sacrifice, exile_from_zone { player: 'opponent', zone: 'graveyard', count: 2 })`
- Necesita primitive nuevo.

**Mi recomendación:** stick con T1 actual (in_play exile) — cubre el caso del 80% (Refluencia se previene). Si querés la versión Pozo Astral attack, abrimos primitive nuevo. **¿Cuál interpretación?**

### Q8. [diferible] Distribución de costos heavy en cost 3

4 de 8 cartas cuestan 3 (E3, R2, T1, T2). 0 cartas a cost 2. Si querés más spread:

**Ajustes propuestos:**

- (a) Bajar T2 a cost 2 con `costLte: 2` (más restrictivo el target). Cubre el slot cost 2.
- (b) Subir R1 a cost 5 (Hangar Eterno como engine premium late game). Reorganiza late-game.
- (c) Aceptar la concentración — el "cost 3 cluster" representa el corazón del archetype (4-7 mana de juego óptimo).

**Mi recomendación:** (c). **¿OK?**

### Q9. [diferible] Naming "Tonatzin" en T2

`tonantzin` es deidad mariana sincretica viva en México (Virgen de Guadalupe). El blocklist actual NO la incluye. La naming convention agent doc dice explícitamente que "Tonatzin" es **ficcional fonéticamente cercano** y OK como invención.

**Opciones:**

- (a) Status quo: T2 = "Filo del Tonatzin", agregar `tonantzin` al blocklist como término defensive.
- (b) Renombrar T2 a algo sin ambigüedad (ej. "Filo del Quinto Sol", "Filo Tlapetl", "Cuchilla del Hangar").
- (c) Mantener "Tonatzin" sin tocar blocklist — confiar en agent doc.

**Mi recomendación:** (a) — defensive blocklist + mantener nombre endorsado por convention. **¿OK?**

### Q10. [diferible] Inconsistencia keyword `ignicion` en pool existente

`Brasa Tlani` (cost 1, ship con activated/sacrificeShip) NO tiene keyword `ignicion`. `Ofrenda del Xocotzin` (cost 2, tech con on_play/sacrifice) NO tiene keyword `ignicion` tampoco.

Ambas son mecánicamente Ignición. La inconsistencia es legacy.

**Opciones:**

- (a) Dejar pool existente intacto (respetando "No cambios mecánicos a las 10 cartas Tezhal existentes"). Las nuevas cartas siguen la regla decidida en Q2. Inconsistencia documentada pero tolerada.
- (b) Cleanup commit separado post-canary que retag las 2 cartas. Pequeño cambio de schema (validator/renderer).

**Mi recomendación:** (b) — un commit `chore(cards): retag legacy Tezhal con keyword ignicion` después de cerrar este canary. **¿OK?**

### Q11. [bloqueante de proceso] Orden de commits

Si confirmás Q1 (DSL extension `costLte` en search.filter):

1. Commit 1 (DSL): `feat(dsl): primitives v3.0.2 — extend search.filter with cost ranges`
2. Commit 2 (events): 4 JSONs + validator pass
3. Commit 3 (relics): 2 JSONs (R1 depende del DSL extension; R2 no necesita extension)
4. Commit 4 (tech): 2 JSONs

Si rechazás Q1, R1 cambia (ver alternativas Q1) y los commits arrancan directo desde events.

**Mi recomendación:** orden propuesto, idéntico patrón al Würon canary. **¿OK?**

---

## Reporte breve (≤300 palabras)

**Producido:** 8 cartas Tezhal nuevas (4 events + 2 relics + 2 tech). Distribución de costo: 1, 3, 3, 3, 3, 4, 4, 5 — cumple `≥1 cost 1-2` y `≥1 cost 4-5`. Distribución de rareza 4c/4r — mismo ratio que Würon canary, justificación idéntica.

**Archetype emergente — "Kamikaze-tempo":** Ortogonal a Würon Külen-stacking por construcción. Las naves Tezhal son combustible (no amenazas duraderas), Ignición es siempre proactiva (trigger ACTIVO, nunca death-rattle). Mano ideal: vaciar board turno 4-5 buscando lethal con E1 (face-rush) + E3/E4 (swing buffs) o T1/T2 (removal premium). Engine: R1 (Hangar Eterno auto-spawn de carne) + R2 (Brasero refund económico) sostienen el loop.

**Cumplimiento de las 5 restricciones inviolables:** todas verificadas. Trigger activo (1) ✓ — todos `on_play`. Balance Ignición (2) ✓ — efectos valuados en cost+1-2 mana. Target sacrificio Tezhal aliada (3) ✓ — explícito en cada `sacrifice.target.filter`. Generadores de carne (4) ✓ — R1 cubre el rol (depende de Q1 DSL extension). Counter wheel Zaqe (5) ✓ — T1 (Espejo Disolutorio) exilia in-play directo a Disolución, bypassa Pozo Astral.

**Bloqueantes reales:** Q1 (DSL extension `search.filter` con `costLte`), Q2 (coherencia keyword `ignicion` en eventos), Q3 (sacrificio emite `ship_destroyed`?). Si los tres se aprueban, applies inmediatamente con commits ordenados Würon-style.

**Preguntas abiertas:** 11 listadas; 3 bloqueantes (Q1, Q2, Q3), 7 diferibles (Q4-Q10), 1 de proceso (Q11).

**Riesgo principal:** R1 + R2 + Iniciado Xocotzin combo es muy fuerte (auto-spawn → suicidar → +1 energía → repetir cada turno). En playtest puede convertir el archetype en un engine ininterrumpido si el rival no tiene removal de relics. Anotar para playtest sintético cuando el engine kernel esté listo.
