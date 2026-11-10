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
The system SHALL encode the timeline year range and top row in the query when the timeline is active, and map center latitude, longitude, and zoom when the map is active.

#### Scenario: Timeline pan updates query viewport
- **WHEN** the user pans or zooms the timeline
- **THEN** `start`, `end`, and `row` query parameters reflect the visible range and top row

#### Scenario: Map pan updates query viewport
- **WHEN** the user pans or zooms the map
- **THEN** `lat`, `lng`, and `zoom` query parameters reflect the map camera

### Requirement: Hash-based view state is retired
The system SHALL NOT rely on the URL hash fragment to restore collection or timeline camera state.

#### Scenario: Legacy hash alone does not restore state
- **WHEN** the user opens a URL that only contains the legacy hash form of collection and timeline viewport
- **THEN** the application does not treat that hash as the source of truth for view state

### Requirement: Switching views preserves shared query state
The system SHALL keep collection, layer toggles, and dark mode when switching between timeline and map, while replacing only the viewport parameters appropriate to the destination view.

#### Scenario: Switch to map keeps collection and layers
- **WHEN** the user switches from timeline to map with a collection and layers selected
- **THEN** the map URL keeps those shared query values and the menu buttons keep the same pressed states and order
