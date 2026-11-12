# Spec Delta

## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Shared menu chrome across views
The system SHALL present the same top menu control order on timeline and map, with a view switcher appended after the existing controls, and SHALL bind toggle pressed states to the **active view’s** stored layer mask while keeping both views’ masks in URL state.

#### Scenario: Switch views without reshuffling toggles
- **WHEN** the user switches between timeline and map
- **THEN** existing menu toggle buttons keep their relative order and show the destination view’s stored pressed values
