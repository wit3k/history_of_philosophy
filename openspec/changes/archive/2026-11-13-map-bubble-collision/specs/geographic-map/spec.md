# Spec Delta

## ADDED Requirements

### Requirement: Map bubbles avoid screen overlap
The system SHALL place visible map bubbles so that their on-screen disks do not overlap, using each bubble’s fixed visual radius plus a positive margin. Placement SHALL be recomputed when the map camera zoom or pan changes the projected positions of subjects.

#### Scenario: Distinct locations fit without overlap when zoomed in
- **WHEN** two markers have different geographic positions and the current zoom projects them farther apart than two bubble diameters plus margin
- **THEN** both appear as separate individual bubbles without overlapping

#### Scenario: Crowding collapses into a count hub
- **WHEN** the current zoom projects so many markers into an area that they cannot all be placed as non-overlapping individual bubbles
- **THEN** the system shows one or more count hubs representing the collapsed sets instead of stacking overlapping individuals

### Requirement: Coincident points spiderfy when space allows
When multiple map subjects share the same or nearly the same geographic coordinates, the system SHALL offset them on screen into a non-overlapping arrangement (spiderfy / repulsion) using the same ring-style layout as click-to-expand on a count hub, whenever neighboring markers and free viewport space leave room for that footprint. “Enough space” SHALL mean room around the pile relative to other markers and available screen area — not a small absolute ring-radius cap alone, and not mere shared coordinates or a large member count. The system SHALL NOT keep them permanently glued solely because they share a geo grid cell.

#### Scenario: Same-city points separate when zoomed in
- **WHEN** several subjects share one location and the zoom provides enough screen space for their bubble diameters plus margin without overlapping other markers
- **THEN** each appears as its own bubble offset from the shared point without overlap

#### Scenario: Large coincident pile uses empty map space
- **WHEN** a large set of subjects share one location (for example dozens of events at Athens) and the surrounding map view has empty screen space such that the spiderfy ring footprint would not overlap other markers
- **THEN** the system shows individual bubbles spread with the click-expand ring layout rather than a single count hub for the whole pile

#### Scenario: Same-city points group when packing cannot fit
- **WHEN** several subjects share one location and placing them as non-overlapping individuals would collide with other markers or exceed available free screen space around the pile
- **THEN** they appear under a count hub rather than overlapping

### Requirement: Person portraits are never count-hubbed
Visible person portrait bubbles SHALL always remain individual markers. The system SHALL NOT include portraits in count hubs. When two or more portraits would overlap on screen, the system SHALL push them apart so their disks may touch but do not overlap.

#### Scenario: Overlapping people separate instead of grouping
- **WHEN** two person portraits project to overlapping screen positions
- **THEN** both remain separate portrait bubbles offset so their edges may touch without covering each other, and neither is represented only as a digit on a count hub

#### Scenario: Dense people stay individuals among event hubs
- **WHEN** events in the same area collapse into a count hub
- **THEN** person portraits in that area still appear as individual bubbles (pushed clear of overlap) and are not members of that hub

### Requirement: Zoom density drives individual vs grouped markers
As the user zooms out, the system SHALL tend to show fewer individual bubbles and more count hubs; as the user zooms in, the system SHALL tend to show more individual bubbles and fewer count hubs, for the same set of visible subjects.

#### Scenario: Zoom out increases grouping
- **WHEN** the user zooms out over a dense region of markers
- **THEN** more markers are represented by count hubs than before the zoom-out

#### Scenario: Zoom in increases individuals
- **WHEN** the user zooms in over a previously grouped region
- **THEN** more markers appear as separate bubbles than before the zoom-in
