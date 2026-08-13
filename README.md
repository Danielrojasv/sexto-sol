# Sexto Sol · engine

Motor de un juego de cartas por turnos, escrito en TypeScript. Este repositorio contiene
el **código**. El diseño, el lore y las especificaciones viven en un repositorio privado.

El engine es la parte que vale la pena leer. Es un reducer puro, sin dependencias del
navegador y con aleatoriedad reproducible, lo que permite simular partidas completas en
tests sin renderizar nada.

Ver [ARCHITECTURE.en.md](ARCHITECTURE.en.md) para las decisiones de arquitectura
explicadas, o [ARCHITECTURE.md](ARCHITECTURE.md) para la versión en español.

## Cómo está construido

- **Engine puro** en `src/engine/`. Firma `(state, action) => newState`, sin efectos.
- **RNG seedable** en `src/engine/rng.ts`. Misma semilla, misma partida.
- **Contenido separado del motor.** Las cartas son YAML validado contra esquema y se
  cargan en `src/data/`. Agregar contenido no toca el código de reglas.
- **Interpreter** que resuelve efectos declarativos, así una carta nueva no implica lógica
  nueva.
- **UI** en React 18 con Vite, Zustand y Tailwind, en `src/ui/`.
- **Tests** con Vitest, incluyendo property based testing con fast-check y un test de
  portabilidad que garantiza que el engine corre en Node sin browser.

## Correr el proyecto

```bash
pnpm install
pnpm dev              # http://localhost:5173
pnpm test:run         # suite completa
pnpm test:coverage    # cobertura
pnpm validate:cards   # validación de esquema y balance del pool
```

## Estado

Engine y UI jugables contra IA y en hot seat, con la suite verde y cobertura sobre el
90 por ciento en el engine.

## Licencia

Todos los derechos reservados. El código se publica para lectura, como muestra de trabajo.
No se autoriza su uso ni su redistribución.
