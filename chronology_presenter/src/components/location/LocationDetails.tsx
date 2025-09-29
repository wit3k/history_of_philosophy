import Modal from '../ui/Modal';
import Location from '../../data/dto/Location';
import PublicationsListService from '../../data/db/PublicationsListService';
import PeopleListService from '../../data/db/PeopleListService';

class LocationDetailsProps {
  constructor(
    public currentLocation: Location,
    public displayModal: boolean,
    public setDisplayModal: React.Dispatch<React.SetStateAction<boolean>>,
  ) {}
}

const LocationDetails = (props: LocationDetailsProps) => {
  const appBasePath = '/history_of_philosophy/';

  const allPublications = PublicationsListService.getAllByLocationId(
    props.currentLocation.id,
  ).map((p) => ({
    date: p.publicationDate,
    publication: p,
    personBorn: undefined,
    personDied: undefined,
  }));

  const allPeople = PeopleListService.getAll();
  const allBirths = allPeople
    .filter((p) => p.bornLocation == props.currentLocation.id)
    .map((person) => ({
      date: person.born,
      publication: undefined,
      personBorn: person,
      personDied: undefined,
    }));
  const allDeaths = allPeople
    .filter((p) => p.diedLocation == props.currentLocation.id)
    .map((person) => ({
      date: person.died,
      publication: undefined,
      personBorn: undefined,
      personDied: person,
    }));

  const historyComplete = [...allPublications, ...allBirths, ...allDeaths].sort(
    (p1, p2) => p1.date - p2.date,
  );

  return (
    <Modal
      displayModal={props.displayModal}
      setDisplayModal={props.setDisplayModal}
    >
      <div>
        <div className="text-3xl text-white p-5 ">
          {props.currentLocation.name}
        </div>
        <div className="p-5 pt-0 italic">
          {props.currentLocation.picture && (
            <img
              src={
                appBasePath +
                '/assets/location/' +
                props.currentLocation.picture
              }
              width={200}
              height={200}
              className="pr-5 float-left"
            />
          )}

          <a
            href={
              'https://www.openstreetmap.org/#map=12/' +
              props.currentLocation.coordinates.x +
              '/' +
              props.currentLocation.coordinates.y +
              '&layers=V'
            }
            target="_blank"
            rel="noopener noreferrer"
          >
            {' '}
            {props.currentLocation.coordinates.x} -{' '}
            {props.currentLocation.coordinates.y}
          </a>
        </div>
        <div className="flex w-full flex-col items-start p-5 pt-10 pb-0">
          {historyComplete.map((historyItem, i) => (
            <div>
              {historyItem.publication && (
                <div className="group flex gap-x-6">
                  <div className="relative">
                    {i < historyComplete.length - 1 && (
                      <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-slate-400"></div>
                    )}
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
                  </div>
                  <div className="translate-y-0.5 pb-8 ">
                    <small className="mt-2 font-sans text-sm text-slate-300 antialiased">
                      <span className="text-slate-100 -ml-3">
                        {historyItem.date}
                      </span>{' '}
                      -{' '}
                      <span className="italic">
                        &bdquo;{historyItem.publication.title}&rdquo;
                      </span>{' '}
                      <span className="text-slate-100 font-black">
                        {
                          PublicationsListService.getPublicationAuthor(
                            historyItem.publication,
                          )?.name
                        }
                      </span>
                      {historyItem.publication.isbn &&
                        ' / ' + historyItem.publication.isbn}
                    </small>
                  </div>
                </div>
              )}
              {historyItem.personBorn && (
                <div className="group flex gap-x-6">
                  <div className="relative">
                    {i < historyComplete.length - 1 && (
                      <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-slate-400"></div>
                    )}
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
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M16 12h4m-2 2v-4M4 18v-1a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Zm8-10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                        />
                      </svg>
                    </span>
                  </div>
                  <div className="translate-y-0.5 pb-8 ">
                    <small className="mt-2 font-sans text-sm text-slate-300 antialiased">
                      <span className="text-slate-100 -ml-3">
                        {historyItem.date}
                      </span>{' '}
                      - Urodził się:{' '}
                      <span className="font-black">
                        {historyItem.personBorn.name}
                      </span>{' '}
                    </small>
                  </div>
                </div>
              )}
              {historyItem.personDied && (
                <div className="group flex gap-x-6">
                  <div className="relative">
                    {i < historyComplete.length - 1 && (
                      <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-slate-400"></div>
                    )}
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
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M16 12h4M4 18v-1a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Zm8-10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                        />
                      </svg>
                    </span>
                  </div>
                  <div className="translate-y-0.5 pb-8 ">
                    <small className="mt-2 font-sans text-sm text-slate-300 antialiased">
                      <span className="text-slate-100 -ml-3">
                        {historyItem.date}
                      </span>{' '}
                      - Zmarł:{' '}
                      <span className="font-black">
                        {historyItem.personDied.name}
                      </span>{' '}
                    </small>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default LocationDetails;
