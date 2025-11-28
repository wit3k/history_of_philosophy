import type Coordinates from '../../geometry/Coordinates'

class Location {
  constructor(
    public id: string,
    public name: string,
    public coordinates: Coordinates,
    public picture: string | null,
  ) {}
}

export default Location
