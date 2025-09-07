import PeopleListService from '../../data/db/PeopleListService';
import PersonNode from './PersonNode';
import type { PersonNodeSettings } from './PersonNode';

class PeopleListProps {
  constructor(
    public isVisibleRange: (from: number, to: number) => boolean,
    public positionByYear: (year: number) => number,
    public rowPosition: (year: number) => number,
    public updateHighlightedAuthor: React.Dispatch<
      React.SetStateAction<string>
    >,
    public personNodesSettings: PersonNodeSettings,
  ) {}
}

const PeopleList = (props: PeopleListProps) =>
  PeopleListService.filter((person) =>
    props.isVisibleRange(person.born, person.died),
  ).map((person, i) => (
    <PersonNode
      key={'person' + person.id + i}
      person={person}
      positionStart={props.positionByYear(person.born)}
      positionEnd={props.positionByYear(person.died)}
      settings={props.personNodesSettings}
      rowPosition={props.rowPosition(person.rowNumber)}
      updateHighlightedAuthor={props.updateHighlightedAuthor}
    />
  ));

export default PeopleList;
