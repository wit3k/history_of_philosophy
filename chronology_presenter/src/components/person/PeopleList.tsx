import Person from '../../data/dto/Person';
import PersonNode from './PersonNode';
import type { PersonNodeSettings } from './PersonNode';

class PeopleListProps {
  constructor(
    public peopleList: Person[],
    public isVisibleRange: (from: number, to: number) => boolean,
    public positionByYear: (year: number) => number,
    public rowPosition: (year: number) => number,
    public highlightedAuthor: string,
    public updateHighlightedAuthor: React.Dispatch<
      React.SetStateAction<string>
    >,
    public personNodesSettings: PersonNodeSettings,
    public displayAuthorsTimeline: boolean,
    public authorCallback: (id: string) => void,
  ) {}
}

const PeopleList = (props: PeopleListProps) =>
  props.peopleList
    .filter((person) => props.isVisibleRange(person.born, person.died))
    .map((person, i) => (
      <PersonNode
        key={'person' + person.id + i}
        person={person}
        positionStart={props.positionByYear(person.born)}
        positionEnd={props.positionByYear(person.died)}
        settings={props.personNodesSettings}
        rowPosition={props.rowPosition(person.rowNumber)}
        highlightedAuthor={props.highlightedAuthor}
        updateHighlightedAuthor={props.updateHighlightedAuthor}
        displayAuthorsTimeline={props.displayAuthorsTimeline}
        authorCallback={props.authorCallback}
      />
    ));

export default PeopleList;
