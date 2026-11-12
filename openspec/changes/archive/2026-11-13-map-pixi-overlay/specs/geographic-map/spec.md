# Spec Delta

## ADDED Requirements

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
