# SEXTO SOL — GAME RULES (v3.0)

> **Versión simplificada para playtest.** Reemplaza GAME-RULES v2.0. Objetivo: validar el corazón del juego (combate + habilidades + counter wheel) antes de agregar capas de complejidad.
>
> Capas removidas temporalmente: planetas neutrales, Edades I/II/III, héroes pasivos en mundo natal, Resonancia. Estas capas pueden volver en versiones futuras una vez que el core esté validado.
>
> v2.0 archivada en `docs/archive/GAME-RULES-v2.0.md` como referencia histórica.

---

## 0. Cambios respecto a v2.0

| Cambio                                          | Razón                                         |
| ----------------------------------------------- | --------------------------------------------- |
| Energía automática creciente (+1/turno, cap 10) | Eliminar cuello de botella de recursos.       |
| Mazo de 30 cartas, todas mecánicas              | Más espacio para identidad de raza.           |
| Sin planetas neutrales                          | Validar core antes de agregar territorio.     |
| Sin Edades                                      | Mecánicas firma a costo normal desde turno 1. |
| Héroes = Naves Legendarias normales             | Simplificación.                               |
| Legendarias sin Luz/Sombra                      | Una sola habilidad individual potente.        |
| Cementerio → **Pozo Astral**                    | Diferenciar de MyL.                           |
| Vigilia → **Eclipse**                           | Diferenciar de MyL.                           |
| Nueva zona: **Disolución** (exilio)             | Para mecánica de Refluencia.                  |
| Mareo de invocación confirmado                  | Las naves no atacan el turno que entran.      |

---

## 1. Setup

- **Mazo:** 30 cartas de UNA sola raza. Máximo 3 copias por carta. Legendarias: 1 copia.
- **Mano inicial:** 4 cartas. Mulligan: una vez. Robas 4 nuevas, pones 1 al fondo.
- **Tablero:** mundo natal por jugador (HP 20). Zona de despliegue propia.
- **Compensación de segundo jugador:** +1 carta inicial (mano de 5).
- **Energía inicial:** 1 energía en turno 1.

---

## 2. Recurso: Energía

- **+1 energía base por turno**, automático.
- **Cap máximo:** 10.
- La energía se renueva al inicio de cada turno: arrancas cada turno con tu cap actual lleno.
- Energía no gastada se pierde al final de tu turno.

| Turno | Energía  |
| ----- | -------- |
| 1     | 1        |
| 2     | 2        |
| 3     | 3        |
| …     | …        |
| 10    | 10 (cap) |
| 11+   | 10       |

---

## 3. Estructura de turno

5 fases por jugador:

1. **Recolección** — Energía actualizada. Robas 1 carta.
2. **Despliegue** — Juegas cartas pagando energía.
3. **Combate** — Atacas. Combate simultáneo.
4. **Regroup** — Mueves naves (gratis aquí, 1 energía en Despliegue).
5. **Eclipse** — Habilidades activadas y respuestas. Energía no gastada se pierde.

### 3.1. Combate

- Combate directo desde turno 1.
- Atacante elige objetivo: nave enemiga o mundo natal.
- Combate simultáneo: ambos se hacen daño igual a fuerza.
- **Mareo de invocación:** las naves NO atacan el turno que entran, salvo keyword **Embate**.
- **Bloqueo:** solo vía keyword **Bastión**.
- **Daño residual:** solo vía keyword **Desgarro**.

---

## 4. Sistema de Resolución por Naturaleza de Mecánica

| Orden | Categoría        | Naturaleza                         | Raza firma |
| ----- | ---------------- | ---------------------------------- | ---------- |
| 1     | **Reactivas**    | Responden a algo recibido          | Würon      |
| 2     | **Iniciativa**   | El jugador activa pagando costo    | Tezhal     |
| 3     | **Acumulativas** | Dependen del estado del tablero    | Q'ralan    |
| 4     | **Post-combate** | Se activan al salir algo del juego | Zaqe       |

### 4.1. Sub-pasos de combate

1. **Declaración de daño:** se calcula daño basado en fuerza ANTES de reactivas.
2. **Reactivas:** habilidades reactivas se disparan con valores declarados. Modifican fuerza para combates futuros, no para el actual.
3. **Iniciativa:** habilidades de iniciativa activadas explícitamente.
4. **Acumulativas:** se recalculan buffs de masa con estado actual.
5. **Aplicación de daño:** ambas naves reciben daño declarado en paso 1.
6. **Post-combate:** efectos al morir o salir del juego.

### 4.2. Counter wheel emergente

- **Würon > Q'ralan:** Reactiva resuelve antes que Acumulativa.
- **Q'ralan > Tezhal:** Acumulativa absorbe la Iniciativa.
- **Tezhal > Zaqe:** Iniciativa actúa antes que Post-combate.
- **Zaqe > Würon:** Post-combate domina partidas largas.

### 4.3. Premonición

> **Premonición** _(esta carta o habilidad resuelve antes que cualquier categoría de mecánica)_

- Máx 1-2 cartas con Premonición por mazo.
- Costo alto.
- Permite romper el counter natural.

---

## 5. Tipos de carta

- **Nave** — Combate. Fuerza, HP, keywords, habilidad individual.
- **Arma** — Equipamiento. Modifica una Nave.
- **Tecnología** — Instantáneo. Un solo uso, va al Pozo Astral.
- **Reliquia** — Pasiva permanente.
- **Evento** — Respuesta. Turno propio o reactivo.

---

## 6. Capas de habilidad por carta

Cada carta puede tener hasta 3 capas:

### 6.1. Capa 1 — Stats base

Costo, fuerza, HP. Siempre presente.

### 6.2. Capa 2 — Keywords

Cero o más keywords del pool definido. En Set 1 incluyen reminder text entre paréntesis.

### 6.3. Capa 3 — Habilidad individual

Cero o una habilidad única de esa carta. Le da identidad propia.

### 6.4. Reglas de balance entre capas

| Tipo                     | Total stats (fuerza + HP) vs costo |
| ------------------------ | ---------------------------------- |
| Vanilla (sin habilidad)  | costo × 3 + 1                      |
| Con keyword              | costo × 3                          |
| Con habilidad individual | costo × 2.5                        |
| **Con dos keywords**     | **costo × 2.5**                    |
| Con keyword + habilidad  | costo × 2                          |

Las cartas con más habilidades tienen stats más bajos. La habilidad es el valor. Dos keywords pesan lo mismo que keyword + habilidad individual a efectos de stats.

### 6.5. Distribución por rareza

**Comunes (60%):**

- Keyword O habilidad individual, rara vez ambas.
- Habilidades simples: efectos al entrar, buffs condicionales, una activación.

**Raras (30%):**

- Habitualmente keyword + habilidad individual.
- Habilidades complejas: triggers múltiples, sinergias con mecánica firma.

**Legendarias (10%):**

- Keyword + habilidad individual potente.
- Sin Luz/Sombra (simplificación v3.0).
- Definidoras de mazo.
- 1 copia máxima por mazo. Única en juego.

---

## 7. Mecánicas firma por raza

### 7.1. Würon — Külen (Reactiva)

> **Külen** _(cuando esta nave recibe daño y sobrevive, gana +1 fuerza permanente)_

### 7.2. Q'ralan — Formación Solar (Acumulativa)

> **Formación Solar** _(esta nave gana +1 fuerza por cada otra nave Q'ralan que controles)_

### 7.3. Tezhal — Ignición (Iniciativa)

> **Ignición** _(al jugar/activar, sacrifica una nave Tezhal aliada para activar el efecto descrito en la carta)_

El efecto específico varía por carta. Ejemplo: "Ignición: haz 3 daño a una nave enemiga."

El refraseo (v3.0.2) normaliza dos formas de invocar Ignición:

- **Activado**: cartas con trigger `activated` que sacrifican como parte de la activación voluntaria (ej. Piloto de Obsidiana). El sacrificio es opcional — el jugador elige cuándo activar.
- **Al jugar**: cartas con trigger `on_play` (eventos / tech) cuyo efecto incluye `sacrifice` mandatory dentro del effect tree (ej. Plumaje Encendido). El sacrificio se resuelve al pagar la carta.

En ambos casos el target del sacrificio está fijado por la firma: `controller: 'self'`, `race: 'tezhal'`. La keyword `ignicion` marca ambos patrones.

### 7.4. Zaqe — Refluencia (Post-combate)

> **Refluencia** _(al morir va al Pozo Astral; puedes pagar su costo durante tu Despliegue para revivirla; si muere de nuevo, va a Disolución)_

---

## 8. Glosario completo de keywords (Set 1 con reminder text)

| Keyword             | Reminder text                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------ |
| **Bastión**         | _(debe ser atacada antes que otras unidades en su zona)_                                               |
| **Embate**          | _(puede atacar el turno que entra al juego)_                                                           |
| **Desgarro**        | _(el daño excedente pasa al objetivo siguiente)_                                                       |
| **Vuelo**           | _(solo puede ser bloqueada por unidades con Vuelo o Bastión)_                                          |
| **Premonición**     | _(resuelve antes que cualquier categoría de mecánica)_                                                 |
| **Külen**           | _(cuando esta nave recibe daño y sobrevive, gana +1 fuerza permanente)_                                |
| **Formación Solar** | _(esta nave gana +1 fuerza por cada otra nave Q'ralan que controles)_                                  |
| **Ignición**        | _(al jugar/activar, sacrifica una nave Tezhal aliada para activar el efecto)_                          |
| **Refluencia**      | _(al morir, va al Pozo Astral; puedes revivirla pagando su costo; si muere de nuevo, va a Disolución)_ |

---

## 9. Zonas del juego

- **Mazo:** cartas no robadas.
- **Mano:** cartas robadas no jugadas.
- **Campo:** zona de naves desplegadas.
- **Pozo Astral:** equivalente de "cementerio". Cartas muertas o descartadas.
- **Disolución:** zona de exilio. Cartas refluidas que mueren por segunda vez van aquí. No pueden recuperarse.

---

## 10. Win conditions

1. **Destruir mundo natal enemigo** (HP 0). Primaria.
2. **Decking out:** el oponente no puede robar cuando le tocaría.
3. **Concesión.**

### 10.1. Casos límite

| Caso                             | Resolución                                                      |
| -------------------------------- | --------------------------------------------------------------- |
| Ambos mundos a 0 simultáneamente | Gana quien gatilló el daño. Tablas si absolutamente simultáneo. |
| Cap de mano                      | 7. Excedente se descarta al final de Eclipse (jugador elige).   |
| Cartas únicas                    | Legendarias: solo 1 copia desplegada simultáneamente.           |

---

## 11. Reglas de combate detalladas

### 11.1. Declarar ataque

Atacas con cualquier nave que:

- No tenga mareo de invocación (entró este turno, salvo Embate).
- No esté agotada por otro efecto.

### 11.2. Elección de objetivo

- Si hay Bastión enemigo, DEBE elegirse una nave Bastión primero.
- Una vez eliminadas o evitadas (con Vuelo), se puede atacar libremente.

### 11.3. Resolución

- Combate simultáneo. HP ≤ 0 → Pozo Astral (o Refluencia si aplica).
- Daño al mundo natal reduce HP. Sin regeneración salvo cartas específicas.

### 11.4. Daño excedente

Por defecto se pierde. Con **Desgarro** pasa al objetivo siguiente.

---

## 12. Reglas de despliegue

- Pagas el costo de energía indicado.
- Mareo de invocación: la nave no ataca este turno (salvo Embate).
- Sí puede usar habilidades activadas no de combate.
- Movimiento: gratis en Regroup, 1 energía en Despliegue.

---

## 13. Habilidades activadas

Requieren:

- Pagar costo (energía, sacrificio, descarte).
- Cumplir condiciones (fase, turno).

Si una habilidad activada coincide con combate, se aplica orden de Resolución por Categorías.

---

## 14. Roadmap post-validación core

**Fase 1 (validación core, EN CURSO)**

- Set 1 con 30 cartas por raza.
- Sin planetas, sin Edades, sin héroes pasivos.
- Simulación intensiva.

**Fase 2 (re-introducción gradual)**

- Héroes con pasivo en mundo natal (revisar diseño).
- Edades (sistema de escalado).

**Fase 3 (capa territorial)**

- Planetas neutrales con Dones.

**Fase 4 (expansiones)**

- Set 2: nueva mecánica (ej: Luz/Sombra).
- Nuevas razas vía mecanismos canónicos del lore.

---

## 15. TBDs pendientes (próxima iteración)

- Diseñar Eventos por raza (cero actualmente).
- Diseñar Reliquias adicionales.
- Definir habilidades individuales de las 42 cartas existentes.
- Generar 8-10 cartas adicionales por raza.
- Re-balancear stats según reglas de balance entre capas.

---

_Versión 3.0 — mayo 2026. Documento simplificado para playtest. Reemplaza v2.0._
