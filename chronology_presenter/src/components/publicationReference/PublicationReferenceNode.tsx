import './PublicationReferenceNode.css';
import type Person from '../../data/dto/Person';
import type PublicationReference from '../../data/dto/PublicationReference';
import Coordinates from '../../geometry/Coordinates';
import { VDirection, HDirection } from '../../geometry/Directions';
import { roundPathCorners } from '../../geometry/PathRounding';
import getAccentColor from '../../services/Colors';

class PublicationReferenceNodeProps {
  constructor(
    public publicationReference: PublicationReference,
    public authorFrom: Person,
    public authorTo: Person,
    public positionStart: number,
    public positionEnd: number,
    public rowPositionFrom: number,
    public rowPositionTo: number,
    public isHighlighted: boolean,
    public settings: PublicationReferenceSettings,
  ) {}
}

export class PublicationReferenceSettings {
  constructor(
    public boxSize: number,
    public dotSize: number,
  ) {}
}

const PublicationReferenceNode = (props: PublicationReferenceNodeProps) => {
  if (props.publicationReference.from && props.publicationReference.to) {
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
    let cos05 = 0.877;
    let distanceFromFactor =
      0.7 +
      (0.7 *
        ((props.publicationReference.to.publicationDate +
          props.publicationReference.from.publicationDate) %
          15)) /
        15;
    let distanceToFactor =
      1.4 +
      (0.7 *
        ((props.publicationReference.to.publicationDate +
          props.publicationReference.from.publicationDate) %
          5)) /
        5;
    let points = [];
    if (props.positionEnd == props.positionStart) {
      points.push(new Coordinates(start.x, start.y));
      points.push(new Coordinates(end.x + 0.1, end.y + 0.1));
    } else {
      points.push(
        new Coordinates(
          start.x + props.settings.dotSize * cos05 * hdir * shrinkFactor,
          start.y + props.settings.dotSize * cos05 * vdir * isEqual,
        ),
      );

      points.push(
        new Coordinates(
          start.x + props.settings.boxSize * cos05 * hdir * shrinkFactor,
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

      points.push(new Coordinates(end.x, end.y));
    }

    let pathPoints = [
      ['M', points[0].x, points[0].y],
      ...points.map((p) => ['L', p.x, p.y]),
    ]
      .map((p) => p.join(' '))
      .join(' ');

    let colorFrom = getAccentColor(props.authorFrom.name);
    return (
      <path
        d={roundPathCorners(pathPoints, 5, false)}
        stroke={colorFrom}
        strokeWidth="2"
        fill="none"
        className={'opacity-70 ' + (props.isHighlighted ? 'animated-dash' : '')}
      />
    );
  }
};

export default PublicationReferenceNode;
