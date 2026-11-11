# Design

## Context

See proposal.md — Why. Timeline search already dims non-matches in Pixi (`TimelineLayers`, alpha `0.22`) via `searchQuery`. `GeographicMap` already composes temporal opacity with sticky/hover `activePersonId` dimming (`HIGHLIGHT_DIM = 0.1`) but never receives `searchQuery`.

## Goals / Non-Goals

**Goals:**

- Wire shared `searchQuery` into the map and apply diagram-equivalent match/dim.
- Compose search with existing selection/hover highlight without breaking click-to-select dashed paths.
- Keep clusters usable: a group stays “hot” if any member matches search (and/or selection).

**Non-Goals:**

- Changing timeline search behavior or match rules.
- Putting search into URL state.
- Hard-filtering (removing) non-matching features from the map.
- Auto-panning/zooming to search hits.
- Matching personal-event labels or location names (diagram does not either).

## Decisions

### 1. Pass `searchQuery` as a prop (same Chronology state)

**Choice:** `Chronology` passes existing `searchQuery` into `GeographicMap`.

**Why:** One source of truth; switching map/timeline keeps the needle.

**Alternative:** Map-local search — rejected; would diverge from the shared SearchBar.

### 2. Match rules mirror the diagram exactly

**Choice:**

- Person-linked content (portrait, path, birth/death/personal bubbles): match if `person.name.toLowerCase().includes(needle)`.
- Publication bubbles: match if publication title includes needle (resolve title via `refId` → `publicationsList`, same list already on the map props).

**Why:** User asked for the same filtering as the diagram.

**Alternative:** Also match event labels — out of scope (diagram does not).

### 3. Opacity composition (confirmed option 2)

**Choice:** Apply search first, then selection:

```
effectiveOpacity =
  baseTemporalOpacity
  * (searchActive && !searchMatch ? SEARCH_DIM : 1)
  * (selectionActive && !isSelectedPerson ? SELECTION_DIM : 1)
```

Approximate constants: `SEARCH_DIM ≈ 0.22` (diagram), keep existing selection dim (~0.1) for non-selected when selection/hover is on.

**Why:** Search is the broad spotlight; sticky click still further focuses one person among what’s bright.

**Alternatives considered:** Search-only while query active (weaker selection UX); hard filter (rejected).

### 4. Path GeoJSON opacity in paint expressions

**Choice:** Either (a) bake a per-feature `searchDim` / effective opacity into path feature properties when building/filtering client-side display props, or (b) keep personId on features and use MapLibre `case` expressions against a highlight person id plus a JS-driven opacity multiplier on the source data when search changes.

**Preferred:** Recompute path feature display opacity in a `useMemo` keyed by `searchQuery` + selection (mutate copied properties, not the temporal geojson builder) so line paint stays simple (`line-opacity: ['get','opacity']` or a dedicated `displayOpacity`).

**Why:** Search match is per-person (and pubs are markers, not path segments); MapLibre cannot substring-match titles in expressions without encoding flags.

### 5. Clusters

**Choice:** Cluster hub is a search match if any member matches. Expanded members use per-item match. Dim hub when search active and no member matches (and apply selection dim if none of the members is the selected person).

### 6. Optional shared helper

**Choice:** Small pure helper e.g. `matchesSearch(haystack, query)` in `src/utils/` is nice-to-have; not required if map keeps a local needle trim. Do not refactor Pixi in this change unless trivial.

## Risks / Trade-offs

- **[Risk] Publication title lookup misses if `refId` type mismatch** → Mitigate: compare with `String(id)` as Chronology already does for publication modal.
- **[Risk] Double-dim (search × selection) makes selected non-match nearly invisible** → Acceptable per composition rules; selection dashed path still indicates focus when a path exists.
- **[Risk] Large re-memo of path GeoJSON on each keystroke** → Path feature count is modest; if needed, only rewrite `opacity`/`searchMatch` properties on a shallow-cloned FeatureCollection.

## Migration Plan

- No data migration. Ship with the map UI change; empty search is a no-op.
- Rollback: stop passing `searchQuery` / ignore prop.

## Open Questions

- None that block implementation; exact dim constant may be tuned to match perceived diagram brightness without a spec change if kept near `0.22`.
