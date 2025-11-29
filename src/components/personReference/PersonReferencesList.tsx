import type Person from '../../data/dto/Person'
import type PersonReference from '../../data/dto/PersonReference'

import PersonReferenceNode, { type PersonReferenceSettings } from './PersonReferenceNode'

class PersonReferencesListProps {
  constructor(
    public peopleList: Person[],
    public peopleReferenceList: PersonReference[],
    public isVisibleRange: (from: number, to: number) => boolean,
    public positionByYear: (year: number) => number,
    public rowPosition: (rowNumber: number) => number,

    public highlightedAuthor: string,

    public personReferenceSettings: PersonReferenceSettings,
  ) {}
}

const PersonReferencesList = (props: PersonReferencesListProps) =>
  props.peopleReferenceList.map((reference, i) => {
    const personFrom: Person | undefined = props.peopleList.find((p: Person) => p.id == reference.from)
    const personTo: Person | undefined = props.peopleList.find((p: Person) => p.id == reference.to)
    if (
      reference.from &&
      reference.to &&
      personFrom &&
      personTo &&
      props.isVisibleRange(Math.min(personFrom.born, personTo.born), Math.max(personFrom.died, personTo.died))
    ) {
      return (
        <PersonReferenceNode
          authorFrom={personFrom}
          authorTo={personTo}
          highlightsOn={props.highlightedAuthor !== '0'}
          isHighlighted={props.highlightedAuthor === personFrom.id || props.highlightedAuthor === personTo.id}
          key={'personref' + reference.id + i}
          personReference={reference}
          positionEnd={props.positionByYear(personTo.born)}
          positionStart={props.positionByYear(personFrom.born)}
          rowPositionFrom={props.rowPosition(personFrom.rowNumber)}
          rowPositionTo={props.rowPosition(personTo.rowNumber)}
          settings={props.personReferenceSettings}
        />
      )
    }
  })

export default PersonReferencesList
