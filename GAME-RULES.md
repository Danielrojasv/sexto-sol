# SEXTO SOL — GAME RULES (v4.1)

> **"El Peregrinaje del Héroe".** Reemplaza v4.0. El héroe es el sujeto del juego — el peregrinaje y el clímax se viven a través suyo. Cada jugador comanda un héroe que se forja a lo largo de un peregrinaje cósmico por 3 tramos (Nebulosa → Estrellas → Sexto Sol), nutriendo sus 3 atributos (Fuerza, Resguardo, Resonancia) con cada acción. En el clímax, los dos héroes se enfrentan comparando sus 3 atributos finales — gana el héroe superior en 2 de los 3.
>
> v4.0 archivada en `docs/archive/GAME-RULES-v4.0.md`. v3.0 en `docs/archive/GAME-RULES-v3.0.md`.

---

## 0. Lectura crítica

Esto **NO es**:

- Un TCG de combate con HP.
- Un juego de acumular un único puntaje global.
- Un juego de dominar planetas para sumar puntos a un contador único.

Esto **SÍ es**:

- Un duelo de lectura mutua (premonición pública + acción oculta).
- Una construcción narrativa del héroe (los 3 atributos crecen con cada turno).
- Un clímax de comparación de atributos al estilo "best of 3" — como ganar 2 de 3 locaciones en Marvel Snap, pero conceptualizado como duelo de héroes.

Si en algún momento estás dudando entre dos interpretaciones, la regla de oro es: **la que refuerza la fantasía del héroe forjándose en el peregrinaje gana**. La otra está mal.

---

## 1. Cambios respecto a v4.0

| Aspecto                   | v4.0                                                 | v4.1                                                                                                    |
| ------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Sujeto que progresa       | Jugador (contador único)                             | **Héroe** (3 atributos: Fuerza/Resguardo/Resonancia)                                                    |
| Acumulación               | 1 contador global de "fuerza"                        | **3 atributos del héroe**, uno por categoría de carta                                                   |
| Estructura del tramo      | 1 planeta compartido, mayor fuerza domina            | **3 planetas por tramo** (Atq/Def/Rit), cada jugador elige uno en secreto                               |
| Bonus del planeta elegido | Bonus de entrada al siguiente tramo (carta, energía) | **+1 al atributo correspondiente** por cada carta de la categoría del planeta elegido, durante el tramo |
| Avance del héroe          | Al dominar el tramo                                  | Al **ganar el atributo de la categoría del planeta elegido** al cierre del tramo                        |
| Victoria                  | Mayor fuerza acumulada en Sexto Sol                  | **Gana 2 de los 3 atributos del héroe** al cierre del Sexto Sol                                         |
| Eclipse                   | Acción doble + oponente roba 1                       | Igual, pero el doble se aplica al atributo correspondiente                                              |
| Cartas / héroes / mazos   | (sin implementar aún)                                | Sin cambios respecto al pool definido en v4.0                                                           |
| Estrellas v4.0            | 3 estrellas como modificador de tramo                | Reemplazadas por cartas de Planeta — concepto eliminado                                                 |

---

## 2. Estructura de partida

5–7 turnos divididos en 3 tramos:

- **Nebulosa** — turnos 1-2.
- **Estrellas** — turnos 3-4.
- **Sexto Sol** — turnos 5-7 (máx 3, terminable antes vía Eclipse).

Ambos jugadores progresan simultáneamente por los mismos tramos. Sin desfase temporal.

---

## 3. Setup

- Cada jugador elige raza (Tezhal o Würon).
- Mazo de 20 cartas, máx 2 copias.
- Mano inicial 4 cartas. Mulligan permitido una vez (re-baraja y roba 4 nuevas).
- Héroe inicia en estado **Neutral** con los 3 atributos en 0.

---

## 4. El Héroe y sus 3 atributos

Cada raza tiene un Héroe único. El Héroe es el sujeto principal del juego.

El Héroe tiene **3 atributos**, todos arrancan en 0:

- **Fuerza** — crece con cartas de categoría **Ataque**.
- **Resguardo** — crece con cartas de categoría **Defensa**.
- **Resonancia** — crece con cartas de categoría **Ritual**.

Cada vez que jugás una carta y se revela, su fuerza final (base + condicionales aplicables + bonus de planeta si corresponde) suma al atributo del héroe que corresponde a la categoría de la carta. Una carta Ataque suma a Fuerza, una Defensa a Resguardo, una Ritual a Resonancia.

Los 3 atributos son **visibles en todo momento para ambos jugadores**. No hay nada oculto sobre los stats acumulados del héroe.

El héroe también tiene un **estado de desarrollo**: Neutral (inicio) → Despertado (al ganar el atributo elegido en Nebulosa) → Ascendido (al ganar el atributo elegido en Estrellas). Cada estado activa una habilidad pasiva (ver §7).

---

## 5. Inicio de tramo no-final — Elección secreta de planeta

Al inicio de **Nebulosa** y al inicio de **Estrellas** (NO al inicio del Sexto Sol):

1. Se presentan **3 planetas** del tramo, cada uno asociado a una categoría: planeta-Ataque, planeta-Defensa, planeta-Ritual.
2. Cada jugador elige **en secreto** uno de los 3 planetas. La elección se mantiene oculta durante todo el tramo.
3. Ambos pueden elegir el mismo planeta o distintos — no hay exclusividad. Cada jugador tiene su propia copia de su planeta-elegido; no se "comparte" el planeta físicamente.
4. La elección **se revela al cierre del tramo**, junto con la resolución de avance de héroe.

**Por qué es secreto:** si la elección fuera pública, el oponente podría ajustar su premonición ("eligió Ataque → va a jugar Ataques → predigo Ataque"). El secreto preserva el juego de bluff. Notá que la elección no se revela completamente vía las jugadas — un jugador puede elegir planeta-Ataque y de todas formas jugar cartas Defensa cuando convenga (no suman al bonus, pero sí al atributo Resguardo de su héroe). El secreto es genuino, no pseudo-público.

---

## 6. Bonus del planeta elegido

Durante el tramo, cada vez que el jugador juega una carta de la **misma categoría que su planeta-elegido**, la carta gana **+1 fuerza** (que suma al atributo correspondiente al revelarse).

- Elegí planeta-Ataque → tus cartas Ataque ganan +1 fuerza durante el tramo.
- Elegí planeta-Defensa → tus cartas Defensa ganan +1 fuerza durante el tramo.
- Elegí planeta-Ritual → tus cartas Ritual ganan +1 fuerza durante el tramo.

Las cartas de las otras dos categorías no reciben el bonus, pero igual suman normalmente a sus atributos correspondientes.

**Ejemplo:** elegí planeta-Ataque en Nebulosa. Turno 1 juego carta Ataque fuerza base 3 → suma 4 a Fuerza (3 base + 1 bonus de planeta). Turno 2 juego carta Defensa fuerza base 2 → suma 2 a Resguardo (sin bonus porque no coincide categoría).

---

## 7. Turno (fase compuesta única)

Cada turno se ejecuta en esta secuencia:

1. **Robo:** ambos roban 1 carta.
2. **Energía:** igual al número de turno (T1=1, ..., T7=7). No acumula.
3. **Acción oculta:** cada jugador elige UNA carta de la mano y la coloca boca abajo, pagando su coste. Si no puede pagar nada, declara "Pasa".
4. **Premonición pública:** cada jugador declara qué categoría cree que jugó el oponente este turno (Ataque/Defensa/Ritual). Visible para ambos.
5. **Revelado simultáneo:** ambas cartas se revelan. Se resuelven condicionales.
6. **Acumulación a atributos:** la fuerza final de cada carta (base + condicionales + bonus de planeta si aplica) se suma al atributo correspondiente del héroe del jugador que la jugó.

**Nota importante sobre el orden 3-4:** la acción se elige y coloca boca abajo ANTES de declarar premonición. Esto evita que la premonición influya en qué carta jugás. Vos te comprometiste con una carta, después decís qué creés que hizo el otro. (Open question Q1 — puede invertirse en playtest si se siente mejor.)

### 7.1 Cartas de Acción — estructura

Cada carta de Acción tiene:

- **Nombre**
- **Raza** (Tezhal o Würon)
- **Coste** (1 a 6 energía)
- **Categoría intrínseca** (Ataque / Defensa / Ritual) — define a qué atributo suma su fuerza al revelarse.
- **Fuerza base** (un número entero)
- **Efectos condicionales**, en hasta 3 cláusulas:

```
SI tu premonición fue [X]: [efecto].
SI la premonición del oponente fue [X]: [efecto].
SI la premonición del oponente acertó la categoría de esta carta: [efecto].
```

No todas las cartas tienen las 3 cláusulas. Las cartas pueden tener 1, 2 o 3 condicionales. **Toda carta tiene al menos 1 condicional** — no existen cartas "vanilla".

### 7.2 Resolución de condicionales

Cuando ambas cartas se revelan:

1. Se evalúan todos los condicionales con la información disponible (premoniciones declaradas, categorías intrínsecas).
2. Los efectos que modifican fuerza (`+N`, `-N`, `anula N`) se aplican antes de la suma al atributo.
3. El bonus de planeta (+1 si la categoría de la carta coincide con el planeta-elegido) se aplica como último escalón.
4. Los efectos que tocan estado del oponente (descarte forzado, robo extra, anulación) se aplican después.

Las cláusulas de una misma carta se resuelven en orden listado (premonicion_propia → premonicion_oponente → premonicion_acierta).

---

## 8. Cierre de tramo no-final — Avance del Héroe

Al final del último turno de Nebulosa (T2) y Estrellas (T4):

1. Cada jugador **revela su planeta-elegido** del tramo.
2. Se compara el atributo correspondiente entre ambos jugadores:
   - Si elegiste planeta-Ataque, se compara **Fuerza** de ambos héroes.
   - Si elegiste planeta-Defensa, se compara **Resguardo**.
   - Si elegiste planeta-Ritual, se compara **Resonancia**.
3. El jugador con mayor atributo **gana ese tramo** y su héroe avanza:
   - En Nebulosa: Neutral → **Despertado**, activa habilidad pasiva A.
   - En Estrellas: Despertado → **Ascendido**, activa habilidad pasiva B (la A sigue activa).
4. Si ambos eligieron categorías distintas, cada uno se compara solo contra el atributo correspondiente del otro. **Ambos pueden ganar su tramo** si ambos superan al otro en su categoría respectiva.
5. Si hay empate exacto en el atributo comparado, **ninguno** avanza ese tramo.
6. Los atributos **NO se resetean** entre tramos. Siguen acumulando hasta el final.

### 8.1 Habilidades de héroe (pasivas)

- **Tezhal — Despertado:** "Cuando jugás una carta Ataque, +1 fuerza adicional."
- **Tezhal — Ascendido:** "Una vez por turno, mirá la primera carta del mazo del oponente."
- **Würon — Despertado:** "Cuando tu premonición acierta la categoría del oponente, +1 fuerza adicional ese turno."
- **Würon — Ascendido:** "Empezás cada turno con 1 energía adicional."

---

## 9. Sexto Sol (turnos 5-7)

- **NO hay elección de planeta** en el Sexto Sol. Es el clímax neutral.
- Los turnos se juegan igual que en tramos anteriores (acción + premonición + revelado).
- Las cartas siguen sumando a los atributos del héroe según su categoría.
- El Eclipse está disponible (ver §9.1).

### 9.1 Eclipse

En cualquier turno del Sexto Sol, antes de declarar premonición, cualquier jugador puede declarar **"Invoco el Eclipse"**. Una sola vez por partida (cualquiera de los dos puede invocarlo).

Efectos:

- La fuerza final de la carta del invocador este turno **cuenta doble** al sumar a su atributo correspondiente.
- El oponente roba **1 carta extra** antes de elegir su acción y declarar premonición.
- La partida **termina al final de este turno**. No se juegan turnos restantes del Sexto Sol.

Si nadie invoca Eclipse, la partida llega al fin del turno 7 normalmente.

---

## 10. Victoria — Duelo de Héroes

Al cierre del Sexto Sol (turno 7 o turno del Eclipse), los dos héroes se enfrentan comparando sus 3 atributos lado a lado:

|            | Tu Héroe | Héroe rival |
| ---------- | -------- | ----------- |
| Fuerza     | X        | Y           |
| Resguardo  | X        | Y           |
| Resonancia | X        | Y           |

**Gana el héroe que supere al rival en al menos 2 de los 3 atributos.**

Empate en un atributo individual: ese atributo se considera "no ganado por ninguno" (no cuenta para ninguno de los dos en el tally de 2 de 3).

### 10.1 Tiebreakers cuando nadie llega a 2 de 3 (raro)

1. Mayor suma total de los 3 atributos.
2. Mayor estado de héroe (Ascendido > Despertado > Neutral).
3. Empate técnico.

---

## 11. Walkthrough completo

Esto es lo que el juego se ve en la mesa. **Si tu implementación contradice este flujo, la implementación está mal.**

### Setup

- Ana (Tezhal) y Bruno (Würon) se sientan a jugar.
- Cada uno arma su mazo de 20 cartas, baraja, roba 4.
- Ana mira su mano: 2 cartas Ataque costo 1-2, 1 Ritual costo 3, 1 Defensa costo 4. Acepta.
- Bruno mira su mano: 3 Defensa, 1 Ritual. Mulligan: vuelve a robar 4. Ahora tiene 2 Defensa, 1 Ataque, 1 Ritual. Acepta.
- Ambos héroes en Neutral. Atributos 0/0/0.

### Tramo 1 — Nebulosa

**Inicio:** se presentan 3 planetas — planeta-Ataque, planeta-Defensa, planeta-Ritual.

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
  - **Lanza Solar:** Ana NO declaró Ataque → no aplica +1 propio. Bruno predijo Atq y carta es Atq → premonición acertada (sin clause `premonicion_acierta` en esta carta). Fuerza final: 2. **Bonus de planeta:** Ana eligió planeta-Atq, jugó Atq → +1. **Fuerza final con bonus: 3**.
  - **Escudo del Bosque:** Ana predijo Def y carta es Def → premonición acertada → clause "+1 si premonición acertada" se activa. Fuerza final: 3. **Bonus de planeta:** Bruno eligió planeta-Def, jugó Def → +1. **Fuerza final con bonus: 4**.
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
  - Bruno declara: "Predigo Ritual." (lee bien a Ana).
- Revelado:
  - **Hoguera Ritual:** Bruno predijo Rit, carta es Rit → premonición acertada (sin clause `premonicion_acierta`). Fuerza final: 3. **Sin bonus de planeta** (Ana eligió Atq, jugó Rit). **Fuerza final: 3**.
  - **Muro de Niebla:** Ana declaró Def → clause "+1 si premonición oponente fue Ataque" no aplica (predijo Def, no Atq). Fuerza final: 3. **Bonus de planeta:** Bruno eligió Def, jugó Def → +1. **Fuerza final con bonus: 4**.
- Acumulación:
  - Ana: Fuerza 3, Resguardo 0, **Resonancia 3** (+3).
  - Bruno: Fuerza 0, Resguardo 8 (+4), Resonancia 0.

**Cierre de Nebulosa:**

- Ana revela: eligió planeta-Atq. Su atributo Fuerza = 3.
- Bruno revela: eligió planeta-Def. Su atributo Resguardo = 8.
- Comparación:
  - Ana eligió Atq → se compara Fuerza. Ana 3 vs Bruno 0 → **Ana gana su tramo**. Héroe: Neutral → Despertado. Activa "Cuando jugás Ataque, +1 fuerza adicional".
  - Bruno eligió Def → se compara Resguardo. Bruno 8 vs Ana 0 → **Bruno gana su tramo**. Héroe: Neutral → Despertado. Activa "Cuando tu premonición acierta, +1 adicional".
- Ambos avanzan a Despertado. Válido — eligieron categorías distintas, ambos superaron al otro en su categoría.

### Tramo 2 — Estrellas

**Inicio:** 3 nuevos planetas (Atq/Def/Rit).

- Ana piensa: "Mi Fuerza ya está alta y mi héroe potencia Ataques. Sigo con planeta-Atq."
- Bruno piensa: "Ana va a ir con Atq otra vez. Si elijo planeta-Def, mi Resguardo crece pero no compite. Mejor planeta-Ritual para balancear los 3 atributos."
- Eligen en secreto. Ana: Atq. Bruno: Rit.

**Turnos 3-4 se juegan igual que 1-2.** Razonamiento:

- Ana sigue jugando Ataques (potenciados por Despertado + bonus de planeta-Atq), Fuerza sube fuerte.
- Bruno empieza a meter Rituales. Resonancia crece. Sigue tirando alguna Defensa para mantener Resguardo.
- Premoniciones se ajustan: Bruno predice Ataque varias veces y acierta (su Despertado le da +1 más por cada acierto).

**Cierre de Estrellas:**

- Ana revela: Atq otra vez. Fuerza al cierre: 12. Bruno: 2.
- Bruno revela: Rit. Resonancia al cierre: 9. Ana: 3 (solo Hoguera del T2).
- Ana gana Fuerza, Bruno gana Resonancia. Ambos pasan a Ascendido.

**Atributos al entrar al Sexto Sol:**

- **Ana:** Fuerza 12, Resguardo 0, Resonancia 3.
- **Bruno:** Fuerza 2, Resguardo 8, Resonancia 9.

### Tramo 3 — Sexto Sol

**No hay elección de planeta.** Se juega directo.

**Turnos 5 y 6:** ambos siguen acumulando. Ana intenta meter Defensas o Rituales para tapar sus huecos (Resguardo 0, Resonancia 3). Bruno intenta meter Ataques para mejorar Fuerza (está en 2).

Después del turno 6, atributos:

- **Ana:** Fuerza 15, Resguardo 4, Resonancia 5.
- **Bruno:** Fuerza 5, Resguardo 11, Resonancia 13.

Tally actual: Ana gana Fuerza, Bruno gana Resguardo y Resonancia. Si la partida terminara acá, Bruno gana 2-1.

**Turno 7:** Ana sabe que va perdiendo en 2 atributos. Decide invocar Eclipse — su acción cuenta doble, pero Bruno roba 1 extra.

- Bruno roba 1.
- Ana coloca boca abajo carta Defensa fuerza base 5 (busca subir Resguardo).
- Bruno coloca boca abajo carta Ritual fuerza base 4 (busca cerrar Resonancia con holgura).
- Premoniciones cruzadas.
- Revelado y resolución.
- La carta de Ana (×2 por Eclipse) suma 10 a Resguardo → Ana Resguardo 14, supera a Bruno 11. **Ana gana Resguardo ahora**.
- La carta de Bruno suma 4 a Resonancia → Bruno 17. Sigue ganando.

**Atributos finales:**

- **Ana:** Fuerza 15, Resguardo 14, Resonancia 5.
- **Bruno:** Fuerza 5, Resguardo 11, Resonancia 17.

**Duelo final:**

- Fuerza: Ana 15 > Bruno 5. **Ana gana**.
- Resguardo: Ana 14 > Bruno 11. **Ana gana**.
- Resonancia: Ana 5 < Bruno 17. **Bruno gana**.

Ana gana 2 de 3. **Ana gana la partida.**

Si Ana NO hubiera invocado Eclipse y jugado normal, hubiera perdido por Resguardo. El Eclipse le permitió empujar un atributo justo a tiempo. **Decisión real, no formalidad.**

---

## 12. Filosofía de diseño (recordatorio)

Esta versión es **sustracción + un agregado deliberado**. Mantiene la economía mínima de v4.0 y solo agrega:

1. Tres atributos del héroe en lugar de un contador.
2. Elección secreta de planeta por tramo con bonus +1.
3. Victoria por 2 de 3 atributos en lugar de un solo número.

Todo lo demás se preserva. Si en algún momento aparece la tentación de agregar una regla nueva, primero preguntar: _¿se puede resolver eliminando algo o reinterpretando?_

Las cartas se diferencian por su **perfil de riesgo y categoría**, no por sus números brutos. Una carta fuerza 3 con condicionales fuertes es más interesante que una fuerza 6 sin nada. **No hay cartas vanilla** — todas tienen al menos 1 condicional.

El **héroe** es el sujeto. El peregrinaje es el viaje. El duelo final es el clímax. Si una decisión de implementación pierde esto de vista, está mal.

---

_Versión 4.1 — mayo 2026. "El Peregrinaje del Héroe". Reemplaza v4.0._
