import './PublicationNode.css'
import type Person from '../../data/dto/Person'
import type Publication from '../../data/dto/Publication'
import ColorsService from '../../services/Colors'

class PublicationNodeProps {
  constructor(
    public publication: Publication,
    public position: number,
    public settings: PublicationNodeSettings,
    public rowPosition: number,

    public updateHighlightedPublication: React.Dispatch<React.SetStateAction<string>>,
    public modalHandle: React.Dispatch<React.SetStateAction<boolean>>,
    public setCurrentAuthor: React.Dispatch<React.SetStateAction<Person>>,
    public setCurrentPublication: React.Dispatch<React.SetStateAction<Publication>>,
    public author?: Person,
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

const PublicationNode = (props: PublicationNodeProps) => {
  const titleSections = props.publication.title
    .split(' ')
    .map(e => [e])
    .reduce((acc, word) => {
      const withLastWord = acc[acc.length - 1] + ' ' + word[0]
      return withLastWord.length < props.settings.maxLettersColumns
        ? [...acc.slice(0, -1), withLastWord]
        : [...acc, word[0]]
    })
  const slices = titleSections.slice(0, props.settings.maxLettersRows)
  return (
    <g>
      <g className="tooltip">
        <rect
          height={60 + 10 * (slices.length - 1)}
          rx="3"
          ry="3"
          style={{
            fill: ColorsService.getTamedColor(props.publication.publicationDate),
            fillOpacity: '1',
            stroke: ColorsService.getFixedColor(props.publication.publicationDate),
            strokeOpacity: '1',
            strokeWidth: '2px',
          }}
          width="220"
          x={props.position - 100}
          y={props.rowPosition + props.settings.boxSize / 2}
        />
        <text
          className=" font-mono font-bold "
          dominantBaseline="hanging"
          dy="10"
          fill={ColorsService.getFixedColor(props.publication.publicationDate)}
          fontSize="14"
          height={60 + 10 * (slices.length - 1)}
          textAnchor="start"
          width="200"
          x={props.position - 100}
          y={props.rowPosition + props.settings.boxSize / 2 + 20}
        >
          {slices.map((s, i) => (
            <tspan dy="0.8em" key={`pubTitle${props.publication.id}${s}`} x={props.position - 90}>
              {s} {i === slices.length - 1 && slices.length !== titleSections.length ? '...' : ''}{' '}
            </tspan>
          ))}
        </text>
      </g>

      <line
        className="tooltipHover cursor-pointer flex items-center justify-center rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors duration-300"
        onClick={() => {
          props.setCurrentAuthor(props.author!)
          props.setCurrentPublication(props.publication)
          props.modalHandle(true)
        }}
        onMouseMove={() => props.updateHighlightedPublication(props.publication.id)}
        onTouchStart={() => props.updateHighlightedPublication(props.publication.id)}
        opacity="1"
        stroke={ColorsService.getFixedColor(props.publication.publicationDate)}
        strokeWidth="10"
        x1={props.position}
        x2={props.position}
        y1={props.rowPosition}
        y2={props.rowPosition + props.settings.boxSize}
      />
    </g>
  )
}

export default PublicationNode
