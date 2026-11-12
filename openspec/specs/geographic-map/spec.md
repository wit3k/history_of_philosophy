# geographic-map Specification

## Purpose

Presents the same collection-filtered philosophers on an interactive geographic map, with life-path geometry, markers for life events and publications, and basemap styling aligned to the diagram theme.

## Requirements

### Requirement: Map shows collection-filtered people
The system SHALL display on the map only people included by the currently active collection filter, using the same filter rules as the timeline.

#### Scenario: Active collection limits map people
- **WHEN** a thematic collection is active
- **THEN** only people belonging to that collection appear as map subjects

### Requirement: Life path points follow chronological places
For each visible person with resolvable coordinates, the system SHALL build an ordered sequence of map points from birth location, then personal history events with locations, then publications with locations, then death location, skipping entries that lack usable coordinates.

#### Scenario: Person with birth, event, publication, and death
- **WHEN** a person has coordinates for birth, at least one personal event, a publication, and death
- **THEN** the map places those points in chronological life order for that person

#### Scenario: Missing coordinates are skipped
- **WHEN** a life entry has no usable location coordinates
- **THEN** that entry is omitted from the path without removing later entries that do have coordinates

### Requirement: Authors toggle controls person visibility on the map
The system SHALL show person-related map content only when the Authors layer is enabled.

#### Scenario: Authors off hides people on the map
- **WHEN** the Authors toggle is off
- **THEN** person paths and person markers are not shown on the map

### Requirement: Lifelines toggle controls path lines
When Authors are enabled, the system SHALL draw directional path lines between a person’s successive points when Życiorysy (lifelines) is on, and SHALL show only the points without those lines when Życiorysy is off.

#### Scenario: Lifelines on draws paths
- **WHEN** Authors and Życiorysy are on and a person has at least two successive points
- **THEN** the map draws a path connecting those points in order

#### Scenario: Lifelines off shows points only
- **WHEN** Authors are on and Życiorysy is off
- **THEN** the person’s points remain visible and path lines are not drawn

### Requirement: Publications toggle controls publication markers
The system SHALL show publication markers on the map only when the Publications layer is enabled and the publication has usable coordinates.

#### Scenario: Publications on places markers
- **WHEN** Publications is on and a visible person’s publication has coordinates
- **THEN** that publication appears as a marker on the map

#### Scenario: Publications off hides publication markers
- **WHEN** Publications is off
- **THEN** publication markers are not shown

### Requirement: Personal events toggle controls personal event markers
The system SHALL show personal history event markers only when the personal events layer is enabled and the event has usable coordinates.

#### Scenario: Personal events on places markers
- **WHEN** personal events are on and a visible person’s personal event has coordinates
- **THEN** that event appears as a marker on the map

### Requirement: Non-geographic layers are no-ops on the map
The system SHALL keep Sympatie, Odniesienia, and world history event toggles available in the shared menu and URL, and SHALL NOT change map geometry based on those toggles while those data lack geographic positions.

#### Scenario: Sympathies toggle does not alter map geometry
- **WHEN** the user toggles Sympatie while viewing the map
- **THEN** map paths and markers do not change solely because of that toggle

### Requirement: Person accent colors match the diagram
The system SHALL color a person’s map path and related person markers using the same nationality accent color rules used on the timeline diagram.

#### Scenario: Matching accent for a nationality
- **WHEN** a person with a known nationality accent is shown on the map
- **THEN** their path/marker accent matches the accent used for that nationality on the timeline

### Requirement: Basemap follows bright and dark modes
The system SHALL style the basemap for dark mode and for bright (light) mode so its overall palette is consistent with the application’s diagram theme for that mode.

#### Scenario: Dark mode basemap
- **WHEN** dark mode is enabled
- **THEN** the basemap uses a dark-oriented style

#### Scenario: Bright mode basemap
- **WHEN** dark mode is disabled
- **THEN** the basemap uses a light-oriented style

### Requirement: Default map camera fits visible locations
When the map view is shown without map viewport query parameters, the system SHALL fit the map camera to the bounds of resolvable locations belonging to the currently visible map subjects.

#### Scenario: Enter map without camera query
- **WHEN** the user opens the map view and `lat`, `lng`, and `zoom` are absent from the query
- **THEN** the map fits bounds to the visible subjects’ resolvable locations

### Requirement: Shared menu chrome across views
The system SHALL present the same top menu control order on timeline and map, with a view switcher appended after the existing controls, and SHALL keep toggle values synchronized via shared URL state.

#### Scenario: Switch views without reshuffling toggles
- **WHEN** the user switches between timeline and map
- **THEN** existing menu toggle buttons keep their relative order and pressed values

### Requirement: Map applies shared search highlighting
When the shared search query is non-empty after trim, the system SHALL highlight matching map subjects and dim non-matching map subjects using the same case-insensitive substring rules as the timeline diagram: person name for person-linked content, publication title for publication markers. Matching SHALL not remove geometry from the map.

#### Scenario: Person name match keeps person content bright
- **WHEN** the search query is a non-empty substring of a visible person’s name
- **THEN** that person’s portrait, life path, and non-publication life-event markers remain at full search-highlight opacity while non-matching people’s equivalent content is dimmed

#### Scenario: Publication title match keeps that marker bright
- **WHEN** the search query is a non-empty substring of a visible publication’s title
- **THEN** that publication marker remains at full search-highlight opacity even if the author’s name does not match, and non-matching publication markers are dimmed

#### Scenario: Empty search restores default opacity rules
- **WHEN** the search query is empty or whitespace-only
- **THEN** the map does not apply search-based dimming and falls back to existing selection/hover opacity behavior

### Requirement: Search highlighting composes with person selection
When search highlighting is active and a person is sticky-selected on the map, the system SHALL keep search dimming for non-matches and SHALL still apply selection emphasis (including animated dashed life path when available) for the selected person.

#### Scenario: Selected person among search matches
- **WHEN** search is active, at least one person matches, and the user has sticky-selected a matching person
- **THEN** non-matching subjects stay dimmed and the selected person’s path/markers receive selection emphasis on top of search match visibility

#### Scenario: Selected person who does not match search
- **WHEN** search is active and the sticky-selected person does not match the query
- **THEN** that person remains subject to search dimming for non-match content while selection emphasis may still indicate the selection where the UI already supports it

### Requirement: Map content is drawn in a canvas overlay synced to the basemap camera
The system SHALL draw visible map subjects (life paths, event and publication markers, person portraits, and count hubs) in a WebGL canvas overlay that stays aligned with the geographic basemap camera (center, zoom, and viewport size). The basemap engine SHALL remain responsible for tile basemap display and user pan/zoom of the geographic view.

#### Scenario: Overlay tracks pan and zoom
- **WHEN** the user pans or zooms the map
- **THEN** overlay paths and markers stay geographically registered with the basemap (no lasting drift between basemap features and overlay subjects)

#### Scenario: Resize keeps overlay aligned
- **WHEN** the map container is resized
- **THEN** the overlay canvas matches the map viewport and subjects remain correctly projected

### Requirement: Map subjects are not per-item DOM markers
The system SHALL NOT rely on one DOM marker node per visible map subject for ordinary portraits, events, publications, or hubs. Transient HTML MAY be used for a small number of UI affordances such as a single tooltip or popup.

#### Scenario: Dense Europe avoids per-bubble DOM markers
- **WHEN** a dense collection shows dozens or hundreds of simultaneous map subjects
- **THEN** those subjects appear without creating a dedicated DOM marker element for each bubble

### Requirement: Overlay preserves temporal and interaction semantics
While using the canvas overlay, the system SHALL preserve existing map behaviors for temporal visibility/fade, layer toggles, search dimming, sticky person selection (including dashed life-path emphasis when applicable), portrait non-hubbing, and screen-space collision/spiderfy placement rules already required for the geographic map.

#### Scenario: Playback still fades past and future content
- **WHEN** the map playhead advances in playhead mode
- **THEN** overlay subjects follow the same temporal show/hide and fade rules as before the overlay migration

#### Scenario: Click and hover still resolve people
- **WHEN** the user clicks or hovers a visible overlay portrait or life path
- **THEN** selection and hover highlighting update for that person without requiring a DOM marker under the pointer

### Requirement: Basemap camera remains the geographic source of truth
The system SHALL derive overlay screen positions from the basemap camera projection of each subject’s geographic coordinates (plus any screen-space layout offsets). Overlay drawing SHALL NOT invent an independent geographic camera.

#### Scenario: Same coordinates under shared camera
- **WHEN** a subject has fixed latitude/longitude and the basemap camera is set
- **THEN** the overlay places that subject at the screen position implied by projecting those coordinates through the basemap camera
