import PublicationsListService from '../../data/db/PublicationsListService';
import type Person from '../../data/dto/Person';
import type Publication from '../../data/dto/Publication';
import PublicationNode, { PublicationNodeSettings } from './PublicationNode';

class PublicationsListProps {
  constructor(
    public isVisible: (year: number) => boolean,
    public positionByYear: (year: number) => number,
    public rowPosition: (rowNumber: number) => number,
    public setCurrentAuthor: React.Dispatch<React.SetStateAction<Person>>,
    public setCurrentPublication: React.Dispatch<
      React.SetStateAction<Publication>
    >,
    public updateHighlightedPublication: React.Dispatch<
      React.SetStateAction<string>
    >,
    public publicationNodeSettings: PublicationNodeSettings,
    public modalHandle: React.Dispatch<React.SetStateAction<boolean>>,
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
            modalHandle={props.modalHandle}
            setCurrentAuthor={props.setCurrentAuthor}
            setCurrentPublication={props.setCurrentPublication}
          />
        );
      }
    });

export default PublicationsList;
