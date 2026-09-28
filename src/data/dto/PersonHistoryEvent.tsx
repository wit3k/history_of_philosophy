class PersonHistoryEvent {
  constructor(
    public id: string,
    public name: string,
    public type: string,
    public personId: string,
    public locationId: number | null,
    public yearFrom: number | null,
    public yearTo: number | null,
  ) {}
}

export default PersonHistoryEvent
