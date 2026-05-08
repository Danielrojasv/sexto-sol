# GAME-RULES.md — Sexto Sol

Documento vivo. Reglas oficiales del juego. Se actualiza con cada decisión de diseño.

> **Para el racional detrás de cada regla, ver `docs/specs/design-v0.md`.**

---

## 1. Setup de partida

### Mazo
- Cada jugador construye un mazo de **30 cartas** de **una sola facción**.
- Una carta puede aparecer máximo **3 veces** en el mazo.
- Algunas cartas Legendarias tienen límite de **1 copia** (TBD por carta).

### Inicio de partida
- Cada jugador roba **4 cartas** (mano inicial).
- **Mulligan opcional una vez**: descartá entre 0 y 4 cartas, robá la misma cantidad. Las descartadas vuelven al mazo y se baraja.
- Se determina aleatoriamente quién juega primero.
- Cada jugador empieza con su **mundo natal** (homeworld) en el sector estelar. HP base: **20**.

### Tablero (Sector Estelar)
- 1 mundo natal por jugador (intocable durante Edad I; atacable desde Edad II).
- **3 planetas neutrales** revelados al inicio. Más se revelan en cada Edad.
- Cada planeta tiene un **slot de guarnición**: el dueño coloca naves ahí para defenderlo.

---

## 2. Recursos

**Energía territorial** — el único recurso del juego. NO sube +1 automático cada turno.

- **Mundo natal**: genera 1 energía/turno.
- **Cada planeta neutral conquistado**: +1 energía/turno mientras lo controles.
- **Conquistar planeta enemigo**: +1 energía/turno para vos, -1 energía/turno para el enemigo.

La energía no se acumula entre turnos (se gasta o se pierde, estilo mana de MTG en eso). Lo que se acumula es el INGRESO base, ganado por territorio.

---

## 3. Estructura del turno

Cada jugador toma su turno completo (no alternado estilo LoR). Estructura por fases (estilo myl):

### Fase 1 — Recolección
1. Generás energía igual a tu ingreso territorial actual.
2. Robás 1 carta del mazo.

### Fase 2 — Despliegue
- Jugás cualquier cantidad de cartas pagando su costo en energía.
- Tipos de carta jugables aquí:
  - **Naves** (units que combaten)
  - **Armas** (equip a una nave aliada)
  - **Tecnologías** (efecto único, instant/sorcery)
  - **Reliquias** (efecto pasivo continuo en juego)

### Fase 3 — Combate
- Declarás ataques con tus naves.
- Cada nave puede atacar uno de:
  - Una nave enemiga
  - Un planeta neutral (para conquistarlo)
  - Un planeta enemigo (para reconquistarlo)
  - El mundo natal enemigo (sólo desde Edad II)
- El defensor puede **bloquear** con sus naves disponibles.
- Combate se resuelve simultáneamente: ambas naves se hacen daño igual a su fuerza.
- Daño sobrante de un ataque NO bloqueado pasa al objetivo (planeta o mundo natal).

### Fase 4 — Regroup
- Reposicionar naves entre planetas que controles.
- Costo de movimiento: TBD (probablemente 1 energía por mover).

### Fase 5 — Vigilia
- Activás habilidades de tipo activadas que requieran fase Vigilia.
- Eventos response del oponente (pocos, controlados).
- Fin de turno.

---

## 4. Las 3 Edades

Una partida transcurre en 3 Edades narrativas. **Las Edades NO resetean estado** — son fases del arco de la partida.

### Edad I — "El Despertar"
- 2-3 planetas neutrales en el sector.
- Mundos natales **intocables** (no se pueden atacar directamente).
- Mecánicas básicas. Tutorial del estado actual.
- Duración: ~4-5 turnos por jugador (TBD por playtest).

### Edad II — "Las Estrellas Recuerdan"
- Se revelan 1-2 planetas adicionales.
- Mundos natales **se vuelven atacables**.
- Cartas con keyword `Eco` empiezan a activarse.
- Posible reveal del plot alien.

### Edad III — "El Sexto Sol"
- Todos los planetas activos.
- Combate total. Sin restricciones.
- Aquí se decide la partida.

**Transición entre Edades** se gatilla por: turno-counter (turno 5 → Edad II, turno 9 → Edad III) **o** por evento narrativo (un planeta especial es destruido, etc.). TBD.

---

## 5. Tipos de carta

| Tipo | Función | Análogo myl |
|---|---|---|
| **Nave** | Unidad de combate con fuerza/vida | Aliado |
| **Arma** | Equipa a una nave aliada (+stats o keyword) | Arma |
| **Tecnología** | Efecto inmediato y descarta (instant) | Talismán |
| **Reliquia** | Efecto pasivo continuo en juego | Tótem |
| **Evento** | Response card durante turno enemigo | — |

---

## 6. Win conditions

1. **Destruir el mundo natal enemigo** (HP 0). ← Win condition primaria.
2. **Decking out** (oponente intenta robar de mazo vacío). ← Win condition secundaria, intencionalmente raro.
3. **Concesión** del oponente.

---

## 7. Counter wheel de facciones

```
   Mexica (aggro) ──vence──→ Muisca (combo)
       ↑                           ↓
     vence                       vence
       │                           ↓
    Inca (control) ←──vence── Mapuche (midrange)
                                                  ⭐ HISTORICO
```

- **Mexica > Muisca** — aggro mata combos antes de armarse
- **Muisca > Mapuche** — el oro y el ritual penetran donde el combate frontal no logra
- **Mapuche > Inca** ⭐ **anchored**: la resistencia mapuche detuvo al imperio inca en la Batalla del Maule. Mecánica: `Newen` punisha el removal del control
- **Inca > Mexica** — control imperial supera agresión sostenida

**Matchups cruzados** (no en el cycle, neutral / decididos por skill):
- Mexica vs Mapuche
- Inca vs Muisca

---

## 8. Mecánicas firma por facción

(Esquema general — las mecánicas concretas se diseñan en specs por facción).

### 🌞 Inca — Imperio del Sol
**Archetype:** Control imperial.
- `Tributo` — cartas weak alimentan a las strong.
- `Mit'a` — acumulación territorial: planetas controlados sinergizán entre sí.
- `Acllla` — descuentos en cadena (la próxima carta cuesta -1).

### ⚔️ Mexica — Hijos del Quinto Sol
**Archetype:** Aggro de sacrificio.
- `Ofrenda` — sacrificás cartas en juego para potenciar la siguiente jugada.
- Velocidad alta, mazos eficientes que pierden si no rematan rápido.

### 🪙 Muisca — Guardianes del Dorado
**Archetype:** Combo económico.
- `Sumergir` — cartas de oro se "ofrendan al lago", regresan transformadas N turnos después.
- Burst económico para jugadas explosivas.

### 🌲 Mapuche — Pueblo de la Tierra
**Archetype:** Midrange resiliente.
- `Newen` — cuando una nave recibe daño, gana +1 fuerza permanente.
- `Lof` — clan auto-sinérgico: 2+ naves Mapuche en el mismo planeta se buffean entre sí, sin necesitar un líder.

---

## 9. Cosas que NO están definidas todavía

- Costo exacto de movimiento de naves
- Cantidad exacta de planetas en cada Edad
- Reglas de bloqueo (¿defensor elige? ¿es declarado por jugador atacante?)
- Reglas de daño residual (¿pasa al planeta? ¿al mundo natal?)
- Sistema de mulligan exacto
- Win condition por scoring de planetas (alternativa a HP del mundo natal)
- Battle pass / monetization (Phase 3+ del proyecto)
- Multiplayer netcode (TBD si async tipo Marvel Snap o realtime)

---

*Última actualización: 2026-05-08*
