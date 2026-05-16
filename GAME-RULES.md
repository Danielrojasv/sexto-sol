# SEXTO SOL — GAME RULES (v4.2)

> **"Premonición como Lectura"** (Modelo B2). Refactor sobre v4.1 que colapsa los tres
> significados confusos de la premonición en uno solo: la premonición es **una lectura
> sobre la carta del rival**, OCULTA hasta el revelado simultáneo. Si aciertas, su carta
> pierde su `penalizacion_acierto`. Si fallas, su carta gana +1.
>
> v4.1 archivada en `docs/archive/GAME-RULES-v4.1.md`. v4.0/v3.0/v2.0 en `docs/archive/`.

---

## 0. Cambios v4.1 → v4.2

| Aspecto                       | v4.1                                                   | v4.2                                                                                |
| ----------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Premonición                   | Pública antes del revelado, condicional sobre tu carta | **Oculta hasta el revelado**, lectura sobre la carta del rival                      |
| Significado                   | 3 sentidos mezclados (postura / input / lectura)       | **Uno solo**: predicción sobre la categoría del rival                               |
| Acierto                       | Aplica `premonicion_acierta` clauses                   | **Carta del rival pierde `penalizacion_acierto`**                                   |
| Fallo                         | (no aplicaba directamente)                             | **Carta del rival gana +1**                                                         |
| Cláusulas premonicion\_\*     | Existentes (propia/oponente/acierta)                   | **Eliminadas** del schema                                                           |
| Cláusulas estado del juego    | (limitadas)                                            | **Nuevas**: heroe_estado, tramo, atributo_propio, atributo_oponente, eclipse_activo |
| Sub-paso `seleccion_secreta`  | (no existía: premonición y acción en pasos separados)  | **Reemplaza** `accion_pendiente` + `premonicion_pendiente` (paralelo)               |
| Sub-paso `revisar_resolucion` | (no existía)                                           | **Nuevo**: cleanup post-revelado para que el jugador revise el desglose             |
| Mulligan inicial UI           | (oculto)                                               | **Modal previo**: mostrá la mano + opción de cambiar (1 mulligan máximo)            |

Preservado de v4.1: 3 atributos del héroe, 3 tramos, planeta secreto, Eclipse, victoria 2-de-3.

---

## 1. Estructura de partida (igual a v4.1)

5–7 turnos divididos en 3 tramos:

- **Nebulosa** — turnos 1-2.
- **Estrellas** — turnos 3-4.
- **Sexto Sol** — turnos 5-7 (máx 3, terminable antes vía Eclipse).

Al cierre de cada tramo (Neb/Est), el jugador con mayor atributo correspondiente a su
planeta-elegido **avanza su héroe a Despertado** (o Ascendido si ya estaba Despertado).

Al cierre del Sexto Sol, se comparan los 3 atributos finales y **gana quien lleve 2 de 3**.

---

## 2. Flujo del turno

```
mulligan_inicial    → ambos aceptan o cambian mano una vez
eleccion_planeta    → cada jugador elige planeta secreto (solo Neb/Est)
robo                → ambos roban 1 carta
seleccion_secreta   → cada jugador elige (en paralelo, OCULTOS):
                      · una carta de la mano (o "pasar")
                      · una premonición sobre la categoría del rival
                      (también puede invocar Eclipse en Sexto Sol)
revelar             → cartas + premoniciones se revelan simultáneamente
revisar_resolucion  → el jugador revisa el desglose de fuerza y avanza
cierre_tramo        → se decide quién ganó el tramo (cada 2 turnos)
duelo_final         → al cierre del Sexto Sol, se compara 3-vs-3
terminado           → ganador + tally final
```

---

## 3. Cartas (schema v4.2)

```yaml
- id: TZH-001
  nombre: Lanza Solar
  raza: Tezhal
  categoria: Ataque
  coste: 2
  fuerza_base: 3
  penalizacion_acierto: 1 # NEW v4.2: pierdes si rival adivina categoría
  rareza: comun
  condicionales: # AHORA sobre estado del juego (no premoniciones)
    - tipo: heroe_estado
      valor: despertado
      fuerzaDelta: 1
      efectoTexto: 'Héroe despertado: +1 fuerza'
  sideEffects: # Side effects al revelar (incondicionales)
    - tipo: descarte_oponente
      valor: 1
  flavor: El primer rayo cae antes de que el enemigo nombre su miedo.
```

### Tipos válidos v4.2

**CondicionalTipo:**

- `heroe_estado` (valor: HeroEstado)
- `tramo` (valor: Tramo)
- `atributo_propio` (valorAtributo: Categoria, umbral: number)
- `atributo_oponente` (valorAtributo: Categoria, umbral: number)
- `eclipse_activo`

**SideEffectTipo:**

- `descarte_oponente` (valor: cuántas cartas descarta el rival)
- `robo_propio` (valor: cuántas cartas robás)
- `mirar_mazo_oponente` (valor: cuántas cartas top mirás del mazo rival)
- `bloqueo_planeta` (valor: bloqueo de bonus de planeta este turno)

---

## 4. Resolución de carta (orden §4.2 SPEC v4.2)

```
1. Fuerza base
2. Lectura del rival sobre tu carta:
   - acertó: -penalizacion_acierto
   - falló:  +1
3. Bonus planeta (+1 si categoría coincide y NO estamos en Sexto Sol)
4. Condicionales propias sobre estado del juego
5. Habilidades de héroe activas:
   - Tezhal Despertado: +1 a cartas Ataque
   - Würon Despertado: +1 si MI premonición acertó (lectura)
6. Eclipse ×2 (si el owner invocó)
7. Math.max(0, fuerza)
```

Pasar con acierto: si pasaste sin carta pero acertaste la categoría del rival,
le aplicas **-1 fijo** a su fuerza (§4.3 SPEC v4.2).

---

## 5. Balance del pool (sanity check)

| Raza   | fuerza_base prom | penalizacion_acierto prom | Identidad                            |
| ------ | ---------------: | ------------------------: | ------------------------------------ |
| Tezhal |             3.73 |                      1.13 | Aggro: resiste mejor la lectura      |
| Würon  |             2.87 |                      2.00 | Control: más leíble, compensa con SE |

Asserts del sanity check (validar con `pnpm validate:cards`):

- Tezhal fuerza_base > Würon fuerza_base ✓
- Tezhal penalizacion_acierto < Würon penalizacion_acierto ✓

---

## 6. Eclipse (igual a v4.1)

Una vez por partida, durante el Sexto Sol, antes de jugar tu acción:

- **Tu carta cuenta ×2** este turno.
- El oponente roba 1 carta extra.
- La partida termina al cierre de este turno (no se llega al turno 7).

---

## 7. Mulligan (nuevo en UI v4.2)

Al empezar la partida:

- Cada jugador ve su mano de 4 cartas.
- Puede cambiarla **una sola vez** (mulligan = re-baraja la mano completa).
- Cuando acepta, el peregrinaje empieza.

---

## 8. Historial de premoniciones

Tras cada revelado, las premoniciones declaradas + categorías reveladas quedan
visibles públicamente en el `HistorialPanel`. Ayuda a:

- Trackear si el rival está adivinándote (decidir si ocultar tu patrón).
- Predecir su próxima jugada.
- Calcular tu probabilidad de acierto.

El scriptedAI usa este historial directamente (no necesita estado local).
