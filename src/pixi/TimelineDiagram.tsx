import { Application } from '@pixi/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Application as PixiApplication } from 'pixi.js'
import type HistoryEvent from '../data/dto/HistoryEvent'
import type Person from '../data/dto/Person'
import type PersonHistoryEvent from '../data/dto/PersonHistoryEvent'
import type PersonReference from '../data/dto/PersonReference'
import type Publication from '../data/dto/Publication'
import type PublicationReference from '../data/dto/PublicationReference'
import { ensurePixiExtended } from './extendPixi'
import {
  HistoryEventsLayer,
  PadLayer,
  PeopleLayer,
  PersonHistoryEventsLayer,
  PersonReferencesLayer,
  PublicationReferencesLayer,
  PublicationsLayer,
  type SharedTimelineProps,
  YearLabelsLayer,
  YearLinesLayer,
} from './TimelineLayers'
import TimelineTooltip, { type TimelineTooltipState } from './TimelineTooltip'

ensurePixiExtended()

export type TimelineDiagramProps = {
  windowWidth: number
  windowHeight: number
  darkMode: boolean
  viewPosition: { x: number; y: number }
  setPosition: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
  zoom: number
  setZoom: React.Dispatch<React.SetStateAction<number>>
  yearSelection: { from: number; stepSize: number; to: number }
  setYearSelection: React.Dispatch<React.SetStateAction<{ from: number; stepSize: number; to: number }>>
  yearLabelWidth: number
  rowHeight: number
  peopleList: Person[]
  historyEvents: HistoryEvent[]
  peopleReferenceList: PersonReference[]
  publicationsList: Publication[]
  publicationReferenceList: PublicationReference[]
  peopleHistoryEvents: PersonHistoryEvent[]
  displayAuthors: boolean
  displayAuthorsTimeline: boolean
  displayAuthorRelations: boolean
  displayPublications: boolean
  displayPublicationRelations: boolean
  displayHistoryEvents: boolean
  displayPersonHistoryEvents: boolean
  highlightedAuthor: string
  updateHighlightedAuthor: React.Dispatch<React.SetStateAction<string>>
  highlightedPublication: string
  updateHighlightedPublication: React.Dispatch<React.SetStateAction<string>>
  onAuthorClick: (id: string) => void
  onPublicationClick: (publication: Publication, author: Person) => void
  onPersonHistoryClick: (event: PersonHistoryEvent, person: Person) => void
}

const historyEventRowHeight = 15

const TimelineDiagram = (props: TimelineDiagramProps) => {
  const hostRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<PixiApplication | null>(null)
  const [tooltip, setTooltip] = useState<TimelineTooltipState | null>(null)
  const [canvasOffset, setCanvasOffset] = useState({ left: 0, top: 0 })
  const [isDragged, setIsDragged] = useState(false)

  const dragRef = useRef({
    isDragged: false,
    startDragPosition: { x: 0, y: 0 },
    startViewPosition: { x: 0, y: 0 },
  })
  const pinchRef = useRef(0)
  const viewRef = useRef(props.viewPosition)
  const zoomRef = useRef(props.zoom)
  viewRef.current = props.viewPosition
  zoomRef.current = props.zoom

  const updateOffset = useCallback(() => {
    const el = hostRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setCanvasOffset({ left: r.left, top: r.top })
  }, [])

  useEffect(() => {
    updateOffset()
    window.addEventListener('resize', updateOffset)
    window.addEventListener('scroll', updateOffset, true)
    return () => {
      window.removeEventListener('resize', updateOffset)
      window.removeEventListener('scroll', updateOffset, true)
    }
  }, [updateOffset, props.windowWidth, props.windowHeight])

  const positionByYear = useCallback(
    (year: number) => (year - props.viewPosition.x) * props.zoom,
    [props.viewPosition.x, props.zoom],
  )
  const isVisible = useCallback(
    (year: number) =>
      positionByYear(year) + props.rowHeight > 0 && positionByYear(year) - props.rowHeight < props.windowWidth,
    [positionByYear, props.rowHeight, props.windowWidth],
  )
  const isVisibleRange = useCallback(
    (from: number, to: number) =>
      positionByYear(to) + props.rowHeight > 0 && positionByYear(from) - props.rowHeight < props.windowWidth,
    [positionByYear, props.rowHeight, props.windowWidth],
  )
  const rowPosition = useCallback(
    (rowNumber: number) => props.rowHeight * rowNumber + props.viewPosition.y,
    [props.rowHeight, props.viewPosition.y],
  )
  const historyEventRowPosition = useCallback(
    (rowNumber: number) => -historyEventRowHeight * rowNumber + props.viewPosition.y,
    [props.viewPosition.y],
  )

  const yearsOnScale = useMemo(
    () =>
      [...Array(Math.ceil((props.yearSelection.to - props.yearSelection.from) / props.yearSelection.stepSize))].map(
        (_, i) => props.yearSelection.from + i * props.yearSelection.stepSize,
      ),
    [props.yearSelection],
  )

  const clearHighlights = useCallback(() => {
    props.updateHighlightedAuthor('0')
    props.updateHighlightedPublication('0')
  }, [props.updateHighlightedAuthor, props.updateHighlightedPublication])

  const shared: SharedTimelineProps = {
    canvasOffset,
    clearHighlights,
    darkMode: props.darkMode,
    displayAuthorsTimeline: props.displayAuthorsTimeline,
    highlightedAuthor: props.highlightedAuthor,
    highlightedPublication: props.highlightedPublication,
    historyBox: 14,
    historyEventRowPosition,
    isVisible,
    isVisibleRange,
    onAuthorClick: props.onAuthorClick,
    onPersonHistoryClick: props.onPersonHistoryClick,
    onPublicationClick: props.onPublicationClick,
    personBox: 35,
    personHistoryBar: 10,
    personHistoryBox: 35,
    personHistoryDot: 5,
    personHistoryMaxCols: 28,
    personHistoryMaxRows: 3,
    positionByYear,
    publicationBox: 35,
    publicationMaxCols: 25,
    publicationMaxRows: 3,
    pubRefBox: 35,
    pubRefDot: 15,
    rowPosition,
    setTooltip,
    updateHighlightedAuthor: id => props.updateHighlightedAuthor(id),
    updateHighlightedPublication: id => props.updateHighlightedPublication(id),
    windowHeight: props.windowHeight,
    windowWidth: props.windowWidth,
    yearLabelWidth: props.yearLabelWidth,
  }

  const startPageDrag = (button: number, pageX: number, pageY: number) => {
    if (button === 0) {
      dragRef.current = {
        isDragged: true,
        startDragPosition: { x: pageX, y: pageY },
        startViewPosition: { ...viewRef.current },
      }
      setIsDragged(true)
    }
  }
  const stopPageDrag = () => {
    dragRef.current.isDragged = false
    setIsDragged(false)
  }
  const executePageDrag = (pageX: number, pageY: number) => {
    const drag = dragRef.current
    if (!drag.isDragged) return
    const zoom = zoomRef.current
    props.setPosition({
      x: Math.min(
        Math.max(
          drag.startViewPosition.x - (pageX - drag.startDragPosition.x) / zoom,
          props.yearSelection.from - props.yearLabelWidth,
        ),
        props.yearSelection.to + props.yearLabelWidth,
      ),
      y: drag.startViewPosition.y + (pageY - drag.startDragPosition.y),
    })
  }

  const calculateDelta = (x1: number, y1: number, x2: number, y2: number) => Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)

  const setZoom = props.setZoom
  const setPosition = props.setPosition
  const setYearSelection = props.setYearSelection
  const yearFrom = props.yearSelection.from
  const yearTo = props.yearSelection.to
  const yearLabelWidth = props.yearLabelWidth

  const applyZoomDelta = useCallback(
    (deltaY: number) => {
      const zoom = zoomRef.current
      if (Math.max(1, zoom - deltaY / 100) <= 11.0) {
        setYearSelection(ys => ({ ...ys, stepSize: 100 }))
        setZoom(Math.max(1, zoom - deltaY / 100))
      } else if (zoom - deltaY / 200 <= 22.0) {
        setYearSelection(ys => ({ ...ys, stepSize: 10 }))
        setZoom(zoom - deltaY / 200)
      } else {
        setYearSelection(ys => ({ ...ys, stepSize: 5 }))
        setZoom(zoom - deltaY / 300)
      }
      setPosition({
        x: viewRef.current.x - deltaY / 100,
        y: viewRef.current.y,
      })
    },
    [setPosition, setZoom, setYearSelection],
  )

  const applyPan = useCallback(
    (dxYears: number, dyPx: number) => {
      const view = viewRef.current
      setPosition({
        x: Math.min(Math.max(view.x + dxYears, yearFrom - yearLabelWidth), yearTo + yearLabelWidth),
        y: view.y + dyPx,
      })
    },
    [setPosition, yearFrom, yearTo, yearLabelWidth],
  )

  useEffect(() => {
    const el = hostRef.current
    if (!el) return

    const onPointerDown = (e: PointerEvent) => {
      if (e.button === 0) startPageDrag(0, e.pageX, e.pageY)
    }
    const onPointerMove = (e: PointerEvent) => executePageDrag(e.pageX, e.pageY)
    const onPointerUp = () => stopPageDrag()
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      applyZoomDelta(e.deltaY)
    }

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        startPageDrag(0, e.touches[0].pageX, e.touches[0].pageY)
      } else if (e.touches.length === 2) {
        startPageDrag(0, e.touches[0].pageX, e.touches[0].pageY)
        pinchRef.current = calculateDelta(
          e.touches[0].pageX,
          e.touches[0].pageY,
          e.touches[1].pageX,
          e.touches[1].pageY,
        )
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      if (e.touches.length === 1) {
        executePageDrag(e.touches[0].pageX, e.touches[0].pageY)
      } else if (e.touches.length === 2) {
        const pinchSize = calculateDelta(
          e.touches[0].pageX,
          e.touches[0].pageY,
          e.touches[1].pageX,
          e.touches[1].pageY,
        )
        const zoom = zoomRef.current
        const nextZoom = zoom - (pinchRef.current - pinchSize) / 100
        setZoom(nextZoom)
        pinchRef.current = pinchSize
        if (nextZoom <= 10) setYearSelection(ys => ({ ...ys, stepSize: 100 }))
        else if (nextZoom <= 20) setYearSelection(ys => ({ ...ys, stepSize: 10 }))
        else setYearSelection(ys => ({ ...ys, stepSize: 5 }))
        stopPageDrag()
      }
    }
    const onTouchEnd = () => stopPageDrag()

    const isTypingTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false
      const tag = target.tagName
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const panPx = 80
      const zoom = zoomRef.current
      const dx = panPx / zoom
      const dy = 40
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key

      switch (key) {
        case 'ArrowLeft':
        case 'h':
        case 'a':
          e.preventDefault()
          applyPan(-dx, 0)
          break
        case 'ArrowRight':
        case 'l':
        case 'd':
          e.preventDefault()
          applyPan(dx, 0)
          break
        case 'ArrowUp':
        case 'k':
        case 'w':
          e.preventDefault()
          applyPan(0, dy)
          break
        case 'ArrowDown':
        case 'j':
        case 's':
          e.preventDefault()
          applyPan(0, -dy)
          break
        case '+':
        case '=':
        case 'i':
        case 'q':
        case 'Add':
          e.preventDefault()
          applyZoomDelta(-100)
          break
        case '-':
        case '_':
        case 'o':
        case 'e':
        case 'Subtract':
          e.preventDefault()
          applyZoomDelta(100)
          break
        default:
          break
      }
    }

    el.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    window.addEventListener('keydown', onKeyDown)

    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [applyPan, applyZoomDelta, setZoom, setYearSelection])

  return (
    <div
      ref={hostRef}
      style={{
        cursor: isDragged ? 'grabbing' : 'grab',
        height: props.windowHeight,
        left: 0,
        position: 'absolute',
        top: 0,
        touchAction: 'none',
        width: props.windowWidth,
        zIndex: 0,
      }}
    >
      <Application
        antialias
        autoDensity
        backgroundAlpha={0}
        height={props.windowHeight}
        onInit={app => {
          appRef.current = app
          updateOffset()
        }}
        preference="webgl"
        resizeTo={hostRef}
        resolution={typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1}
        width={props.windowWidth}
      >
        {props.displayHistoryEvents && (
          <HistoryEventsLayer
            darkMode={props.darkMode}
            events={props.historyEvents}
            historyBox={14}
            historyEventRowPosition={historyEventRowPosition}
            isVisibleRange={isVisibleRange}
            positionByYear={positionByYear}
          />
        )}

        <PadLayer clearHighlights={clearHighlights} height={props.windowHeight} width={props.windowWidth} />

        <YearLinesLayer
          height={props.windowHeight}
          isVisible={isVisible}
          positionByYear={positionByYear}
          yearsOnScale={yearsOnScale}
        />

        {props.displayAuthorRelations && props.displayAuthors && (
          <PersonReferencesLayer
            people={props.peopleList}
            references={props.peopleReferenceList}
            shared={shared}
          />
        )}

        {props.displayAuthors && <PeopleLayer people={props.peopleList} shared={shared} />}

        {props.displayPublicationRelations && props.displayPublications && (
          <PublicationReferencesLayer
            people={props.peopleList}
            publications={props.publicationsList}
            references={props.publicationReferenceList}
            shared={shared}
          />
        )}

        {props.displayPublications && (
          <PublicationsLayer
            people={props.peopleList}
            publications={props.publicationsList}
            shared={shared}
          />
        )}

        {props.displayPersonHistoryEvents && props.displayAuthors && (
          <PersonHistoryEventsLayer
            events={props.peopleHistoryEvents}
            people={props.peopleList}
            shared={shared}
          />
        )}

        <YearLabelsLayer
          isVisible={isVisible}
          positionByYear={positionByYear}
          windowHeight={props.windowHeight}
          yearLabelWidth={props.yearLabelWidth}
          yearsOnScale={yearsOnScale}
        />
      </Application>

      <TimelineTooltip tooltip={tooltip} />
    </div>
  )
}

export default TimelineDiagram
