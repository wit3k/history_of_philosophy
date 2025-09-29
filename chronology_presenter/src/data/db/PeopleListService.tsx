import Person from '../dto/Person';
import { PeopleListRaw } from '../imported/PeopleListRaw';

const PeopleListRows: number[] = [];
let PeopleListFirstPersonBirth: number;
let PeopleListLastPersonDeath: number;

const PeopleList = PeopleListRaw.filter(
  (p) => p.born != undefined && p.died != undefined,
)
  .map(
    (p) =>
      new Person(
        p.id,
        p.name,
        p.born,
        p.died,
        p.bornLocation + '',
        p.diedLocation + '',
        p.rowNumber,
        p.thumbnail,
      ),
  )
  .sort((a, b) => a.born - b.born)
  .map((p) => {
    PeopleListFirstPersonBirth = PeopleListFirstPersonBirth
      ? Math.min(PeopleListFirstPersonBirth, p.born * 1)
      : p.born * 1;
    PeopleListLastPersonDeath = PeopleListLastPersonDeath
      ? Math.max(PeopleListLastPersonDeath, p.died * 1)
      : p.died * 1;
    for (let i = 0; i < PeopleListRows.length; i++) {
      if (PeopleListRows[i] + 10 < p.born) {
        PeopleListRows[i] = p.died;
        return { ...p, rowNumber: i };
      }
    }

    PeopleListRows.push(p.died);
    return { ...p, rowNumber: PeopleListRows.length };
  });

const PeopleListService = {
  getAll: () => PeopleList,
  getById: (id: string) => PeopleList.find((p) => p.id == id),
  startingPoint: () => PeopleListFirstPersonBirth,
  endPoint: () => PeopleListLastPersonDeath,
};

export default PeopleListService;
