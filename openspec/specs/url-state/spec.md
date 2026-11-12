# url-state Specification

## Purpose

Owns shareable application navigation: which primary view is active and which filter, layer, theme, and viewport parameters are encoded in the browser path and query string.

## Requirements

### Requirement: Primary views use path segments
The system SHALL expose the timeline at the application base path and the geographic map at the `map` path segment under that base.

#### Scenario: Open timeline via path
- **WHEN** the user navigates to the application base path without a `map` segment
- **THEN** the timeline view is shown

#### Scenario: Open map via path
- **WHEN** the user navigates to the `map` path under the application base
- **THEN** the geographic map view is shown

### Requirement: Shared state lives in the query string
The system SHALL encode collection selection, layer visibility toggles that appear in the top menu, and dark mode in the URL query string for both primary views.

#### Scenario: Restore layers and theme from URL
- **WHEN** the user opens a URL that includes query parameters for layer toggles and dark mode
- **THEN** the top menu controls and both views reflect those values

#### Scenario: Changing a menu toggle updates the URL
- **WHEN** the user toggles a persisted menu control (layers or dark mode)
- **THEN** the query string is updated to match without a full page reload

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

### Requirement: Hash-based view state is retired
The system SHALL NOT rely on the URL hash fragment to restore collection or timeline camera state.

#### Scenario: Legacy hash alone does not restore state
- **WHEN** the user opens a URL that only contains the legacy hash form of collection and timeline viewport
- **THEN** the application does not treat that hash as the source of truth for view state

### Requirement: Switching views preserves shared query state
The system SHALL keep collection, layer toggles, and dark mode when switching between timeline and map, while replacing only the viewport parameters appropriate to the destination view, including map temporal year parameters when entering or leaving the map.

#### Scenario: Switch to map keeps collection and layers
- **WHEN** the user switches from timeline to map with a collection and layers selected
- **THEN** the map URL keeps those shared query values and the menu buttons keep the same pressed states and order

#### Scenario: Leave map drops map temporal params from timeline URL
- **WHEN** the user switches from map to timeline
- **THEN** the timeline URL keeps shared query values and does not carry map-only `year`, `yearFrom`, or `yearTo` as timeline viewport state

### Requirement: Map temporal state restores from the query string
When the map view loads with `year`, `yearFrom`, and/or `yearTo` present in the query string, the system SHALL restore the scrubber from those values, clamping `year` into `[yearFrom, yearTo]` when all three are present and valid.

#### Scenario: Open map URL with temporal params
- **WHEN** the user opens a map URL that includes valid `yearFrom`, `yearTo`, and `year` values
- **THEN** the map scrubber shows that range and playhead

#### Scenario: Missing temporal params use collection defaults
- **WHEN** the user opens the map view without `yearFrom` and `yearTo` in the query and a non-empty collection filter is active
- **THEN** the scrubber initializes `yearFrom` and `yearTo` from that collection’s lifespan span and sets `year` to `yearFrom`
