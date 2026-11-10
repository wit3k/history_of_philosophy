# Design

## Context

See proposal.md for motivation. Today a single `Chronology` tree owns the Pixi timeline, menu toggles, and hash sync via `viewHash.ts` (`#collection&start&end&row`). Deploy base is `/history_of_philosophy/` (Rsbuild + GitHub Pages `docs/`). Locations store coordinates mostly as `lat;lng`, with a minority as JSON `{latitude,longitude}`; `LocationListService` only parses the semicolon form. Person life geography is sparse: personal events are few and collection-skewed; publications usually have a place (often printing city).

## Goals / Non-Goals

**Goals:**

- Introduce a thin client router (path + query) shared by timeline and map without rewriting the Pixi diagram itself.
- Lift shared UI state (collection, layers, dark mode) above both views so the existing Menu keeps order and values.
- Render life paths with MapLibre GL JS and themeable OSM vector styles.
- Harden location coordinate parsing so both stored formats resolve.

**Non-Goals:**

- Geocoding new places or backfilling world-history event coordinates.
- Drawing sympathies / publication references on the map.
- Migrating modal deep-links into the URL in this change.
- Replacing Pixi or changing timeline layout algorithms.

## Decisions

### 1. Tiny History API router instead of React Router

**Choice:** A small module (e.g. `src/utils/appUrl.ts`) parses `pathname` relative to the app base and `URLSearchParams`, exposes `readAppUrl` / `writeAppUrl` / `subscribe`, and drives a top-level shell that chooses Timeline vs Map.

**Why:** Only two routes; no nested routing. Avoids a new routing framework for a static GH Pages app.

**Alternatives:** `react-router` — fine, but heavier for two paths; hash router — rejected by product decision (path + query).

### 2. Query schema

Shared (both views):

| key | meaning | default if absent |
|-----|---------|-------------------|
| `collection` | active collection id | current “all / first” behavior preserved as today when missing |
| `authors`, `lifelines`, `sympathies`, `pubs`, `refs`, `events`, `personal` | `0`/`1` layer toggles | `1` |
| `dark` | `0`/`1` | `prefers-color-scheme` on first load only when absent |

Timeline viewport: `start`, `end`, `row` (same semantics as today’s hash).

Map viewport: `lat`, `lng`, `zoom`.

**Write policy:** `replaceState` for camera/layer tweaks; `pushState` when switching view path or changing collection (shareable “steps”). Strip obsolete viewport keys when switching views (timeline keys off `/map`, map keys off `/`).

**Legacy hash:** ignored for restore; optional one-time cleanup of hash from the address bar when writing query state is acceptable.

### 3. App shell + shared Menu

**Choice:** Extract an `AppShell` that owns collections, layer toggles, dark mode, search chrome, and URL sync. Timeline (existing Chronology diagram portion) and Map are siblings swapped by route. Append a single view-switcher control at the **end** of the existing toolbar groups.

**Why:** Guarantees button order/values; Menu stays one component.

### 4. MapLibre + free OSM vector style

**Choice:** `maplibre-gl` with React bindings (`react-map-gl/maplibre` or equivalent maintained MapLibre React wrapper). Basemap from a free OSM vector style that allows light/dark variants without a paid Mapbox token (prefer OpenFreeMap / similar; fall back to MapTiler free key only if needed and document env).

**Person accents:** reuse `ColorsService.getAccentColor` (+ pale/dark helpers as needed for stroke on light/dark basemap).

**Life-path GeoJSON:** build LineString / MultiLineString + Point features client-side from filtered people; arrowheads via symbol layer or short directional segments. Lifelines off → omit line layer, keep points.

**Initial camera:** if map viewport params missing, `fitBounds` over visible resolvable coordinates (padding); if none, fall back to a Europe-ish default.

**Alternatives:** Leaflet — rejected (raster, harder theme parity); Mapbox GL — license/token lock-in.

### 5. Coordinate normalization

**Choice:** Centralize parsing in location loading: accept `lat;lng` and JSON `{latitude,longitude}` (and ignore invalid). Do not change NocoDB import schema in this change beyond what is required to stop dropping/breaking JSON rows at read time.

### 6. GitHub Pages SPA fallback

**Choice:** In the `github` build, emit/copy `404.html` as a clone of `index.html` (standard GH Pages SPA trick) so `/history_of_philosophy/map` loads the app. Dev server already uses Rsbuild `base`.

## Risks / Trade-offs

- **[Sparse personal events]** → Most paths are birth/pubs/death only; document in UI expectations, do not invent places.
- **[Publication place ≠ residence]** → Accept as data truth; marker type distinguishes publication vs life event.
- **[Dense overlapping paths]** → Accept clutter in v1; optional later: person highlight / opacity. No clustering required for first ship unless interaction becomes unusable in testing.
- **[Tile provider ToS / availability]** → Prefer provider with clear OSM attribution and no mandatory secret; keep style URL configurable.
- **[BREAKING bookmark URLs]** → Old `#...` links stop restoring camera/collection; call out in release notes. No automatic hash→query migrator required unless cheap to add during URL write.

## Migration Plan

1. Land URL module + shell with timeline still the only view; prove query parity for collection/layers/dark/timeline viewport.
2. Add map route and MapLibre view; wire layer semantics.
3. Fix coordinate parsing; verify fitBounds on sample collections (e.g. Feminizm).
4. Update GH Pages build for `404.html`; smoke-test deep link `/map?...`.
5. Remove hash writers/readers once query path is stable.

Rollback: revert the change; hash behavior is not preserved after merge.

## Open Questions

- Exact free tile style URLs for light/dark that best match diagram greys/pinks (pick during implement by visual compare).
- Whether a cheap one-shot hash→query import is worth adding for old bookmarks (nice-to-have; not required by specs).
