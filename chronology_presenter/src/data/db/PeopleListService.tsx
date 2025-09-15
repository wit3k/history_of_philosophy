import Person from '../dto/Person';
import { PeopleListRaw } from '../imported/PeopleListRaw';

const PeopleList = PeopleListRaw.map(
  (p) => new Person(p.id, p.name, p.born, p.died, p.rowNumber, p.thumbnail),
);

const PeopleListService = {
  getAll: () => PeopleList,
  getById: (id: string) => PeopleList.find((p) => p.id == id),
};

export default PeopleListService;
