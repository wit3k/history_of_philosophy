import Location from './Location';
class Publication {
  constructor(
    public id: string,
    public title: string,
    public publicationDate: number,
    public publicationLocation: Location,
    public authorId: string,
    public isbn?: string,
    public description?: string,
    public thumbnail?: string,
  ) {}
}

export default Publication;
