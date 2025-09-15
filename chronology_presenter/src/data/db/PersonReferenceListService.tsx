import PersonReference, { Attitude } from '../dto/PersonReference';
import PeopleListService from './PeopleListService';
import { PersonReferenceListRaw } from '../imported/PersonReferenceListRaw';

const PersonReferenceListService = PersonReferenceListRaw.map(
  (pr) =>
    new PersonReference(
      pr.id + '',
      pr.name,
      Attitude[pr.attitude as keyof typeof Attitude],
      PeopleListService.getById(pr.from),
      PeopleListService.getById(pr.to),
    ),
).sort((p1, p2) =>
  p1.from && p2.from ? (p1.to?.born || 0) - (p1.to?.born || 0) : 0,
);

export default PersonReferenceListService;
