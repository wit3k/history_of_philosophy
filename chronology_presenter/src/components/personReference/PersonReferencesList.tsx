import PersonReferenceListService from '../../data/db/PersonReferenceListService';
import PeopleListService from '../../data/db/PeopleListService';
import PersonReferenceNode, {
  PersonReferenceSettings,
} from './PersonReferenceNode';

class PersonReferencesListProps {
  constructor(
    public isVisibleRange: (from: number, to: number) => boolean,
    public positionByYear: (year: number) => number,
    public rowPosition: (rowNumber: number) => number,

    public highlightedAuthor: string,

    public personReferenceSettings: PersonReferenceSettings,
  ) {}
}

const PersonReferencesList = (props: PersonReferencesListProps) =>
  PersonReferenceListService.map((reference, i) => {
    if (
      reference.from &&
      reference.to &&
      props.isVisibleRange(
        Math.min(reference.from?.born, reference.to?.born),
        Math.max(reference.from?.died, reference.to?.died),
      )
    ) {
      const authorFrom = PeopleListService.getById(reference.from.id);
      const authorTo = PeopleListService.getById(reference.to.id);
      if (authorFrom && authorTo) {
        return (
          <PersonReferenceNode
            key={'personref' + reference.id + i}
            personReference={reference}
            settings={props.personReferenceSettings}
            authorFrom={authorFrom}
            authorTo={authorTo}
            positionStart={props.positionByYear(reference.from.born)}
            positionEnd={props.positionByYear(reference.to.born)}
            rowPositionFrom={props.rowPosition(authorFrom.rowNumber)}
            rowPositionTo={props.rowPosition(authorTo.rowNumber)}
            highlightsOn={props.highlightedAuthor != '0'}
            isHighlighted={
              props.highlightedAuthor == authorFrom.id ||
              props.highlightedAuthor == authorTo.id
            }
          />
        );
      }
    }
  });

export default PersonReferencesList;
