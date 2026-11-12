# Proposal

## Why

The geographic map draws each person’s full life path at once, so time is only metadata on points—not something the viewer can scrub, range-select, or play. A map-only temporal scrubber makes geography readable as “where people are in year Y” and lets a shareable URL restore that moment and range.

## What Changes

- Add a bottom timeline bar on the map view only (not the Pixi diagram) with range selection (`yearFrom`–`yearTo`) and a playhead (`year`).
- Support play/pause that always starts at `yearFrom` and animates through `[yearFrom, yearTo]` with slow pacing where content changes and compressed empty stretches (≤ 5 seconds wall time).
- Drive map visibility from temporal state: full opacity inside the selected range; semi-transparent echo for 200 years before `yearFrom`; outside the range (and, during play/scrub relative to `year`, future and very old traces) hidden or faded per the agreed curves.
- Place portrait bubbles that interpolate along a chronological travel track of birth → personal events → death; publications remain year-filtered markers and do not pull the avatar.
- Keep the map camera under user control (no auto-follow during scrub/play).
- Default `yearFrom`/`yearTo` (and reset `year` to `yearFrom`) from the active collection’s people lifespan span (`min(born)`…`max(died)`), analogous to timeline framing today.
- Persist `year`, `yearFrom`, and `yearTo` in the map view query string alongside existing map camera params.

## Capabilities

### New Capabilities
- `map-temporal-scrubber`: Map-only temporal range, playhead, playback pacing, portrait travel along life tracks, and year-based visibility/fade rules for map content.

### Modified Capabilities
- `geographic-map`: Map geometry and markers respect temporal scrubber state (range, playhead, fades) while keeping existing layer and collection rules.
- `url-state`: Encode and restore map temporal query params `year`, `yearFrom`, and `yearTo`; keep them view-specific like `lat`/`lng`/`zoom`.

## Impact

- UI: new map chrome (bottom scrubber) in the chronology shell; `GeographicMap` rendering updates for opacity, filtered GeoJSON, and portrait markers.
- State/URL: `appUrl.ts` / `Chronology.tsx` gain map temporal fields; collection change on map resets temporal range like timeline `start`/`end`.
- Data helpers: chronological avatar track distinct from today’s block-ordered life-path builder (`lifePaths.ts`); person thumbnails already used on the timeline reused on the map.
- Specs: new `map-temporal-scrubber`; deltas for `geographic-map` and `url-state`.
- Out of scope: temporal scrubber on the Pixi timeline diagram; camera auto-follow; using publications as avatar waypoints; changing Noco import coverage of personal events.
