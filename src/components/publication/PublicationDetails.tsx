import type React from 'react'
import type Location from '../../data/dto/Location'
import type Person from '../../data/dto/Person'
import type Publication from '../../data/dto/Publication'
import Modal from '../ui/Modal'

class PublicationDetailsProps {
  constructor(
    public locationsList: Location[],
    public currentPublication: Publication,
    public currentAuthor: Person,
    public displayModal: boolean,
    public setDisplayModal: React.Dispatch<React.SetStateAction<boolean>>,
    public locationCallback: (id: string) => void,
    public authorCallback: (id: string) => void,
  ) {}
}

const PublicationDetails = (props: PublicationDetailsProps) => {
  const appBasePath = '/history_of_philosophy/'
  const locations = props.locationsList.find(l => l.id == props.currentPublication.publicationLocation + '')

  return (
    <Modal displayModal={props.displayModal} setDisplayModal={props.setDisplayModal}>
      <div>
        <div className="text-3xl text-white italic p-5">&bdquo;{props.currentPublication.title}&rdquo;</div>
        <div className="p-5">
          <span
            className="text-pink-700 underline cursor-pointer"
            onClick={() => props.authorCallback(props.currentAuthor.id)}
          >
            {props.currentAuthor.name}
          </span>{' '}
          - {props.currentPublication.publicationDate}
          {props.currentPublication.publicationLocation && (
            <span>
              ,
              <span
                className="text-pink-700 underline cursor-pointer"
                onClick={() => props.locationCallback(props.currentPublication.publicationLocation + '')}
              >
                {locations?.name}
              </span>
            </span>
          )}
          {props.currentPublication.isbn && ', ' + props.currentPublication.isbn}
        </div>
        {props.currentPublication.thumbnail && (
          <img
            className="pt-5"
            height={700}
            src={appBasePath + '/assets/publication/' + props.currentPublication.thumbnail}
            width={500}
          />
        )}
      </div>
    </Modal>
  )
}

export default PublicationDetails
