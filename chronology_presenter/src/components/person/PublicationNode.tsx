import './Person.css';
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
    <g onClick={(e) => console.log(props)}>
      <g className="tooltip">
        <rect
          x={props.position - props.publication.title.length * 7.5}
          y={props.rowPosition + props.settings.boxSize / 2}
          rx="3"
          ry="3"
          width={props.publication.title.length * 15}
          height={50}
          style={{
            fill: 'white',
            stroke: dominantColor,
            strokeWidth: '2px',
            fillOpacity: '1',
            strokeOpacity: '1',
          }}
        />
        <text
          x={props.position}
          y={props.rowPosition + props.settings.boxSize / 2 + 20}
          width={props.publication.title.length * 10 + 10}
          dominantBaseline="hanging"
          textAnchor="middle"
          height="40"
          fontFamily="Verdana"
          fontSize="15"
          fill={dominantColor}
        >
          {props.publication.title}
        </text>
      </g>

      <circle
        cx={props.position}
        cy={props.rowPosition + props.settings.boxSize / 2}
        r={props.settings.dotSize}
        style={{
          fill: 'white',
          stroke: dominantColor,
          strokeWidth: '4',
          fillOpacity: '1',
          strokeOpacity: '1',
        }}
        className="tooltipHover cursor-pointer"
      />
    </g>
  );
};

export default PublicationNode;
