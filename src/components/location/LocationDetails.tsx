import PeopleListService from '../../data/db/PeopleListService'
import PublicationsListService from '../../data/db/PublicationsListService'
import type Location from '../../data/dto/Location'
import type Person from '../../data/dto/Person'
import Modal from '../ui/Modal'

class LocationDetailsProps {
  constructor(
    public peopleList: Person[],
    public currentLocation: Location,
    public displayModal: boolean,
    public setDisplayModal: React.Dispatch<React.SetStateAction<boolean>>,
    public publicationCallback: (id: string) => void,
    public authorCallback: (id: string) => void,
  ) {}
}

const LocationDetails = (props: LocationDetailsProps) => {
  const appBasePath = '/history_of_philosophy/'

  const allPublications = PublicationsListService.getAllByLocationId(props.currentLocation.id).map(p => ({
    date: p.publicationDate,
    personBorn: undefined,
    personDied: undefined,
    publication: p,
  }))

  const allPeople = PeopleListService.getAll()
  const allBirths = allPeople
    .filter(p => p.bornLocation === props.currentLocation.id)
    .map(person => ({
      date: person.born,
      personBorn: person,
      personDied: undefined,
      publication: undefined,
    }))
  const allDeaths = allPeople
    .filter(p => p.diedLocation === props.currentLocation.id)
    .map(person => ({
      date: person.died,
      personBorn: undefined,
      personDied: person,
      publication: undefined,
    }))

  const historyComplete = [...allPublications, ...allBirths, ...allDeaths].sort((p1, p2) => p1.date - p2.date)

  return (
    <Modal displayModal={props.displayModal} setDisplayModal={props.setDisplayModal}>
      <div>
        <div className="text-3xl text-white p-5 ">
          <a
            className="relative z-10 grid h-8 w-8 place-items-center rounded-md text-slate-900 hover:text-white float-left"
            href={
              'https://www.openstreetmap.org/#map=12/' +
              props.currentLocation.coordinates.x +
              '/' +
              props.currentLocation.coordinates.y +
              '&layers=V'
            }
            rel="noopener noreferrer"
            style={{ background: 'linear-gradient(90deg, #ff4f7e, #fe27be)' }}
            target="_blank"
          >
            <svg
              className="size-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <title>Location icon</title>
              <path
                d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
          <span className="pl-5">{props.currentLocation.name} </span>
        </div>
        <div className="p-5 pt-0 italic">
          {props.currentLocation.picture && (
            <img
              alt={props.currentLocation.name}
              className="pr-5 float-left"
              height={200}
              src={appBasePath + '/assets/location/' + props.currentLocation.picture}
              width={480}
            />
          )}
        </div>
        <div className="flex w-full flex-col items-start p-5 pt-10 pb-0">
          {historyComplete.map((historyItem, i) => {
            let icon = null
            let content = null

            if (historyItem.publication) {
              icon = (
                <span className="relative z-10 grid h-8 w-8 place-items-center rounded-full bg-slate-400 text-slate-800">
                  <svg
                    className="size-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <title>Publication icon</title>
                    <path
                      d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              )
              const author = props.peopleList.find(p => p.id == historyItem.publication.authorId)
              content = (
                <small className="mt-2 font-sans text-sm text-slate-300 antialiased">
                  <span className="text-slate-100 -ml-3">{historyItem.date}</span> -{' '}
                  <span
                    className="italic hover:text-pink-700 underline cursor-pointer"
                    onClick={() => props.publicationCallback(historyItem.publication.id)}
                    onKeyDown={() => props.publicationCallback(historyItem.publication.id)}
                  >
                    &bdquo;{historyItem.publication.title}&rdquo;
                  </span>{' '}
                  <span
                    className="text-slate-100 font-black hover:text-pink-700 hover:underline cursor-pointer"
                    onClick={() => props.authorCallback(author!.id)}
                    onKeyDown={() => props.authorCallback(author!.id)}
                  >
                    {author?.name}
                  </span>
                  {historyItem.publication.isbn && ' / ' + historyItem.publication.isbn}
                </small>
              )
            } else if (historyItem.personBorn) {
              icon = (
                <span className="relative z-10 grid h-8 w-8 place-items-center rounded-full bg-slate-400 text-green-800">
                  <svg
                    className="size-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <title>Person born icon</title>
                    <path
                      d="M16 12h4m-2 2v-4M4 18v-1a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Zm8-10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </span>
              )
              content = (
                <small className="mt-2 font-sans text-sm text-slate-300 antialiased">
                  <span className="text-slate-100 -ml-3">{historyItem.date}</span> - Urodził się:{' '}
                  <span
                    className="font-black hover:text-pink-700 hover:underline cursor-pointer"
                    onClick={() => props.authorCallback(historyItem.personBorn.id)}
                    onKeyDown={() => props.authorCallback(historyItem.personBorn.id)}
                  >
                    {historyItem.personBorn.name}
                  </span>{' '}
                </small>
              )
            } else if (historyItem.personDied) {
              icon = (
                <span className="relative z-10 grid h-8 w-8 place-items-center rounded-full bg-slate-400 text-red-800">
                  <svg
                    className="size-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <title>Person died icon</title>
                    <path
                      d="M16 12h4M4 18v-1a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Zm8-10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </span>
              )
              content = (
                <small className="mt-2 font-sans text-sm text-slate-300 antialiased">
                  <span className="text-slate-100 -ml-3">{historyItem.date}</span> - Zmarł:{' '}
                  <span
                    className="font-black hover:text-pink-700 hover:underline cursor-pointer"
                    onClick={() => props.authorCallback(historyItem.personDied.id)}
                    onKeyDown={() => props.authorCallback(historyItem.personDied.id)}
                  >
                    {historyItem.personDied.name}
                  </span>
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

export default LocationDetails
