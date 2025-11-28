import Person from '../../data/dto/Person'
import ColorsService from '../../services/Colors'

class PersonNodeProps {
  constructor(
    public person: Person,
    public positionStart: number,
    public positionEnd: number,
    public settings: PersonNodeSettings,
    public rowPosition: number,
    public highlightedAuthor: string,
    public updateHighlightedAuthor: React.Dispatch<React.SetStateAction<string>>,
    public displayAuthorsTimeline: boolean,
    public authorCallback: (id: string) => void,
  ) {}
}

export class PersonNodeSettings {
  constructor(public boxSize: number) {}
}

const PersonNode = (props: PersonNodeProps) => {
  const appBasePath = '/history_of_philosophy'
  const dominantColor = ColorsService.getAccentColor(props.person.nationality)

  return (
    <g>
      (
      {props.displayAuthorsTimeline && (
        <g>
          {/* <rect
            x={props.positionStart + props.settings.boxSize + 5}
            y={props.rowPosition}
            rx="10"
            ry="10"
            width={props.positionEnd - props.positionStart - props.settings.boxSize - 5}
            height={props.settings.boxSize}
            style={{
              fill: dominantColor,
              stroke: dominantColor,
              strokeWidth: '0',
              fillOpacity: '0.1',
              strokeOpacity: '1',
            }}
          /> */}
          <line
            x1={props.positionStart + props.settings.boxSize}
            y1={props.rowPosition + props.settings.boxSize / 2}
            x2={props.positionEnd}
            y2={props.rowPosition + props.settings.boxSize / 2}
            stroke={dominantColor}
            strokeWidth="6"
            opacity={props.highlightedAuthor == '0' || props.highlightedAuthor == props.person.id ? '1' : '0.3'}
          />
        </g>
      )}
      )
      {props.person.thumbnail && (
        <image
          href={appBasePath + '/assets/person/' + props.person.thumbnail}
          x={props.positionStart}
          y={props.rowPosition}
          rx={10}
          ry={10}
          opacity={props.highlightedAuthor == '0' || props.highlightedAuthor == props.person.id ? '1' : '0.3'}
          width={props.settings.boxSize}
          height={props.settings.boxSize}
          className="cursor-pointer"
          onMouseMove={() => props.updateHighlightedAuthor(props.person.id)}
          onClick={() => {
            props.updateHighlightedAuthor(props.person.id)
            props.authorCallback(props.person.id)
          }}
        />
      )}
      <rect
        x={props.positionStart}
        y={props.rowPosition}
        rx={5}
        ry={5}
        width={props.settings.boxSize + 1}
        height={props.settings.boxSize + 1}
        style={{
          fill: dominantColor,
          stroke: dominantColor,
          strokeWidth: '1',
          fillOpacity: '0',
          strokeOpacity: props.highlightedAuthor == '0' || props.highlightedAuthor == props.person.id ? '1' : '0.3',
        }}
        className="cursor-pointer"
        onMouseMove={() => props.updateHighlightedAuthor(props.person.id)}
        onClick={() => {
          props.updateHighlightedAuthor(props.person.id)
          props.authorCallback(props.person.id)
        }}
      />
      <rect
        x={props.positionStart - 1}
        y={props.rowPosition + props.settings.boxSize + 3}
        rx="2"
        ry="2"
        width={Math.min(props.person.name.length * 10, props.positionEnd - props.positionStart)}
        height={22}
        style={{
          fill: dominantColor,
          stroke: dominantColor,
          strokeWidth: '0',
          fillOpacity: props.highlightedAuthor == '0' || props.highlightedAuthor == props.person.id ? '1' : '0.1',
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
        opacity={props.highlightedAuthor == '0' || props.highlightedAuthor == props.person.id ? '1' : '0.3'}
      >
        {props.person.name.length * 8 < props.positionEnd - props.positionStart
          ? props.person.name
          : props.person.name.slice(0, (props.positionEnd - props.positionStart) / 8 - 4) + '...'}
      </text>
    </g>
  )
}

export default PersonNode
