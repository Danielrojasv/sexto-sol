# Prompt 1 — Auditoría de las 42 cartas vs GAME-RULES v3.0

**Fecha:** 2026-05-10
**Alcance:** rediseño bajo v3.0 de las 42 cartas existentes. Sólo propuesta — ningún JSON modificado todavía.

---

## Resumen ejecutivo

| Categoría                                              | Cantidad | Comentario                                                                                                                                                                             |
| ------------------------------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cartas que sólo necesitan **formalizar keyword firma** | 17       | Ya implementan la mecánica firma como ability ad-hoc; reemplazar por keyword v3.0 + ajuste leve de stats.                                                                              |
| Cartas con **stats fuera de ratio** (>1 punto)         | 14       | Mayoría sub-rateadas (6) o sobre-rateadas (8).                                                                                                                                         |
| Legendarias con **Luz/Sombra** que hay que colapsar    | 3        | Inka-untay Tutelar, Lhwentrü, Xolot — colapsar a habilidad individual única + keyword firma.                                                                                           |
| Cartas **off-category intencional** (flag ya presente) | 6        | Preservar (lanza-solar, resonancia, cuchilla-lhuf, bosque-del-eco, susurro-del-bosque, cuchilla-espejo, inmersion-aurea).                                                              |
| **Refluencia v2.0 → v3.0**                             | 8        | Todos los Zaqe con `on_destroy shuffle_to_deck` se convierten a keyword `refluencia` canónica (revivir desde Pozo Astral pagando costo). Ojo: cambio mecánico real, no sólo cosmético. |
| Cartas con **rename pendiente Prompt 5**               | 6        | Inka-untay, Mit'a-wasi, Mañke, Ofrenda del Cuauhtli, Xolot Cuauhtli Ardiente, y revisar flavor de otras.                                                                               |

**Cambios mecánicos reales vs cosméticos:** la gran mayoría son cosméticos (formalizar keyword + ajuste de ±1-3 stats). Los dos cambios de fondo son:

1. **Refluencia Zaqe** pasa de "auto-shuffle al mazo al morir" (gratis, opaco) a "ir a Pozo Astral; pagar costo en Despliegue para revivir; segunda muerte → Disolución" (con costo, transparente, terminal). Las 8 cartas Zaqe afectadas funcionarán distinto en juego.
2. **Legendarias** pierden la dualidad Luz/Sombra. Hay que elegir cuál de las dos habilidades sobrevive (o fusionarlas en una única más potente).

---

## Convención de notación

Cada entrada sigue este formato:

```
NN. <Nombre>  [raza • tipo • costo • rareza]
   Stats actuales:    F/HP   (ratio actual vs esperado v3.0)
   Profile actual:    vanilla / kw_only / hab_only / kw+hab
   Issue:             [resumen]
   Cambia:            [lista de cambios]
   Mantiene:          [lista de cosas preservadas]
   Justificación:     [por qué]
```

Stats target derivados de **sec 6.4** (vanilla = costo×3+1; kw = ×3; hab = ×2.5; kw+hab = ×2). Aplica sólo a Naves.

---

## QURALAN (11 cartas)

### 1. Centinela Pétreo [quralan • ship • 1 • rare]

- Stats actuales: **2/4** (sum 6) | profile actual: **hab_only** (ability: for_each Q'ralan +1 str perm)
- Issue: la habilidad ES Formación Solar canónica. Profile real debería ser kw_only. Stats sobre-rateados (esperado 1×3 = 3).
- **Cambia:**
  - keywords: `[]` → `[formacion_solar]`
  - abilities: borrar (la keyword cubre el efecto)
  - rarity: `rare` → `common` (kw_only sin habilidad individual no justifica rare per 6.5)
  - stats: 2/4 → **1/2**
- **Mantiene:** nombre, flavor, costo, tipo, art slot.
- **Justificación:** el efecto era Formación Solar disfrazada. Formalizar libera espacio para que ships rare reales (con kw + hab) tengan cuerpo distintivo.

### 2. Escolta T'awa-pampa [quralan • ship • 3 • common]

- Stats actuales: **3/4** (sum 7, esperado vanilla 10) | profile actual: **vanilla**
- Issue: vanilla con stats 3 puntos por debajo del ratio.
- **Cambia:**
  - keywords: `[]` → `[formacion_solar]` (flavor "cuatro escuadrones, una sola órbita" pide masa)
  - stats: 3/4 → **4/5** (ratio 9 = 3×3 para kw_only)
- **Mantiene:** rarity common, flavor, abilities `[]`.
- **Justificación:** convertirla en vehículo común de Formación Solar la integra a la identidad acumulativa de la raza sin agregar habilidad individual.

### 3. Inka-untay Tutelar [quralan • ship • 6 • legendary]

- Stats actuales: **7/10** (sum 17, esperado kw+hab 12) | profile actual: **kw+hab** (Luz: search Q'ralan a mano; Sombra: Formación Solar)
- Issue: Luz/Sombra removida en v3.0. Stats sobre-rateados +5.
- **Cambia:**
  - keywords: `[bastion]` → `[bastion, formacion_solar]`
  - abilities: colapsar a una sola → "Al desplegar: buscás 1 nave Q'ralan en tu mazo y la sumás a tu mano." (preservo Luz, descarto Sombra ya cubierta por keyword)
  - stats: 7/10 → **5/7** (ratio 12 = 6×2 para kw+hab)
  - Rename pendiente Prompt 5 ("Inka").
- **Mantiene:** legendary, costo 6, flavor, rol definidor de mazo.
- **Justificación:** la Sombra Formación Solar ya está en la keyword; la Luz tutor es el "valor único" que justifica legendaria.

### 4. Lanza Solar K'iri [quralan • weapon • 1 • common]

- No aplica balance ratio (weapon).
- Issue: ninguno material. `intentionalOffCategory: true` ya marcado.
- **Cambia:** nada.
- **Mantiene:** todo.
- **Justificación:** weapon de utilidad común que da Vuelo permanente. Coherente.

### 5. Mit'a-wasi Coordinador [quralan • ship • 4 • rare]

- Stats actuales: **4/5** (sum 9, esperado kw+hab 8) | profile actual: **hab_only** (on_play conditional ≥3 Q'ralan → all Q'ralan +1 str perm)
- Issue: rare debería tener kw + hab per 6.5. Stats levemente sobre.
- **Cambia:**
  - keywords: `[]` → `[formacion_solar]`
  - abilities: preservar (la habilidad condicional sigue como individual; ojo a no contar dos veces el +1 str)
  - stats: 4/5 → **4/4**
  - Rename pendiente Prompt 5 ("Mit'a").
- **Mantiene:** rarity rare, costo, flavor, abilidad individual.
- **Justificación:** la combinación kw firma + payoff condicional ≥3 es el arquetipo de "rare con sinergia con la mecánica firma" de 6.5.

### 6. Phaqcha del Crisol Estelar [quralan • ship • 5 • rare]

- Stats actuales: **5/7** (sum 12, esperado kw+hab 10) | profile actual: **hab_only** (continuous for_each Q'ralan +1 hp self)
- Issue: rare debería tener kw + hab. Habilidad actual es "Formación Solar de HP" — variante única.
- **Cambia:**
  - keywords: `[]` → `[formacion_solar]`
  - abilities: preservar (hab individual = variante HP de Formación Solar). Ojo: el str viene del keyword, el hp del individual.
  - stats: 5/7 → **5/5** (ratio 10)
- **Mantiene:** rarity rare, costo, flavor.
- **Justificación:** la dual-Formación-Solar (str por keyword + hp por hab individual) la convierte en pieza signature de mazos masa Q'ralan.

### 7. Q'aphaq del Cristal Orbital [quralan • ship • 4 • common]

- Stats actuales: **4/6** (sum 10, esperado kw_only 12) | profile actual: **hab_only** (Formación Solar disfrazada)
- **Cambia:**
  - keywords: `[]` → `[formacion_solar]`
  - abilities: borrar
  - stats: 4/6 → **5/7** (+1/+1, ratio 12)
- **Mantiene:** rarity common, costo, flavor.
- **Justificación:** vehículo medio de Formación Solar. Sub-rateado actualmente.

### 8. Q'illay del Hangar Solar [quralan • ship • 2 • common]

- Stats actuales: **2/3** (sum 5, esperado kw_only 6) | profile actual: **hab_only**
- **Cambia:**
  - keywords: `[]` → `[formacion_solar]`
  - abilities: borrar
  - stats: 2/3 → **3/3** (+1 str, ratio 6)
- **Mantiene:** rarity common, costo, flavor.
- **Justificación:** drop low-cost común de Formación Solar.

### 9. Resonancia del Sumaq-Cristal [quralan • tech • 3 • rare]

- No aplica balance ratio (tech).
- **Cambia:** nada material.
- **Mantiene:** todo. `intentionalOffCategory: true` correcto.
- **Justificación:** tutor a mano por 3 energía es razonable para Q'ralan rare. Permanece.

### 10. Templo K'ana-suyu [quralan • relic • 5 • common]

- No aplica balance ratio (relic).
- Issue: el efecto (cada Würon — perdón, Q'ralan — gana +1 hp por cada otro Q'ralan) es muy potente para un común. Variante HP de Formación Solar global.
- **Cambia:** nada en este pase, pero **flag para playtest**: el efecto puede escalar 4 Q'ralan = +12 hp acumulados. Si rompe el meta, demote a rare o reescribir como buff acotado.
- **Mantiene:** todo, sujeto a observación.
- **Justificación:** decisión de balance se difiere a datos de simulación (Prompt 6/7).

### 11. Vigía del Sumaq-suyu [quralan • ship • 1 • common]

- Stats actuales: **1/3** (sum 4, esperado kw_only 3) | profile actual: **kw_only** (bastion)
- Issue: leve sobrerateo (+1).
- **Cambia:** preservar como está. La diferencia de 1 punto en común con bastion temprano es aceptable como "early-game support" de Q'ralan.
- **Mantiene:** todo.
- **Justificación:** ratio 6.4 es guía, no ley. ±1 en común es ruido tolerable.

---

## TEZHAL (10 cartas)

### 12. Brasa Tlani [tezhal • ship • 1 • common]

- Stats actuales: **2/1** (sum 3, esperado hab_only 2.5) | profile actual: **hab_only** (activated, sacrifice self → ally +2 str fin de turno)
- Issue: el cost es **sacrificar a sí misma** (no a otra ally). No es Ignición canónica, que sacrifica OTRA ally.
- **Cambia:** preservar como **habilidad individual** (no es Ignición). Marcar como variante "self-immolation buff" para diseño.
- **Mantiene:** stats 2/1 (cuadran con hab_only ratio).
- **Justificación:** Ignición canónica = sacrificás otra ally para activar. Brasa Tlani se sacrifica a sí misma — mecánica adyacente pero distinta. Mantener como diseño único hab_only.

### 13. Espejo-Pirámide Tzactli [tezhal • ship • 3 • common]

- Stats actuales: **3/4** (sum 7, esperado kw+hab 6) | profile actual: **hab_only** (activated combate, sacrifice ally → +3 str a self fin de turno)
- Issue: la habilidad ES Ignición (sacrificás otra ally para que el espejo gane str). Falta keyword.
- **Cambia:**
  - keywords: `[]` → `[ignicion]`
  - abilities: preservar la habilidad individual (Ignición: gana +3 str este turno)
  - stats: 3/4 → **3/3** (-1 hp, ratio 6)
- **Mantiene:** rarity common, costo, flavor.
- **Justificación:** formalizar keyword. Stats al ratio kw+hab.

### 14. Hangar de Tlapetl [tezhal • ship • 3 • common]

- Stats actuales: **3/3** (sum 6 = ratio kw+hab) | profile actual: **hab_only** (Ignición → grant Desgarro permanente a ally)
- **Cambia:**
  - keywords: `[]` → `[ignicion]`
  - abilities: preservar
  - stats: preservar (cuadra exacto)
- **Mantiene:** todo lo demás.
- **Justificación:** sólo formalizar keyword. Carta ya balanceada al ratio.

### 15. Iniciado Xocotzin [tezhal • ship • 1 • common]

- Stats actuales: **1/2** (sum 3, esperado kw+hab 2) | profile actual: **hab_only** (Ignición lite)
- **Cambia:**
  - keywords: `[]` → `[ignicion]`
  - abilities: preservar (Ignición: nave aliada gana +1 str este turno)
  - stats: 1/2 → **1/1** (ratio 2)
- **Mantiene:** rarity common, costo, flavor.
- **Justificación:** común barato con keyword + hab. Sub-rateado actualmente.

### 16. Navío Tlanixtli [tezhal • ship • 4 • rare]

- Stats actuales: **5/4** (sum 9, esperado kw+hab 8) | profile actual: **hab_only** (Ignición: 4 dmg a enemy)
- **Cambia:**
  - keywords: `[]` → `[ignicion]`
  - abilities: preservar
  - stats: 5/4 → **4/4** (-1 str, ratio 8)
- **Mantiene:** rarity rare, costo, flavor.
- **Justificación:** rare con keyword + hab cuadra 6.5.

### 17. Obsidiana Ardiente [tezhal • weapon • 2 • rare]

- No aplica balance ratio (weapon).
- **Cambia:** nada.
- **Mantiene:** todo.
- **Justificación:** weapon "loaded" (+2 str perm + grant Desgarro). Apropiado para rare cost 2.

### 18. Ofrenda del Cuauhtli [tezhal • tech • 2 • common]

- No aplica balance ratio (tech).
- **Cambia:** nada mecánico. Rename pendiente Prompt 5 ("Cuauhtli", "Ofrenda" como sustantivo principal).
- **Mantiene:** mecánica (sacrifice ally + draw 2).
- **Justificación:** tech canónica de "sacrificio por cards" coherente con identidad Tezhal aunque no use keyword Ignición (la kw es de naves, no tech).

### 19. Piloto de Obsidiana [tezhal • ship • 2 • common]

- Stats actuales: **2/2** (sum 4 = ratio kw+hab exacto) | profile actual: **hab_only** (Ignición: 2 dmg)
- **Cambia:**
  - keywords: `[]` → `[ignicion]`
  - abilities: preservar
  - stats: preservar.
- **Mantiene:** todo lo demás.
- **Justificación:** sólo formalizar keyword.

### 20. Pirámide Orbital Quetlani [tezhal • relic • 5 • rare]

- No aplica balance ratio (relic).
- **Cambia:** nada.
- **Mantiene:** todo.
- **Justificación:** relic ramp on Tezhal death — sinergiza fuerte con Ignición. Diseño coherente.

### 21. Xolot Cuauhtli Ardiente [tezhal • ship • 6 • legendary]

- Stats actuales: **8/7** (sum 15, esperado kw+hab 12) | profile actual: **hab_only** (Luz: 3 dmg al desplegar; Sombra Ignición: sac + 5 dmg + draw)
- Issue: Luz/Sombra fuera. Stats sobre +3.
- **Cambia:**
  - keywords: `[]` → `[ignicion]`
  - abilities: colapsar a habilidad única → "Al desplegar: hacé 3 daño a una nave enemiga. Ignición: hacé 5 daño a una nave enemiga y robás 1 carta." (Luz preservada como on-play, Sombra preservada como Ignición.)
  - stats: 8/7 → **6/6** (ratio 12)
  - Rename pendiente Prompt 5 ("Cuauhtli").
- **Mantiene:** legendary, costo 6, flavor.
- **Justificación:** legendaria definidora. Las dos cláusulas (entrada + Ignición) caben como una habilidad individual densa.

---

## WURON (11 cartas)

### 22. Bosque del Eco [wuron • relic • 5 • rare]

- No aplica balance ratio (relic).
- Issue (de schema): `target: {kind: self}` sobre relic. Reinterpretar como "tus naves Würon ganan +1 hp por cada otra Würon".
- **Cambia:**
  - actualizar descripción a: "Tus naves Würon ganan +1 HP por cada otra nave Würon que controles."
  - mantener `intentionalOffCategory: true` (acumulativa en raza reactiva — coherente para relic de Würon).
- **Mantiene:** stats N/A, costo, rarity, flavor.
- **Justificación:** ajustar redacción al efecto real. Mecánica preservada.

### 23. Brotador Trülke [wuron • ship • 1 • common]

- Stats actuales: **1/3** (sum 4, esperado kw_only 3) | profile actual: **hab_only** (on damage to ANY of my ships → self +1 str perm)
- Issue: el filtro es "any ally damaged", no "this ship damaged". Külen canónica es self-only.
- **Cambia:**
  - keywords: `[]` → `[kulen]`
  - abilities: borrar (Külen keyword cubre el efecto self-only canónico; el "ally global" ad-hoc se descarta porque rompía la asimetría reactiva-individual).
  - stats: 1/3 → **1/2** (ratio 3)
- **Mantiene:** rarity common, costo, flavor "cada golpe lo enraíza" (el flavor refiere a sí mismo, consistente con Külen).
- **Justificación:** alinear el trigger con la canónica. La variante "ally global" la dejamos para una rare/legendary distinta.

### 24. Cuchilla Lhüf [wuron • weapon • 1 • common]

- No aplica.
- **Cambia:** nada. `intentionalOffCategory: true` correcto.
- **Mantiene:** todo.

### 25. Explorador del Brote [wuron • ship • 2 • common]

- Stats actuales: **2/3** (sum 5, esperado kw_only 6) | profile actual: **hab_only** (igual a Brotador)
- **Cambia:**
  - keywords: `[]` → `[kulen]`
  - abilities: borrar
  - stats: 2/3 → **3/3** (+1 str, ratio 6) — o preservar 2/3 si querés tono "scout frágil".
- **Mantiene:** rarity common, costo, flavor.
- **Justificación:** **Decisión a confirmar:** ¿bumpear a 3/3 (al ratio) o preservar 2/3 (sub-rate intencional para "scout")? Por defecto sugiero 3/3.

### 26. Lhüpang del Río [wuron • ship • 2 • common]

- Stats actuales: **2/4** (sum 6 = ratio kw_only exacto)
- **Cambia:**
  - keywords: `[]` → `[kulen]`
  - abilities: borrar
  - stats: preservar.
- **Mantiene:** todo lo demás.
- **Justificación:** sólo formalizar keyword. Stats ya cuadran.

### 27. Lhwentrü de las Raíces [wuron • ship • 6 • legendary]

- Stats actuales: **7/10** (sum 17, esperado kw+hab 12) | profile actual: **kw+hab** (Luz: draw 1 al desplegar; Sombra: AoE Külen — todos los Würon +1 str cuando una de mis ships recibe dmg)
- Issue: Luz/Sombra fuera. Stats sobre +5.
- **Cambia:**
  - keywords: `[bastion]` (preservar; **no** agregar `kulen` porque la habilidad individual es una **AoE Külen** distinta a la canónica — mantenerla como habilidad para evitar redundancia).
  - abilities: colapsar a → "Al desplegar: robás 1 carta. Cuando esta nave recibe daño y sobrevive, todas tus naves Würon ganan +1 fuerza permanente." (Luz on-play + variante AoE de Külen como habilidad individual)
  - stats: 7/10 → **5/7** (ratio 12)
- **Mantiene:** legendary, costo 6, flavor, rol definidor.
- **Justificación:** legendaria con habilidad ÚNICA potente per 6.5. La AoE Külen es el "qué" de la legendaria — no debería duplicarse con keyword `kulen`.

### 28. Mañke Cazador [wuron • ship • 3 • common]

- Stats actuales: **3/4** (sum 7, esperado kw_only 9) | profile actual: **hab_only**
- **Cambia:**
  - keywords: `[]` → `[kulen]`
  - abilities: borrar
  - stats: 3/4 → **4/5** (+1/+1, ratio 9)
  - Rename pendiente Prompt 5 ("Mañke").
- **Mantiene:** rarity common, costo, flavor.
- **Justificación:** sub-rateado. Bumpear al ratio.

### 29. Ñgepang del Sur [wuron • ship • 4 • common]

- Stats actuales: **4/5** (sum 9, esperado kw_only 12) | profile actual: **hab_only**
- **Cambia:**
  - keywords: `[]` → `[kulen]`
  - abilities: borrar
  - stats: 4/5 → **5/7** (+1/+2, ratio 12)
- **Mantiene:** rarity common, costo, flavor.
- **Justificación:** sub-rateado. Bumpear al ratio.

### 30. Raíz Ancestral [wuron • ship • 5 • rare]

- Stats actuales: **5/7** (sum 12, esperado kw+hab 10) | profile actual: **kw+hab** (bastion + AoE Külen variante)
- **Cambia:**
  - keywords: `[bastion]` preservar. NO agregar `kulen` (la habilidad es AoE Külen, no canónica).
  - abilities: preservar (en este pase) — pero **flag**: el trigger actual ("any of my ships damaged") es global, lo que la hace muy potente. Considerar restringir a "this ship damaged and survives" para alinearla con el patrón legendaria/rare AoE-Külen.
  - stats: 5/7 → **4/6** (ratio 10) o preservar si querés cuerpo más alto. Por defecto sugiero 4/6.
- **Mantiene:** rarity rare, costo, flavor.
- **Justificación:** rare con kw+hab cuadra 6.5. Stats al ratio.

### 31. Susurro del Bosque [wuron • tech • 4 • rare]

- No aplica balance ratio (tech).
- Issue (schema): el efecto literal es ambiguo. Reinterpretar como "Cada una de tus naves Würon gana +1 fuerza permanente por cada otra nave Würon que controles."
- **Cambia:** actualizar descripción.
- **Mantiene:** mecánica, costo, rarity. `intentionalOffCategory: true` correcto.
- **Justificación:** **Flag para playtest** — el efecto, leído literal, es una explosion-buff (4 Würon → +12 str distribuido). Si rompe el meta, escalonar (ej: +1 str por cada Würon, no por cada otro Würon → menos compounding).

### 32. Wütrüpang Resistente [wuron • ship • 3 • common]

- Stats actuales: **3/5** (sum 8, esperado kw_only 9 / kw+hab 6) | profile actual: **kw+hab** (bastion + Külen-disfrazada)
- **Cambia:**
  - keywords: `[bastion]` → `[bastion, kulen]`
  - abilities: borrar (Külen keyword cubre el efecto self-only)
  - stats: preservar 3/5 (ratio kw_only doble es ~9; 8 es aceptable; multi-keyword no tiene fórmula explícita).
- **Mantiene:** todo lo demás.
- **Justificación:** alinear con canónica. Doble keyword (bastion + kulen) es razonable para un common defensivo de Würon.

---

## ZAQE (10 cartas)

> ⚠️ **Cambio mecánico real:** las 8 cartas Zaqe con `on_destroy: shuffle_to_deck self` son Refluencia v2.0 (auto-revive opaca al mazo). v3.0 Refluencia es: **al morir va al Pozo Astral; el jugador paga el costo en Despliegue para revivirla; segunda muerte → Disolución**. Esto cambia el ritmo de juego de Zaqe (revive con costo, terminal a la segunda muerte). Confirmar antes de aplicar.

### 33. Balsa Áurea [zaqe • ship • 2 • common]

- Stats actuales: **2/3** (sum 5, esperado kw_only 6) | profile actual: **hab_only** (shuffle_to_deck on_destroy)
- **Cambia:**
  - keywords: `[]` → `[refluencia]`
  - abilities: borrar
  - stats: 2/3 → **3/3** (+1 str, ratio 6) o preservar 2/3.
- **Mantiene:** rarity common, costo, flavor.
- **Justificación:** Refluencia canónica. Sub-rateado actualmente.

### 34. Bohzhica del Lago de Luz [zaqe • ship • 5 • rare]

- Stats actuales: **5/7** (sum 12) | profile actual: **kw+hab** (bastion + shuffle_to_deck)
- **Cambia:**
  - keywords: `[bastion]` → `[bastion, refluencia]`
  - abilities: borrar
  - stats: 5/7 → **4/6** (ratio kw_only ~10 con doble keyword; ajuste prudente)
- **Mantiene:** rarity rare, costo, flavor.
- **Justificación:** doble keyword fuerte para legendary-ish; mantener rare con stats moderados.

### 35. Cuchilla del Espejo Áureo [zaqe • weapon • 2 • common]

- No aplica.
- **Cambia:** nada.
- **Mantiene:** todo. `intentionalOffCategory: true` correcto.

### 36. Espejo Estelar Sqhaguata [zaqe • ship • 4 • common]

- Stats actuales: **4/5** (sum 9, esperado kw_only 12) | profile actual: **hab_only**
- **Cambia:**
  - keywords: `[]` → `[refluencia]`
  - abilities: borrar
  - stats: 4/5 → **5/7** (+1/+2, ratio 12)
- **Mantiene:** rarity common, costo, flavor.
- **Justificación:** sub-rateado. Bumpear.

### 37. Guata Iridiscente [zaqe • ship • 3 • common]

- Stats actuales: **3/3** (sum 6, esperado kw_only 9) | profile actual: **hab_only**
- **Cambia:**
  - keywords: `[]` → `[refluencia]`
  - abilities: borrar
  - stats: 3/3 → **4/5** (+1/+2, ratio 9)
- **Mantiene:** rarity common, costo, flavor.
- **Justificación:** sub-rateado. Bumpear.

### 38. Hangar de Aguas Doradas [zaqe • relic • 4 • rare]

- No aplica balance ratio (relic).
- **Cambia:** nada.
- **Mantiene:** todo.
- **Justificación:** relic que da ventaja de cards por muerte de Zaqe — sinergiza con nueva Refluencia (los Zaqe que mueren generan card; pagás costo para revivir; vuelven a morir → más cards). Diseño coherente.

### 39. Inmersión Áurea [zaqe • tech • 3 • rare]

- No aplica.
- **Cambia:** nada.
- **Mantiene:** todo. `intentionalOffCategory: true` correcto.
- **Justificación:** recursión desde Pozo Astral coherente con nueva Refluencia.

### 40. Navegante de Sumzhua [zaqe • ship • 1 • common]

- Stats actuales: **1/2** (sum 3 = ratio kw_only exacto)
- **Cambia:**
  - keywords: `[]` → `[refluencia]`
  - abilities: borrar
  - stats: preservar.
- **Mantiene:** todo lo demás.
- **Justificación:** sólo formalizar keyword.

### 41. Sqhanguata Reliquia Solar [zaqe • ship • 5 • common]

- Stats actuales: **5/6** (sum 11, esperado kw_only 15) | profile actual: **hab_only**
- **Cambia:**
  - keywords: `[]` → `[refluencia]`
  - abilities: borrar
  - stats: 5/6 → **7/8** (+2/+2, ratio 15)
- **Mantiene:** rarity common, costo, flavor.
- **Justificación:** muy sub-rateada. Bump grande pero proporcional.

### 42. Sumzhua del Sexto Sol [zaqe • ship • 6 • legendary]

- Stats actuales: **7/7** (sum 14, esperado kw+hab 12) | profile actual: **kw+hab** (shuffle + draw on destroy)
- **Cambia:**
  - keywords: `[]` → `[refluencia]`
  - abilities: colapsar a "Al morir: robás 1 carta." (preservo el draw como habilidad individual; el shuffle se reemplaza por la mecánica canónica de Refluencia)
  - stats: 7/7 → **6/6** (-1 str -1 hp, ratio 12)
- **Mantiene:** legendary, costo 6, flavor, rol definidor.
- **Justificación:** Refluencia + draw on death = motor de cards de partida larga. La identidad de la legendaria se mantiene.

---

## Cambios pendientes Prompt 5 (rename cultural)

| #   | Carta                                                                                             | Término sensible                                 | Nota                                          |
| --- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------- |
| 3   | Inka-untay Tutelar                                                                                | "Inka", "untay"                                  | Rename a término en lengua Q'ralan inventada. |
| 5   | Mit'a-wasi Coordinador                                                                            | "Mit'a", "wasi"                                  | Mit'a = institución andina real.              |
| 18  | Ofrenda del Cuauhtli                                                                              | "Cuauhtli" + "Ofrenda" como sustantivo principal | Cuauhtli = guerrero águila mexica.            |
| 21  | Xolot Cuauhtli Ardiente                                                                           | "Cuauhtli"                                       | Idem.                                         |
| 28  | Mañke Cazador                                                                                     | "Mañke" (mañke = cóndor en mapudungun)           | Rename a término en lengua Würon inventada.   |
| —   | (revisar flavor texts de **Mit'a**, **Tonalli**, **tezontli**, **plumaje**, **escuadrón andino**) | varios                                           | Pase de flavor de Prompt 5.                   |

Confirmar dirección de cada uno antes de aplicar (preferentemente en una segunda pasada cuando se ejecute Prompt 5).

---

## Resumen de cambios de stats

Para revisión rápida — sólo Naves donde stats cambian:

| #   | Carta                       | F/HP actual | F/HP propuesto | Δ                   |
| --- | --------------------------- | ----------- | -------------- | ------------------- |
| 1   | Centinela Pétreo            | 2/4         | 1/2            | -1/-2               |
| 2   | Escolta T'awa-pampa         | 3/4         | 4/5            | +1/+1               |
| 3   | Inka-untay Tutelar          | 7/10        | 5/7            | -2/-3               |
| 5   | Mit'a-wasi Coordinador      | 4/5         | 4/4            | 0/-1                |
| 6   | Phaqcha del Crisol Estelar  | 5/7         | 5/5            | 0/-2                |
| 7   | Q'aphaq del Cristal Orbital | 4/6         | 5/7            | +1/+1               |
| 8   | Q'illay del Hangar Solar    | 2/3         | 3/3            | +1/0                |
| 13  | Espejo-Pirámide Tzactli     | 3/4         | 3/3            | 0/-1                |
| 15  | Iniciado Xocotzin           | 1/2         | 1/1            | 0/-1                |
| 16  | Navío Tlanixtli             | 5/4         | 4/4            | -1/0                |
| 21  | Xolot Cuauhtli Ardiente     | 8/7         | 6/6            | -2/-1               |
| 23  | Brotador Trülke             | 1/3         | 1/2            | 0/-1                |
| 25  | Explorador del Brote        | 2/3         | 3/3            | +1/0 (a confirmar)  |
| 27  | Lhwentrü de las Raíces      | 7/10        | 5/7            | -2/-3               |
| 28  | Mañke Cazador               | 3/4         | 4/5            | +1/+1               |
| 29  | Ñgepang del Sur             | 4/5         | 5/7            | +1/+2               |
| 30  | Raíz Ancestral              | 5/7         | 4/6            | -1/-1 (a confirmar) |
| 33  | Balsa Áurea                 | 2/3         | 3/3            | +1/0 (a confirmar)  |
| 34  | Bohzhica del Lago de Luz    | 5/7         | 4/6            | -1/-1               |
| 36  | Espejo Estelar Sqhaguata    | 4/5         | 5/7            | +1/+2               |
| 37  | Guata Iridiscente           | 3/3         | 4/5            | +1/+2               |
| 41  | Sqhanguata Reliquia Solar   | 5/6         | 7/8            | +2/+2               |
| 42  | Sumzhua del Sexto Sol       | 7/7         | 6/6            | -1/-1               |

23 cartas con cambio de stats / 10 sin cambio de stats / 9 sin stats (weapons/tech/relic).

---

## Decisiones que requieren tu OK antes de aplicar

1. **Refluencia canónica v3.0** — confirmar que las 8 cartas Zaqe pasan de "shuffle al mazo gratis" a "revivir desde Pozo Astral pagando costo, exilio a la segunda muerte". Cambio de ritmo de juego real.
2. **Demote de Centinela Pétreo a common** (era rare con sólo Formación Solar disfrazada). ¿OK o querés que se mantenga rare con habilidad individual nueva?
3. **Sub-rateos opcionales de Brotador Trülke / Explorador del Brote / Raíz Ancestral / Balsa Áurea** — propongo bumpear al ratio, pero algunas (scout, balsa básica) podrían mantenerse sub-rateadas si así define el sabor de la raza. Marco las dudas con "(a confirmar)" en la tabla.
4. **Templo K'ana-suyu y Susurro del Bosque** — ambas tienen efectos potencialmente rotos en escala (compounding HP / explosion buff). Propongo no tocar mecánica todavía y observarlos en simulación. Confirmar.
5. **Lhwentrü vs Raíz Ancestral**: ambas implementan AoE Külen. Considerar si la rare (Raíz) debería ser self-only y la legendaria (Lhwentrü) AoE para diferenciar — actualmente ambas son AoE.

Una vez con tu OK, aplico los cambios JSON por carta y produzco el siguiente documento (Prompt 5 — rename) o paso a 2/3/4.
