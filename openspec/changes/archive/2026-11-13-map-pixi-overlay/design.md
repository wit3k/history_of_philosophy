# Design

## Context

See proposal.md — Why. Today `GeographicMap` stacks MapLibre basemap + GeoJSON life-path layers + many React HTML `Marker`s. Temporal play and dense Europe views rebuild or reconcile that tree often. The timeline already uses Pixi (`TimelineDiagram` / `@pixi/react`). Screen-space layout lives in `layoutScreenBubbles` (pixel offsets) and fits an overlay better than DOM markers.

## Goals / Non-Goals

**Goals:**

- Variant B: MapLibre = basemap + camera; Pixi draws paths, dots, portraits, hubs.
- Keep geographic registration via `map.project` / camera events.
- Reuse temporal, search/selection, and collision helpers; change the renderer, not the product rules.
- Incremental migration so markers can ship before paths if needed.

**Non-Goals:**

- Rewriting the timeline Pixi diagram.
- Replacing MapLibre basemap (tiles/styles stay).
- Rust/WASM layout (revisit only if profiling still shows CPU layout as the limiter after overlay).
- Changing collection filters, URL camera schema, or scrubber UX beyond what overlay sync requires.
- Perfect LOD / new hubbing policy at low zoom (optional follow-up; not required for B).

## Decisions

### 1. Stacking and ownership

**Choice:** Absolute-positioned Pixi `Application` over the MapLibre container (same CSS box). MapLibre handles drag/zoom; Pixi canvas uses pointer events for hits on subjects, with empty-space events falling through or delegated so pan still works.

**Why:** Matches timeline host patterns; one scene graph for all subjects.

**Alternative:** MapLibre custom layer (GL) — tighter integrate, worse DX vs existing Pixi skills; HTML markers for portraits only — smaller win.

### 2. Camera sync

**Choice:** On `move` / `moveend` / resize, rAF-coalesce: read map transform, `project` each subject’s lat/lng (plus layout pixel offsets), set Pixi display object `x/y`. Full collision layout (`layoutScreenBubbles`) only on settle (moveend) and when the visible id-set / quantized temporal year changes—not every pan pixel.

**Why:** Pan must stay cheap; collision is the expensive part (already learned during play stutter fixes).

**Alternative:** Re-layout every move frame — smoother packing while zooming, too costly.

### 3. Data pipeline

**Choice:** Keep building logical subjects from paths / avatar tracks / temporal opacity (existing utils). Feed `{ id, lng, lat, diameter, kind, opacity, accent, … }` into: (a) optional layout pass → screen offsets; (b) Pixi scene upsert by stable `id`.

**Why:** Minimizes rewrite; `layoutScreenBubbles` already returns screen nodes.

**Alternative:** New unified scene model — cleaner long-term, larger first PR.

### 4. Life paths in Pixi

**Choice:** Draw path segments as Pixi graphics (or batched meshes) from the same curved segment coordinates used today, projected each sync. Temporal opacity updates alpha without tearing down the whole graph when ids are stable. Selection dash can be a dedicated animated graphics object (port of current dash sequence idea).

**Why:** Spec requires paths in the overlay; avoids dual hit systems (MapLibre hit layer + markers).

**Alternative:** Leave paths in MapLibre GeoJSON (hybrid A) — less work, split hit-testing; rejected for B.

### 5. Tooltips / popups

**Choice:** At most one HTML tooltip/popup portal positioned from projected screen coords; no per-marker DOM.

**Why:** Spec allows thin HTML affordances; keeps text/a11y simple.

### 6. Dual WebGL contexts

**Choice:** Accept MapLibre WebGL + Pixi WebGL; prefer Pixi `preference: 'webgl'`, `autoDensity`, transparent background. Monitor memory on dense collections; if contested, document optional Pixi canvas fallback later—not in initial ship.

**Why:** Timeline already uses WebGL Pixi; risk known, mitigate by measuring.

## Risks / Trade-offs

- **[Risk] Camera/overlay drift on resize or DPR** → Single resize observer; sync from map `getCanvas()` size; test HiDPI.
- **[Risk] Pointer conflict (pan vs click marker)** → Explicit hit targets; empty canvas passes through to map; verify touch.
- **[Risk] Two WebGL contexts OOM on weak GPUs** → Profile; reduce resolution; eventual canvas fallback.
- **[Risk] Large migration regression (search/selection/hubs)** → Incremental flags or staged PRs; parity checklist from geographic-map scenarios.
- **[Risk] Path redraw cost while panning** → Project-only updates; throttle; batch graphics.

## Migration Plan

1. Overlay shell: Pixi over map, clear color, resize + camera tick scaffolding (no content).
2. Port portraits + event/pub dots + hubs using layout helpers; feature-flag or replace Markers.
3. Port life paths + path hover/selection dash; remove MapLibre path Source/Layers and `life-path-hit`.
4. Remove unused Marker/Popup-per-item paths; keep one tooltip portal.
5. Manual perf check: dense Europe play + pan vs pre-change baseline; rollback = revert overlay and restore Marker path (git).

## Open Questions

- Exact pointer pass-through strategy (CSS `pointer-events` on canvas vs always-on Pixi + `map.dragPan`) — decide during shell spike without changing specs.
- Whether `@pixi/react` or imperative Pixi in a ref is cleaner for the map overlay (timeline uses react bindings; map may prefer imperative upsert for churn)—pick in first tasks without changing requirements.
