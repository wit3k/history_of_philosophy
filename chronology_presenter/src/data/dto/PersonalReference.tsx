import type Person from './Person';

enum Attitude {
  Positive,
  Neutral,
  Negative,
}

class PersonanReference {
  constructor(
    public id: string,
    public name: string,
    public from: Person,
    public to: Person,
    public attitude: Attitude,
  ) {}
}

export default PersonanReference;
