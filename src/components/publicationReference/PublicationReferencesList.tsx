import type Person from '../../data/dto/Person'
import type Publication from '../../data/dto/Publication'
import type PublicationReference from '../../data/dto/PublicationReference'
import PublicationReferenceNode, { type PublicationReferenceSettings } from './PublicationReferenceNode'

class PublicationReferencesListProps {
  constructor(
    public publicationReferenceList: PublicationReference[],
    public peopleList: Person[],
    public publicationsList: Publication[],

    public isVisibleRange: (from: number, to: number) => boolean,
    public positionByYear: (year: number) => number,
    public rowPosition: (rowNumber: number) => number,

    public highlightedAuthor: string,
    public highlightedPublication: string,

    public publicationReferenceSettings: PublicationReferenceSettings,
  ) {}
}

const PublicationReferencesList = (props: PublicationReferencesListProps) =>
  props.publicationReferenceList.map((reference, i) => {
    const publicationFrom: Publication = props.publicationsList.find(p => p.id === reference.from + '')!
    const publicationTo: Publication = props.publicationsList.find(p => p.id === reference.to + '')!
    const authorFrom: Person = props.peopleList.find(a => a.id === publicationFrom?.authorId)!
    const authorTo: Person = props.peopleList.find(a => a.id === publicationTo?.authorId)!
    if (
      reference.from &&
      reference.to &&
      publicationFrom &&
      publicationTo &&
      props.isVisibleRange(
        Math.min(publicationFrom.publicationDate, publicationTo.publicationDate),
        Math.max(publicationFrom.publicationDate, publicationTo.publicationDate),
      ) &&
      authorFrom !== undefined &&
      authorTo !== undefined
    ) {
      return (
        <PublicationReferenceNode
          authorFrom={authorFrom}
          authorTo={authorTo}
          isHighlighted={
            props.highlightedAuthor === authorFrom.id ||
            props.highlightedAuthor === authorTo.id ||
            props.highlightedPublication === publicationFrom.id ||
            props.highlightedPublication === publicationTo.id
          }
          key={`pubref${reference.id}`}
          positionEnd={props.positionByYear(publicationTo.publicationDate)}
          positionStart={props.positionByYear(publicationFrom.publicationDate)}
          publicationReference={reference}
          publicationsList={props.publicationsList}
          rowPositionFrom={props.rowPosition(authorFrom.rowNumber)}
          rowPositionTo={props.rowPosition(authorTo.rowNumber)}
          settings={props.publicationReferenceSettings}
        />
      )
    } else {
      return <div key={`pubref${reference.id}`}></div>
    }
  })

export default PublicationReferencesList
