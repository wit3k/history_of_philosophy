# Proposal

## Why

Search highlighting works on the timeline diagram (dim non-matches, emphasize name/title hits) but the map ignores `searchQuery`, so Ctrl+F / the search bar does nothing useful in map view. Users expect the same filter feedback when switching views.

## What Changes

- Pass the shared `searchQuery` into the geographic map view.
- When the query is non-empty, dim map content that does not match, using the same match rules as the diagram:
  - people: case-insensitive substring on person name
  - publications: case-insensitive substring on publication title
- Keep non-matching geometry on the map (dim, do not remove) — same visual approach as the diagram.
- Compose with existing sticky person selection / hover highlight: search dims non-matches first; among matches (and overall), click selection still drives dashed path animation and stronger focus.
- Empty / whitespace-only query restores normal map opacity behavior (selection/hover only).

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `geographic-map`: add search-query highlight/dim behavior aligned with the timeline diagram, including composition with map person selection.

## Impact

- `Chronology.tsx` — pass `searchQuery` into `GeographicMap`.
- `GeographicMap.tsx` — apply search match/dim to paths, portraits, event/publication bubbles, and clusters; compose with `activePersonId` highlight.
- Possibly small shared helper for needle matching (optional; diagram logic today is inline in Pixi layers).
- No URL/schema changes (`searchQuery` remains session UI state as on the timeline).
- No changes to collection filtering or temporal scrubber rules.
