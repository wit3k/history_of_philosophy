# Design

## Context

See proposal.md — Why. Today `appUrl.ts` writes one shared `LayerFlags` plus either timeline (`start/end/row`) or map (`lat/lng/zoom/year*`) viewport. Chronology holds a single set of display* toggles. Portrait walk hop lives in `positionAtYear` as lat/lng offsets. Playback uses `playbackYearsPerSecond` with binary nearby-content vs empty-span compression.

## Goals / Non-Goals

**Goals:**
- Dual layer masks + both viewports always in URL via packed `p` with readable `_` separators.
- Named `collection` / `dark`; authors-only map default; view switch applies destination mask.
- Crowd: border pulse, no hop; sparse: hop only while playing; city piles stay stable.
- Density pace over 10-year content-year window (~15→~5 y/s at 1×); day-step playhead.
- Selection/hover emphasize without dimming the rest of the map (CPU).
- Intentional camera focus only (no pan↔URL jump loop during playback).

**Non-Goals:**
- Perfect human-editable `p` (order-based is enough).
- Final min/max pace tuning beyond provisional 15/5 (experimental later).
- Changing event spiderfy policy beyond portrait packing stability.

## Decisions

### 1. Pack schema for `p`

**Choice:** Fixed slots separated by `_` (URL-unreserved; stays readable in the address bar):

`layersT_layersM_start_end_row_lat_lng_zoom_year_yearFrom_yearTo`

`layersT` / `layersM` = 0–127 bitmasks; bit order matches today’s layer key order: authors, lifelines, sympathies, pubs, refs, events, personal. Empty slots stay empty (`__`). Legacy comma-separated `p` still decodes.

**Why:** One short param; order owns meaning; commas became `%2C` via `URLSearchParams` and made shares look longer/uglier.

**Alternative:** Base64 blob — shorter, opaque. Comma CSV — rejected after encode noise. Two params `t`/`m` — clearer but longer.

### 2. App state model

**Choice:** Chronology keeps `layersTimeline` and `layersMap` (or equivalent). Menu binds to `view === 'map' ? layersMap : layersTimeline`. On toggle, update active mask + rewrite URL. On view switch, swap bound mask without copying bits across views.

**Why:** Matches “independent settings” without fighting shared menu chrome.

**Alternative:** Single mask rewritten on every switch — loses independence.

### 3. Defaults

**Choice:** `DEFAULT_LAYERS_TIMELINE` = today’s all-true. `DEFAULT_LAYERS_MAP` = authors only. Used when the corresponding mask is missing from `p` / legacy decode.

**Why:** Agreed in explore.

### 4. Legacy migration

**Choice:** If `p` missing, build both masks from legacy shared layer keys (same bits for T and M initially) and viewports from present keys; then prefer writing `p` on next persist.

**Why:** Old links keep working; dual masks appear after first save.

### 5. Crowd detection + pulse + packing

**Choice:** After portrait screen positions, count other portraits within ~1–1.5 diameters (with hysteresis). If crowded: no hop, border pulse **only while `playing`**. Sparse: screen hop only while playing. Coincident city piles use id-stable angle + greedy radius packing (not iterative push-apart), with light carry/damping across playhead ticks.

**Why:** Layout stays stable; pause is still; dense cities no longer reshuffle every day.

**Alternative:** Always disable hop — rejected; user wants hop when sparse and playing.

### 6. Density playback + day steps

**Choice:** For playhead `y`, window `[floor(y)-5, floor(y)+4]` (10 years). `d = contentYearsInWindow / 10`. `yearsPerSec = lerp(15, 5, smoothstep(d)) * speedMultiplier`, empty-span compression when no content. React commits use `quantizeToDay` at **every** speed (rAF may skip days when fast).

**Why:** Smooth travel; year snapping was jarring even at 1×+.

### 7. Highlight without global dim

**Choice:** Hover/tap sets an emphasized person (ring, dashed path). Do **not** multiply opacity of all other bubbles/paths. Overlay updates highlight person id without rebuilding the whole bubble set for dimming.

**Why:** Dim-everyone was CPU-heavy during hover.

### 8. Camera focus token

**Choice:** `mapCamera` in Chronology is for URL persistence. GeographicMap jumps to it only on mount/`onLoad` or when `cameraFocusToken` bumps (show-on-map, popstate). Pan `onCameraCommit` updates camera + URL but does **not** bump the token. Programmatic `jumpTo` suppresses the following moveend commit echo.

**Why:** Pan during playback was fighting a jump↔commit↔URL loop.

### 9. Location → in-app map

**Choice:** Location modal map control calls into Chronology to close modals, switch to map, set camera (zoom ~12), bump focus token, persist URL — not OpenStreetMap.

### 10. Scrubber labels

**Choice:** Remove the top “from–to / playhead” row. Place `yearFrom` under the from handle, `yearTo` above the to handle, playhead date beside the playhead bubble (prefer right / inside the blue range; flip left near the track’s right edge).

## Risks / Trade-offs

- **[Risk] Bitmask / slot order drift** → Single constant array shared by encode/decode; add tests for round-trip.
- **[Risk] Legacy dual-mask ambiguity** → Document that first open clones shared legacy layers into both masks until user diverges.
- **[Risk] Crowd threshold feel** → Expose constant; tune after playtest.
- **[Risk] 15↔5 pace too mild/harsh** → Mark provisional in code comments; scrubber multiplier still applies.
- **[Risk] Focus token forgotten on a new deep-link path** → Any intentional recenter must bump the token.

## Migration Plan

1. Ship decode(`p` | legacy | comma-`p`) + encode(`_`-`p` only for layers/viewports).
2. Split Chronology layer state; wire menu to active view.
3. Portrait pulse / packing / highlight / density pace / scrubber labels / location focus / camera token.
4. Smoke: old URL opens; switch views; share map-only-authors link; pan while playing.

Rollback: revert URL helpers and Chronology dual state; legacy keys can be re-enabled for write if needed.

## Open Questions

- Exact neighbor count / distance for “crowded” — start with ≥3 within 1.25 diameters; tune later.
- Whether empty-span compression should ignore the density curve entirely (recommended: yes when no content in window).
