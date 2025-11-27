class Person {
  constructor(
    public id: string,
    public name: string,
    public includedPeople: number[],
    public includedLocations: number[],
    public includedEvents: number[],
    public includedPublications: number[],
    public includedReferences: number[],
    public includedPeopleRelations: number[],
    public isActive: boolean,
  ) {}
}

export default Person;
