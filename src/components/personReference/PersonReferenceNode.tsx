import './PersonReferenceNode.css'
import type Person from '../../data/dto/Person'
import type PersonReference from '../../data/dto/PersonReference'
import { Attitude } from '../../data/dto/PersonReference'
import Coordinates from '../../geometry/Coordinates'
import type { HDirection, VDirection } from '../../geometry/Directions'
import { roundPathCorners } from '../../geometry/PathRounding'

class PersonReferenceNodeProps {
  constructor(
    public personReference: PersonReference,
    public authorFrom: Person,
    public authorTo: Person,
    public positionStart: number,
    public positionEnd: number,
    public rowPositionFrom: number,
    public rowPositionTo: number,
    public highlightsOn: boolean,
    public isHighlighted: boolean,
    public settings: PersonReferenceSettings,
  ) {}
}

export class PersonReferenceSettings {
  constructor(public boxSize: number) {}
}

const PersonReferenceNode = (props: PersonReferenceNodeProps) => {
  const colorByAttitude = (attitude: Attitude) => {
    switch (attitude) {
      case Attitude.Negative:
        return 'rgb(198, 18, 84)'
      case Attitude.Neutral:
        return 'rgba(0, 221, 255, 1)'
      case Attitude.Positive:
        return 'rgb(154, 231, 32)'
    }
  }
  const boxSize2 = props.settings.boxSize
  if (props.personReference.from && props.personReference.to) {
    const start: Coordinates = new Coordinates(props.positionStart, props.rowPositionFrom + props.settings.boxSize / 2)
    const end: Coordinates = new Coordinates(props.positionEnd, props.rowPositionTo + props.settings.boxSize / 2)
    const vdir: VDirection = start.y > end.y ? -1 : 1
    const hdir: HDirection = start.x + boxSize2 * 2 > end.x ? -1 : 1
    const points = []

    points.push(new Coordinates(start.x + boxSize2 / 2 + (boxSize2 / 2) * hdir, start.y + (boxSize2 / 3) * vdir))

    points.push(new Coordinates(start.x + boxSize2 / 2 + boxSize2 * hdir, start.y + (boxSize2 / 3) * vdir))

    points.push(new Coordinates(start.x + boxSize2 / 2 + boxSize2 * hdir, end.y + (boxSize2 / 5) * -vdir))

    points.push(
      new Coordinates(
        start.x + boxSize2 / 2 + boxSize2 * hdir > end.x ? end.x + boxSize2 / 2 - (boxSize2 / 2) * hdir : end.x,
        end.y + (boxSize2 / 5) * -vdir,
      ),
    )

    const pathPoints = [['M', points[0].x, points[0].y], ...points.map(p => ['L', p.x, p.y])]
      .map(p => p.join(' '))
      .join(' ')

    const colorFrom = colorByAttitude(props.personReference.attitude)
    return (
      <path
        className={props.isHighlighted ? 'animated-bigdash' : props.highlightsOn ? 'bigdash-highlights-on' : ''}
        d={roundPathCorners(pathPoints, 15, false)}
        fill="none"
        stroke={colorFrom}
        strokeOpacity={props.isHighlighted ? 1 : 1}
        strokeWidth="2"
      />
    )
  }
}

export default PersonReferenceNode
