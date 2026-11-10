import Coordinates from '../geometry/Coordinates'

/** Parse `lat;lng` or JSON `{latitude,longitude}` into Coordinates(lat, lng). */
export function parseCoordinates(raw: unknown): Coordinates | null {
  if (raw == null) return null

  if (typeof raw === 'object') {
    const obj = raw as { latitude?: unknown; longitude?: unknown; lat?: unknown; lng?: unknown }
    const lat = Number(obj.latitude ?? obj.lat)
    const lng = Number(obj.longitude ?? obj.lng)
    if (Number.isFinite(lat) && Number.isFinite(lng)) return new Coordinates(lat, lng)
    return null
  }

  const text = String(raw).trim()
  if (!text) return null

  if (text.startsWith('{')) {
    try {
      return parseCoordinates(JSON.parse(text))
    } catch {
      return null
    }
  }

  if (text.includes(';')) {
    const [a, b] = text.split(';')
    const lat = Number(a)
    const lng = Number(b)
    if (Number.isFinite(lat) && Number.isFinite(lng)) return new Coordinates(lat, lng)
    return null
  }

  return null
}
