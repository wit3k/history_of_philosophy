import React from 'react'
import { PLAYBACK_SPEED_STEPS, type PlaybackSpeed } from '../../utils/mapTemporal'
import { formatPlayhead, formatYear } from '../../utils/years'

const DESKTOP_MEDIA_QUERY = '(min-width: 768px)'
/** Matches Menu sidebar `md:w-[300px]`. */
const FILTERS_SIDEBAR_WIDTH_PX = 300
const LABEL_GAP_PX = 8
const PLAYHEAD_LABEL_PAD_PX = 10

type MapTemporalScrubberProps = {
  darkMode: boolean
  year: number
  yearFrom: number
  yearTo: number
  playing: boolean
  playbackSpeed: PlaybackSpeed
  /** When the collections/filters sidebar is open. */
  filtersVisible: boolean
  /** Axis domain for the bar (usually collection span, may be wider than selection). */
  axisFrom: number
  axisTo: number
  onRangeChange: (yearFrom: number, yearTo: number) => void
  onYearChange: (year: number) => void
  /** Single click on the axis: jump the animation playhead to that year. */
  onSeek: (year: number) => void
  onPlayToggle: () => void
  onSpeedChange: (speed: PlaybackSpeed) => void
}

type DragKind = 'from' | 'to' | 'year' | 'range' | 'track' | null

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max)
}

function formatSpeed(speed: number): string {
  if (speed < 1) return `${speed}×`
  return `${speed}×`
}

const labelFont =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'

const MapTemporalScrubber = (props: MapTemporalScrubberProps) => {
  const trackRef = React.useRef<HTMLDivElement>(null)
  const playheadLabelRef = React.useRef<HTMLSpanElement>(null)
  const dragKind = React.useRef<DragKind>(null)
  const rangeGrabOffset = React.useRef(0)
  const pointerDown = React.useRef<{ x: number; y: number; year: number; seek: boolean } | null>(null)
  const [isDesktop, setIsDesktop] = React.useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(DESKTOP_MEDIA_QUERY).matches : true,
  )
  const [playheadLabelLeft, setPlayheadLabelLeft] = React.useState(false)

  React.useEffect(() => {
    const media = window.matchMedia(DESKTOP_MEDIA_QUERY)
    const onChange = () => setIsDesktop(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const axisFrom = Math.min(props.axisFrom, props.axisTo)
  const axisTo = Math.max(props.axisFrom, props.axisTo)
  const span = Math.max(axisTo - axisFrom, 1)

  const yearToRatio = (year: number) => (year - axisFrom) / span
  const ratioToYear = (ratio: number) => Math.round(axisFrom + clamp(ratio, 0, 1) * span)

  const clientXToYear = (clientX: number) => {
    const el = trackRef.current
    if (!el) return props.year
    const rect = el.getBoundingClientRect()
    if (rect.width <= 0) return props.year
    return ratioToYear((clientX - rect.left) / rect.width)
  }

  const onPointerDown = (kind: DragKind) => (event: React.PointerEvent) => {
    event.preventDefault()
    event.stopPropagation()
    dragKind.current = kind
    pointerDown.current = {
      x: event.clientX,
      y: event.clientY,
      year: clientXToYear(event.clientX),
      seek: kind === 'range' || kind === 'track',
    }
    ;(event.target as HTMLElement).setPointerCapture?.(event.pointerId)
    if (kind === 'range') {
      const y = clientXToYear(event.clientX)
      rangeGrabOffset.current = y - props.yearFrom
    }
  }

  const propsRef = React.useRef(props)
  propsRef.current = props

  React.useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const kind = dragKind.current
      if (!kind) return
      const p = propsRef.current
      const el = trackRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      if (rect.width <= 0) return
      const axisLo = Math.min(p.axisFrom, p.axisTo)
      const axisHi = Math.max(p.axisFrom, p.axisTo)
      const axisSpan = Math.max(axisHi - axisLo, 1)
      const y = Math.round(axisLo + clamp((event.clientX - rect.left) / rect.width, 0, 1) * axisSpan)
      if (kind === 'from') {
        const nextFrom = clamp(y, axisLo, p.yearTo)
        p.onRangeChange(nextFrom, p.yearTo)
      } else if (kind === 'to') {
        const nextTo = clamp(y, p.yearFrom, axisHi)
        p.onRangeChange(p.yearFrom, nextTo)
      } else if (kind === 'year') {
        p.onYearChange(clamp(y, p.yearFrom, p.yearTo))
      } else if (kind === 'range') {
        const width = p.yearTo - p.yearFrom
        let nextFrom = y - rangeGrabOffset.current
        nextFrom = clamp(nextFrom, axisLo, axisHi - width)
        p.onRangeChange(nextFrom, nextFrom + width)
      }
    }
    const onUp = (event: PointerEvent) => {
      const down = pointerDown.current
      const kind = dragKind.current
      dragKind.current = null
      pointerDown.current = null
      if (!down?.seek || (kind !== 'range' && kind !== 'track')) return
      const moved = Math.hypot(event.clientX - down.x, event.clientY - down.y)
      if (moved <= 4) propsRef.current.onSeek(down.year)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [])

  const fromPct = yearToRatio(props.yearFrom) * 100
  const toPct = yearToRatio(props.yearTo) * 100
  const yearPct = yearToRatio(props.year) * 100
  const playheadText = formatPlayhead(props.year)

  React.useLayoutEffect(() => {
    const track = trackRef.current
    const label = playheadLabelRef.current
    if (!track || !label) return
    const trackRect = track.getBoundingClientRect()
    const labelWidth = label.offsetWidth
    const playheadX = trackRect.left + (yearPct / 100) * trackRect.width
    const roomRight = trackRect.right - (playheadX + LABEL_GAP_PX)
    setPlayheadLabelLeft(roomRight < labelWidth + PLAYHEAD_LABEL_PAD_PX)
  }, [playheadText, yearPct, props.filtersVisible, isDesktop])

  // Full-screen filters drawer on mobile — hide the scrubber while it is open.
  if (props.filtersVisible && !isDesktop) return null

  const speedIndex = Math.max(0, PLAYBACK_SPEED_STEPS.indexOf(props.playbackSpeed))
  const canSlow = speedIndex > 0
  const canFast = speedIndex < PLAYBACK_SPEED_STEPS.length - 1

  const bg = props.darkMode ? 'rgba(20, 22, 24, 0.92)' : 'rgba(255, 255, 255, 0.94)'
  const trackBg = props.darkMode ? '#3a3d40' : '#d1d5db'
  const rangeBg = props.darkMode ? '#5b8def' : '#2563eb'
  const text = props.darkMode ? '#e5e7eb' : '#111827'
  const handleBorder = props.darkMode ? '#111' : '#fff'
  const mutedBtn = props.darkMode ? '#2f3338' : '#e5e7eb'
  const labelColor = props.darkMode ? 'rgba(229, 231, 235, 0.9)' : 'rgba(17, 24, 39, 0.85)'

  const controlBtn = (opts: {
    label: string
    aria: string
    onClick: () => void
    disabled?: boolean
    primary?: boolean
    width?: number
  }) => (
    <button
      aria-label={opts.aria}
      disabled={opts.disabled}
      onClick={opts.onClick}
      style={{
        alignItems: 'center',
        background: opts.primary ? rangeBg : mutedBtn,
        border: 'none',
        borderRadius: 8,
        color: opts.primary ? '#fff' : text,
        cursor: opts.disabled ? 'default' : 'pointer',
        display: 'flex',
        flex: '0 0 auto',
        fontSize: 13,
        fontWeight: 700,
        height: 36,
        justifyContent: 'center',
        opacity: opts.disabled ? 0.4 : 1,
        width: opts.width ?? 36,
      }}
      type="button"
    >
      {opts.label}
    </button>
  )

  const shiftedForSidebar = props.filtersVisible && isDesktop

  const bubbleLabel = (opts: {
    leftPct: number
    text: string
    placement: 'above' | 'below'
  }) => (
    <span
      style={{
        color: labelColor,
        fontFamily: labelFont,
        fontSize: 11,
        fontVariantNumeric: 'tabular-nums',
        left: `${opts.leftPct}%`,
        pointerEvents: 'none',
        position: 'absolute',
        top: opts.placement === 'above' ? -2 : undefined,
        bottom: opts.placement === 'below' ? -2 : undefined,
        transform:
          opts.placement === 'above'
            ? 'translate(-50%, -100%)'
            : 'translate(-50%, 100%)',
        whiteSpace: 'nowrap',
        zIndex: 1,
      }}
    >
      {opts.text}
    </span>
  )

  return (
    <div
      style={{
        background: bg,
        borderTop: props.darkMode ? '1px solid #333' : '1px solid #e5e7eb',
        bottom: 0,
        boxSizing: 'border-box',
        color: text,
        display: 'flex',
        gap: 12,
        left: shiftedForSidebar ? FILTERS_SIDEBAR_WIDTH_PX : 0,
        padding: '10px 14px 14px',
        pointerEvents: 'auto',
        position: 'absolute',
        right: 0,
        transition: 'left 300ms',
        zIndex: 40,
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', flex: '0 0 auto', gap: 6 }}>
        {controlBtn({
          label: props.playing ? '❚❚' : '▶',
          aria: props.playing ? 'Pause' : 'Play',
          onClick: props.onPlayToggle,
          primary: true,
          width: 44,
        })}
        {controlBtn({
          label: '−',
          aria: 'Spowolnij animację',
          disabled: !canSlow,
          onClick: () => props.onSpeedChange(PLAYBACK_SPEED_STEPS[speedIndex - 1]),
        })}
        <span
          style={{
            fontFamily: labelFont,
            fontSize: 12,
            fontVariantNumeric: 'tabular-nums',
            minWidth: '3.5ch',
            opacity: 0.9,
            textAlign: 'center',
          }}
          title="Prędkość odtwarzania"
        >
          {formatSpeed(props.playbackSpeed)}
        </span>
        {controlBtn({
          label: '+',
          aria: 'Przyspiesz animację',
          disabled: !canFast,
          onClick: () => props.onSpeedChange(PLAYBACK_SPEED_STEPS[speedIndex + 1]),
        })}
      </div>

      <div style={{ display: 'flex', flex: 1, flexDirection: 'column', minWidth: 0, paddingBottom: 14, paddingTop: 14 }}>
        <div
          ref={trackRef}
          onPointerDown={onPointerDown('track')}
          style={{
            background: trackBg,
            borderRadius: 999,
            cursor: 'pointer',
            height: 10,
            position: 'relative',
            touchAction: 'none',
            width: '100%',
          }}
        >
          <div
            onPointerDown={onPointerDown('range')}
            style={{
              background: rangeBg,
              borderRadius: 999,
              bottom: 0,
              cursor: 'grab',
              left: `${fromPct}%`,
              opacity: 0.85,
              position: 'absolute',
              top: 0,
              width: `${Math.max(toPct - fromPct, 0.5)}%`,
            }}
          />
          {bubbleLabel({
            leftPct: fromPct,
            placement: 'below',
            text: formatYear(props.yearFrom),
          })}
          {bubbleLabel({
            leftPct: toPct,
            placement: 'above',
            text: formatYear(props.yearTo),
          })}
          <span
            ref={playheadLabelRef}
            style={{
              color: '#fff',
              fontFamily: labelFont,
              fontSize: 11,
              fontVariantNumeric: 'tabular-nums',
              fontWeight: 600,
              left: `${yearPct}%`,
              pointerEvents: 'none',
              position: 'absolute',
              textShadow: '0 0 3px rgba(0,0,0,0.55)',
              top: '50%',
              transform: playheadLabelLeft
                ? `translate(calc(-100% - ${LABEL_GAP_PX}px), -50%)`
                : `translate(${LABEL_GAP_PX}px, -50%)`,
              whiteSpace: 'nowrap',
              zIndex: 4,
            }}
          >
            {playheadText}
          </span>
          <Handle
            border={handleBorder}
            color={rangeBg}
            leftPct={fromPct}
            onPointerDown={onPointerDown('from')}
            title="yearFrom"
          />
          <Handle
            border={handleBorder}
            color={rangeBg}
            leftPct={toPct}
            onPointerDown={onPointerDown('to')}
            title="yearTo"
          />
          <Handle
            border={handleBorder}
            color={props.darkMode ? '#fbbf24' : '#d97706'}
            leftPct={yearPct}
            onPointerDown={onPointerDown('year')}
            title="year"
            wide
          />
        </div>
      </div>
    </div>
  )
}

function Handle(props: {
  leftPct: number
  color: string
  border: string
  title: string
  wide?: boolean
  onPointerDown: (event: React.PointerEvent) => void
}) {
  const size = props.wide ? 16 : 14
  return (
    <div
      onPointerDown={props.onPointerDown}
      title={props.title}
      style={{
        background: props.color,
        border: `2px solid ${props.border}`,
        borderRadius: 999,
        boxShadow: '0 1px 3px rgba(0,0,0,0.35)',
        cursor: 'ew-resize',
        height: size,
        left: `${props.leftPct}%`,
        position: 'absolute',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        touchAction: 'none',
        width: size,
        zIndex: props.wide ? 3 : 2,
      }}
    />
  )
}

export default MapTemporalScrubber
