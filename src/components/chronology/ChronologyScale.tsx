import Coordinates from '../../geometry/Coordinates'
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

const ChronologyScale = (props: ChronologyScaleProps) =>
  props.yearsOnScale
    .filter(props.isVisible)
    .map((year, _) => (
      <ChronologyScaleLabel
        key={`yearLabel${year}`}
        position={new Coordinates(props.positionByYear(year), props.padSize.y - 30)}
        year={year}
        yearLabelWidth={props.yearLabelWidth}
      />
    ))

export default ChronologyScale
