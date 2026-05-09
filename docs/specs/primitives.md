# Primitives DSL — referencia

> **Status:** vivo (Phase D entregada). Crecerá conforme cartas nuevas demanden primitives nuevas.

Las cartas de Sexto Sol expresan sus efectos como **árboles JSON** de primitives. El interpreter (`src/engine/interpreter.ts`) los ejecuta sobre el GameState. El renderer (`src/data/abilityRenderer.ts`) los traduce a texto en español.

Reciclado del DSL de [myl-game](`/opt/myl-game/scripts/card-algorithms/primitives.yaml`) adaptando zonas y eventos a sexto-sol.

---

## Estructura general de una Ability

```ts
{
  trigger: Trigger,           // cuándo se dispara
  category: MechanicCategory, // dicta orden de resolución (reactive | initiative | accumulative | post_combat)
  premonition?: boolean,      // si true, salta antes de cualquier categoría
  effect: Effect,             // árbol de primitives a ejecutar
  description?: string        // override del renderer si necesitás texto custom
}
```

---

## Triggers

| `kind`       | Descripción                   | Params                            |
| ------------ | ----------------------------- | --------------------------------- |
| `on_play`    | Al entrar en juego            | —                                 |
| `on_destroy` | Al ser destruida              | —                                 |
| `on_event`   | Por evento del bus            | `event`, `filter?`                |
| `continuous` | Mientras esté en juego        | `while?: Condition`               |
| `activated`  | Activación manual del jugador | `window`, `usesPerTurn?`, `cost?` |

### TriggerEvents disponibles

`ship_damaged`, `ship_destroyed`, `card_played`, `planet_activated`, `phase_start`, `phase_end`, `turn_start`, `age_changed`, `homeworld_damaged`, `card_drawn`.

### ActivationWindows

`recoleccion`, `despliegue`, `combate`, `regroup`, `vigilia`, `any_time`.

---

## Effect — primitives (22)

### Movimiento

| Op                | Descripción                                                                  |
| ----------------- | ---------------------------------------------------------------------------- |
| `destroy`         | Elimina la nave del fleet.                                                   |
| `exile`           | Elimina (Phase D: equivalente a destroy; en Phase F separamos zona "exile"). |
| `bounce_to_hand`  | La nave vuelve a la mano de su dueño como Card.                              |
| `shuffle_to_deck` | La nave se mezcla en el mazo del dueño elegido.                              |

### Card flow

| Op        | Descripción                                                                                          |
| --------- | ---------------------------------------------------------------------------------------------------- |
| `draw`    | Robar N cartas. Cap a `deck.length` (no dispara decking_out — eso lo hace el reducer en TURN_START). |
| `discard` | Descartar N de la mano (random o choice).                                                            |
| `mill`    | Mover N cartas del top del mazo al graveyard.                                                        |
| `search`  | Buscar en deck/graveyard cartas que matchen filter, mover a hand.                                    |

### Stats / keywords

| Op                | Descripción                                                                         |
| ----------------- | ----------------------------------------------------------------------------------- |
| `modify_strength` | `delta` o `set` la fuerza de la nave target.                                        |
| `modify_hp`       | `delta` o `set` los hp.                                                             |
| `grant_keyword`   | Agrega keyword (Bastión, Desgarro, Vuelo, etc.).                                    |
| `remove_ability`  | (Phase D stub) Marca la nave como sin habilidades. Implementación completa Phase F. |

### Recursos / combate

| Op                 | Descripción                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| `generate_energy`  | Suma energía al pool del player target.                                                           |
| `sacrifice`        | Quita la nave self del fleet voluntariamente.                                                     |
| `damage`           | Hace N daño a una nave o homeworld target.                                                        |
| `damage_homeworld` | Hace N daño al mundo natal. **Solo aplica en Edad III** (mecánica de daño directo desde la mano). |
| `prevent_damage`   | (Phase D stub) Previene los próximos N daños. Implementación completa Phase F.                    |

### Composición

| Op            | Descripción                                          |
| ------------- | ---------------------------------------------------- |
| `sequence`    | Ejecuta efectos en orden.                            |
| `conditional` | `if cond, then effect, else effect2`.                |
| `for_each`    | Repite el efecto 1 vez por nave que match el filter. |

### Misc

| Op     | Descripción          |
| ------ | -------------------- |
| `noop` | Placeholder / debug. |

---

## Targets

| `kind`        | Descripción                                                            |
| ------------- | ---------------------------------------------------------------------- |
| `self`        | La nave que disparó la ability (requiere `selfShipId` en el contexto). |
| `controller`  | El jugador que controla la fuente.                                     |
| `opponent`    | El otro jugador.                                                       |
| `all_ships`   | Todas las naves que match el filter.                                   |
| `chosen_ship` | Nave elegida por el jugador (vía `chosenTargets` del contexto).        |
| `random_ship` | Nave random que match el filter (usa el rng del state).                |
| `homeworld`   | El mundo natal de `self` u `opponent`.                                 |

### ShipFilter

Composable: `controller`, `race`, `cardType`, `keywordsAny`, `keywordsAll`, `costLte`, `costGte`.

---

## Conditions

| `kind`                  | Descripción                                                             |
| ----------------------- | ----------------------------------------------------------------------- |
| `always`                | Siempre verdadero.                                                      |
| `in_age`                | `state.age === age`.                                                    |
| `in_age_gte`            | `state.age >= age`.                                                     |
| `count_filter`          | Cuenta naves que match filter, compara con `op` (gte/lte/eq) y `value`. |
| `self_has_keyword`      | La nave self tiene `keyword`.                                           |
| `controller_energy_gte` | El controlador tiene ≥ N energía.                                       |

---

## Durations

`permanent` | `end_of_turn` | `end_of_age` | `this_turn` | `next_turn`.

> **Nota:** Phase D no implementa la limpieza de buffs por duración (los `delta` con duration ≠ permanent persisten visualmente). Phase F agrega un sistema de **modificadores temporales** que se purgan al cierre de duration.

---

## Reglas de composición

- **Profundidad máxima**: 3 (composiciones más profundas se ignoran). Cap configurado en `MAX_COMPOSITION_DEPTH`.
- **Orden de ejecución**: dentro de un `sequence`, los sub-efectos se aplican en orden de definición.
- **Eventos emitidos**: cada primitive puede emitir GameEvents (SHIP_DAMAGED, SHIP_DESTROYED, etc.). El interpreter los acumula y los devuelve al caller.

---

## Ejemplos

### Külen (mecánica firma Würon)

```json
{
  "trigger": { "kind": "on_event", "event": "ship_damaged" },
  "category": "reactive",
  "effect": {
    "op": "modify_strength",
    "target": { "kind": "self" },
    "kind": "delta",
    "value": 1,
    "duration": "permanent"
  }
}
```

### Formación Solar (Q'ralan)

```json
{
  "trigger": { "kind": "continuous" },
  "category": "accumulative",
  "effect": {
    "op": "for_each",
    "filter": { "controller": "self", "race": "quralan" },
    "effect": {
      "op": "modify_strength",
      "target": { "kind": "self" },
      "kind": "delta",
      "value": 1,
      "duration": "permanent"
    }
  }
}
```

### Ignición (Tezhal)

```json
{
  "trigger": {
    "kind": "activated",
    "window": "any_time",
    "cost": { "sacrificeShip": { "controller": "self" } }
  },
  "category": "initiative",
  "effect": {
    "op": "modify_strength",
    "target": { "kind": "chosen_ship", "filter": { "controller": "self" } },
    "kind": "delta",
    "value": 2,
    "duration": "end_of_turn"
  }
}
```

### Refluencia (Zaqe)

```json
{
  "trigger": { "kind": "on_destroy" },
  "category": "post_combat",
  "effect": {
    "op": "shuffle_to_deck",
    "target": { "kind": "self" },
    "owner": "self"
  }
}
```

### Daño directo Edad III (Evento)

```json
{
  "trigger": { "kind": "on_play" },
  "category": "initiative",
  "effect": {
    "op": "conditional",
    "condition": { "kind": "in_age_gte", "age": 3 },
    "thenEffect": { "op": "damage_homeworld", "player": "opponent", "amount": 5 }
  }
}
```

(El `conditional` es opcional acá porque `damage_homeworld` ya chequea Edad III internamente; queda más legible si se explicita.)

---

_Vivo. Última actualización: 2026-05-09 (Phase D shipped)._
