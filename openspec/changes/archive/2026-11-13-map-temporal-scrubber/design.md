# Design

## Context

See proposal.md for motivation. Today the map builds full life paths in `lifePaths.ts` (birth → personal → publications → death as blocks), renders them in `GeographicMap.tsx`, and shares URL/state through `Chronology.tsx` + `appUrl.ts`. Timeline collection framing already uses `min(born)`…`max(died)`; the map clears camera on collection change but has no temporal viewport. Person thumbnails already exist for the Pixi timeline.

## Goals / Non-Goals

**Goals:**
- Own map temporal state (`yearFrom`, `yearTo`, `year`) in the chronology shell and URL, with scrubber UI only on `/map`.
- Derive avatar positions from a year-sorted birth/personal/death track separate from the drawn path that may still include publications.
- Apply range, echo, and playhead opacity in one place so GeoJSON layers and portraits stay consistent.
- Pace playback by content density with empty-span compression ≤ 5s, without moving the map camera.

**Non-Goals:**
- Scrubber or playhead on the Pixi diagram.
- Auto-follow / camera animation tied to `year`.
- Reworking Noco data coverage or redefining publication geography as travel.
- Changing timeline `start`/`end` semantics.

## Decisions

### 1. State ownership in Chronology, not only inside GeographicMap
Keep `year` / `yearFrom` / `yearTo` beside existing map camera state in `Chronology.tsx`, pass them into the map and scrubber, and persist via `persistUrl`.  
**Why:** Collection resets, URL restore, and view switching already live there; the scrubber is chrome, not a MapLibre concern.  
**Alternative:** Local state inside the map component — simpler render wiring, weaker URL/collection integration.

### 2. Extend `appUrl` map branch with `year`, `yearFrom`, `yearTo`
Round years to integers in the query (like `start`/`end`). On timeline view, omit these keys. On map view without them, initialize from the active collection span and set `year = yearFrom`.  
**Why:** Matches existing view-specific viewport pattern (`lat`/`lng`/`zoom` vs `start`/`end`/`row`).  
**Alternative:** Single `year` only — rejected; range selection needs explicit bounds.

### 3. Two geometries from shared life data
- **Drawn path / markers:** keep today’s builder (may include publications) for lines and publication/event points.
- **Avatar track:** new helper that takes birth + personal events with coords + death, sorts by year, dedupes adjacent identical coordinates, and exposes `positionAtYear(track, year)` with linear lat/lng interpolation.  
**Why:** Specs require cinematic motion without treating publication cities as travel.  
**Alternative:** One chronologically merged path for both — would pull avatars through publisher cities.

### 4. Opacity as a pure function of years
Centralize something like `temporalOpacity({ y, year, yearFrom, yearTo, mode })`:
- Hard reject if `y < yearFrom - 200` or `y > yearTo`.
- Echo band `[yearFrom - 200, yearFrom)` → fixed reduced opacity (e.g. 0.35) when not superseded by stricter playhead fade.
- In range at full opacity for static range viewing.
- When playhead rules apply (scrub/play): hide `y > year`; full for age ≤ 200; linear 1→0 for age (200, 400); 0 for age ≥ 400. Combine with range/echo by taking the minimum applicable opacity.  
Segments: opacity from endpoint years (min, or sample mid-year). Features with null year stay hidden under temporal rules.  
**Why:** One policy for paths, markers, and portraits (including post-death fade).  
**Alternative:** Only MapLibre style expressions — harder to share with HTML/canvas portraits and unit-test.

### 5. Portraits as MapLibre symbol/HTML markers driven by avatar track
Prefer MapLibre markers or a symbol layer fed by a FeatureCollection of portrait positions recomputed when `year` changes (throttle to animation frames during play). Reuse `assets/person/{thumbnail}` URLs already used by the timeline.  
**Why:** Matches existing map stack; avoids a second Pixi surface.  
**Alternative:** Overlay React absolutely positioned divs — more DOM churn on play.

### 6. Playback clock with density-based dt
Precompute or incrementally detect “content years” for the active filtered set (births, deaths, personal `yearFrom`, publication years that affect visible markers, plus years where any avatar sits mid-segment if needed for smoothness).  
- Dense / content-adjacent years: fixed slow rate (tune empirically; start ~15 years/s).  
- Empty runs: choose speed so the whole run’s wall time ≤ 5s (with short ease in/out).  
Play always assigns `year = yearFrom` first, then RAF until `yearTo` or pause. URL updates: `replaceState` throttled during play; `push` optional on play start/stop only if needed to avoid history spam — default throttle replace while playing.  
**Why:** Matches narrative pacing without hard skips.  
**Alternative:** Constant years/s — rejected. Event-to-event jumps — rejected in favor of continuous year with speed changes.

### 7. Collection change on map resets temporal range like timeline framing
Reuse the same min/max lifespan calculation already used for diagram `start`/`end`. Also set `year = yearFrom` and write URL. Do not auto-fit camera beyond today’s clear-and-refit behavior.  
**Why:** One mental model for “this collection’s time box.”

### 8. Scrubber UI
New presentational control under the map (range brush + playhead + play/pause). Changing the brush updates `yearFrom`/`yearTo` and clamps `year`. Does not appear in the top `Menu`.  
**Why:** Specs isolate temporal chrome to the map; top menu stays shared and stable.

## Risks / Trade-offs

- [Sparse personal events] → Many avatars only interpolate birth→death; mitigate by keeping publication markers visible under temporal rules so the map still “fills in.”
- [Play without camera follow] → Action may leave the viewport; accepted; users pan manually.
- [Opacity on line segments with wide year spans] → Mid-segment sampling can look soft; acceptable for v1.
- [URL churn during play] → Throttle `replaceState`; avoid pushing every frame.
- [Dual path models] → Drawn path order can still be non-monotonic across kinds; avatar track is authoritative for portraits only — document in code comments near helpers.

## Migration Plan

- No data migration; static bundles unchanged.
- Old map URLs without temporal params keep working via collection defaults.
- Rollback: remove scrubber UI and temporal filters; URL keys ignored if unread.

## Open Questions

- Exact echo opacity value and dense playback years/s — tune visually during implement; does not change specs.
- Whether play stop should leave `year` at `yearTo` only (specified) or also flip a “range overview” mode flag — treat stop as leaving playhead rules active at `yearTo` unless product later wants an explicit “show whole range” control.
