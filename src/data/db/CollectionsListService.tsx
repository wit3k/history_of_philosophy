import Collection from '../dto/Collection'
import { CollectionsListRaw } from '../imported/CollectionsListRaw'

export const ALL_COLLECTIONS_ID = 'all'
export const UNASSIGNED_COLLECTION_ID = '0'

const CollectionsList = CollectionsListRaw.map(
  c =>
    new Collection(
      c.id + '',
      c.name,
      c.includedPeople,
      c.includedLocations,
      c.includedEvents,
      c.includedPublications,
      c.includedReferences,
      c.includedPeopleRelations,
      false,
    ),
).sort((p1, p2) => p1.name.localeCompare(p2.name))

const CollectionsListService = {
  getAll: () =>
    [
      new Collection(ALL_COLLECTIONS_ID, 'Wszystkie', [], [], [], [], [], [], true),
      new Collection(UNASSIGNED_COLLECTION_ID, ':: Nieprzypisane ::', [], [], [], [], [], [], false),
    ].concat(CollectionsList),
}

export default CollectionsListService
