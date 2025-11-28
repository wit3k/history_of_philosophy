import './PublicationNode.css'
import Publication from '../../data/dto/Publication'
import Person from '../../data/dto/Person'
import getAccentColor, { getFixedColor, getTamedColor } from '../../services/Colors'

class PublicationNodeProps {
  constructor(
    public publication: Publication,
    public author: Person,
    public position: number,
    public settings: PublicationNodeSettings,
    public rowPosition: number,
    public updateHighlightedPublication: React.Dispatch<React.SetStateAction<string>>,
    public modalHandle: React.Dispatch<React.SetStateAction<boolean>>,
    public setCurrentAuthor: React.Dispatch<React.SetStateAction<Person>>,
    public setCurrentPublication: React.Dispatch<React.SetStateAction<Publication>>,
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
  const words = props.publication.title.split(' ')
  const abbreviation =
    '' +
    words[0].slice(0, 1) +
    (words[1] != undefined ? words[1].slice(0, 1).toUpperCase() : '') +
    (words[2] != undefined ? words[2].slice(0, 1).toUpperCase() : '')
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
          x={props.position - 100}
          y={props.rowPosition + props.settings.boxSize / 2}
          rx="3"
          ry="3"
          width="220"
          height={60 + 10 * (slices.length - 1)}
          style={{
            fill: getTamedColor(props.publication.publicationDate),
            stroke: getFixedColor(props.publication.publicationDate),
            strokeWidth: '2px',
            fillOpacity: '1',
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
          fontSize="14"
          className=" font-mono font-bold "
          fill="white"
          dy="10"
        >
          {slices.map((s, i) => (
            <tspan key={'pubTitle' + props.publication.id + i} x={props.position - 90} dy="0.8em">
              {s} {i == slices.length - 1 && slices.length != titleSections.length ? '...' : ''}{' '}
            </tspan>
          ))}
        </text>
      </g>

      <rect
        x={props.position - props.settings.dotSize}
        y={props.rowPosition}
        rx="2"
        ry="2"
        width={props.settings.dotSize * 2}
        height={props.settings.dotSize * 3}
        style={{
          fill: getTamedColor(props.publication.publicationDate),
          stroke: getFixedColor(props.publication.publicationDate),
          strokeWidth: '2',
          fillOpacity: '1',
          strokeOpacity: '1',
        }}
        onMouseMove={() => props.updateHighlightedPublication(props.publication.id)}
        onTouchStart={() => props.updateHighlightedPublication(props.publication.id)}
        onClick={() => {
          props.setCurrentAuthor(props.author)
          props.setCurrentPublication(props.publication)
          props.modalHandle(true)
        }}
        className="tooltipHover cursor-pointer flex items-center justify-center rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors duration-300"
      />
      <text
        x={props.position}
        y={props.rowPosition}
        width={props.settings.dotSize * 2}
        height={props.settings.dotSize * 3}
        dominantBaseline="hanging"
        textAnchor="middle"
        fontSize="14"
        className="font-mono font-bold tooltipHover cursor-pointer flex items-center justify-center rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors duration-300"
        fill={getFixedColor(props.publication.publicationDate)}
        dy="10"
        onMouseMove={() => props.updateHighlightedPublication(props.publication.id)}
        onTouchStart={() => props.updateHighlightedPublication(props.publication.id)}
        onClick={() => {
          props.setCurrentAuthor(props.author)
          props.setCurrentPublication(props.publication)
          props.modalHandle(true)
        }}
      >
        {abbreviation}
      </text>
    </g>
  )
}

export default PublicationNode
