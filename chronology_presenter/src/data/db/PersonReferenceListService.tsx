import PersonReference, { Attitude } from '../dto/PersonReference';
import PeopleListService from './PeopleListService';

const PersonReferenceListService = [
  new PersonReference(
    '0',
    '***',
    Attitude.Positive,
    PeopleListService.getById('3'),
    PeopleListService.getById('1'),
  ),
  new PersonReference(
    '1',
    '***',
    Attitude.Negative,
    PeopleListService.getById('3'),
    PeopleListService.getById('5'),
  ),

  new PersonReference(
    '1',
    '***',
    Attitude.Neutral,
    PeopleListService.getById('3'),
    PeopleListService.getById('1'),
  ),

  new PersonReference(
    '1',
    '***',
    Attitude.Positive,
    PeopleListService.getById('1'),
    PeopleListService.getById('5'),
  ),
  new PersonReference(
    '1',
    '***',
    Attitude.Negative,
    PeopleListService.getById('1'),
    PeopleListService.getById('4'),
  ),

  new PersonReference(
    '1',
    '***',
    Attitude.Neutral,
    PeopleListService.getById('2'),
    PeopleListService.getById('5'),
  ),

  new PersonReference(
    '1',
    '***',
    Attitude.Positive,
    PeopleListService.getById('4'),
    PeopleListService.getById('2'),
  ),

  new PersonReference(
    '1',
    '***',
    Attitude.Negative,
    PeopleListService.getById('4'),
    PeopleListService.getById('5'),
  ),
].sort((p1, p2) =>
  p1.from && p2.from ? (p1.to?.born || 0) - (p1.to?.born || 0) : 0,
);

export default PersonReferenceListService;
