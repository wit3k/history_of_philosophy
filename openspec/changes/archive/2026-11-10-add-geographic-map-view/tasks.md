# Tasks

## 1. URL state module

- [x] 1.1 Add `src/utils/appUrl.ts` (or equivalent) that reads/writes path view (`/` vs `/map`), shared query keys, and view-specific viewport keys per design.md, and verify round-trip encode/decode for sample timeline and map URLs under base `/history_of_philosophy/`
- [x] 1.2 Replace `viewHash` usage in Chronology/camera sync with the new query writer (`replaceState` on camera), and verify that pan/zoom updates `start`/`end`/`row` in the query string instead of the hash
- [x] 1.3 Persist menu layer toggles and `dark` in the query on change, restore them on load (missing keys → defaults; absent `dark` → prefers-color-scheme), and verify a pasted URL restores those controls

## 2. App shell and shared menu

- [x] 2.1 Extract shared shell state (collections, layers, dark mode, search) above the timeline so Menu is not owned solely by the diagram subtree, and verify the timeline still renders with the same toggle behavior
- [x] 2.2 Append a view switcher at the end of the existing toolbar without reordering prior buttons, wire it to `pushState` between `/` and `/map` while keeping shared query keys, and verify button order/values stay stable across the switch

## 3. Location coordinates

- [x] 3.1 Normalize location coordinate parsing to accept `lat;lng` and JSON `{latitude,longitude}`, drop/skip invalid entries safely, and verify previously JSON-only locations resolve to finite lat/lng

## 4. Geographic map view

- [x] 4.1 Add MapLibre + React bindings dependency and a map route component under the shell, and verify `/map` shows an interactive basemap with OSM attribution
- [x] 4.2 Implement light/dark basemap styles switched by `dark` state and verify both modes look coherent with the diagram theme
- [x] 4.3 Build life-path feature collection from collection-filtered people (birth → personal events → publications → death, skip missing coords) and verify a rich example (e.g. Angela Davis / Feminizm) shows ordered points
- [x] 4.4 Wire Authors / Życiorysy / Publications / personal-events toggles to map layers (paths only when lifelines on; points when authors on; pub/event markers per toggles) and verify Sympatie, Odniesienia, and world history toggles do not change map geometry
- [x] 4.5 Color person paths/markers with `ColorsService` nationality accents and verify they match timeline accents for a known nationality
- [x] 4.6 On map entry without `lat`/`lng`/`zoom`, fit bounds to visible resolvable locations (Europe fallback if empty), then write camera to query on pan/zoom, and verify both behaviors

## 5. Deploy and integration

- [x] 5.1 Update the GitHub Pages build to serve SPA fallback for `/map` (e.g. `404.html` copy of `index.html`) and verify a deep link to `/history_of_philosophy/map?...` loads the app
- [x] 5.2 Smoke-test timeline ↔ map with a shared collection URL (layers + dark preserved; viewports independent) and verify legacy hash-only bookmarks no longer drive state

## Workflow follow-up

- Archive the change with `/opsx-archive` after review and implementation are done.
- Confirm main specs under `openspec/specs/` received `url-state` and `geographic-map` after archive.
