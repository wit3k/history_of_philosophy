class TimeScaleLabelProps {
  constructor(
    public year: number,
    public position: number,
    public yearLabelWidth: number,
  ) {}
}

const TimeScaleLabel = (props: TimeScaleLabelProps) => {
  return (
    <g>
      <rect
        x={props.position - props.yearLabelWidth / 2}
        y="30"
        rx="5"
        ry="5"
        width={props.yearLabelWidth}
        height="40"
        fill={props.year % 100 ? '#cecece' : '#eeeeee'}
      />
      <text
        x={props.position}
        y="55"
        width={props.yearLabelWidth}
        dominantBaseline="middle"
        textAnchor="middle"
        height="40"
        fontFamily="Verdana"
        fontSize="15"
        fill="dark-grey"
      >
        {props.year}
      </text>
    </g>
  );
};

export default TimeScaleLabel;
