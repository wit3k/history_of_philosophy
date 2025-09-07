import PublicationReference from '../dto/PublicationReference';
import { PublicationsListService } from './PublicationsList';

const PublicationReferenceList = [
  new PublicationReference(
    '0',
    '***',
    PublicationsListService.getById('6'),
    PublicationsListService.getById('1'),
  ),
  new PublicationReference(
    '1',
    '***',
    PublicationsListService.getById('6'),
    PublicationsListService.getById('1'),
  ),
  new PublicationReference(
    '2',
    '***',
    PublicationsListService.getById('1'),
    PublicationsListService.getById('8'),
  ),

  new PublicationReference(
    '3',
    '***',
    PublicationsListService.getById('1'),
    PublicationsListService.getById('5'),
  ),
  new PublicationReference(
    '4',
    '***',
    PublicationsListService.getById('2'),
    PublicationsListService.getById('5'),
  ),
  new PublicationReference(
    '5',
    '***',
    PublicationsListService.getById('3'),
    PublicationsListService.getById('5'),
  ),
  new PublicationReference(
    '6',
    '***',
    PublicationsListService.getById('7'),
    PublicationsListService.getById('5'),
  ),

  new PublicationReference(
    '7',
    '***',
    PublicationsListService.getById('2'),
    PublicationsListService.getById('7'),
  ),
  new PublicationReference(
    '8',
    '***',
    PublicationsListService.getById('3'),
    PublicationsListService.getById('4'),
  ),
  new PublicationReference(
    '9',
    '***',
    PublicationsListService.getById('3'),
    PublicationsListService.getById('4'),
  ),
  new PublicationReference(
    '10',
    '***',
    PublicationsListService.getById('7'),
    PublicationsListService.getById('8'),
  ),
  new PublicationReference(
    '11',
    '***',
    PublicationsListService.getById('5'),
    PublicationsListService.getById('8'),
  ),
  new PublicationReference(
    '12',
    '***',
    PublicationsListService.getById('6'),
    PublicationsListService.getById('8'),
  ),
];
// .sort((p1, p2) =>
//   p1.from && p2.from ? p1.from.publicationDate - p2.from.publicationDate : 0,
// );

export default PublicationReferenceList;
