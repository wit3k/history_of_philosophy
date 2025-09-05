class TimeScaleLineProps {
  constructor(
    public year: number,
    public position: number,
    public height: number,
  ) {}
}

const TimeScaleLine = (props: TimeScaleLineProps) => {
  return (
    <line
      x1={props.position}
      y1="0"
      x2={props.position}
      y2={props.height}
      stroke="#d9d9d9"
      strokeWidth={props.year % 100 ? '1' : '3'}
      strokeDasharray={props.year % 100 ? '4' : ''}
    />
  );
};

export default TimeScaleLine;
