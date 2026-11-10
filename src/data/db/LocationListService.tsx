import Coordinates from '../../geometry/Coordinates'
import { parseCoordinates } from '../../utils/parseCoordinates'
import Location from '../dto/Location'
import { LocationListRaw } from '../imported/LocationListRaw'

const LocationListRawDB = LocationListRaw.map(o => {
  const coords = parseCoordinates(o.coordinates) ?? new Coordinates(Number.NaN, Number.NaN)
  return new Location(o.id + '', o.name, coords, o.thumbnail!)
})
  .filter(loc => Number.isFinite(loc.coordinates.x) && Number.isFinite(loc.coordinates.y))
  .sort((p1, p2) => p1.name.localeCompare(p2.name))

export const LocationListService = {
  getAll: () => LocationListRawDB,
  getById: (id: string) => LocationListRawDB.find(p => p.id == id),
}

export default LocationListService
