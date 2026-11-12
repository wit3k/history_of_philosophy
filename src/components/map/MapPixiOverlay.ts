/**
 * Imperative Pixi overlay for GeographicMap (not @pixi/react).
 * MapLibre owns pan/zoom/basemap; this scene draws paths + bubbles in screen space.
 * Canvas is pointer-events:none so MapLibre keeps wheel/pan/zoom; hit-testing runs
 * on MapLibre mouse/click events instead of capturing the pointer on the overlay.
 */
import {
  Application,
  Assets,
  Circle,
  Container,
  Graphics,
  Sprite,
  Text,
  Texture,
} from 'pixi.js'

export type OverlayBubble = {
  id: string
  kind: 'portrait' | 'event' | 'hub'
  lat: number
  lng: number
  diameter: number
  accent: string
  opacity: number
  border: string
  label: string
  personId: string
  /** Hub: all member person ids (for selection emphasis without dimming others). */
  memberPersonIds?: string[]
  count?: number
  thumbnail?: string | null
  /** Crowded: animate border only (no layout motion). */
  pulse?: boolean
  /** Sparse portrait: screen-space hop (does not affect neighbors' layout). */
  hop?: boolean
}

export type OverlayPathSeg = {
  id: string
  personId: string
  accent: string
  opacity: number
  coordinates: [number, number][]
}

export type OverlayHighlight = {
  accent: string
  opacity: number
  coordinates: [number, number][]
} | null

export type OverlayHit =
  | { type: 'bubble'; bubble: OverlayBubble }
  | { type: 'path'; personId: string }
  | null

type MapMouseEvent = {
  point: { x: number; y: number }
  originalEvent: MouseEvent
}

type MapLike = {
  project: (lngLat: [number, number]) => { x: number; y: number }
  getCanvas: () => HTMLCanvasElement
  on: (type: string, listener: (e: MapMouseEvent) => void) => void
  off: (type: string, listener: (e: MapMouseEvent) => void) => void
}

const DASH_PHASES: number[][] = [
  [0, 4, 3],
  [0.5, 4, 2.5],
  [1, 4, 2],
  [1.5, 4, 1.5],
  [2, 4, 1],
  [2.5, 4, 0.5],
  [3, 4, 0],
]

function parseColor(hex: string): number {
  const h = hex.replace('#', '').trim()
  if (h.length === 3) {
    return Number.parseInt(h.split('').map(c => c + c).join(''), 16)
  }
  if (h.length >= 6) return Number.parseInt(h.slice(0, 6), 16)
  return 0x888888
}

export class MapPixiOverlay {
  readonly canvas: HTMLCanvasElement
  private app: Application | null = null
  private root = new Container()
  private pathsLayer = new Container()
  private bubblesLayer = new Container()
  private highlightG = new Graphics()
  private bubbleNodes = new Map<string, Container>()
  private pathNodes = new Map<string, Graphics>()
  private bubbles: OverlayBubble[] = []
  private paths: OverlayPathSeg[] = []
  private highlight: OverlayHighlight = null
  private highlightedPersonId: string | null = null
  private map: MapLike | null = null
  private destroyed = false
  private dashStep = 0
  private dashRaf = 0
  private textureCache = new Map<string, Texture>()

  onBubbleClick: ((bubble: OverlayBubble) => void) | null = null
  onBubbleHover: ((bubble: OverlayBubble | null) => void) | null = null
  onPathHover: ((personId: string | null) => void) | null = null
  onPathClick: ((personId: string) => void) | null = null
  onEmptyClick: (() => void) | null = null

  constructor(host: HTMLElement) {
    this.canvas = document.createElement('canvas')
    // Let MapLibre receive pan/zoom/wheel; interactions go through map events.
    this.canvas.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;z-index:2;pointer-events:none;'
    host.appendChild(this.canvas)
    this.root.addChild(this.pathsLayer, this.highlightG, this.bubblesLayer)
    this.highlightG.eventMode = 'none'
    void this.initApp()
  }

  private async initApp() {
    const app = new Application()
    await app.init({
      canvas: this.canvas,
      backgroundAlpha: 0,
      antialias: true,
      autoDensity: true,
      preference: 'webgl',
      resizeTo: this.canvas.parentElement ?? undefined,
      resolution: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
    })
    if (this.destroyed) {
      app.destroy(true)
      return
    }
    this.app = app
    app.stage.addChild(this.root)
    app.stage.eventMode = 'none'
    this.startDashTick()
    this.sync()
  }

  destroy() {
    this.destroyed = true
    if (this.dashRaf) cancelAnimationFrame(this.dashRaf)
    this.detachMapEvents()
    this.app?.destroy(true, { children: true })
    this.app = null
    this.canvas.remove()
    this.textureCache.clear()
  }

  attachMap(map: MapLike) {
    if (this.map === map) {
      this.sync()
      return
    }
    this.detachMapEvents()
    this.map = map
    map.on('mousemove', this.onMapMouseMove)
    map.on('click', this.onMapClick)
    map.on('mouseout', this.onMapMouseOut)
    this.sync()
  }

  private detachMapEvents() {
    if (!this.map) return
    this.map.off('mousemove', this.onMapMouseMove)
    this.map.off('click', this.onMapClick)
    this.map.off('mouseout', this.onMapMouseOut)
    this.map.getCanvas().style.cursor = ''
  }

  setBubbles(bubbles: OverlayBubble[]) {
    this.bubbles = bubbles
    this.rebuildBubbles()
    this.sync()
  }

  setPaths(paths: OverlayPathSeg[]) {
    this.paths = paths
    this.rebuildPaths()
    this.sync()
  }

  /** Emphasize one person without rebuilding / dimming the rest of the scene. */
  setHighlightedPersonId(personId: string | null) {
    if (this.highlightedPersonId === personId) return
    const prev = this.highlightedPersonId
    this.highlightedPersonId = personId
    for (const b of this.bubbles) {
      if (!this.bubbleMatchesPerson(b, prev) && !this.bubbleMatchesPerson(b, personId)) continue
      const node = this.bubbleNodes.get(b.id)
      if (node) this.paintBubble(node, b)
    }
  }

  setHighlight(highlight: OverlayHighlight) {
    this.highlight = highlight
    this.drawHighlight()
  }

  private bubbleMatchesPerson(b: OverlayBubble, personId: string | null): boolean {
    if (personId == null) return false
    if (b.memberPersonIds?.includes(personId)) return true
    return b.personId === personId
  }

  sync() {
    if (!this.map || !this.app) return
    this.placeBubbles()
    for (const seg of this.paths) {
      const g = this.pathNodes.get(seg.id)
      if (!g) continue
      this.strokeProjected(g, seg.coordinates, seg.accent, seg.opacity, 3.25)
      g.visible = seg.opacity > 0.05
    }
    this.drawHighlight()
  }

  private placeBubbles() {
    if (!this.map) return
    const now = performance.now()
    for (const b of this.bubbles) {
      const node = this.bubbleNodes.get(b.id)
      if (!node) continue
      const p = this.map.project([b.lng, b.lat])
      let hopY = 0
      if (b.hop) {
        let salt = 0
        for (let c = 0; c < b.personId.length; c++) salt = (salt * 31 + b.personId.charCodeAt(c)) | 0
        const phase = (now / 1000) * 2.4 * Math.PI + (salt % 1000) * 0.01
        hopY = -Math.abs(Math.sin(phase)) * Math.min(4, b.diameter * 0.18)
      }
      node.position.set(p.x, p.y + hopY)
      node.visible = b.opacity >= 0.05
      node.alpha = Math.max(0, Math.min(1, b.opacity))
      const pulseRing = node.children.find(c => c.label === 'pulseRing') as Graphics | undefined
      if (pulseRing) {
        const pulse = 1 + 0.08 * (0.5 + 0.5 * Math.sin(now / 220 + b.personId.length))
        pulseRing.scale.set(pulse)
        pulseRing.alpha = 0.55 + 0.35 * (0.5 + 0.5 * Math.sin(now / 220))
      }
    }
  }

  private rebuildBubbles() {
    const keep = new Set(this.bubbles.map(b => b.id))
    for (const [id, node] of this.bubbleNodes) {
      if (keep.has(id)) continue
      node.destroy({ children: true })
      this.bubbleNodes.delete(id)
    }
    for (const b of this.bubbles) {
      let node = this.bubbleNodes.get(b.id)
      if (!node) {
        node = new Container()
        node.eventMode = 'static'
        node.cursor = 'pointer'
        this.bubblesLayer.addChild(node)
        this.bubbleNodes.set(b.id, node)
      }
      this.paintBubble(node, b)
    }
  }

  private paintBubble(node: Container, b: OverlayBubble) {
    node.removeChildren()
    const highlighted = this.bubbleMatchesPerson(b, this.highlightedPersonId)
    const r = b.diameter / 2
    const g = new Graphics()
    g.circle(0, 0, r)
    g.fill({ color: parseColor(b.accent) })
    g.stroke({ width: highlighted ? 0 : 2, color: parseColor(b.border) })
    node.addChild(g)

    if (b.kind === 'portrait' && b.thumbnail) {
      const url = b.thumbnail
      const apply = (tex: Texture) => {
        if (this.destroyed || !this.bubbleNodes.has(b.id)) return
        const sprite = new Sprite(tex)
        sprite.width = b.diameter
        sprite.height = b.diameter
        sprite.anchor.set(0.5)
        const mask = new Graphics().circle(0, 0, r).fill(0xffffff)
        sprite.mask = mask
        node.addChild(mask, sprite)
      }
      const cached = this.textureCache.get(url)
      if (cached) apply(cached)
      else {
        void Assets.load(url)
          .then((tex: Texture) => {
            this.textureCache.set(url, tex)
            apply(tex)
          })
          .catch(() => {
            const label = new Text({
              text: (b.label || '?').slice(0, 1),
              style: { fill: 0xffffff, fontSize: Math.max(10, r * 0.9), fontWeight: '700' },
            })
            label.anchor.set(0.5)
            node.addChild(label)
          })
      }
    } else if (b.kind === 'hub' && b.count != null) {
      const label = new Text({
        text: String(b.count),
        style: {
          fill: 0xffffff,
          fontSize: Math.max(10, Math.min(16, r * 0.85)),
          fontWeight: '700',
        },
      })
      label.anchor.set(0.5)
      node.addChild(label)
    }

    if (highlighted) {
      const ring = new Graphics()
      ring.circle(0, 0, r + 2)
      ring.stroke({ width: 2.5, color: parseColor(b.accent), pixelLine: false })
      node.addChild(ring)
      this.bubblesLayer.addChild(node)
    }

    if (b.pulse) {
      const pulseRing = new Graphics()
      pulseRing.label = 'pulseRing'
      pulseRing.circle(0, 0, r + 3)
      pulseRing.stroke({ width: 2, color: parseColor(b.accent), alpha: 0.7 })
      node.addChild(pulseRing)
    }

    node.hitArea = new Circle(0, 0, r + 2)
  }

  private rebuildPaths() {
    const keep = new Set(this.paths.map(p => p.id))
    for (const [id, g] of this.pathNodes) {
      if (keep.has(id)) continue
      g.destroy()
      this.pathNodes.delete(id)
    }
    for (const seg of this.paths) {
      let g = this.pathNodes.get(seg.id)
      if (!g) {
        g = new Graphics()
        g.eventMode = 'none'
        this.pathsLayer.addChild(g)
        this.pathNodes.set(seg.id, g)
      }
    }
  }

  private strokeProjected(
    g: Graphics,
    coordinates: [number, number][],
    accent: string,
    opacity: number,
    width: number,
    dashed = false,
  ) {
    g.clear()
    if (!this.map || coordinates.length < 2 || opacity <= 0) return
    const pts = coordinates.map(c => this.map!.project(c))
    const color = parseColor(accent)
    if (!dashed) {
      g.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y)
      g.stroke({ width, color, alpha: opacity, cap: 'round', join: 'round' })
      return
    }
    // Animate dash offset (MapLibre LINE_DASH_SEQUENCE equivalent).
    const phase = DASH_PHASES[this.dashStep % DASH_PHASES.length]
    const dash = 6
    const gap = 4
    const offset = phase[0] ?? 0
    strokeDashedPolyline(g, pts, dash, gap, offset)
    g.stroke({ width, color, alpha: opacity, cap: 'butt', join: 'round' })
  }

  private drawHighlight() {
    this.highlightG.clear()
    if (!this.highlight || !this.map || this.highlight.coordinates.length < 2) return
    this.strokeProjected(
      this.highlightG,
      this.highlight.coordinates,
      this.highlight.accent,
      this.highlight.opacity,
      4,
      true,
    )
  }

  private startDashTick() {
    const tick = (ts: number) => {
      if (this.destroyed) return
      const next = Math.floor(ts / 50) % DASH_PHASES.length
      if (next !== this.dashStep && this.highlight) {
        this.dashStep = next
        this.drawHighlight()
      }
      // Hop / border pulse need continuous screen updates even when the map is still.
      if (this.bubbles.some(b => b.hop || b.pulse)) this.placeBubbles()
      this.dashRaf = requestAnimationFrame(tick)
    }
    this.dashRaf = requestAnimationFrame(tick)
  }

  hitTest(x: number, y: number): OverlayHit {
    // Bubbles first (top of stack)
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i]
      if (b.opacity < 0.05) continue
      const node = this.bubbleNodes.get(b.id)
      if (!node || !node.visible) continue
      const dx = x - node.x
      const dy = y - node.y
      const r = b.diameter / 2 + 2
      if (dx * dx + dy * dy <= r * r) return { type: 'bubble', bubble: b }
    }
    // Paths: proximity to projected polyline
    let best: { personId: string; dist: number } | null = null
    for (const seg of this.paths) {
      if (seg.opacity <= 0.05 || !this.map || seg.coordinates.length < 2) continue
      const pts = seg.coordinates.map(c => this.map!.project(c))
      for (let i = 0; i < pts.length - 1; i++) {
        const d = distToSegment(x, y, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y)
        if (d <= 7 && (!best || d < best.dist)) best = { personId: seg.personId, dist: d }
      }
    }
    if (best) return { type: 'path', personId: best.personId }
    return null
  }

  private onMapMouseMove = (event: MapMouseEvent) => {
    const hit = this.hitTest(event.point.x, event.point.y)
    const canvas = this.map?.getCanvas()
    if (!hit) {
      this.onBubbleHover?.(null)
      this.onPathHover?.(null)
      if (canvas) canvas.style.cursor = ''
      return
    }
    if (canvas) canvas.style.cursor = 'pointer'
    if (hit.type === 'bubble') {
      this.onPathHover?.(null)
      this.onBubbleHover?.(hit.bubble)
    } else {
      this.onBubbleHover?.(null)
      this.onPathHover?.(hit.personId)
    }
  }

  private onMapClick = (event: MapMouseEvent) => {
    const hit = this.hitTest(event.point.x, event.point.y)
    if (!hit) {
      this.onEmptyClick?.()
      return
    }
    event.originalEvent.stopPropagation()
    if (hit.type === 'bubble') this.onBubbleClick?.(hit.bubble)
    else this.onPathClick?.(hit.personId)
  }

  private onMapMouseOut = () => {
    this.onBubbleHover?.(null)
    this.onPathHover?.(null)
    const canvas = this.map?.getCanvas()
    if (canvas) canvas.style.cursor = ''
  }
}

function distToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax
  const dy = by - ay
  const len2 = dx * dx + dy * dy
  if (len2 < 1e-9) return Math.hypot(px - ax, py - ay)
  let t = ((px - ax) * dx + (py - ay) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

function strokeDashedPolyline(
  g: Graphics,
  pts: { x: number; y: number }[],
  dash: number,
  gap: number,
  offset: number,
) {
  if (pts.length < 2) return
  const pattern = dash + gap
  let drawing = true
  let remain = ((offset % pattern) + pattern) % pattern
  if (remain > dash) {
    drawing = false
    remain -= dash
  } else {
    remain = dash - remain
  }
  let x = pts[0].x
  let y = pts[0].y
  if (drawing) g.moveTo(x, y)
  for (let i = 1; i < pts.length; i++) {
    let x2 = pts[i].x
    let y2 = pts[i].y
    let segLen = Math.hypot(x2 - x, y2 - y)
    while (segLen > 1e-6) {
      const take = Math.min(remain, segLen)
      const t = take / segLen
      const nx = x + (x2 - x) * t
      const ny = y + (y2 - y) * t
      if (drawing) g.lineTo(nx, ny)
      else g.moveTo(nx, ny)
      x = nx
      y = ny
      segLen -= take
      remain -= take
      if (remain <= 1e-6) {
        drawing = !drawing
        remain = drawing ? dash : gap
      }
    }
  }
}
