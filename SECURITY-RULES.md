# SECURITY-RULES — Sexto Sol

Reglas accionables de seguridad. Lee antes de tocar engine, RNG, persistencia, o auth (cuando exista). Cualquier sub-agente que toque estas áreas debe consultar este archivo.

> Las hallazgos de auditorías nuevas se consolidan acá. Si encontrás un patrón inseguro repetido, agregá la regla acá en vez de fixearlo en silencio.

---

## 1. Secretos fuera del repo

- **Nunca** committear `.env`, tokens, llaves, ni credenciales. `gitleaks` corre en pre-commit y CI; el bloqueo es duro.
- Variables sensibles vía `import.meta.env.VITE_*` (cliente) o env vars del runtime (server, cuando exista).
- Si encontrás un secret commiteado: rotarlo inmediatamente, después remover del historial.

## 2. Determinismo del engine

- **RNG seedable obligatorio**. Toda aleatoriedad pasa por `src/engine/rng.ts` (cuando se porte de myl-game). `Math.random()` está prohibido en `src/engine/**` y `src/strategies/**`.
- Tests de regresión pasan seeds conocidas; cualquier divergencia en replay es un bug de seguridad (anti-cheat depende de esto).
- **Cero LLM en motor de reglas**. Mismo input → mismo output, siempre. LLMs sólo en herramientas externas (no en hot path del juego).

## 3. Auth (cuando llegue backend)

- Access token sólo en memoria (React state). Nunca `localStorage` ni `sessionStorage`. Refresh token sólo en cookie httpOnly emitida por el server.
- Toda query a la DB filtra por `user_id` del jugador autenticado. **Sin excepciones** (multi-tenancy estricto).
- OAuth: PKCE obligatorio en cliente público. Sin client_secret en frontend.

## 4. Validación de acciones

- El server debe re-validar **toda** acción del jugador con el reducer puro. Nunca confiar en cliente para legalidad de jugadas.
- Replays con seed + lista de acciones permiten al server reproducir el estado y detectar manipulación.

## 5. Inputs del usuario

- Card data (cuando lleguen mazos personalizados / decks compartidos): validar contra schema estricto antes de cargar al state. Sin `eval`, sin `new Function`.
- Inputs de chat / nombres de mazo: sanitizar contra XSS si se renderizan en UI (React escapa por defecto, pero nunca usar `dangerouslySetInnerHTML` con user input).

## 6. Dependencias

- `pnpm audit --audit-level critical` antes de mergear bumps mayores.
- Allowlist explícita en `pnpm.onlyBuiltDependencies` — paquetes con install scripts no corren a menos que estén autorizados.

---

_Vivo. Última actualización: 2026-05-08._
