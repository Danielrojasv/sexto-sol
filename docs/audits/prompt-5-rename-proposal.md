# Prompt 5 — Renombrado de cartas con nomenclatura culturalmente sensible

**Fecha:** 2026-05-10
**Alcance:** rename de cartas con términos culturales directos (Mit'a, Mexica, Inka, Mañke, Cuauhtli, etc.) a términos en lengua ficticia de cada raza. Sólo propuesta — ningún JSON modificado todavía.

> Anchor histórico Würon > Q'ralan se preserva como eco resonante en CANON-LORE §6.3 (no como mecánica explícita en cartas).

---

## Reglas aplicadas

1. **Patterns lingüísticos por raza** según `docs/lore/naming-conventions.md`:
   - Q'ralan: `q'`/`k'` apostrofes, sufijos `-suyu`/`-wasi`/`-pampa`/`-ay`/`-illay`/`-untay`.
   - Würon: `tr`, `lh`, `ñg`, `ü`, `ä`; sufijos `-pang`/`-üntu`/`-ñke`.
   - Tezhal: `tz`, `tl`, `xt`, `-tlani`/`-tzin`; reemplazar `-cuauhtli` real por fonético cercano.
   - Zaqe: `sq`, `zh`, `gu`; sufijos `-sqha`/`-zhua`/`-guata`.
2. **Reusar términos inventados ya canonizados** (Sumaq, Tlanixtli, Quetlani, Tzactli, etc.) cuando encajen — refuerza la voz de la raza.
3. **Conservar adjetivos en español** (Tutelar, Coordinador, Cazador, Ardiente) — no son términos sensibles, son rol.
4. **IDs y filenames** se actualizan en el mismo pase porque ningún código fuera de los JSON los referencia.
5. **Cosméticos**: descripciones de habilidades ya usan forma canónica de raza (Q'ralan / Würon / Tezhal / Zaqe — sin diaeresis en Zaqe per fuente). Headers con cultura real entre paréntesis (Inka/Mexica/etc.) **no aparecen en producto** (catálogo UI usa subtítulos abstractos); existen sólo en el .md exportado como tracking interno → mantener internas, no exportar al producto.

---

## A. Cartas a renombrar (5)

### A.1. Inka-untay Tutelar → **Sumaq-untay Tutelar** _(Q'ralan)_

| Campo    | Antes                                                                                           | Después                         |
| -------- | ----------------------------------------------------------------------------------------------- | ------------------------------- |
| `name`   | Inka-untay Tutelar                                                                              | Sumaq-untay Tutelar             |
| `id`     | quralan_inka_untay_tutelar                                                                      | quralan_sumaq_untay_tutelar     |
| filename | inka-untay-tutelar.json                                                                         | sumaq-untay-tutelar.json        |
| flavor   | "La nave-templo tutelar coordina sectores enteros: bajo su sombra, ningún escuadrón se pierde." | (sin cambio — no menciona Inca) |

**Justificación:** "Inka" evoca directo al imperio inca real. "Sumaq" ya está canonizado en el set ("Sumaq-suyu", "Sumaq-Cristal") y se sostiene como prefijo Q'ralan inventado. Sufijo `-untay` permitido per naming-conventions §2.1. Conserva el rol "Tutelar" (español, neutro).

### A.2. Mit'a-wasi Coordinador → **K'apaq-wasi Coordinador** _(Q'ralan)_

| Campo    | Antes                                                                                     | Después                                                |
| -------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `name`   | Mit'a-wasi Coordinador                                                                    | K'apaq-wasi Coordinador                                |
| `id`     | quralan_mita_wasi_coordinador                                                             | quralan_kapaq_wasi_coordinador                         |
| filename | mita-wasi-coordinador.json                                                                | kapaq-wasi-coordinador.json                            |
| flavor   | "Coordina hangares enteros desde la cabina-templo: el tributo cósmico se vuelve disparo." | (sin cambio — el tributo es genérico, no nombra Mit'a) |

**Justificación:** "Mit'a" es la institución andina real de tributo laboral, no apropiable. "K'apaq" evoca la familia fonética de Q'aphaq (existente en el set) sin copiar palabra real específica. Sufijo `-wasi` permitido per naming.

### A.3. Ofrenda del Cuauhtli → **Pira Xocotzin** _(Tezhal)_

| Campo    | Antes                                                                                          | Después                                                     |
| -------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `name`   | Ofrenda del Cuauhtli                                                                           | Pira Xocotzin                                               |
| `id`     | tezhal_ofrenda_del_cuauhtli                                                                    | tezhal_pira_xocotzin                                        |
| filename | ofrenda-del-cuauhtli.json                                                                      | pira-xocotzin.json                                          |
| flavor   | "Una nave del escuadrón se ofrenda en órbita; el humo del casco trae dos presagios al hangar." | (sin cambio — el verbo "se ofrenda" es genérico, no nomina) |

**Justificación:** "Cuauhtli" es Náhuatl real para guerrero águila ritual. "Ofrenda" como sustantivo principal denuncia mucho la cultura mexica. "Pira" (del latín, no específico) + "Xocotzin" (ya canonizado en "Iniciado Xocotzin") forma un nombre claramente Tezhal que sigue el patrón "[acción ritual] del [actor]" para tech.

### A.4. Xolot Cuauhtli Ardiente → **Xolot Quetlani Ardiente** _(Tezhal)_

| Campo    | Antes                                                                                         | Después                        |
| -------- | --------------------------------------------------------------------------------------------- | ------------------------------ |
| `name`   | Xolot Cuauhtli Ardiente                                                                       | Xolot Quetlani Ardiente        |
| `id`     | tezhal_xolot_cuauhtli_ardiente                                                                | tezhal_xolot_quetlani_ardiente |
| filename | xolot-cuauhtli-ardiente.json                                                                  | xolot-quetlani-ardiente.json   |
| flavor   | "Casco labrado en pirámide-espejo: cada nave ofrendada en órbita carga sus cañones rituales." | (sin cambio)                   |

**Justificación:** "Xolot" ya está como invento Tezhal canónico per naming-conventions §2.3. "Cuauhtli" se reemplaza por "Quetlani" (canonizado en "Pirámide Orbital Quetlani") manteniendo la familia fonética de la legendaria.

### A.5. Mañke Cazador → **Lhüñke Cazador** _(Würon)_

| Campo    | Antes                                                                              | Después              |
| -------- | ---------------------------------------------------------------------------------- | -------------------- |
| `name`   | Mañke Cazador                                                                      | Lhüñke Cazador       |
| `id`     | wuron_manke_cazador                                                                | wuron_lhunke_cazador |
| filename | manke-cazador.json                                                                 | lhunke-cazador.json  |
| flavor   | "El cazador no apunta: deja que la presa lo encuentre, y entonces se vuelve raíz." | (sin cambio)         |

**Justificación:** "Mañke" = cóndor en mapudungun real. "Lhüñke" combina prefijo `Lhü-` (canonizado en "Lhüpang", "Lhwentrü") con sufijo `-ñke` permitido. Conserva el rol "Cazador" (español).

---

## B. Flavor texts a editar (3)

### B.1. Brasa Tlani _(Tezhal)_

- **Antes:** "Su casco de obsidiana se ofrenda al hangar; otra nave arde con su tonalli."
- **Después:** "Su casco de obsidiana se ofrenda al hangar; otra nave arde con su mismo fuego ritual."
- **Justificación:** "tonalli" es concepto religioso náhuatl real (alma-fuego). "Fuego ritual" es la imagen sin la palabra cargada.

### B.2. Piloto de Obsidiana _(Tezhal)_

- **Antes:** "Pilota con plumaje de tezontli; sabe que el casco se vuelve daga si el escuadrón lo pide."
- **Después:** "Pilota con plumaje de obsidiana fundida; sabe que el casco se vuelve daga si el escuadrón lo pide."
- **Justificación:** "tezontli" es la piedra volcánica mexica real. "Obsidiana fundida" mantiene la imagen visual sin el término real (y la obsidiana ya es un trope de la raza).

### B.3. Pirámide Orbital Quetlani _(Tezhal)_

- **Antes:** "El espejo-pirámide en órbita lee cada nave caída del escuadrón y devuelve su tonalli al hangar."
- **Después:** "El espejo-pirámide en órbita lee cada nave caída del escuadrón y devuelve su fuego ritual al hangar."
- **Justificación:** mismo "tonalli" que B.1.

---

## C. Bug menor de voseo missed (1)

### C.1. Sumaq-untay Tutelar (anteriormente Inka-untay) — descripción

- **Antes:** "Al desplegar: buscas 1 nave Q'ralan en tu mazo y la **sumás** a tu mano."
- **Después:** "Al desplegar: buscas 1 nave Q'ralan en tu mazo y la **sumas** a tu mano."
- Una palabra que escapó al sweep voseo→tuteo de la tanda anterior.

---

## D. Cosméticos confirmados (sin cambios pendientes)

1. **Race en descripciones de habilidades** — todas ya usan forma canónica con apostrofe/diéresis (`Q'ralan`, `Würon`).
2. **Forma canónica de Zaqe** — fuente y conventions usan "Zaqe" sin diéresis. Se mantiene así (la "Zäqe" del .md exportado fue licencia de mi script de export).
3. **Headers con cultura real entre paréntesis** — sólo aparecen en .md exportado (tracking interno), nunca en producto. Mantener.

---

## E. Blocklist — adiciones recomendadas

Para que el validator atrape estos términos en el futuro, agregar a `src/data/blocklist.ts`:

```ts
// Mit'a — institución andina real de tributo laboral.
'mit\'a',
'mita',  // sin apóstrofe también
// Cuauhtli — guerrero águila náhuatl, dimensión ritual real.
'cuauhtli',
// Mañke — cóndor en mapudungun, animal con peso ceremonial.
'mañke',
// Tonalli — concepto religioso náhuatl (alma-fuego).
'tonalli',
// Tezontli — piedra volcánica usada en arquitectura/ritual mexica.
'tezontli',
// Inka — variante ortográfica directa del imperio Inca.
'inka',
```

Después de agregar, re-correr `pnpm validate:cards` para confirmar que no haya residuos en otras cartas.

---

## Resumen de impacto

- **5 cartas** renombradas (name + id + filename).
- **3 flavor texts** editados.
- **1 voseo** corregido.
- **6 entradas** sugeridas para blocklist.
- **0 cambios mecánicos** (stats, keywords, abilities preservadas).

Una vez aprobado, aplico todo en un solo commit "chore(rename): cultural cleanup per Prompt 5" y corro validator.
