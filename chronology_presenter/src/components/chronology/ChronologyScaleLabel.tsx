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
        x={props.position - props.yearLabelWidth / 2}
        y="0"
        rx="5"
        ry="5"
        width={props.yearLabelWidth}
        height="40"
        fill={props.year % 100 ? 'rgba(11, 49, 49, 1)' : '#c58eb0ff'}
      />
      <text
        x={props.position}
        y="8"
        width={props.yearLabelWidth}
        dominantBaseline="hanging"
        textAnchor="middle"
        height="40"
        // fontFamily="Verdana"
        fontSize="15"
        fill={props.year % 100 ? '#ffffffff' : '#000000ff'}
        className="font-mono"
      >
        {props.year}
      </text>
    </g>
  )
}

export default ChronologyScaleLabel
