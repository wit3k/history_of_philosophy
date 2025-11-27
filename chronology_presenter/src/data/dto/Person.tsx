class Person {
  constructor(
    public id: string,
    public name: string,
    public born: number,
    public died: number,
    public stillAlive: boolean,

    public bornLocation: string,
    public diedLocation: string,

    public nationality: string | null,

    public rowNumber: number,

    public thumbnail: string | null,

    public category: string | null,
  ) {}
}

export default Person;
