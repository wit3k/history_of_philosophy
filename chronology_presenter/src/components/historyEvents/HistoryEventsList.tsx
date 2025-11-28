import type HistoryEvent from '../../data/dto/HistoryEvent'
import HistoryEventNode, { HistoryEventNodeSettings } from './HistoryEventNode'

class HistoryEventsListProps {
  constructor(
    public historyEvents: HistoryEvent[],
    public isVisibleRange: (from: number, to: number) => boolean,
    public positionByYear: (year: number) => number,
    public rowPosition: (year: number) => number,
    public historyEventNodeSettings: HistoryEventNodeSettings,
  ) {}
}

const HistoryEventsList = (props: HistoryEventsListProps) =>
  props.historyEvents
    .filter((event: HistoryEvent) => props.isVisibleRange(event.yearFrom, event.yearTo))
    .map((event, i) => (
      <HistoryEventNode
        key={'historyEvent' + event.id + i}
        event={event}
        positionStart={props.positionByYear(event.yearFrom)}
        positionEnd={props.positionByYear(event.yearTo)}
        rowPosition={props.rowPosition(event.rowNumber)}
        settings={props.historyEventNodeSettings}
      />
    ))

export default HistoryEventsList
