import type React from 'react'
import type Location from '../../data/dto/Location'
import type Person from '../../data/dto/Person'
import type Publication from '../../data/dto/Publication'
import { formatYear } from '../../utils/years'
import Modal from '../ui/Modal'
import { modalTone } from '../ui/modalTheme'
import PublicationTypeIcon from './PublicationTypeIcon'

class PublicationDetailsProps {
  constructor(
    public locationsList: Location[],
    public currentPublication: Publication,
    public currentAuthor: Person,
    public displayModal: boolean,
    public setDisplayModal: React.Dispatch<React.SetStateAction<boolean>>,
    public locationCallback: (id: string) => void,
    public authorCallback: (id: string) => void,
    public darkMode: boolean = true,
  ) {}
}

const PublicationDetails = (props: PublicationDetailsProps) => {
  const appBasePath = '/history_of_philosophy/'
  const locations = props.locationsList.find(l => l.id === props.currentPublication.publicationLocation + '')
  const tone = modalTone(props.darkMode)
  const pub = props.currentPublication
  const typeLabel = pub.type ?? 'Publikacja'

  return (
    <Modal darkMode={props.darkMode} displayModal={props.displayModal} setDisplayModal={props.setDisplayModal}>
      <div>
        <div className={`flex items-start gap-3 p-5 ${tone.title}`}>
          <PublicationTypeIcon
            className={
              'mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-md text-slate-900 ' +
              (pub.link ? 'hover:opacity-90' : '')
            }
            href={pub.link}
            iconClassName="size-6"
            label={pub.link ? `Otwórz: ${typeLabel}` : typeLabel}
            type={pub.type}
          />
          <div className="text-3xl italic min-w-0">&bdquo;{pub.title}&rdquo;</div>
        </div>
        <div className="p-5 pt-0">
          {pub.type && <div className={`mb-2 text-sm ${tone.muted}`}>{pub.type}</div>}
          <span
            className="text-pink-700 underline cursor-pointer"
            onClick={() => props.authorCallback(props.currentAuthor.id)}
            onKeyDown={() => props.authorCallback(props.currentAuthor.id)}
          >
            {props.currentAuthor.name}
          </span>{' '}
          - {formatYear(pub.publicationDate)}
          {pub.publicationLocation && (
            <span>
              ,
              <span
                className="text-pink-700 underline cursor-pointer"
                onClick={() => props.locationCallback(pub.publicationLocation + '')}
                onKeyDown={() => props.locationCallback(pub.publicationLocation + '')}
              >
                {locations?.name}
              </span>
            </span>
          )}
          {pub.isbn && ', ' + pub.isbn}
        </div>
        {pub.thumbnail && (
          <img
            alt={pub.title}
            className="pt-5"
            height={700}
            src={`${appBasePath}/assets/publication/${pub.thumbnail}`}
            width={500}
          />
        )}
      </div>
    </Modal>
  )
}

export default PublicationDetails
