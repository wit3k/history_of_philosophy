import type Person from './Person';

export enum Attitude {
  Positive,
  Neutral,
  Negative,
}

class PersonReference {
  constructor(
    public id: string,
    public name: string,
    public attitude: Attitude,
    public from: string,
    public to: string,
  ) {}
}

export default PersonReference;
