import type Person from '../../data/dto/Person'
import type PersonHistoryEvent from '../../data/dto/PersonHistoryEvent'
import PersonHistoryEventNode, { type PersonHistoryEventNodeSettings } from './PersonHistoryEventNode'

class PersonHistoryEventsListProps {
  constructor(
    public events: PersonHistoryEvent[],
    public peopleList: Person[],
    public isVisibleRange: (from: number, to: number) => boolean,
    public positionByYear: (year: number) => number,
    public rowPosition: (rowNumber: number) => number,
    public personHistoryEventNodeSettings: PersonHistoryEventNodeSettings,
    public modalHandle: React.Dispatch<React.SetStateAction<boolean>>,
    public setCurrentPerson: React.Dispatch<React.SetStateAction<Person>>,
    public setCurrentEvent: React.Dispatch<React.SetStateAction<PersonHistoryEvent>>,
  ) {}
}

const PersonHistoryEventsList = (props: PersonHistoryEventsListProps) =>
  props.events
    .filter(event => event.yearFrom != null)
    .map(event => {
      const yearFrom = event.yearFrom!
      const yearTo = event.yearTo ?? yearFrom
      return { event, yearFrom, yearTo }
    })
    .filter(({ yearFrom, yearTo }) => props.isVisibleRange(yearFrom, yearTo))
    .map(({ event, yearFrom, yearTo }) => {
      const person = props.peopleList.find(p => p.id === event.personId)
      if (!person) return null
      return (
        <PersonHistoryEventNode
          event={event}
          key={`personHistoryEvent${event.id}`}
          modalHandle={props.modalHandle}
          person={person}
          positionEnd={props.positionByYear(yearTo)}
          positionStart={props.positionByYear(yearFrom)}
          rowPosition={props.rowPosition(person.rowNumber)}
          setCurrentEvent={props.setCurrentEvent}
          setCurrentPerson={props.setCurrentPerson}
          settings={props.personHistoryEventNodeSettings}
        />
      )
    })

export default PersonHistoryEventsList
