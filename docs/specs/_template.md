# <Feature Name>

**Status:** draft
**Owner:** Daniel
**Created:** YYYY-MM-DD
**Related specs:** —

---

## Why

1-2 paragraphs answering: ¿qué problema resolvemos? ¿qué pasa si no lo hacemos?

Linkea evidencia: tickets de soporte, métricas, conversaciones con profesores, deadlines (ej. lanzamiento en App Store).

---

## Goals

Lista bulletted de objetivos concretos y testeables.

- [ ] Profesor puede X
- [ ] OMR detecta marcas con ≥ 99% precision en papel A
- [ ] IA grading evalúa pregunta de desarrollo en < 5s

---

## Non-goals / Out of scope

Lista explícita de cosas que **no** entran en esta spec.

- ✗ Soporte para X
- ✗ Migración de Y
- ✗ Modo offline (será otra spec)

---

## User-facing changes

App walkthrough paso-a-paso. Incluí navegación, qué ve el usuario, qué pasa al tap.

```
[Home tab]
  └─ Botón "Nueva evaluación"
     └─ Modal con campos (...)
        └─ Tap "Crear" → navigate to /evals/<id>
                          └─ Camera preview con overlay OMR
```

Si hay screens nuevas, mockup en ASCII / Excalidraw / Figma link.

API contract changes (si aplica):
- `POST /api/v1/evaluations` request/response schema.
- New fields in existing endpoint.

---

## Approach

Sketch de la implementación. Suficiente para que vos del futuro entienda la forma del cambio sin leer código.

App:
- New screen `EvaluationCreate` en `app/screens/`.
- State: nuevo slice `evaluationStore` (Zustand), persiste con `mmkv`.
- Camera permissions: confirm en `Info.plist` y `AndroidManifest.xml`.

API:
- `app/api/v1/evaluations.py` — endpoint con FastAPI router.
- DB: nueva tabla `evaluations` (sqla model + Alembic migration).
- Storage: imágenes en `storage/evaluations/<id>/` con cleanup job.

---

## Decisions log

ADRs cortas. Fecha + decisión + alternativa + por qué.

### YYYY-MM-DD — RevenueCat en lugar de IAP nativo directo
- **Considered:** StoreKit 2 + Google Play Billing directo.
- **Chose:** RevenueCat.
- **Why:** Cross-platform abstraction, server-side receipt validation, sandbox testing.
- **Cost:** Vendor lock-in, costos a escala (>$2.5K MRR).

---

## Test plan / Definition of Done

- [ ] Unit tests cubren `app/services/<module>/` (≥80% coverage).
- [ ] Integration test e2e (Detox o Maestro): crear eval → escanear hoja → grading → ver resultado.
- [ ] OMR baseline test: 50 hojas reales del corpus, verificar ≥99% accuracy.
- [ ] IAP probado en sandbox Apple + Google.
- [ ] Receipt validation server-side probado con replay.
- [ ] Logs / observability: eventos `eval.created`, `eval.scanned`, `billing.tier_upgraded`.
- [ ] Documentación actualizada — README + runbook si hay incident response.
- [ ] Spec movida a `shipped/` después del merge.

---

## Phases (opcional)

### Phase 1 — Foundation (semana 1)
- Schema, models, basic CRUD endpoint.
- DoD: curl-testeable con auth token.

### Phase 2 — App UI (semana 2)
- Screens, store, navigation.
- DoD: usable en TestFlight.

### Phase 3 — IAP / Paywall (semana 3)
- RevenueCat integration, paywall en rutas Plan-Free.
- DoD: compra real en sandbox.

---

## Open questions

- [ ] ¿Soporte para iPad? Asumimos sólo iPhone en v1.
- [ ] ¿Idiomas? Asumimos español-Chile only en v1.

---

## Links

- PR: <link cuando existe>
- Otras specs: `auth-passwordless.md`
- External docs: <RevenueCat>, <Apple StoreKit>, <Google Play Billing>
