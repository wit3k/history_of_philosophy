import type Person from '../dto/Person';
import Publication from '../dto/Publication';
import PeopleListService from './PeopleListService';
import { PublicationsListRaw } from '../imported/PublicationsListRaw';

const PublicationsListDB = PublicationsListRaw.map(
  (pub) =>
    new Publication(pub.id, pub.title, pub.publicationDate, pub.authorId),
).sort((p1, p2) => p1.publicationDate - p2.publicationDate);

const bookAuthorsMap: Map<string, Person | undefined> = new Map();

PublicationsListDB.forEach((publication) => {
  bookAuthorsMap.set(
    publication.id,
    PeopleListService.getById(publication.authorId),
  );
});

export const PublicationsListService = {
  getAll: () => PublicationsListDB,
  getById: (id: string) => PublicationsListDB.find((p) => p.id == id),
  getPublicationAuthor: (publication: Publication) =>
    bookAuthorsMap.get(publication.id),
};

export default PublicationsListService;
