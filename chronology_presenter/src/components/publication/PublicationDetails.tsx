import { Modal, Button } from 'react-daisyui';
import type Publication from '../../data/dto/Publication';
import type Person from '../../data/dto/Person';
import ReactMarkdown from 'react-markdown';

class PublicationDetailsProps {
  constructor(
    public currentPublication: Publication,
    public currentAuthor: Person,
    public displayModal: boolean,
    public setDisplayModal: React.Dispatch<React.SetStateAction<boolean>>,
  ) {}
}

const PublicationDetails = (props: PublicationDetailsProps) => (
  <Modal open={props.displayModal}>
    <form method="dialog">
      <Button
        size="sm"
        color="ghost"
        shape="circle"
        className="absolute right-2 top-2"
        onClick={() => props.setDisplayModal(false)}
      >
        x
      </Button>
    </form>

    <Modal.Header className="font-bold italic ">
      &bdquo;{props.currentPublication.title}&rdquo;
    </Modal.Header>
    <Modal.Body className="pt-5">
      {props.currentAuthor.name} - {props.currentPublication.publicationDate}{' '}
      {props.currentPublication.isbn && ', ' + props.currentPublication.isbn}
      {props.currentPublication.description && (
        <ReactMarkdown>{props.currentPublication.description}</ReactMarkdown>
      )}
      {props.currentPublication.thumbnail && (
        <img
          src={'/assets/publication/' + props.currentPublication.thumbnail}
          width={500}
          height={700}
          className="pt-5"
        />
      )}
    </Modal.Body>
  </Modal>
);

export default PublicationDetails;
