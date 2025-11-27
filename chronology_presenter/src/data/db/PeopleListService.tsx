import Person from '../dto/Person';
import { PeopleListRaw } from '../imported/PeopleListRaw';

const PeopleList = PeopleListRaw.filter(
  (p) => p.born != undefined, // && p.died != undefined,
)
  .map(
    (p) =>
      new Person(
        p.id,
        p.name,
        p.born,
        p.died ? p.died : new Date().getFullYear() * 1,
        p.stillAlive,
        p.bornLocation + '',
        p.diedLocation + '',
        p.nationality,
        p.rowNumber,
        p.thumbnail,
      ),
  )
  .sort((a, b) => a.born - b.born);

const PeopleListService = {
  getAll: () => PeopleList,
  withRowNumbers: (people: Person[]) => {
    const PeopleListRows: number[] = [];
    return people.map((p) => {
      for (let i = 0; i < PeopleListRows.length; i++) {
        if (PeopleListRows[i] + 10 < p.born) {
          PeopleListRows[i] = p.died;
          return { ...p, rowNumber: i };
        }
      }

      PeopleListRows.push(p.died);
      return { ...p, rowNumber: PeopleListRows.length };
    });
  },
};

export default PeopleListService;
