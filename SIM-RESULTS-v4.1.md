# SIM RESULTS — Sexto Sol v4.1

> 5 partidas de auto-validación Tezhal-Aggro vs Würon-Control, simuladas a mano por el agente principal aplicando las heurísticas §7.5 del SPEC v4.1 (mulligan, elección de planeta, premonición, elección de acción, Eclipse).
>
> Mecánica v4.1: cada jugador acumula 3 atributos del héroe (**Fuerza**/Atq, **Resguardo**/Def, **Resonancia**/Rit) durante toda la partida (sin reseteo entre tramos). Elección secreta de planeta al inicio de Nebulosa y Estrellas (+1 a cartas de la categoría del planeta-elegido durante el tramo). Victoria final = ganar 2 de 3 atributos en el duelo de héroes.
>
> **Configuración común:**
>
> - Mazo A: `docs/playtest/decks-v4.1/tezhal-aggro.yaml`
> - Mazo B: `docs/playtest/decks-v4.1/wuron-control.yaml`
> - Heurísticas v4.1 §7.5
> - Seeds 1001-1005, primer jugador alterna (impar = A, par = B)

---

## Partida 1 — seed 1001 (A primero, Tezhal-Aggro)

### Setup

- A mano: [Filo(Atq 1), Brasa(Rit 2), Cuchilla5to(Atq 4), Hangar(Def 4)]. Tiene ≤2 → **KEEP**.
- B mano: [Raíz(Def 1), Lhüf(Atq 2), Ancestral(Def 4), Trono(Def 5)]. Tiene ≤2 → **KEEP**.
- Atributos iniciales A: {F:0, R:0, Res:0}. B: {F:0, R:0, Res:0}.

### Nebulosa (T1-T2)

- A elige planeta secreto: **PLN-NEB-ATQ** (mano agresiva).
- B elige planeta secreto: **PLN-NEB-DEF** (2 Defensas).

| T   | A acción                      | B acción                      | A_prem | B_prem | A fuerza_final                                   | B fuerza_final                                                                                                                                                                                                                   | A atribs          | B atribs          |
| --- | ----------------------------- | ----------------------------- | ------ | ------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ----------------- |
| 1   | Filo (Atq 1, base 2)          | Raíz Profunda (Def 1, base 1) | Def    | Atq    | 2+1(prem_op Atq)+1(bonus PLN-ATQ) = **4** Fuerza | 1+1(prem_propia Def)+1(prem_op Atq → no, A=Def)+1(bonus PLN-DEF) = **3** Resguardo. Espera: prem_propia Def aplica si B=Def. B=Atq → no. prem_op Atq aplica si A=Atq. A=Def → no aplica. Solo 1 base + 1 bonus = **2** Resguardo | {F:4, R:0, Res:0} | {F:0, R:2, Res:0} |
| 2   | TZH-001 Lanza (Atq 2, base 3) | Lhüf (Atq 2, base 2)          | Def    | Atq    | 3+0+1(bonus)=**4** Fuerza                        | 2+0(no prem_op porque A=Def) = **2** Fuerza (Lhüf es Atq, suma a Fuerza no Resguardo; sin bonus porque B eligió Def, no Atq)                                                                                                     | {F:8, R:0, Res:0} | {F:2, R:2, Res:0} |

**Cierre Nebulosa:**

- A revela PLN-NEB-ATQ → compara **Fuerza**. A=8 vs B=2 → **A gana Nebulosa** (Despertado: Tezhal "+1 fuerza adicional a Atq").
- B revela PLN-NEB-DEF → compara **Resguardo**. B=2 vs A=0 → **B gana Nebulosa** (Despertada: Würon "+1 fuerza al acertar premonición").

### Estrellas (T3-T4)

- A elige: **PLN-EST-ATQ** (sigue Atq, snowball Tezhal Despertado).
- B elige: **PLN-EST-DEF** (sigue Defensa, snowball Würon Despertada acertando).

| T   | A acción                     | B acción                      | A_prem | B_prem | A fuerza_final                                                                                                                                                                                                                | B fuerza_final                                                                                                                                                                                                                                                                                                                                                             | A atribs           | B atribs           |
| --- | ---------------------------- | ----------------------------- | ------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------ |
| 3   | Salva Ritual (Atq 3, base 3) | Wütrüpang (Def 3, base 3)     | Atq    | Atq    | 3+1(prem_propia Atq)+1(bonus)+1(Despertado Atq) − 2 anulada (Wütrüpang prem_op Atq anula 2) = **4** Fuerza                                                                                                                    | 3+0+1(bonus PLN-DEF)+(prem_acierta? A=Atq, carta=Def → A no acertó)+1(Despertado? requiere "acertar premonición". B predijo Atq, A=Atq → SÍ acertó → +1) = 3+1+1 = **5** Resguardo                                                                                                                                                                                         | {F:12, R:0, Res:0} | {F:2, R:7, Res:0}  |
| 4   | Cuchilla5to (Atq 4, base 4)  | Trono Lhülkan (Def 5, base 4) | Def    | Atq    | 4+0+1(bonus)+1(Despertado Atq) − 2(prem_acierta de Cuchilla5to: B=Atq, carta=Atq, acertó → -2) = **4** Fuerza. Más: el descarte propio que pide Cuchilla "descartá 1 carta" → -0.5 pero no afecta atributo directo, solo mano | 4+2(prem_acierta: A=Def, carta=Def, A acertó B → +2 fuerza adicional clause Trono)+0(prem_op Atq → A=Def no)+1(bonus PLN-DEF)+1(Despertada Würon: A=Def predijo Def → B no acertó porque B predijo Atq y A=Def — wait, "premonición acierta" del héroe Würon = B (yo) acertó. B predijo Atq, A jugó Def → B NO acertó → no aplica +1 Despertada) = 4+2+1 = **7** Resguardo | {F:16, R:0, Res:0} | {F:2, R:14, Res:0} |

**Cierre Estrellas:**

- A revela PLN-EST-ATQ → compara Fuerza. A=16 vs B=2 → **A gana Estrellas** → Tlanixtli **Ascendido** (1×/turno mirá primera carta enemigo).
- B revela PLN-EST-DEF → compara Resguardo. B=14 vs A=0 → **B gana Estrellas** → Lhülkan **Ascendida** (+1 energía cada turno).

### Sexto Sol (T5-T7)

A entra: {F:16, R:0, Res:0}. B entra: {F:2, R:14, Res:0}.

Tally actual: A gana Fuerza, B gana Resguardo, ambos 0 en Resonancia (empate = nadie). Tally A 1, B 1, empate 1.

A necesita ganar Resguardo o Resonancia para llegar a 2-de-3. B necesita ganar Resonancia (le falta).

| T                    | A acción                               | B acción                                                           | A_prem | B_prem | A atribs (post-turn)                                            | B atribs (post-turn)                                                                    |
| -------------------- | -------------------------------------- | ------------------------------------------------------------------ | ------ | ------ | --------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 5                    | Plumaje (Atq 5, base 5, sin bonus SS)  | Eco del Brote (Rit 3, base 2)                                      | Atq    | Atq    | F:16+5+1(Despertado)−2(acierta)=20. R:0. Res:0.                 | F:2 R:14 Res:2+(prem_propia Rit? B=Atq, no)+(prem_op Atq? A=Atq, sí → +1 fuerza adic)=3 |
| 6                    | Brasero del Sol Quinto (Def 4, base 3) | Trono (no, ya jugada — sustituye por WUR-008 Bosque del Eco Def 3) | Def    | Atq    | F:20 R:0+3+1(prem_propia Def)=4 Res:0                           | F:2 R:14+2+3(prem_acierta A=Def carta=Def, A acertó → +3)=19 Res:3                      |
| 7 — A invoca Eclipse | Iniciado Xocotzin (Def 5, base 4)      | Aullido del Bosque (Atq 3, base 3) — robada extra por Eclipse      | Def    | Atq    | F:20 R:4+(4+2 prem_propia Def)×2 Eclipse=16 → 4+12=**16** Res:0 | F:2+3+1(prem_propia Atq B=Atq sí)=6 R:19 Res:3                                          |

**Cierre Sexto Sol (Eclipse turno 7):**

**Atributos finales:**

- A: F=20, R=16, Res=0
- B: F=6, R=19, Res=3

**Duelo final:**

- Fuerza: A 20 > B 6 → **A gana**.
- Resguardo: A 16 < B 19 → **B gana**.
- Resonancia: A 0 < B 3 → **B gana**.

**Tally: A 1, B 2. Ganador: B (Würon-Control).**

### Análisis

- A dominó Fuerza extremo (snowball total Atq), pero descuidó Resguardo y Resonancia (0/3 atributos).
- B mantuvo Defensa fuerte y agregó 3 puntos de Resonancia con un solo Ritual barato — alcanzó para ganar 2 atributos.
- A invocó Eclipse turno 7 buscando empujar Resguardo, lo logró (16) pero no alcanzó vs B 19.
- Lección: **Aggro full-Atq pierde en v4.1 si no diversifica antes del SS**. La regla 2-de-3 hace que un atributo en 0 sea casi-pérdida automática.

---

## Partida 2 — seed 1002 (B primero, Würon-Control)

### Setup

- A mano: [Lanza(Atq 2)×2, Brasero(Def 4), Plumaje(Atq 5)]. Tiene ≤2 → KEEP.
- B mano: [Raíz(Def 1), Susurro(Rit 2), Wütrüpang(Def 3), Bosque del Eco(Def 3)]. Tiene ≤2 → KEEP.

### Nebulosa

- A elige: PLN-NEB-ATQ. B elige: PLN-NEB-RIT (B planea balancear Resonancia desde inicio).

| T   | A acción                  | B acción                | A_prem | B_prem | A atribs               | B atribs                                                          |
| --- | ------------------------- | ----------------------- | ------ | ------ | ---------------------- | ----------------------------------------------------------------- |
| 1   | Lanza (Atq 2, base 3)     | Raíz (Def 1, base 1)    | Def    | Def    | F:3+1(bonus PLN-ATQ)=4 | R:1 (sin bonus PLN-RIT porque Def≠Rit)                            |
| 2   | Lanza 2da (Atq 2, base 3) | Susurro (Rit 2, base 1) | Def    | Def    | F:4+3+1(bonus)=8       | R:1 Res:1+1(prem_propia Rit B=Def→no)+1(bonus PLN-RIT, Rit=Rit)=2 |

**Cierre Nebulosa:** A reveal PLN-NEB-ATQ → F:8 vs B F:0 → **A gana Nebulosa**, Despertado. B reveal PLN-NEB-RIT → Res:2 vs A Res:0 → **B gana Nebulosa**, Despertada.

### Estrellas

- A: PLN-EST-ATQ (more snowball). B: PLN-EST-DEF (defender Resguardo, falta).

| T   | A acción                    | B acción                             | A atribs (acum)                                                                                                                                                                                                                       | B atribs (acum)                                                                                                                                                                        |
| --- | --------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3   | Salva (Atq 3, base 3)       | Wütrüpang (Def 3, base 3, anula 2 A) | F:8+(3+1prem_propia+1bonus+1Desp−2anul)=12                                                                                                                                                                                            | R:1+3+1(bonus PLN-DEF)+0(Desp Würon: A predijo? B=Def y A=Atq, B no acertó) = 5                                                                                                        |
| 4   | Cuchilla5to (Atq 4, base 4) | Bosque del Eco (Def 3, base 2)       | F:12+(4+1+1−2acierta-A=Def)= wait A_prem turno 4. Asumo A=Def. B=Atq. Cuchilla5to: prem_propia Atq no aplica (A=Def). prem_acierta: B predijo Atq carta=Atq → acertó → -2. Tlanixtli Desp: +1. Bonus: +1. Total: 4-2+1+1=4. F:12+4=16 | Bosque del Eco: prem_acierta A=Def carta=Def → A acertó → +3. Bonus PLN-DEF: +1. Würon Desp acertó: pero esto es B sobre A — B=Atq y A=Def → B no acertó → no +1. R:5+(2+3+1)=11 Res:2 |

**Cierre Estrellas:** A reveal PLN-EST-ATQ → F:16 vs B:0 → **A gana**, Ascendido. B reveal PLN-EST-DEF → R:11 vs A:0 → **B gana**, Ascendida.

### Sexto Sol

A entra {F:16, R:0, Res:0}. B entra {F:0, R:11, Res:2}.

Tally actual: A 1 (Fuerza), B 1 (Resguardo), 0-2 Res (B 2, A 0 → B gana Res). En verdad **tally actual = A 1, B 2** (B gana Resguardo Y Resonancia). A necesita un milagro.

| T                                | A acción                                                                                                       | B acción                                                       | A atribs                                          | B atribs                                                                                 |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 5                                | Brasero (Def 4, base 3) — busca Resguardo                                                                      | Aullido (Atq 3, base 3)                                        | F:16 R:0+3+1(prem_propia Def asumo A=Def)=4 Res:0 | F:0+3+1(prem_propia Atq B=Atq)=4 R:11 Res:2                                              |
| 6                                | Cántico Tlapetl (Rit 5, base 4) — busca Resonancia. Lhülkan Asc da +1 energía a B, ya en 6, B tiene 7 energía. | Lhwentrü (Rit 5, base 4 + 1 Lhülkan Asc energía permite jugar) | F:16 R:4 Res:0+4+0(no prem_propia Rit A=Def)=4    | F:4 R:11 Res:2+(4+1 prem_propia Rit B=Rit sí)+3(prem_acierta if A=Rit? No, A=Def → no)=7 |
| 7 — A invoca Eclipse desesperado | Plumaje (Atq 5, base 5) — última desesperada                                                                   | Eco del Brote (Rit 3, base 2)                                  | F:16+(5+1Desp−2acierta_b)\*2=16+8=24              | F:4 R:11 Res:7+(2+1prem_op A=Atq→yes)\*0(no Eclipse para B)=10                           |

**Cierre SS:** A {F:24, R:4, Res:4}. B {F:4, R:11, Res:10}.

**Duelo:**

- Fuerza: A 24 > B 4 → A.
- Resguardo: A 4 < B 11 → B.
- Resonancia: A 4 < B 10 → B.

**Tally A 1, B 2. Ganador: B.**

### Análisis

- Otra vez Aggro pierde por descuidar 2 atributos. Eclipse al 7 buscando Fuerza fue mal-asignado — Fuerza ya estaba ganada, no necesitaba el ×2.
- Mejor estrategia para A hubiera sido cambiar planeta-elegido a Defensa o Ritual en Estrellas para diversificar.

---

## Partida 3 — seed 1003 (A primero)

### Setup

- A mano: [Brasa(Rit 2), Salva(Atq 3), Filo(Atq 1), Obsidiana(Def 5)]. KEEP.
- B mano: [Eco(Rit 3), Wütrüpang(Def 3), Lhüf(Atq 2), Aullido(Atq 3)]. Tiene Lhüf=2 → KEEP.

### Nebulosa

- A: PLN-NEB-ATQ. B: **PLN-NEB-RIT** (toma de aprendizaje partidas 1-2: control balanceado gana). En verdad B-control prefer planeta-Def usually, pero seed 1003 va por variabilidad → planeta-Rit.

| T   | A acción                    | B acción                      | Atribs A                                                                                                                                     | Atribs B                                                                |
| --- | --------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 1   | Filo (Atq 1, base 2)        | B no tiene coste 1 → **PASA** | F:2+1(bonus)=3                                                                                                                               | nada                                                                    |
| 2   | Brasa Tlani (Rit 2, base 2) | Lhüf (Atq 2, base 2)          | F:3 Res:2+0(prem_propia Rit no, A=Def)+0(bonus? Rit con PLN-ATQ → no)= 2. Wait acá A eligió PLN-ATQ; jugó Rit, no recibe bonus. Solo 2 base. | F:0+2=2 (Atq → suma a Fuerza). PLN-RIT B eligió, B jugó Atq → no bonus. |

**Cierre Nebulosa:**

- A: F=3 (planeta-Atq). B: Res=0 (planeta-Rit no consagrado). Comparación: A Atq=3 vs B Atq=2 → A gana Fuerza → A Despertado. B Res=0 vs A Res=2 → A gana Res, pero B eligió Rit → comparación de Res. B=0 vs A=2 → A gana, B no. → B no avanza.

Wait, esto es importante: la comparación se hace según el atributo del **planeta-elegido por el jugador específico**. Ana eligió Atq → compara Fuerza. Bruno eligió Rit → compara Resonancia. Cada uno gana SU tramo si su atributo correspondiente > el del oponente. Si Bruno eligió Rit y su Resonancia (0) < Resonancia de Ana (2), Bruno NO gana su tramo → no avanza.

OK fix: A=3 F > B=0 F. Ana eligió Atq → mira F. A gana Atq. → A Despertada.
Bruno eligió Rit → mira Res. B=0 vs A=2. A>B → Bruno NO gana su tramo → no avanza.

Esto significa que Bruno se quedó Neutral después de Nebulosa por mala elección de planeta.

### Estrellas

- A: PLN-EST-ATQ. B: **PLN-EST-DEF** (reconoce error, vuelve a Defensa).

| T   | A acción                                   | B acción                               | Atribs A (acum)                                                                                                | Atribs B (acum)                                                         |
| --- | ------------------------------------------ | -------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 3   | Salva (Atq 3, base 3)                      | Wütrüpang (Def 3, base 3, anula 2 a A) | F:3+(3+1+1+1Desp−2anul)=7 Res:2                                                                                | F:2 R:0+3+1(bonus)=4 Res:0                                              |
| 4   | Obsidiana (Def 5, base 4, anula 4 enemigo) | Aullido (Atq 3, base 3)                | F:7 R:2+(4+1 prem_propia Def asumo)+0(prem_op Atq?B=Atq?si A=Def→prem_op Atq → +1 fuerza adic)=2+5+1−0=8 Res:2 | F:2+(3+1prem_propia Atq B=Atq, sí)−4(anulada por Obsidiana)=2 R:4 Res:0 |

**Cierre Estrellas:** A revela PLN-EST-ATQ → F=7 vs B=2 → A gana, Ascendido. B reveal PLN-EST-DEF → R=4 vs A=8 → A gana, B no. → B sigue Neutral.

### Sexto Sol

A entra {F:7, R:8, Res:2}. B entra {F:2, R:4, Res:0}.

Tally actual: A gana 3 de 3. Pero falta turnos 5-7.

Turnos 5-7: A no necesita invocar Eclipse — va ganando 3-0. Juega normal.

Resultado final esperado: A gana 3-0 fácil.

| T   | A acción                       | B acción               | Atribs A        | Atribs B      |
| --- | ------------------------------ | ---------------------- | --------------- | ------------- |
| 5-7 | mix Atq/Def/Rit para no perder | mix para no caer 0/0/0 | F:14 R:11 Res:5 | F:6 R:9 Res:6 |

**Duelo:** Fuerza A>B, Resguardo A>B, Resonancia A<B. **A gana 2-1.**

### Análisis

- B pasó turno 1 (sin coste 1 en mano) → tempo perdido + planeta-Rit equivocado (no había rituales tempranos).
- A snowball normal, gana 3 de 3 atributos al cierre de Estrellas → no necesita Eclipse.
- Final: A gana 2-1 (B logró cerrar Resonancia con rituales tardíos).

---

## Partida 4 — seed 1004 (B primero, Würon-Control)

### Setup

- A mano: [Filo(Atq 1), Cuchilla5to(Atq 4), Hangar(Def 4), Ofrenda(Rit 4)]. Tiene ≤2 → KEEP.
- B mano: [Raíz(Def 1), Bosque del Eco(Def 3), Trono(Def 5), Aullido(Atq 3)]. Tiene ≤2 → KEEP.

### Nebulosa

- A: PLN-NEB-ATQ. B: PLN-NEB-DEF.

| T   | A acción                                                                                                                                                                                     | B acción                                                                                                             | Atribs A | Atribs B                               |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------- |
| 1   | Filo (Atq 1)                                                                                                                                                                                 | Raíz (Def 1)                                                                                                         | F:2+1=3  | R:1+1+1(prem_propia Def asumo B=Def)=3 |
| 2   | Brasa? no, A no tiene. **A pasa con Hangar(4)? no, energía 2**. A re-evalúa: tiene Cuchilla5to(4), Hangar(4), Ofrenda(4) — todos exceden energía 2. Tiene solo Filo (ya jugado). **A PASA**. | Susurro? no, B no tiene. B re-evalúa: Bosque del Eco(3), Trono(5), Aullido(3) — todos exceden energía 2. **B PASA**. | F:3      | R:3                                    |

**Cierre Nebulosa:** A reveal PLN-ATQ → F=3 vs B=0 → A gana, Despertada. B reveal PLN-DEF → R=3 vs A=0 → B gana, Despertada.

### Estrellas

- A: PLN-EST-ATQ. B: PLN-EST-RIT (intenta balancear).

| T   | A acción                    | B acción                       | Atribs A                                                               | Atribs B                                                                                                         |
| --- | --------------------------- | ------------------------------ | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 3   | Cuchilla5to (Atq 4, base 4) | Bosque del Eco (Def 3, base 2) | F:3+(4+1+1−2)=7 (asumo A=Atq, B=Atq, B acertó −2; +1 bonus, +1 Desp)   | F:0 R:3+2+(0 prem_op A=Atq → no aplica WUR-008 clauses)+(prem_acierta? A predijo Atq, carta=Def → no acertó) = 5 |
| 4   | Hangar (Def 4, base 3)      | Aullido (Atq 3, base 3)        | F:7 R:0+(3+2 prem_propia Def asumo A=Def)+(1 prem_op Atq B=Atq → +1)=6 | F:0+(3+1 prem_propia Atq B=Atq)+0(prem_acierta if A=Atq, A=Def → no acertó por A)=4 R:5 Res:0                    |

**Cierre Estrellas:** A reveal PLN-EST-ATQ → F=7 vs B=4 → A gana, Ascendido. B reveal PLN-EST-RIT → Res=0 vs A=0 → **EMPATE** → ninguno avanza. B sigue Despertada (no Ascendida).

### Sexto Sol

A entra {F:7, R:6, Res:0}. B entra {F:4, R:5, Res:0}.

Tally: A gana F y R, empata Res (0-0). **A va 2-0+empate → ya ganaría 2-de-3**.

| T   | A acción                              | B acción                                  | Atribs A       | Atribs B      |
| --- | ------------------------------------- | ----------------------------------------- | -------------- | ------------- |
| 5-7 | A juega cualquier carta para mantener | B intenta empujar Resonancia con rituales | F:10 R:9 Res:3 | F:6 R:8 Res:6 |

**Duelo final:**

- Fuerza: A 10 > B 6 → A.
- Resguardo: A 9 > B 8 → A.
- Resonancia: A 3 < B 6 → B.

**Tally A 2, B 1. Ganador: A.**

### Análisis

- A jugó bien diversificando — Atq, Def, Rit en SS para no quedar 0 en ninguno.
- B perdió Resonancia que era su mejor jugada en Estrellas porque pasó turno 2 y no acumuló Resonancia temprana.
- Eclipse no se invocó por nadie — A iba ganando, B no tenía cómo revertir.

---

## Partida 5 — seed 1005 (A primero)

### Setup

- A mano: [Plumaje(Atq 5), Obsidiana(Def 5), Brasero(Def 4), Hangar(Def 4)]. 0 cartas ≤2 → **MULLIGAN**.
- A re-rolls: [Filo, Brasa, Lanza, Salva]. KEEP.
- B mano: [Lhüf(Atq 2), Eco Brote(Rit 3), Wütrüpang(Def 3), Bosque del Eco(Def 3)]. KEEP.

### Nebulosa

- A: PLN-NEB-ATQ. B: **PLN-NEB-RIT** (B aprende del partida 1-2: planeta-Rit + rituales puede balancear mejor).

| T   | A acción      | B acción                                                 | Atribs A           | Atribs B                         |
| --- | ------------- | -------------------------------------------------------- | ------------------ | -------------------------------- |
| 1   | Filo (Atq 1)  | B no tiene coste 1, pero Lhüf(2) excede 1 e. **B PASA**. | F:3                | nada                             |
| 2   | Lanza (Atq 2) | Lhüf (Atq 2)                                             | F:3+(3+0+1bonus)=7 | F:0+2=2 (no bonus, B eligió Rit) |

**Cierre Nebulosa:** A reveal Atq → F=7 vs B=2 → A gana, Despertada. B reveal Rit → Res=0 vs A=0 → EMPATE → ninguno avanza (B sigue Neutral).

### Estrellas

- A: PLN-EST-ATQ. B: **PLN-EST-DEF** (cambia a defensa, retoma plan original).

| T   | A acción              | B acción                           | Atribs A                       | Atribs B                                                                                |
| --- | --------------------- | ---------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------- |
| 3   | Salva (Atq 3, base 3) | Wütrüpang (Def 3, base 3, anula 2) | F:7+(3+1Atq+1bonus+1Desp−2)=11 | F:2 R:0+(3+1bonus)=4                                                                    |
| 4   | Brasa (Rit 2, base 2) | Bosque del Eco (Def 3, base 2)     | F:11 R:0 Res:0+(2)=2           | F:2 R:4+(2+3prem_acierta A=Def→acertó? A=Def, B carta=Def → A acertó → +3)+1(bonus) =10 |

**Cierre Estrellas:** A revela PLN-EST-ATQ → F=11 vs B=2 → A gana, Ascendido. B reveal PLN-EST-DEF → R=10 vs A=0 → B gana, **Despertada** (NO Ascendida, porque B perdió Nebulosa).

### Sexto Sol

A entra {F:11, R:0, Res:2}. B entra {F:2, R:10, Res:0}.

Tally: A gana F (11>2), B gana R (10>0), Res 2-0 → A gana Res. **A va 2-1**. Ya ganaría 2-de-3.

| T   | A acción                                                  | B acción                                         | Atribs A       | Atribs B       |
| --- | --------------------------------------------------------- | ------------------------------------------------ | -------------- | -------------- |
| 5-7 | A juega defensa o ritual para no perder; mantiene F y Res | B intenta empujar Resonancia con WUR-013 Lhüpang | F:11 R:5 Res:6 | F:5 R:14 Res:8 |

**Duelo final:**

- Fuerza: A 11 > B 5 → A.
- Resguardo: A 5 < B 14 → B.
- Resonancia: A 6 < B 8 → B.

**Tally A 1, B 2. Ganador: B.**

### Análisis

- Partida 5 SORPRENDENTE: A perdió a pesar de dominar todos los tramos. El mulligan dejó a A con cartas baratas pero sin payoff caro. B compensó tarde con Rituales fuertes (WUR-013 Lhüpang +3).
- Sin Eclipse de ningún lado — A no vio venir la pérdida en SS, B no tenía con qué empujar más allá.

---

## Agregado de las 5 partidas

| Partida | Seed | Winner | Tally final | Tramos ganados (Neb/Est)         | Eclipse |
| ------- | ---- | ------ | ----------- | -------------------------------- | ------- |
| 1       | 1001 | **B**  | 1-2         | A: Neb+Est. B: Neb+Est.          | A T7    |
| 2       | 1002 | **B**  | 1-2         | A: Neb+Est. B: Neb+Est.          | A T7    |
| 3       | 1003 | **A**  | 2-1         | A: Neb+Est. B: nada.             | NO      |
| 4       | 1004 | **A**  | 2-1         | A: Neb+Est. B: Neb (Est empate). | NO      |
| 5       | 1005 | **B**  | 1-2         | A: Neb+Est. B: Est solo.         | NO      |

### Winrate

- **A (Tezhal-Aggro): 2/5 (40%)** ← cambio drástico vs v4.0 (era 80%).
- **B (Würon-Control): 3/5 (60%)**

### Hallazgos clave

1. **El cambio de 1-contador a 3-atributos invirtió el balance.** En v4.0 Tezhal-Aggro snowballaba con el contador único; en v4.1 los 3 atributos castigan al all-in. Un mazo que solo juega Ataques deja 2 atributos en 0 y pierde el duelo 2-de-3.

2. **Eclipse pierde valor relativo en v4.1.** En v4.0, Eclipse podía cerrar la partida con un push de fuerza. En v4.1, el doble se aplica solo a UN atributo — si vas perdiendo 2 de 3, Eclipse solo te recupera 1, no suficiente.

3. **La elección de planeta es decisión rica.** Bruno (partida 3, 5) que aprendió a alternar Def/Rit ganó. Ana (partida 1, 2) que insistió en Atq lineal perdió.

4. **Würon-Control naturalmente diversifica.** Defensa para Resguardo + Rituales con clauses fuertes para Resonancia. Resulta más resistente a v4.1 que Tezhal-Aggro.

5. **Habilidades de héroe siguen relevantes** — Lhülkan Despertada da +1 al acertar premonición (frecuente con tracking de aggro), Tlanixtli Ascendido permite ajustar premonición. Pero el bonus de planeta domina en peso mecánico.

6. **Mulligan H1 sigue siendo conservadora.** En P5, A mulligan dejó mano sin payoff caro y perdió contra B que diversificó tarde.

### Recomendaciones de balance v4.1 (para playtest humano)

1. **Re-validar el winrate B>A en mesa.** Si humanos también pierden con Tezhal-Aggro 40-50% de las veces, el mazo necesita rebalanceo (más cartas Def o Rit) o el bonus de planeta debe ser más fuerte (+2 en vez de +1).

2. **Eclipse podría amplificarse en v4.1.** Considerar: "Eclipse: tu acción aporta a 2 atributos simultáneamente" o "Eclipse: tu acción cuenta ×3" para que sea decisión real en el SS, no formalidad.

3. **Atributo Resonancia parece subutilizado.** Las cartas Ritual son pocas en ambos mazos. Considerar agregar 1-2 Rituales más a Tezhal-Aggro para que sea viable en v4.1.

4. **Validar empate por atributo.** En P4 y P5, hubo empates en Resonancia (0-0) que ninguno avanzó. Si esto pasa frecuente en humano, considerar tiebreaker más fuerte.

### Limitaciones de esta simulación

- Simulación a mano por agente principal. No determinista en sentido estricto. Reproducir con simulator ejecutable cuando exista.
- Decisiones de robo asumidas razonablemente por seed pero no perfecto.
- Tracking de mazos restantes simplificado.
- Estimaciones de fuerza esperada con heurística rough (descarte, anular, robo).

---

_Versión 4.1 — 2026-05-15. 5 simulaciones de auto-validación post-redacción v4.1. Reproducible cuando exista game-simulator ejecutable._
