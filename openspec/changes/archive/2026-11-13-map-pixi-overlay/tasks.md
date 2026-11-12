# Tasks

## 1. Overlay shell and camera sync

- [x] 1.1 Add a Pixi application host over the MapLibre container (transparent, matching size/DPR); pick imperative vs `@pixi/react` for this overlay and document the choice in a short code comment; verify resize keeps the canvas flush with the map
- [x] 1.2 Wire rAF-coalesced camera sync on map `move` / `moveend` / resize using `project`; verify a debug crosshair at a fixed lat/lng stays registered while panning and zooming
- [x] 1.3 Decide pointer routing (pass-through empty space vs Pixi-first); verify map pan/zoom still works and a temporary Pixi hit target can receive click without breaking drag

## 2. Markers in Pixi

- [x] 2.1 Render portraits, event/publication dots, and hubs from existing bubble + `layoutScreenBubbles` pipeline into Pixi (stable ids); verify dense Europe shows subjects without React `<Marker>` for those kinds
- [x] 2.2 Run collision layout on camera settle and quantized temporal id-set changes only; verify pan stays smooth and spiderfy/person non-hub rules still hold after zoom settle
- [x] 2.3 Port hover/click selection and search dimming onto Pixi display objects; verify sticky selection and search composition still match geographic-map scenarios
- [x] 2.4 Replace per-marker popups with a single HTML tooltip portal positioned from projected coords; verify tooltip shows for hover/tap targets and does not create N DOM markers

## 3. Life paths in Pixi

- [x] 3.1 Draw life-path segments in Pixi from existing path geometry + temporal opacity; verify lifelines toggle and playback fade still apply
- [x] 3.2 Port path hover hit-testing and animated selection dash into Pixi; verify invisible (opacity≈0) segments do not steal hover
- [x] 3.3 Remove MapLibre GeoJSON path `Source`/`Layer`/`life-path-hit` and React `<Marker>` rendering for migrated subjects; verify map view still shows basemap + overlay only for those features

## 4. Integration check

- [ ] 4.1 Manual pass on a dense collection: play at slow and 1× speeds, pan/zoom Europe, search + select a person; verify no severe stutter relative to pre-overlay Marker approach and no lasting camera/overlay drift

## Workflow follow-up

- Archive after review; sync `geographic-map` delta into main specs on archive.
