import './PersonReferenceNode.css';
import type Person from '../../data/dto/Person';
import Coordinates from '../../geometry/Coordinates';
import { VDirection, HDirection } from '../../geometry/Directions';
import { roundPathCorners } from '../../geometry/PathRounding';
import type PersonReference from '../../data/dto/PersonReference';
import { Attitude } from '../../data/dto/PersonReference';

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
        return 'rgba(198, 18, 84, 1)';
        break;
      case Attitude.Neutral:
        return 'rgba(10, 25, 119, 1)';
        break;
      case Attitude.Positive:
        return 'rgba(154, 231, 32, 1)';
        break;
    }
  };
  const boxSize2 = props.settings.boxSize;
  if (props.personReference.from && props.personReference.to) {
    let start: Coordinates = new Coordinates(
      props.positionStart,
      props.rowPositionFrom + props.settings.boxSize / 2,
    );
    let end: Coordinates = new Coordinates(
      props.positionEnd,
      props.rowPositionTo + props.settings.boxSize / 2,
    );
    let vdir: VDirection = start.y > end.y ? -1 : 1;
    let hdir: HDirection = start.x + boxSize2 * 2 > end.x ? -1 : 1;
    let points = [];

    points.push(
      new Coordinates(
        start.x + boxSize2 / 2 + (boxSize2 / 2) * hdir,
        start.y + (boxSize2 / 3) * vdir,
      ),
    );

    points.push(
      new Coordinates(
        start.x + boxSize2 / 2 + boxSize2 * hdir,
        start.y + (boxSize2 / 3) * vdir,
      ),
    );

    points.push(
      new Coordinates(
        start.x + boxSize2 / 2 + boxSize2 * hdir,
        end.y + (boxSize2 / 5) * -vdir,
      ),
    );

    points.push(
      new Coordinates(
        start.x + boxSize2 / 2 + boxSize2 * hdir > end.x
          ? end.x + boxSize2 / 2 - (boxSize2 / 2) * hdir
          : end.x,
        end.y + (boxSize2 / 5) * -vdir,
      ),
    );

    let pathPoints = [
      ['M', points[0].x, points[0].y],
      ...points.map((p) => ['L', p.x, p.y]),
    ]
      .map((p) => p.join(' '))
      .join(' ');

    let colorFrom = colorByAttitude(props.personReference.attitude);
    return (
      <path
        d={roundPathCorners(pathPoints, 15, false)}
        stroke={colorFrom}
        strokeWidth="2"
        fill="none"
        className={
          props.isHighlighted
            ? 'animated-bigdash'
            : props.highlightsOn
              ? 'bigdash-highlights-on'
              : ''
        }
      />
    );
  }
};

export default PersonReferenceNode;
