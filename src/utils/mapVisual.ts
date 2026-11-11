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

export function clusterKey(lat: number, lng: number, precision = 3): string {
  return `${lat.toFixed(precision)},${lng.toFixed(precision)}`
}

/**
 * Zoom at which a same-location pile auto-explodes into the ring layout.
 * Bigger piles need a closer look so the rings stay usable.
 */
export function clusterAutoExpandZoom(memberCount: number): number {
  if (memberCount <= 1) return Number.POSITIVE_INFINITY
  if (memberCount <= 8) return 9
  if (memberCount <= 20) return 10.5
  if (memberCount <= 40) return 11.5
  return 12.5
}

export function isClusterAutoExpanded(zoom: number, memberCount: number): boolean {
  return zoom >= clusterAutoExpandZoom(memberCount)
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
