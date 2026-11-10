# Spec Delta

## MODIFIED Requirements

### Requirement: View-specific viewport in the query string
The system SHALL encode the timeline year range and top row in the query when the timeline is active, and map center latitude, longitude, zoom, and temporal `year`, `yearFrom`, and `yearTo` when the map is active.

#### Scenario: Timeline pan updates query viewport
- **WHEN** the user pans or zooms the timeline
- **THEN** `start`, `end`, and `row` query parameters reflect the visible range and top row

#### Scenario: Map pan updates query viewport
- **WHEN** the user pans or zooms the map
- **THEN** `lat`, `lng`, and `zoom` query parameters reflect the map camera

#### Scenario: Map temporal scrub updates query years
- **WHEN** the user changes the map temporal range or playhead
- **THEN** `yearFrom`, `yearTo`, and `year` query parameters reflect the scrubber state

#### Scenario: Timeline URL omits map temporal params
- **WHEN** the timeline view is active
- **THEN** the query string does not use `year`, `yearFrom`, or `yearTo` as the timeline’s viewport representation

### Requirement: Switching views preserves shared query state
The system SHALL keep collection, layer toggles, and dark mode when switching between timeline and map, while replacing only the viewport parameters appropriate to the destination view, including map temporal year parameters when entering or leaving the map.

#### Scenario: Switch to map keeps collection and layers
- **WHEN** the user switches from timeline to map with a collection and layers selected
- **THEN** the map URL keeps those shared query values and the menu buttons keep the same pressed states and order

#### Scenario: Leave map drops map temporal params from timeline URL
- **WHEN** the user switches from map to timeline
- **THEN** the timeline URL keeps shared query values and does not carry map-only `year`, `yearFrom`, or `yearTo` as timeline viewport state

## ADDED Requirements

### Requirement: Map temporal state restores from the query string
When the map view loads with `year`, `yearFrom`, and/or `yearTo` present in the query string, the system SHALL restore the scrubber from those values, clamping `year` into `[yearFrom, yearTo]` when all three are present and valid.

#### Scenario: Open map URL with temporal params
- **WHEN** the user opens a map URL that includes valid `yearFrom`, `yearTo`, and `year` values
- **THEN** the map scrubber shows that range and playhead

#### Scenario: Missing temporal params use collection defaults
- **WHEN** the user opens the map view without `yearFrom` and `yearTo` in the query and a non-empty collection filter is active
- **THEN** the scrubber initializes `yearFrom` and `yearTo` from that collection’s lifespan span and sets `year` to `yearFrom`
