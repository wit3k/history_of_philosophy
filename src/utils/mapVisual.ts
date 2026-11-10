/** Near-black accents (e.g. German #000) vanish on the dark basemap. */
export function isNearBlackHex(hex: string): boolean {
  const m = /^#?([0-9a-f]{6}|[0-9a-f]{8}|[0-9a-f]{3})$/i.exec(hex.trim())
  if (!m) return false
  let h = m[1]
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  const r = Number.parseInt(h.slice(0, 2), 16)
  const g = Number.parseInt(h.slice(2, 4), 16)
  const b = Number.parseInt(h.slice(4, 6), 16)
  // Relative luminance threshold — catches #000 and very dark navy.
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 40
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

/** Spiral offsets in degrees so exploded bubbles do not stack. */
export function spiralOffsetDegrees(index: number, count: number): { dLat: number; dLng: number } {
  if (count <= 1) return { dLat: 0, dLng: 0 }
  const angle = (index / count) * Math.PI * 2 - Math.PI / 2
  const ring = 1 + Math.floor(index / 8)
  const radius = 0.045 * ring
  return {
    dLat: Math.sin(angle) * radius,
    dLng: Math.cos(angle) * radius,
  }
}
