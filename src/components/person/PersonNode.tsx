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
    <g>
      (
      {props.displayAuthorsTimeline && (
        <g>
          <rect
            height={props.settings.boxSize}
            rx="0"
            ry="0"
            style={{
              fill: tamedColor,
              fillOpacity: '1',
              stroke: fixedColor,
              strokeOpacity: '1',
              strokeWidth: '1',
            }}
            width={props.positionEnd - props.positionStart}
            x={props.positionStart}
            y={props.rowPosition}
          />
          {/* <line
            opacity={props.highlightedAuthor == '0' || props.highlightedAuthor == props.person.id ? '1' : '0.3'}
            stroke={tamedColor}
            strokeWidth="6"
            x1={props.positionStart + props.settings.boxSize}
            x2={props.positionEnd}
            y1={props.rowPosition + props.settings.boxSize / 2}
            y2={props.rowPosition + props.settings.boxSize / 2}
          /> */}
        </g>
      )}
      )
      {props.person.thumbnail && (
        <image
          className="cursor-pointer"
          height={props.settings.boxSize}
          href={appBasePath + '/assets/person/' + props.person.thumbnail}
          onClick={() => {
            props.updateHighlightedAuthor(props.person.id)
            props.authorCallback(props.person.id)
          }}
          onMouseMove={() => props.updateHighlightedAuthor(props.person.id)}
          opacity={props.highlightedAuthor == '0' || props.highlightedAuthor == props.person.id ? '1' : '0.3'}
          rx="0"
          ry="0"
          width={props.settings.boxSize}
          x={props.positionStart}
          y={props.rowPosition}
        />
      )}
      {/* <rect
        className="cursor-pointer"
        height={props.settings.boxSize}
        onClick={() => {
          props.updateHighlightedAuthor(props.person.id)
          props.authorCallback(props.person.id)
        }}
        onMouseMove={() => props.updateHighlightedAuthor(props.person.id)}
        rx={5}
        ry={5}
        style={{
          fill: fixedColor,
          fillOpacity: '0',
          stroke: fixedColor,
          strokeOpacity: props.highlightedAuthor == '0' || props.highlightedAuthor == props.person.id ? '1' : '0.3',
          strokeWidth: '2',
        }}
        width={props.settings.boxSize}
        x={props.positionStart}
        y={props.rowPosition}
      /> */}
      {/* <rect
        className="cursor-pointer"
        height={22}
        rx="2"
        ry="2"
        style={{
          fill: fixedColor,
          fillOpacity: props.highlightedAuthor == '0' || props.highlightedAuthor == props.person.id ? '1' : '0.1',
          stroke: fixedColor,
          strokeOpacity: '0',
          strokeWidth: '0',
        }}
        width={Math.min(props.person.name.length * 10, props.positionEnd - props.positionStart)}
        x={props.positionStart - 1}
        y={props.rowPosition + props.settings.boxSize + 3}
      /> */}
      <text
        className="cursor-pointer font-mono"
        dominantBaseline="hanging"
        fill={darkColor}
        fontSize="14"
        height="30"
        opacity={props.highlightedAuthor === '0' || props.highlightedAuthor === props.person.id ? '1' : '0.3'}
        textAnchor="start"
        width={props.person.name.length * 10}
        x={props.positionStart + props.settings.boxSize + 8}
        y={props.rowPosition + 12}
      >
        {props.person.name.length * 8 < props.positionEnd - props.positionStart
          ? props.person.name
          : props.person.name.slice(0, (props.positionEnd - props.positionStart) / 8 - 4) + '...'}
      </text>
    </g>
  )
}

export default PersonNode
