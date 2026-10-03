import { Application, useApplication, useTick } from '@pixi/react'
import type { Application as PixiApplication } from 'pixi.js'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  viewportFrame: { id: number; x: number; y: number; zoom: number } | null
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

function displayQuality() {
  if (typeof window === 'undefined') return { antialias: true, resolution: 1 }
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const dpr = window.devicePixelRatio || 1
  return {
    antialias: !coarse,
    resolution: Math.min(dpr, coarse ? 1.25 : 1.5),
  }
}

/** Live camera → Pixi transform (pan + zoom scale). No React setState. */
function CameraTransformDriver({
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
    const sx = live.zoom / layout.zoom
    const ox = (layout.x - live.x) * live.zoom
    const oy = live.y - layout.y
    const world = app.stage.getChildByLabel('hop-world', true)
    if (world) {
      world.scale.set(sx, 1)
      world.position.set(ox, oy)
    }
    const years = app.stage.getChildByLabel('hop-years', true)
    if (years) {
      years.scale.set(sx, 1)
      years.position.set(ox, 0)
    }
  })
  return null
}

const TimelineDiagram = (props: TimelineDiagramProps) => {
  const hostRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<PixiApplication | null>(null)
  const [tooltip, setTooltip] = useState<TimelineTooltipState | null>(null)
  const [canvasOffset, setCanvasOffset] = useState({ left: 0, top: 0 })
  const [isDragged, setIsDragged] = useState(false)
  const quality = useMemo(() => displayQuality(), [])

  // React layout camera: layers are positioned for this snapshot (re-render on zoom / data).
  const [layoutCamera, setLayoutCamera] = useState<Camera>({
    x: props.viewPosition.x,
    y: props.viewPosition.y,
    zoom: props.zoom,
  })
  const layoutCameraRef = useRef(layoutCamera)
  layoutCameraRef.current = layoutCamera

  // Cull camera: throttled snapshot of live view for mounting/unmounting off-screen nodes.
  const [cullCamera, setCullCamera] = useState<Camera>({ ...layoutCamera })
  const cullCameraRef = useRef(cullCamera)
  cullCameraRef.current = cullCamera

  // Live camera: updated every pan/inertia/zoom frame without React.
  const liveCameraRef = useRef<Camera>({ ...layoutCamera })

  const dragRef = useRef({
    isDragged: false,
    startDragPosition: { x: 0, y: 0 },
    startViewPosition: { x: 0, y: 0 },
  })
  const pinchRef = useRef(0)
  const primaryTouchIdRef = useRef<number | null>(null)
  const pointerClientXRef = useRef<number | null>(null)
  const clampRef = useRef({
    from: props.yearSelection.from,
    to: props.yearSelection.to,
    yearLabelWidth: props.yearLabelWidth,
  })
  const velocityRef = useRef({ vx: 0, vy: 0 })
  const lastMoveRef = useRef({ t: 0, x: 0, y: 0 })
  const inertiaRafRef = useRef<number | null>(null)
  const frameAnimRef = useRef<number | null>(null)
  const appliedFrameIdRef = useRef<number | null>(null)
  const windowWidthRef = useRef(props.windowWidth)
  windowWidthRef.current = props.windowWidth
  const layoutCommitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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

  const applyCameraTransform = useCallback(() => {
    const app = appRef.current
    if (!app) return
    const live = liveCameraRef.current
    const layout = layoutCameraRef.current
    const sx = live.zoom / layout.zoom
    const ox = (layout.x - live.x) * live.zoom
    const oy = live.y - layout.y
    const world = app.stage.getChildByLabel('hop-world', true)
    if (world) {
      world.scale.set(sx, 1)
      world.position.set(ox, oy)
    }
    const years = app.stage.getChildByLabel('hop-years', true)
    if (years) {
      years.scale.set(sx, 1)
      years.position.set(ox, 0)
    }
  }, [])

  /** Map layout-local coords → screen (accounts for live pan/zoom transform). */
  const layoutToScreen = useCallback((lx: number, ly: number) => {
    const live = liveCameraRef.current
    const layout = layoutCameraRef.current
    const sx = live.zoom / layout.zoom
    const ox = (layout.x - live.x) * live.zoom
    const oy = live.y - layout.y
    return { x: ox + lx * sx, y: oy + ly }
  }, [])

  /** Rebuild scene at live camera (correct stroke widths / year step). Rare vs per-frame. */
  const commitLayoutCamera = useCallback(
    (camera: Camera, stepSize?: number) => {
      if (layoutCommitTimerRef.current != null) {
        clearTimeout(layoutCommitTimerRef.current)
        layoutCommitTimerRef.current = null
      }
      liveCameraRef.current = { ...camera }
      setLayoutCamera(camera)
      setCullCamera(camera)
      setPosition({ x: camera.x, y: camera.y })
      setZoom(camera.zoom)
      if (stepSize != null) setYearSelection(ys => ({ ...ys, stepSize }))
      requestAnimationFrame(() => {
        const app = appRef.current
        if (!app) return
        const world = app.stage.getChildByLabel('hop-world', true)
        if (world) {
          world.scale.set(1, 1)
          world.position.set(0, 0)
        }
        const years = app.stage.getChildByLabel('hop-years', true)
        if (years) {
          years.scale.set(1, 1)
          years.position.set(0, 0)
        }
      })
    },
    [setPosition, setZoom, setYearSelection],
  )

  const stepSizeForZoom = (zoom: number) => {
    if (zoom <= 11) return 100
    if (zoom <= 22) return 10
    return 5
  }

  const scheduleLayoutCommit = useCallback(() => {
    if (layoutCommitTimerRef.current != null) clearTimeout(layoutCommitTimerRef.current)
    layoutCommitTimerRef.current = setTimeout(() => {
      layoutCommitTimerRef.current = null
      const live = liveCameraRef.current
      commitLayoutCamera(live, stepSizeForZoom(live.zoom))
    }, 140)
  }, [commitLayoutCamera])

  useEffect(
    () => () => {
      if (layoutCommitTimerRef.current != null) clearTimeout(layoutCommitTimerRef.current)
      if (frameAnimRef.current != null) cancelAnimationFrame(frameAnimRef.current)
    },
    [],
  )
  const positionByYear = useCallback(
    (year: number) => (year - layoutCamera.x) * layoutCamera.zoom,
    [layoutCamera.x, layoutCamera.zoom],
  )

  // Cull against throttled live view (screen X = (year - cull.x) * cull.zoom).
  // Extra margin covers pan between cull refreshes without empty edges.
  const cullMarginPx = props.windowWidth
  const isVisible = useCallback(
    (year: number) => {
      const x = (year - cullCamera.x) * cullCamera.zoom
      return x + cullMarginPx > 0 && x - cullMarginPx < props.windowWidth
    },
    [cullCamera.x, cullCamera.zoom, cullMarginPx, props.windowWidth],
  )
  const isVisibleRange = useCallback(
    (from: number, to: number) => {
      const x1 = (to - cullCamera.x) * cullCamera.zoom
      const x0 = (from - cullCamera.x) * cullCamera.zoom
      return x1 + cullMarginPx > 0 && x0 - cullMarginPx < props.windowWidth
    },
    [cullCamera.x, cullCamera.zoom, cullMarginPx, props.windowWidth],
  )
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
    highlightedAuthor: props.highlightedAuthor,
    highlightedPublication: props.highlightedPublication,
    historyBox: 14,
    historyEventRowPosition,
    isVisible,
    isVisibleRange,
    layoutToScreen,
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

  useEffect(() => {
    const frame = props.viewportFrame
    if (!frame || appliedFrameIdRef.current === frame.id) return
    appliedFrameIdRef.current = frame.id

    if (inertiaRafRef.current != null) {
      cancelAnimationFrame(inertiaRafRef.current)
      inertiaRafRef.current = null
    }
    if (layoutCommitTimerRef.current != null) {
      clearTimeout(layoutCommitTimerRef.current)
      layoutCommitTimerRef.current = null
    }
    if (frameAnimRef.current != null) {
      cancelAnimationFrame(frameAnimRef.current)
      frameAnimRef.current = null
    }

    const width = windowWidthRef.current
    if (width <= 0) return

    const start = liveCameraRef.current
    const left0 = start.x
    const right0 = start.x + width / Math.max(start.zoom, 0.0001)
    const left1 = frame.x
    const right1 = frame.x + width / Math.max(frame.zoom, 0.0001)
    const y0 = start.y
    const y1 = frame.y
    const coverLeft = Math.min(left0, left1)
    const coverRight = Math.max(right0, right1)
    const coverSpan = Math.max(coverRight - coverLeft, 1)
    setCullCamera({ x: coverLeft, y: Math.min(y0, y1), zoom: width / coverSpan })

    const startedAt = performance.now()
    const duration = 720
    const step = (now: number) => {
      if (frameAnimRef.current == null) return
      const t = Math.min(1, (now - startedAt) / duration)
      const eased = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
      const left = left0 + (left1 - left0) * eased
      const right = right0 + (right1 - right0) * eased
      const span = Math.max(right - left, 0.0001)
      const next = {
        x: clampViewX(left),
        y: y0 + (y1 - y0) * eased,
        zoom: width / span,
      }
      liveCameraRef.current = next
      applyCameraTransform()
      if (t < 1) {
        frameAnimRef.current = requestAnimationFrame(step)
        return
      }
      frameAnimRef.current = null
      const zoom = next.zoom
      let stepSize = 5
      if (zoom <= 11) stepSize = 100
      else if (zoom <= 22) stepSize = 10
      commitLayoutCamera(next, stepSize)
    }
    frameAnimRef.current = requestAnimationFrame(step)
  }, [applyCameraTransform, clampViewX, commitLayoutCamera, props.viewportFrame])

  /** Refresh React cull window when live camera drifts far enough (not every pan frame). */
  const maybeUpdateCull = useCallback(() => {
    const live = liveCameraRef.current
    const cull = cullCameraRef.current
    const w = props.windowWidth
    const h = props.windowHeight
    const dxPx = Math.abs(live.x - cull.x) * Math.min(live.zoom, cull.zoom)
    const dyPx = Math.abs(live.y - cull.y)
    const zoomRatio = live.zoom / cull.zoom
    if (dxPx > w * 0.4 || dyPx > h * 0.4 || zoomRatio > 1.2 || zoomRatio < 1 / 1.2) {
      setCullCamera({ x: live.x, y: live.y, zoom: live.zoom })
    }
  }, [props.windowHeight, props.windowWidth])

  const setLiveCamera = useCallback(
    (next: Camera) => {
      if (frameAnimRef.current != null) {
        cancelAnimationFrame(frameAnimRef.current)
        frameAnimRef.current = null
      }
      liveCameraRef.current = {
        x: clampViewX(next.x),
        y: next.y,
        zoom: next.zoom,
      }
      applyCameraTransform()
      maybeUpdateCull()
    },
    [applyCameraTransform, clampViewX, maybeUpdateCull],
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
      if (frameAnimRef.current != null) {
        cancelAnimationFrame(frameAnimRef.current)
        frameAnimRef.current = null
      }
      stopInertia()
      dragRef.current = {
        isDragged: true,
        startDragPosition: { x: pageX, y: pageY },
        startViewPosition: { ...liveCameraRef.current },
      }
      lastMoveRef.current = { t: performance.now(), x: pageX, y: pageY }
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
    lastMoveRef.current = { t: now, x: pageX, y: pageY }

    setLiveCamera({
      x: drag.startViewPosition.x - (pageX - drag.startDragPosition.x) / zoom,
      y: drag.startViewPosition.y + (pageY - drag.startDragPosition.y),
      zoom,
    })
  }

  const calculateDelta = (x1: number, y1: number, x2: number, y2: number) => Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)

  const zoomTo = useCallback(
    (nextZoom: number, anchorPx: number) => {
      stopInertia()
      const live = liveCameraRef.current
      const currentZoom = Math.max(live.zoom, 0.0001)
      const targetZoom = Math.max(nextZoom, 0.0001)
      const anchorYear = live.x + anchorPx / currentZoom
      setLiveCamera({
        x: anchorYear - anchorPx / targetZoom,
        y: live.y,
        zoom: targetZoom,
      })
      scheduleLayoutCommit()
    },
    [scheduleLayoutCommit, setLiveCamera, stopInertia],
  )

  const applyZoomDelta = useCallback(
    (deltaY: number, anchorPx: number) => {
      const zoom = liveCameraRef.current.zoom
      let nextZoom: number
      if (Math.max(1, zoom - deltaY / 100) <= 11.0) {
        nextZoom = Math.max(1, zoom - deltaY / 100)
      } else if (zoom - deltaY / 200 <= 22.0) {
        nextZoom = zoom - deltaY / 200
      } else {
        nextZoom = zoom - deltaY / 300
      }
      zoomTo(nextZoom, anchorPx)
    },
    [zoomTo],
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
    const onPointerMove = (e: PointerEvent) => {
      pointerClientXRef.current = e.clientX
      executePageDrag(e.pageX, e.pageY)
    }
    const onPointerUp = () => stopPageDrag()
    const anchorPxFromClientX = (clientX: number) => clientX - el.getBoundingClientRect().left
    const keyboardAnchorPx = () => {
      const rect = el.getBoundingClientRect()
      return anchorPxFromClientX(pointerClientXRef.current ?? rect.left + rect.width / 2)
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      applyZoomDelta(e.deltaY, anchorPxFromClientX(e.clientX))
    }

    const rememberPrimaryTouch = (e: TouchEvent) => {
      if (primaryTouchIdRef.current == null && e.touches.length > 0) {
        primaryTouchIdRef.current = e.touches[0].identifier
      }
    }
    const primaryTouchX = (e: TouchEvent) => {
      const id = primaryTouchIdRef.current
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === id) return e.touches[i].clientX
      }
      return e.touches.length > 0 ? e.touches[0].clientX : null
    }
    const releasePrimaryTouch = (e: TouchEvent) => {
      const id = primaryTouchIdRef.current
      if (id == null) return
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === id) return
      }
      primaryTouchIdRef.current = e.touches.length > 0 ? e.touches[0].identifier : null
    }

    const onTouchStart = (e: TouchEvent) => {
      rememberPrimaryTouch(e)
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
        const nextZoom = Math.max(1, zoom - (pinchRef.current - pinchSize) / 100)
        pinchRef.current = pinchSize
        stopPageDrag(false)
        const clientX = primaryTouchX(e)
        if (clientX != null) zoomTo(nextZoom, anchorPxFromClientX(clientX))
      }
    }
    const onTouchEnd = (e: TouchEvent) => {
      releasePrimaryTouch(e)
      stopPageDrag()
    }

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
          applyZoomDelta(-100, keyboardAnchorPx())
          break
        case '-':
        case '_':
        case 'o':
        case 'e':
        case 'Subtract':
          e.preventDefault()
          applyZoomDelta(100, keyboardAnchorPx())
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
  }, [applyPan, applyZoomDelta, startInertia, stopInertia, zoomTo])

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
        antialias={quality.antialias}
        autoDensity
        backgroundAlpha={0}
        height={props.windowHeight}
        onInit={app => {
          appRef.current = app
          updateOffset()
        }}
        preference="webgl"
        resizeTo={hostRef}
        resolution={quality.resolution}
        width={props.windowWidth}
      >
        <CameraTransformDriver layoutCameraRef={layoutCameraRef} liveCameraRef={liveCameraRef} />

        {/* Behind world content so people/pubs receive hover & clicks; still catches empty-space clears. */}
        <PadLayer clearHighlights={clearHighlights} height={props.windowHeight} width={props.windowWidth} />

        <pixiContainer label="hop-world">
          {props.displayHistoryEvents && (
            <HistoryEventsLayer
              darkMode={props.darkMode}
              events={props.historyEvents}
              historyBox={14}
              historyEventRowPosition={historyEventRowPosition}
              isVisibleRange={isVisibleRange}
              positionByYear={positionByYear}
              windowHeight={props.windowHeight}
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

        <pixiContainer eventMode="none" label="hop-years">
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
      </Application>

      <TimelineTooltip tooltip={tooltip} />
    </div>
  )
}

export default TimelineDiagram
