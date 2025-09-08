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
        fill={props.year % 100 ? '#cacacaff' : '#a4a4a4ff'}
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
        fill={props.year % 100 ? '#6b6b6bff' : 'white'}
        className="font-mono"
      >
        {props.year}
      </text>
    </g>
  );
};

export default ChronologyScaleLabel;
