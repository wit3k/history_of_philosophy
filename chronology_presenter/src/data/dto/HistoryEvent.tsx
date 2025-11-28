class HistoryEvent {
  constructor(
    public id: string,
    public name: string,
    public yearFrom: number,
    public yearTo: number,
    public rowNumber: number,
  ) {}
}

export default HistoryEvent;
