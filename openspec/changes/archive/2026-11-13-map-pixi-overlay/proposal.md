# Proposal

## Why

Dense map views (e.g. Western Europe with many portraits, events, and life paths) stutter and jump during playback and pan because each bubble is a React/MapLibre HTML `Marker` and paths live in GeoJSON layers that rebuild with temporal state. The timeline already paints acceptably via PixiJS WebGL. Moving map content onto a Pixi overlay—keeping MapLibre mainly as basemap + camera—should cut DOM cost while preserving geographic navigation and existing temporal / collision behavior.

## What Changes

- Render map **life paths, event/publication dots, portrait bubbles, and count hubs** in a **PixiJS overlay** sized and synced to the MapLibre viewport (variant B from explore).
- Use MapLibre primarily for **basemap tiles, pan/zoom/camera**, and `project` / `unproject` / bounds; **remove** React `<Marker>` trees and MapLibre GeoJSON sources/layers used for life paths and hit-testing once Pixi owns them.
- Preserve product behavior already specified for the geographic map: temporal fade, search/selection dimming, person never hubbed, screen-space collision / spiderfy helpers (`layoutScreenBubbles`), tooltips/click selection.
- Keep a thin HTML surface only where needed (e.g. one tooltip / popup portal)—not one DOM node per marker.
- Ship incrementally where practical (overlay shell → markers → paths → delete old Marker/GeoJSON path), with camera sync and pointer routing as first-class work.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `geographic-map`: map subject geometry and interactions are drawn via a Pixi overlay driven by MapLibre camera; MapLibre is not the primary marker/path renderer.

## Impact

- `GeographicMap.tsx` — composition of MapLibre + Pixi overlay; retire Marker/path Source/Layer rendering path.
- New map Pixi module(s) under e.g. `src/pixi/` or `src/components/map/` — scene graph, camera sync, hit-test.
- Reuse `layoutScreenBubbles` / life-path / temporal utilities; adapt consumers to feed screen positions into Pixi instead of Markers.
- Dependencies: existing `pixi.js` / `@pixi/react` (already used by the timeline); MapLibre remains for basemap.
- Two WebGL contexts (MapLibre + Pixi) — measure memory/perf on dense collections; document fallback options in design if needed.
