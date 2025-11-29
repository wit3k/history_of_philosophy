import type Person from '../../data/dto/Person'
import type { PersonNodeSettings } from './PersonNode'
import PersonNode from './PersonNode'

class PeopleListProps {
  constructor(
    public peopleList: Person[],
    public isVisibleRange: (from: number, to: number) => boolean,
    public positionByYear: (year: number) => number,
    public rowPosition: (year: number) => number,
    public highlightedAuthor: string,
    public updateHighlightedAuthor: React.Dispatch<React.SetStateAction<string>>,
    public personNodesSettings: PersonNodeSettings,
    public displayAuthorsTimeline: boolean,
    public authorCallback: (id: string) => void,
  ) {}
}

const PeopleList = (props: PeopleListProps) =>
  props.peopleList
    .filter(person => props.isVisibleRange(person.born, person.died))
    .map((person, i) => (
      <PersonNode
        authorCallback={props.authorCallback}
        displayAuthorsTimeline={props.displayAuthorsTimeline}
        highlightedAuthor={props.highlightedAuthor}
        key={'person' + person.id + i}
        person={person}
        positionEnd={props.positionByYear(person.died)}
        positionStart={props.positionByYear(person.born)}
        rowPosition={props.rowPosition(person.rowNumber)}
        settings={props.personNodesSettings}
        updateHighlightedAuthor={props.updateHighlightedAuthor}
      />
    ))

export default PeopleList
