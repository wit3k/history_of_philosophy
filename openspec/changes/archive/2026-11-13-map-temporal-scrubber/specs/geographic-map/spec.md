# Spec Delta

## ADDED Requirements

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
