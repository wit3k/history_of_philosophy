# Tasks

## 1. Screen-space layout helpers

- [x] 1.1 Add pure helpers in `mapVisual` (or a small adjacent module) for pixel collision radius, grid/union clustering of projected points, and spiderfy offsets with per-bubble diameters; verify with a tiny unit-style check or console fixture that two points closer than `2R` merge and farther ones do not
- [x] 1.2 Decide collapse vs spiderfy for a component (footprint vs neighbors / max ring budget) and document the constants next to the helpers; verify a same-location pile spiderfies when `R` fits and collapses when forced into a tiny budget
- [x] 1.3 Change collapse vs spiderfy so the primary gate is collision with other markers / available free viewport space (not a small absolute ring-radius cap such as ~96px); keep the same ring offsets as click-expand; verify a large coincident pile with empty surroundings spiderfies and a pile boxed in by neighbors collapses to a hub

## 2. Wire layout into GeographicMap

- [x] 2.1 Replace geo `clusterKey` grouping as the authority for hubs: on each layout tick, project all visible bubbles, run collision layout, and produce either individual display lat/lng or count hubs; verify zooming out over dense Europe increases hub counts and zooming in reveals more individuals
- [x] 2.2 Stop using `clusterAutoExpandZoom` for auto expand/collapse; clear or remap manual expand keys on camera settle; verify same-city items are not permanently glued at high zoom solely by geo precision
- [x] 2.3 Render markers at layout positions (hubs + individuals) and keep tooltips/selection/search dimming using member identity; verify click on hub still expands or spiderfies usefully and sticky selection dashed path still works
- [x] 2.4 Throttle layout to animation frames on move/zoom and confirm no obvious overlap remains for mixed portraits/events at low and high zoom in a dense collection
- [x] 2.5 Pass viewport / neighbor free-space into the layout path from `GeographicMap`; verify Athens-like dense same-location piles do not show a lone count hub (e.g. “83”) while empty map remains around them, and that click-expand still works when a hub is justified

## Workflow follow-up

- Archive after review; sync `geographic-map` delta into main specs on archive.
