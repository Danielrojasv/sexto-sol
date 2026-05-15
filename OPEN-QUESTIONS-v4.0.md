# OPEN QUESTIONS — Sexto Sol v4.0

> Decisiones que el agente de implementación (Claude Code) **no debe tomar solo**. Acá quedan registradas las ambigüedades, lagunas y micro-decisiones que aparecieron durante el refactor v3.0 → v4.0 y que necesitan tu respuesta antes (o durante) el primer playtest.
>
> Cada entrada tiene: contexto · default propuesto · alternativas viables · impacto si se cambia después.

---

## Bloque A — Decisiones declaradas pendientes en el SPEC (§8)

### A1. Valor exacto del bonus por dominio (más allá de los defaults propuestos)

- **Default actual (GAME-RULES.md §7):**
  - Dominar Nebulosa: robás 1 carta extra al inicio de Estrellas.
  - Dominar Estrellas: empezás el Sexto Sol con +1 energía en el turno 5.
- **Alternativas:**
  - Más fuerte: 2 cartas en lugar de 1.
  - Persistente: +1 energía cada turno del Sexto Sol, no solo turno 5.
  - Asimétrico por raza (Tezhal recibe X, Würon recibe Y).
- **Impacto si se cambia después:** se rebalancean los mazos preconstruidos. Si el bonus es muy fuerte, el dominio de Nebulosa se vuelve auto-victoria. Si es muy débil, no compensa el riesgo de comprometerse temprano.
- **Espacio para tu decisión:** \_

### A2. ¿El Sexto Sol debería tener su propia regla especial o queda neutral?

- **Default actual:** neutral. El Sexto Sol no tiene reglas especiales; es clímax mecánicamente plano.
- **Alternativas:**
  - Energía +2 a partir de turno 6 (intensidad cosmológica).
  - Doble robo en turno 5 (entrada al Sexto Sol).
  - Costo de cartas Ritual = 0 en turno 7 (ofrenda final).
- **Impacto si se cambia después:** afecta la curva de tensión narrativa. Default neutral hace que el Eclipse sea LA decisión del clímax. Una regla especial diluye eso.
- **Espacio para tu decisión:** \_

### A3. Reglas finas de resolución cuando dos condicionales de una carta entran en conflicto

- **Default actual (GAME-RULES.md §4.1):** condicionales se resuelven en el orden listado en la carta (premonicion_propia → premonicion_oponente → premonicion_acierta), aditivamente. Si dos efectos modifican fuerza, ambos suman.
- **Caso problemático:**
  - Una carta dice "SI premonicion_propia=X: +2 fuerza" y "SI premonicion_acierta: -3 fuerza". Ambos pueden activarse simultáneamente. ¿Aditivo (-1 neto)? ¿Solo el más restrictivo? Default actual: aditivo.
- **Alternativas:**
  - Solo el efecto más restrictivo aplica.
  - Bandera por carta indicando "modo de resolución" (exclusivo vs aditivo).
- **Impacto si se cambia después:** afecta el cálculo de fuerza esperada en simulator. Si cambias el modo, hay que recalcular cards que combinan condicionales positivos + negativos (TZH-003, TZH-005, TZH-010, TZH-014).
- **Espacio para tu decisión:** \_

### A4. ¿"Ritual" como categoría necesita treatment especial en cartas?

- **Contexto:** Ataque y Defensa son intuitivos. Ritual es la categoría "todo lo demás" y puede sentirse vacía.
- **Default actual:** Ritual existe como categoría independiente con cartas que ofrecen payoffs únicos (robo de carta, descarte propio por fuerza explosiva).
- **Alternativas:**
  - Ritual se renombra a algo más específico (Sacrificio para Tezhal, Lectura para Würon).
  - Ritual se elimina y se reparte entre Ataque/Defensa con flags.
- **Impacto si se cambia después:** rediseño parcial del pool. La premonición se simplifica a binaria (Ataque/Defensa).
- **Espacio para tu decisión:** \_

### A5. Curva exacta de energía (lineal 1-6 vs alternativas)

- **Default actual:** lineal. Turno N = N energía, hasta turno 7 = 7.
- **Alternativas:**
  - Cap a 6 (no se llega a turno 7 con 7 energía).
  - Plateau en mid: 1, 2, 3, 4, 4, 5, 6 (más decisiones en mid-game).
  - Curva exponencial leve: 1, 2, 3, 4, 6, 8 (cartas caras explotan tarde).
- **Impacto si se cambia después:** afecta diseño de cartas caras (TZH-014@6, WUR-013@6). Si el cap es 6, son jugables exactamente 1 turno en partida normal (turno 6 o 7).
- **Espacio para tu decisión:** \_

### A6. Tamaño de mano cap

- **Default actual:** no hay cap explícito en GAME-RULES v4.0 (eliminado en sustracción radical).
- **Caso problemático:** si el jugador roba 1/turno y juega 1/turno, mano se mantiene constante. Pero con bonus de dominio (carta extra) + Estrella Silenciosa (carta extra) la mano crece.
- **Alternativas:**
  - Cap 7 (heredado de v3.0).
  - Cap 5 (forzar decisiones de descarte).
  - Sin cap.
- **Impacto si se cambia después:** afecta el valor de cards que generan robo extra (WUR-011 Susurro, WUR-008 Bosque del Eco).
- **Espacio para tu decisión:** \_

---

## Bloque B — Ambigüedades detectadas durante el refactor

### B1. Scope temporal de las reglas de Estrella

- **Contexto:** §5.8 del SPEC dice "regla especial que afecta solo al jugador que lo eligió", sin scope temporal.
- **Default que escribí en GAME-RULES.md §8 y stars.yaml:** las reglas de Estrella aplican solo durante el tramo Estrellas (turnos 3-4). En el Sexto Sol vuelven las reglas neutrales.
- **Alternativa:** las reglas de Estrella persisten hasta el final de la partida (Estrella Silenciosa: NUNCA podés jugar Defensas el resto de la partida).
- **Por qué importa:** Estrella Silenciosa con scope permanente cambia drásticamente la simulación. Si elegís esa estrella, te comprometés con un mazo sin Defensas el resto del juego — esa es una decisión MUCHO más densa que "no Defensas por 2 turnos".
- **Espacio para tu decisión:** \_

### B2. Stack del bonus de dominio Estrellas (+1 energía turno 5) con Lhülkan Ascendida (+1 energía cada turno)

- **Contexto:**
  - §7 GAME-RULES: dominar Estrellas → +1 energía en turno 5.
  - §6 GAME-RULES: Würon Ascendida → +1 energía cada turno.
  - Si Würon domina Estrellas, recibe AMBOS bonuses. ¿Stackean (+2 energía turno 5) o solo aplica el de mayor magnitud (+1)?
- **Default propuesto:** stackean. El turno 5, Würon que dominó Estrellas tiene 5 + 1 (bonus) + 1 (pasiva) = 7 energía.
- **Alternativa:** solo el de mayor magnitud o el más reciente. Habría que documentar prioridad explícita.
- **Impacto si se cambia:** rebalanceo del payoff Würon-Ascendida. Si stackean, Würon-Ritual gana muchísima fuerza en turno 5 (puede jugar Rituals coste 6 con seguridad).
- **Espacio para tu decisión:** \_

### B3. Tlanixtli Ascendido — "una vez por turno, mirá la primera carta del mazo del oponente". ¿En qué momento del turno?

- **Contexto:** la habilidad no especifica timing dentro del turno.
- **Default propuesto:** antes de la declaración de premonición (te ayuda a decidir tu lectura).
- **Alternativa:** después de premonición pero antes de Acción (te ayuda a decidir qué jugar).
- **Por qué importa:** si es antes de premonición, vale mucho más (info temprana). Si es antes de Acción, vale menos (premonición ya está fija, solo afecta elección de carta).
- **Espacio para tu decisión:** \_

### B4. Lhülkan Despertada — "+1 fuerza adicional este turno cuando tu premonición acierta". Alcance de "este turno"

- **Contexto:** la habilidad no especifica si el +1 aplica a la Acción jugada este turno o se acumula al total del planeta.
- **Default propuesto:** el +1 se suma a la fuerza de la Acción jugada este turno (forma natural de leer "este turno"). Si la fuerza final de la carta era 4, queda en 5. Se acumula al total del planeta de manera normal.
- **Alternativa:** el +1 va directo al total del planeta, independiente de la Acción.
- **Impacto:** prácticamente equivalente para acumulación, pero distinto si una carta enemiga anula la fuerza de tu Acción. Si el +1 está en la Acción, puede ser anulado. Si está en el total, no.
- **Espacio para tu decisión:** \_

### B5. ¿Qué pasa si ambos invocan Eclipse en el mismo turno?

- **Contexto:** §9 SPEC dice "en cualquier turno del Sexto Sol, al inicio de la declaración de premonición, cualquier jugador puede declarar 'Invoco el Eclipse'". Si ambos lo declaran simultáneamente, ¿qué pasa?
- **Default propuesto:** solo uno puede invocar — el primero en declarar gana la prioridad. Si es genuinamente simultáneo (interactivo: no es claro quién dijo primero), resolver por seed (en simulación) o por moneda (en playtest manual).
- **Alternativa A:** ambos efectos stackean (Acción cuenta ×4, oponente roba 2 extras cada uno).
- **Alternativa B:** se cancelan (ninguno aplica, turno normal).
- **Impacto:** edge case raro pero importante para el simulador. Sin definición se rompe el determinismo.
- **Espacio para tu decisión:** \_

### B6. Descarte forzado al oponente — ¿elegido por el oponente o aleatorio?

- **Contexto:** varias cartas dicen "el oponente descarta 1 carta" (TZH-001, TZH-015, WUR-013). El SPEC no aclara.
- **Default propuesto:** el oponente elige qué descartar (más estratégico, jugador conserva control sobre su mazo).
- **Alternativa:** aleatorio (más punzante, descarte vale más).
- **Impacto:** afecta el valor real del descarte forzado en la fuerza esperada (Heurística 3 del simulator). Si es aleatorio, +0.5 sube a +0.8.
- **Espacio para tu decisión:** \_

### B7. ¿Cómo se trata "anula N fuerza" si N excede la fuerza base de la carta enemiga?

- **Contexto:** cartas como WUR-010 Raíz Ancestral dicen "anula 3 fuerza enemiga". Si la carta enemiga tiene fuerza base 2, ¿queda en -1 o en 0?
- **Default propuesto:** la fuerza no baja de 0. Cualquier exceso se pierde.
- **Alternativa:** fuerza puede ser negativa, restando del acumulado del jugador.
- **Impacto:** si la fuerza puede ser negativa, hay un meta-juego de "ataque que destruye fuerza acumulada", que cambia drásticamente la economía.
- **Espacio para tu decisión:** \_

### B8. ¿Las habilidades pasivas del Héroe interactúan con las reglas de Estrella?

- **Contexto:** ej. Würon Ascendida elige Estrella Silenciosa → "no podés jugar Defensas + 1 energía extra/turno". ¿La carta extra que da Lhülkan Ascendida (vía dominio Estrellas) se aplica antes o después del extra de Silenciosa?
- **Default propuesto:** orden de aplicación = en el orden en que se ganaron. Bonus de dominio (al cierre de Nebulosa) → carta extra inicial al entrar a Estrellas. Estrella Silenciosa (elegida al inicio de Estrellas) → carta extra al inicio del tramo. Ambas pueden aplicar.
- **Alternativa:** solo una aplica (la última ganada).
- **Espacio para tu decisión:** \_

---

## Bloque C — Decisiones que tomó el agente durante el refactor (confirmar o revertir)

### C1. Pool de cartas v3.0 — copia en vez de move

- **Contexto:** §10.1 SPEC dice "mover" `src/data/cards/` a `/docs/archive/cards-v3.0/`. Pero `src/` tiene código TS (interpreter, store) que **importa** esos JSONs en tiempo de compilación. Moverlos rompería el build.
- **Decisión que tomé:** **copié** (no moví). `docs/archive/cards-v3.0/` ahora es una copia histórica; `src/data/cards/` sigue intacto y el código TS v3.0 sigue compilando.
- **Confirmar:** ¿OK así, o querés que mueva y rompa el build de v3.0 hasta que la implementación TS migre a v4.0?
- **Recomendación:** dejarlo como está (copia). El playtest v4.0 es manual y no usa `src/`. El refactor del código TS a v4.0 amerita su propia spec.

### C2. CLAUDE.md actualizado a v4.0

- **Contexto:** `CLAUDE.md` describía el juego en estado v2.0/v3.0 (HP, 30 cartas, 4 razas activas, Edades). Quedaba en contradicción directa con v4.0.
- **Decisión que tomé:** actualicé las secciones 1-2 del CLAUDE.md a v4.0 con scope mínimo (peregrinaje, 2 razas activas, premonición). Preservé SDD, autoridad narrativa, stack técnico, sensibilidad cultural.
- **Confirmar:** ¿OK actualizar CLAUDE.md, o querés mantenerlo en v3.0 hasta que el código TS migre?

### C3. Heroes — formato 4 entradas (1 por estado activo) vs 2 entradas (1 por raza)

- **Contexto:** el SPEC tiene contradicción interna. §6.2 dice "4 cartas de Héroe (1 por raza × 2 estados activos)" pero también dice "Cada carta lista las 2 habilidades pasivas".
- **Decisión que tomé:** seguí el conteo (§9 criterios de aceptación dice "4 cartas de Héroe creadas"). `heroes.yaml` tiene 4 entradas: Tezhal Despertado, Tezhal Ascendido, Würon Despertado, Würon Ascendido. Cada entrada describe UN estado activable.
- **Alternativa:** 2 entradas (1 por raza), cada una con los 2 estados listados internamente. Más cercano a la idea de "un solo héroe que transforma".
- **Confirmar:** ¿formato actual OK, o consolidar a 2 cartas?

### C4. Distribución de coste en pool — flex como buckets adicionales

- **Contexto:** §6.2 dice "3 cartas costo 1-2, 6 cartas costo 3-4, 4 cartas costo 5-6, 2 cartas 'flex' (cualquier coste razonable)". Suma 15. Las flex se podrían distribuir en cualquier bucket.
- **Decisión que tomé:** las 2 flex de Würon cayeron en costo 5 (WUR-005, WUR-015 a coste 5). Las de Tezhal en costo 4 y 5 (TZH-007, TZH-012).
- **Impacto:** Würon tiene curva pesada en 5+ (6 cartas costo 5-6), Tezhal más balanceada.
- **Confirmar:** ¿OK, o re-distribuir flex a otras zonas (ej: más cartas costo 1-2)?

### C5. Pool de cartas vive en `docs/playtest/cards-v4.0/<raza>.yaml`

- **Contexto:** el SPEC §6.4 dice "Cada mazo en YAML, en /docs/playtest/decks-v4.0/" pero NO especifica dónde viven las cartas individuales.
- **Decisión que tomé:** un archivo YAML por raza (tezhal.yaml, wuron.yaml) en `docs/playtest/cards-v4.0/`. Héroes y estrellas en `heroes.yaml` y `stars.yaml` del mismo directorio.
- **Alternativa:** un archivo por carta (`docs/playtest/cards-v4.0/tezhal/TZH-001.yaml`, etc.). Más granular para diff, más fragmentado.
- **Confirmar:** ¿formato actual OK, o granular por carta?

---

_Vivo. Última actualización: 2026-05-15 (post-refactor v3.0 → v4.0)._
