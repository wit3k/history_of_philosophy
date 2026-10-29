export type ViewHashState = {
  collection: string
  start: number
  end: number
  /** Row index at the top edge of the viewport (may be negative). */
  row: number
}

export function parseViewHash(hash: string): Partial<ViewHashState> {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  if (!raw) return {}

  const params = new URLSearchParams(raw)
  const collection = params.get('collection') ?? undefined
  const startRaw = params.get('start')
  const endRaw = params.get('end')
  const rowRaw = params.get('row')
  const start = startRaw != null && startRaw !== '' ? Number(startRaw) : undefined
  const end = endRaw != null && endRaw !== '' ? Number(endRaw) : undefined
  const row = rowRaw != null && rowRaw !== '' ? Number(rowRaw) : undefined

  const result: Partial<ViewHashState> = {}
  if (collection) result.collection = collection
  if (start != null && !Number.isNaN(start)) result.start = start
  if (end != null && !Number.isNaN(end)) result.end = end
  if (row != null && !Number.isNaN(row)) result.row = row
  return result
}

export function formatViewHash(state: ViewHashState): string {
  const params = new URLSearchParams()
  params.set('collection', state.collection)
  params.set('start', String(Math.round(state.start)))
  params.set('end', String(Math.round(state.end)))
  params.set('row', String(Math.round(state.row)))
  return `#${params.toString()}`
}

export function writeViewHash(state: ViewHashState): void {
  if (typeof window === 'undefined') return
  const next = formatViewHash(state)
  const current = parseViewHash(window.location.hash)
  if (
    current.collection === state.collection &&
    current.start === Math.round(state.start) &&
    current.end === Math.round(state.end) &&
    current.row === Math.round(state.row)
  ) {
    return
  }
  history.replaceState(null, '', `${window.location.pathname}${window.location.search}${next}`)
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
