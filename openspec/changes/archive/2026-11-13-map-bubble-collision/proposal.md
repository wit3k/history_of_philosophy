# Proposal

## Why

Map bubbles currently cluster by a fixed geographic grid (`clusterKey` precision) and only “un-stick” via hardcoded zoom thresholds. Zooming out still leaves different cities overlapping on screen, while zooming in keeps same-city items glued until an arbitrary zoom. Clustering should follow **screen-space collision** of fixed-radius bubbles so density tracks zoom naturally.

## What Changes

- Replace geo-grid clustering + zoom-threshold auto-expand with **pixel-space** layout:
  - Bubbles never overlap on screen (fixed visual radius + margin).
  - When items would collide, either gently **repel / spiderfy** them if there is room, or collapse into a **count hub** when packing would still collide.
  - Zoom out → more count hubs, fewer individuals; zoom in → more individual bubbles.
- **Empty screen space wins over pile size:** coincident / near-coincident events, publications, and portraits SHALL auto-spiderfy with the same ring-style offsets used after clicking a count digit whenever neighboring markers and free viewport space allow — including large same-location piles (e.g. dozens of Athens items). A count hub is for when the spiderfy footprint would overlap other markers or cannot fit in available screen space; shared coordinates or a large member count alone MUST NOT force a hub while empty map area remains around the pile.
- Any overlapping screen neighbors can join a count hub (including different cities) — confirmed product choice.
- Retire reliance on `clusterKey` precision and `clusterAutoExpandZoom` thresholds for grouping decisions (helpers may remain only if reused for spiderfy geometry).
- Keep existing click-to-expand / sticky selection / search dimming behaviors working with the new layout model (adapt, don’t drop).

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `geographic-map`: redefine marker clustering/layout as screen-space collision avoidance with count hubs only when bubbles cannot fit without overlap.

## Impact

- `GeographicMap.tsx` — rebuild `mapClusters` / placement pipeline around projected pixel positions and zoom/move updates.
- `mapVisual.ts` — new collision/cluster helpers; deprecate or stop using geo `clusterKey` + auto-expand zoom tables for grouping.
- Interaction: cluster expand/collapse, tooltips, selection highlight must use new group keys and display positions.
- Performance: recompute layout on zoom/pan (throttle as needed); no new dependencies required if implemented in-house (optional later: Supercluster — not assumed).
