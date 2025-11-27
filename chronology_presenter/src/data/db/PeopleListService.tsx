import Person from '../dto/Person';
import { PeopleListRaw } from '../imported/PeopleListRaw';

class CategoryBlockRow {
  constructor(public people: Person[]) {}

  startsAt(): number {
    return Math.min(...this.people.map((p) => p.born));
  }
  endsAt(): number {
    return Math.max(...this.people.map((p) => p.died));
  }
}
class CategoryBlock {
  constructor(
    public name: string,
    public rows: CategoryBlockRow[],
  ) {}

  startsAt(): number {
    return Math.min(...this.rows.map((p) => p.startsAt()));
  }
  endsAt(): number {
    return Math.max(...this.rows.map((p) => p.endsAt()));
  }
}
const PeopleList = PeopleListRaw.filter(
  (p) => p.born != undefined, // && p.died != undefined,
).map(
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
      0,
      p.thumbnail,
      p.category,
    ),
);

const PeopleListService = {
  getAll: () => PeopleList,
  withRowNumbers: (people: Person[]): Person[] => {
    const peopleSorted = people.sort((a, b) => a.born - b.born);
    let blocks: Map<string, CategoryBlock> = new Map<string, CategoryBlock>();
    peopleSorted.forEach((person: Person) => {
      const maybeBlock = blocks.get(person.category ? person.category : '');
      const currentBlock =
        maybeBlock != undefined
          ? maybeBlock
          : new CategoryBlock(person.category ? person.category : '', []);
      let addedToExistingRow = false;
      for (let i = 0; i < currentBlock.rows.length; i++) {
        if (currentBlock.rows[i].endsAt() + 10 < person.born) {
          currentBlock.rows[i].people.push(person);
          addedToExistingRow = true;
          break;
        }
      }
      if (!addedToExistingRow) {
        currentBlock.rows.push(new CategoryBlockRow([person]));
      }
      blocks.set(person.category ? person.category : '', currentBlock);
    });

    let allBlocksArray = Array.from(blocks.entries());//.reverse();
    let categoryBlockShift: number = 1;
    return allBlocksArray.flatMap(([categoryBlockK, categoryBlockV]) => {
      const blocksToReturn = categoryBlockV.rows.flatMap((categoryBlockRowV, categoryBlockRowI) => {
        return categoryBlockRowV.people.map((person) => ({ ...person, rowNumber: categoryBlockShift + categoryBlockRowI }))
      });
      categoryBlockShift += categoryBlockV.rows.length;
      return blocksToReturn;
    });
  },
};

export default PeopleListService;
