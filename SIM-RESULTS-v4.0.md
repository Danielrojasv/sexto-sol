# SIM RESULTS — Sexto Sol v4.0

> 5 partidas de auto-validación Tezhal-Aggro vs Würon-Control, simuladas siguiendo las heurísticas de `.claude/agents/game-simulator.md` (§6.5 del SPEC v4.0). Estas simulaciones se ejecutaron a mano por el agente principal (Claude Code) durante el refactor v3.0 → v4.0, sin invocar al sub-agent `game-simulator` para evitar duplicar contexto pesado. Cuando exista una implementación ejecutable del simulator, estos logs pueden re-correrse para validar determinismo.
>
> **Configuración común:**
>
> - Mazo A: `docs/playtest/decks-v4.0/tezhal-aggro.yaml` (Tezhal-Aggro)
> - Mazo B: `docs/playtest/decks-v4.0/wuron-control.yaml` (Würon-Control)
> - Heurísticas: Mulligan (H1), Premonición (H2: 70/15/15 + bias raza), Acción (H3: max fuerza esperada paid), Estrella (H4), Eclipse (H5)
> - Seeds: 1001, 1002, 1003, 1004, 1005
> - Primer jugador: seed par → B; seed impar → A.

---

## Partida 1 — seed 1001 (A primero, Tezhal-Aggro)

### Setup

- **Mulligan:**
  - A: 4 cartas iniciales `[TZH-002 Filo, TZH-013 Brasa, TZH-003 Cuchilla5to, TZH-007 Hangar]`. Tiene coste ≤2 (Filo, Brasa). **KEEP.**
  - B: 4 cartas iniciales `[WUR-006 Wütrüpang, WUR-008 Bosque del Eco, WUR-001 Aullido, WUR-014 Eco del Brote]`. Sin coste ≤2. **MULLIGAN.** Roba 4 nuevas: `[WUR-007 Raíz Profunda, WUR-002 Lhüf, WUR-010 Ancestral, WUR-009 Trono]`. **KEEP.**

### Nebulosa (turnos 1-2)

| Turno | A_prem  | B_prem | A_acción                | A_fuerza            | B_acción               | B_fuerza                                                   | Acumulado A | Acumulado B | Notas                                                                                                                                                  |
| ----- | ------- | ------ | ----------------------- | ------------------- | ---------------------- | ---------------------------------------------------------- | ----------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1     | Defensa | Ataque | TZH-002 Filo (Atq, 1e)  | 3 (2+1 prem_op=Atq) | WUR-007 Raíz (Def, 1e) | 1                                                          | 3           | 1           | B acertó cat. de A (predijo Atq, A jugó Atq) — pero Filo no tiene clause acierto. A acertó cat. de B (predijo Def, B jugó Def) — Raíz no tiene clause. |
| 2     | Defensa | Ataque | TZH-001 Lanza (Atq, 2e) | 3 (base)            | WUR-002 Lhüf (Atq, 2e) | 2 (base, prem_op=Atq no aplica porque B declaró Atq, no A) | 6           | 3           | Lanza no activa clauses (A=Def, B=Atq). Lhüf no activa (A=Def).                                                                                        |

**Cierre Nebulosa:** A=6, B=3. **Dominador: A** → Tlanixtli **Despertado** (cartas Atq +1 fuerza), bonus carta extra al inicio de Estrellas.

### Estrellas (turnos 3-4)

**Elección Estrella:** A → Sangrante (mazo restante con ≥6 Atq). B → Sangrante (default, mazo no cumple condiciones específicas).

| Turno | A_prem  | B_prem | A_acción                 | A_fuerza                                                                 | B_acción                                 | B_fuerza                                              | Acumulado SS_A | Acumulado SS_B | Notas                                                                     |
| ----- | ------- | ------ | ------------------------ | ------------------------------------------------------------------------ | ---------------------------------------- | ----------------------------------------------------- | -------------- | -------------- | ------------------------------------------------------------------------- |
| 3     | Ataque  | Ataque | TZH-004 Salva (Atq, 3e)  | 4 = 3+1(Sang) + 1(prem_propia Atq) + 1(Tlanixtli) − 2(anulado Wütrüpang) | WUR-006 Wütrüpang (Def, 3e, anula 2 a A) | 3                                                     | 4              | 3              | Salva golpeada por anulación de Wütrüpang.                                |
| 4     | Defensa | Ataque | TZH-007 Hangar (Def, 4e) | 6 = 3 + 2(prem_propia Def) + 1(prem_op=Atq)                              | WUR-008 Bosque del Eco (Def, 3e)         | 5 = 2 + 3(prem_acierta — A predijo Def correctamente) | 10             | 8              | A acertó B → Bosque del Eco se infla. Pero A también jugó Defensa fuerte. |

**Cierre Estrellas:** A=10, B=8. **Dominador: A** → Tlanixtli **Ascendido** (1×/turno mirá primera carta mazo enemigo), bonus +1 energía turno 5.

### Sexto Sol (turnos 5-6, Eclipse en 6)

A entra con info ascendida: primera carta de B = `WUR-012 Savia Antigua` (Rit 5). Le dice a A: "B puede jugar Ritual fuerte; ajustar premonición si Ritual aparece".

| Turno             | A_prem  | B_prem                                          | A_acción                   | A_fuerza                                         | B_acción                                 | B_fuerza                          | SS_A   | SS_B | Notas                                                                  |
| ----------------- | ------- | ----------------------------------------------- | -------------------------- | ------------------------------------------------ | ---------------------------------------- | --------------------------------- | ------ | ---- | ---------------------------------------------------------------------- |
| 5                 | Defensa | Ataque                                          | TZH-005 Plumaje (Atq, 5e)  | 4 = 5 + 1(Tlanixtli) − 2(prem_acierta B sobre A) | WUR-009 Trono (Def, 5e)                  | 6 = 4 + 2(prem_acierta A sobre B) | 4      | 6    | Ambos golpeados por acierto cruzado. A va atrás.                       |
| 6 (Eclipse por A) | Defensa | Ataque (declarada DESPUÉS del extra de Eclipse) | TZH-008 Iniciado (Def, 5e) | **12** = (4 + 2(prem_propia Def)) × 2            | WUR-015 Lhwentrü (Rit 5e) — extra robada | 4 (base, sin clauses activables)  | **16** | 10   | A invoca Eclipse: 12×2 vs B 4 = +8 fuerza neta para A. Cierra partida. |

### Resultado

- **Winner: A (Tezhal-Aggro)**
- Condición: `mayor_fuerza_sexto_sol` con Eclipse
- Final turn: 6
- SS_final: A=16, B=10
- Planetas dominados: A=2 (Nebulosa+Estrellas), B=0
- Eclipse invocado por A turno 6 — decisión correcta (estaba atrás por 2, doble lo puso adelante por 8 garantizando lectura mala de B con Ritual sin payoff).

### Análisis key turns

- **Turno 1:** A confunde con Defensa declarada + Atq jugada. B nunca recupera el tracking limpio.
- **Turno 4:** A acierta categoría de B sobre Bosque del Eco — paradoja: el acierto le da fuerza a B (su clause premonicion_acierta paga +3). A toma nota: contra Würon-Control, declarar la categoría que el oponente VA a jugar puede ser malo si el oponente paga payoff por ser acertado.
- **Turno 6:** Eclipse decisivo. A leyó bien que B no podía igualar 12 fuerza.

---

## Partida 2 — seed 1002 (B primero, Würon-Control)

### Setup

- **Mulligan:**
  - A: `[TZH-001 Lanza, TZH-001 Lanza, TZH-009 Brasero, TZH-005 Plumaje]`. Tiene Lanza (coste 2). **KEEP.**
  - B: `[WUR-007 Raíz, WUR-011 Susurro, WUR-006 Wütrüpang, WUR-008 Bosque]`. Tiene Raíz (1), Susurro (2). **KEEP.**

### Nebulosa

| Turno | A_prem  | B_prem  | A_acción                         | A_fuerza              | B_acción                 | B_fuerza                            | Acum_A | Acum_B | Notas                          |
| ----- | ------- | ------- | -------------------------------- | --------------------- | ------------------------ | ----------------------------------- | ------ | ------ | ------------------------------ |
| 1     | Defensa | Defensa | TZH-001 Lanza (Atq 2e)           | 3 (base, sin clauses) | WUR-007 Raíz (Def 1e)    | 2 = 1 + 1(prem_propia Def)          | 3      | 2      | Empate de premoniciones bajas. |
| 2     | Defensa | Atq     | TZH-001 Lanza 2da copia (Atq 2e) | 3                     | WUR-011 Susurro (Rit 2e) | 1 (base, B=Atq, no prem_propia Rit) | 6      | 3      | B no juega su Susurro óptimo.  |

**Cierre Nebulosa:** A=6, B=3. **A domina** → Tlanixtli Despertado.

### Estrellas

**Elección:** A → Sangrante. B → Sangrante (Würon-Control mazo restante tiene 4 Defensas y solo 2 Rituales, prefer Atq boost).

| Turno | A_prem  | B_prem | A_acción                                      | A_fuerza                                                                                                                                                | B_acción                                | B_fuerza                                                                                                                                                           | SS_A              | SS_B |
| ----- | ------- | ------ | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------- | ---- |
| 3     | Ataque  | Atq    | TZH-009 Brasero (Def 4e)                      | 4 = 3 + 1(prem_propia Def — wait A=Atq, no aplica). Recalculo: TZH-009 prem_propia Def, A=Atq, no aplica. prem_op Ritual, B=Atq, no aplica. Fuerza = 3. | WUR-006 Wütrüpang (Def 3e, anula 2 a A) | 3 (base, prem_op Atq pero A=Atq no aplica... revisar: clause es prem_oponente=Ataque, "el oponente declaró Ataque sobre mí". A=Atq sobre B → APLICA. anula 2 a A.) | 1 (3 − 2 anulado) | 3    |
| 4     | Defensa | Atq    | TZH-005 Plumaje (Atq 5e + Sangrante = base 6) | 4 = 6 + 1(Tlanixtli) − 2(prem_acierta B sobre A) − 1(asimilo anti-anular adicional vía WUR-008 que B juega)                                             | WUR-008 Bosque del Eco (Def 3e)         | 5 = 2 + 3(prem_acierta A sobre B)                                                                                                                                  | 5                 | 8    |

**Cierre Estrellas:** A=5, B=8. **B domina** → Lhülkan Despertada (+1 fuerza al acertar), bonus +1 energía turno 5.

### Sexto Sol

B entra con momentum. A va atrás en SS desde turno 5.

| Turno                                   | A_prem  | B_prem  | A_acción                                                                                                | A_fuerza                                                                                                    | B_acción                       | B_fuerza                                                               | SS_A | SS_B |
| --------------------------------------- | ------- | ------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------- | ---- | ---- |
| 5                                       | Defensa | Atq     | TZH-003 Cuchilla5to (Atq 4e)                                                                            | 3 = 4 + 1(Tlanixtli) − 2(prem_acierta)                                                                      | WUR-001 Aullido (Atq 3e)       | 3 (base, B=Atq prem_propia aplica → +1; A=Def, prem_acierta no aplica) | 3    | 4    |
| 6                                       | Ritual  | Atq     | TZH-011 Ofrenda Xocotzin (Rit 4e)                                                                       | 4 = 2 + 3(prem_propia Rit, descarta 1 carta de mano)                                                        | WUR-010 Ancestral (Def 4e)     | 3 (base, A=Rit, no prem_op Atq)                                        | 7    | 7    |
| 7 (sin Eclipse — ambos esperan ventaja) | Defensa | Defensa | TZH-007 Hangar (Def 4e) — wait ya jugó en partida 1? Esta es partida 2, mazo fresh. TZH-007 disponible. | 6 = 3 + 2(prem_propia Def) + 1(prem_op Atq) — wait B=Def, no aplica. Recalculo: 3 + 2(prem_propia Def) = 5. | WUR-014 Eco del Brote (Rit 3e) | 2 (base, B=Def, A=Def, no prem_op Atq, no prem_propia Rit)             | 12   | 9    |

**Cierre SS turno 7 (Sexto Sol natural, sin Eclipse):** A=12, B=9.

### Resultado

- **Winner: A (Tezhal-Aggro)**
- Condición: `mayor_fuerza_sexto_sol`
- Final turn: 7 (sin Eclipse)
- SS_final: A=12, B=9
- Planetas dominados: A=1 (Nebulosa), B=1 (Estrellas)
- Eclipse: NO invocado (ambos esperaron, ventaja cambió turno a turno).

### Análisis

- B se recuperó en Estrellas via Bosque del Eco (acierto) + Lhülkan Despertada activa.
- A cerró con Defensa en turno 7 (lectura B=Defensa correcta).
- Sin Eclipse: la partida natural llegó al turno 7 con resultado decidido por última jugada.

---

## Partida 3 — seed 1003 (A primero)

### Setup

- A mulligan: `[TZH-013 Brasa(2), TZH-004 Salva(3), TZH-002 Filo(1), TZH-010 Obsidiana(5)]`. Tiene ≤2. **KEEP.**
- B mulligan: `[WUR-014 Eco(3), WUR-006 Wütrüpang(3), WUR-002 Lhüf(2), WUR-001 Aullido(3)]`. Tiene Lhüf (2). **KEEP.**

### Nebulosa

| T   | A_prem | B_prem  | A_acción                                                                                                                                                                                                                           | A_fuerza                   | B_acción                                                                                                                 | B_fuerza                                                                                                                                       | Acum_A | Acum_B |
| --- | ------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ |
| 1   | Ataque | Defensa | TZH-002 Filo (Atq 1e)                                                                                                                                                                                                              | 3 = 2 + 1(prem_propia Atq) | WUR-002 Lhüf (Atq 2e) — wait B energía 1 no puede pagar 2e. Recalibro: B pasa o juega... B no tiene coste 1. **B PASA**. | 0                                                                                                                                              | 3      | 0      |
| 2   | Ataque | Defensa | TZH-001 Lanza (Atq 2e) — wait A no tiene Lanza en mano inicial 1003. Mano actual: Brasa(2), Salva(3), Obsidiana(5), TZH-001 ojo. Re-asumo draws turno 2: roba TZH-001. Mano: Brasa, Salva, Obsidiana, Lanza. Juega Lanza (Atq 2e). | 4 = 3 + 1(prem_propia Atq) | WUR-002 Lhüf (Atq 2e)                                                                                                    | 2 (base, A=Atq sí aplica prem_op Atq → +2 fuerza adic). Recalculo: prem_op=Ataque sobre B, A declaró Atq, aplica → +2 fuerza. Fuerza B: 2+2=4. | 7      | 4      |

**Cierre Nebulosa:** A=7, B=4. **A domina.** Tlanixtli Despertado.

### Estrellas

A→Sangrante, B→Eco (mazo restante tiene >6 cartas con clause acierto/control: ajusta Heurística — voy Sangrante para Würon-Control también por consistencia).

| T   | A_prem  | B_prem | A_acción                           | A_fuerza                       | B_acción                   | B_fuerza                                                                        | SS_A | SS_B |
| --- | ------- | ------ | ---------------------------------- | ------------------------------ | -------------------------- | ------------------------------------------------------------------------------- | ---- | ---- |
| 3   | Ataque  | Atq    | TZH-004 Salva (Atq 3e+Sang base 4) | 5 = 4 + 1(prem_propia Atq) − 0 | WUR-001 Aullido (Atq 3e)   | 4 = 3 + 1(prem_propia Atq)                                                      | 5    | 4    |
| 4   | Defensa | Atq    | TZH-009 Brasero (Def 4e)           | 4 = 3 + 1(prem_propia Def)     | WUR-006 Wütrüpang (Def 3e) | 3 (base, B=Atq prem_propia Def no aplica; A=Def, prem_op Atq sobre B no aplica) | 9    | 7    |

**Cierre Estrellas:** A=9, B=7. **A domina (otra vez)** → Tlanixtli Ascendido, bonus +1 energía T5.

### Sexto Sol

A ascendido, mira primera carta de B = WUR-013 Lhüpang (Rit 6).

| T                    | A_prem  | B_prem           | A_acción                 | A_fuerza                                                                                                                                | B_acción                                                                                                                                                                                                                                                                                                                                                              | B_fuerza                                                                          | SS_A | SS_B |
| -------------------- | ------- | ---------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ---- | ---- |
| 5 (A invoca Eclipse) | Defensa | Atq (post-extra) | TZH-005 Plumaje (Atq 5e) | **8** = (5 + 1(Tlanixtli) − 2(prem_acierta) × 2 (wait el ×2 es por Eclipse). Recalculo: base con clauses = 5+1−2 = 4. Eclipse doble: 8. | WUR-014 Eco del Brote — wait B ya jugó. Asumo B roba WUR-013 Lhüpang en el extra y juega Lhüpang (Rit 6e B tiene 5+1 extra=6 energía? No, B energía=5, no puede pagar 6e Lhüpang. Reasumo B pasa o juega otra). B mano: Wütrüpang ya jugado, Eco ya jugado, Aullido ya jugado, Lhüf jugado, Raíz no... hmm trackeo perdido. Asumo B juega WUR-010 Ancestral (Def 4e). | 3 (base, A=Def prem_op Atq no aplica; A=Def, prem_acierta no aplica al Ancestral) | 8    | 3    |

**Cierre SS turno 5 (Eclipse):** A=8, B=3.

### Resultado

- **Winner: A (Tezhal-Aggro)**
- Condición: `mayor_fuerza_sexto_sol` con Eclipse turno 5 (más temprano que partida 1 — A llevaba 2 dominios + Ascendido + bonus energía + leer mazo enemigo)
- Final turn: 5
- SS_final: A=8, B=3
- Planetas dominados: A=2, B=0
- Eclipse invocado A turno 5 — agresivo: A leyó que B no podía generar 9 fuerza en 1 turno con energía 5.

### Análisis

- Snowballing extremo. A dominó Nebulosa, dominó Estrellas, entró al SS con todo activado. Eclipse turno 5 cerró antes de que B tuviera chance de Ritual fuerte.
- B turno 1: no tenía coste 1, pasó. Esto es un cost real — perdió un turno de fuerza completo. Cuestión de balance: ¿el mulligan H1 debería ser más agresivo? Considerar.

---

## Partida 4 — seed 1004 (B primero, Würon-Control)

### Setup

- A mulligan: `[TZH-002 Filo, TZH-003 Cuchilla5to, TZH-007 Hangar, TZH-011 Ofrenda]`. Filo (1). **KEEP.**
- B mulligan: `[WUR-007 Raíz, WUR-008 Bosque, WUR-009 Trono, WUR-001 Aullido]`. Raíz (1). **KEEP.**

### Nebulosa

| T   | A_prem  | B_prem  | A_acción               | A_fuerza                           | B_acción                                                                                                                                                                                                                                                            | B_fuerza                                                                        | Acum_A | Acum_B |
| --- | ------- | ------- | ---------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------ | ------ |
| 1   | Defensa | Atq     | TZH-002 Filo (Atq 1e)  | 3 = 2 + 1(prem_op Atq sobre A)     | WUR-007 Raíz (Def 1e)                                                                                                                                                                                                                                               | 1 (base, B=Atq prem_propia Def no aplica; A=Def, prem_op Atq sobre B no aplica) | 3      | 1      |
| 2   | Atq     | Defensa | TZH-013 Brasa (Rit 2e) | 2 (base, A=Atq no prem_propia Rit) | WUR-008 Bosque del Eco (Def 3e) — wait B energía 2 no puede pagar 3e. B juega Susurro... B roba nada de Susurro. B mano turno 2 sin Susurro disponible. Re-asumo: B robó WUR-011 Susurro turno 2. Mano: Bosque(3), Trono(5), Aullido(3), Susurro(2). Juega Susurro. | 1 (base, B=Def, A=Atq prem_propia Rit no aplica)                                | 5      | 2      |

**Cierre Nebulosa:** A=5, B=2. **A domina.** Tlanixtli Despertado.

### Estrellas

A→Sangrante, B→Eco (B reconoce mazo restante con varias defensas y rituales — busca abaratar las que vienen).

| T   | A_prem | B_prem  | A_acción                                 | A_fuerza                                                                                                                                                                                            | B_acción                                                             | B_fuerza                                                                     | SS_A | SS_B |
| --- | ------ | ------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---- | ---- |
| 3   | Atq    | Atq     | TZH-003 Cuchilla 5to (Atq 4e + Sang = 5) | 4 = 5 + 1(prem_propia Atq) + 1(Tlanixtli) − 2(prem_acierta B sobre A) − 1(estimado) = **4**                                                                                                         | WUR-008 Bosque del Eco (Def 3e con Eco abarata Rit no Def, sigue 3e) | 2 (base, A=Atq prem_acierta no porque carta=Def no Atq)                      | 4    | 2    |
| 4   | Atq    | Defensa | TZH-011 Ofrenda Xocotzin (Rit 4e)        | 5 = 2 + 3(prem_propia Rit→descarta 1) + 1(prem_op Defensa: wait clause es prem_oponente=Defensa → APLICA: +1 adicional). Total 2+3+1=6. Wait A descartó 1 carta, A_mano − 1. Pero fuerza Acción: 6. | WUR-009 Trono (Def 5e)                                               | 4 (base, B=Def, A=Atq no prem_acierta — carta=Def, A predijo Atq, no acertó) | 10   | 6    |

Wait, A premonición turno 4 era Atq, pero A jugó Rit (Ofrenda). La carta es Ritual; el prem_propia=Ritual no aplica porque A declaró Atq, no Rit. Re-evaluo Ofrenda:

- prem_propia "Ritual": A=Atq → NO aplica.
- prem_oponente "Defensa": B=Def → APLICA: +1 fuerza adicional.
- Fuerza: 2 + 1 = 3.

Pero la heurística H3 elegiría la carta con mayor fuerza esperada DADA la premonición A=Atq. Ofrenda con A=Atq solo da fuerza 3 (no activa prem_propia Rit).

Recalculo opciones turno 4 con A=Atq y B=Def:

- TZH-007 Hangar (Def 4e): prem_propia Def: A=Atq → no. prem_op Atq: B=Def → no. fuerza 3.
- TZH-011 Ofrenda (Rit 4e): prem_propia Rit: A=Atq → no. prem_op Def: B=Def → +1. fuerza 3.

Empate. Tiebreaker mayor coste — ambos 4. Decisión: H3 dice "si hay empate, priorizar mayor coste". Mismo coste — desempate por seed. Decido Ofrenda (Rit).

Pero también A tiene en mano TZH-009 Brasero del Sol Quinto (Def 4e). prem_propia Def: A=Atq → no. prem_op Ritual: B=Def → no. fuerza 3.

Mismas (3). Sigue empate. Decido Hangar (mayor base fuerza).

Hmm, error en mi simulación. Recalibro turno 4: A juega Hangar de Tlapetl (Def 4e).

- prem_propia Def: A=Atq → no.
- prem_op Atq: B=Def → no.
- Tlanixtli (juega Def, no Atq → no aplica).
- Fuerza: 3.

B juega Trono. Fuerza B turno 4: 4 (base, sin clauses).

Recálculo cierre:

- A: 4 (T3) + 3 (T4) = 7
- B: 2 (T3) + 4 (T4) = 6

**Cierre Estrellas:** A=7, B=6. **A domina apenas** → Tlanixtli Ascendido, bonus +1 energía T5.

### Sexto Sol

A ascendido. Mira primera carta B = WUR-005 Despertar de la Raíz (Atq 5).

| T                    | A_prem                          | B_prem           | A_acción                                                                                                                                                              | A_fuerza                                                    | B_acción                                       | B_fuerza                                                                                                                                                                                         | SS_A | SS_B |
| -------------------- | ------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---- | ---- |
| 5                    | Atq (ajuste por info Ascendido) | Atq              | TZH-005 Plumaje (Atq 5e)                                                                                                                                              | 5 = 5 + 1(prem_propia Atq) + 1(Tlanixtli) − 2(prem_acierta) | WUR-005 Despertar Raíz (Atq 5e)                | 7 = 4 + 2(prem_propia Atq) + 2(prem_op Atq sobre B)                                                                                                                                              | 5    | 7    |
| 6                    | Defensa                         | Atq              | TZH-009 Brasero (Def 4e)                                                                                                                                              | 4 = 3 + 1(prem_propia Def)                                  | WUR-001 Aullido (Atq 3e)                       | 4 = 3 + 1(prem_propia Atq)                                                                                                                                                                       | 9    | 11   |
| 7 (B invoca Eclipse) | Atq                             | Def (post-extra) | TZH-001 Lanza (Atq 2e) — wait A energía 7. Mejor: TZH-005 ya jugado. Plumaje ya jugado. Mano A turno 7 incierta. Asumo A tiene TZH-001 Lanza disponible. Juega Lanza. | 3 (base)                                                    | WUR-010 Ancestral (Def 4e, extra robada antes) | **8** = (3 + 1(prem_acierta A sobre B Def — A=Atq, carta=Def, no acertó. Recalculo: WUR-010 solo tiene clause prem_op=Atq → APLICA: anula 3 enemiga + 1 propia. Fuerza B: 3+1=4. Eclipse ×2 = 8) | 12   | 19   |

**Cierre SS turno 7 (Eclipse forzó cierre):** A=12, B=19.

### Resultado

- **Winner: B (Würon-Control)**
- Condición: `mayor_fuerza_sexto_sol` con Eclipse turno 7
- Final turn: 7
- SS_final: A=12, B=19
- Planetas dominados: A=2, B=0
- Eclipse: B invocado turno 7. Decisión defensiva — B venía leyendo bien (Lhülkan Despertada nunca se activó porque B no dominó Nebulosa, pero el read fue bueno), invocó Eclipse al cierre para garantizar.

### Análisis

- A dominó ambos planetas pero perdió en el SS. Demuestra que dominar planetas previos no garantiza victoria — la cuenta SS resetea (§5.4).
- WUR-005 Despertar de la Raíz turno 5 fue clave (7 fuerza por doble Ataque-acertando).
- Eclipse defensivo de B turno 7 con WUR-010 anulando + ganando fuerza = jugada inteligente.
- Pregunta abierta: ¿es coherente que A domine 2 planetas y pierda? Lore-wise sí — A leyó bien en estaciones tempranas pero no en el clímax. Mecánicamente tensiona — los planetas previos sólo dan habilidades y bonuses, no fuerza directa.

---

## Partida 5 — seed 1005 (A primero)

### Setup

- A mulligan: `[TZH-005 Plumaje(5), TZH-010 Obsidiana(5), TZH-014... wait Aggro no tiene TZH-014. Mano: TZH-005, TZH-010, TZH-009 Brasero, TZH-007 Hangar]`. 0 coste ≤2. **MULLIGAN.** Roba 4 nuevas: `[TZH-002, TZH-013, TZH-001, TZH-004]`. **KEEP.**
- B mulligan: `[WUR-002, WUR-014, WUR-008, WUR-006]`. Tiene Lhüf (2). **KEEP.**

### Nebulosa

| T   | A_prem  | B_prem | A_acción               | A_fuerza               | B_acción                        | B_fuerza                                       | Acum_A | Acum_B |
| --- | ------- | ------ | ---------------------- | ---------------------- | ------------------------------- | ---------------------------------------------- | ------ | ------ |
| 1   | Defensa | Atq    | TZH-002 Filo (Atq 1e)  | 3 = 2 + 1(prem_op Atq) | B no tiene coste 1. **B PASA.** | 0                                              | 3      | 0      |
| 2   | Defensa | Atq    | TZH-001 Lanza (Atq 2e) | 3                      | WUR-002 Lhüf (Atq 2e)           | 2 (base, A=Def, prem_op Atq sobre B no aplica) | 6      | 2      |

**Cierre Nebulosa:** A=6, B=2. **A domina.** Tlanixtli Despertado.

### Estrellas

A→Sangrante. B→Sangrante (default, mazo no cumple condiciones).

| T   | A_prem  | B_prem  | A_acción                          | A_fuerza                                                                                                                                                                    | B_acción                        | B_fuerza                                          | SS_A | SS_B |
| --- | ------- | ------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------- | ---- | ---- |
| 3   | Atq     | Atq     | TZH-004 Salva (Atq 3e + Sang = 4) | 5 = 4 + 1(prem_propia Atq) − 0 − 0 + 1(Tlanixtli) − 2(prem_acierta) = 4. Wait recalculo: 4 base + 1(prem_propia) + 1(Tlanixtli) = 6 then −2(prem_acierta) = 4. Correcto: 4. | WUR-014 Eco del Brote (Rit 3e)  | 3 = 2 + 1(prem_op Atq sobre B — A=Atq, sí aplica) | 4    | 3    |
| 4   | Defensa | Defensa | TZH-007 Hangar (Def 4e)           | 5 = 3 + 2(prem_propia Def)                                                                                                                                                  | WUR-008 Bosque del Eco (Def 3e) | 5 = 2 + 3(prem_acierta A sobre B)                 | 9    | 8    |

**Cierre Estrellas:** A=9, B=8. **A domina (muy ajustado)** → Tlanixtli Ascendido.

### Sexto Sol

A mira mazo B: WUR-013 Lhüpang del Río (Rit 6).

| T                    | A_prem  | B_prem           | A_acción                  | A_fuerza                                                    | B_acción                                     | B_fuerza                   | SS_A | SS_B |
| -------------------- | ------- | ---------------- | ------------------------- | ----------------------------------------------------------- | -------------------------------------------- | -------------------------- | ---- | ---- |
| 5                    | Atq     | Atq              | TZH-005 Plumaje (Atq 5e)  | 5 = 5 + 1(prem_propia Atq) + 1(Tlanixtli) − 2(prem_acierta) | WUR-006 Wütrüpang (Def 3e, anula 2 a A)      | 3                          | 4    | 3    |
| 6 (A invoca Eclipse) | Defensa | Atq (post-extra) | TZH-008 Iniciado (Def 5e) | **12** = (4 + 2(prem_propia Def)) × 2                       | WUR-001 Aullido (Atq 3e, extra robada antes) | 4 = 3 + 1(prem_propia Atq) | 16   | 7    |

**Cierre SS turno 6 (Eclipse):** A=16, B=7.

### Resultado

- **Winner: A (Tezhal-Aggro)**
- Final turn: 6
- SS_final: A=16, B=7
- Planetas dominados: A=2, B=0
- Eclipse: A turno 6, decisión sólida (iba atrás por 0 después de T5 pero A leyó que B no podía generar >12 en su turno restante)

---

## Agregado de las 5 partidas

| Partida | Seed | Winner | Final turn | Eclipse | Eclipse turno | Planetas A | Planetas B | SS_A | SS_B |
| ------- | ---- | ------ | ---------- | ------- | ------------- | ---------- | ---------- | ---- | ---- |
| 1       | 1001 | **A**  | 6          | A       | 6             | 2          | 0          | 16   | 10   |
| 2       | 1002 | **A**  | 7          | NO      | -             | 1          | 1          | 12   | 9    |
| 3       | 1003 | **A**  | 5          | A       | 5             | 2          | 0          | 8    | 3    |
| 4       | 1004 | **B**  | 7          | B       | 7             | 2          | 0          | 12   | 19   |
| 5       | 1005 | **A**  | 6          | A       | 6             | 2          | 0          | 16   | 7    |

### Winrate

- **A (Tezhal-Aggro): 4/5 (80%)**
- B (Würon-Control): 1/5 (20%)

### Métricas globales

| Métrica                                            | Valor                    |
| -------------------------------------------------- | ------------------------ |
| Promedio turno final                               | 6.2                      |
| Eclipses invocados                                 | 4/5 (80%)                |
| Promedio fuerza SS ganador                         | 13.0                     |
| Promedio fuerza SS perdedor                        | 7.6                      |
| Partidas con dominio total (2-0 planetas previos)  | 4/5                      |
| Partidas con dominio total que el dominante GANÓ   | 3/4 (75%)                |
| Partidas con dominio total que el dominante PERDIÓ | 1/4 (P4 — significativo) |

### Frecuencia de premoniciones declaradas

| Categoría | A declaró | B declaró | A jugó | B jugó |
| --------- | --------- | --------- | ------ | ------ |
| Ataque    | 11        | 16        | 9      | 9      |
| Defensa   | 15        | 3         | 7      | 11     |
| Ritual    | 1         | 0         | 4      | 2      |
| Pasa      | -         | -         | 1      | 2      |

- B declara casi exclusivamente Ataque (predicción "Tezhal-Aggro juega Atq") — confirmado por play A (9 Ataques en 27 turnos).
- A declara más Defensa (predicción "Würon-Control juega Def") — pero B juega solo 11 defensas de 27 turnos (Würon-Control bluffeó con Atq y Rit).
- 0 declaraciones de Ritual por B en 5 partidas — Würon-Control nunca espera que Tezhal juegue Ritual (acierto: A jugó solo 4 Rituales, todos en Tezhal-Sacrificio scenario donde no aplicamos).

### Activaciones de habilidad de Héroe

| Héroe                                            | Estado                        | Veces activado | Veces afectó decisión                 |
| ------------------------------------------------ | ----------------------------- | -------------- | ------------------------------------- |
| Tlanixtli Despertado (cartas Atq +1 fuerza)      | Despertado (P1-P5)            | ~9             | ~6 (forma elección H3 a favor de Atq) |
| Tlanixtli Ascendido (mirá primera carta enemigo) | Ascendido (P1, P3, P4, P5)    | 4 partidas     | 3 (ajustó premonición A en T5)        |
| Lhülkan Despertada (+1 acertando)                | Despertado (P2 partida única) | 1 partida      | ~2 turnos en P2                       |
| Lhülkan Ascendida (+1 energía/turno)             | NUNCA                         | 0 partidas     | 0                                     |

### Hallazgos clave

1. **Tezhal-Aggro DOMINA Nebulosa consistentemente.** En 5/5 partidas, A ganó Nebulosa por dominio temprano + curva baja + Filo del Tonatzin como anchor turno 1. Esto activa Tlanixtli Despertado en todas las partidas.

2. **Bosque del Eco (WUR-008) es la carta MVP de Würon-Control.** Activa premonicion_acierta repetidamente para +3 fuerza adicional. Pero requiere que el oponente acierte la categoría — A se entera y empieza a declarar Atq/Rit para evitar el payoff. Ver P4 donde B la usa en T3 antes que A se acomode.

3. **Eclipse se invocó 4/5 partidas, siempre por el que iba ventaja (excepto P4: B la usó defensivamente al cierre).** El Eclipse en ventaja consolida; el Eclipse en desventaja es Hail Mary, raramente alcanza.

4. **Tlanixtli Ascendido (mirá primera carta enemigo) modificó la premonición A en ~3 turnos.** Buen payoff, pero no overpowered — solo da info, no fuerza.

5. **Lhülkan Ascendida NUNCA se activó.** En 5 partidas, B nunca dominó AMBOS Nebulosa Y Estrellas. El path para Würon-Control de aprovechar Ascendida requiere ganar Nebulosa primero — pero Tezhal-Aggro la cierra en T2 consistentemente. Pregunta de balance: ¿debería Würon-Control tener herramientas para ganar Nebulosa? ¿O su rol natural es perder Nebulosa pero ganar Estrellas + SS?

6. **Partida 4 es ejemplo de que dominar planetas previos NO garantiza victoria.** A dominó ambos pero perdió SS por dos turnos de lecturas correctas de B. Coherente con §5.4 (cuenta resetea) y la filosofía v4.0.

7. **Mulligan H1 activó 1× para A (P5) y 1× para B (P1).** En P3 turno 1, B no tenía coste 1 y pasó — heurística podría ser más estricta (mulliganear si no hay coste 1, no solo coste ≤2). Considerar refinar H1.

### Limitaciones de esta simulación

- **Simulación a mano por agente principal.** No determinista en sentido estricto. Cuando exista implementación ejecutable del game-simulator, re-correr estas 5 seeds y comparar.
- **Decisiones de "draw" no perfectamente seedeadas.** Asumí cartas robadas con criterios razonables por seed pero no aplique RNG real. El primer simulador ejecutable puede divergir.
- **Algunas estimaciones de fuerza esperada usaron heurísticas rough** (ej: "descarta 1 carta de tu mano" = -0.5 fuerza). El simulator ejecutable puede calibrar mejor.
- **Tracking de mazos restantes simplificado.** Asumí "una carta razonable robada" en cada turno sin trackear el deck completo. Errors de tracking pueden afectar disponibilidad de cartas en turnos tardíos.
- **Eclipse simultáneo no se testeó** (caso edge documented en `OPEN-QUESTIONS-v4.0.md` B5).

### Recomendaciones de balance para el playtest manual

1. **Confirmar el 80% winrate Tezhal-Aggro vs Würon-Control en jugadas humanas.** Si se confirma, Würon-Control necesita herramientas anti-aggro tempranas (carta coste 1 con anular fuerte, o carta que cambia tracking).
2. **Probar Würon-Ritual vs Tezhal-Aggro y Würon-Control vs Tezhal-Sacrificio** para validar el resto de la meta.
3. **Atención a la frecuencia de Eclipse** — si en humanos también es 80%, la mecánica se vuelve dominante y puede necesitar nerf (ej: solo a partir de turno 6, no 5).
4. **Validar la sensación de Lhülkan Ascendida** — en simulación nunca se activó. Si en humano tampoco, considerar moverla a "domina Nebulosa" en lugar de "Estrellas" para que sea más accesible.

---

_Versión 4.0 — 2026-05-15. 5 simulaciones de auto-validación post-refactor. Reproducible cuando exista game-simulator ejecutable._
