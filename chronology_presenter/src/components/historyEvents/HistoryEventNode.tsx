import type HistoryEvent from '../../data/dto/HistoryEvent'
import { getTamedColor, getFixedColor } from '../../services/Colors'

class HistoryEventNodeProps {
  constructor(
    public event: HistoryEvent,
    public positionStart: number,
    public positionEnd: number,
    public settings: HistoryEventNodeSettings,
    public rowPosition: number,
  ) {}
}

export class HistoryEventNodeSettings {
  constructor(
    public boxSize: number,
    public rowHeight: number,
  ) {}
}

const HistoryEventNode = (props: HistoryEventNodeProps) => {
  const tamedColor = getTamedColor(props.event.rowNumber)
  const fixedColor = getFixedColor(props.event.rowNumber)

  return (
    <g>
      <rect
        x={props.positionStart}
        y={props.rowPosition - props.event.name.length * 8 - 20}
        rx="4"
        ry="4"
        width={props.positionEnd - props.positionStart + 5}
        height={20000}
        style={{
          fill: tamedColor,
          strokeWidth: '0',
          stroke: fixedColor,
          fillOpacity: 1.0 / (props.event.rowNumber + 1),
        }}
      />

      <rect
        x={props.positionStart}
        y={props.rowPosition}
        rx="0"
        ry="0"
        width={props.positionEnd - props.positionStart + 5}
        height={props.settings.boxSize}
        style={{
          fill: fixedColor,
          strokeWidth: '0',
          fillOpacity: '1',
        }}
      />

      <text
        x={props.positionStart + 10}
        y={props.rowPosition - props.event.name.length * 8 - 4}
        width={props.event.name.length * 10}
        dominantBaseline="central"
        textAnchor="start"
        height="30"
        fontSize="14"
        fill="white"
        className="cursor-pointer font-mono"
        style={{
          textOrientation: 'sideways',
          writingMode: 'sideways-lr',
        }}
      >
        {props.event.name}
      </text>
    </g>
  )
}

export default HistoryEventNode
