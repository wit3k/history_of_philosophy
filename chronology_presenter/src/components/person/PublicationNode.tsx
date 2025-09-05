import Publication from '../../data/dto/Publication';
import Person from '../../data/dto/Person';
import getAccentColor from '../../services/Colors';

class PublicationNodeProps {
  constructor(
    public publication: Publication,
    public author: Person,
    public position: number,
    public settings: PublicationNodeSettings,
    public rowPosition: number,
  ) {}
}

export class PublicationNodeSettings {
  constructor(
    public dotSize: number,
    public boxSize: number,
  ) {}
}

export const PublicationNode = (props: PublicationNodeProps) => {
  const dominantColor = getAccentColor(props.author.name);
  return (
    <g onClick={(e) => console.log(e)}>
      <circle
        cx={props.position + props.settings.boxSize / 2}
        cy={props.rowPosition + props.settings.boxSize / 2}
        r={props.settings.dotSize}
        style={{
          fill: dominantColor,
          stroke: 'white',
          strokeWidth: '2',
          fillOpacity: '1',
          strokeOpacity: '1',
        }}
      />
    </g>
  );
};

export default PublicationNode;
