# History of philosophy visualised

To see a final result go to [https://wit3k.github.io/history_of_philosophy/](https://wit3k.github.io/history_of_philosophy/)

## Rebuild / PixiJS migration docs

Dokumentacja do odwzorowania aplikacji w innym stacku (docelowo diagram w **PixiJS** zamiast SVG):

- [`SPEC.md`](./SPEC.md) — pełna specyfikacja zachowania, danych, layoutu, wyglądu oraz **rekomendowany stack** (§16)
- [`PIXI_REBUILD_PROMPT.md`](./PIXI_REBUILD_PROMPT.md) — gotowy prompt do rebuildu
- [`PIXI_MIGRATION.md`](./PIXI_MIGRATION.md) — mapowanie SVG → PixiJS i kolejność prac

## Setup

Install the dependencies:

```bash
bun install
```

## Get started

Start the dev server, and the app will be available at [http://localhost:3000](http://localhost:3000).

```bash
bun run dev
```

Build the app for production:

```bash
bun run build
```

Preview the production build locally:

```bash
bun run preview
```

## Learn more

To learn more about Rsbuild, check out the following resources:

- [Rsbuild documentation](https://rsbuild.rs) - explore Rsbuild features and APIs.
- [Rsbuild GitHub repository](https://github.com/web-infra-dev/rsbuild) - your feedback and contributions are welcome!
