import type HistoryEvent from '../../data/dto/HistoryEvent'
import ColorsService from '../../services/Colors'

class HistoryEventNodeProps {
  constructor(
    public event: HistoryEvent,
    public positionStart: number,
    public positionEnd: number,
    public settings: HistoryEventNodeSettings,
    public rowPosition: number,
    public darkMode: boolean,
  ) {}
}

export class HistoryEventNodeSettings {
  constructor(
    public boxSize: number,
    public rowHeight: number,
  ) {}
}

const HistoryEventNode = (props: HistoryEventNodeProps) => {
  const tamedColor = ColorsService.getTamedColor(props.event.rowNumber)
  const fixedColor = ColorsService.getFixedColor(props.event.rowNumber)
  const pseudoTransparentColor = props.darkMode
    ? ColorsService.convertToGray(tamedColor)
    : ColorsService.convertToPale(tamedColor)
  return (
    <g>
      <rect
        height={props.event.name.length * 8 + 20 + props.settings.boxSize}
        rx="4"
        ry="4"
        style={{
          fill: tamedColor,
          fillOpacity: 1.0,
          stroke: fixedColor,
          strokeWidth: '0',
        }}
        width={Math.max(props.positionEnd - props.positionStart + 5, 20)}
        x={props.positionStart}
        y={props.rowPosition - props.event.name.length * 8 - 20}
      />

      <rect
        height={20000}
        rx="0"
        ry="0"
        style={{
          fill: pseudoTransparentColor,
          fillOpacity: 1,
          stroke: fixedColor,
          strokeWidth: '0',
        }}
        width={Math.max(props.positionEnd - props.positionStart + 5, 20)}
        x={props.positionStart}
        y={
          props.rowPosition -
          props.event.name.length * 8 -
          20 +
          props.event.name.length * 8 +
          20 +
          props.settings.boxSize
        }
      />

      <rect
        height={props.settings.boxSize}
        rx="0"
        ry="0"
        style={{
          fill: fixedColor,
          fillOpacity: '1',
          strokeWidth: '0',
        }}
        width={props.positionEnd - props.positionStart + 5}
        x={props.positionStart}
        y={props.rowPosition}
      />

      <text
        className="cursor-pointer font-mono"
        dominantBaseline="central"
        fill="black"
        fontSize="14"
        height="30"
        style={{
          textOrientation: 'sideways',
          writingMode: 'sideways-lr',
        }}
        textAnchor="start"
        width={props.event.name.length * 10}
        x={props.positionStart + 10}
        y={props.rowPosition - props.event.name.length * 8 - 4}
      >
        {props.event.name}
      </text>
    </g>
  )
}

export default HistoryEventNode
