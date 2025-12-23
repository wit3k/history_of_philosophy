import type Person from '../../data/dto/Person'
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
  const fixedColor = ColorsService.getAccentColor(props.person.nationality)
  const tamedColor = ColorsService.convertToPale(fixedColor)
  const darkColor = ColorsService.convertToDark(fixedColor)

  return (
    <g
      onClick={() => {
        props.updateHighlightedAuthor(props.person.id)
        props.authorCallback(props.person.id)
      }}
      onMouseMove={() => props.updateHighlightedAuthor(props.person.id)}
    >
      (
      {props.displayAuthorsTimeline && (
        <g>
          <rect
            height={props.settings.boxSize}
            rx="0"
            ry="0"
            style={{
              fill: tamedColor,
              fillOpacity: 1,
              stroke: fixedColor,
              strokeOpacity: '1',
              strokeWidth: props.highlightedAuthor === props.person.id ? '3' : '1',
            }}
            width={props.positionEnd - props.positionStart}
            x={props.positionStart}
            y={props.rowPosition}
          />
        </g>
      )}
      )
      {props.person.thumbnail && (
        <image
          className="cursor-pointer"
          height={props.settings.boxSize}
          href={`${appBasePath}/assets/person/${props.person.thumbnail}`}
          // opacity={props.highlightedAuthor === '0' || props.highlightedAuthor === props.person.id ? '1' : '0.3'}
          rx="0"
          ry="0"
          width={props.settings.boxSize}
          x={props.positionStart}
          y={props.rowPosition}
        />
      )}
      <text
        className="cursor-pointer font-mono"
        dominantBaseline="hanging"
        fill={darkColor}
        fontSize="14"
        height="30"
        opacity={props.highlightedAuthor === props.person.id ? '1' : '0.8'}
        textAnchor="start"
        width={props.person.name.length * 10}
        x={props.positionStart + props.settings.boxSize + 8}
        y={props.rowPosition + 12}
      >
        {props.person.name.length * 8 < props.positionEnd - props.positionStart - props.settings.boxSize - 12
          ? props.person.name
          : `${props.person.name.slice(0, Math.max((props.positionEnd - props.positionStart - props.settings.boxSize - 12) / 8 - 4, 0))}...`}
      </text>
    </g>
  )
}

export default PersonNode
