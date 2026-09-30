import { Application, useApplication, useTick } from '@pixi/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Application as PixiApplication, Container } from 'pixi.js'
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

type Camera = { x: number; y: number; zoom: number }

const historyEventRowHeight = 15

/** Applies live camera as a pan offset — mutates Pixi containers, no React setState. */
function WorldPanDriver({
  liveCameraRef,
  layoutCameraRef,
}: {
  liveCameraRef: React.MutableRefObject<Camera>
  layoutCameraRef: React.MutableRefObject<Camera>
}) {
  const { app } = useApplication()
  useTick(() => {
    if (!app) return
    const live = liveCameraRef.current
    const layout = layoutCameraRef.current
    const ox = (layout.x - live.x) * layout.zoom
    const oy = live.y - layout.y
    const world = app.stage.getChildByLabel('hop-world', true)
    if (world) world.position.set(ox, oy)
    const years = app.stage.getChildByLabel('hop-years', true)
    if (years) years.position.set(ox, 0)
  })
  return null
}

const TimelineDiagram = (props: TimelineDiagramProps) => {
  const hostRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<PixiApplication | null>(null)
  const [tooltip, setTooltip] = useState<TimelineTooltipState | null>(null)
  const [canvasOffset, setCanvasOffset] = useState({ left: 0, top: 0 })
  const [isDragged, setIsDragged] = useState(false)

  // React layout camera: layers are positioned for this snapshot (re-render on zoom / data).
  const [layoutCamera, setLayoutCamera] = useState<Camera>({
    x: props.viewPosition.x,
    y: props.viewPosition.y,
    zoom: props.zoom,
  })
  const layoutCameraRef = useRef(layoutCamera)
  layoutCameraRef.current = layoutCamera

  // Live camera: updated every pan/inertia/zoom frame without React.
  const liveCameraRef = useRef<Camera>({ ...layoutCamera })

  const dragRef = useRef({
    isDragged: false,
    startDragPosition: { x: 0, y: 0 },
    startViewPosition: { x: 0, y: 0 },
  })
  const pinchRef = useRef(0)
  const clampRef = useRef({
    from: props.yearSelection.from,
    to: props.yearSelection.to,
    yearLabelWidth: props.yearLabelWidth,
  })
  const velocityRef = useRef({ vx: 0, vy: 0 })
  const lastMoveRef = useRef({ x: 0, y: 0, t: 0 })
  const inertiaRafRef = useRef<number | null>(null)
  clampRef.current = {
    from: props.yearSelection.from,
    to: props.yearSelection.to,
    yearLabelWidth: props.yearLabelWidth,
  }

  const setZoom = props.setZoom
  const setPosition = props.setPosition
  const setYearSelection = props.setYearSelection

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

  const applyWorldTransform = useCallback(() => {
    const app = appRef.current
    if (!app) return
    const live = liveCameraRef.current
    const layout = layoutCameraRef.current
    const ox = (layout.x - live.x) * layout.zoom
    const oy = live.y - layout.y
    const world = app.stage.getChildByLabel('hop-world', true)
    if (world) world.position.set(ox, oy)
    const years = app.stage.getChildByLabel('hop-years', true)
    if (years) years.position.set(ox, 0)
  }, [])

  const getWorldOffset = useCallback(() => {
    const app = appRef.current
    const world = app?.stage.getChildByLabel('hop-world', true) as Container | null | undefined
    return world ? { x: world.position.x, y: world.position.y } : { x: 0, y: 0 }
  }, [])

  /** Commit live camera into React layout (zoom / resize / data) — resets pan offset. */
  const commitLayoutCamera = useCallback(
    (camera: Camera, stepSize?: number) => {
      liveCameraRef.current = { ...camera }
      setLayoutCamera(camera)
      setPosition({ x: camera.x, y: camera.y })
      setZoom(camera.zoom)
      if (stepSize != null) setYearSelection(ys => ({ ...ys, stepSize }))
      // next frame WorldPanDriver / applyWorldTransform will zero the offset
      requestAnimationFrame(() => {
        const app = appRef.current
        if (!app) return
        const world = app.stage.getChildByLabel('hop-world', true)
        if (world) world.position.set(0, 0)
        const years = app.stage.getChildByLabel('hop-years', true)
        if (years) years.position.set(0, 0)
      })
    },
    [setPosition, setZoom, setYearSelection],
  )

  const positionByYear = useCallback(
    (year: number) => (year - layoutCamera.x) * layoutCamera.zoom,
    [layoutCamera.x, layoutCamera.zoom],
  )
  // Always true: pan uses container offset, so culled items would never enter the viewport mid-gesture.
  const isVisible = useCallback((_year: number) => true, [])
  const isVisibleRange = useCallback((_from: number, _to: number) => true, [])
  const rowPosition = useCallback(
    (rowNumber: number) => props.rowHeight * rowNumber + layoutCamera.y,
    [props.rowHeight, layoutCamera.y],
  )
  const historyEventRowPosition = useCallback(
    (rowNumber: number) => -historyEventRowHeight * rowNumber + layoutCamera.y,
    [layoutCamera.y],
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
    getWorldOffset,
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

  const stopInertia = useCallback(() => {
    if (inertiaRafRef.current != null) {
      cancelAnimationFrame(inertiaRafRef.current)
      inertiaRafRef.current = null
    }
  }, [])

  const clampViewX = useCallback((x: number) => {
    const { from, to, yearLabelWidth: labelW } = clampRef.current
    return Math.min(Math.max(x, from - labelW), to + labelW)
  }, [])

  const setLiveCamera = useCallback(
    (next: Camera) => {
      liveCameraRef.current = {
        x: clampViewX(next.x),
        y: next.y,
        zoom: next.zoom,
      }
      applyWorldTransform()
    },
    [applyWorldTransform, clampViewX],
  )

  const startInertia = useCallback(
    (vxYearsPerSec: number, vyPxPerSec: number) => {
      stopInertia()
      let vx = vxYearsPerSec
      let vy = vyPxPerSec
      let last = performance.now()
      const friction = 4.2
      const minSpeedPx = 35

      const tick = (now: number) => {
        const dt = Math.min((now - last) / 1000, 0.064)
        last = now
        const decay = Math.exp(-friction * dt)
        vx *= decay
        vy *= decay

        const zoom = liveCameraRef.current.zoom
        if (Math.hypot(vx * zoom, vy) < minSpeedPx) {
          inertiaRafRef.current = null
          return
        }

        const live = liveCameraRef.current
        setLiveCamera({
          x: live.x + vx * dt,
          y: live.y + vy * dt,
          zoom: live.zoom,
        })
        inertiaRafRef.current = requestAnimationFrame(tick)
      }

      inertiaRafRef.current = requestAnimationFrame(tick)
    },
    [setLiveCamera, stopInertia],
  )

  const startPageDrag = (button: number, pageX: number, pageY: number) => {
    if (button === 0) {
      stopInertia()
      dragRef.current = {
        isDragged: true,
        startDragPosition: { x: pageX, y: pageY },
        startViewPosition: { ...liveCameraRef.current },
      }
      lastMoveRef.current = { x: pageX, y: pageY, t: performance.now() }
      velocityRef.current = { vx: 0, vy: 0 }
      setIsDragged(true)
    }
  }

  const stopPageDrag = (releaseInertia = true) => {
    const wasDragging = dragRef.current.isDragged
    dragRef.current.isDragged = false
    setIsDragged(false)
    if (releaseInertia && wasDragging) {
      const { vx, vy } = velocityRef.current
      const speedPx = Math.hypot(vx * liveCameraRef.current.zoom, vy)
      if (speedPx > 80) startInertia(vx, vy)
    }
    velocityRef.current = { vx: 0, vy: 0 }
  }

  const executePageDrag = (pageX: number, pageY: number) => {
    const drag = dragRef.current
    if (!drag.isDragged) return
    const zoom = liveCameraRef.current.zoom
    const now = performance.now()
    const dt = (now - lastMoveRef.current.t) / 1000
    if (dt > 0 && dt < 0.12) {
      const dPageX = pageX - lastMoveRef.current.x
      const dPageY = pageY - lastMoveRef.current.y
      const sampleVx = -dPageX / zoom / dt
      const sampleVy = dPageY / dt
      velocityRef.current = {
        vx: velocityRef.current.vx * 0.35 + sampleVx * 0.65,
        vy: velocityRef.current.vy * 0.35 + sampleVy * 0.65,
      }
    } else if (dt >= 0.12) {
      velocityRef.current = { vx: 0, vy: 0 }
    }
    lastMoveRef.current = { x: pageX, y: pageY, t: now }

    setLiveCamera({
      x: drag.startViewPosition.x - (pageX - drag.startDragPosition.x) / zoom,
      y: drag.startViewPosition.y + (pageY - drag.startDragPosition.y),
      zoom,
    })
  }

  const calculateDelta = (x1: number, y1: number, x2: number, y2: number) => Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)

  const stepSizeForZoom = (zoom: number) => {
    if (zoom <= 11) return 100
    if (zoom <= 22) return 10
    return 5
  }

  const applyZoomDelta = useCallback(
    (deltaY: number) => {
      stopInertia()
      const zoom = liveCameraRef.current.zoom
      let nextZoom: number
      if (Math.max(1, zoom - deltaY / 100) <= 11.0) {
        nextZoom = Math.max(1, zoom - deltaY / 100)
      } else if (zoom - deltaY / 200 <= 22.0) {
        nextZoom = zoom - deltaY / 200
      } else {
        nextZoom = zoom - deltaY / 300
      }
      const next: Camera = {
        x: liveCameraRef.current.x - deltaY / 100,
        y: liveCameraRef.current.y,
        zoom: nextZoom,
      }
      // Zoom changes layout math — one React commit (not per pan frame).
      commitLayoutCamera(next, stepSizeForZoom(nextZoom))
    },
    [commitLayoutCamera, stopInertia],
  )

  const applyPan = useCallback(
    (dxYears: number, dyPx: number) => {
      stopInertia()
      const live = liveCameraRef.current
      setLiveCamera({
        x: live.x + dxYears,
        y: live.y + dyPx,
        zoom: live.zoom,
      })
    },
    [setLiveCamera, stopInertia],
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
        const pinchSize = calculateDelta(e.touches[0].pageX, e.touches[0].pageY, e.touches[1].pageX, e.touches[1].pageY)
        const zoom = liveCameraRef.current.zoom
        const nextZoom = zoom - (pinchRef.current - pinchSize) / 100
        pinchRef.current = pinchSize
        stopPageDrag(false)
        commitLayoutCamera(
          {
            x: liveCameraRef.current.x,
            y: liveCameraRef.current.y,
            zoom: nextZoom,
          },
          stepSizeForZoom(nextZoom),
        )
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
      const zoom = liveCameraRef.current.zoom
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
      stopInertia()
    }
  }, [applyPan, applyZoomDelta, commitLayoutCamera, startInertia, stopInertia])

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
        <WorldPanDriver layoutCameraRef={layoutCameraRef} liveCameraRef={liveCameraRef} />

        <pixiContainer label="hop-world">
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

          {props.displayAuthorRelations && props.displayAuthors && (
            <PersonReferencesLayer people={props.peopleList} references={props.peopleReferenceList} shared={shared} />
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
            <PublicationsLayer people={props.peopleList} publications={props.publicationsList} shared={shared} />
          )}

          {props.displayPersonHistoryEvents && props.displayAuthors && (
            <PersonHistoryEventsLayer events={props.peopleHistoryEvents} people={props.peopleList} shared={shared} />
          )}
        </pixiContainer>

        <pixiContainer label="hop-years">
          <YearLinesLayer
            height={props.windowHeight}
            isVisible={isVisible}
            positionByYear={positionByYear}
            yearsOnScale={yearsOnScale}
          />
          <YearLabelsLayer
            isVisible={isVisible}
            positionByYear={positionByYear}
            windowHeight={props.windowHeight}
            yearLabelWidth={props.yearLabelWidth}
            yearsOnScale={yearsOnScale}
          />
        </pixiContainer>

        <PadLayer clearHighlights={clearHighlights} height={props.windowHeight} width={props.windowWidth} />
      </Application>

      <TimelineTooltip tooltip={tooltip} />
    </div>
  )
}

export default TimelineDiagram
