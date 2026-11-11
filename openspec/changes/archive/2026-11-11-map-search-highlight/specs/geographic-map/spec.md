# Spec Delta

## ADDED Requirements

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
