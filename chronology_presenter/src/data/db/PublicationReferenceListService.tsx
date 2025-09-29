import PublicationReference from '../dto/PublicationReference';
import { PublicationsListService } from './PublicationsListService';
import { PublicationReferenceListRaw } from '../imported/PublicationReferenceListRaw';

const PublicationReferenceListService = PublicationReferenceListRaw.map(
  (pr) =>
    new PublicationReference(
      pr.id + '',
      pr.name,
      PublicationsListService.getById(pr.from + ''),
      PublicationsListService.getById(pr.to + ''),
    ),
).sort((p1, p2) =>
  p1.from && p2.from ? p1.from.publicationDate - p2.from.publicationDate : 0,
);

export default PublicationReferenceListService;
