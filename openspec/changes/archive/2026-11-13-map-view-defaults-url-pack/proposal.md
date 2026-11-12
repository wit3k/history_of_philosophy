# Proposal

## Why

Map and timeline now share one layer-toggle state and drop the other view’s viewport from the URL on switch, so neither view can keep its own defaults or camera. Dense map playback also hops portraits into neighbors and advances at a near-binary pace that does not slow smoothly through content-heavy decades. We need independent per-view settings in a compact shareable URL, quieter crowd motion, and density-aware play speed.

## What Changes

- **BREAKING (URL encode):** Prefer a packed query param `p` for dual-view layers and both viewports; keep `collection` and `dark` as named keys. Read legacy verbose params for migration; new writes use the packed form with `_` separators (URL-unreserved; no `%2C` noise).
- Persist **separate layer masks** for timeline vs map in the URL at all times (whichever view is active).
- Default map layers (when `layersM` absent): **authors on**, all other layer bits off. Timeline defaults remain the current full set when `layersT` absent.
- Switching views applies that view’s stored layers to the shared menu chrome.
- Crowded portraits: replace geographic hop with a **border-only pulse** that does not move layout positions; sparse portraits keep hop **only while playback is playing** (frozen on pause).
- City piles use **stable id-based packing** (no iterative push thrash); selection/hover **emphasizes** the active person without dimming everyone else.
- Playback advances on **day steps** at every speed; pace scales with local content-year density in a **10-year** window (~15→~5 years/s at 1×); empty spans keep compression.
- Location modal map icon opens the **in-app map** centered on that place (not OpenStreetMap).
- Scrubber labels sit on the handles (from below, to above, playhead beside the bubble with edge flip).
- Map pan during playback must **not** fight a camera↔URL feedback loop (focus token for intentional jumps only).

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `url-state`: Dual-view packed `p` param (`_`-separated); independent layer/viewport persistence; migration from legacy query keys; pan commits do not re-apply as controlled camera jumps.
- `geographic-map`: Map-only default layers; crowded pulse; pause-frozen motion; stable city packing; highlight without global dim; location → in-app map focus.
- `map-temporal-scrubber`: Density-based playback pace; day-quantized playhead; handle-adjacent date labels.

## Impact

- `src/utils/appUrl.ts` encode/decode and Chronology URL sync / view switch / camera focus token.
- Map layer initial state and menu binding when `view` changes.
- Portrait hop/pulse, Pixi highlight path, screen packing in `mapVisual`.
- `playbackYearsPerSecond`, day quantization, scrubber chrome.
- `LocationDetails` show-on-map callback.
- Existing share links with verbose layer/viewport keys (and legacy comma `p`) must still open correctly once.
