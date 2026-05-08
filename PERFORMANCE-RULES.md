# PERFORMANCE-RULES — Sexto Sol

Reglas accionables de performance. Lee antes de tocar reducer, canvas (PixiJS), o componentes que renderizan cartas. Sub-agentes deben consultar este archivo antes de optimizar.

> Hallazgos de auditorías de performance se consolidan acá. Si encontrás un anti-patrón repetido, agregá la regla en vez de fixearlo en silencio.

---

## 1. Reducer puro

- **Sin** `JSON.parse(JSON.stringify(state))` para clonar. Reescribe sólo el sub-árbol que cambia (structural sharing manual, o Immer si el costo amerita).
- **Sin closures pesados** en hot paths (cada acción del reducer se ejecuta miles de veces en replay tests). Captura por referencia, no recrear funciones por iteración.
- **Sin allocs en loops críticos** del combat resolver. Reusá arrays con `.length = 0` en vez de re-crear.
- Property tests con `fast-check` deben correr en < 5s en CI; si tardan más, hay sobre-clonado.

## 2. Event bus

- Cola de eventos pendientes con tope. Si `pendingEvents.length > 1000` en una sola acción, hay loop infinito de triggers (bug, no carga).
- Habilidades triggered se registran una vez al setup del juego, no por turno.

## 3. PixiJS (Phase 4+)

- **Sprite pool obligatorio** para naves. Recicla instancias en vez de `new Sprite()` por unidad.
- Tope práctico: ~500 sprites simultáneos en pantalla. Si pasamos eso, batching o LOD.
- `Application` se crea una vez, se destruye en cleanup. **Nunca** múltiples instancias en hot reload.
- Texturas se precargan vía `Assets.load()` antes de mostrar UI; no on-demand en render path.

## 4. React + Zustand

- Componentes de carta envueltos en `React.memo`. Props deben ser primitivos o referencias estables.
- Selectores Zustand granulares: `useStore(s => s.energy)` no `useStore(s => s)`. Re-render selectivo.
- Animaciones Framer Motion con `layoutId` para transiciones, no resetean el árbol.
- Sin `useEffect` que escriba al state global en cada render — eso vuelve a renderizar todo el suscriptor.

## 5. Build & bundle

- Lazy-load del canvas Pixi (`vendor-pixi` chunk separado vía `manualChunks`). El menú principal no debería descargar Pixi.
- Bundle inicial objetivo: < 200KB gzip cuando llegue UI playable.
- Source maps en build pero `sourcemap: 'hidden'` para no exponer en producción.

## 6. Tests

- Suite unitaria del engine debe correr en < 10s. Si crece más, separar property tests a job de CI propio.
- `vitest --coverage` no se corre en pre-commit (lento) — sólo en CI.

---

_Vivo. Última actualización: 2026-05-08._
