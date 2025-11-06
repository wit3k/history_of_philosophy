import type Publication from '../../data/dto/Publication';
import type Person from '../../data/dto/Person';
import Modal from '../ui/Modal';
import React from 'react';

class PublicationDetailsProps {
  constructor(
    public currentPublication: Publication,
    public currentAuthor: Person,
    public displayModal: boolean,
    public setDisplayModal: React.Dispatch<React.SetStateAction<boolean>>,
    public locationCallback: (id: string) => void,
    public authorCallback: (id: string) => void,
  ) {}
}

const PublicationDetails = (props: PublicationDetailsProps) => {
  const appBasePath = '/history_of_philosophy/';

  return (
    <Modal
      displayModal={props.displayModal}
      setDisplayModal={props.setDisplayModal}
    >
      <div>
        <div className="text-3xl text-white italic p-5">
          &bdquo;{props.currentPublication.title}&rdquo;
        </div>
        <div className="p-5">
          <span
            onClick={() => props.authorCallback(props.currentAuthor.id)}
            className="text-pink-700 underline cursor-pointer"
          >
            {props.currentAuthor.name}
          </span>{' '}
          - {props.currentPublication.publicationDate}
          {props.currentPublication.publicationLocation && (
            <span>
              ,
              <span
                className="text-pink-700 underline cursor-pointer"
                onClick={() =>
                  props.locationCallback(
                    props.currentPublication.publicationLocation.id,
                  )
                }
              >
                {props.currentPublication.publicationLocation.name}
              </span>
            </span>
          )}
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
    </Modal>
  );
};

export default PublicationDetails;
