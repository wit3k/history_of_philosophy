class TimeScaleLineProps {
  constructor(
    public year: number,
    public position: number,
    public height: number,
  ) {}
}

const ChronologyScaleLine = (props: TimeScaleLineProps) => {
  const currentYear = new Date().getFullYear()
  return (
    <line
      stroke={
        props.year === currentYear
          ? 'white'
          : props.year % 100
            ? 'rgba(61, 224, 224, 0.2)'
            : 'rgba(193, 236, 236, 0.85)'
      }
      strokeDasharray={props.year === currentYear ? '4 1 1 6 1 1' : ''}
      strokeWidth={props.year === currentYear ? '3' : '1'}
      x1={props.position}
      x2={props.position}
      y1="0"
      y2={props.height}
    />
  )
}

export default ChronologyScaleLine
