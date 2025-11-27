import PublicationReference from '../dto/PublicationReference';
import { PublicationReferenceListRaw } from '../imported/PublicationReferenceListRaw';

const PublicationReferenceList = PublicationReferenceListRaw.map(
  (pr) => new PublicationReference(pr.id + '', pr.name, pr.from, pr.to),
);

const PublicationReferenceListService = {
  getAll: () => PublicationReferenceList,
};

export default PublicationReferenceListService;
