import Coordinates from '../../geometry/Coordinates';
import Location from '../dto/Location';
import { LocationListRaw } from '../imported/LocationListRaw';

const LocationListRawDB = LocationListRaw.map((o) => {
  let coords = o.coordinates.split(';');
  return new Location(
    o.id + '',
    o.name,
    new Coordinates(Number(coords[0]), Number(coords[1])),
    o.thumbnail!,
  );
}).sort((p1, p2) => p1.name.localeCompare(p2.name));

export const LocationListService = {
  getAll: () => LocationListRawDB,
  getById: (id: string) => LocationListRawDB.find((p) => p.id == id),
};

export default LocationListService;
