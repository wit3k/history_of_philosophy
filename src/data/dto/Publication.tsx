class Publication {
  constructor(
    public id: string,
    public title: string,
    public publicationDate: number,
    public publicationLocation: number,
    public authorId: string,
    public isbn?: string,
    public description?: string,
    public thumbnail?: string,
  ) {}
}

export default Publication
