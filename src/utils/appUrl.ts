export type AppView = 'timeline' | 'map'

export type LayerFlags = {
  authors: boolean
  lifelines: boolean
  sympathies: boolean
  pubs: boolean
  refs: boolean
  events: boolean
  personal: boolean
}

/** Bit order for packed layer masks (stable encode/decode contract). */
export const LAYER_BIT_ORDER = [
  'authors',
  'lifelines',
  'sympathies',
  'pubs',
  'refs',
  'events',
  'personal',
] as const satisfies ReadonlyArray<keyof LayerFlags>

export type AppUrlState = {
  view: AppView
  collection?: string
  /** @deprecated Prefer layersTimeline / layersMap; kept as active-view alias when reading. */
  layers: LayerFlags
  layersTimeline: LayerFlags
  layersMap: LayerFlags
  /** undefined = not set in URL → use prefers-color-scheme on first load */
  dark?: boolean
  start?: number
  end?: number
  row?: number
  lat?: number
  lng?: number
  zoom?: number
  year?: number
  yearFrom?: number
  yearTo?: number
}

export const DEFAULT_LAYERS_TIMELINE: LayerFlags = {
  authors: true,
  lifelines: true,
  sympathies: true,
  pubs: true,
  refs: true,
  events: true,
  personal: true,
}

export const DEFAULT_LAYERS_MAP: LayerFlags = {
  authors: true,
  lifelines: false,
  sympathies: false,
  pubs: false,
  refs: false,
  events: false,
  personal: false,
}

/** @deprecated Use DEFAULT_LAYERS_TIMELINE */
export const DEFAULT_LAYERS = DEFAULT_LAYERS_TIMELINE

const LAYER_KEYS = [
  ['authors', 'authors'],
  ['lifelines', 'lifelines'],
  ['sympathies', 'sympathies'],
  ['pubs', 'pubs'],
  ['refs', 'refs'],
  ['events', 'events'],
  ['personal', 'personal'],
] as const satisfies ReadonlyArray<readonly [keyof LayerFlags, string]>

export function layersToMask(layers: LayerFlags): number {
  let mask = 0
  for (let i = 0; i < LAYER_BIT_ORDER.length; i++) {
    if (layers[LAYER_BIT_ORDER[i]]) mask |= 1 << i
  }
  return mask
}

export function maskToLayers(mask: number, fallback: LayerFlags): LayerFlags {
  if (!Number.isFinite(mask)) return { ...fallback }
  const out = { ...fallback }
  for (let i = 0; i < LAYER_BIT_ORDER.length; i++) {
    out[LAYER_BIT_ORDER[i]] = (mask & (1 << i)) !== 0
  }
  return out
}

export type PackedViewState = {
  layersTimeline: LayerFlags
  layersMap: LayerFlags
  start?: number
  end?: number
  row?: number
  lat?: number
  lng?: number
  zoom?: number
  year?: number
  yearFrom?: number
  yearTo?: number
}

function slotNumber(raw: string | undefined): number | undefined {
  if (raw == null || raw === '') return undefined
  const n = Number(raw)
  return Number.isFinite(n) ? n : undefined
}

/**
 * Slot separator for `p`. Must stay URL-unreserved (no `%XX` from URLSearchParams).
 * Legacy comma-separated `p` values are still accepted on read.
 */
export const PACK_SEP = '_'

/** Pack dual-view fields into fixed slots for query param `p`. */
export function packViewParam(state: PackedViewState): string {
  const slots = [
    String(layersToMask(state.layersTimeline)),
    String(layersToMask(state.layersMap)),
    state.start != null && Number.isFinite(state.start) ? String(Math.round(state.start)) : '',
    state.end != null && Number.isFinite(state.end) ? String(Math.round(state.end)) : '',
    state.row != null && Number.isFinite(state.row) ? String(Math.round(state.row)) : '',
    state.lat != null && Number.isFinite(state.lat) ? state.lat.toFixed(5) : '',
    state.lng != null && Number.isFinite(state.lng) ? state.lng.toFixed(5) : '',
    state.zoom != null && Number.isFinite(state.zoom) ? state.zoom.toFixed(2) : '',
    state.year != null && Number.isFinite(state.year) ? String(Math.round(state.year)) : '',
    state.yearFrom != null && Number.isFinite(state.yearFrom) ? String(Math.round(state.yearFrom)) : '',
    state.yearTo != null && Number.isFinite(state.yearTo) ? String(Math.round(state.yearTo)) : '',
  ]
  return slots.join(PACK_SEP)
}

/** Unpack `p`. Missing/invalid mask slots fall back to the given defaults. */
export function unpackViewParam(
  raw: string | null | undefined,
  defaults: { timeline: LayerFlags; map: LayerFlags },
): PackedViewState | null {
  if (raw == null || raw === '') return null
  // Prefer `_` (current); accept legacy comma CSV from earlier builds.
  const parts = raw.includes(PACK_SEP) || !raw.includes(',') ? raw.split(PACK_SEP) : raw.split(',')
  if (parts.length < 2) return null
  const layersTimeline = maskToLayers(Number(parts[0]), defaults.timeline)
  const layersMap = maskToLayers(Number(parts[1]), defaults.map)
  return {
    layersTimeline,
    layersMap,
    start: slotNumber(parts[2]),
    end: slotNumber(parts[3]),
    row: slotNumber(parts[4]),
    lat: slotNumber(parts[5]),
    lng: slotNumber(parts[6]),
    zoom: slotNumber(parts[7]),
    year: slotNumber(parts[8]),
    yearFrom: slotNumber(parts[9]),
    yearTo: slotNumber(parts[10]),
  }
}

/** App base path without trailing slash, e.g. `/history_of_philosophy` or ``. */
export function getAppBasePath(): string {
  const raw = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/'
  if (raw === '/') return ''
  return raw.replace(/\/$/, '')
}

export function viewFromPathname(pathname: string, basePath = getAppBasePath()): AppView {
  const normalized = pathname.replace(/\/+$/, '') || '/'
  const base = basePath.replace(/\/+$/, '')
  const relative =
    base && (normalized === base || normalized.startsWith(`${base}/`))
      ? normalized.slice(base.length) || '/'
      : normalized
  const path = relative.startsWith('/') ? relative : `/${relative}`
  if (path === '/map' || path.startsWith('/map/')) return 'map'
  return 'timeline'
}

function parseBool01(raw: string | null): boolean | undefined {
  if (raw == null || raw === '') return undefined
  if (raw === '1' || raw === 'true') return true
  if (raw === '0' || raw === 'false') return false
  return undefined
}

function parseNumber(raw: string | null): number | undefined {
  if (raw == null || raw === '') return undefined
  const n = Number(raw)
  return Number.isFinite(n) ? n : undefined
}

function readLegacyLayers(params: URLSearchParams): LayerFlags | null {
  let any = false
  const layers: LayerFlags = { ...DEFAULT_LAYERS_TIMELINE }
  for (const [field, key] of LAYER_KEYS) {
    const parsed = parseBool01(params.get(key))
    if (parsed !== undefined) {
      layers[field] = parsed
      any = true
    }
  }
  return any ? layers : null
}

export function readAppUrl(
  loc: Pick<Location, 'pathname' | 'search'> = window.location,
  basePath = getAppBasePath(),
): AppUrlState {
  const params = new URLSearchParams(loc.search.startsWith('?') ? loc.search.slice(1) : loc.search)
  const view = viewFromPathname(loc.pathname, basePath)
  const dark = parseBool01(params.get('dark'))
  const collection = params.get('collection') || undefined

  const packed = unpackViewParam(params.get('p'), {
    timeline: DEFAULT_LAYERS_TIMELINE,
    map: DEFAULT_LAYERS_MAP,
  })

  let layersTimeline: LayerFlags
  let layersMap: LayerFlags
  let start: number | undefined
  let end: number | undefined
  let row: number | undefined
  let lat: number | undefined
  let lng: number | undefined
  let zoom: number | undefined
  let year: number | undefined
  let yearFrom: number | undefined
  let yearTo: number | undefined

  if (packed) {
    layersTimeline = packed.layersTimeline
    layersMap = packed.layersMap
    start = packed.start
    end = packed.end
    row = packed.row
    lat = packed.lat
    lng = packed.lng
    zoom = packed.zoom
    year = packed.year
    yearFrom = packed.yearFrom
    yearTo = packed.yearTo
  } else {
    const legacy = readLegacyLayers(params)
    const shared = legacy ?? DEFAULT_LAYERS_TIMELINE
    // Legacy had one shared mask — clone into both until the user diverges via `p`.
    layersTimeline = { ...shared }
    layersMap = legacy ? { ...shared } : { ...DEFAULT_LAYERS_MAP }
    start = parseNumber(params.get('start'))
    end = parseNumber(params.get('end'))
    row = parseNumber(params.get('row'))
    lat = parseNumber(params.get('lat'))
    lng = parseNumber(params.get('lng'))
    zoom = parseNumber(params.get('zoom'))
    year = parseNumber(params.get('year'))
    yearFrom = parseNumber(params.get('yearFrom'))
    yearTo = parseNumber(params.get('yearTo'))
  }

  const layers = view === 'map' ? layersMap : layersTimeline

  return {
    view,
    collection,
    layers,
    layersTimeline,
    layersMap,
    dark,
    start,
    end,
    row,
    lat,
    lng,
    zoom,
    year,
    yearFrom,
    yearTo,
  }
}

export type WriteAppUrlInput = {
  view: AppView
  collection: string
  dark: boolean
  layersTimeline: LayerFlags
  layersMap: LayerFlags
  /** @deprecated Ignored when layersTimeline/layersMap provided; kept for call-site transition. */
  layers?: LayerFlags
  start?: number
  end?: number
  row?: number
  lat?: number
  lng?: number
  zoom?: number
  year?: number
  yearFrom?: number
  yearTo?: number
}

export function formatAppUrl(state: WriteAppUrlInput, basePath = getAppBasePath()): string {
  const params = new URLSearchParams()
  params.set('collection', state.collection)
  params.set('dark', state.dark ? '1' : '0')
  params.set(
    'p',
    packViewParam({
      layersTimeline: state.layersTimeline,
      layersMap: state.layersMap,
      start: state.start,
      end: state.end,
      row: state.row,
      lat: state.lat,
      lng: state.lng,
      zoom: state.zoom,
      year: state.year,
      yearFrom: state.yearFrom,
      yearTo: state.yearTo,
    }),
  )

  const path = state.view === 'map' ? `${basePath}/map` : `${basePath}/` || '/'
  const qs = params.toString()
  return qs ? `${path}?${qs}` : path
}

export function writeAppUrl(state: WriteAppUrlInput, mode: 'replace' | 'push' = 'replace'): void {
  if (typeof window === 'undefined') return
  const next = formatAppUrl(state)
  const current = `${window.location.pathname}${window.location.search}`
  if (current === next) return
  if (mode === 'push') history.pushState(null, '', next)
  else history.replaceState(null, '', next)
  if (window.location.hash) {
    history.replaceState(null, '', next)
  }
}

export function subscribeAppUrl(onChange: () => void): () => void {
  const handler = () => onChange()
  window.addEventListener('popstate', handler)
  return () => window.removeEventListener('popstate', handler)
}

export function visibleYearRange(viewX: number, zoom: number, width: number): { start: number; end: number } {
  const z = Math.max(zoom, 0.0001)
  return { start: viewX, end: viewX + width / z }
}

/** People-row units at the top edge of the screen (`screenY = y + rowHeight * row`). */
export function topRowFromCameraY(cameraY: number, rowHeight: number): number {
  const h = Math.max(rowHeight, 0.0001)
  return -cameraY / h
}

export function cameraYFromTopRow(row: number, rowHeight: number): number {
  return -row * rowHeight
}
