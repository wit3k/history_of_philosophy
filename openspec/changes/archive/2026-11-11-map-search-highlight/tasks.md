# Tasks

## 1. Wire search into the map

- [x] 1.1 Add `searchQuery: string` to `GeographicMap` props and pass Chronology’s existing `searchQuery` into the map view; verify TypeScript accepts the prop and the SearchBar still updates the same state while on map view
- [x] 1.2 Derive a trimmed lowercase needle and `searchActive` flag inside the map (same trim/lowercase rules as `TimelineLayers`); verify empty/whitespace query leaves current opacity behavior unchanged

## 2. Apply match + dim composition

- [x] 2.1 Implement person-name and publication-title match helpers (title via bubble `refId` → `publicationsList`) and a composed opacity helper (temporal × search dim × selection dim per design.md); verify a known person name and publication title each match independently
- [x] 2.2 Apply composed opacity to path line features (cloned display properties / paint) so non-matching people’s paths dim when search is active; verify matching person’s path stays bright and sticky selection still draws the dashed highlight path
- [x] 2.3 Apply composed opacity to portraits, event bubbles, publication bubbles, and cluster hubs (hub hot if any member matches); verify mixed clusters and expanded members behave as specified
- [x] 2.4 Manually confirm sticky selection still works under an active search (click person → dashed + extra focus; click empty map → clear selection; hover does not clear selection) and that clearing the search query restores selection-only dimming

## Workflow follow-up

- Archive the change after review (`/opsx-archive` or project archive flow).
- Optionally sync the `geographic-map` delta into main specs on archive.
