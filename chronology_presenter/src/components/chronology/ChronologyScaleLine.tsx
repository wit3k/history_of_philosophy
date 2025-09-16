class TimeScaleLineProps {
  constructor(
    public year: number,
    public position: number,
    public height: number,
  ) {}
}

const ChronologyScaleLine = (props: TimeScaleLineProps) => {
  return (
    <line
      x1={props.position}
      y1="0"
      x2={props.position}
      y2={props.height}
      stroke={props.year % 100 ? 'rgba(61, 224, 224, 0.2)' : '#c58eb0ff'}
      strokeWidth={props.year % 100 ? '1' : '1'}
      // strokeDasharray={props.year % 100 ? '4 10 1 10' : ''}
      strokeDasharray={props.year % 100 ? '4 1 1 6 1 1' : ''}
    />
  );
};

export default ChronologyScaleLine;
