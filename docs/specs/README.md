# LAZZ — Spec-Driven Development

Specs viven acá. Una por feature. Cubre app (RN) + api (FastAPI) ya que la mayoría de features cruzan ambos.

**Proceso canónico** + lecciones de sprints reales: `~/.claude/skills/sdd/PROCESS.md`. El skill `sdd` activa el flujo automáticamente cuando el usuario pide armar un spec.

## Cuándo escribir spec

**Spec obligatoria si:**
- Feature toma ≥ 3 días de trabajo total (incluyendo tests/QA).
- Toca billing (Apple/Google IAP, RevenueCat), auth, datos de evaluaciones (sensibles).
- Requiere integración nueva: nuevo proveedor de IA, push provider, OCR engine, etc.
- Cruza app + api (cambios en contrato, schema, o flujo end-to-end).
- Cambios en algoritmo OMR (precision, calibración, robustez en distintos papeles).
- Decisiones de arquitectura que vamos a querer recordar (qué + por qué).

**Spec NO necesaria:**
- Bug fixes con test de regresión claro.
- Refactor mecánico sin cambio de comportamiento.
- Dep bumps, ajustes de Metro/Babel, typos en strings UI.
- Sprint de housekeeping.
- Cambios de color/spacing/copy (sí specs cuando hay rebrand grande tipo Grader→LAZZ).

Si dudas, escríbela. Tax inicial ~1h, evita 5h de reconstruir contexto en 3 semanas.

## Cómo escribir spec

1. Copia `_template.md` a `<feature-slug>.md` (ej. `paywall-iap-revenuecat.md`).
2. Llena las secciones. Sé específico — "user can subscribe" es vago, "user clicks Upgrade in /settings → IAP modal nativa → on success calls /api/v1/billing/verify-receipt → flag user.tier_ai=true" es accionable.
3. Pasa por revisión antes de empezar a codear.
4. Status starts en `draft`; pasa a `approved` cuando arranca el branch; `in-progress` con commits; `shipped` al merge a main; `abandoned` si se descarta.
5. **Mantenelo vivo**: cualquier cambio de scope dentro del PR actualiza la spec en el mismo PR.

## Estructura de specs

```
docs/specs/
├── README.md                    (este archivo)
├── _template.md                 (copiar para empezar)
├── shipped/                     (specs cerradas — referencia histórica)
│   └── ...
├── paywall-iap-revenuecat.md    (active spec)
└── ...
```

Cuando una spec se cierra (status=shipped), moverla a `shipped/` para que el listado raíz quede limpio.

## Convenciones LAZZ-específicas

- **Filename**: kebab-case, breve, identifica el feature.
- **Status field** al tope: `Status: draft | approved | in-progress | shipped | abandoned`.
- **Decisions log** estilo ADR cortos — fecha + decisión + alternativa + por qué.
- **Out of scope** explícito.
- **Linkear** PRs, otras specs, docs externos (Apple/Google IAP, RevenueCat).
- **Si el feature toca OMR**, incluir baseline de calibración + casos de prueba (papel mojado, mala iluminación, página inclinada).
- **Si el feature toca billing**, incluir contracts con receipt validation server-side y idempotency keys.

## Hooks futuros

Eventualmente:
- Pre-merge hook que rechaza PR sin link a spec si toca billing o `app/services/grader/`.
- Cron que checkea specs `in-progress` ≥ 14 días sin actualización.

Por ahora disciplina manual. La spec es el lugar donde "cero skips silenciosos" se vuelve auditable.
