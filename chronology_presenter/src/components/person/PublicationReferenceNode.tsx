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
    public settings: PublicationReferenceSettings,
  ) {}
}

export class PublicationReferenceSettings {
  constructor(
    public boxSize: number,
    public dotSize: number,
  ) {}
}

export const PublicationReferenceNode = (
  props: PublicationReferenceNodeProps,
) => {
  if (props.publicationReference.from && props.publicationReference.to) {
    let start: Coordinates = new Coordinates(
      props.positionStart,
      props.rowPositionFrom + props.settings.boxSize / 2,
    );
    let end: Coordinates = new Coordinates(
      props.positionEnd,
      props.rowPositionTo + props.settings.boxSize / 2,
    );
    let vdir: VDirection = start.y > end.y ? -1 : start.y == end.y ? 0 : 1;
    let hdir: HDirection = start.x > end.x ? -1 : start.x == end.x ? 0 : 1;
    let cos05 = 0.877;
    let distanceFromFactor =
      0.7 +
      (0.7 *
        ((props.publicationReference.to.publicationDate +
          props.publicationReference.from.publicationDate) %
          5)) /
        5;
    let distanceToFactor =
      1.4 +
      (0.7 *
        ((props.publicationReference.from.publicationDate +
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
          start.x + props.settings.dotSize * cos05 * hdir,
          start.y + props.settings.dotSize * cos05 * vdir,
        ),
      );
      points.push(
        new Coordinates(
          start.x + props.settings.boxSize * cos05 * hdir,
          start.y + props.settings.boxSize * distanceFromFactor * vdir,
        ),
      );
      if (
        end.x -
          (start.x +
            props.settings.boxSize +
            props.settings.boxSize * distanceFromFactor * hdir) >
        props.settings.boxSize * distanceFromFactor * hdir
      ) {
        points.push(
          new Coordinates(
            start.x +
              props.settings.boxSize +
              props.settings.boxSize * distanceFromFactor * hdir,
            start.y + props.settings.boxSize * distanceFromFactor * vdir,
          ),
        );
        points.push(
          new Coordinates(
            start.x +
              props.settings.boxSize +
              props.settings.boxSize * distanceFromFactor * hdir,
            end.y - props.settings.boxSize * distanceToFactor * vdir,
          ),
        );
        points.push(
          new Coordinates(
            end.x - props.settings.boxSize,
            end.y - props.settings.boxSize * distanceToFactor * vdir,
          ),
        );
        points.push(
          new Coordinates(
            end.x,
            end.y - props.settings.boxSize * distanceToFactor * vdir,
          ),
        );
      } else {
        points.push(
          new Coordinates(
            end.x,
            start.y + props.settings.boxSize * distanceFromFactor * vdir,
          ),
        );
      }
      points.push(
        new Coordinates(
          end.x,
          end.y - props.settings.dotSize * distanceToFactor * vdir,
        ),
      );
    }

    let pathPoints = [
      ['M', points[0].x, points[0].y],
      ...points.map((p) => ['L', p.x, p.y]),
    ]
      .map((p) => p.join(' '))
      .join(' ');

    let colorFrom = getAccentColor(props.authorFrom.name);
    let colorTo = getAccentColor(props.authorTo.name);
    return (
      <g onClick={(e) => console.log(props)}>
        <defs>
          <linearGradient id={'linear-grad' + start.x + '-' + start.y}>
            <stop offset="0" stopColor={colorTo} />
            <stop offset="1" stopColor={colorFrom} />
          </linearGradient>
        </defs>
        <path
          // d={pathPoints}
          d={roundPathCorners(pathPoints, 5, false)}
          stroke={'url(#' + 'linear-grad' + start.x + '-' + start.y + ')'}
          // stroke="red"
          strokeWidth="2"
          fill="none"
          className="opacity-70 animated-dash"
        />
      </g>
    );
  }
};
