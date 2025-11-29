import type Person from '../../data/dto/Person'
import type Publication from '../../data/dto/Publication'
import PublicationNode, { type PublicationNodeSettings } from './PublicationNode'

class PublicationsListProps {
  constructor(
    public publicationsList: Publication[],
    public peopleList: Person[],
    public isVisible: (year: number) => boolean,
    public positionByYear: (year: number) => number,
    public rowPosition: (rowNumber: number) => number,
    public setCurrentAuthor: React.Dispatch<React.SetStateAction<Person>>,
    public setCurrentPublication: React.Dispatch<React.SetStateAction<Publication>>,
    public updateHighlightedPublication: React.Dispatch<React.SetStateAction<string>>,
    public publicationNodeSettings: PublicationNodeSettings,
    public modalHandle: React.Dispatch<React.SetStateAction<boolean>>,
  ) {}
}

const PublicationsList = (props: PublicationsListProps) =>
  props.publicationsList
    .filter(publication => props.isVisible(publication.publicationDate))
    .map((publication, _) => ({
      author: props.peopleList.find(p => p.id === publication.authorId),
      publication,
    }))
    .map(({ publication, author }, i) => {
      if (author) {
        return (
          <PublicationNode
            author={author}
            key={'publication' + publication.id + i}
            modalHandle={props.modalHandle}
            position={props.positionByYear(publication.publicationDate)}
            publication={publication}
            rowPosition={props.rowPosition(author.rowNumber)}
            setCurrentAuthor={props.setCurrentAuthor}
            setCurrentPublication={props.setCurrentPublication}
            settings={props.publicationNodeSettings}
            updateHighlightedPublication={props.updateHighlightedPublication}
          />
        )
      }
    })

export default PublicationsList
