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
    let extraSpacing = props.settings.boxSize * 2;
    let mostLeft = Math.min(props.positionStart, props.positionEnd);
    let mostRight = Math.max(props.positionStart, props.positionEnd);
    let shrinkFactor =
      mostRight - mostLeft < extraSpacing
        ? ((mostRight - mostLeft) % extraSpacing) / extraSpacing
        : 1.0;
    let start: Coordinates = new Coordinates(
      props.positionStart,
      props.rowPositionFrom + props.settings.boxSize / 2,
    );
    let end: Coordinates = new Coordinates(
      props.positionEnd,
      props.rowPositionTo + props.settings.boxSize / 2,
    );
    let vdir: VDirection = start.y > end.y ? -1 : 1;
    let isEqual: VDirection = start.y == end.y ? -1 : 1;
    let hdir: HDirection = start.x > end.x ? -1 : 1;
    let distanceFromFactor =
      0.7 +
      (0.7 *
        ((props.personReference.to.born + props.personReference.from.born) %
          15)) /
        15;
    let distanceToFactor =
      1.4 +
      (0.7 *
        ((props.personReference.to.born + props.personReference.from.born) %
          5)) /
        5;
    let points = [];
    if (props.positionEnd == props.positionStart) {
      points.push(
        new Coordinates(
          start.x + (boxSize2 / 2) * hdir,
          start.y + (boxSize2 / 2) * vdir,
        ),
      );
      points.push(
        new Coordinates(
          end.x + (boxSize2 / 2 + 0.1 * hdir),
          end.y - (boxSize2 / 2 + 0.1 * vdir),
        ),
      );
    } else {
      points.push(
        new Coordinates(
          start.x + props.settings.boxSize * hdir * shrinkFactor,
          start.y,
        ),
      );

      points.push(
        new Coordinates(
          start.x +
            (props.settings.boxSize +
              props.settings.boxSize * distanceFromFactor * hdir) *
              shrinkFactor,
          start.y +
            props.settings.boxSize * distanceFromFactor * vdir * isEqual,
        ),
      );

      points.push(
        new Coordinates(
          start.x +
            (props.settings.boxSize +
              props.settings.boxSize * distanceFromFactor * hdir) *
              shrinkFactor,
          end.y - props.settings.boxSize * distanceToFactor * vdir,
        ),
      );

      points.push(
        new Coordinates(
          end.x,
          end.y - props.settings.boxSize * distanceToFactor * vdir,
        ),
      );

      points.push(
        new Coordinates(end.x + boxSize2 / 2, end.y - (boxSize2 / 2) * vdir),
      );
    }

    let pathPoints = [
      ['M', points[0].x, points[0].y],
      ...points.map((p) => ['L', p.x, p.y]),
    ]
      .map((p) => p.join(' '))
      .join(' ');

    let colorFrom = colorByAttitude(props.personReference.attitude);
    return (
      <path
        d={roundPathCorners(pathPoints, 5, false)}
        stroke={colorFrom}
        strokeWidth="5"
        fill="none"
        className={
          'opacity-70 bigdash ' +
          (props.isHighlighted ? 'animated-bigdash' : '')
        }
      />
    );
  }
};

export default PersonReferenceNode;
