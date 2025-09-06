import type Publication from './Publication';

class PublicationReference {
  constructor(
    public id: string,
    public name: string,
    public from?: Publication,
    public to?: Publication,
  ) {}
}

export default PublicationReference;
