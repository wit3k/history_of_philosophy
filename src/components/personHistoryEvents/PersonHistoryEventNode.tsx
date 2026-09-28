import './PersonHistoryEventNode.css'
import type Person from '../../data/dto/Person'
import type PersonHistoryEvent from '../../data/dto/PersonHistoryEvent'
import ColorsService from '../../services/Colors'

class PersonHistoryEventNodeProps {
  constructor(
    public event: PersonHistoryEvent,
    public positionStart: number,
    public positionEnd: number,
    public settings: PersonHistoryEventNodeSettings,
    public rowPosition: number,
    public person?: Person,
    public modalHandle?: React.Dispatch<React.SetStateAction<boolean>>,
    public setCurrentPerson?: React.Dispatch<React.SetStateAction<Person>>,
    public setCurrentEvent?: React.Dispatch<React.SetStateAction<PersonHistoryEvent>>,
  ) {}
}

export class PersonHistoryEventNodeSettings {
  constructor(
    public boxSize: number,
    public barHeight: number,
    public dotRadius: number,
    public maxLettersColumns: number,
    public maxLettersRows: number,
  ) {}
}

const isInstantEvent = (event: PersonHistoryEvent) =>
  event.yearTo == null || event.yearFrom == null || event.yearTo === event.yearFrom

const PersonHistoryEventNode = (props: PersonHistoryEventNodeProps) => {
  if (props.event.yearFrom == null) return null

  const colorSeed = props.event.yearFrom
  const fixedColor = ColorsService.getFixedColor(colorSeed)
  const tamedColor = ColorsService.getTamedColor(colorSeed)
  const instant = isInstantEvent(props.event)
  const barY = props.rowPosition + props.settings.boxSize - props.settings.barHeight - 2
  const centerX = instant ? props.positionStart : (props.positionStart + props.positionEnd) / 2
  const centerY = props.rowPosition + props.settings.boxSize / 2

  const titleSections = props.event.name
    .split(' ')
    .map(e => [e])
    .reduce((acc, word) => {
      const withLastWord = `${acc[acc.length - 1]} ${word[0]}`
      return withLastWord.length < props.settings.maxLettersColumns
        ? [...acc.slice(0, -1), withLastWord]
        : acc.concat(word[0])
    })
  const slices = titleSections.slice(0, props.settings.maxLettersRows)
  const yearLabel =
    instant || props.event.yearTo == null ? `${props.event.yearFrom}` : `${props.event.yearFrom}–${props.event.yearTo}`

  const openModal = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation()
    if (props.person && props.setCurrentPerson && props.setCurrentEvent && props.modalHandle) {
      props.setCurrentPerson(_ => props.person!)
      props.setCurrentEvent(_ => props.event)
      props.modalHandle(true)
    }
  }

  return (
    <g>
      <g className="tooltip">
        <rect
          height={70 + 10 * (slices.length - 1)}
          rx="3"
          ry="3"
          style={{
            fill: tamedColor,
            fillOpacity: '1',
            stroke: fixedColor,
            strokeOpacity: '1',
            strokeWidth: '2px',
          }}
          width="230"
          x={centerX - 105}
          y={props.rowPosition + props.settings.boxSize / 2}
        />
        <text
          className="font-mono font-bold"
          dominantBaseline="hanging"
          dy="8"
          fill={fixedColor}
          fontSize="12"
          textAnchor="start"
          x={centerX - 95}
          y={props.rowPosition + props.settings.boxSize / 2 + 8}
        >
          <tspan x={centerX - 95}>{props.event.type}</tspan>
          <tspan dy="1.1em" x={centerX - 95}>
            {yearLabel}
          </tspan>
          {slices.map((s, i) => (
            <tspan dy="1.1em" key={`eventTitle${props.event.id}${s}`} x={centerX - 95}>
              {s}
              {i === slices.length - 1 && slices.length !== titleSections.length ? '...' : ''}
            </tspan>
          ))}
        </text>
      </g>

      {instant ? (
        <circle
          className="tooltipHover cursor-pointer"
          cx={props.positionStart}
          cy={centerY}
          fill={fixedColor}
          onClick={openModal}
          onMouseDown={e => e.stopPropagation()}
          r={props.settings.dotRadius}
          stroke={tamedColor}
          strokeWidth="2"
        />
      ) : (
        <rect
          className="tooltipHover cursor-pointer"
          height={props.settings.barHeight}
          onClick={openModal}
          onMouseDown={e => e.stopPropagation()}
          rx="3"
          ry="3"
          style={{
            fill: fixedColor,
            fillOpacity: 0.85,
            stroke: tamedColor,
            strokeWidth: 1,
          }}
          width={Math.max(props.positionEnd - props.positionStart, 4)}
          x={props.positionStart}
          y={barY}
        />
      )}
    </g>
  )
}

export default PersonHistoryEventNode
