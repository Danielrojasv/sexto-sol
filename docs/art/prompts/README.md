# Card Art Prompts — Sexto Sol

Prompts canónicos para generar los 4 sprite sheets del set base (uno por raza).

## Cómo usar

1. Abrí el archivo de la raza objetivo (`<race>-sprite-sheet.md`).
2. Copiá el bloque "Prompt unificado para image generator" al final del archivo.
3. Pegalo en tu image-gen de elección:
   - **Midjourney v6+**: prefijo `--ar 8:9 --quality 2 --stylize 250`. Pegá el prompt en inglés (la sección que dice "Render a 4×3 grid…").
   - **DALL·E 3** (vía ChatGPT Plus / API): pegá tal cual. DALL·E suele responder mejor a prompts narrativos en inglés con mucha descripción visual concreta.
   - **Stable Diffusion XL** (Comfy/A1111): aspect ratio 1024×1152 (8:9 escalado), CFG 7-9, sampler DPM++ 2M Karras, steps 30-50. Negative prompt sugerido: `text, logos, ui, frames, borders, watermark, signature, humans, faces, multiple subjects per slot`.
4. Generá. Si la grilla no sale bien la primera vez, reduce a un solo slot y ensambla manualmente los 12 con un compositor (Photoshop / Pixelmator / GIMP).

## Output esperado

Cada sprite sheet:

- **2048 × 2304 px** (4 col × 3 fila × 512×768 cada slot).
- Format **PNG** (con o sin transparency — preferentemente fondo neutro temático).
- Guardar en `/opt/sexto-sol/public/art/<race>.png` (path final del frontend).

## Versionado

Los prompts viven en este directorio (`docs/art/prompts/`). Los PNG generados **NO** se commitean al repo principal todavía — esperan a que decidamos hosting (Cloudflare R2, GitHub LFS, o local hasta Phase 4 cuando llegue arte profesional). Por ahora:

- Los **prompts (texto)** son la fuente de verdad versionable.
- Las **imágenes (binario)** son output derivado, regenerable si cambia el prompt.

## Mapping carta → slot

Para que el frontend sepa qué slot usar por carta, agregamos el campo `artSlot: { row: number, col: number }` a cada Card.json en una sub-spec posterior. Por ahora, los slots están documentados en cada `<race>-sprite-sheet.md` por nombre de carta.

## Roadmap de arte

- **Ahora (Phase F+)**: prompts canónicos + 1 sprite sheet por raza generado por AI = arte placeholder consistente.
- **Phase 4 (Kickstarter)**: 4 ilustraciones showcase humanas (1 por raza) reemplazan las cartas más visibles del set base. El resto sigue con AI hasta crowdfunding completo.
- **Post-launch**: arte profesional para todas las cartas según presupuesto.

## Reglas culturales (recordatorio)

Las razas son inventadas. **Nunca** generar imágenes que copien glifos sagrados directos, máscaras rituales reales, o arquitectura específicamente identificable como Mapuche/Inca/Mexica/Muisca. La estética se inspira en cosmovisiones precolombinas pero se transforma a lo cósmico-fictício. Si un prompt sale demasiado cercano a referencia real, ajustá los descriptores (ej. en lugar de "Mexica obsidian dagger" → "stylized obsidian dagger with abstract geometric carving"). Ver `docs/lore/naming-conventions.md`.
