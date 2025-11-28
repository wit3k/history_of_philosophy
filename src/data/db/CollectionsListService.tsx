import Collection from '../dto/Collection'
import { CollectionsListRaw } from '../imported/CollectionsListRaw'

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
      true,
    ),
).sort((p1, p2) => p1.name.localeCompare(p2.name))

const CollectionsListService = {
  getAll: () => [new Collection('0', ':: Nieprzypisane ::', [], [], [], [], [], [], true)].concat(CollectionsList),
}

export default CollectionsListService
