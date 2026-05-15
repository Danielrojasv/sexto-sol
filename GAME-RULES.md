# SEXTO SOL — GAME RULES (v4.0)

> **Refactor radical: "Peregrinaje del Sexto Sol".** Reemplaza v3.0. El juego deja de ser un TCG de combate con HP y se convierte en un **duelo de lectura mutua** sobre un peregrinaje de 3 planetas. Inspiración estructural: Marvel Snap (revelado simultáneo, partidas cortas, decisiones densas). Innovación propia: **Acción oculta + Premonición pública**, donde cada carta tiene efectos condicionales según ambas declaraciones.
>
> Capas removidas: HP del mundo natal, atacar/defender con fuerza vs HP, 5 fases de turno, counter-wheel explícito, planetas neutrales con Dones, Edades I/II/III, mareo de invocación, Tributo, sistema de resolución por categorías. Algunas vuelven en set 2; otras quedan archivadas indefinidamente.
>
> v3.0 archivada en `docs/archive/GAME-RULES-v3.0.md`. Pool de cartas v3.0 archivado en `docs/archive/cards-v3.0/` (referencia histórica; el código TS en `src/` sigue cargando esos JSONs hasta el próximo refactor de implementación).

---

## 0. Cambios respecto a v3.0

| Aspecto              | v3.0                                               | v4.0                                                      |
| -------------------- | -------------------------------------------------- | --------------------------------------------------------- |
| Win condition        | HP del mundo natal a 0                             | Mayor fuerza acumulada al cierre del Sexto Sol            |
| Combate              | Atacante/defensor con fuerza vs HP                 | Acción oculta + Premonición pública                       |
| Estructura partida   | Abierta, ~10–15 turnos                             | Fija, 5–7 turnos en 3 tramos                              |
| Fases por turno      | 5 (Recolección/Despliegue/Combate/Regroup/Eclipse) | 1 fase compuesta (premonición → acción oculta → revelado) |
| Razas activas        | 4 (Q'ralan, Würon, Tezhal, Zaqe)                   | 2 para prototipo (Tezhal + Würon)                         |
| Cartas jugadas/turno | Varias según energía                               | 1 por turno                                               |
| Counter-wheel        | Explícito, con tabla por categoría                 | Emergente vía condicionales de carta                      |
| Tamaño de mazo       | 30                                                 | 20                                                        |

> Q'ralan y Zaqe se mantienen en el canon (`CANON-LORE.md` §5) pero no tienen cartas activas en v4.0. Vuelven en set 2 una vez validado el core con Tezhal + Würon.

---

## 1. Estructura de partida

Una partida dura **5 a 7 turnos**, divididos en **3 tramos secuenciales**:

| Tramo         | Turnos             | Notas                                                       |
| ------------- | ------------------ | ----------------------------------------------------------- |
| **Nebulosa**  | 1–2                | Tramo inicial. Mismo planeta para ambos jugadores.          |
| **Estrellas** | 3–4                | Cada jugador eligió su planeta-Estrella al cerrar Nebulosa. |
| **Sexto Sol** | 5–7 (máx 3 turnos) | Tramo final. Terminable antes vía Eclipse.                  |

Ambos jugadores progresan simultáneamente por los mismos tramos. **No hay desfase temporal entre jugadores**: ambos juegan el turno 1 al mismo tiempo, ambos cierran Nebulosa juntos, etc.

---

## 2. Setup

- Cada jugador elige una **raza** (Tezhal o Würon).
- **Mazo:** 20 cartas. Máximo **2 copias** por carta.
- **Mano inicial:** 4 cartas. **Mulligan** permitido una vez: re-baraja la mano completa y roba 4 nuevas.
- Cada jugador empieza con su carta de **Héroe** en zona dedicada (no cuenta en mazo). El héroe inicia en estado **Neutral** (sin habilidades activas).

---

## 3. Turno (fase compuesta única)

Cada turno se ejecuta en esta secuencia, en paralelo entre ambos jugadores:

1. **Robo:** ambos roban 1 carta del mazo.
2. **Energía:** ambos tienen energía igual al número de turno (turno 1 = 1 energía, …, turno 7 = 7 energía). **No acumula** entre turnos.
3. **Declaración de Premonición (PÚBLICA):** cada jugador declara, visible para ambos, qué tipo de Acción cree que jugará el oponente este turno. Las **3 categorías** son:
   - **Ataque**
   - **Defensa**
   - **Ritual**

   Ambas premoniciones quedan a la vista antes de jugar Acción.

4. **Jugada de Acción (OCULTA):** cada jugador elige UNA carta de Acción de su mano y la coloca boca abajo en su zona del planeta actual. **Paga su coste en energía**.
   - Si no puede pagar ninguna carta de la mano, declara **"Pasa"** (no juega Acción este turno, no acumula fuerza).
5. **Revelado simultáneo:** ambas cartas se revelan a la vez. Se resuelven sus efectos condicionales (ver §4).
6. **Acumulación de fuerza:** la fuerza final de cada carta (base + condicionales) se suma a la cuenta del jugador en el planeta actual.

---

## 4. Cartas de Acción — estructura

Cada carta de Acción tiene:

- **Nombre**
- **Raza** (Tezhal o Würon)
- **Coste** (1 a 6 energía)
- **Categoría intrínseca** (Ataque / Defensa / Ritual) — esto define qué premonición la "leería" correctamente. Cuando el oponente predice esta categoría, está acertando el tipo de la carta.
- **Fuerza base** (un número entero)
- **Efectos condicionales**, en hasta 3 cláusulas:

```
SI tu premonición fue [X]: [efecto].
SI la premonición del oponente fue [X]: [efecto].
SI la premonición del oponente acertó la categoría de esta carta: [efecto].
```

No todas las cartas tienen las 3 cláusulas. Las cartas pueden tener 1, 2 o 3 condicionales. **Toda carta debe tener al menos 1 condicional** — no existen cartas "vanilla" (solo fuerza, sin efecto).

### Ejemplo Tezhal

```
Lanza Solar (Tezhal)
Categoría: Ataque · Coste: 2 · Fuerza base: 3
- SI tu premonición fue Ataque: +2 fuerza.
- SI la premonición del oponente fue Defensa: el oponente descarta 1 carta.
```

### Ejemplo Würon

```
Sombra del Külen (Würon)
Categoría: Defensa · Coste: 3 · Fuerza base: 2
- SI tu premonición fue Defensa: +1 fuerza y robás 1 carta.
- SI la premonición del oponente fue Ataque: anula 2 fuerza de la carta enemiga este turno.
```

### 4.1 Resolución de condicionales

Cuando ambas cartas se revelan, se resuelven en paralelo las cláusulas que aplican:

1. Se evalúan todos los condicionales de ambas cartas con la información disponible (premoniciones declaradas, categorías intrínsecas).
2. Los efectos que modifican fuerza (`+N fuerza`, `-N fuerza`, `anula N fuerza`) se aplican antes de la acumulación.
3. Los efectos que tocan el estado del oponente (descarte, robo extra, anulación) se aplican después de calcular fuerza pero antes de cerrar el turno.

Si dos efectos entran en conflicto (ej: ambos intentan anular fuerza al otro al mismo tiempo), se resuelven simultáneamente y ambos surten efecto. Las cláusulas de una misma carta se resuelven en el orden en que están listadas (premonicion_propia → premonicion_oponente → premonicion_acierta).

---

## 5. Cierre de tramo y Dominio del planeta

Al final del **último turno** de cada tramo (turno 2 de Nebulosa, turno 4 de Estrellas):

1. Se compara la fuerza acumulada de ambos jugadores en ese planeta.
2. El que tiene **más fuerza** _domina_ el planeta. **Empate: ninguno domina.**
3. El dominador:
   - **Avanza el estado de su Héroe** (Neutral → Despertado → Ascendido) y activa una habilidad pasiva nueva.
   - **Recibe un bonus de entrada** al siguiente planeta (ver §7).
4. La fuerza acumulada **NO se traspasa** al siguiente planeta. Cada planeta tiene su cuenta independiente.

---

## 6. Transformación del Héroe

Cada raza tiene un Héroe con **3 estados**:

| Estado         | Activación                             | Habilidad                              |
| -------------- | -------------------------------------- | -------------------------------------- |
| **Neutral**    | Inicio de partida                      | Ninguna                                |
| **Despertado** | Dominar el primer planeta (Nebulosa)   | Activa habilidad A                     |
| **Ascendido**  | Dominar el segundo planeta (Estrellas) | Activa habilidad B (la A sigue activa) |

Las habilidades son **pasivas, fijas por raza y por planeta dominado**. Matriz: 2 razas × 2 planetas dominables (Nebulosa, Estrellas) = **4 habilidades de héroe**.

### Habilidades pasivas por raza × planeta

- **Tezhal — domina Nebulosa:** "Cuando jugás una carta de Ataque, +1 fuerza."
- **Tezhal — domina Estrellas:** "Una vez por turno, mirá la primera carta del mazo del oponente."
- **Würon — domina Nebulosa:** "Cuando tu premonición acierta la categoría del oponente, +1 fuerza adicional."
- **Würon — domina Estrellas:** "Empezás cada turno con 1 energía adicional."

---

## 7. Bonus de dominio (entrada al siguiente planeta)

| Planeta dominado | Bonus de entrada al siguiente tramo                |
| ---------------- | -------------------------------------------------- |
| **Nebulosa**     | Robás 1 carta extra al inicio de Estrellas.        |
| **Estrellas**    | Empezás el Sexto Sol con +1 energía en el turno 5. |

Estos bonuses son aditivos respecto a las habilidades pasivas de Héroe del §6.

---

## 8. Elección del planeta Estrella

Después de cerrar Nebulosa (fin del turno 2), ambos jugadores eligen su planeta-Estrella del pool. Ambos pueden elegir el mismo o distintos — **no hay exclusividad**.

**Pool de 3 planetas-Estrella** (cada uno con regla especial que afecta solo al jugador que lo eligió):

- **Estrella del Eco** — las cartas de Ritual cuestan -1 energía (mínimo 1).
- **Estrella Sangrante** — las cartas de Ataque ganan +1 fuerza base.
- **Estrella Silenciosa** — no podés jugar cartas de Defensa. A cambio, robás 1 carta extra al inicio del tramo.

> Scope temporal de las reglas de Estrella: aplican mientras el jugador esté en el tramo de Estrellas (turnos 3–4). En el Sexto Sol vuelven las reglas neutrales. (Confirmar en playtest, ver `OPEN-QUESTIONS-v4.0.md`.)

El **Sexto Sol** no tiene reglas especiales — es **clímax neutral**.

---

## 9. Sexto Sol y Eclipse

Los turnos **5–7** son el Sexto Sol. Se juegan igual que los planetas anteriores (premonición + acción + revelado), acumulando fuerza específicamente en el Sexto Sol.

### 9.1 Eclipse (regla especial)

En cualquier turno del Sexto Sol, al inicio de la declaración de premonición, cualquier jugador puede declarar **"Invoco el Eclipse"**. Efectos:

- La Acción del invocador este turno cuenta **doble** en fuerza acumulada.
- El oponente roba **1 carta extra** antes de declarar su premonición y elegir su Acción.
- La partida termina al final de este turno (no se juegan turnos restantes del Sexto Sol).

Solo se puede invocar Eclipse **una vez por partida** (sea por uno u otro jugador). Si nadie lo invoca, la partida llega al fin del turno 7 normalmente.

---

## 10. Victoria

Al cierre del Sexto Sol (turno 7 o turno del Eclipse), **gana quien acumuló más fuerza en el Sexto Sol**.

Los planetas anteriores dominados **NO suman fuerza al Sexto Sol**. Su valor está en las habilidades de héroe activadas y los bonuses de entrada.

### Tiebreakers en orden

1. Mayor fuerza en el Sexto Sol.
2. Mayor cantidad de planetas previos dominados.
3. **Empate técnico** (ambos pierden la partida — raro, evitable con balance fino).

---

## 11. Filosofía de diseño (resumen vivo)

Este refactor es **sustracción radical, no agregado**. Toda regla pendiente de inclusión debe responder primero: _¿puedo resolverlo eliminando algo en vez de agregar?_ La meta: el juego se aprende en menos de 3 minutos y se juega en 10–15.

Las cartas generan **decisiones por su perfil de riesgo**, no por su valor numérico bruto. Una carta de fuerza base 3 con condicionales fuertes es más interesante que una de fuerza base 6 sin condicionales.

Las facciones se diferencian por **cómo se sienten al jugarse**, no por una tabla de bonus contra otras razas. El counter emerge de las interacciones de condicionales, no de reglas globales.

---

_Versión 4.0 — mayo 2026. "Peregrinaje del Sexto Sol". Reemplaza v3.0._
