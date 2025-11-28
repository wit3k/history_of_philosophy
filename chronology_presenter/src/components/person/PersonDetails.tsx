import type Person from '../../data/dto/Person'
import Modal from '../ui/Modal'
import React from 'react'
import PublicationsListService from '../../data/db/PublicationsListService'
import LocationListService from '../../data/db/LocationListService'

class PersonDetailsProps {
  constructor(
    public currentPerson: Person,
    public displayModal: boolean,
    public setDisplayModal: React.Dispatch<React.SetStateAction<boolean>>,
    public locationCallback: (id: string) => void,
    public publicationCallback: (id: string) => void,
  ) {}
}

const PersonDetails = (props: PersonDetailsProps) => {
  const appBasePath = '/history_of_philosophy/'

  const allPublications = PublicationsListService.getAllByAuthor(props.currentPerson.id).map(p => ({
    date: p.publicationDate,
    publication: p,
  }))

  const historyComplete = [...allPublications].sort((p1, p2) => p1.date - p2.date)

  return (
    <Modal displayModal={props.displayModal} setDisplayModal={props.setDisplayModal}>
      <div>
        <div className="text-3xl text-white italic p-5 pb-0">{props.currentPerson.name}</div>
        <div className="p-5">
          {props.currentPerson.thumbnail && (
            <img
              src={appBasePath + '/assets/person_big/' + props.currentPerson.thumbnail}
              width={200}
              height={300}
              className="pr-5 pt-0 float-left"
            />
          )}
          Urodzony: {props.currentPerson.born} -{' '}
          <span
            className="hover:text-pink-700 underline cursor-pointer"
            onClick={() => props.locationCallback(props.currentPerson.bornLocation)}
          >
            {LocationListService.getById(props.currentPerson.bornLocation)?.name}
          </span>{' '}
          <br />
          {props.currentPerson.stillAlive ? (
            <span>Wciąż żyje</span>
          ) : (
            <span>
              Zmarł: {props.currentPerson.died} -{' '}
              <span
                className="hover:text-pink-700 underline cursor-pointer"
                onClick={() => props.locationCallback(props.currentPerson.diedLocation)}
              >
                {LocationListService.getById(props.currentPerson.diedLocation)?.name}
              </span>
            </span>
          )}
          <br />({props.currentPerson.died - props.currentPerson.born} lat)
          <br />
          {props.currentPerson.nationality}
          <br />
        </div>
        <div className="flex w-full flex-col items-start p-5 pt-10 pb-0">
          {historyComplete.map((historyItem, i) => {
            let icon = null
            let content = null

            if (historyItem.publication) {
              icon = (
                <span className="relative z-10 grid h-8 w-8 place-items-center rounded-full bg-slate-400 text-slate-800">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="size-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
                    />
                  </svg>
                </span>
              )
              content = (
                <small className="mt-2 font-sans text-sm text-slate-300 antialiased">
                  <span className="text-slate-100 -ml-3">{historyItem.date}</span> -{' '}
                  <span
                    onClick={() => props.publicationCallback(historyItem.publication.id)}
                    className="italic hover:text-pink-700 underline cursor-pointer"
                  >
                    &bdquo;{historyItem.publication.title}&rdquo;
                  </span>
                  {' / '}
                  {historyItem.publication?.publicationLocation && (
                    <span
                      onClick={() => props.locationCallback(historyItem.publication.publicationLocation!.id)}
                      className="text-slate-100 hover:text-pink-700 underline cursor-pointer"
                    >
                      {historyItem.publication?.publicationLocation.name}
                    </span>
                  )}
                  {historyItem.publication.isbn && ' / ' + historyItem.publication.isbn}
                </small>
              )
            }

            if (!icon || !content) return null

            return (
              <div className="group flex gap-x-6" key={i}>
                <div className="relative">
                  {i < historyComplete.length - 1 && (
                    <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-slate-400"></div>
                  )}
                  {icon}
                </div>
                <div className="translate-y-0.5 pb-8 ">{content}</div>
              </div>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}

export default PersonDetails
