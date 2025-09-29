import type Publication from '../../data/dto/Publication';
import type Person from '../../data/dto/Person';

class PublicationDetailsProps {
  constructor(
    public currentPublication: Publication,
    public currentAuthor: Person,
    public displayModal: boolean,
    public setDisplayModal: React.Dispatch<React.SetStateAction<boolean>>,
  ) {}
}

const PublicationDetails = (props: PublicationDetailsProps) => {
  const appBasePath = '/history_of_philosophy/';

  return (
    <div
      onClick={() => props.setDisplayModal(false)}
      className={
        'fixed inset-0 bg-gray-900/50 backdrop-blur-xs backdrop-brightness-200 ' +
        (props.displayModal ? '' : ' hidden')
      }
    >
      <div className="flex items-center  justify-center h-full">
        <div
          style={{
            background: 'rgba(8, 8, 11, 1)',
          }}
          className="drop-shadow-xl drop-shadow-cyan-500/50 rounded-xl w-[500px] border-r-20 border-pink-700"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <button
            type="button"
            onClick={() => props.setDisplayModal(false)}
            className=" cursor-pointer text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700 -right-5 -top-5 absolute"
          >
            X
          </button>

          <div className="text-3xl text-white italic p-5">
            &bdquo;{props.currentPublication.title}&rdquo;
          </div>
          <div className="p-5">
            {props.currentAuthor.name} -{' '}
            {props.currentPublication.publicationDate},{' '}
            {props.currentPublication.publicationLocation}
            {props.currentPublication.isbn &&
              ', ' + props.currentPublication.isbn}
          </div>
          {props.currentPublication.thumbnail && (
            <img
              src={
                appBasePath +
                '/assets/publication/' +
                props.currentPublication.thumbnail
              }
              width={500}
              height={700}
              className="pt-5"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicationDetails;
