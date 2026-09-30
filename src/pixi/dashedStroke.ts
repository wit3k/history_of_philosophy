import type { Graphics, StrokeStyle } from 'pixi.js'
import { flattenPathData, type Point } from './pathBridge'

const strokeDefaults: Partial<StrokeStyle> = {
  cap: 'butt',
  join: 'miter',
}

function dist(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

/**
 * Draw a dashed polyline. `pattern` alternates dash/gap lengths (CSS stroke-dasharray).
 * `offset` shifts along the path (like stroke-dashoffset; positive moves pattern backward visually as in CSS animation toward 0).
 */
export function strokeDashedPolyline(
  g: Graphics,
  points: Point[],
  pattern: number[],
  offset: number,
  style: StrokeStyle,
) {
  if (points.length < 2 || pattern.length === 0) return

  const patternLen = pattern.reduce((a, b) => a + b, 0)
  if (patternLen <= 0) return

  const patternPos = ((offset % patternLen) + patternLen) % patternLen
  // Find which segment of the pattern we're in
  let patternIndex = 0
  let intoSegment = patternPos
  while (intoSegment >= pattern[patternIndex % pattern.length]) {
    intoSegment -= pattern[patternIndex % pattern.length]
    patternIndex++
  }

  let drawing = patternIndex % 2 === 0
  let remainingInPattern = pattern[patternIndex % pattern.length] - intoSegment

  for (let i = 0; i < points.length - 1; i++) {
    let x0 = points[i].x
    let y0 = points[i].y
    const x1 = points[i + 1].x
    const y1 = points[i + 1].y
    let segLen = dist(points[i], points[i + 1])
    if (segLen < 1e-6) continue
    const dx = (x1 - x0) / segLen
    const dy = (y1 - y0) / segLen

    while (segLen > 1e-6) {
      const step = Math.min(segLen, remainingInPattern)
      const nx = x0 + dx * step
      const ny = y0 + dy * step
      if (drawing) {
        g.moveTo(x0, y0)
        g.lineTo(nx, ny)
      }
      x0 = nx
      y0 = ny
      segLen -= step
      remainingInPattern -= step
      if (remainingInPattern <= 1e-9) {
        patternIndex++
        remainingInPattern = pattern[patternIndex % pattern.length]
        drawing = patternIndex % 2 === 0
      }
    }
  }

  g.stroke({ ...strokeDefaults, ...style })
}

export function strokeDashedPathData(
  g: Graphics,
  pathString: string,
  pattern: number[],
  offset: number,
  style: StrokeStyle,
) {
  strokeDashedPolyline(g, flattenPathData(pathString), pattern, offset, style)
}

export function strokeDashedVerticalLine(
  g: Graphics,
  x: number,
  y0: number,
  y1: number,
  pattern: number[],
  offset: number,
  style: StrokeStyle,
) {
  strokeDashedPolyline(g, [{ x, y: y0 }, { x, y: y1 }], pattern, offset, style)
}

/** 50s linear dashoffset 2000 → 0, matching CSS animation. */
export function dashOffsetFromTime(ms: number, from = 2000, periodMs = 50_000) {
  const t = (ms % periodMs) / periodMs
  return from * (1 - t)
}
