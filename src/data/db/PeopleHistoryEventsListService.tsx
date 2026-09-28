import PersonHistoryEvent from '../dto/PersonHistoryEvent'
import { PeopleHistoryEventsListRaw } from '../imported/PeopleHistoryEventsListRaw'

const PeopleHistoryEventsList = PeopleHistoryEventsListRaw.filter(event => event.yearFrom != null)
  .map(
    event =>
      new PersonHistoryEvent(
        event.id + '',
        event.name,
        event.type,
        event.personId + '',
        event.locationId,
        event.yearFrom,
        event.yearTo,
      ),
  )
  .sort((a, b) => (a.yearFrom ?? 0) - (b.yearFrom ?? 0))

const PeopleHistoryEventsListService = {
  getAll: (): PersonHistoryEvent[] => PeopleHistoryEventsList,
  getAllByPerson: (personId: string): PersonHistoryEvent[] =>
    PeopleHistoryEventsList.filter(event => event.personId === personId),
}

export default PeopleHistoryEventsListService
