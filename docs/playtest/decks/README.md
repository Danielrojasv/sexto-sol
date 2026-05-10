# Pool de mazos de meta — set base v3.0

Generado por `build_full_meta` runner del `deck-builder` agent (ver `.claude/agents/deck-builder.md`).

**12 mazos legales**, 3 por raza, cubriendo las variantes principales documentadas en cada archetype.

## Inventario

| #   | Raza    | Archetype              | Variant  | Slug                     |
| --- | ------- | ---------------------- | -------- | ------------------------ |
| 1   | Würon   | kulen-stacking         | aggro    | `wuron-aggro-stacker`    |
| 2   | Würon   | kulen-stacking         | midrange | `wuron-midrange-tank`    |
| 3   | Würon   | kulen-stacking         | control  | `wuron-late-stacker`     |
| 4   | Tezhal  | kamikaze-tempo         | aggro    | `tezhal-full-aggro`      |
| 5   | Tezhal  | kamikaze-tempo         | combo    | `tezhal-sacrifice-combo` |
| 6   | Tezhal  | kamikaze-tempo         | hybrid   | `tezhal-hybrid`          |
| 7   | Q'ralan | fs-masa-control        | midrange | `qralan-masa-pura`       |
| 8   | Q'ralan | fs-masa-control        | control  | `qralan-control-tutor`   |
| 9   | Q'ralan | fs-masa-control        | hybrid   | `qralan-hybrid`          |
| 10  | Zaqe    | persistencia-economica | control  | `zaqe-long-game-pure`    |
| 11  | Zaqe    | persistencia-economica | aggro    | `zaqe-recycling-aggro`   |
| 12  | Zaqe    | persistencia-economica | hybrid   | `zaqe-anti-meta-tech`    |

## Validación al generar

Cada YAML pasa los checks del agent (sec 3 Responsabilidad 1):

- ✅ Exactamente 30 cartas (`sum(cards[].count) == 30`).
- ✅ Mono-raza (todas las cartas comparten `card.race`).
- ✅ Máximo 3 copias por carta común/rara.
- ✅ Máximo 1 copia por legendaria.
- ✅ Cada `name` matchea exactamente con un JSON en `src/data/cards/<race>/`.

## Uso futuro

Estos mazos son input directo para:

- **SPEC 3 — `game-simulator` agent**: cargará 2 mazos del pool y simulará partidas con log detallado.
- **SPEC 4 — `balance-analyst` agent**: leerá las `weakness:` declaradas y validará vs el resultado real de simulación masiva (16 matchups × 50 partidas mínimo).

## Re-generar

El generador vive temporalmente en `/tmp/gen-meta-decks.py`. Para regenerar:

```bash
python3 /tmp/gen-meta-decks.py
```

Re-ejecuta validación y reescribe los 12 YAMLs. Si el pool del set base cambia (cartas renombradas, agregadas, removidas), actualizar las definiciones en el script y re-correr.

> **Nota:** este pool es estático — refleja el estado del set base v3.0 al 2026-05-10. Cualquier nerf/buff posterior invalida los YAMLs y requiere re-generación.
