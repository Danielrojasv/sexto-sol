# SEXTO SOL — GAME RULES (v2.0)

Documento vivo. Reemplaza al GAME-RULES.md anterior. Integra decisiones de diseño cerradas en sesión de mayo 2026.

---

## 0. Resumen ejecutivo

Sexto Sol es un TCG de combate directo entre cuatro razas espaciales descendientes de civilizaciones ancestrales. Cada raza pelea según una **categoría de mecánica** distinta (Reactiva / Iniciativa / Acumulativa / Post-combate), y el orden natural de resolución entre estas categorías produce un counter wheel emergente sin necesidad de reglas hardcodeadas.

**Innovación central:** sistema de Resolución por Naturaleza de Mecánica + Habilidades Duales Luz/Sombra ligadas a mecánica firma + Edades como escalada de poder narrativo.

---

## 1. Setup

- **Mazo:** 30 cartas de UNA sola raza, máximo 3 copias por carta. Legendarias: 1 copia.
- **Mano inicial:** 4 cartas.
- **Mulligan:** una vez por partida. Robás 4 nuevas, ponés 1 al fondo del mazo.
- **Tablero por jugador:** mundo natal (HP 20).
- **Tablero compartido:** 3 planetas neutrales revelados al inicio, cada uno con un **Don** único.
- **Compensación de segundo jugador:** +1 carta al inicio (mano de 5).

---

## 2. Recurso: Energía Territorial

- No acumulable entre turnos. Lo que no gastás se pierde al final de Vigilia.
- Empezás con **1 energía en turno 1** (mundo natal).
- **Mundo natal:** +1 energía por turno.
- **Planeta neutral activado:** +1 energía ese turno (gastás 1 energía para activar el Don del planeta, ese planeta queda agotado hasta tu próximo turno; te otorga +1 energía adicional al activarlo).
- **Planetas no conquistables:** son recursos compartidos. Cualquier jugador puede activar planetas no agotados en SU turno.

### 2.1. Dones de planetas

Cada partida, los 3 planetas neutrales tienen Dones únicos revelados al setup. Ejemplos:

- **Don del Archivo:** Robá 2 cartas.
- **Don del Núcleo:** +5 HP máximo a tu mundo natal.
- **Don de la Forja:** Buscá una Tecnología en tu mazo y ponela en tu mano.
- **Don del Pulso:** +1 fuerza permanente a tus naves esta Edad.
- **Don del Eco:** Recuperá una carta de tu cementerio.
- **Don de la Sombra:** Tu oponente descarta 1 carta al azar.

(Lista expandible. Apuntar a 12-16 Dones distintos en el set inicial; cada partida usa 3 al azar.)

---

## 3. Estructura de turno

Turno completo por jugador, 5 fases:

1. **Recolección** — Recibís energía base (mundo natal + planetas activados el turno anterior). Robás 1 carta.
2. **Despliegue** — Jugás cartas (Naves, Armas, Tecnologías, Reliquias) pagando energía.
3. **Combate** — Atacás. Combate simultáneo (ambos se hacen daño igual a fuerza).
4. **Regroup** — Reposicionás naves (movimiento gratis). En Despliegue cuesta 1 energía.
5. **Vigilia** — Habilidades activadas y respuestas. La energía no gastada se pierde aquí.

### 3.1. Combate

- **Combate directo desde turno 1.** No hay restricciones de Edad sobre qué se puede atacar.
- **El atacante elige objetivo:** nave enemiga, mundo natal, o planeta no agotado (interrumpiendo su Don).
- **Combate simultáneo:** ambos se hacen daño igual a su fuerza.
- **Bloqueo:** no existe bloqueo libre. La keyword **Bastión** ("debe ser atacada antes que otras unidades en su zona") es la única forma de forzar bloqueo.
- **Daño residual:** no por defecto. La keyword **Desgarro** habilita que el exceso pase al objetivo siguiente (típicamente al mundo natal).

---

## 4. Sistema de Resolución por Naturaleza de Mecánica

Toda interacción simultánea sigue este orden de resolución:

| Orden | Categoría        | Naturaleza                                    | Raza firma |
| ----- | ---------------- | --------------------------------------------- | ---------- |
| 1     | **Reactivas**    | Se disparan en respuesta a algo recibido      | Würon      |
| 2     | **Iniciativa**   | El jugador decide activarlas pagando un costo | Tezhal     |
| 3     | **Acumulativas** | Dependen del estado del tablero               | Q'ralan    |
| 4     | **Post-combate** | Se activan al salir algo del juego            | Zaqe       |

### 4.1. Counter wheel emergente

- **Würon > Q'ralan:** Reactiva resuelve antes que Acumulativa. Würon crece con cada golpe antes de que Q'ralan cuente su masa.
- **Q'ralan > Tezhal:** Acumulativa absorbe la Iniciativa. Q'ralan ya tiene buffs de masa cuando llega el sacrificio Tezhal.
- **Tezhal > Zaqe:** Iniciativa actúa antes que Post-combate. Tezhal mata cartas clave antes de que Zaqe pueda reciclarlas.
- **Zaqe > Würon:** Post-combate alimenta partidas largas. Würon no cierra rápido y se desangra contra reciclado eterno.

### 4.2. Keyword "Premonición"

Algunas cartas (raras y de Edad III) llevan **Premonición**: "Esta carta o habilidad resuelve fuera del orden, antes de cualquier otra categoría."

- Máximo 1-2 cartas con Premonición por mazo (sugerido).
- Costo alto en energía o restricciones de uso.
- Permite al jugador **romper el counter natural** con preparación de mazo.

---

## 5. Edades

3 Edades, no resetean estado:

### Edad I — "El Despertar"

- Mecánicas firma cuestan **+1 energía**.
- Stats base. Pelea sin trucos.

### Edad II — "Las Estrellas Recuerdan"

- Mecánicas firma a **costo normal**.
- Keyword **Resonancia** activa: cartas pueden repetir efectos de Edad I.

### Edad III — "El Sexto Sol"

- Mecánicas firma **potenciadas** (efecto x2 o equivalente).
- **Daño directo desde la mano** habilitado: Eventos pueden golpear el mundo natal sin pasar por combate.

### 5.1. Transición de Edades

- **Inicio del turno 5 (cualquier jugador):** comienza Edad II globalmente.
- **Inicio del turno 9 (cualquier jugador):** comienza Edad III globalmente.
- **Cartas tipo "Edad":** pueden adelantar la transición narrativamente.

---

## 6. Tipos de carta

- **Nave** — Combate. Tiene fuerza y HP. Puede tener habilidades.
- **Arma** — Equipamiento. Se ata a una Nave para modificar stats o agregar keywords.
- **Tecnología** — Instantáneo. Efecto de un solo uso.
- **Reliquia** — Pasiva permanente. Modifica reglas globales para el dueño.
- **Evento** — Respuesta. Se juega en turno propio o en respuesta a acciones del oponente.

---

## 7. Naves: jerarquía por rareza

### 7.1. Comunes (60% del mazo típico)

- Sin habilidad o con UNA keyword simple (Bastión, Desgarro, Resonancia, Vuelo, etc.).
- Columna vertebral del mazo.

### 7.2. Raras (30% del mazo)

- UNA habilidad única.
- Efecto al entrar, al morir, o activada.
- Definen arquetipos de mazo.

### 7.3. Legendarias (10% del mazo, máx 1 copia)

- Habilidad **dual Luz/Sombra**.
- **Luz:** se activa por defecto.
- **Sombra:** se activa bajo condición específica de la mecánica firma de la raza.

---

## 8. Héroe (Opción C: arco narrativo dentro de la partida)

- **Único:** 1 héroe por mazo, 1 copia, máximo 1 en juego siempre.
- **Edad I:** héroe vive en el mundo natal como **comandante pasivo**. Otorga habilidades pasivas y 1-2 activadas por turno (estilo "hero power"). No combate. No muere salvo que caiga el mundo natal.
- **Edad II:** héroe **puede desplegarse al campo** como Nave Legendaria especial. Conserva sus habilidades pasivas mientras esté en juego. Si muere en combate, vuelve al mundo natal (no muere permanente). Pierde 1 turno antes de poder reactivar.
- **Edad III: combate total**. El héroe puede atacar mundos natales enemigos.

### 8.1. Identidad del héroe

- 1-3 héroes por raza para elegir al armar mazo (variabilidad de arquetipos).
- Cada héroe define una sub-identidad de mecánica firma (ej: Q'ralan A acelera Mit'a, Q'ralan B potencia Jerarquía).

---

## 9. Mecánicas firma por raza

> Nombres provisionales. Confirmar en próxima iteración.

### 9.1. Q'ralan — "Hijos del Sol Pétreo"

- **Categoría:** Acumulativa.
- **Mecánica: Formación Solar** (provisional). Tus naves ganan +1 fuerza por cada otra nave Q'ralan en juego.
- **Submecánica: Mit'a interno** (renombrar): tributo acumulado activa habilidades especiales.
- **Identidad:** control imperial, pelea mejor en masa, débil contra remoción rápida.

### 9.2. Würon — "Pueblos del Sur Profundo"

- **Categoría:** Reactiva.
- **Mecánica: Külen** (provisional, ex-Newen). Cada daño recibido te da +1 fuerza permanente.
- **Submecánica: Lof** (renombrar): clanes vinculados que se buffean entre sí.
- **Identidad:** midrange resiliente, más fuerte cuanto más recibe.

### 9.3. Tezhal — "Devotos del Corazón Ardiente"

- **Categoría:** Iniciativa.
- **Mecánica: Ignición** (provisional, ex-Ofrenda). Sacrificás una nave propia para potenciar otra acción.
- **Identidad:** aggro de sacrificio, daño explosivo a costo de tropas propias.

### 9.4. Zaqe — "Mercaderes del Lago Cósmico"

- **Categoría:** Post-combate.
- **Mecánica: Refluencia** (provisional, ex-Sumergir). Naves Zaqe derrotadas vuelven al fondo del mazo en lugar de al cementerio. Cuestan -1 al ser robadas de nuevo.
- **Identidad:** combo económico, partidas largas, reciclado eterno.

---

## 10. Win conditions

1. **Destruir mundo natal enemigo** (HP 0). Primaria.
2. **Decking out:** el oponente no puede robar carta cuando le tocaría.
3. **Concesión.**

### 10.1. Casos límite

- **Empate (ambos mundos a 0 simultáneamente):** gana quien gatilló el daño. Si fue absolutamente simultáneo, tablas.
- **Cap de mano:** 7 cartas. Excedente se descarta al final de Vigilia.
- **Naves en planeta perdido:** no aplica (planetas no se conquistan).
- **Cartas únicas:** legendarias son únicas en juego — si tenés 2 en mano (caso imposible salvo robo especial), solo podés tener 1 desplegada.

---

## 11. Keywords del set inicial

| Keyword         | Efecto                                                                               |
| --------------- | ------------------------------------------------------------------------------------ |
| **Bastión**     | Debe ser atacada antes que otras unidades en su zona.                                |
| **Desgarro**    | Daño excedente pasa al objetivo siguiente.                                           |
| **Resonancia**  | Puede repetir un efecto de carta jugada en una Edad anterior (activo desde Edad II). |
| **Premonición** | Resuelve antes que cualquier categoría de mecánica.                                  |
| **Vuelo**       | Solo puede ser bloqueada por unidades con Vuelo o Bastión.                           |

(Expandible en próximos sets.)

---

## 12. TBDs cerrados en esta versión

| Pregunta             | Respuesta                                                  |
| -------------------- | ---------------------------------------------------------- |
| Costo de mover naves | Gratis en Regroup, 1 energía en Despliegue.                |
| Reglas de bloqueo    | Atacante elige objetivo, Bastión obliga.                   |
| Daño residual        | Solo con Desgarro.                                         |
| Mulligan             | Mano completa, una vez. Pone 1 al fondo.                   |
| Scoring de planetas  | Recursos compartidos con Dones, no conquistables.          |
| Empate               | Gana quien gatilló el daño; tablas si simultáneo absoluto. |
| Cap de mano          | 7.                                                         |
| Cartas únicas        | Legendarias son únicas en juego.                           |

---

## 13. TBDs pendientes (next iteration)

- Lista cerrada de Dones de planetas (target: 12-16).
- Confirmación de nombres definitivos de mecánicas firma.
- Diseño de los 4 héroes principales (1 por raza para v0.1).
- Set inicial: 8-10 cartas por raza para playtest (5 comunes, 3 raras, 1-2 legendarias).
- Reglas para cartas multi-categoría (si las habrá).
- Sistema de puntos / ranking competitivo (post-MVP).

---

## 14. Roadmap de desarrollo

### Fase 1: PnP (mes 1-3)

Cartas en hojas A4, fundas con rigidizador. Playtest interno.

### Fase 2: MVP web (mes 2-5, en paralelo)

- Stack: React + Supabase + Tabletop Simulator mod.
- IA scripted (heurísticas tipo "si puedo matar, mato; si no, defiendo").
- Modos: single-player vs IA + hot-seat.
- Multiplayer en versión 0.3+.

### Fase 3: Comunidad y devlog (mes 1-18, continuo)

Documentación pública del proceso. Bluesky/X, YouTube devlog, Discord.

### Fase 4: Arte profesional + Kickstarter (mes 12-20)

4 ilustraciones showcase humanas (1 por raza) + arte placeholder/IA para el resto.

### Fase 5: Producción física (mes 20-26)

4 starter decks preconstruidos (1 por raza). Sin booster packs en lanzamiento inicial.

---

## 15. Notas de propiedad intelectual

- **Mecánicas y sistemas:** no protegibles por copyright. Libres.
- **Nombres de razas (Q'ralan, Würon, Tezhal, Zaqe):** inventados. Copyright propio.
- **Términos culturales reales (Mapuche, Inca, etc.):** aparecen solo en el lore como **ecos resonantes terrestres**, no como razas jugables. Ver `CANON-LORE.md`.
- **Keywords:** renombradas para evitar solapamiento con Magic, Yu-Gi-Oh, Hearthstone.
- Antes de cualquier publicación comercial: consultar abogado de PI.

---

_Versión 2.0 — mayo 2026. Documento vivo. Próxima revisión tras playtest inicial._
