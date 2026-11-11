# Design

## Context

See proposal.md — Why. Today `GeographicMap` groups with `clusterKey(lat,lng, precision=3)` and expands piles via `clusterAutoExpandZoom` + `clusterRingPixelOffsets`. That is geo-stable and zoom-thresholded, not collision-aware. Bubbles already have roughly fixed CSS diameters (events ~11–14px, portraits 28, hub 34). MapLibre `project`/`unproject` is already used for ring offsets.

## Goals / Non-Goals

**Goals:**

- Screen-space non-overlap for all marker kinds (portraits, events, pubs, hubs).
- Count hubs only when packing cannot fit individuals.
- Spiderfy coincident / near-coincident points when space allows.
- Recompute on zoom/pan; preserve click expand, selection, search dimming.

**Non-Goals:**

- Changing temporal opacity, search matching, or life-path GeoJSON.
- Perfect global force-layout animation every frame (stable layout per camera tick is enough).
- Adopting MapLibre native `cluster` on GeoJSON sources for HTML Marker UI (possible later; not required).

## Decisions

### 1. Cluster in projected pixel space

**Choice:** Each layout pass: `map.project([lng,lat])` for every visible bubble → run collision clustering → assign either individual display positions or a hub.

**Collision radius:** `R = max(bubbleRadiusPx) + margin` with margin ≈ half radius (consistent with existing ring spacing spirit: centers at least `1.5 * diameter` apart → gap = 0.5 diameter).

**Why:** Matches the product rule “fixed width → zoom changes how many fit.”

**Alternative:** Supercluster with zoom-scaled geo radius — good, but HTML markers + mixed radii + spiderfy still need custom placement; start without a new dependency.

### 2. Algorithm sketch (greedy / hierarchical)

**Choice (pragmatic):**

1. Project all items.
2. Build clusters by unioning items whose disks collide (union-find or grid hash with cell size ≈ `2R`).
3. For each connected component:
   - If size == 1 → place at true projection.
   - If size > 1: spiderfy around the component centroid using the **same** `clusterRingPixelOffsets` path as click-to-expand (per-item diameters / hub clearance).
   - Collapse to a **count hub** at the centroid **only when** that spiderfy footprint would collide with **other** components’ reserved disks, or cannot fit in available free viewport space around the pile (optional soft cap ≈ a fraction of the viewport diagonal / inset from map edges).
   - Do **not** use a small absolute ring-radius constant (e.g. ~96px) as the primary collapse gate — that produces hubs like “83” over Athens while empty sea remains around the pile. Shared coordinates and large member counts alone are not grounds to hub.
4. Optionally merge hubs that still collide after collapse (iterate once or twice).

**Why:** Simple, deterministic enough for React markers, reuses ring math; empty screen space wins over pile size.

**Alternative:** Full force-directed relaxation every move — nicer packing, harder to stabilize and costlier.

### 3. Replace geo `clusterKey` as grouping authority

**Choice:** Group identity becomes layout-derived (e.g. hub id from member id set hash or centroid+zoom bucket). Manual expand state keys off that id; clear or remap on camera changes that rebuild groups.

**Why:** Geo keys no longer match screen clusters across cities.

### 4. Retire zoom-threshold auto-expand table

**Choice:** Stop using `clusterAutoExpandZoom` for showing individuals vs hubs. Zoom only changes projections → layout decides. Manual click-to-expand of a hub can still spiderfy that hub’s members temporarily (even if auto layout preferred hub), then re-collapse when camera moves or user clicks empty map — keep if UX still wants click override; default to layout-driven only if click expand conflicts. **Default:** layout is source of truth; click on hub may still force spiderfy until next camera change (record as soft UX).

### 5. Performance

**Choice:** Recompute on `move`/`zoom` with rAF coalesce (already have `layoutTick`). Cap work: O(n) grid hashing for n markers in a collection (hundreds, not tens of thousands).

## Risks / Trade-offs

- **[Risk] Layout thrash while panning** → Coalesce to animation frames; optional hysteresis so tiny zooms don’t flicker hub↔individual.
- **[Risk] Spiderfy vs neighboring city** → Prefer collapse to hub when spiderfy intersects another cluster’s footprint (product: count hubs when they would collide).
- **[Risk] Small absolute spiderfy radius cap** → Causes large same-location piles to hub despite empty map (e.g. “83” over Athens). Prefer neighbor/viewport free-space checks; raise or remove the hard ~96px primary gate.
- **[Risk] Manual expand state desync** → Clear forced expands on camera settle.
- **[Risk] Path lines still meet at true coords while markers spiderfy** → Acceptable; markers are interaction targets, paths stay geographic.
- **[Risk] Very large spiderfy rings (80+ members)** → May cover basemap labels; still preferred over a opaque count hub when space is free; click hub remains for true overcrowding.

## Migration Plan

- Ship as UI-only change behind the map view; no URL/schema migration.
- Rollback: restore previous `mapClusters` memo.

## Open Questions

- Soft viewport budget (exact fraction of diagonal / edge inset) can be tuned during apply; neighbor collision remains the hard SHALL.
