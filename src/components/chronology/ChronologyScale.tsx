import type Coordinates from '../../geometry/Coordinates'
import ChronologyScaleLabel from './ChronologyScaleLabel'

class ChronologyScaleProps {
  constructor(
    public padSize: Coordinates,
    public yearsOnScale: number[],
    public yearLabelWidth: number,

    public isVisible: (year: number) => boolean,
    public positionByYear: (year: number) => number,
  ) {}
}

const ChronologyScale = (props: ChronologyScaleProps) => (
  <div className={'scaleContainer'}>
    <div className={'scale'}>
      <svg
        preserveAspectRatio="xMidYMid meet"
        style={{ height: 60, width: props.padSize.x }}
        viewBox={`0 0 ${props.padSize.x} 60`}
        xmlns="http://www.w3.org/2000/svg"
      >
        {props.yearsOnScale.filter(props.isVisible).map((year, i) => (
          <ChronologyScaleLabel
            key={`yearLabel` + year + i}
            position={props.positionByYear(year)}
            year={year}
            yearLabelWidth={props.yearLabelWidth}
          />
        ))}
      </svg>
    </div>
  </div>
)

export default ChronologyScale
