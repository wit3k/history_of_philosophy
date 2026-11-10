# Tasks

## 1. Temporal helpers and URL

- [x] 1.1 Add pure helpers for collection lifespan span, `temporalOpacity`, avatar-track build (birth → personal → death, year-sorted), and `positionAtYear` interpolation; verify with a short bun/ts smoke script or REPL assertions on known fixture years (full, echo, fade, hidden, mid-segment position)
- [x] 1.2 Extend `AppUrlState` / `readAppUrl` / `formatAppUrl` with map-only `year`, `yearFrom`, `yearTo`; verify timeline URLs omit them and map URLs round-trip integer years
- [x] 1.3 Wire Chronology map temporal state: restore from URL, default from active collection when missing, reset on collection change (`year = yearFrom`), clamp playhead into range; verify changing collection on `/map` updates query years to that collection’s min born / max died

## 2. Scrubber chrome

- [x] 2.1 Build map-only bottom scrubber UI (range brush for `yearFrom`/`yearTo`, playhead for `year`, play/pause) mounted from Chronology when `view === 'map'`; verify it is absent on the timeline route and present on `/map`
- [x] 2.2 Persist scrubber edits through existing `persistUrl` (replace while dragging; sensible push on commit if already used elsewhere); verify query updates when brushing range or moving playhead

## 3. Map rendering under temporal rules

- [x] 3.1 Apply temporal opacity / filtering to path lines and point markers in `GeographicMap` while honoring Authors / Życiorysy / Publications / personal layers; verify a publication after playhead `year` disappears and turning Publications off still hides all pubs
- [x] 3.2 Render portrait markers from avatar tracks at `positionAtYear`, using person thumbnails when present and a fallback marker otherwise; verify a person with personal waypoints moves between them as `year` changes and does not visit publication cities
- [x] 3.3 Confirm map camera (`lat`/`lng`/`zoom`) does not change when only `year` advances; verify by playing/scrubbing without pointer map interaction

## 4. Playback

- [x] 4.1 Implement play that always sets `year = yearFrom`, advances to `yearTo` on RAF with slow content pacing and empty-span compression ≤ 5s wall time, pause/stop at `yearTo`; verify pressing play from mid-range restarts at `yearFrom` and a long empty gap completes within ~5s
- [x] 4.2 Throttle URL `replaceState` during play so history is not flooded; verify years in the query still converge to the final playhead after pause/complete

## 5. Integration check

- [x] 5.1 Manually walk map + collection switch + shared layers + view switch back to timeline; verify shared query preserved, map temporal params do not become timeline viewport, and `bun run build` (or `github`) succeeds
