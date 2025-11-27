import Publication from '../dto/Publication';
import { PublicationsListRaw } from '../imported/PublicationsListRaw';

const PublicationsListDB = PublicationsListRaw.map(
  (pub) =>
    new Publication(
      pub.id,
      pub.title,
      pub.publicationDate,
      pub.publicationLocation,
      pub.authorId,
      pub.isbn!,
      pub.description!,
      pub.thumbnail!,
    ),
).sort((p1, p2) => p1.publicationDate - p2.publicationDate);

// const bookAuthorsMap: Map<string, Person | undefined> = new Map();
//
// PublicationsListDB.forEach((publication) => {
//   bookAuthorsMap.set(
//     publication.id,
//     PeopleListService.getById(publication.authorId),
//   );
// });

export const PublicationsListService = {
  getAll: (): Publication[] => PublicationsListDB,
  // getById: (id: string): Publication[] => PublicationsListDB.find((p) => p.id == id),
  // getPublicationAuthor: (publication: Publication) =>
  //   bookAuthorsMap.get(publication.id),
  getAllByAuthor: (authorId: string): Publication[] =>
    PublicationsListDB.filter((p) => p.authorId == authorId),
  getAllByLocationId: (locationId: string): Publication[] =>
    PublicationsListDB.filter((p) => p.publicationLocation + '' == locationId),
};

export default PublicationsListService;
