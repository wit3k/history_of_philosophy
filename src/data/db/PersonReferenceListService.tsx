import PersonReference, { Attitude } from '../dto/PersonReference'
import { PersonReferenceListRaw } from '../imported/PersonReferenceListRaw'

const PersonReferenceList = PersonReferenceListRaw.map(
  pr => new PersonReference(pr.id + '', pr.name, Attitude[pr.attitude as keyof typeof Attitude], pr.from, pr.to),
)

const PersonReferenceListService = {
  getAll: () => PersonReferenceList,
}

export default PersonReferenceListService
