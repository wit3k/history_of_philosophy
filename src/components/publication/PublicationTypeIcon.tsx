import type { PublicationType } from '../../data/dto/Publication'
import { publicationTypeColor } from '../../utils/publicationType'

const pathForType = (type: PublicationType | null | undefined): string => {
  switch (type) {
    case 'Artykuł':
      // Document / newspaper
      return 'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z'
    case 'Film':
      // Film / play
      return 'm15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z'
    case 'Dramat':
      // Ticket / stage
      return 'M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z'
    case 'Wiersz':
      // Feather / quill
      return 'm16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10'
    case 'Esej':
      // Text lines
      return 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12'
    case 'Książka':
    default:
      // Open book
      return 'M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25'
  }
}

type PublicationTypeIconProps = {
  type?: PublicationType | null
  /** Accessible / title label */
  label?: string
  className?: string
  /** Icon glyph size (Tailwind size-* or arbitrary). */
  iconClassName?: string
  href?: string | null
}

const PublicationTypeIcon = ({
  type,
  label,
  className = 'relative z-10 grid h-8 w-8 place-items-center rounded-full text-slate-900',
  iconClassName = 'size-5',
  href,
}: PublicationTypeIconProps) => {
  const color = publicationTypeColor(type)
  const title = label ?? type ?? 'Publikacja'
  const glyph = (
    <svg
      aria-hidden={href ? undefined : true}
      className={iconClassName}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <path d={pathForType(type)} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )

  const style = { background: color }

  if (href) {
    return (
      <a
        aria-label={title}
        className={`${className} hover:opacity-90`}
        href={href}
        rel="noopener noreferrer"
        style={style}
        target="_blank"
      >
        {glyph}
      </a>
    )
  }

  return (
    <span className={className} style={style} title={title}>
      {glyph}
    </span>
  )
}

export default PublicationTypeIcon
