import PublicationReferenceListService from '../../data/db/PublicationReferenceListService';
import PublicationsListService from '../../data/db/PublicationsListService';
import PublicationReferenceNode, {
  PublicationReferenceSettings,
} from './PublicationReferenceNode';

class PublicationReferencesListProps {
  constructor(
    public isVisibleRange: (from: number, to: number) => boolean,
    public positionByYear: (year: number) => number,
    public rowPosition: (rowNumber: number) => number,

    public highlightedAuthor: string,
    public highlightedPublication: string,

    public publicationReferenceSettings: PublicationReferenceSettings,
  ) {}
}

const PublicationReferencesList = (props: PublicationReferencesListProps) =>
  PublicationReferenceListService.map((reference, i) => {
    if (
      reference.from &&
      reference.to &&
      props.isVisibleRange(
        Math.min(
          reference.from?.publicationDate,
          reference.to?.publicationDate,
        ),
        Math.max(
          reference.from?.publicationDate,
          reference.to?.publicationDate,
        ),
      )
    ) {
      const authorFrom = PublicationsListService.getPublicationAuthor(
        reference.from,
      );
      const authorTo = PublicationsListService.getPublicationAuthor(
        reference.to,
      );
      if (authorFrom && authorTo) {
        return (
          <PublicationReferenceNode
            key={'pubref' + reference.id + i}
            publicationReference={reference}
            settings={props.publicationReferenceSettings}
            authorFrom={authorFrom}
            authorTo={authorTo}
            positionStart={props.positionByYear(reference.from.publicationDate)}
            positionEnd={props.positionByYear(reference.to.publicationDate)}
            rowPositionFrom={props.rowPosition(authorFrom.rowNumber)}
            rowPositionTo={props.rowPosition(authorTo.rowNumber)}
            isHighlighted={
              props.highlightedAuthor == authorFrom.id ||
              props.highlightedPublication == reference.from.id
            }
          />
        );
      }
    }
  });

export default PublicationReferencesList;
