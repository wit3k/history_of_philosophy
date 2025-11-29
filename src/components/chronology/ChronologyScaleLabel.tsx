class TimeScaleLabelProps {
  constructor(
    public year: number,
    public position: number,
    public yearLabelWidth: number,
  ) {}
}

const ChronologyScaleLabel = (props: TimeScaleLabelProps) => {
  return (
    <g>
      <rect
        fill={props.year % 100 ? 'rgba(11, 49, 49, 0.5)' : 'rgba(193, 236, 236, 0.85)'}
        height="40"
        rx="5"
        ry="5"
        width={props.yearLabelWidth}
        x={props.position - props.yearLabelWidth / 2}
        y="0"
      />
      <text
        className="font-mono"
        dominantBaseline="hanging"
        fill={props.year % 100 ? '#ffffffff' : '#000000ff'}
        fontSize="15"
        height="40"
        textAnchor="middle"
        width={props.yearLabelWidth}
        x={props.position}
        y="8"
      >
        {props.year}
      </text>
    </g>
  )
}

export default ChronologyScaleLabel
