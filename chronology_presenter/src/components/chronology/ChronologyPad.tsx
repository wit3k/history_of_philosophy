import type Coordinates from '../../geometry/Coordinates';
import ChronologyScaleLine from './ChronologyScaleLine';
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
  return (
    <g>
      <rect
        x="0%"
        y="0%"
        width={props.padSize.x}
        height={props.padSize.y}
        onClick={props.stateResetHandler}
        onMouseMove={props.stateResetHandler}
        style={{
          fill: 'white',
          stroke: 'none',
          strokeWidth: '0',
          fillOpacity: '0',
          strokeOpacity: '0',
        }}
      />
      {props.yearsOnScale.filter(props.isVisible).map((year, i) => (
        <ChronologyScaleLine
          year={year}
          height={props.padSize.y}
          position={props.positionByYear(year)}
          key={`yearLine` + year + i}
        />
      ))}
    </g>
  );
};

export default ChronologyPad;
