# Prompt: Rebuild History of Philosophy z PixiJS

Skopiuj poniższy blok jako system/user prompt do agenta lub użyj razem z plikiem `SPEC.md` i kodem źródłowym oryginału jako referencją wizualną.

---

## PROMPT

You are rebuilding the web app **„History of philosophy visualised”** (`chronology_presenter`) so that the **timeline diagram** is rendered with **PixiJS (v8 preferred)** instead of SVG, while preserving **pixel-identical** (or visually indistinguishable) appearance and **identical** interaction semantics.

### Non-negotiable goals

1. **Visual parity** with the live app: https://wit3k.github.io/history_of_philosophy/ and with `SPEC.md` in this repo (especially **§15 Szczegóły krytyczne dla parity**).
2. **Replace only the diagram renderer**: everything that is today an `<svg>` subtree becomes a PixiJS `Application` + display objects. Keep **Menu, Modals, toggles, filters** as HTML/CSS overlays (React is fine).
3. **Reuse the same data layer**: DTOs, `*ListRaw` modules, `*ListService` packing algorithms (`withRowNumbers`, history-event row packing), `ColorsService`, collection filtering. Do **not** invent a new layout algorithm.
4. **Preserve coordinate math exactly**:
   - `positionByYear(year) = (year - viewPosition.x) * zoom`
   - person row Y: `45 * rowNumber + viewPosition.y`
   - history-event row Y: `-15 * rowNumber + viewPosition.y`
   - defaults: `viewPosition={x:1588,y:0}`, `zoom=10`, years `-1200..2101`
5. **Preserve layer order** (bottom → top): HistoryEvents → year grid → PersonReferences → People → PublicationReferences → Publications → PersonHistoryEvents → year labels.
6. **Preserve pan/zoom/pinch**, including **different** wheel vs pinch formulas and step-size thresholds (see SPEC §15.7). Clamp on X only; Escape closes modals; dark-mode background.
7. **Base path** `/history_of_philosophy` for assets and routing.
8. **Do not “improve”** text measurement, path geometry, culling asymmetry, or thumbnail scaling — copy heuristics from SPEC §15.

### Hard requirements often missed (must implement)

- Text truncation / HistoryEvent box height uses **`charCount * 8`**, never `measureText`.
- Person thumbnails: texture **30×30**, draw at **35×35**.
- People + PersonReferences: render **all** (no viewport cull), matching current code.
- Hover-driven highlights: person `pointermove` sets highlight; empty pad clears; relation dimming opacity 0.1.
- Stroke caps/joins: **butt / miter** (not round).
- Dashed strokes for current-year line + highlighted relations (Pixi has no CSS dash — implement equivalent look; 50s dashoffset loop).
- Port `roundPathCorners` and PublicationReference magic constants verbatim (`cos05=0.877`, distance factors).
- Parse `#RRGGBBAA` and `rgba()` from `ColorsService`.
- `resolution: devicePixelRatio`, `autoDensity: true`, canvas under HTML menu/modals (`z-index`).
- HistoryEvent vertical band height effectively **20000px**; sideways label via rotation + screenshot check.
- Before done: side-by-side screenshots at default camera, hover-with-relations, publication tooltip, zoom≈25, dark mode.
### What to keep from the original (copy behavior 1:1)

Read and port logic from (current Pixi sources + data):

- `src/components/chronology/Chronology.tsx` — state, filters, navigation, composition
- `src/pixi/TimelineDiagram.tsx`, `TimelineLayers.tsx`, `relationPaths.ts`
- `src/pixi/roundPathCorners.ts` (`roundPathCorners`)
- `services/Colors.ts`
- All modal + Menu components (HTML)
- Dash animation semantics for highlighted relation paths (~50s)

### PixiJS implementation requirements

- Use a full-window canvas; resize on `resize` / `orientationchange`.
- Map pointer events: left-drag pan, wheel zoom, two-finger pinch; `touch-action: none` on page.
- Implement hit-testing for: person bars/thumbnails, publication markers, person-history dots/bars, empty pad (clears highlights).
- Tooltips for publications and person-history events: show on hover over the interactive marker (same sizes/wrapping rules as SVG version). Prefer Pixi text + Graphics, or a thin HTML tooltip positioned over canvas — must match layout specs in `SPEC.md`.
- Draw rounded orthographic relation paths using `buildPersonReferencePath` / `buildPublicationReferencePath` in `relationPaths.ts`, then `roundPathCorners` (radius 15 for people, 5 for publications). Bridge path-data commands (`M`/`L`/`C`) to Pixi `Graphics`.
- Follow SPEC §16 stack: `@pixi/react`, custom camera (no `pixi-viewport`), dashed-stroke util, HTML tooltips preferred.- Highlight animations: animate dash offset on highlighted relation strokes (~50s loop); dim non-related person-relations to opacity 0.1 when a person is highlighted.
- Year label pills and vertical year lines must match colors, dash for current year (`white`, width 3, dash `4 1 1 6 1 1`), century vs non-century styles.
- Load person thumbnails as Pixi textures from `/history_of_philosophy/assets/person/...`.
- Fonts: monospace for diagram labels (match ~14–15px sizing).
- Performance: cull off-screen items with the same `isVisible` / `isVisibleRange` predicates; avoid rebuilding the whole scene every frame — update transforms on pan/zoom.

### Suggested stack (see SPEC §16)

**Required:** `pixi.js` v8, `@pixi/react`, existing `roundPathCorners` + `ColorsService` + data services, a small dashed-stroke util, and a path-command → Pixi Graphics bridge (path data syntax only — not SVG DOM). Prefer HTML tooltips over the canvas.

**Optional later:** `@use-gesture/react` only if Pixi pointer handling hurts (keep camera formulas); `rbush`/cull only after visual parity.

**Do not use:** `pixi-viewport` as the camera; old `pixi-dashed-line` as the v8 solution; vis/D3/Konva/Fabric timelines; Pixi UI for modals/menu.

### Suggested structure

```
ChronologyView (React)
  ├── Application (@pixi/react)  // diagram scene graph
  ├── Menu                       // HTML
  └── Modals + tooltips          // HTML overlay preferred
```

Scene graph containers:

```
world
  ├── historyEvents
  ├── yearLines
  ├── personLinks
  ├── people
  ├── publicationLinks
  ├── publications
  ├── personHistoryEvents
  └── yearLabels
```

On pan/zoom: either move a root `world` container with scale/position derived from `viewPosition`+`zoom`, **or** recompute x positions from years — but results must match the SVG formulas. Prefer keeping year→x math explicit so labels/lines stay crisp.

### Out of scope

- Redesigning UI/UX
- Changing data model or NocoDB importer (unless needed for build)
- Server-side rendering
- Replacing HTML modals with Pixi UI

### Deliverables

1. Working app with PixiJS timeline matching the original.
2. Same feature toggles and collection filters.
3. Short README note: how to run, that diagram uses PixiJS.
4. Do not break asset paths used by GitHub Pages build (`rsbuild.github.config.ts` → `docs/`).

### Acceptance checklist

- [ ] Opening the app looks like the live SVG version at the default camera (x≈1588, zoom 10)
- [ ] Drag / wheel / pinch behave the same; century labels densify at higher zoom
- [ ] All layer toggles work; disabled dependencies match Menu rules
- [ ] Clicking a person / publication / personal event opens the correct modal
- [ ] Relation highlight + dimming matches original
- [ ] Dark mode toggles background and history-event band colors
- [ ] Collection filters recompute person rows via `withRowNumbers`
- [ ] No page scroll; canvas fills the window

### Reference files

Primary written spec: `SPEC.md`  
Primary behavioral source of truth: `src/components/**` and `src/services/Colors.ts`

When in doubt, **match the existing TypeScript implementation**, not a reinterpretation of the domain.
)
