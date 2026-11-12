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
The system SHALL present the same top menu control order on timeline and map, with a view switcher appended after the existing controls, and SHALL bind toggle pressed states to the **active view’s** stored layer mask while keeping both views’ masks in URL state.

#### Scenario: Switch views without reshuffling toggles
- **WHEN** the user switches between timeline and map
- **THEN** existing menu toggle buttons keep their relative order and show the destination view’s stored pressed values

### Requirement: Map default layers show only authors
When map layer settings are not restored from the URL, the system SHALL enable the Authors layer on the map and SHALL disable Życiorysy, Sympatie, Publications, Odniesienia, world history events, and personal events for that map default.

#### Scenario: Fresh map without stored map mask
- **WHEN** the user opens the map view and no map layer mask is present in the URL
- **THEN** only Authors is on among map layer toggles; lifelines, sympathies, publications, refs, world events, and personal events are off for the map

#### Scenario: Stored map mask overrides default
- **WHEN** the URL contains an explicit map layer mask
- **THEN** the map uses that mask instead of the authors-only default

### Requirement: Crowded portraits pulse instead of hopping
When a person portrait has many other person portraits nearby on screen, the system SHALL NOT apply the hop/sway offset that would move its layout position. The system SHALL instead show a light border-only pulse on that portrait while playback is playing. When a portrait is not in such a crowd and playback is playing, the system SHALL keep hop/sway motion. When playback is paused (or not playing), portraits SHALL NOT hop or pulse.

#### Scenario: Sparse portrait hops while playing
- **WHEN** a visible portrait has few nearby person portraits on screen during playback
- **THEN** that portrait may use hop/sway motion

#### Scenario: Crowded portrait keeps neighbors stable
- **WHEN** a visible portrait has many nearby person portraits on screen during playback
- **THEN** that portrait’s layout position is not hopped for walk animation, and a border pulse provides motion without pushing neighbors

#### Scenario: Pause freezes portrait motion
- **WHEN** the user pauses playback
- **THEN** portraits stop hopping and pulsing

### Requirement: Dense city piles stay positionally stable
When many person portraits share nearly the same geographic point, the system SHALL pack them with a deterministic, id-stable screen layout so membership changes do not cause rapid random reshuffling of neighbors during playhead advancement.

#### Scenario: Coincident portraits keep stable slots
- **WHEN** several portraits occupy the same city during playback across nearby days
- **THEN** their relative screen packing does not thrash frame-to-frame solely due to iterative push-apart

### Requirement: Selection emphasizes without dimming others
When the user hovers or selects a map person (desktop hover or tap), the system SHALL visually emphasize that person (for example thicker/dashed path and portrait ring) and SHALL NOT reduce opacity of other map people, paths, or markers solely because a selection is active.

#### Scenario: Hover keeps neighbors at full opacity
- **WHEN** the user hovers a portrait while many others are visible
- **THEN** the hovered person is emphasized and other portraits retain their temporal/search opacities without a global selection dim

### Requirement: Location details open the in-app map
When the user activates the map control on a location details modal, the system SHALL navigate to the in-app map view centered on that location rather than opening an external map site.

#### Scenario: Location map icon centers in-app map
- **WHEN** the user clicks the map icon on a location modal
- **THEN** the app shows the map view centered on that location’s coordinates

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
- **THEN** the map does not apply search-based dimming and falls back to temporal opacity rules; selection/hover still uses emphasis without globally dimming others

### Requirement: Search highlighting composes with person selection
When search highlighting is active and a person is sticky-selected on the map, the system SHALL keep search dimming for non-matches and SHALL still apply selection emphasis (including animated dashed life path when available) for the selected person without additionally dimming search matches that are not selected.

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

### Requirement: Map geometry respects temporal scrubber state
The system SHALL apply the active map temporal range, playhead, and fade rules from the map temporal scrubber when deciding which person paths, person markers, personal-event markers, publication markers, and portrait markers are shown on the map and at what opacity, while still honoring Authors, Życiorysy, Publications, and personal-events layer toggles.

#### Scenario: Future publication hidden by playhead
- **WHEN** Publications is on, a publication has coordinates, and its year is greater than the playhead `year`
- **THEN** that publication marker is not shown

#### Scenario: Layer off still wins
- **WHEN** Publications is off
- **THEN** publication markers remain hidden regardless of temporal scrubber state

### Requirement: Drawn life paths may include publication points
The system SHALL continue to include publication locations with coordinates in the drawn life-path point sequence used for path lines and publication markers, even though portrait travel excludes those publication points.

#### Scenario: Path line can still visit a publication city
- **WHEN** Authors and Życiorysy are on and a person has birth, a publication with coordinates, and death with coordinates
- **THEN** the drawn path may include that publication point while the portrait track does not use it as a waypoint

### Requirement: Portrait markers use person thumbnails when available
When a portrait is shown for a person under temporal scrubber rules, the system SHALL use that person’s thumbnail asset when one exists, and SHALL fall back to a non-thumbnail marker when it does not.

#### Scenario: Person with thumbnail shows portrait bubble
- **WHEN** a visible person’s portrait is shown and the person has a thumbnail
- **THEN** the map portrait uses that thumbnail

#### Scenario: Person without thumbnail still has a marker
- **WHEN** a visible person’s portrait is shown and the person has no thumbnail
- **THEN** the map still shows a portrait-position marker without requiring a thumbnail image
