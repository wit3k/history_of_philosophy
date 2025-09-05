import type Person from '../dto/Person';
import Publication from '../dto/Publication';
import PeopleList from './PeopleList';

const PublicationsList = [
  new Publication('1', 'Pierwszy tytuł', 1840, ['1']),
  new Publication('2', 'Drugi', 1842, ['1']),
  new Publication('3', 'Książka jakaś', 1849, ['1', '2']),
  new Publication('4', 'Traktat', 1844, ['2']),
  new Publication('5', 'Esej', 1844, ['3']),
  new Publication('6', 'Rozprawka', 1855, ['4']),
];

const bookAuthorsMap: Map<string, Person[]> = new Map();

PublicationsList.forEach((publication) => {
  bookAuthorsMap.set(
    publication.id,
    PeopleList.filter((person) => publication.authorId.includes(person.id)),
  );
});

export const getPublicationAuthor = (publication: Publication) =>
  bookAuthorsMap.get(publication.id) ?? [];

export default PublicationsList.sort(
  (p1, p2) => p1.publicationDate - p2.publicationDate,
);
