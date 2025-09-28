import Person from '../../data/dto/Person';
import getAccentColor from '../../services/Colors';
// import nietzsche from '../../static/nietzsche.png';

class PersonNodeProps {
  constructor(
    public person: Person,
    public positionStart: number,
    public positionEnd: number,
    public settings: PersonNodeSettings,
    public rowPosition: number,
    public highlightedAuthor: string,
    public updateHighlightedAuthor: React.Dispatch<
      React.SetStateAction<string>
    >,
    public displayAuthorsTimeline: boolean,
  ) {}
}

export class PersonNodeSettings {
  constructor(public boxSize: number) {}
}

const PersonNode = (props: PersonNodeProps) => {
  const appBasePath = '/history_of_philosophy';
  const dominantColor = getAccentColor(props.person.name);

  return (
    <g>
      (
      {props.displayAuthorsTimeline && (
        <g>
          <rect
            x={props.positionStart}
            y={props.rowPosition}
            rx="10"
            ry="10"
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
            opacity={
              props.highlightedAuthor == '0' ||
              props.highlightedAuthor == props.person.id
                ? '1'
                : '0.3'
            }
          />
        </g>
      )}
      )
      {props.person.thumbnail && (
        <image
          href={appBasePath + '/assets/person/' + props.person.thumbnail}
          x={props.positionStart}
          y={props.rowPosition}
          rx="10"
          ry="10"
          opacity={
            props.highlightedAuthor == '0' ||
            props.highlightedAuthor == props.person.id
              ? '1'
              : '0.3'
          }
          width={props.settings.boxSize}
          height={props.settings.boxSize}
          className="cursor-pointer"
          onMouseMove={() => props.updateHighlightedAuthor(props.person.id)}
          onClick={() => props.updateHighlightedAuthor(props.person.id)}
        />
      )}
      <rect
        x={props.positionStart}
        y={props.rowPosition}
        rx="10"
        ry="10"
        width={props.settings.boxSize + 1}
        height={props.settings.boxSize + 1}
        style={{
          fill: dominantColor,
          stroke: dominantColor,
          strokeWidth: '4',
          fillOpacity: '0',
          strokeOpacity:
            props.highlightedAuthor == '0' ||
            props.highlightedAuthor == props.person.id
              ? '1'
              : '0.3',
        }}
        className="cursor-pointer"
        onMouseMove={() => props.updateHighlightedAuthor(props.person.id)}
        onClick={() => props.updateHighlightedAuthor(props.person.id)}
      />
      <rect
        x={props.positionStart - 1}
        y={props.rowPosition + props.settings.boxSize + 3}
        rx="5"
        ry="5"
        width={props.person.name.length * 10}
        height={22}
        style={{
          fill: dominantColor,
          stroke: dominantColor,
          strokeWidth: '0',
          fillOpacity:
            props.highlightedAuthor == '0' ||
            props.highlightedAuthor == props.person.id
              ? '0.3'
              : '0.1',
          strokeOpacity: '0',
        }}
        className="cursor-pointer"
      />
      <text
        x={props.positionStart + 5}
        y={props.rowPosition + props.settings.boxSize + 8}
        width={props.person.name.length * 10}
        dominantBaseline="hanging"
        textAnchor="start"
        height="30"
        fontSize="14"
        fill="white"
        className="cursor-pointer font-mono"
        opacity={
          props.highlightedAuthor == '0' ||
          props.highlightedAuthor == props.person.id
            ? '1'
            : '0.3'
        }
      >
        {props.person.name}
      </text>
    </g>
  );
};

export default PersonNode;
