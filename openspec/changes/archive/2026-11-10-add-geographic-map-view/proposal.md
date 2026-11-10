# Proposal

## Why

The timeline shows *when* philosophers lived and published, but not *where* their lives unfolded. Users need a second, shareable geographic view of the same filtered data—life paths from birth through personal events and publications to death—without abandoning the existing diagram or its menu controls.

## What Changes

- Add a **map view** (MapLibre + OpenStreetMap vector tiles) as a second primary view alongside the timeline.
- Show each visible person as a geographic life path: birth → personal events → publications → death, with arrows when “Życiorysy” is on and points only when it is off.
- Theme the basemap for **bright and dark** modes to match diagram accent/background colors.
- **BREAKING**: Replace hash-based view state (`#collection&start&end&row`) with **path + query** routing for both views (`/` timeline, `/map` map), including collection, viewport, layer toggles, and dark mode in the query string.
- Keep the **same top menu** across views (button order and values preserved); add a view switcher at the end of the toolbar.
- Layer toggles without geographic meaning (sympathies, publication references, world history events) remain in the menu and URL but are no-ops on the map.
- When map viewport params are missing, **fit bounds** to locations of the active collection’s visible people/events/publications.

## Capabilities

### New Capabilities

- `url-state`: Path + query navigation and shareable application state for timeline and map views (replacing hash state).
- `geographic-map`: Geographic map view of the same collection-filtered people and related locations, with life paths, markers, basemap theming, and layer semantics.

### Modified Capabilities

- (none — no existing OpenSpec specs yet)

## Impact

- `src/utils/viewHash.ts` and Chronology camera sync migrate to a path/query router; GitHub Pages needs SPA fallback for `/map`.
- New map UI (React + MapLibre), shared shell with Menu; new dependency on MapLibre (and React bindings) plus a free OSM vector tile style source.
- Location coordinate parsing must accept both `lat;lng` and JSON `{latitude,longitude}` formats already present in imported data.
- World history events have no coordinates today — map cannot place them until data changes (out of scope except no-op toggle).
