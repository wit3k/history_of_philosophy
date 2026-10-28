export type ViewHashState = {
  collection: string
  start: number
  end: number
}

export function parseViewHash(hash: string): Partial<ViewHashState> {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  if (!raw) return {}

  const params = new URLSearchParams(raw)
  const collection = params.get('collection') ?? undefined
  const startRaw = params.get('start')
  const endRaw = params.get('end')
  const start = startRaw != null && startRaw !== '' ? Number(startRaw) : undefined
  const end = endRaw != null && endRaw !== '' ? Number(endRaw) : undefined

  const result: Partial<ViewHashState> = {}
  if (collection) result.collection = collection
  if (start != null && !Number.isNaN(start)) result.start = start
  if (end != null && !Number.isNaN(end)) result.end = end
  return result
}

export function formatViewHash(state: ViewHashState): string {
  const params = new URLSearchParams()
  params.set('collection', state.collection)
  params.set('start', String(Math.round(state.start)))
  params.set('end', String(Math.round(state.end)))
  return `#${params.toString()}`
}

export function writeViewHash(state: ViewHashState): void {
  if (typeof window === 'undefined') return
  const next = formatViewHash(state)
  const current = parseViewHash(window.location.hash)
  if (
    current.collection === state.collection &&
    current.start === Math.round(state.start) &&
    current.end === Math.round(state.end)
  ) {
    return
  }
  history.replaceState(null, '', `${window.location.pathname}${window.location.search}${next}`)
}

export function visibleYearRange(viewX: number, zoom: number, width: number): { start: number; end: number } {
  const z = Math.max(zoom, 0.0001)
  return { start: viewX, end: viewX + width / z }
}
