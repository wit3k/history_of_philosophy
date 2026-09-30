import { useCallback, useEffect, useRef, useState } from 'react'
import { useTick } from '@pixi/react'
import type { FederatedPointerEvent, Graphics as PixiGraphics } from 'pixi.js'
import { Assets, Texture } from 'pixi.js'
import type HistoryEvent from '../data/dto/HistoryEvent'
import type Person from '../data/dto/Person'
import type PersonHistoryEvent from '../data/dto/PersonHistoryEvent'
import type PersonReference from '../data/dto/PersonReference'
import type Publication from '../data/dto/Publication'
import type PublicationReference from '../data/dto/PublicationReference'
import ColorsService from '../services/Colors'
import { dashOffsetFromTime, strokeDashedPolyline, strokeDashedVerticalLine } from './dashedStroke'
import { flattenPathDataCached, strokePathData } from './pathBridge'
import { attitudeColor, buildPersonReferencePath, buildPublicationReferencePath, wrapTitleWords } from './relationPaths'
import type { TimelineTooltipState } from './TimelineTooltip'

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'

const APP_BASE = '/history_of_philosophy'

type CameraFns = {
  positionByYear: (year: number) => number
  rowPosition: (rowNumber: number) => number
  historyEventRowPosition: (rowNumber: number) => number
  isVisible: (year: number) => boolean
  isVisibleRange: (from: number, to: number) => boolean
}

type Settings = {
  personBox: number
  publicationBox: number
  publicationMaxCols: number
  publicationMaxRows: number
  historyBox: number
  personHistoryBox: number
  personHistoryBar: number
  personHistoryDot: number
  personHistoryMaxCols: number
  personHistoryMaxRows: number
  pubRefBox: number
  pubRefDot: number
  yearLabelWidth: number
}

export type SharedTimelineProps = CameraFns &
  Settings & {
    windowWidth: number
    windowHeight: number
    darkMode: boolean
    highlightedAuthor: string
    highlightedPublication: string
    updateHighlightedAuthor: (id: string) => void
    updateHighlightedPublication: (id: string) => void
    clearHighlights: () => void
    onAuthorClick: (id: string) => void
    onPublicationClick: (publication: Publication, author: Person) => void
    onPersonHistoryClick: (event: PersonHistoryEvent, person: Person) => void
    setTooltip: (t: TimelineTooltipState | null) => void
    displayAuthorsTimeline: boolean
    canvasOffset: { left: number; top: number }
    layoutToScreen: (lx: number, ly: number) => { x: number; y: number }
  }

export function YearLinesLayer({
  yearsOnScale,
  positionByYear,
  isVisible,
  height,
}: {
  yearsOnScale: number[]
  positionByYear: (y: number) => number
  isVisible: (y: number) => boolean
  height: number
}) {
  const currentYear = new Date().getFullYear()
  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear()
      for (const year of yearsOnScale.filter(isVisible)) {
        const x = positionByYear(year)
        g.moveTo(x, 0)
        g.lineTo(x, height)
        g.stroke({
          width: 1,
          color: year % 100 === 0 ? 'rgba(193, 236, 236, 0.85)' : 'rgba(61, 224, 224, 0.2)',
          cap: 'butt',
          join: 'miter',
        })
      }
      const cx = positionByYear(currentYear)
      strokeDashedVerticalLine(g, cx, 0, height, [4, 1, 1, 6, 1, 1], 0, {
        width: 3,
        color: 'white',
        cap: 'butt',
        join: 'miter',
      })
    },
    [yearsOnScale, positionByYear, isVisible, height, currentYear],
  )
  return <pixiGraphics draw={draw} />
}

export function YearLabelsLayer({
  yearsOnScale,
  positionByYear,
  isVisible,
  windowHeight,
  yearLabelWidth,
}: {
  yearsOnScale: number[]
  positionByYear: (y: number) => number
  isVisible: (y: number) => boolean
  windowHeight: number
  yearLabelWidth: number
}) {
  const visible = yearsOnScale.filter(isVisible)
  return (
    <pixiContainer>
      {visible.map(year => {
        const x = positionByYear(year)
        const y = windowHeight - 30
        const century = year % 100 === 0
        return (
          <pixiContainer key={`yl-${year}`}>
            <pixiGraphics
              draw={g => {
                g.clear()
                g.roundRect(x - yearLabelWidth / 2, y, yearLabelWidth, 40, 5)
                g.fill({ color: century ? 'rgba(193, 236, 236, 0.85)' : 'rgba(11, 49, 49, 0.5)' })
              }}
            />
            <pixiText
              anchor={{ x: 0.5, y: 0 }}
              style={{
                fill: century ? '#000000' : '#ffffff',
                fontFamily: MONO,
                fontSize: 15,
              }}
              text={`${year}`}
              x={x}
              y={y + 10}
            />
          </pixiContainer>
        )
      })}
    </pixiContainer>
  )
}

export function PadLayer({
  width,
  height,
  clearHighlights,
}: {
  width: number
  height: number
  clearHighlights: () => void
}) {
  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear()
      g.rect(0, 0, width, height)
      g.fill({ alpha: 0.001, color: 0xffffff })
    },
    [width, height],
  )
  return (
    <pixiGraphics
      cursor="grab"
      draw={draw}
      eventMode="static"
      onPointerMove={() => clearHighlights()}
      onPointerTap={() => clearHighlights()}
    />
  )
}

export function HistoryEventsLayer({
  events,
  darkMode,
  positionByYear,
  historyEventRowPosition,
  isVisibleRange,
  historyBox,
  windowHeight,
}: {
  events: HistoryEvent[]
  darkMode: boolean
  positionByYear: (y: number) => number
  historyEventRowPosition: (r: number) => number
  isVisibleRange: (a: number, b: number) => boolean
  historyBox: number
  windowHeight: number
}) {
  return (
    <pixiContainer>
      {events
        .filter(e => isVisibleRange(e.yearFrom, e.yearTo))
        .map(event => {
          const x0 = positionByYear(event.yearFrom)
          const x1 = positionByYear(event.yearTo)
          const row = historyEventRowPosition(event.rowNumber)
          const w = Math.max(x1 - x0 + 5, 20)
          const tamed = ColorsService.getTamedColor(event.rowNumber)
          const fixed = ColorsService.getFixedColor(event.rowNumber)
          const band = darkMode ? ColorsService.convertToGray(tamed) : ColorsService.convertToPale(tamed)
          const headerH = event.name.length * 8 + 20 + historyBox
          const headerY = row - event.name.length * 8 - 20
          const bandTop = headerY + headerH
          // Cover viewport + one screen of pan slack (was height 20000).
          const bandHeight = Math.max(windowHeight - bandTop + windowHeight, windowHeight)
          return (
            <pixiContainer key={`he-${event.id}`}>
              <pixiGraphics
                draw={g => {
                  g.clear()
                  g.roundRect(x0, headerY, w, headerH, 4)
                  g.fill({ color: tamed })
                  g.rect(x0, bandTop, w, bandHeight)
                  g.fill({ color: band })
                  g.rect(x0, row, x1 - x0 + 5, historyBox)
                  g.fill({ color: fixed })
                }}
              />
              <pixiText
                // -90°: glyphs advance upward (−Y). Anchor at the bottom of the
                // green header so the label starts at the bar's beginning (near
                // the timeline strip), not at the top end.
                anchor={{ x: 0, y: 0.5 }}
                rotation={-Math.PI / 2}
                style={{ fill: '#000000', fontFamily: MONO, fontSize: 14 }}
                text={event.name}
                x={x0 + 10}
                y={row - 4}
              />
            </pixiContainer>
          )
        })}
    </pixiContainer>
  )
}

function PersonThumb({ url, x, y, size }: { url: string; x: number; y: number; size: number }) {
  const [texture, setTexture] = useState<Texture | null>(null)
  useEffect(() => {
    let cancelled = false
    Assets.load(url)
      .then((t: Texture) => {
        if (!cancelled) setTexture(t)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [url])
  if (!texture) return null
  return <pixiSprite eventMode="none" height={size} texture={texture} width={size} x={x} y={y} />
}

export function PeopleLayer({ people, shared }: { people: Person[]; shared: SharedTimelineProps }) {
  const { positionByYear, rowPosition, personBox, displayAuthorsTimeline, highlightedAuthor, isVisibleRange } = shared
  return (
    <pixiContainer>
      {people
        .filter(person => isVisibleRange(person.born, person.died))
        .map(person => {
          const x0 = positionByYear(person.born)
          const x1 = positionByYear(person.died)
          const y = rowPosition(person.rowNumber)
          const accent = ColorsService.getAccentColor(person.nationality)
          const pale = ColorsService.convertToPale(accent)
          const dark = ColorsService.convertToDark(accent)
          const highlighted = highlightedAuthor === person.id
          const maxTextW = x1 - x0 - personBox - 12
          let label = person.name
          if (person.name.length * 8 >= maxTextW) {
            label = `${person.name.slice(0, Math.max(maxTextW / 8 - 4, 0))}...`
          }
          const thumbUrl = person.thumbnail ? `${APP_BASE}/assets/person/${person.thumbnail}` : null
          return (
            <pixiContainer
              key={`p-${person.id}`}
              cursor="pointer"
              eventMode="static"
              onPointerMove={() => shared.updateHighlightedAuthor(person.id)}
              onPointerTap={() => {
                shared.updateHighlightedAuthor(person.id)
                shared.onAuthorClick(person.id)
              }}
            >
              {displayAuthorsTimeline && (
                <pixiGraphics
                  draw={g => {
                    g.clear()
                    g.rect(x0, y, x1 - x0, personBox)
                    g.fill({ color: pale })
                    g.stroke({ cap: 'butt', color: accent, join: 'miter', width: highlighted ? 3 : 1 })
                  }}
                />
              )}
              {thumbUrl && <PersonThumb size={personBox} url={thumbUrl} x={x0} y={y} />}
              <pixiText
                alpha={highlighted ? 1 : 0.8}
                style={{ fill: dark, fontFamily: MONO, fontSize: 14 }}
                text={label}
                x={x0 + personBox + 8}
                y={y + 12}
              />
            </pixiContainer>
          )
        })}
    </pixiContainer>
  )
}

function AnimatedPath({
  path,
  color,
  width,
  alpha,
  dashed,
  dashPattern,
}: {
  path: string
  color: string
  width: number
  alpha: number
  dashed: boolean
  dashPattern: number[]
}) {
  const gRef = useRef<PixiGraphics | null>(null)
  const pointsRef = useRef(flattenPathDataCached(path))
  const styleRef = useRef({ alpha, color, dashed, dashPattern, path, width })
  styleRef.current = { alpha, color, dashed, dashPattern, path, width }
  pointsRef.current = flattenPathDataCached(path)

  const paint = useCallback(() => {
    const g = gRef.current
    if (!g) return
    const s = styleRef.current
    g.clear()
    if (s.dashed) {
      strokeDashedPolyline(g, pointsRef.current, s.dashPattern, dashOffsetFromTime(performance.now()), {
        alpha: s.alpha,
        cap: 'butt',
        color: s.color,
        join: 'miter',
        width: s.width,
      })
    } else {
      strokePathData(g, s.path, {
        alpha: s.alpha,
        cap: 'butt',
        color: s.color,
        join: 'miter',
        width: s.width,
      })
    }
  }, [])

  useTick(() => {
    if (styleRef.current.dashed) paint()
  })

  // Static (or highlight toggle) redraw via React draw — no per-frame setState.
  const draw = useCallback(
    (g: PixiGraphics) => {
      gRef.current = g
      pointsRef.current = flattenPathDataCached(path)
      g.clear()
      if (dashed) {
        strokeDashedPolyline(g, pointsRef.current, dashPattern, dashOffsetFromTime(performance.now()), {
          alpha,
          cap: 'butt',
          color,
          join: 'miter',
          width,
        })
      } else {
        strokePathData(g, path, { alpha, cap: 'butt', color, join: 'miter', width })
      }
    },
    [path, color, width, alpha, dashed, dashPattern],
  )

  return <pixiGraphics draw={draw} eventMode="none" />
}

export function PersonReferencesLayer({
  references,
  people,
  shared,
}: {
  references: PersonReference[]
  people: Person[]
  shared: SharedTimelineProps
}) {
  const { positionByYear, rowPosition, personBox, highlightedAuthor, isVisibleRange } = shared
  const highlightsOn = highlightedAuthor !== '0'
  return (
    <pixiContainer>
      {references.map(reference => {
        const personFrom = people.find(p => p.id === reference.from)
        const personTo = people.find(p => p.id === reference.to)
        if (!reference.from || !reference.to || !personFrom || !personTo) return null
        if (!isVisibleRange(Math.min(personFrom.born, personTo.born), Math.max(personFrom.died, personTo.died))) {
          return null
        }
        const isHighlighted = highlightedAuthor === personFrom.id || highlightedAuthor === personTo.id
        const path = buildPersonReferencePath(
          positionByYear(personFrom.born),
          positionByYear(personTo.born),
          rowPosition(personFrom.rowNumber),
          rowPosition(personTo.rowNumber),
          personBox,
        )
        return (
          <AnimatedPath
            key={`pref-${reference.id}-${reference.from}-${reference.to}`}
            alpha={isHighlighted ? 1 : highlightsOn ? 0.1 : 1}
            color={attitudeColor(reference.attitude)}
            dashed={isHighlighted}
            dashPattern={[1, 5]}
            path={path}
            width={isHighlighted ? 5 : 2}
          />
        )
      })}
    </pixiContainer>
  )
}

export function PublicationsLayer({
  publications,
  people,
  shared,
}: {
  publications: Publication[]
  people: Person[]
  shared: SharedTimelineProps
}) {
  const {
    positionByYear,
    rowPosition,
    isVisible,
    publicationBox,
    publicationMaxCols,
    publicationMaxRows,
    canvasOffset,
    layoutToScreen,
  } = shared
  return (
    <pixiContainer>
      {publications
        .filter(p => isVisible(p.publicationDate))
        .map(publication => {
          const author = people.find(p => p.id === publication.authorId)
          if (!author) return null
          const x = positionByYear(publication.publicationDate)
          const y = rowPosition(author.rowNumber)
          const color = ColorsService.getFixedColor(publication.publicationDate)
          const { slices, truncated } = wrapTitleWords(publication.title, publicationMaxCols, publicationMaxRows)
          const lines = slices.map((s, i) => (i === slices.length - 1 && truncated ? `${s}...` : s))
          return (
            <pixiGraphics
              key={`pub-${publication.id}`}
              cursor="pointer"
              draw={g => {
                g.clear()
                g.moveTo(x, y)
                g.lineTo(x, y + publicationBox)
                g.stroke({ cap: 'butt', color, join: 'miter', width: 10 })
              }}
              eventMode="static"
              onPointerMove={() => {
                shared.updateHighlightedPublication(publication.id)
                const screen = layoutToScreen(x, y + publicationBox / 2)
                shared.setTooltip({
                  clientX: canvasOffset.left + screen.x,
                  clientY: canvasOffset.top + screen.y,
                  colorSeed: publication.publicationDate,
                  kind: 'publication',
                  titleLines: lines,
                })
              }}
              onPointerOut={() => shared.setTooltip(null)}
              onPointerTap={() => shared.onPublicationClick(publication, author)}
            />
          )
        })}
    </pixiContainer>
  )
}

export function PublicationReferencesLayer({
  references,
  publications,
  people,
  shared,
}: {
  references: PublicationReference[]
  publications: Publication[]
  people: Person[]
  shared: SharedTimelineProps
}) {
  const {
    positionByYear,
    rowPosition,
    isVisibleRange,
    pubRefBox,
    pubRefDot,
    highlightedAuthor,
    highlightedPublication,
  } = shared
  return (
    <pixiContainer>
      {references.map(reference => {
        const publicationFrom = publications.find(p => p.id === `${reference.from}`)
        const publicationTo = publications.find(p => p.id === `${reference.to}`)
        if (!reference.from || !reference.to || !publicationFrom || !publicationTo) return null
        const authorFrom = people.find(a => a.id === publicationFrom.authorId)
        const authorTo = people.find(a => a.id === publicationTo.authorId)
        if (!authorFrom || !authorTo) return null
        if (
          !isVisibleRange(
            Math.min(publicationFrom.publicationDate, publicationTo.publicationDate),
            Math.max(publicationFrom.publicationDate, publicationTo.publicationDate),
          )
        ) {
          return null
        }
        const isHighlighted =
          highlightedAuthor === authorFrom.id ||
          highlightedAuthor === authorTo.id ||
          highlightedPublication === publicationFrom.id ||
          highlightedPublication === publicationTo.id
        const path = buildPublicationReferencePath(
          positionByYear(publicationFrom.publicationDate),
          positionByYear(publicationTo.publicationDate),
          rowPosition(authorFrom.rowNumber),
          rowPosition(authorTo.rowNumber),
          pubRefBox,
          pubRefDot,
          publicationFrom,
          publicationTo,
        )
        return (
          <AnimatedPath
            key={`pubref-${reference.id}`}
            alpha={0.7}
            color={ColorsService.getAccentColor(authorFrom.nationality)}
            dashed={isHighlighted}
            dashPattern={[20, 3]}
            path={path}
            width={2}
          />
        )
      })}
    </pixiContainer>
  )
}

export function PersonHistoryEventsLayer({
  events,
  people,
  shared,
}: {
  events: PersonHistoryEvent[]
  people: Person[]
  shared: SharedTimelineProps
}) {
  const {
    positionByYear,
    rowPosition,
    isVisibleRange,
    personHistoryBox,
    personHistoryBar,
    personHistoryDot,
    personHistoryMaxCols,
    personHistoryMaxRows,
    canvasOffset,
    layoutToScreen,
  } = shared

  return (
    <pixiContainer>
      {events
        .filter(e => e.yearFrom != null)
        .map(event => {
          const yearFrom = event.yearFrom!
          const yearTo = event.yearTo ?? yearFrom
          if (!isVisibleRange(yearFrom, yearTo)) return null
          const person = people.find(p => p.id === event.personId)
          if (!person) return null
          const x0 = positionByYear(yearFrom)
          const x1 = positionByYear(yearTo)
          const y = rowPosition(person.rowNumber)
          const instant = event.yearTo == null || event.yearTo === event.yearFrom
          const fixed = ColorsService.getFixedColor(yearFrom)
          const tamed = ColorsService.getTamedColor(yearFrom)
          const centerX = instant ? x0 : (x0 + x1) / 2
          const centerY = y + personHistoryBox / 2
          const barY = y + personHistoryBox - personHistoryBar - 2
          const { slices, truncated } = wrapTitleWords(event.name, personHistoryMaxCols, personHistoryMaxRows)
          const lines = slices.map((s, i) => (i === slices.length - 1 && truncated ? `${s}...` : s))
          const yearLabel = instant || event.yearTo == null ? `${yearFrom}` : `${yearFrom}–${event.yearTo}`

          const showTip = () => {
            const screen = layoutToScreen(centerX, y + personHistoryBox / 2)
            shared.setTooltip({
              clientX: canvasOffset.left + screen.x,
              clientY: canvasOffset.top + screen.y,
              colorSeed: yearFrom,
              kind: 'personHistory',
              titleLines: lines,
              type: event.type,
              yearLabel,
            })
          }

          if (instant) {
            return (
              <pixiGraphics
                key={`phe-${event.id}`}
                cursor="pointer"
                draw={g => {
                  g.clear()
                  g.circle(x0, centerY, personHistoryDot)
                  g.fill({ color: fixed })
                  g.stroke({ cap: 'butt', color: tamed, join: 'miter', width: 2 })
                }}
                eventMode="static"
                onPointerDown={(e: FederatedPointerEvent) => e.stopPropagation()}
                onPointerMove={showTip}
                onPointerOut={() => shared.setTooltip(null)}
                onPointerTap={(e: FederatedPointerEvent) => {
                  e.stopPropagation()
                  shared.onPersonHistoryClick(event, person)
                }}
              />
            )
          }
          return (
            <pixiGraphics
              key={`phe-${event.id}`}
              cursor="pointer"
              draw={g => {
                g.clear()
                g.roundRect(x0, barY, Math.max(x1 - x0, 4), personHistoryBar, 3)
                g.fill({ alpha: 0.85, color: fixed })
                g.stroke({ cap: 'butt', color: tamed, join: 'miter', width: 1 })
              }}
              eventMode="static"
              onPointerDown={(e: FederatedPointerEvent) => e.stopPropagation()}
              onPointerMove={showTip}
              onPointerOut={() => shared.setTooltip(null)}
              onPointerTap={(e: FederatedPointerEvent) => {
                e.stopPropagation()
                shared.onPersonHistoryClick(event, person)
              }}
            />
          )
        })}
    </pixiContainer>
  )
}
