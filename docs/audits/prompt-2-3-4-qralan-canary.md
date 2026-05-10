# Canary Q'ralan — Eventos, Reliquias y Tecnologías (Prompts 2/3/4)

**Fecha:** 2026-05-10
**Alcance:** **canary deploy sólo Q'ralan**. 4 eventos nuevos + 2 reliquias adicionales + 2 tecnologías adicionales = **8 cartas**. Mismo patrón que los canarys Würon (`prompt-2-3-4-wuron-canary.md`) y Tezhal (`prompt-2-3-4-tezhal-canary.md`). Zaqe se generará después si este output cierra bien.

> **Modo proposal — NO se han escrito JSONs.** Después de tu OK voy con commits separados (mismo orden que canarys anteriores):
>
> - `feat(events): qralan eventos set base v3.0`
> - `feat(relics): qralan reliquias set base v3.0`
> - `feat(tech): qralan tech set base v3.0`
> - `test(cards-index): update counts post-Qralan canary`
>
> **No se requieren extensiones DSL.** Las 8 cartas se expresan con primitives v3.0.2 existentes (incluyendo `search.filter.costLte` agregado en el canary Tezhal — reusable acá).

---

## Contexto del archetype

**Archetype objetivo**: escalado por presencia + control posicional. Q'ralan construye tablero progresivamente; cada nave fortalece a las otras vía Formación Solar (Acumulativa). Win condition: dominio de board + presión cuadrática creciente. Mano ideal: desplegar masa entre turno 2-5, presionar desde turno 5+.

**Test de no-recaída** (verificado en cada carta):

- Q'ralan NO sacrifica naves para activar efectos → ningún `sacrifice` op aparece en mis cartas (eso es Tezhal).
- Q'ralan NO escala por daño recibido → ningún trigger `ship_damaged` ni filter `wasDamagedThisTurn` (eso es Würon).
- Q'ralan SÍ escala por presencia de aliados → todos mis count-based effects usan `count_filter { race: 'quralan' }` evaluado al momento de resolución.

### Tabla comparativa 3 razas (en contexto del archetype)

| Eje             | Würon (Külen-stacking)            | Tezhal (Kamikaze-tempo)        | Q'ralan (Formación Solar)           |
| --------------- | --------------------------------- | ------------------------------ | ----------------------------------- |
| Trigger         | Pasivo reactivo (al recibir daño) | Activo voluntario (sacrificio) | Pasivo posicional (presencia)       |
| Tempo           | Retención turnos 7+               | Burst turnos 4-5               | Despliegue progresivo 2-7           |
| Value           | Acumulativo por daño              | Single-turn explosivo          | Cuadrático por masa                 |
| Mano ideal      | 3-4 unidades vivas largo plazo    | Vaciar board buscando lethal   | 4-5 unidades vivas turno 5+         |
| Recurso central | HP propio (sobrevivir golpes)     | Cartas-combustible 1c          | Slots de board (presencia múltiple) |
| Win condition   | Buff stack permanente             | Swing decisivo turno corto     | Dominio progresivo de tablero       |

Ortogonalidad obligatoria: si el archetype emergente Q'ralan se parece a Würon (acumulación) o Tezhal (burst), el diseño falló. Mi diseño se sostiene en estas señales:

- **Cuándo se evalúa el efecto**: en mis cartas, los efectos cuadráticos (E1, R1) se evalúan **al jugar/al inicio de turno** — no al recibir daño (Würon) ni al sacrificar (Tezhal).
- **Recurso clave**: los buffs Q'ralan dependen del número de naves vivas EN JUEGO simultáneamente, no de un trigger discreto. Es estructural, no episódico.
- **Curva**: el peak de Q'ralan llega progresivamente cuando llegás a 4-5 naves (turnos 5-7), no en un turno discreto de explosión.

### Cumplimiento de las 5 restricciones inviolables

| #   | Restricción                                                      | Cómo se cumple                                                                                                                                                                                                                                   |
| --- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Diversificación FS: ≥30-40% (≥3/8) sin keyword `formacion_solar` | 8/8 cartas sin keyword `formacion_solar` — events/relics/tech NO portan la keyword (es ship-only por reminder). **Espíritu:** 4/8 cards usan mecánicas alternativas (E2 tutoreo, E4 sustain plano, R2 tutoreo, T2 premonition) — no escala mass. |
| 2   | Counter wheel Q'ralan > Tezhal (≥1 carta anti-Tezhal)            | E3 (Eclipse del K'illay): 2 dmg AoE a naves enemigas con kw `ignicion` — mata Iniciado (1c 1/1) y daña Piloto/Espejo-Pirámide/Hangar. T1 (Cristal del Eclipse Pétreo): exilia ignicion (1-2 según masa). 2 cartas counter Tezhal.                |
| 3   | Anti-Würon defensa, NO neutralizadora                            | T2 (Espejo del K'ana): premonition + +1 HP perm AoE Q'ralan — sustain vs Külen-stacking, NO anula activaciones. Premonition rompe orden de resolución pero el Külen sigue gatillando si las naves Würon reciben daño.                            |
| 4   | Masa atacable                                                    | Ninguna carta otorga AoE-resistencia ni "no targeteable". E4 (Coraza) y T2 (Espejo) son sustain temporal/incremental, no inmunidad. Restricción explícita respetada.                                                                             |
| 5   | Cap natural FS acumulada                                         | E1 (Coro del K'illay): cap explícito de +3 fuerza permanente. R1 (Hangar del Sol Pétreo): no tiene cap directo pero limit indirecto (solo 1 buff por turno + condición ≥4 Q'ralan). Cartas existentes Q'ralan se dejan sin retroactive.          |

---

## Resumen ejecutivo

| #   | Nombre                     | Tipo  | Costo | Rareza | Profile balance | Sinergia archetype                 | Idea breve                                                           |
| --- | -------------------------- | ----- | ----- | ------ | --------------- | ---------------------------------- | -------------------------------------------------------------------- |
| E1  | Coro del K'illay           | event | 2     | common | hab_only        | ✅ buff cuadrático con cap         | +X fuerza perm a una Q'ralan según masa (cap +3).                    |
| E2  | Despliegue del Sumaq-Wasi  | event | 4     | rare   | hab_only        | ✅ generación de masa              | Busca 2 naves Q'ralan ≤2c del deck y ponelas en juego.               |
| E3  | Eclipse del K'illay        | event | 3     | rare   | hab_only        | ✅ counter wheel (anti-Tezhal)     | 2 daño a cada nave enemiga con keyword `ignicion`.                   |
| E4  | Coraza del Sumaq-Wasi      | event | 3     | common | hab_only        | ✅ counter-removal (sustain plano) | Prevenir hasta 2 daño a cada nave Q'ralan este turno.                |
| R1  | Hangar del Sol Pétreo      | relic | 5     | rare   | hab_only        | ✅ engine de masa                  | Cada turno propio, si ≥4 Q'ralan: cada Q'ralan +1 fuerza este turno. |
| R2  | Templo del Hangar Sumaq    | relic | 4     | common | hab_only        | ✅ tutoreo lento                   | Cada turno propio, si <4 Q'ralan: busca 1 Q'ralan ≤2c a tu mano.     |
| T1  | Cristal del Eclipse Pétreo | tech  | 2     | common | hab_only        | ✅ counter wheel (anti-Tezhal)     | Exilia 1 nave enemiga con `ignicion` (2 si controlás 3+ Q'ralan).    |
| T2  | Espejo del K'ana           | tech  | 3     | rare   | hab_only        | ✅ defensa anti-Würon              | Cada Q'ralan gana Premonición este turno y +1 HP permanente.         |

**Distribución de costos** (8 cartas): cost 2 (2) · cost 3 (3) · cost 4 (2) · cost 5 (1). Cumple `≥1 cost 1-2` y `≥1 cost 4-5`. Sin concentración (max 3 en cost 3).

**Distribución de rareza**: 4c (E1, E4, R2, T1) + 4r (E2, E3, R1, T2) = **4 común / 4 rare**. Mismo ratio que canarys Würon y Tezhal — pool nuevo aporta soporte mecánico arquetípico.

**Diversificación mecánica** (Restricción 1, espíritu):

- **Mass-scaling nuclear** (FS-style): E1, R1 (2 cartas).
- **Mass-feeding** (genera/preserva masa para que FS escale): E2, E4, R2 (3 cartas).
- **Counter-tech anti-Tezhal** (orthogonal): E3, T1 (2 cartas).
- **Defensa anti-Würon** (orthogonal): T2 (1 carta).

Las 4 cartas no-mass-scaling (E2 tutoreo + E4 sustain + R2 tutoreo + T2 premonición) cumplen el espíritu de la restricción: el archetype tiene mazos "control/tutor" además de "masa pura".

---

## E. Eventos (Prompt 2 — 4 nuevos)

### E1. Coro del K'illay

- **Tipo:** event · **costo:** 2 · **rareza:** common
- **Keywords:** —
- **Habilidad:** _Al jugarse: una nave Q'ralan aliada gana fuerza permanente — +1 si controlás 2-3 Q'ralan, +2 si controlás 4-5, +3 si controlás 6+. Cap +3._
- **Effect tree sugerido:**
  ```json
  {
    "trigger": { "kind": "on_play" },
    "category": "accumulative",
    "effect": {
      "op": "conditional",
      "condition": {
        "kind": "count_filter",
        "filter": { "controller": "self", "race": "quralan" },
        "op": "gte",
        "value": 6
      },
      "thenEffect": {
        "op": "modify_strength",
        "target": {
          "kind": "chosen_ship",
          "filter": { "controller": "self", "race": "quralan" }
        },
        "kind": "delta",
        "value": 3,
        "duration": "permanent"
      },
      "elseEffect": {
        "op": "conditional",
        "condition": {
          "kind": "count_filter",
          "filter": { "controller": "self", "race": "quralan" },
          "op": "gte",
          "value": 4
        },
        "thenEffect": {
          "op": "modify_strength",
          "target": {
            "kind": "chosen_ship",
            "filter": { "controller": "self", "race": "quralan" }
          },
          "kind": "delta",
          "value": 2,
          "duration": "permanent"
        },
        "elseEffect": {
          "op": "conditional",
          "condition": {
            "kind": "count_filter",
            "filter": { "controller": "self", "race": "quralan" },
            "op": "gte",
            "value": 2
          },
          "thenEffect": {
            "op": "modify_strength",
            "target": {
              "kind": "chosen_ship",
              "filter": { "controller": "self", "race": "quralan" }
            },
            "kind": "delta",
            "value": 1,
            "duration": "permanent"
          }
        }
      }
    },
    "description": "Al jugarse: una nave Q'ralan aliada gana fuerza permanente — +1 con 2-3 Q'ralan, +2 con 4-5, +3 con 6+ (cap +3)."
  }
  ```
  > **Nota:** triple `conditional` anidado. `MAX_COMPOSITION_DEPTH = 3` está respetado (el conditional cuenta como 1 nivel de composición; el thenEffect/elseEffect no incrementa profundidad). Ver Q1 si te incomoda la verbosidad.
- **Flavor text:** _"El coro de cristales orbita uno tras otro: cada voz suma a la nave que toma el frente."_ (89 chars)
- **Justificación de diseño:** **buff cuadrático con cap explícito** (Restricción 5). Cost 2 + cap +3 evita escalado descontrolado a +8/+10 que rompería el meta. Sigue siendo competitivo en el peak (4-5 Q'ralan = +2 perm para 2 mana). Off-curve con FS porque agrega valor PERMANENTE single-target a una nave a elección, complementando el FS pasivo continuous.
- **Rol en mazo:** **selector de campeón** en builds masa-pura. La nave elegida (típicamente una FS-stacker como Q'aphaq cost 4 5/7 o Phaqcha cost 5 5/5) absorbe el buff y se vuelve la cabeza del swing. Cap +3 garantiza que el rival pueda manejar el resultado con 1-2 cartas de removal.
- **Diversificación check:** sin keyword `formacion_solar`. Mass-scaling pero con cap.

---

### E2. Despliegue del Sumaq-Wasi

- **Tipo:** event · **costo:** 4 · **rareza:** rare
- **Keywords:** —
- **Habilidad:** _Al jugarse: busca hasta 2 naves Q'ralan de costo ≤ 2 en tu deck y ponelas en juego._
- **Effect tree sugerido:**
  ```json
  {
    "trigger": { "kind": "on_play" },
    "category": "accumulative",
    "effect": {
      "op": "search",
      "owner": "self",
      "zone": "deck",
      "filter": { "race": "quralan", "costLte": 2 },
      "count": 2,
      "destination": "play"
    },
    "description": "Al jugarse: busca hasta 2 naves Q'ralan de costo ≤ 2 en tu deck y ponelas en juego."
  }
  ```
  > **Nota:** usa `search.filter.costLte` agregado en el canary Tezhal (DSL v3.0.2). Engine impl: TODO Phase 1 kernel.
- **Flavor text:** _"El hangar central abre dos compuertas a la vez; el escuadrón pequeño nace ya en órbita."_ (88 chars)
- **Justificación de diseño:** **generador de masa instantáneo**. Cost 4 → 2 cuerpos pequeños en juego. Las opciones del deck Q'ralan ≤2c son Centinela Pétreo (1c rare 1/1, kw FS), Vigía del Sumaq-suyu (1c common 1/3 bastión), Q'illay del Hangar Solar (2c common 3/3 kw FS). Promedio = ~3 mana de stats por carta = 6 mana de stats por 4 mana de evento. Tempo positivo. Acelera la curva del archetype (de turno 5+ baja a turno 4+ con E2 disponible).
- **Rol en mazo:** **swing de despliegue**. Mejor jugarla cuando tu board está vacío y tenés 2-3 cartas Q'ralan ≤2c todavía en deck. La activación trae masa que sinergiza con E1 (siguiente turno), R1 (engine de masa) y T'awa-wasi Coordinador (existing rare 4c que da +1 AoE con 3+ Q'ralan).
- **Diversificación check:** sin keyword `formacion_solar`. Mecánica alt: búsqueda de mazo / tutoreo masivo.

---

### E3. Eclipse del K'illay

- **Tipo:** event · **costo:** 3 · **rareza:** rare
- **Keywords:** —
- **Habilidad:** _Al jugarse: hace 2 daño a cada nave enemiga que tenga la keyword `ignicion`._
- **Effect tree sugerido:**
  ```json
  {
    "trigger": { "kind": "on_play" },
    "category": "accumulative",
    "effect": {
      "op": "for_each",
      "filter": { "controller": "opponent", "keywordsAny": ["ignicion"] },
      "effect": {
        "op": "damage",
        "target": { "kind": "self" },
        "amount": 2
      }
    },
    "description": "Al jugarse: hace 2 daño a cada nave enemiga que tenga la keyword ignición."
  }
  ```
- **Flavor text:** _"Cuando el K'illay eclipsa al Sol Quinto, las brasas Tezhal se apagan antes de cantar."_ (84 chars)
- **Justificación de diseño:** **counter wheel mecánico anti-Tezhal**. Vs Tezhal: mata Iniciado Xocotzin (1c 1/1) y Brasa Tlani (1c 2/1) automáticamente; daña Piloto de Obsidiana (2c 2/2 → 0/2 = sobrevive con HP=0 = muere), Espejo-Pirámide Tzactli (3c 3/3 → 3/1), Navío Tlanixtli (4c 4/4 → 4/2), Xolot legendaria (6c 6/6 → 6/4). El payoff Tezhal "spawn → sacrificar → ganar tempo" se rompe porque la munición muere antes de la activación. Vs otras razas: cero impacto (no existen cartas con kw `ignicion` fuera de Tezhal). Sideboard tech. Categoría `accumulative` aunque el efecto es anti-archetype porque escala con cuántas naves enemigas matchean — coherente con la firma posicional.
- **Rol en mazo:** **anti-Tezhal explícito**. En matchup Tezhal: prioritario en turnos 3-4 (cuando el oponente desplegó 2-3 ammo cards y todavía no las sacrificó). Se vuelve dead-card vs Würon/Zaqe — pesar al armar mazo: 1-2 copias en main, 2-3 en sideboard.
- **Diversificación check:** sin keyword `formacion_solar`. Mecánica orthogonal (counter-tech).

---

### E4. Coraza del Sumaq-Wasi

- **Tipo:** event · **costo:** 3 · **rareza:** common
- **Keywords:** —
- **Habilidad:** _Al jugarse: previene hasta 2 daño a cada nave Q'ralan aliada este turno._
- **Effect tree sugerido:**
  ```json
  {
    "trigger": { "kind": "on_play" },
    "category": "accumulative",
    "effect": {
      "op": "for_each",
      "filter": { "controller": "self", "race": "quralan" },
      "effect": {
        "op": "prevent_damage",
        "target": { "kind": "self" },
        "amount": 2,
        "duration": "end_of_turn"
      }
    },
    "description": "Al jugarse: previene hasta 2 daño a cada nave Q'ralan aliada este turno."
  }
  ```
- **Flavor text:** _"La coraza del Sumaq-Wasi se extiende sobre los hangares: ningún disparo encuentra primer hueco."_ (95 chars)
- **Justificación de diseño:** **counter-removal AoE temporal**. Contra Tezhal Salva Ritual (4c rare, 2 dmg AoE): si Coraza se juega en respuesta o el mismo turno, todas las Q'ralan absorben hasta 2 dmg → la AoE Tezhal queda neutralizada. Contra Würon Aullido del Bosque + AoE: similar absorción. NO es inmunidad permanente — es 1 turno. Restricción 4 (masa atacable) respetada. Cost 3 + AoE prevent 2 = ~6-8 mana de valor con board lleno. Slot común porque depende de tener masa para valer (mano sin board = dead card).
- **Rol en mazo:** **safety net AoE**. En builds masa-pura cobra valor exponencial (4-5 Q'ralan = 8-10 prevención). Ideal jugar reactivo en turno donde anticipás AoE enemiga (turno 4+ vs Tezhal por Salva Ritual, turno 5+ vs Würon por Despertar de la Raíz).
- **Diversificación check:** sin keyword `formacion_solar`. Mecánica alt: sustain plano (no escalado per-ship — siempre 2 dmg prevented).

---

## R. Reliquias adicionales (Prompt 3 — 2 nuevas; total Q'ralan = 2)

> **Existing:** Templo K'ana-suyu (cost 5, common, "cada Q'ralan gana +1 HP perm por cada otra Q'ralan en juego" — buff cuadrático HP).

### R1. Hangar del Sol Pétreo

- **Tipo:** relic · **costo:** 5 · **rareza:** rare
- **Keywords:** —
- **Habilidad:** _Pasivo. Al inicio de tu turno, si controlás 4 o más naves Q'ralan, cada nave Q'ralan aliada gana +1 fuerza este turno._
- **Effect tree sugerido:**
  ```json
  {
    "trigger": { "kind": "on_event", "event": "turn_start", "filter": { "controller": "self" } },
    "category": "accumulative",
    "effect": {
      "op": "conditional",
      "condition": {
        "kind": "count_filter",
        "filter": { "controller": "self", "race": "quralan" },
        "op": "gte",
        "value": 4
      },
      "thenEffect": {
        "op": "for_each",
        "filter": { "controller": "self", "race": "quralan" },
        "effect": {
          "op": "modify_strength",
          "target": { "kind": "self" },
          "kind": "delta",
          "value": 1,
          "duration": "end_of_turn"
        }
      }
    },
    "description": "Al inicio de tu turno, si controlás 4 o más naves Q'ralan, cada Q'ralan aliada gana +1 fuerza este turno."
  }
  ```
- **Flavor text:** _"El hangar de cuarzo solar canta en cada amanecer; la formación entera se afila a su luz."_ (90 chars)
- **Justificación de diseño:** **engine de masa archetype-defining**. Cost 5 commits un slot a la estrategia masa-pura. Activación condicional (≥4 Q'ralan) garantiza que el relic NO da valor hasta llegar al peak del archetype — alineado con la curva ideal Q'ralan (turno 5-7). +1 fuerza EoT cada turno × 4 ships = 4 mana de buff/turno → amortiza cost 5 en 2 turnos. Rest of game = pure value. Pero el +1 es **temporal** (end_of_turn), no permanent — limit indirecto al stacking infinito (Restricción 5 spirit).
- **Rol en mazo:** **win condition** del archetype masa-pura. Combo natural con E2 (Despliegue) + R2 (Templo del Hangar Sumaq) + cartas existentes (T'awa-wasi Coordinador, Phaqcha del Crisol Estelar). Identifica claramente "estoy jugando Q'ralan masa control".

---

### R2. Templo del Hangar Sumaq

- **Tipo:** relic · **costo:** 4 · **rareza:** common
- **Keywords:** —
- **Habilidad:** _Pasivo. Al inicio de tu turno, si controlás menos de 4 naves Q'ralan, busca una nave Q'ralan de costo ≤ 2 en tu deck y agregala a tu mano._
- **Effect tree sugerido:**
  ```json
  {
    "trigger": { "kind": "on_event", "event": "turn_start", "filter": { "controller": "self" } },
    "category": "accumulative",
    "effect": {
      "op": "conditional",
      "condition": {
        "kind": "count_filter",
        "filter": { "controller": "self", "race": "quralan" },
        "op": "lte",
        "value": 3
      },
      "thenEffect": {
        "op": "search",
        "owner": "self",
        "zone": "deck",
        "filter": { "race": "quralan", "costLte": 2 },
        "count": 1,
        "destination": "hand"
      }
    },
    "description": "Al inicio de tu turno, si controlás menos de 4 naves Q'ralan, busca una nave Q'ralan de costo ≤ 2 en tu deck y agregala a tu mano."
  }
  ```
  > **Nota:** usa `search.filter.costLte` (DSL v3.0.2). Engine impl: TODO Phase 1 kernel.
- **Flavor text:** _"El templo nodriza guarda escuadrones bajo cristal; cuando la formación duele, los entrega."_ (94 chars)
- **Justificación de diseño:** **tutoreo lento conditional**. Cost 4 + condición "<4 Q'ralan" = el relic SOLO ayuda cuando estás atrás (sin masa todavía). Diseño explícito anti-snowball: si ya tenés 4+ Q'ralan, R2 deja de generar valor — no compone con R1 (que requiere ≥4). Esto es CRÍTICO para Restricción 5 (cap natural): R2 deja de ser engine cuando llegás al peak; R1 toma el relevo. La carta tampoco pone en juego (a diferencia de Hangar Eterno Tezhal): solo va a mano. Más lento, más predecible.
- **Rol en mazo:** **catch-up engine** en builds que sufrieron removal temprano. En partidas largas vs Würon: si Külen-stacking + AoE limpiaron tu masa a 1-2 Q'ralan, R2 te repone con 1c-2c bodies a mano. Sinergia directa con E2 (Despliegue 4c → si tutoreaste con R2, tenés más opciones de target).
- **Diversificación check:** sin keyword `formacion_solar`. Mecánica alt: tutoreo / búsqueda de mazo (precedente Resonancia del Sumaq-Cristal).

---

## T. Tecnologías adicionales (Prompt 4 — 2 nuevas; total Q'ralan = 2)

> **Existing:** Resonancia del Sumaq-Cristal (cost 3, rare, "busca 1 Q'ralan a tu mano", `intentionalOffCategory`).

### T1. Cristal del Eclipse Pétreo

- **Tipo:** tech · **costo:** 2 · **rareza:** common
- **Keywords:** —
- **Habilidad:** _Al jugarse: exilia una nave enemiga con la keyword `ignicion`. Si controlás 3 o más naves Q'ralan, exilia hasta 2._
- **Effect tree sugerido:**
  ```json
  {
    "trigger": { "kind": "on_play" },
    "category": "accumulative",
    "effect": {
      "op": "sequence",
      "effects": [
        {
          "op": "exile",
          "target": {
            "kind": "chosen_ship",
            "filter": { "controller": "opponent", "keywordsAny": ["ignicion"] }
          },
          "fromZone": "in_play"
        },
        {
          "op": "conditional",
          "condition": {
            "kind": "count_filter",
            "filter": { "controller": "self", "race": "quralan" },
            "op": "gte",
            "value": 3
          },
          "thenEffect": {
            "op": "exile",
            "target": {
              "kind": "chosen_ship",
              "filter": { "controller": "opponent", "keywordsAny": ["ignicion"] }
            },
            "fromZone": "in_play"
          }
        }
      ]
    },
    "description": "Al jugarse: exilia una nave enemiga con la keyword ignición. Si controlás 3+ naves Q'ralan, exilia hasta 2."
  }
  ```
- **Flavor text:** _"El cristal pétreo refleja el sol y refleja la brasa: la nave Tezhal ofrendada nunca llega al humo."_ (97 chars)
- **Justificación de diseño:** **counter wheel anti-Tezhal sostenido + escala con masa**. Cost 2 + 1 exile = removal premium vs Tezhal (los exilios bypassean Pozo Astral, no se reciclan). Si controlás 3+ Q'ralan (peak archetype), escala a 2 exiles → counter casi total al deck Tezhal. Sigue siendo dead-card vs Würon/Zaqe (no tienen cartas con `ignicion`), pero menos punitivo que E3 (cost 2 vs 3). Sideboard universal Q'ralan vs Tezhal.
- **Rol en mazo:** **anti-Tezhal complementario a E3**. Mientras E3 hace AoE 2 dmg a TODOS los ignicion (limita board), T1 hace single-target exile permanente (limita el archetype a largo plazo). Combo: turno 3 jugar E3 (mata ammo 1c, daña 2c-3c), turno 4-5 jugar T1 (exilia el Xolot legendario que sobrevivió).
- **Diversificación check:** sin keyword `formacion_solar`. Mecánica orthogonal (counter-tech).

---

### T2. Espejo del K'ana

- **Tipo:** tech · **costo:** 3 · **rareza:** rare
- **Keywords:** —
- **Habilidad:** _Al jugarse: cada nave Q'ralan aliada gana Premonición este turno y +1 HP permanente._
- **Effect tree sugerido:**
  ```json
  {
    "trigger": { "kind": "on_play" },
    "category": "accumulative",
    "effect": {
      "op": "for_each",
      "filter": { "controller": "self", "race": "quralan" },
      "effect": {
        "op": "sequence",
        "effects": [
          {
            "op": "grant_keyword",
            "target": { "kind": "self" },
            "keyword": "premonition",
            "duration": "end_of_turn"
          },
          {
            "op": "modify_hp",
            "target": { "kind": "self" },
            "kind": "delta",
            "value": 1,
            "duration": "permanent"
          }
        ]
      }
    },
    "description": "Al jugarse: cada nave Q'ralan aliada gana Premonición este turno y +1 HP permanente."
  }
  ```
  > **Nota:** Premonición es soft-cap 1-2 por mazo según GAME-RULES sec 8. T2 lo grants en lote (4-5 ships → 4-5 premonición temporales). El soft-cap se refiere al CONTADOR persistente del mazo, no al granted-temporary; pero conviene confirmar con el validador (Q3).
- **Flavor text:** _"El espejo del K'ana adelanta el latido del sol: las naves anticipan la herida y la dejan pasar."_ (95 chars)
- **Justificación de diseño:** **defensa anti-Würon, NO neutralizadora**. Premonición rompe el orden de resolución (Q'ralan resuelve antes que Würon reactive) → permite que Q'ralan pegue PRIMERO antes que Külen amplifique. Külen sigue funcionando, pero la nave Würon recibe el daño Q'ralan antes de gatillar Külen — el resultado neto: Würon stacking sigue posible pero el tempo de ramping queda 1 turno atrás. +1 HP permanente AoE sustain vs Aullido + Despertar (AoE 1 dmg / +1 str). Restricción 3 respetada: Külen NO es neutralizado, solo retrasado en tempo.
- **Rol en mazo:** **defensa estructural anti-Külen**. En matchup Würon: jugar T2 turno 3-4 antes de que Külen amplifique. Sinergia con E4 (Coraza prevent 2 dmg + T2 +1 HP perm = 3 hp absorbidos por nave en 1 vuelta).
- **Diversificación check:** sin keyword `formacion_solar`. Mecánica alt: premonición (soft-cap) + sustain plano.

---

## Decisiones que requieren OK del usuario

> Listadas en orden de bloqueo. **[bloqueante]** = resolver antes de aplicar JSONs. **[diferible]** = resolver durante implementación.

### Q1. [diferible] Verbosidad de E1 (triple conditional anidado)

El effect tree de Coro del K'illay tiene 3 niveles de `conditional` para implementar el cap +3 con thresholds (≥6 → +3, ≥4 → +2, ≥2 → +1). Profundidad 3 está dentro de `MAX_COMPOSITION_DEPTH = 3`.

**Alternativas si el árbol incomoda:**

- (a) **Status quo**: el árbol es correcto y expresivo, aunque verboso. El renderer puede colapsar a una sola descripción legible. Mi recomendación.
- (b) **Primitive nuevo `modify_strength_by_count`**: parametriza delta por count_filter. Menos verboso pero menos general (sólo cubre este patrón).
- (c) **Bajar el cap a un threshold único** ("+2 si controlás 4+ Q'ralan, sino +1"). Pierde gradación pero árbol mucho más simple.

**Mi recomendación:** (a). El árbol verboso es legible y no requiere DSL extension. **¿OK?**

### Q2. [diferible] Confirmación de la mecánica firma — pre-respuesta del PDF

El handoff PDF anticipó la pregunta sobre Formación Solar. Mi diseño asume la respuesta sugerida:

> Formación Solar cuenta a TODAS las naves Q'ralan en juego (criterio raza), no solo las que tienen la keyword `formacion_solar`.

Todos los `count_filter` en mis cartas usan `filter: { controller: 'self', race: 'quralan' }`. Esto significa que mis cartas no-FS (todas las 8 nuevas) cuentan al pool de "masa" para activar las cartas existentes con FS keyword (Centinela Pétreo, Q'illay del Hangar Solar, Q'aphaq, Phaqcha, Sumaq-untay, T'awa-wasi, Escolta T'awa-pampa).

**Confirmar:** ¿esta interpretación queda canonizada en GAME-RULES sec 7.2 también? Si sí, propongo agregar una nota aclaratoria al reminder de FS:

> **Formación Solar** _(esta nave gana +1 fuerza por cada otra nave Q'ralan que controles. La condición es "raza Q'ralan", independiente de si las otras naves portan la keyword.)_

**¿OK con la nota aclaratoria, o lo dejamos implícito como ya estaba?**

### Q3. [diferible] Premonición granted en bloque (T2 Espejo del K'ana)

Premonition es soft-cap 1-2 por mazo (GAME-RULES sec 8). T2 grants premonition AoE temporario a 4-5 ships en una activación.

**Pregunta:** ¿el soft-cap se aplica al CONTADOR de cartas en el mazo (1-2 cartas que llevan la keyword en lista impresa) o también al RUNTIME (cuántas naves tienen premonition activa al mismo tiempo en el board)?

- (a) Si soft-cap es solo de mazo (lista): T2 está OK, granting temporario no rompe el cap.
- (b) Si soft-cap es runtime: T2 puede triggear info-warning del validator (4-5 ships con premonition simultáneo > 1-2 cap). En ese caso, marcar T2 con `intentionalOffCategory: true` o reducir la granularity (premonition solo a 1 ship, no AoE).

**Mi recomendación:** (a) — el cap es deck-construction, no runtime. T2 sigue como diseñado. Validator emite info, no bloqueante.

### Q4. [diferible] Cap natural FS retroactivo

Las cartas existentes Q'ralan con FS keyword no tienen cap (Phaqcha continuous, Templo K'ana-suyu continuous, plus 5+ ships con FS pasivo "+1 str por cada otra Q'ralan").

**Restricción 5 dice "no aplicar retroactivamente, solo flag para playtest".** Mi diseño cumple:

- E1 introduce cap explícito en cartas nuevas (cap +3).
- R1 introduce limit indirecto (1 buff por turno, condicional ≥4).
- Cartas existentes se quedan sin cap.

**Para el playtest doc futuro:** anotar que con 8+ Q'ralan en juego, las FS-stackers existentes pueden llegar a +7 fuerza adicional × multi-ship → potencial ruptura de meta. Si llegás a esa zona en simulación, capear retroactivamente es la opción más limpia.

**¿OK con el flag para playtest sin tocar las viejas en este canary?**

### Q5. [diferible] Categoría del E3 (Eclipse del K'illay)

E3 es un AoE damage condicionado a keyword enemiga. Está taggeado `category: accumulative` porque escala con número de naves matcheadas. Pero el efecto MISMO no escala con tu masa Q'ralan — escala con el board ENEMIGO.

**Lectura alt:** ¿podría ser `category: initiative`? El daño se hace en TU turno cuando elegís jugarla; es una decisión activa.

**Mi recomendación:** `accumulative` con `intentionalOffCategory: true` no aplica (la keyword `formacion_solar` no está acá). Dejar `accumulative` puro porque la firma Q'ralan es accumulative y E3 es Q'ralan. El rendir del orden de resolución se decide por la firma, no por el efecto interno.

**¿OK con `accumulative`?**

### Q6. [diferible] Concentración de costos cost 3

3 cartas a cost 3 (E3, E4, T2). Si querés más spread, propongo bajar T2 a cost 2 (mismo precio que T1) o subir T2 a cost 4 (ajustando la prevención a +2 HP perm en lugar de +1).

**Mi recomendación:** dejar como está. Cost 3 es el "core mid-game" del archetype Q'ralan (despliegue medio, control posicional). Cost 4 ya está cubierto por E2 y R2. Cost 2 ya está por E1 y T1.

### Q7. [bloqueante de proceso] Orden de commits y ALL_CARDS counts

8 cartas nuevas Q'ralan → ALL_CARDS pasa de 58 a 66. Q'ralan pasa de 11 a 19.

Plan de commits:

1. `feat(events): qralan eventos set base v3.0` (E1, E2, E3, E4)
2. `feat(relics): qralan reliquias set base v3.0` (R1, R2)
3. `feat(tech): qralan tech set base v3.0` (T1, T2)
4. `test(cards-index): update counts post-Qralan canary` (al final, ALL_CARDS=66, quralan=19)

NO se requiere `feat(dsl)` commit porque no hay primitives nuevos. **¿OK con el orden?**

---

## Reporte breve (≤300 palabras)

**Producido:** 8 cartas Q'ralan nuevas (4 events + 2 relics + 2 tech). Distribución de costo: 2, 2, 3, 3, 3, 4, 4, 5 — cumple `≥1 cost 1-2` y `≥1 cost 4-5`, sin concentración (max 3 en cost 3). Distribución de rareza 4c/4r — mismo ratio que canarys Würon y Tezhal.

**Archetype emergente — "Formación Solar masa-control"**: ortogonal a Würon Külen-stacking Y a Tezhal Kamikaze-tempo por construcción. Trigger pasivo posicional (presencia), tempo despliegue progresivo 2-7, value cuadrático por masa, mano ideal 4-5 unidades vivas turno 5+. Mass-scaling nuclear en E1 + R1 (cap explícito y limit indirecto cumpliendo Restricción 5). Mass-feeding en E2 + E4 + R2 (sustain y tutoreo). Counter wheel anti-Tezhal en E3 + T1 (AoE damage + targeted exile a ignicion). Defensa anti-Würon en T2 (premonition + HP perm) — NO neutralizadora.

**Cumplimiento de las 5 restricciones inviolables:** todas verificadas con tabla explícita arriba. Restricción 1 (diversificación FS): 8/8 sin keyword, 4/8 con mecánicas alt (tutoreo, sustain, premonición). Restricción 2 (counter wheel): E3 + T1 cubren. Restricción 3 (anti-Würon defensa NO neutralización): T2 sustain + premonition, no anula Külen. Restricción 4 (masa atacable): no AoE-resistance, no targeting-immunity, prevent_damage es temporal. Restricción 5 (cap natural): E1 cap +3 explícito, R1 limit por turno + condicional, cartas viejas sin retroactive (flag para playtest).

**Bloqueantes reales:** ninguno. **No DSL extensions.** Las 8 cartas se expresan con primitives v3.0.2 existentes. Q1-Q7 son todas diferibles o de proceso.

**Riesgo principal:** R1 (Hangar del Sol Pétreo) condicionado a ≥4 Q'ralan — si el meta evoluciona hacia decks Q'ralan que llegan rápido a 4 ships (E2 Despliegue + Resonancia del Sumaq-Cristal + R2 tutoreo), el engine se activa turno 5+ → potencial sobre-tempo del archetype. Anotar para playtest con criterios de nerf análogos a los de Würon/Tezhal: win rate vs cualquier raza > 65%, tiempo promedio de cierre < 7 turnos.
