class Person {
  constructor(
    public id: string,
    public name: string,
    public born: number,
    public died: number,

    public bornLocation: string,
    public diedLocation: string,

    public rowNumber: number,

    public thumbnail: string | null,
  ) {}
}

export default Person;
