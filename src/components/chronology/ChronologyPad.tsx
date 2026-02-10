import type Coordinates from '../../geometry/Coordinates'
import ChronologyScaleLine from './ChronologyScaleLine'

class ChronologyPadProps {
  constructor(
    public padSize: Coordinates,
    public stateResetHandler: () => void,
    public yearsOnScale: number[],
    public isVisible: (year: number) => boolean,
    public positionByYear: (year: number) => number,
  ) {}
}

const ChronologyPad = (props: ChronologyPadProps) => {
  const currentYear = new Date().getFullYear()
  return (
    <g>
      <rect
        height={props.padSize.y}
        onClick={props.stateResetHandler}
        onMouseMove={props.stateResetHandler}
        style={{
          fill: 'white',
          fillOpacity: '0',
          stroke: 'none',
          strokeOpacity: '0',
          strokeWidth: '0',
        }}
        width={props.padSize.x}
        x="0%"
        y="0%"
      />
      {props.yearsOnScale.filter(props.isVisible).map((year, i) => (
        <ChronologyScaleLine
          height={props.padSize.y}
          key={`yearLine${year}`}
          position={props.positionByYear(year)}
          year={year}
        />
      ))}
      <ChronologyScaleLine
        height={props.padSize.y}
        key={`yearLineL${currentYear}`}
        position={props.positionByYear(currentYear)}
        year={currentYear}
      />
    </g>
  )
}

export default ChronologyPad
