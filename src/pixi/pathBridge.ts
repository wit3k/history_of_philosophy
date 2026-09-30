import { SVGPathData } from 'svg-pathdata'
import type { Graphics } from 'pixi.js'
import type { StrokeStyle } from 'pixi.js'

export type Point = { x: number; y: number }

const strokeDefaults: Partial<StrokeStyle> = {
  cap: 'butt',
  join: 'miter',
}

/** Sample path-data (M/L/C…) into a polyline for dashing / length. */
export function flattenPathData(pathString: string, samplesPerCurve = 20): Point[] {
  const commands = new SVGPathData(pathString).toAbs().commands
  const points: Point[] = []
  let cx = 0
  let cy = 0

  for (const cmd of commands) {
    switch (cmd.type) {
      case SVGPathData.MOVE_TO: {
        cx = cmd.x
        cy = cmd.y
        points.push({ x: cx, y: cy })
        break
      }
      case SVGPathData.LINE_TO: {
        cx = cmd.x
        cy = cmd.y
        points.push({ x: cx, y: cy })
        break
      }
      case SVGPathData.CURVE_TO: {
        const x0 = cx
        const y0 = cy
        for (let i = 1; i <= samplesPerCurve; i++) {
          const t = i / samplesPerCurve
          const p = cubicPoint(x0, y0, cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y, t)
          points.push(p)
        }
        cx = cmd.x
        cy = cmd.y
        break
      }
      case SVGPathData.QUAD_TO: {
        const x0 = cx
        const y0 = cy
        for (let i = 1; i <= samplesPerCurve; i++) {
          const t = i / samplesPerCurve
          const p = quadPoint(x0, y0, cmd.x1, cmd.y1, cmd.x, cmd.y, t)
          points.push(p)
        }
        cx = cmd.x
        cy = cmd.y
        break
      }
      default:
        break
    }
  }
  return points
}

const flattenCache = new Map<string, Point[]>()
const FLATTEN_CACHE_MAX = 400

/** Cached flatten — same path string reuses polyline (dash animation hot path). */
export function flattenPathDataCached(pathString: string, samplesPerCurve = 20): Point[] {
  const key = samplesPerCurve === 20 ? pathString : `${samplesPerCurve}:${pathString}`
  const hit = flattenCache.get(key)
  if (hit) return hit
  const points = flattenPathData(pathString, samplesPerCurve)
  if (flattenCache.size >= FLATTEN_CACHE_MAX) {
    const first = flattenCache.keys().next().value
    if (first != null) flattenCache.delete(first)
  }
  flattenCache.set(key, points)
  return points
}

function cubicPoint(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  t: number,
): Point {
  const u = 1 - t
  const tt = t * t
  const uu = u * u
  const uuu = uu * u
  const ttt = tt * t
  return {
    x: uuu * x0 + 3 * uu * t * x1 + 3 * u * tt * x2 + ttt * x3,
    y: uuu * y0 + 3 * uu * t * y1 + 3 * u * tt * y2 + ttt * y3,
  }
}

function quadPoint(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, t: number): Point {
  const u = 1 - t
  return {
    x: u * u * x0 + 2 * u * t * x1 + t * t * x2,
    y: u * u * y0 + 2 * u * t * y1 + t * t * y2,
  }
}

/** Draw solid path-data onto a Pixi Graphics (absolute M/L/C). */
export function strokePathData(g: Graphics, pathString: string, style: StrokeStyle) {
  const commands = new SVGPathData(pathString).toAbs().commands
  let started = false
  for (const cmd of commands) {
    switch (cmd.type) {
      case SVGPathData.MOVE_TO:
        g.moveTo(cmd.x, cmd.y)
        started = true
        break
      case SVGPathData.LINE_TO:
        if (!started) g.moveTo(cmd.x, cmd.y)
        else g.lineTo(cmd.x, cmd.y)
        started = true
        break
      case SVGPathData.CURVE_TO:
        if (!started) g.moveTo(cmd.x1, cmd.y1)
        g.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y)
        started = true
        break
      case SVGPathData.QUAD_TO:
        g.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y)
        started = true
        break
      case SVGPathData.CLOSE_PATH:
        g.closePath()
        break
      default:
        break
    }
  }
  g.stroke({ ...strokeDefaults, ...style })
}
