# OPEN QUESTIONS — Sexto Sol v4.1

> Decisiones que el agente de implementación (Claude Code) **no debe tomar solo**. Estas preguntas aparecieron al redactar v4.1 y necesitan tu respuesta antes (o durante) el primer playtest.
>
> Cada entrada tiene: contexto · default propuesto · alternativa · cómo se resuelve.

---

## Q1. Orden de acción y premonición en el turno

§7 del GAME-RULES v4.1 propone: primero **acción oculta**, después **premonición pública**. En conversaciones previas se discutió lo opuesto (primero premonición, después acción). ¿Cuál orden conviene?

- **Default propuesto:** acción primero, premonición después. Razón: la premonición declarada DESPUÉS de comprometer la carta es más pura como lectura (no estás reaccionando a tu propia carta).
- **Alternativa:** premonición primero, acción después. La premonición declarada antes condiciona qué carta jugás (sobre todo en cartas con `premonicion_propia`).
- **Cómo se resuelve:** en el primer playtest. Si la decisión de premonición se siente vacía (porque ya jugaste la carta y la premonición no afecta nada), invertir.

**Espacio para tu decisión:** \_

---

## Q2. ¿Las cartas de Planeta son seleccionables o aleatorias?

¿Al inicio de cada tramo no-final, los 3 planetas se muestran de un pool fijo (siempre los mismos 3) o se sortean de un pool más grande?

- **Default propuesto:** pool fijo de 3 por tramo (mismas cartas siempre). Razón: simplicidad, predictibilidad de aprendizaje. El v4.1 spec define exactamente 3 cartas por tramo (Nebulosa: PLN-NEB-ATQ/DEF/RIT; Estrellas: PLN-EST-ATQ/DEF/RIT).
- **Alternativa:** pool más grande (ej: 6 planetas por tramo) de los cuales el cosmos elige 3 al azar al inicio de cada partida — agrega variabilidad estratégica.
- **Impacto si se cambia:** requiere diseñar más planetas (~6 extra) y agregar mecánica de sorteo + seed reproducible.

**Espacio para tu decisión:** \_

---

## Q3. ¿Qué pasa si en Estrellas elijo la misma categoría de planeta que en Nebulosa?

¿Está permitido?

- **Default propuesto:** sí, permitido. Es estrategia válida ir all-in en una categoría a costo de descuidar las otras dos. El walkthrough §11 lo muestra: Ana elige planeta-Atq en Nebulosa Y en Estrellas para empujar su Fuerza.
- **Alternativa:** no permitido. Forzar variedad estratégica (debés trabajar al menos 2 atributos a lo largo del peregrinaje).
- **Cómo se resuelve:** playtest, ver si Tezhal-Aggro all-Atq es demasiado dominante.

**Espacio para tu decisión:** \_

---

## Q4. ¿El bonus de planeta (+1) se aplica antes o después de las condicionales de la carta?

¿La fuerza final es `(base + condicionales) + bonus`, o se aplica el bonus al base antes de condicionales que escalen?

- **Default propuesto:** después. Bonus es lo último que se aplica, no se ve afectado por condicionales que digan "duplica la fuerza" o similares.
- **Alternativa:** antes. El bonus se considera parte del base efectivo y se ve potenciado por condicionales que multiplican.
- **Impacto:** si una carta tuviera condicional "duplica fuerza", el orden cambia el resultado. Pero ninguna carta del pool actual tiene condicionales multiplicativos. Mantengo default.

**Espacio para tu decisión:** \_

---

## Q5. ¿Cuántas cartas máximo en mano?

Si el jugador roba 1 por turno y nunca descarta, en el turno 7 podría tener hasta 10 cartas en mano. ¿Hay límite?

- **Default propuesto:** límite de 7 en mano. Si vas a robar y ya tenés 7, no robás (la carta queda en el mazo).
- **Alternativa A:** sin cap. Las decisiones tardías valen más con más opciones.
- **Alternativa B:** cap 5. Forzar decisiones de descarte cada turno.
- **Impacto:** afecta el valor real de cartas que generan robo extra (Eclipse roba 1 extra, WUR-008 Bosque del Eco con robo, WUR-011 Susurro).

**Espacio para tu decisión:** \_

---

## Q6. Bonus de planeta y Eclipse

Si invoco Eclipse y la carta es de la categoría de mi planeta-elegido — espera, **¿este caso puede ocurrir?** El Eclipse se invoca en el Sexto Sol, y en el Sexto Sol no hay elección de planeta. Por lo tanto, no hay bonus de planeta en Eclipse.

> Esta pregunta se vuelve trivial: bonus de planeta solo aplica en Nebulosa y Estrellas. Eclipse solo en Sexto Sol. No hay interacción.

**Espacio para tu decisión:** _resolved by design — no interaction possible._

---

## Q7. Información disponible al elegir planeta inicial

Al inicio de Nebulosa, ¿el jugador elige planeta **después de robar mano inicial** y aplicar mulligan, o **antes**?

- **Default propuesto:** después. Mulligan ocurre primero, luego cada jugador mira su mano de 4 cartas y elige planeta basándose en lo que tiene.
- **Alternativa:** antes. Elección a ciegas, más random.
- **Esto NO está documentado explícitamente en GAME-RULES.md** — vale registrar el default.

**Espacio para tu decisión:** \_

---

## Q8. ¿La elección de planeta de Estrellas se hace antes o después de robar el turno 3?

Misma idea que Q7 pero para el segundo tramo.

- **Default propuesto:** antes de robar el turno 3, inmediatamente después del cierre de Nebulosa. La elección se basa en la mano que tenés tras los 2 turnos de Nebulosa + cualquier carta jugada.
- **Alternativa:** después de robar turno 3 (mano un poco más informada).

**Espacio para tu decisión:** \_

---

## Q9. ¿El empate por atributo individual influye en algo más allá del 2-de-3?

En §10 del GAME-RULES, "empate en un atributo individual: ese atributo se considera no ganado por ninguno". Si Ana tiene Fuerza 10 y Bruno tiene Fuerza 10, ese atributo es 0-0. ¿Eso influye en algún tiebreaker?

- **Default propuesto:** no influye más allá del tally. El atributo empatado simplemente no cuenta en la cuenta de "2 de 3". Tiebreakers (§10.1): suma total > estado de héroe > empate técnico.
- **Alternativa:** empate cuenta para ambos (1 para A, 1 para B), pero entonces el resultado puede ser raro (3 atributos, A gana 2, empata 1, B gana 0 → A "gana" pero ¿con qué fuerza?).
- **Mantengo default por simplicidad.**

**Espacio para tu decisión:** \_

---

## Q10. ¿Qué pasa si un jugador "Pasa" (no puede pagar carta) durante un tramo?

Si jugué "Pasa" en un turno, ¿qué pasa con:

- Bonus de planeta? No aplica (no jugué carta).
- Premonición? Sí, igual declaro.
- Acumulación de atributos? Cero este turno.

- **Default propuesto:** Pasa significa "no agrego nada a ningún atributo este turno". La premonición igual se declara (el oponente debe poder leer mi tendencia).
- **Alternativa:** si pasás, no declarás premonición (pierdes ambos lados del turno).
- **Mantengo default — la premonición sigue siendo recurso del jugador aunque pase.**

**Espacio para tu decisión:** \_

---

## Q11. ¿Las habilidades pasivas del héroe interactúan con el bonus de planeta?

Ejemplo: Tezhal Despertado da "+1 fuerza adicional a cartas Ataque". Si Ana elige planeta-Ataque, ¿la carta Ataque recibe +1 (Despertado) Y +1 (bonus planeta), sumando +2?

- **Default propuesto:** sí, ambos bonos se suman (acumulativo). Una carta Atq con base 3, con Despertado activo + planeta-Atq elegido = 3 + 1 (Despertado) + 1 (planeta) = 5.
- **Alternativa:** solo uno aplica (el mayor) — pero ambos son +1, así que sería arbitrario.

**Espacio para tu decisión:** \_

---

_Vivo. Última actualización: 2026-05-15 (post-redacción v4.1). Q6 resuelta por diseño. Q1-Q5 son las del spec original. Q7-Q11 son las que detecté al redactar el GAME-RULES._
