/** NocoDB „Dokładność urodzenia/śmierci” — od najdokładniejszej. */
export type DateAccuracy = 'godziny' | 'dni' | 'tygodnie' | 'miesiące' | 'lata' | 'dekady' | 'stulecia'

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

    public bornAccuracy: DateAccuracy | null = null,
    public diedAccuracy: DateAccuracy | null = null,
  ) {}
}

export default Person
