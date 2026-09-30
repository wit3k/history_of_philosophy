import Coordinates from '../geometry/Coordinates'
import { roundPathCorners } from './roundPathCorners'
import { Attitude } from '../data/dto/PersonReference'
import type Publication from '../data/dto/Publication'

export function attitudeColor(attitude: Attitude): string {
  switch (attitude) {
    case Attitude.Negative:
      return 'rgb(198, 18, 84)'
    case Attitude.Neutral:
      return 'rgba(0, 221, 255, 1)'
    case Attitude.Positive:
      return 'rgb(154, 231, 32)'
  }
}

export function buildPersonReferencePath(
  positionStart: number,
  positionEnd: number,
  rowPositionFrom: number,
  rowPositionTo: number,
  boxSize: number,
): string {
  const start = new Coordinates(positionStart, rowPositionFrom + boxSize / 2)
  const end = new Coordinates(positionEnd, rowPositionTo + boxSize / 2)
  const vdir = start.y > end.y ? -1 : 1
  const hdir = start.x + boxSize * 2 > end.x ? -1 : 1
  const points = [
    new Coordinates(start.x + boxSize / 2 + (boxSize / 2) * hdir, start.y + (boxSize / 3) * vdir),
    new Coordinates(start.x + boxSize / 2 + boxSize * hdir, start.y + (boxSize / 3) * vdir),
    new Coordinates(start.x + boxSize / 2 + boxSize * hdir, end.y + (boxSize / 5) * -vdir),
    new Coordinates(
      start.x + boxSize / 2 + boxSize * hdir > end.x ? end.x + boxSize / 2 - (boxSize / 2) * hdir : end.x,
      end.y + (boxSize / 5) * -vdir,
    ),
  ]
  const pathPoints = [['M', points[0].x, points[0].y], ...points.map(p => ['L', p.x, p.y])]
    .map(p => p.join(' '))
    .join(' ')
  return roundPathCorners(pathPoints, 15, false)
}

export function buildPublicationReferencePath(
  positionStart: number,
  positionEnd: number,
  rowPositionFrom: number,
  rowPositionTo: number,
  boxSize: number,
  dotSize: number,
  publicationFrom: Publication,
  publicationTo: Publication,
): string {
  const extraSpacing = boxSize * 2
  const mostLeft = Math.min(positionStart, positionEnd)
  const mostRight = Math.max(positionStart, positionEnd)
  const shrinkFactor = mostRight - mostLeft < extraSpacing ? ((mostRight - mostLeft) % extraSpacing) / extraSpacing : 1.0
  const start = new Coordinates(positionStart, rowPositionFrom + boxSize / 2)
  const end = new Coordinates(positionEnd, rowPositionTo + boxSize / 2)
  const vdir = start.y > end.y ? -1 : 1
  const isEqual = start.y === end.y ? -1 : 1
  const hdir = start.x > end.x ? -1 : 1
  const cos05 = 0.877
  const distanceFromFactor =
    0.7 + (0.7 * ((publicationTo.publicationDate + publicationFrom.publicationDate) % 15)) / 15
  const distanceToFactor = 1.4 + (0.7 * ((publicationTo.publicationDate + publicationFrom.publicationDate) % 5)) / 5
  const points: Coordinates[] = []
  if (positionEnd === positionStart) {
    points.push(new Coordinates(start.x, start.y))
    points.push(new Coordinates(end.x + 0.1, end.y + 0.1))
  } else {
    points.push(
      new Coordinates(
        start.x + (dotSize / 2) * cos05 * hdir * shrinkFactor,
        start.y + (dotSize / 2) * cos05 * vdir * isEqual,
      ),
    )
    points.push(
      new Coordinates(
        start.x + boxSize * distanceFromFactor * cos05 * hdir * shrinkFactor,
        start.y + boxSize * distanceFromFactor * vdir * isEqual,
      ),
    )
    points.push(
      new Coordinates(
        start.x + boxSize * distanceFromFactor * cos05 * hdir * shrinkFactor,
        end.y - boxSize * distanceToFactor * vdir,
      ),
    )
    points.push(new Coordinates(end.x, end.y - boxSize * distanceToFactor * vdir))
    points.push(new Coordinates(end.x, end.y))
  }
  const pathPoints = [['M', points[0].x, points[0].y], ...points.map(p => ['L', p.x, p.y])]
    .map(p => p.join(' '))
    .join(' ')
  return roundPathCorners(pathPoints, 5, false)
}

export function wrapTitleWords(title: string, maxLettersColumns: number, maxLettersRows: number) {
  const words = title.split(' ')
  if (words.length === 0) return { slices: [] as string[], truncated: false }
  const sections: string[] = [words[0]]
  for (let i = 1; i < words.length; i++) {
    const withLast = `${sections[sections.length - 1]} ${words[i]}`
    if (withLast.length < maxLettersColumns) sections[sections.length - 1] = withLast
    else sections.push(words[i])
  }
  const slices = sections.slice(0, maxLettersRows)
  return {
    slices,
    truncated: slices.length !== sections.length,
  }
}
