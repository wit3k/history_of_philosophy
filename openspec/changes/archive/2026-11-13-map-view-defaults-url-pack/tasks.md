# Tasks

## 1. Packed URL encode/decode

- [x] 1.1 Add bitmask helpers and `p` pack/unpack with `_` separators (layersT, layersM, start, end, row, lat, lng, zoom, year, yearFrom, yearTo) in `appUrl.ts`; verify round-trip and no `%2C` in formatted URLs; accept legacy comma `p`
- [x] 1.2 Update `readAppUrl` to prefer `p`, fall back to legacy named keys (clone shared legacy layers into both masks); verify an old verbose query still restores
- [x] 1.3 Update `formatAppUrl` / `writeAppUrl` to emit `collection`, `dark`, and `p` (no legacy layer keys on write); verify a formatted URL contains `p` and omits `authors=`

## 2. Dual layer state in Chronology

- [x] 2.1 Split timeline vs map layer state with timeline full defaults and map authors-only defaults; verify fresh map load shows only Authors pressed
- [x] 2.2 Bind Menu toggles to the active view’s mask and persist that mask into `p` on change; verify toggling pubs on the map does not flip timeline pubs after switch
- [x] 2.3 On view switch, apply destination mask to the menu and keep both viewports/masks in `p`; verify switching map→timeline→map restores map camera and map layers

## 3. Crowded portrait pulse + stable packing

- [x] 3.1 Detect crowded portraits after screen layout (neighbor count/distance + hysteresis) and suppress hop for those ids; verify a lone traveler still hops while playing
- [x] 3.2 Render border-only pulse in the Pixi overlay for crowded portraits without changing layout positions; freeze hop/pulse when not playing
- [x] 3.3 Stable id-based packing for coincident city portraits; selection/hover emphasize without global opacity dim

## 4. Density-based playback pace + day steps + scrubber labels

- [x] 4.1 Implement 10-year content-year density and smooth lerp ~15→~5 y/s (× speed multiplier) in playback pacing; verify sparse vs fully dense windows differ as specified at 1×
- [x] 4.2 Keep empty-span compression (≤5 s at 1×) when the window has no content; verify a long empty gap still finishes within budget
- [x] 4.3 Always commit day-quantized playhead; place from/to/playhead labels on handles with playhead edge flip

## 5. Integration polish

- [x] 5.1 Manual pass: open legacy URL, switch views, share packed map URL with authors-only, play sparse then dense decades; verify layers/cameras/pulse/pace behave as above
- [x] 5.2 Location modal map control centers in-app map; pan during playback does not camera↔URL loop (focus token)

## Workflow follow-up

- Archive after review; sync deltas into main `url-state`, `geographic-map`, and `map-temporal-scrubber` specs.
