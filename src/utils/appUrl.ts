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

export type AppUrlState = {
  view: AppView
  collection?: string
  layers: LayerFlags
  /** undefined = not set in URL → use prefers-color-scheme on first load */
  dark?: boolean
  start?: number
  end?: number
  row?: number
  lat?: number
  lng?: number
  zoom?: number
}

export const DEFAULT_LAYERS: LayerFlags = {
  authors: true,
  lifelines: true,
  sympathies: true,
  pubs: true,
  refs: true,
  events: true,
  personal: true,
}

const LAYER_KEYS = [
  ['authors', 'authors'],
  ['lifelines', 'lifelines'],
  ['sympathies', 'sympathies'],
  ['pubs', 'pubs'],
  ['refs', 'refs'],
  ['events', 'events'],
  ['personal', 'personal'],
] as const satisfies ReadonlyArray<readonly [keyof LayerFlags, string]>

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

export function readAppUrl(
  loc: Pick<Location, 'pathname' | 'search'> = window.location,
  basePath = getAppBasePath(),
): AppUrlState {
  const params = new URLSearchParams(loc.search.startsWith('?') ? loc.search.slice(1) : loc.search)
  const layers: LayerFlags = { ...DEFAULT_LAYERS }
  for (const [field, key] of LAYER_KEYS) {
    const parsed = parseBool01(params.get(key))
    if (parsed !== undefined) layers[field] = parsed
  }

  const dark = parseBool01(params.get('dark'))
  const collection = params.get('collection') || undefined

  return {
    view: viewFromPathname(loc.pathname, basePath),
    collection,
    layers,
    dark,
    start: parseNumber(params.get('start')),
    end: parseNumber(params.get('end')),
    row: parseNumber(params.get('row')),
    lat: parseNumber(params.get('lat')),
    lng: parseNumber(params.get('lng')),
    zoom: parseNumber(params.get('zoom')),
  }
}

export type WriteAppUrlInput = {
  view: AppView
  collection: string
  layers: LayerFlags
  dark: boolean
  start?: number
  end?: number
  row?: number
  lat?: number
  lng?: number
  zoom?: number
}

export function formatAppUrl(state: WriteAppUrlInput, basePath = getAppBasePath()): string {
  const params = new URLSearchParams()
  params.set('collection', state.collection)

  for (const [field, key] of LAYER_KEYS) {
    params.set(key, state.layers[field] ? '1' : '0')
  }
  params.set('dark', state.dark ? '1' : '0')

  if (state.view === 'timeline') {
    if (state.start != null && Number.isFinite(state.start)) params.set('start', String(Math.round(state.start)))
    if (state.end != null && Number.isFinite(state.end)) params.set('end', String(Math.round(state.end)))
    if (state.row != null && Number.isFinite(state.row)) params.set('row', String(Math.round(state.row)))
  } else {
    if (state.lat != null && Number.isFinite(state.lat)) params.set('lat', state.lat.toFixed(5))
    if (state.lng != null && Number.isFinite(state.lng)) params.set('lng', state.lng.toFixed(5))
    if (state.zoom != null && Number.isFinite(state.zoom)) params.set('zoom', state.zoom.toFixed(2))
  }

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
  // Drop legacy hash so it is not treated as state.
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
