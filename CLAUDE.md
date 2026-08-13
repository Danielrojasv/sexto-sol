# CLAUDE.md — sexto-sol (código)

Contexto para trabajar en este repositorio. Acá vive solo el **código**. El diseño, las
reglas del juego, el lore y las specs están en el repositorio privado del proyecto, y no
se copian acá ni en comentarios ni en mensajes de commit.

## Reglas del repositorio

1. **Nada de diseño ni de lore en este repo.** Si una tarea necesita las reglas o el
   canon, se trabaja desde el repositorio privado y acá entra solo el código resultante.
2. **El engine es puro.** `(state, action) => newState`, sin efectos y sin dependencias
   del navegador. `portability.test.ts` lo verifica.
3. **Toda aleatoriedad pasa por el RNG seedable** de `src/engine/rng.ts`. Nada de
   `Math.random()` en el engine.
4. **Contenido y motor van separados.** Las cartas son YAML validado contra esquema en
   `src/data/`. Una carta nueva no debería requerir lógica nueva; si la requiere, primero
   se discute el efecto declarativo.
5. **Tests como condición de término.** Código nuevo entra con tests. `pnpm test:run` y
   `pnpm validate:cards` verdes antes de commitear.
6. Antes de tocar código sensible, leer `SECURITY-RULES.md` y `PERFORMANCE-RULES.md`.

## Estructura

```
src/engine/    reducer, interpreter, RNG, resolución
src/data/      carga y validación de cartas y mazos (YAML)
src/store/     estado de la aplicación (Zustand)
src/ui/        componentes React
src/tests/     suite, incluye property based con fast-check
scripts/       validación de pool y utilidades de build
```

## Comandos

```bash
pnpm dev              # servidor de desarrollo
pnpm test:run         # suite completa
pnpm test:coverage    # cobertura
pnpm validate:cards   # esquema y balance del pool
```

## Documentación

`ARCHITECTURE.md` y su versión en inglés `ARCHITECTURE.en.md` explican los patrones del
engine. Es el único documento de referencia que vive en este repositorio.
