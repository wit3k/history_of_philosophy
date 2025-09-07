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
    public updateHighlightedPublication: React.Dispatch<
      React.SetStateAction<string>
    >,
  ) {}
}

export class PublicationNodeSettings {
  constructor(
    public dotSize: number,
    public boxSize: number,
    public maxLettersColumns: number,
    public maxLettersRows: number,
  ) {}
}

export const PublicationNode = (props: PublicationNodeProps) => {
  const dominantColor = getAccentColor(props.author.name);
  const titleSections = props.publication.title
    .split(' ')
    .map((e) => [e])
    .reduce((acc, word) => {
      const withLastWord = acc[acc.length - 1] + ' ' + word[0];
      return withLastWord.length < props.settings.maxLettersColumns
        ? [...acc.slice(0, -1), withLastWord]
        : [...acc, word[0]];
    });
  const slices = titleSections.slice(0, props.settings.maxLettersRows);
  return (
    <g>
      <g className="tooltip">
        <rect
          x={props.position - 100}
          y={props.rowPosition + props.settings.boxSize / 2}
          rx="3"
          ry="3"
          width="220"
          height={60 + 10 * (slices.length - 1)}
          style={{
            fill: 'white',
            stroke: dominantColor,
            strokeWidth: '2px',
            fillOpacity: '0.5',
            strokeOpacity: '1',
          }}
        />
        <text
          x={props.position - 100}
          y={props.rowPosition + props.settings.boxSize / 2 + 20}
          width="200"
          dominantBaseline="hanging"
          textAnchor="start"
          height={60 + 10 * (slices.length - 1)}
          fontFamily="Verdana"
          fontSize="15"
          fill={dominantColor}
          dy="10"
        >
          {slices.map((s, i) => (
            <tspan x={props.position - 90} dy="0.8em">
              {s}{' '}
              {i == slices.length - 1 && slices.length != titleSections.length
                ? '...'
                : ''}{' '}
            </tspan>
          ))}
        </text>
      </g>

      <circle
        cx={props.position}
        cy={props.rowPosition + props.settings.boxSize / 2}
        r={props.settings.dotSize}
        onMouseMove={() =>
          props.updateHighlightedPublication(props.publication.id)
        }
        onClick={() => props.updateHighlightedPublication(props.publication.id)}
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
