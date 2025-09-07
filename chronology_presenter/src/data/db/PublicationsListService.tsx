import type Person from '../dto/Person';
import Publication from '../dto/Publication';
import PeopleList from './PeopleListService';

const PublicationsListDB = [
  new Publication('1', 'Pierwszy tytuł', 1840, '1'),
  new Publication('2', 'Drugi', 1842, '1'),
  new Publication('3', 'Książka jakaś', 1849, '1'),
  new Publication('4', 'Książka jakaś', 1849, '2'),
  new Publication('5', 'Traktat', 1874, '2'),
  new Publication('6', 'Esej', 1821, '3'),
  new Publication('7', 'Rozprawka', 1855, '4'),
  new Publication(
    '8',
    'Publikacja o bardzo długim, zawiłym i wielomodułowym tytule. Pierwsza kreww.',
    1883,
    '5',
  ),
].sort((p1, p2) => p1.publicationDate - p2.publicationDate);

const bookAuthorsMap: Map<string, Person | undefined> = new Map();

PublicationsListDB.forEach((publication) => {
  bookAuthorsMap.set(
    publication.id,
    PeopleList.find((person) => publication.authorId == person.id),
  );
});

export const PublicationsListService = {
  getAll: () => PublicationsListDB,
  getById: (id: string) => PublicationsListDB.find((p) => p.id == id),
  getPublicationAuthor: (publication: Publication) =>
    bookAuthorsMap.get(publication.id),
};

export default PublicationsListService;
