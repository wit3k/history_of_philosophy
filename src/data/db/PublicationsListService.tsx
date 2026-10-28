import Publication from '../dto/Publication'
import { PublicationsListRaw } from '../imported/PublicationsListRaw'
import { unhackNocoYear } from '../../utils/years'

const PublicationsListDB = PublicationsListRaw.map(
  pub =>
    new Publication(
      pub.id,
      pub.title,
      unhackNocoYear(pub.publicationDate),
      pub.publicationLocation,
      pub.authorId,
      pub.isbn!,
      pub.description!,
      pub.thumbnail!,
    ),
).sort((p1, p2) => p1.publicationDate - p2.publicationDate)

export const PublicationsListService = {
  getAll: (): Publication[] => PublicationsListDB,
  getAllByAuthor: (authorId: string): Publication[] => PublicationsListDB.filter(p => p.authorId == authorId),
  getAllByLocationId: (locationId: string): Publication[] =>
    PublicationsListDB.filter(p => p.publicationLocation + '' == locationId),
}

export default PublicationsListService
