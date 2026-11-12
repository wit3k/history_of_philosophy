# Spec Delta

## ADDED Requirements

### Requirement: Packed dual-view state uses query param p
The system SHALL encode timeline and map layer masks and both views’ viewport numbers in a single query parameter named `p` whose value is a `_`-separated list of fields in a fixed order (URL-unreserved separator so the address bar does not percent-encode delimiters). Field meaning SHALL be determined by position, not by per-field query key names. Legacy comma-separated `p` values SHALL still decode. The system SHALL keep `collection` and `dark` as separate named query parameters outside `p`.

#### Scenario: Packed p is written on shareable URLs
- **WHEN** the application updates the URL after the packed format is in use
- **THEN** the query includes `p` with positional `_`-separated fields and does not rely on the legacy per-layer query keys for new writes, and the address bar does not show `%2C` delimiters for those fields

#### Scenario: Collection and dark stay named
- **WHEN** a packed URL is written
- **THEN** `collection` and `dark` appear as their own query keys, not as unnamed slots inside `p`

### Requirement: Both views’ settings persist regardless of active view
The system SHALL keep timeline layer/viewport fields and map layer/viewport fields in `p` while either primary view is active, so switching views does not drop the inactive view’s stored settings from the URL.

#### Scenario: Timeline URL still carries map pack slots
- **WHEN** the timeline view is active and the user has previously set map camera or map layers
- **THEN** those map values remain present in `p`

#### Scenario: Map URL still carries timeline pack slots
- **WHEN** the map view is active and the user has previously set timeline camera or timeline layers
- **THEN** those timeline values remain present in `p`

### Requirement: Legacy verbose query params remain readable
When `p` is absent, the system SHALL restore state from the legacy named query keys (`authors`, `lifelines`, `start`, `lat`, `year`, and related keys) so older shared links continue to open.

#### Scenario: Old link without p still restores
- **WHEN** the user opens a URL that uses legacy named layer and viewport keys and has no `p`
- **THEN** the application restores an equivalent view state from those keys

### Requirement: Map pan commits do not re-apply as controlled camera jumps
When the user pans or zooms the map, the system SHALL persist the new camera into the URL (and in-memory camera state) without treating that commit as an external focus request that programmatically `jumpTo`s the map again. Intentional recenters (location show-on-map, browser history navigation that changes packed camera fields) SHALL still move the map camera.

#### Scenario: Pan during playback stays under user control
- **WHEN** playback is running and the user pans the map
- **THEN** the map remains at the panned position and does not snap back via a URL/camera feedback loop

#### Scenario: Show-on-map recenters
- **WHEN** the user activates show-on-map for a location
- **THEN** the map view opens (or stays open) centered on that location at a city-scale zoom

## MODIFIED Requirements

### Requirement: Shared state lives in the query string
The system SHALL encode collection selection and dark mode in the URL query string for both primary views, and SHALL encode layer visibility for timeline and map as separate masks inside packed param `p` (or legacy keys when migrating).

#### Scenario: Restore layers and theme from URL
- **WHEN** the user opens a URL that includes dark mode and layer information (packed or legacy)
- **THEN** the top menu controls reflect the active view’s layer mask and both views can restore their stored masks from the URL

#### Scenario: Changing a menu toggle updates the URL
- **WHEN** the user toggles a persisted menu layer or dark mode control
- **THEN** the query string is updated to match without a full page reload, writing the active view’s layer bit into that view’s mask in `p` when packed encoding is used

### Requirement: View-specific viewport in the query string
The system SHALL encode the timeline year range and top row and the map center latitude, longitude, zoom, and temporal `year`, `yearFrom`, and `yearTo` in packed param `p` (or legacy keys when migrating), retaining both viewports in the URL while either view is active.

#### Scenario: Timeline pan updates query viewport
- **WHEN** the user pans or zooms the timeline
- **THEN** timeline `start`, `end`, and `row` values in the URL (inside `p` or legacy keys) reflect the visible range and top row

#### Scenario: Map pan updates query viewport
- **WHEN** the user pans or zooms the map
- **THEN** map `lat`, `lng`, and `zoom` values in the URL reflect the map camera

#### Scenario: Map temporal scrub updates query years
- **WHEN** the user changes the map temporal range or playhead
- **THEN** `yearFrom`, `yearTo`, and `year` values in the URL reflect the scrubber state

#### Scenario: Inactive view viewport remains encoded
- **WHEN** the user is on the timeline after having used the map
- **THEN** map viewport and temporal year fields remain encoded in `p` rather than being omitted solely because the timeline is active

### Requirement: Switching views preserves shared query state
The system SHALL keep collection and dark mode when switching between timeline and map, SHALL retain both views’ packed layer and viewport fields in `p`, and SHALL apply the destination view’s stored layer mask to the menu chrome.

#### Scenario: Switch to map applies map layer mask
- **WHEN** the user switches from timeline to map with different stored layer masks for each view
- **THEN** the map URL keeps shared `collection`/`dark`, keeps both masks in `p`, and the menu shows the map mask

#### Scenario: Switch to timeline applies timeline layer mask
- **WHEN** the user switches from map to timeline with different stored layer masks for each view
- **THEN** the timeline URL keeps shared `collection`/`dark`, keeps both masks in `p`, and the menu shows the timeline mask

### Requirement: Map temporal state restores from the query string
When the map view loads with temporal years present in packed `p` or in legacy `year` / `yearFrom` / `yearTo` query keys, the system SHALL restore the scrubber from those values, clamping `year` into `[yearFrom, yearTo]` when all three are present and valid.

#### Scenario: Open map URL with temporal params
- **WHEN** the user opens a map URL that includes valid `yearFrom`, `yearTo`, and `year` values (packed or legacy)
- **THEN** the map scrubber shows that range and playhead

#### Scenario: Missing temporal params use collection defaults
- **WHEN** the user opens the map view without temporal year fields and a non-empty collection filter is active
- **THEN** the scrubber initializes `yearFrom` and `yearTo` from that collection’s lifespan span and sets `year` to `yearFrom`
