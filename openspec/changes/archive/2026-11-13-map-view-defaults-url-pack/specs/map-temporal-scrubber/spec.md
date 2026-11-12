# Spec Delta

## ADDED Requirements

### Requirement: Playhead advances in day steps
During playback the system SHALL commit the visible playhead in calendar-day increments (leap-aware fractional years), at every playback speed multiplier, so travel does not snap year-to-year. When wall-clock advancement is faster than one day per frame, intermediate days MAY be skipped between animation frames.

#### Scenario: Slow speed still moves by days
- **WHEN** playback runs below 1×
- **THEN** the scrubber playhead label and portrait travel update on day boundaries rather than whole years

#### Scenario: Normal speed still uses day quantization
- **WHEN** playback runs at 1× or faster
- **THEN** committed playhead values remain day-quantized (frames may skip multiple days)

### Requirement: Scrubber date labels sit on handles
The temporal scrubber SHALL place the range-start year label under the from handle, the range-end year label above the to handle, and the current playhead date beside the playhead handle. The playhead date SHALL prefer the right side of the playhead handle (within the selected range bar); when there is insufficient room before the track’s right edge, the label SHALL flip to the left of the playhead handle. The scrubber SHALL NOT use a separate top row that shows “from–to” on the left and the playhead only on the right.

#### Scenario: Labels follow handles
- **WHEN** the user drags from, to, or playhead handles
- **THEN** each date label stays anchored to its handle as specified

#### Scenario: Playhead label flips near the right edge
- **WHEN** the playhead is near the right end of the scrubber track so a right-side label would overflow
- **THEN** the playhead date is shown to the left of the playhead handle

## MODIFIED Requirements

### Requirement: Playback slows for content and compresses empty spans
During playback the system SHALL advance the playhead at a speed that depends on local content density: in a sliding window of 10 years centered on the playhead, density is the fraction of calendar years that contain any map-visible temporal content under the active filters. Sparse windows SHALL advance near the baseline content pace (about 15 years per second at 1×); fully dense windows SHALL advance about three times slower (about 5 years per second at 1×), with intermediate densities interpolated smoothly. Contiguous empty spans outside dense content SHALL still be accelerated so each empty span takes at most five seconds of wall-clock time at 1× (scaled by the user speed multiplier). Visible playhead commits SHALL use day quantization as specified above.

#### Scenario: Empty historical gap finishes within five seconds
- **WHEN** playback crosses a contiguous span of years with no map-visible temporal changes under the active filters
- **THEN** that span completes in at most five seconds of wall-clock time at 1× speed

#### Scenario: Sparse decade stays near baseline pace
- **WHEN** playback runs at 1× through a 10-year window with little or no content-years
- **THEN** advancement stays near the baseline content pace of about 15 years per second

#### Scenario: Fully dense decade slows
- **WHEN** playback runs at 1× through a 10-year window where every year has map-visible content
- **THEN** advancement is about 5 years per second, slower than the sparse baseline
