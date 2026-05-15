# SPEC v4.1 — Sexto Sol: Peregrinaje del Héroe

**Status:** approved
**Owner:** Daniel
**Created:** 2026-05-15
**Source:** SPEC-v4_1-peregrinaje.pdf (recibido por Telegram 2026-05-15 18:55 UTC)
**Reemplaza:** SPEC-v4_0-peregrinaje.pdf (todavía no implementado del todo — mañana cerramos pool + simulator; tarde llegó v4.1).
**Tiempo estimado:** 4–8 horas de ejecución
**Objetivo:** dejar el repo listo para playtest manual al día siguiente.

---

## 0. Lectura crítica antes de codear

Esta spec describe un juego donde **el héroe ES el sujeto que acumula, no el jugador**. Cada jugador comanda un héroe que se forja a lo largo de un peregrinaje cósmico por 3 tramos (Nebulosa → Estrellas → Sexto Sol), nutriendo sus 3 atributos (Fuerza, Resguardo, Resonancia) con cada acción. En el clímax, los dos héroes se enfrentan comparando sus 3 atributos finales — gana el héroe superior en 2 de los 3.

Esto **NO es**:

- Un TCG de combate con HP.
- Un juego de acumular un único puntaje global.
- Un juego de dominar planetas para sumar puntos a un contador único.

Esto **SÍ es**:

- Un duelo de lectura mutua (premonición pública + acción oculta, como v4.0).
- Una construcción narrativa del héroe (los 3 atributos crecen con cada turno).
- Un clímax de comparación de atributos al estilo "best of 3" (como ganar 2 de 3 locaciones en Marvel Snap, pero conceptualizado como duelo de héroes).

Si en algún momento estás dudando entre dos interpretaciones, la regla de oro es: **la que refuerza la fantasía del héroe forjándose en el peregrinaje gana**. La otra está mal.

---

## 1. Contexto e historia de versiones

- **v3.0:** TCG clásico con HP del mundo natal, 5 fases de turno, counter-wheel explícito, 4 razas. Playtesteado → se sintió genérico.
- **v4.0:** refactor radical. Acción + Premonición simultánea, 3 planetas en ruta, 1 contador global de fuerza. No llegó a playtest.
- **v4.1 (esta spec):** revisión post-conversación. Mantiene el motor v4.0 (premonición + acción) pero cambia el modelo de progreso: el héroe acumula 3 atributos (uno por categoría de carta), no un solo contador. Agrega elección secreta de planeta por tramo con bonus +1. Victoria por 2 de 3 atributos al cierre del Sexto Sol.

v4.0 nunca se archivó. Esta spec lo reemplaza directo. No hay v5.0.

---

## 2. Resumen ejecutivo del cambio v4.0 → v4.1

| Aspecto                          | v4.0                                                 | v4.1                                                                                                    |
| -------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Sujeto que progresa              | Jugador (contador único)                             | **Héroe** (3 atributos: Fuerza/Resguardo/Resonancia)                                                    |
| Acumulación                      | 1 contador global de "fuerza"                        | **3 atributos del héroe**, uno por categoría de carta                                                   |
| Estructura del tramo             | 1 planeta compartido, mayor fuerza domina            | **3 planetas por tramo** (Atq/Def/Rit), cada jugador elige uno en secreto                               |
| Bonus del planeta elegido        | Bonus de entrada al siguiente tramo (carta, energía) | **+1 al atributo correspondiente** por cada carta de la categoría del planeta elegido, durante el tramo |
| Avance del héroe                 | Al dominar el tramo                                  | Al **ganar el atributo de la categoría del planeta elegido** al cierre del tramo                        |
| Victoria                         | Mayor fuerza acumulada en Sexto Sol                  | **Gana 2 de los 3 atributos del héroe** al cierre del Sexto Sol                                         |
| Eclipse                          | Acción doble + oponente roba 1                       | Igual, pero el doble se aplica al atributo correspondiente                                              |
| Cartas, héroes, estrellas, mazos | (sin implementar aún)                                | (sin cambios respecto a lo definido en v4.0)                                                            |

---

## 3. Lo que se mantiene de v4.0

- Cosmología y lore (`CANON-LORE.md` v2.0).
- 2 razas activas para prototipo: **Tezhal + Würon**. Q'ralan y Zaqe archivadas.
- Energía no acumulable, escalada 1→7.
- Mulligan al inicio (una vez).
- Mazo de 20 cartas, máx 2 copias.
- Mano inicial 4 cartas.
- Una carta jugada por turno.
- 3 categorías de carta y de premonición: **Ataque, Defensa, Ritual**.
- Las 3 cláusulas condicionales por carta (premonicion_propia, premonicion_oponente, premonicion_acierta).
- 5–7 turnos en 3 tramos: Nebulosa (T1-2), Estrellas (T3-4), Sexto Sol (T5-7).
- Eclipse 1 vez por partida durante el Sexto Sol.

---

## 4. Lo que se elimina o archiva (sin cambios vs v4.0)

- HP del mundo natal y "matar al oponente".
- Combate con fuerza vs HP.
- Las 5 fases de turno.
- Counter-wheel explícito.
- Edades I/II/III.
- Bastión, mareo de invocación, Tributo como mecánica firma.
- Q'ralan y Zaqe (prototipo).

Archivar `GAME-RULES.md` v3.0 (si existe) en `/docs/archive/`.

---

## 5. REGLAS v4.1

### 5.1 El héroe y sus 3 atributos

Cada raza tiene un Héroe único. El Héroe es el sujeto principal del juego — el peregrinaje y el clímax se viven a través suyo.

El Héroe tiene **3 atributos**, todos arrancan en 0:

- **Fuerza** — crece con cartas de categoría **Ataque**.
- **Resguardo** — crece con cartas de categoría **Defensa**.
- **Resonancia** — crece con cartas de categoría **Ritual**.

Cada vez que jugás una carta y se revela, su fuerza final (base + condicionales aplicables + bonus de planeta si corresponde) suma al atributo del héroe que corresponde a la categoría de la carta. Una carta Ataque suma a Fuerza, una Defensa a Resguardo, una Ritual a Resonancia.

Los 3 atributos son **visibles en todo momento para ambos jugadores**. No hay nada oculto sobre los stats acumulados del héroe.

El héroe también tiene un **estado de desarrollo**: Neutral (inicio) → Despertado (al ganar el atributo elegido en Nebulosa) → Ascendido (al ganar el atributo elegido en Estrellas). Cada estado activa una habilidad pasiva (ver §5.7).

### 5.2 Estructura de partida (sin cambios)

5–7 turnos divididos en 3 tramos:

- **Nebulosa** — turnos 1-2.
- **Estrellas** — turnos 3-4.
- **Sexto Sol** — turnos 5-7 (máx 3, terminable antes vía Eclipse).

### 5.3 Setup

- Cada jugador elige raza (Tezhal o Würon).
- Mazo de 20 cartas, máx 2 copias.
- Mano inicial 4 cartas. Mulligan una vez.
- Héroe inicia en estado **Neutral** con los 3 atributos en 0.

### 5.4 Inicio de tramo no-final — Elección secreta de planeta

Al inicio de Nebulosa y al inicio de Estrellas (NO al inicio del Sexto Sol):

1. Se presentan **3 planetas** del tramo, cada uno asociado a una categoría: planeta-Ataque, planeta-Defensa, planeta-Ritual.
2. Cada jugador elige **en secreto** uno de los 3 planetas. La elección se mantiene oculta durante todo el tramo.
3. Ambos pueden elegir el mismo planeta o distintos — no hay exclusividad. Cada jugador tiene su propia copia de su planeta-elegido; no se "comparte" el planeta físicamente.
4. La elección **se revela al cierre del tramo**, junto con la resolución de avance de héroe.

**Por qué es secreto:** si la elección fuera pública, mi oponente podría ajustar su premonición ("eligió Ataque → va a jugar Ataques → predigo Ataque"). El secreto preserva el juego de bluff. Notá que la elección no se revela completamente vía las plays — un jugador puede elegir planeta-Ataque y de todas formas jugar cartas Defensa cuando convenga (no suman al bonus, pero sí al atributo Resguardo de su héroe). El secreto es genuino, no pseudo-público.

### 5.5 Bonus del planeta elegido

Durante el tramo, cada vez que el jugador juega una carta de la **misma categoría que su planeta-elegido**, la carta gana **+1 fuerza** (que suma al atributo correspondiente al revelarse).

- Elegí planeta-Ataque → tus cartas Ataque ganan +1 fuerza durante el tramo.
- Elegí planeta-Defensa → tus cartas Defensa ganan +1 fuerza durante el tramo.
- Elegí planeta-Ritual → tus cartas Ritual ganan +1 fuerza durante el tramo.

Las cartas de las otras dos categorías no reciben el bonus, pero igual suman normalmente a sus atributos correspondientes.

**Ejemplo:** elegí planeta-Ataque en Nebulosa. Turno 1 juego carta Ataque fuerza base 3 → suma 4 a Fuerza (3 base + 1 bonus de planeta). Turno 2 juego carta Defensa fuerza base 2 → suma 2 a Resguardo (sin bonus porque no coincide categoría).

### 5.6 Turno (fase compuesta única — sin cambios respecto a v4.0)

1. **Robo:** ambos roban 1 carta.
2. **Energía:** igual al número de turno (T1=1, ..., T7=7). No acumula.
3. **Acción oculta:** cada jugador elige UNA carta de la mano y la coloca boca abajo, pagando su coste. Si no puede pagar nada, declara "Pasa".
4. **Premonición pública:** cada jugador declara qué categoría cree que jugó el oponente este turno (Ataque/Defensa/Ritual). Visible para ambos.
5. **Revelado simultáneo:** ambas cartas se revelan. Se resuelven condicionales.
6. **Acumulación a atributos:** la fuerza final de cada carta (base + condicionales + bonus de planeta si aplica) se suma al atributo correspondiente del héroe del jugador que la jugó.

**Nota importante sobre el orden 3-4:** la acción se elige y coloca boca abajo ANTES de declarar premonición. Esto evita que la premonición influya en qué carta jugás. Vos te comprometiste con una carta, después decís qué creés que hizo el otro. Esto puede ser distinto a lo que dijimos en v4.0 — confirmar si conviene invertir.

### 5.7 Cierre de tramo no-final — Avance del Héroe

Al final del último turno de Nebulosa (T2) y Estrellas (T4):

1. Cada jugador **revela su planeta-elegido** del tramo.
2. Se compara el atributo correspondiente entre ambos jugadores:
   - Si elegiste planeta-Ataque, se compara Fuerza de ambos héroes.
   - Si elegiste planeta-Defensa, se compara Resguardo.
   - Si elegiste planeta-Ritual, se compara Resonancia.
3. El jugador con mayor atributo **gana ese tramo** y su héroe avanza:
   - En Nebulosa: Neutral → **Despertado**, activa habilidad pasiva A.
   - En Estrellas: Despertado → **Ascendido**, activa habilidad pasiva B (la A sigue activa).
4. Si ambos eligieron categorías distintas, cada uno se compara solo contra el atributo correspondiente del otro. Ambos pueden ganar su tramo si ambos superan al otro en su categoría respectiva.
5. Si hay empate exacto en el atributo comparado, **ninguno** avanza ese tramo.
6. Los atributos NO se resetean entre tramos. Siguen acumulando hasta el final.

**Habilidades de héroe (sugerencias, ajustables):**

- **Tezhal — Despertado:** "Cuando jugás una carta Ataque, +1 fuerza adicional."
- **Tezhal — Ascendido:** "Una vez por turno, mirá la primera carta del mazo del oponente."
- **Würon — Despertado:** "Cuando tu premonición acierta la categoría del oponente, +1 fuerza adicional ese turno."
- **Würon — Ascendido:** "Empezás cada turno con 1 energía adicional."

### 5.8 Sexto Sol (turnos 5-7)

- **NO hay elección de planeta** en el Sexto Sol. Es el clímax neutral.
- Los turnos se juegan igual que en tramos anteriores (premonición + acción + revelado).
- Las cartas siguen sumando a los atributos del héroe según su categoría.
- El Eclipse está disponible (ver §5.9).

### 5.9 Eclipse

En cualquier turno del Sexto Sol, antes de declarar premonición, cualquier jugador puede declarar "Invoco el Eclipse". Una sola vez por partida (cualquiera de los dos puede invocarlo).

Efectos:

- La fuerza final de la carta del invocador este turno **cuenta doble** al sumar a su atributo correspondiente.
- El oponente roba **1 carta extra** antes de elegir su acción y declarar premonición.
- La partida **termina al final de este turno**. No se juegan turnos restantes del Sexto Sol.

Si nadie invoca Eclipse, la partida llega al fin del turno 7 normalmente.

### 5.10 Victoria — Duelo de Héroes

Al cierre del Sexto Sol (turno 7 o turno del Eclipse), los dos héroes se enfrentan comparando sus 3 atributos lado a lado:

|            | Tu Héroe | Héroe rival |
| ---------- | -------- | ----------- |
| Fuerza     | X        | Y           |
| Resguardo  | X        | Y           |
| Resonancia | X        | Y           |

**Gana el héroe que supere al rival en al menos 2 de los 3 atributos.**

Empate en un atributo individual: ese atributo se considera "no ganado por ninguno" (no cuenta para ninguno de los dos en el tally de 2 de 3).

**Tiebreakers cuando nadie llega a 2 de 3 (raro):**

1. Mayor suma total de los 3 atributos.
2. Mayor estado de héroe (Ascendido > Despertado > Neutral).
3. Empate técnico.

---

## 6. SIMULACIÓN DE PARTIDA PASO A PASO

Esto es lo que el juego se ve en la mesa. **Si tu implementación contradice este flujo, la implementación está mal.**

### Setup

- Ana (Tezhal) y Bruno (Würon) se sientan a jugar.
- Cada uno arma su mazo de 20 cartas, baraja, roba 4.
- Ana mira su mano: 2 cartas Ataque costo 1-2, 1 Ritual costo 3, 1 Defensa costo 4. Acepta la mano.
- Bruno mira su mano: 3 Defensa, 1 Ritual. Mulligan: vuelve a robar 4. Ahora tiene 2 Defensa, 1 Ataque, 1 Ritual. Acepta.
- Ambos héroes en Neutral. Atributos en 0/0/0.

### Tramo 1 — Nebulosa

**Inicio de Nebulosa:** se presentan 3 planetas — planeta-Ataque, planeta-Defensa, planeta-Ritual.

- Ana piensa: "Mi mano es agresiva, voy con planeta-Ataque". Elige en secreto.
- Bruno piensa: "Tengo dos Defensas baratas, planeta-Defensa". Elige en secreto.
- Ninguno revela.

**Turno 1 (1 energía).**

- Ambos roban 1 carta.
- Acción oculta:
  - Ana coloca boca abajo "Lanza Solar" (Atq, costo 1, fuerza base 2 con condicional "+1 si premonición propia fue Ataque").
  - Bruno coloca boca abajo "Escudo del Bosque" (Def, costo 1, fuerza base 2 con condicional "+1 si premonición acertada").
- Premonición pública:
  - Ana declara: "Predigo Defensa." (sabe que Bruno tiene mano defensiva, intuye).
  - Bruno declara: "Predigo Ataque." (Tezhal suele ser agresivo).
- Revelado:
  - Lanza Solar: Ana NO declaró Ataque como premonición → no aplica el +1 propio. Bruno predijo Ataque y la carta es Ataque → premonición acertada → la cláusula `premonicion_acierta` (si la tuviera) se activaría. En este caso no la tiene. Fuerza final: 2. **Bonus de planeta:** Ana eligió planeta-Ataque y jugó Ataque → +1. Fuerza final con bonus: **3**.
  - Escudo del Bosque: Ana predijo Defensa y la carta es Defensa → premonición acertada → la cláusula "+1 si premonición acertada" se activa. Fuerza final: 3. **Bonus de planeta:** Bruno eligió planeta-Defensa y jugó Defensa → +1. Fuerza final con bonus: **4**.
- Acumulación:
  - Ana: Fuerza 3 (+3), Resguardo 0, Resonancia 0.
  - Bruno: Fuerza 0, Resguardo 4 (+4), Resonancia 0.

**Turno 2 (2 energía).**

- Robo, energía.
- Acción oculta:
  - Ana coloca "Hoguera Ritual" (Rit, costo 2, fuerza base 3).
  - Bruno coloca "Muro de Niebla" (Def, costo 2, fuerza base 3 con condicional "+1 si premonición oponente fue Ataque").
- Premonición:
  - Ana declara: "Predigo Defensa otra vez."
  - Bruno declara: "Predigo Ritual." (lee bien a Ana, intuye que cambió).
- Revelado:
  - Hoguera Ritual: Bruno predijo Ritual y la carta es Ritual → premonición acertada → si tuviera cláusula `premonicion_acierta`, se activaría. No la tiene. Fuerza final: 3. **Sin bonus de planeta** (Ana eligió planeta-Ataque, jugó Ritual). Fuerza final: **3**.
  - Muro de Niebla: Ana declaró Defensa → cláusula "+1 si premonición oponente fue Ataque" no aplica (predijo Def, no Atq). Fuerza final: 3. **Bonus de planeta:** Bruno eligió planeta-Defensa, jugó Defensa → +1. Fuerza final con bonus: **4**.
- Acumulación:
  - Ana: Fuerza 3, Resguardo 0, **Resonancia 3** (+3).
  - Bruno: Fuerza 0, Resguardo 8 (+4), Resonancia 0.

**Cierre de Nebulosa:**

- Ana revela: eligió planeta-Ataque. Su atributo Fuerza = 3.
- Bruno revela: eligió planeta-Defensa. Su atributo Resguardo = 8.
- Comparación:
  - Ana eligió Atq → se compara Fuerza de ambos. Ana 3 vs Bruno 0 → **Ana gana su tramo**. Héroe de Ana: Neutral → Despertado. Activa "Cuando jugás Ataque, +1 fuerza adicional".
  - Bruno eligió Def → se compara Resguardo. Bruno 8 vs Ana 0 → **Bruno gana su tramo**. Héroe de Bruno: Neutral → Despertado. Activa "Cuando tu premonición acierta, +1 adicional".
- Ambos avanzan a Despertado. Esto es válido — eligieron categorías distintas, ambos ganaron sus respectivas.

### Tramo 2 — Estrellas

**Inicio de Estrellas:** 3 nuevos planetas (Atq/Def/Rit).

- Ana piensa: "Mi Fuerza ya está alta y mi héroe potencia Ataques. Sigo con planeta-Ataque para empujar la ventaja."
- Bruno piensa: "Ana va a ir con Atq otra vez. Si yo elijo planeta-Defensa, mi atributo Resguardo crece pero no compite. Mejor planeta-Ritual para empezar a balancear los 3 atributos para el final."
- Eligen en secreto. Ana: Atq. Bruno: Rit.

**Turnos 3-4 se juegan igual que 1-2.** Imagino lo que pasa:

- Ana sigue jugando Ataques (potenciados por Despertado de Tezhal + bonus de planeta-Atq), su Fuerza sube fuerte.
- Bruno empieza a meter Rituales. Su Resonancia crece. Sigue tirando alguna Defensa para mantener Resguardo.
- Premoniciones se ajustan: Bruno predice Ataque varias veces y acierta (su Despertado le da +1 más por cada acierto).

**Cierre de Estrellas:**

- Ana revela: Atq otra vez. Atributo Fuerza al cierre: digamos 12. Bruno: 2 (no jugó Ataques).
- Bruno revela: Rit. Resonancia al cierre: digamos 9. Ana: 3 (solo la Hoguera del turno 2).
- Ana gana Fuerza, Bruno gana Resonancia. Ambos pasan a Ascendido.

**Atributos al entrar al Sexto Sol:**

- **Ana:** Fuerza 12, Resguardo 0, Resonancia 3.
- **Bruno:** Fuerza 2, Resguardo 8, Resonancia 9.

### Tramo 3 — Sexto Sol

**No hay elección de planeta.** Se juega directo.

**Turnos 5 y 6:** ambos siguen acumulando. Ana intenta meter Defensas o Rituales para tapar sus huecos (Resguardo 0, Resonancia 3). Bruno intenta meter Ataques para mejorar su Fuerza (está en 2).

Después del turno 6, supongamos atributos:

- **Ana:** Fuerza 15, Resguardo 4, Resonancia 5.
- **Bruno:** Fuerza 5, Resguardo 11, Resonancia 13.

Tally actual: Ana gana Fuerza, Bruno gana Resguardo y Resonancia. Si la partida terminara acá, Bruno gana 2-1.

**Turno 7:** Ana sabe que va perdiendo en 2 atributos. Decide invocar Eclipse — su acción cuenta doble, pero Bruno roba 1 extra.

- Bruno roba 1.
- Ana coloca boca abajo carta Defensa fuerza base 5 (busca subir Resguardo).
- Bruno coloca boca abajo carta Ritual fuerza base 4 (busca cerrar Resonancia con holgura).
- Premoniciones cruzadas.
- Revelado y resolución.
- La carta de Ana (×2 por Eclipse) suma 10 a Resguardo → Ana Resguardo 14, supera a Bruno 11. Ana gana Resguardo ahora.
- La carta de Bruno suma 4 a Resonancia → Bruno 17. Sigue ganando.

**Atributos finales:**

- **Ana:** Fuerza 15, Resguardo 14, Resonancia 5.
- **Bruno:** Fuerza 5, Resguardo 11, Resonancia 17.

**Duelo final:**

- Fuerza: Ana 15 > Bruno 5. **Ana gana**.
- Resguardo: Ana 14 > Bruno 11. **Ana gana**.
- Resonancia: Ana 5 < Bruno 17. **Bruno gana**.

Ana gana 2 de 3. **Ana gana la partida.**

Si Ana NO hubiera invocado Eclipse y jugado normal, hubiera perdido por Resguardo. El Eclipse le permitió empujar un atributo justo a tiempo. Decisión real, no formalidad.

---

## 7. DELIVERABLES

### 7.1 Documentos a actualizar o crear

| Archivo                            | Acción                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| `GAME-RULES.md`                    | Reescribir completo a v4.1 según §5. Si existe v3.0, archivar en `/docs/archive/`.              |
| `CANON-LORE.md`                    | Agregar sección "El Peregrinaje del Héroe" reflejando que los héroes son los sujetos del viaje. |
| `.claude/agents/game-simulator.md` | Reescribir completo. Nuevas heurísticas (ver §7.5).                                             |
| `PLAYTEST-NOTES-v4.1.md`           | Crear con las preguntas de §8.                                                                  |
| `OPEN-QUESTIONS-v4.1.md`           | Crear, ver §9.                                                                                  |
| `SIM-RESULTS-v4.1.md`              | Crear tras auto-validación.                                                                     |

### 7.2 Pool de cartas a crear

**30 cartas de Acción** (15 Tezhal, 15 Würon), distribuidas:

Por raza:

- 5 Ataque, 5 Defensa, 5 Ritual.

Por coste (por raza):

- 3 cartas costo 1-2.
- 6 cartas costo 3-4.
- 4 cartas costo 5-6.
- 2 cartas flex.

**Identidad de raza:**

- **Tezhal:** aggro, comprometerse con Ataque, alto riesgo / alta recompensa, mecánicas de descarte para potenciar. Las cartas Ritual Tezhal son raras (rituales de sangre).
- **Würon:** control, premia leer al oponente y jugar Defensa. Mecánicas de anular fuerza enemiga, robo de cartas, contraataques cuando se acierta la premonición.

**4 cartas de Héroe** (2 por raza, una con habilidad Despertado y otra con Ascendido). Pueden representarse en una sola carta-personaje con texto en dos secciones, o como 2 cartas separadas.

**3 cartas de Planeta** por tramo (no-final). Total **6 cartas de planeta** (3 para Nebulosa, 3 para Estrellas). Cada una con: nombre, categoría asociada (Atq/Def/Rit), flavor narrativo. Las cartas de planeta v4.1 NO tienen efectos especiales — solo categoría. Su único efecto mecánico es el +1 de bonus a cartas de la misma categoría durante el tramo.

> **Nota de roadmap (fuera de scope v4.1):** en versiones futuras (v4.2+), las cartas de planeta podrán tener efectos especiales (afectar al héroe, cambiar reglas del tramo, interactuar con el oponente). Reservar espacio en el formato YAML para futuras propiedades, pero no implementarlas ahora.

### 7.3 Formato YAML

**Carta de Acción:**

```yaml
- id: 'TZH-001'
  nombre: 'Lanza Solar'
  raza: 'Tezhal'
  categoria: 'Ataque' # Ataque | Defensa | Ritual
  coste: 2
  fuerza_base: 3
  rareza: 'comun'
  condicionales:
    - tipo: 'premonicion_propia'
      valor: 'Ataque'
      efecto: '+2 fuerza'
    - tipo: 'premonicion_oponente'
      valor: 'Defensa'
      efecto: 'el oponente descarta 1 carta'
  flavor: 'El primer rayo cae antes de que el enemigo nombre su miedo.'
```

**Carta de Planeta (v4.1):**

```yaml
- id: 'PLN-NEB-ATQ'
  nombre: 'Cráter de Itzpapálotl'
  tramo: 'Nebulosa' # Nebulosa | Estrellas
  categoria: 'Ataque'
  flavor: 'Donde el primer cuchillo cósmico cortó la oscuridad.'
  efecto_especial: null # reservado para v4.2+
```

**Carta de Héroe:**

```yaml
- id: 'HERO-TZH'
  nombre: 'Tlapetl, Lanza del Quinto Sol'
  raza: 'Tezhal'
  habilidades:
    despertado:
      condicion: 'Ganar atributo Fuerza al cierre de Nebulosa'
      efecto: 'Cuando jugás una carta Ataque, +1 fuerza adicional.'
    ascendido:
      condicion: 'Ganar atributo Fuerza al cierre de Estrellas (Despertado ya activo)'
      efecto: 'Una vez por turno, mirá la primera carta del mazo del oponente.'
  flavor: '...'
```

### 7.4 Mazos preconstruidos

4 mazos, 20 cartas cada uno, en `/docs/playtest/decks-v4.1/`:

- **Tezhal-Aggro:** Ataques baratos, busca dominar Fuerza desde Nebulosa.
- **Tezhal-Sacrificio:** Mid-game, descarte para potenciar Sexto Sol.
- **Würon-Control:** Defensas y anulación, lectura del oponente.
- **Würon-Ritual:** Resonancia tardía con payoff grande.

### 7.5 Simulator agent

`game-simulator.md` debe soportar:

- **Elección de planeta:** la IA mira su mano. Calcula qué categoría puede jugar más eficiente (más cartas de esa categoría con coste pagable en los próximos 2 turnos). Elige planeta de esa categoría con 70% probabilidad; las otras 15% c/u (variabilidad).
- **Premonición:** tracking de frecuencia de categorías que jugó el oponente en últimos 3 turnos. Predice la más frecuente con 70% probabilidad, otras 15% c/u.
- **Elección de acción:** calcula fuerza esperada de cada carta de la mano dado: (a) su propia premonición declarada, (b) la premonición esperada del oponente sobre ella, (c) el bonus de planeta si aplica. Juega la mayor fuerza esperada que se pueda pagar.
- **Eclipse:** invoca si (a) está en Sexto Sol, (b) puede jugar carta de fuerza esperada ≥ 5 (con doble cuenta), (c) está perdiendo 2 o más atributos en el tally actual y necesita revertir.
- **Mulligan:** mulligan si la mano no tiene carta costo ≤ 2 (no puede jugar turno 1).

---

## 8. PLAYTEST-NOTES-v4.1.md

Generar el archivo con estas 10 preguntas para el playtest manual:

1. ¿La premonición se sintió como una decisión real cada turno o se volvió mecánica?
2. ¿La elección secreta de planeta tuvo peso? ¿Cambió tu estrategia en el tramo?
3. ¿Se invocó el Eclipse? ¿En qué turno y por qué? ¿Se sintió bien?
4. ¿Las cartas se sintieron distintas entre sí o algunas se volvieron genéricas?
5. ¿La transformación del héroe (Despertado/Ascendido) importó en el juego?
6. ¿El duelo final de los 3 atributos se sintió épico o anticlimático?
7. ¿Cuánto duró la partida en tiempo real?
8. ¿Hubo turnos muertos sin decisión interesante?
9. ¿Se entendió todo a la primera lectura o hubo que volver a las reglas?
10. ¿Le contarías a alguien sobre este juego después de jugar? ¿Qué le dirías en una frase?

---

## 9. OPEN-QUESTIONS-v4.1.md

Generar el archivo con estas preguntas pendientes que el agente NO debe decidir solo:

### Q1. Orden de acción y premonición en el turno

§5.6 propone: primero acción oculta, después premonición pública. En conversaciones previas se discutió lo opuesto (primero premonición, después acción). ¿Cuál orden conviene?

**Default propuesto:** acción primero, premonición después. Razón: la premonición declarada DESPUÉS de comprometer la carta es más pura como lectura (no estás reaccionando a tu propia carta). Pero el playtest puede invertir esto.

### Q2. ¿Las cartas de planeta v4.1 son seleccionables o aleatorias?

¿Al inicio de cada tramo no-final, los 3 planetas se muestran de un pool fijo (siempre los mismos 3) o se sortean de un pool más grande?

**Default propuesto:** pool fijo de 3 por tramo (mismas cartas siempre). Razón: simplicidad, predictibilidad de aprendizaje.

### Q3. ¿Qué pasa si en Estrellas elijo la misma categoría de planeta que en Nebulosa?

¿Está permitido?

**Default propuesto:** sí, permitido. Es estrategia válida ir all-in en una categoría a costo de descuidar las otras dos.

### Q4. ¿El bonus de planeta (+1) se aplica antes o después de las condicionales de la carta?

¿La fuerza final es (base + condicionales) + bonus, o se aplica el bonus al base antes de condicionales que escalen?

**Default propuesto:** después. Bonus es lo último que se aplica, no se ve afectado por condicionales que digan "duplica la fuerza" o similares.

### Q5. ¿Cuántas cartas máximo en mano?

Si el jugador roba 1 por turno y nunca descarta, en el turno 7 podría tener 10 cartas en mano. ¿Hay límite?

**Default propuesto:** límite de 7 en mano. Si vas a robar y ya tenés 7, no robás. Inspirado en TCGs clásicos.

### Q6. Bonus de planeta y Eclipse

Si invoco Eclipse y la carta es de la categoría de mi planeta-elegido, ¿el bonus +1 se aplica antes o después del ×2 del Eclipse?

**Default propuesto:** primero se suma el +1 a la fuerza, después se duplica todo. Más generoso pero más simple de explicar.

---

## 10. CRITERIOS DE ACEPTACIÓN

- `GAME-RULES.md` v4.1 existe con las 10 subsecciones de §5 sin contradicciones.
- La simulación de partida de §6 está incluida tal cual en `GAME-RULES.md` como sección "Walkthrough completo".
- v4.0 (y v3.0 si existe) archivadas.
- `CANON-LORE.md` tiene sección "El Peregrinaje del Héroe".
- 30 cartas de Acción creadas.
- 4 cartas de Héroe.
- 6 cartas de Planeta (3 por tramo no-final).
- 4 mazos preconstruidos.
- `game-simulator.md` actualizado.
- Simulator corrió 5 partidas auto-validación, documentadas en `SIM-RESULTS-v4.1.md`.
- `PLAYTEST-NOTES-v4.1.md` y `OPEN-QUESTIONS-v4.1.md` creados.

---

## 11. Filosofía recordatoria

Esta spec es **sustracción + un agregado deliberado**. Mantiene la economía mínima de v4.0 y solo agrega:

1. Tres atributos del héroe en lugar de un contador.
2. Elección secreta de planeta por tramo con bonus +1.
3. Victoria por 2 de 3 atributos en lugar de un solo número.

Todo lo demás se preserva. Si en algún momento el agente siente que necesita una regla nueva para resolver un caso, primero pregunta: _¿se puede resolver eliminando algo o reinterpretando?_ Si no hay forma clara, va a `OPEN-QUESTIONS-v4.1.md`, no se inventa la regla.

Las cartas se diferencian por su **perfil de riesgo y categoría**, no por sus números brutos. Una carta fuerza 3 con condicionales fuertes es más interesante que una fuerza 6 sin nada. **No hay cartas vanilla** (fuerza X, sin efecto). Todas tienen al menos 1 condicional.

El **héroe** es el sujeto. El peregrinaje es el viaje. El duelo final es el clímax. Si la implementación pierde de vista esto, está mal hecha.

---

_Spec lista. Cualquier ambigüedad → OPEN-QUESTIONS-v4.1.md, no decidir solo._
