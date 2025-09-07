import PublicationsListService from '../../data/db/PublicationsListService';
import PublicationNode, { PublicationNodeSettings } from './PublicationNode';

class PublicationsListProps {
  constructor(
    public isVisible: (year: number) => boolean,
    public positionByYear: (year: number) => number,
    public rowPosition: (rowNumber: number) => number,
    public updateHighlightedPublication: React.Dispatch<
      React.SetStateAction<string>
    >,
    public publicationNodeSettings: PublicationNodeSettings,
  ) {}
}

const PublicationsList = (props: PublicationsListProps) =>
  PublicationsListService.getAll()
    .filter((publication) => props.isVisible(publication.publicationDate))
    .map((publication, _) => ({
      publication,
      author: PublicationsListService.getPublicationAuthor(publication),
    }))
    .map(({ publication, author }, i) => {
      if (author) {
        return (
          <PublicationNode
            key={'publication' + publication.id + i}
            publication={publication}
            author={author}
            position={props.positionByYear(publication.publicationDate)}
            settings={props.publicationNodeSettings}
            rowPosition={props.rowPosition(author.rowNumber)}
            updateHighlightedPublication={props.updateHighlightedPublication}
          />
        );
      }
    });

export default PublicationsList;
