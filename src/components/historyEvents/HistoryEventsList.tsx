import type HistoryEvent from '../../data/dto/HistoryEvent'
import HistoryEventNode, { type HistoryEventNodeSettings } from './HistoryEventNode'

class HistoryEventsListProps {
  constructor(
    public historyEvents: HistoryEvent[],
    public isVisibleRange: (from: number, to: number) => boolean,
    public positionByYear: (year: number) => number,
    public rowPosition: (year: number) => number,
    public historyEventNodeSettings: HistoryEventNodeSettings,
    public darkMode: boolean,
  ) {}
}

const HistoryEventsList = (props: HistoryEventsListProps) =>
  props.historyEvents
    .filter((event: HistoryEvent) => props.isVisibleRange(event.yearFrom, event.yearTo))
    .map((event, i) => (
      <HistoryEventNode
        darkMode={props.darkMode}
        event={event}
        key={`historyEvent${event.id}${i}`}
        positionEnd={props.positionByYear(event.yearTo)}
        positionStart={props.positionByYear(event.yearFrom)}
        rowPosition={props.rowPosition(event.rowNumber)}
        settings={props.historyEventNodeSettings}
      />
    ))

export default HistoryEventsList
