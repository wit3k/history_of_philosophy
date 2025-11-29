import HistoryEvent from '../dto/HistoryEvent'
import { HistoryEventsListRaw } from '../imported/HistoryEventsListRaw'

const HistoryEventsList = HistoryEventsListRaw.map(
  c => new HistoryEvent(c.id + '', c.name, c.yearFrom, c.yearTo, 0),
).sort((p1, p2) => p1.yearFrom - p2.yearFrom)

const HistoryEventsListService = {
  getAll: () => {
    const rowEnds: number[] = []
    return HistoryEventsList.map((event: HistoryEvent) => {
      for (let i = 0; i < rowEnds.length; i++) {
        if (rowEnds[i] < event.yearFrom) {
          rowEnds[i] = event.yearTo
          return { ...event, rowNumber: i }
        }
      }
      rowEnds.push(event.yearTo)
      return { ...event, rowNumber: rowEnds.length - 1 }
    })
  },
}

export default HistoryEventsListService
