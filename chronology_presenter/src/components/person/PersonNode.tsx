import Person from '../../data/dto/Person';
import getAccentColor from '../../services/Colors';

class PersonNodeProps {
  constructor(
    public person: Person,
    public positionStart: number,
    public positionEnd: number,
    public settings: PersonNodeSettings,
    public rowPosition: number,
    public updateHighlightedAuthor: React.Dispatch<
      React.SetStateAction<string>
    >,
  ) {}
}

export class PersonNodeSettings {
  constructor(public boxSize: number) {}
}

const PersonNode = (props: PersonNodeProps) => {
  const dominantColor = getAccentColor(props.person.name);
  return (
    <g>
      <rect
        x={props.positionStart}
        y={props.rowPosition}
        rx="5"
        ry="5"
        width={props.positionEnd - props.positionStart}
        height={props.settings.boxSize}
        style={{
          fill: dominantColor,
          stroke: dominantColor,
          strokeWidth: '0',
          fillOpacity: '0.1',
          strokeOpacity: '1',
        }}
      />
      <line
        x1={props.positionStart + props.settings.boxSize}
        y1={props.rowPosition + props.settings.boxSize / 2}
        x2={props.positionEnd}
        y2={props.rowPosition + props.settings.boxSize / 2}
        stroke={dominantColor}
        strokeWidth="4"
      />
      <rect
        x={props.positionStart}
        y={props.rowPosition}
        rx="10"
        ry="10"
        width={props.settings.boxSize}
        height={props.settings.boxSize}
        style={{
          fill: dominantColor,
          stroke: dominantColor,
          strokeWidth: '2',
          fillOpacity: '0.1',
          strokeOpacity: '1',
        }}
        className="cursor-pointer"
        onMouseMove={() => props.updateHighlightedAuthor(props.person.id)}
        onClick={() => props.updateHighlightedAuthor(props.person.id)}
      />
      <rect
        x={props.positionStart - 1}
        y={props.rowPosition + props.settings.boxSize - 15}
        rx="5"
        ry="5"
        width={props.person.name.length * 10}
        height={22}
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
        y={props.rowPosition + props.settings.boxSize - 10}
        width={props.person.name.length * 10}
        dominantBaseline="hanging"
        textAnchor="start"
        height="30"
        // fontFamily="Verdana"
        fontSize="14"
        fill="white"
        className="cursor-pointer font-mono"
      >
        {props.person.name}
      </text>
    </g>
  );
};

export default PersonNode;
