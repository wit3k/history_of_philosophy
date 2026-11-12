# Spec Delta

## Purpose

Owns map-only temporal navigation: range selection, playhead, playback through a selected span, portrait travel along life tracks, and the visibility and fade rules that make the map read as a moment or interval in time.

## ADDED Requirements

### Requirement: Scrubber appears only on the map view
The system SHALL show the temporal scrubber chrome only while the geographic map view is active, and SHALL NOT show that scrubber on the timeline diagram view.

#### Scenario: Map shows scrubber
- **WHEN** the user is on the map view
- **THEN** the temporal scrubber is visible

#### Scenario: Timeline hides scrubber
- **WHEN** the user is on the timeline diagram view
- **THEN** the temporal scrubber is not shown

### Requirement: User can select a year range on the scrubber
The system SHALL let the user set a contiguous year range bounded by `yearFrom` and `yearTo` on the map scrubber, with `yearFrom` less than or equal to `yearTo`.

#### Scenario: Range brush updates bounds
- **WHEN** the user selects a from–to span on the scrubber
- **THEN** `yearFrom` and `yearTo` reflect that span

### Requirement: Playhead year stays within the selected range
The system SHALL keep the playhead `year` inside `[yearFrom, yearTo]`.

#### Scenario: Playhead clamped after range shrink
- **WHEN** the user narrows the selected range so the previous `year` falls outside it
- **THEN** `year` is adjusted to lie within the new `[yearFrom, yearTo]`

### Requirement: Collection frames default temporal range
When the active collection changes on the map view, the system SHALL set `yearFrom` to the minimum `born` and `yearTo` to the maximum `died` among people included by that collection filter, and SHALL set `year` to `yearFrom`, provided the filtered set is non-empty.

#### Scenario: Selecting a collection resets map years
- **WHEN** the user activates a collection with at least one person while on the map view
- **THEN** `yearFrom` equals the earliest birth year, `yearTo` equals the latest death year among those people, and `year` equals `yearFrom`

### Requirement: Range mode shows full opacity inside the selection
While the map is not applying playhead-relative hiding for scrub/play progression, the system SHALL show map subjects whose relevant years fall inside `[yearFrom, yearTo]` at full opacity for those in-range portions.

#### Scenario: In-range content fully visible
- **WHEN** a life marker or path segment has a year inside `[yearFrom, yearTo]` and playhead-relative progression is not hiding it
- **THEN** that content is shown at full opacity subject to layer toggles

### Requirement: Echo window before yearFrom is semi-transparent
The system SHALL show map content whose years fall in `[yearFrom - 200, yearFrom)` at reduced opacity relative to in-range content.

#### Scenario: Two-hundred-year prelude is dimmed
- **WHEN** a marker or path segment has year `Y` where `yearFrom - 200 <= Y < yearFrom`
- **THEN** that content is visible at lower opacity than content inside `[yearFrom, yearTo]`

### Requirement: Content outside the range and echo is hidden
The system SHALL hide map temporal content with years strictly before `yearFrom - 200` or strictly after `yearTo`.

#### Scenario: Too-old content hidden
- **WHEN** a marker year is less than `yearFrom - 200`
- **THEN** that marker is not shown

#### Scenario: After-range content hidden
- **WHEN** a marker year is greater than `yearTo`
- **THEN** that marker is not shown

### Requirement: Playhead progression hides the future and fades the past
While scrubbing or playing with playhead `year`, the system SHALL hide content with years greater than `year`, keep content with age `year - Y` at most 200 years at full opacity (subject to range/echo rules), apply a continuous opacity fade for ages between 200 and 400 years, hide content aged 400 years or more, and apply the same gradual fade rules to portrait markers after death instead of removing them immediately.

#### Scenario: Future relative to playhead hidden
- **WHEN** playhead `year` is set and a marker has a year greater than `year`
- **THEN** that marker is not shown

#### Scenario: Recent past fully visible under playhead rules
- **WHEN** playhead `year` is set and a visible marker’s year `Y` satisfies `0 <= year - Y <= 200` and also passes range/echo rules
- **THEN** that marker is shown at full opacity

#### Scenario: Distant past fades then disappears
- **WHEN** playhead `year` is set and `200 < year - Y < 400`
- **THEN** marker opacity is between full and hidden, decreasing as age increases

#### Scenario: Very old content removed
- **WHEN** playhead `year` is set and `year - Y >= 400`
- **THEN** that marker is not shown

#### Scenario: Portrait fades after death
- **WHEN** playhead `year` is after a person’s death year and the age since death is between 200 and 400 years
- **THEN** that person’s portrait remains and uses the same fade curve as other temporal content

### Requirement: Play always starts at yearFrom
When the user starts playback, the system SHALL set `year` to `yearFrom` and advance `year` toward `yearTo` until pause, completion, or interruption.

#### Scenario: Pressing play resets to range start
- **WHEN** the user presses play while `year` is greater than `yearFrom`
- **THEN** playback begins with `year` equal to `yearFrom`

#### Scenario: Playback stops at yearTo
- **WHEN** playback reaches `yearTo`
- **THEN** playback stops with `year` equal to `yearTo`

### Requirement: Playback slows for content and compresses empty spans
During playback the system SHALL advance slowly through years where map-visible temporal content changes for the current filters, and SHALL accelerate through spans without such changes so each empty span takes at most five seconds of wall-clock time.

#### Scenario: Empty historical gap finishes within five seconds
- **WHEN** playback crosses a contiguous span of years with no map-visible temporal changes under the active filters
- **THEN** that span completes in at most five seconds of wall-clock time

### Requirement: Portrait follows birth-personal-death track
For each visible person with at least one resolvable birth, personal-event, or death coordinate on the avatar track, the system SHALL place a portrait marker by interpolating along the chronologically ordered track of birth location, personal history events with coordinates, and death location, excluding publication locations from that track.

#### Scenario: Portrait interpolates between personal waypoints
- **WHEN** playhead `year` falls between two consecutive avatar-track points of a visible person
- **THEN** the portrait is drawn between those points in proportion to the year along that segment

#### Scenario: Publications do not move the portrait
- **WHEN** a person has publication locations but no personal-event waypoints
- **THEN** the portrait track uses birth and death only and does not visit publication coordinates

### Requirement: Playback does not move the map camera
The system SHALL NOT change map center or zoom solely because `year` advances during scrub or playback.

#### Scenario: Play leaves camera unchanged
- **WHEN** the user plays through a range without panning or zooming
- **THEN** map `lat`, `lng`, and `zoom` remain as they were when playback started
