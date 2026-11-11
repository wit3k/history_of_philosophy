function parseHexRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9a-f]{6}|[0-9a-f]{8}|[0-9a-f]{3})$/i.exec(hex.trim())
  if (!m) return null
  let h = m[1]
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  return {
    r: Number.parseInt(h.slice(0, 2), 16),
    g: Number.parseInt(h.slice(2, 4), 16),
    b: Number.parseInt(h.slice(4, 6), 16),
  }
}

function relativeLuminance(hex: string): number | null {
  const rgb = parseHexRgb(hex)
  if (!rgb) return null
  return 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b
}

/** Near-black accents (e.g. German #000) vanish on the dark basemap. */
export function isNearBlackHex(hex: string): boolean {
  const lum = relativeLuminance(hex)
  return lum != null && lum < 40
}

/** Light accents need dark label text (e.g. white cluster count). */
export function isLightHex(hex: string): boolean {
  const lum = relativeLuminance(hex)
  return lum != null && lum >= 170
}

export function mapAccentForBasemap(accent: string, darkMode: boolean): string {
  if (darkMode && isNearBlackHex(accent)) return '#ffffff'
  return accent.length >= 7 ? accent.slice(0, 7) : accent
}

/** Deterministic ±1 from a string id. */
export function signedUnitFromId(id: string): 1 | -1 {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return h % 2 === 0 ? 1 : -1
}

/** Quadratic bezier samples between two lon/lat points with a sideways bulge. */
export function curvedSegmentCoords(
  aLng: number,
  aLat: number,
  bLng: number,
  bLat: number,
  seedId: string,
  samples = 14,
): [number, number][] {
  const dLng = bLng - aLng
  const dLat = bLat - aLat
  const len = Math.hypot(dLng, dLat)
  if (len < 1e-9) return [[aLng, aLat], [bLng, bLat]]
  const pLng = -dLat / len
  const pLat = dLng / len
  const bulge = signedUnitFromId(seedId) * Math.min(0.4, Math.max(0.04, len * 0.28))
  const cLng = (aLng + bLng) / 2 + pLng * bulge
  const cLat = (aLat + bLat) / 2 + pLat * bulge
  const n = Math.max(4, samples)
  const out: [number, number][] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const u = 1 - t
    out.push([
      u * u * aLng + 2 * u * t * cLng + t * t * bLng,
      u * u * aLat + 2 * u * t * cLat + t * t * bLat,
    ])
  }
  return out
}

/**
 * Concentric ring offsets in screen pixels around a hub.
 * Edge gap between bubbles = half bubble diameter; ring radii grow so rings do not collide.
 */
export function clusterRingPixelOffsets(
  count: number,
  bubbleDiameterPx: number,
  hubDiameterPx: number,
): { x: number; y: number }[] {
  if (count <= 0) return []
  const d = Math.max(bubbleDiameterPx, 1)
  const spacing = d * 1.5
  const hubClear = hubDiameterPx / 2 + d
  const out: { x: number; y: number }[] = []
  let placed = 0
  let ring = 0
  while (placed < count) {
    ring += 1
    const rMin = hubClear + (ring - 1) * spacing
    const capacity = Math.max(1, Math.floor((2 * Math.PI * rMin) / spacing))
    const n = Math.min(count - placed, capacity)
    const r = Math.max(rMin, (n * spacing) / (2 * Math.PI))
    for (let i = 0; i < n; i++) {
      const angle = -Math.PI / 2 + (i / n) * Math.PI * 2
      out.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r })
    }
    placed += n
  }
  return out
}

/** Min center distance for equal diameters = 1.5 * D → exclusive radius = 0.75 * D. */
export function bubbleExclusiveRadiusPx(diameterPx: number): number {
  return Math.max(diameterPx, 1) * 0.75
}

/** Visual radius — disks touch when centers are this far apart (sum of both). */
export function bubbleTouchRadiusPx(diameterPx: number): number {
  return Math.max(diameterPx, 1) * 0.5
}

/**
 * Soft spiderfy budget ≈ half the viewport diagonal — enough to fill empty map
 * around a zoomed city. Neighbor collision is the hard collapse gate; this only
 * hubs absurdly large rings that would dominate the whole view (typical when
 * zoomed far out over many overlapping places).
 * Unreliable / tiny viewport sizes → Infinity (do not hub for “lack of space”).
 */
export const VIEWPORT_SPIDERFY_DIAGONAL_FRACTION = 0.5

/** @deprecated Soft floor only; not used as the primary collapse gate. */
export const MAX_SPIDERFY_RADIUS_PX = 64

export function maxSpiderRadiusForViewport(width: number, height: number): number {
  const w = Math.max(width, 0)
  const h = Math.max(height, 0)
  if (w < 32 || h < 32) return Number.POSITIVE_INFINITY
  return Math.hypot(w, h) * VIEWPORT_SPIDERFY_DIAGONAL_FRACTION
}

export type ScreenBubble = {
  id: string
  x: number
  y: number
  diameterPx: number
  /**
   * When false (map portraits / people), never join a count hub — only pairwise
   * push-apart so disks may touch but not overlap.
   */
  groupable?: boolean
}

export type ScreenLayoutNode =
  | {
      kind: 'individual'
      id: string
      x: number
      y: number
      diameterPx: number
      memberIds: [string]
    }
  | {
      kind: 'hub'
      key: string
      x: number
      y: number
      diameterPx: number
      memberIds: string[]
    }

function disksCollide(
  ax: number,
  ay: number,
  aDiam: number,
  bx: number,
  by: number,
  bDiam: number,
): boolean {
  const minDist = bubbleExclusiveRadiusPx(aDiam) + bubbleExclusiveRadiusPx(bDiam)
  // Tolerance so exact 1.5×diameter ring spacing does not self-collide via float error.
  const pad = Math.max(0, minDist - 0.05)
  const dx = ax - bx
  const dy = ay - by
  return dx * dx + dy * dy < pad * pad
}

function hubKeyForIds(ids: string[]): string {
  return [...ids].sort().join('|')
}

/** Union-find connected components for colliding screen disks. */
export function collideComponents(points: ScreenBubble[]): string[][] {
  const n = points.length
  if (n === 0) return []
  const parent = Array.from({ length: n }, (_, i) => i)
  const find = (i: number): number => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]]
      i = parent[i]
    }
    return i
  }
  const unite = (a: number, b: number) => {
    const ra = find(a)
    const rb = find(b)
    if (ra !== rb) parent[rb] = ra
  }

  const cell = Math.max(
    8,
    Math.max(...points.map(p => bubbleExclusiveRadiusPx(p.diameterPx) * 2)),
  )
  const grid = new Map<string, number[]>()
  for (let i = 0; i < n; i++) {
    const gx = Math.floor(points[i].x / cell)
    const gy = Math.floor(points[i].y / cell)
    const key = `${gx},${gy}`
    const list = grid.get(key)
    if (list) list.push(i)
    else grid.set(key, [i])
  }

  for (let i = 0; i < n; i++) {
    const p = points[i]
    const gx = Math.floor(p.x / cell)
    const gy = Math.floor(p.y / cell)
    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        const bucket = grid.get(`${gx + ox},${gy + oy}`)
        if (!bucket) continue
        for (const j of bucket) {
          if (j <= i) continue
          const q = points[j]
          if (disksCollide(p.x, p.y, p.diameterPx, q.x, q.y, q.diameterPx)) unite(i, j)
        }
      }
    }
  }

  const groups = new Map<number, string[]>()
  for (let i = 0; i < n; i++) {
    const r = find(i)
    const list = groups.get(r)
    if (list) list.push(points[i].id)
    else groups.set(r, [points[i].id])
  }
  return [...groups.values()]
}

function centroidOf(members: ScreenBubble[]): { x: number; y: number } {
  const n = members.length || 1
  return {
    x: members.reduce((s, m) => s + m.x, 0) / n,
    y: members.reduce((s, m) => s + m.y, 0) / n,
  }
}

function placeComponent(
  memberIds: string[],
  byId: Map<string, ScreenBubble>,
  /** Inner clearance for the spiderfy ring (people footprint / hub size). */
  ringClearancePx: number,
  force: ReadonlySet<string>,
  /** Only used when force-collapse is requested; auto layout always spiderfies. */
  preferHub: boolean,
): { nodes: ScreenLayoutNode[]; placed: ScreenBubble[] } {
  if (memberIds.length === 1) {
    const p = byId.get(memberIds[0])!
    const node: ScreenLayoutNode = {
      kind: 'individual',
      id: p.id,
      x: p.x,
      y: p.y,
      diameterPx: p.diameterPx,
      memberIds: [p.id],
    }
    return {
      nodes: [node],
      placed: [{ id: p.id, x: p.x, y: p.y, diameterPx: p.diameterPx }],
    }
  }

  // Stable order → stable ring slots when membership changes by one.
  const members = memberIds
    .map(id => byId.get(id)!)
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  const { x: cx, y: cy } = centroidOf(members)
  const bubbleDiam = Math.max(...members.map(m => m.diameterPx))
  const key = hubKeyForIds(memberIds)
  // Auto layout always spiderfies when there is room in product terms; count hubs
  // only if explicitly collapsed (preferHub && !force). Empty map → spread events.
  const expand = force.has(key) || !preferHub

  if (expand) {
    const offsets = clusterRingPixelOffsets(members.length, bubbleDiam, ringClearancePx)
    const nodes: ScreenLayoutNode[] = []
    const placed: ScreenBubble[] = []
    members.forEach((m, i) => {
      const o = offsets[i] ?? { x: 0, y: 0 }
      const x = cx + o.x
      const y = cy + o.y
      nodes.push({
        kind: 'individual',
        id: m.id,
        x,
        y,
        diameterPx: m.diameterPx,
        memberIds: [m.id],
      })
      placed.push({ id: m.id, x, y, diameterPx: m.diameterPx })
    })
    return { nodes, placed }
  }

  const node: ScreenLayoutNode = {
    kind: 'hub',
    key,
    x: cx,
    y: cy,
    diameterPx: Math.max(ringClearancePx, bubbleDiam),
    memberIds: [...memberIds],
  }
  return {
    nodes: [node],
    placed: [{ id: `hub:${key}`, x: cx, y: cy, diameterPx: node.diameterPx }],
  }
}

function remapPlacedToOriginalIds(
  placedGroups: string[][],
  placedIdToMembers: Map<string, string[]>,
): string[][] {
  return placedGroups.map(group => {
    const ids = new Set<string>()
    for (const pid of group) {
      for (const oid of placedIdToMembers.get(pid) ?? [pid]) ids.add(oid)
    }
    return [...ids]
  })
}

function componentsEqual(a: string[][], b: string[][]): boolean {
  if (a.length !== b.length) return false
  const norm = (cs: string[][]) =>
    cs.map(c => [...c].sort().join(',')).sort().join(';')
  return norm(a) === norm(b)
}

/**
 * Iteratively push disks apart so they may touch but never overlap
 * (min center distance = sum of visual radii). `movable` ids are updated;
 * others act as fixed obstacles. Uses a grid so cost stays near O(n) per pass.
 */
export function separateTouchingDisks(
  disks: ScreenBubble[],
  movableIds: ReadonlySet<string>,
  iterations = 12,
): ScreenBubble[] {
  if (disks.length === 0 || movableIds.size === 0) return disks.map(d => ({ ...d }))
  const out = disks.map(d => ({ ...d }))
  const index = new Map(out.map((d, i) => [d.id, i]))
  const movable = [...movableIds].map(id => index.get(id)).filter((i): i is number => i != null)
  if (movable.length === 0) return out

  const cell = Math.max(
    8,
    Math.max(...out.map(d => bubbleTouchRadiusPx(d.diameterPx) * 2)),
  )

  for (let iter = 0; iter < iterations; iter++) {
    let moved = false
    const grid = new Map<string, number[]>()
    for (let i = 0; i < out.length; i++) {
      const gx = Math.floor(out[i].x / cell)
      const gy = Math.floor(out[i].y / cell)
      const key = `${gx},${gy}`
      const bucket = grid.get(key)
      if (bucket) bucket.push(i)
      else grid.set(key, [i])
    }

    for (const i of movable) {
      const pi = out[i]
      const ri = bubbleTouchRadiusPx(pi.diameterPx)
      const gx = Math.floor(pi.x / cell)
      const gy = Math.floor(pi.y / cell)
      for (let ox = -1; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) {
          const bucket = grid.get(`${gx + ox},${gy + oy}`)
          if (!bucket) continue
          for (const b of bucket) {
            if (b === i) continue
            // Only resolve each unordered pair once when both are movable.
            if (movableIds.has(out[b].id) && b < i) continue
            const pj = out[b]
            const minDist = ri + bubbleTouchRadiusPx(pj.diameterPx)
            let dx = pi.x - pj.x
            let dy = pi.y - pj.y
            let dist = Math.hypot(dx, dy)
            if (dist >= minDist - 0.05) continue

            if (dist < 1e-6) {
              const angle = (hashStr(pi.id) % 360) * (Math.PI / 180)
              dx = Math.cos(angle)
              dy = Math.sin(angle)
              dist = 1
            }

            const ux = dx / dist
            const uy = dy / dist
            const gap = Math.min(minDist - dist, minDist)
            if (movableIds.has(pj.id)) {
              const hx = ux * gap * 0.5
              const hy = uy * gap * 0.5
              pi.x += hx
              pi.y += hy
              pj.x -= hx
              pj.y -= hy
            } else {
              pi.x += ux * gap
              pi.y += uy * gap
            }
            moved = true
          }
        }
      }
    }
    if (!moved) break
  }
  return out
}

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function clampToOrigin(
  placed: ScreenBubble,
  origin: ScreenBubble,
  maxOffsetPx: number,
): ScreenBubble {
  const dx = placed.x - origin.x
  const dy = placed.y - origin.y
  const dist = Math.hypot(dx, dy)
  if (dist <= maxOffsetPx || dist < 1e-6) return placed
  const s = maxOffsetPx / dist
  return { ...placed, x: origin.x + dx * s, y: origin.y + dy * s }
}

function layoutGroupableBubbles(
  points: ScreenBubble[],
  opts: {
    ringClearancePx: number
    forceExpandKeys?: ReadonlySet<string>
  },
): ScreenLayoutNode[] {
  if (points.length === 0) return []
  const byId = new Map(points.map(p => [p.id, p]))
  const force = opts.forceExpandKeys ?? new Set<string>()
  const clearance = opts.ringClearancePx

  // Merge overlapping event piles, then always spiderfy each pile (no auto count hubs).
  // If spiderfy rings from different piles collide, merge piles and spiderfy again.
  let components = collideComponents(points)

  for (let round = 0; round < 6; round++) {
    const output: ScreenLayoutNode[] = []
    const placed: ScreenBubble[] = []
    const placedIdToMembers = new Map<string, string[]>()

    for (const memberIds of components) {
      const { nodes, placed: next } = placeComponent(
        memberIds,
        byId,
        clearance,
        force,
        false, // never auto-hub — empty map space wins
      )
      for (const node of nodes) {
        output.push(node)
        if (node.kind === 'individual') placedIdToMembers.set(node.id, [...node.memberIds])
        else placedIdToMembers.set(`hub:${node.key}`, [...node.memberIds])
      }
      placed.push(...next)
    }

    const again = collideComponents(placed)
    if (!again.some(g => g.length > 1)) return output

    const merged = remapPlacedToOriginalIds(again, placedIdToMembers)
    if (componentsEqual(merged, components)) return output
    components = merged
  }

  return components.flatMap(memberIds => {
    const { nodes } = placeComponent(memberIds, byId, clearance, force, false)
    return nodes
  })
}

/**
 * Screen-space layout:
 * - People (`groupable: false`): never hubbed; stay near true projection; only a
 *   short push-apart so portraits may touch but not overlap (not flung across map).
 * - Events/pubs: spiderfy coincident / colliding piles; no auto count hub while
 *   packing can spread individuals (click-forced collapse still possible via keys).
 */
export function layoutScreenBubbles(
  points: ScreenBubble[],
  opts: {
    hubDiameterPx: number
    /** @deprecated Soft radius hubbing removed. */
    maxSpiderRadiusPx?: number
    viewport?: { width: number; height: number }
    forceExpandKeys?: ReadonlySet<string>
  },
): ScreenLayoutNode[] {
  if (points.length === 0) return []
  void opts.maxSpiderRadiusPx
  void opts.viewport

  const people = points.filter(p => p.groupable === false)
  const groupable = points.filter(p => p.groupable !== false)

  // People first, anchored near geographic projection.
  const personIds = new Set(people.map(p => p.id))
  const origins = new Map(people.map(p => [p.id, { ...p }]))
  let personDisks = separateTouchingDisks(
    people.map(p => ({ ...p })),
    personIds,
  )
  const maxPersonDrift = Math.max(
    28,
    ...people.map(p => bubbleTouchRadiusPx(p.diameterPx) * 2.5),
  )
  personDisks = personDisks.map(p => {
    const origin = origins.get(p.id) ?? p
    return clampToOrigin(p, origin, maxPersonDrift)
  })

  // Local hole for spiderfy under a portrait (not a global people bounding circle —
  // that blew rings up and cost when people are scattered across the map).
  const maxPersonD = personDisks.reduce((m, p) => Math.max(m, p.diameterPx), 0)
  const peopleFootprint = Math.max(opts.hubDiameterPx, maxPersonD * 1.25)

  const eventNodes = layoutGroupableBubbles(groupable, {
    ringClearancePx: peopleFootprint,
    forceExpandKeys: opts.forceExpandKeys,
  })

  // People stay put after local separation; ring clearance already keeps event
  // spiderfy outside the portrait footprint (no O(events×people) resolve pass).
  const personNodes: ScreenLayoutNode[] = personDisks.map(p => ({
    kind: 'individual' as const,
    id: p.id,
    x: p.x,
    y: p.y,
    diameterPx: p.diameterPx,
    memberIds: [p.id] as [string],
  }))
  return [...eventNodes, ...personNodes]
}
