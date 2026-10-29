import { PUBLICATION_TYPES, type PublicationType } from '../data/dto/Publication'

/** Noco SingleSelect colors for „Typ publikacji”. */
export const PUBLICATION_TYPE_COLORS: Record<PublicationType, string> = {
  Artykuł: '#FFD76A',
  Dramat: '#C3ADFF',
  Esej: '#FFA8A8',
  Film: '#FF6B6B',
  Książka: '#36BFFF',
  Wiersz: '#7CE2B8',
}

export const parsePublicationType = (raw: unknown): PublicationType | null => {
  if (typeof raw !== 'string') return null
  return (PUBLICATION_TYPES as readonly string[]).includes(raw) ? (raw as PublicationType) : null
}

export const publicationTypeColor = (type: PublicationType | null | undefined): string =>
  (type && PUBLICATION_TYPE_COLORS[type]) || '#94a3b8'
