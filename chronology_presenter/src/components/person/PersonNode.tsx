import Person from '../../data/dto/Person';
import getAccentColor from '../../services/Colors';

class PersonNodeProps {
  constructor(
    public person: Person,
    public positionStart: number,
    public positionEnd: number,
    public settings: PersonNodeSettings,
    public rowPosition: number,
  ) {}
}

export class PersonNodeSettings {
  constructor(public boxSize: number) {}
}

export const PersonNode = (props: PersonNodeProps) => {
  const dominantColor = getAccentColor(props.person.name);
  return (
    <g onClick={(e) => console.log(e)}>
      <rect
        x={props.positionStart + 5}
        y={props.rowPosition}
        rx="5"
        ry="5"
        width={props.settings.boxSize}
        height={props.settings.boxSize}
        style={{
          fill: dominantColor,
          stroke: dominantColor,
          strokeWidth: '0',
          fillOpacity: '0.1',
          strokeOpacity: '1',
        }}
      />
      <rect
        x={props.positionStart}
        y={props.rowPosition - 5}
        rx="10"
        ry="10"
        width={props.settings.boxSize + 10}
        height={props.settings.boxSize + 10}
        style={{
          fill: dominantColor,
          stroke: dominantColor,
          strokeWidth: '1',
          fillOpacity: '0.1',
          strokeOpacity: '1',
        }}
        className="cursor-pointer"
      />
      <rect
        x={props.positionStart}
        y={props.rowPosition + props.settings.boxSize}
        rx="5"
        ry="5"
        width={props.person.name.length * 10}
        height={30}
        style={{
          fill: dominantColor,
          stroke: dominantColor,
          strokeWidth: '0',
          fillOpacity: '1',
          strokeOpacity: '0',
        }}
        className="cursor-pointer"
      />
      <text
        x={props.positionStart + 5}
        y={props.rowPosition + props.settings.boxSize + 6}
        width={props.person.name.length * 10}
        dominantBaseline="hanging"
        textAnchor="start"
        height="40"
        fontFamily="Verdana"
        fontSize="15"
        fill="white"
        className="cursor-pointer"
      >
        {props.person.name}
      </text>
      <rect
        x={props.positionStart + 10 + props.settings.boxSize}
        y={props.rowPosition}
        rx="5"
        ry="5"
        width={props.positionEnd - props.positionStart}
        height={props.settings.boxSize}
        style={{
          fill: dominantColor,
          stroke: dominantColor,
          strokeWidth: '1',
          fillOpacity: '0.1',
          strokeOpacity: '1',
        }}
      />
      <line
        x1={props.positionStart + 20 + props.settings.boxSize}
        y1={props.rowPosition + props.settings.boxSize / 2}
        x2={props.positionEnd - 0 + props.settings.boxSize}
        y2={props.rowPosition + props.settings.boxSize / 2}
        stroke="#ffffff"
        strokeWidth="5"
      />
    </g>
  );
};
