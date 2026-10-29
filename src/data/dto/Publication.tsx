export const PUBLICATION_TYPES = ['Książka', 'Artykuł', 'Film', 'Dramat', 'Wiersz', 'Esej'] as const

export type PublicationType = (typeof PUBLICATION_TYPES)[number]

class Publication {
  constructor(
    public id: string,
    public title: string,
    public publicationDate: number,
    public publicationLocation: number,
    public authorId: string,
    public isbn?: string,
    public description?: string,
    public thumbnail?: string,
    public type: PublicationType | null = null,
    public link: string | null = null,
  ) {}
}

export default Publication
