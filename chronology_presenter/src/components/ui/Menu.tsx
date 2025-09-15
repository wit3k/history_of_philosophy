import UIToggle from './Toggle';
import React from 'react';
import { type Dispatch, type SetStateAction } from 'react';

class MenuProps {
  constructor(
    public displayAuthors: boolean,
    public setDisplayAuthors: Dispatch<SetStateAction<boolean>>,
    public displayAuthorsTimeline: boolean,
    public setDisplayAuthorsTimeline: Dispatch<SetStateAction<boolean>>,
    public displayAuthorRelations: boolean,
    public setDisplayAuthorRelations: Dispatch<SetStateAction<boolean>>,
    public displayPublications: boolean,
    public setDisplayPublications: Dispatch<SetStateAction<boolean>>,
    public displayPublicationRelations: boolean,
    public setDisplayPublicationRelations: Dispatch<SetStateAction<boolean>>,
  ) {}
}

const Menu = (props: MenuProps) => {
  const [isVisible, setIsVisible] = React.useState(false);
  return (
    <div>
      <div
        className={
          'fixed top-0 bottom-0 right-0 mouse-pointer ' +
          (isVisible ? 'hidden' : '')
        }
      >
        <div className="text-gray-100 text-xl">
          <div
            className="p-2.5 mt-1 flex items-center rounded-md cursor-pointer"
            onClick={() => setIsVisible(true)}
          >
            <i
              className="bi bi-app-indicator px-2 py-1 bg-blue-600 rounded-md"
              style={{ background: 'linear-gradient(90deg, #ff4f7e, #fe27be)' }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
                />
              </svg>
            </i>
          </div>
        </div>
      </div>

      <div
        className={
          'sidebar fixed top-0 bottom-0 lg:right-0 right-[-300px] duration-1000 p-2 w-[300px] overflow-y-auto shadow h-screen bg-gray-900/50 backdrop-blur-md ' +
          (isVisible ? '' : 'hidden')
        }
      >
        <div className="text-gray-100 text-xl">
          <div
            className="p-2.5 mt-1 flex items-center rounded-md cursor-pointer"
            onClick={() => setIsVisible(false)}
          >
            <i
              className="bi bi-app-indicator px-2 py-1 bg-blue-600 rounded-md"
              style={{ background: 'linear-gradient(90deg, #ff4f7e, #fe27be)' }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
                />
              </svg>
            </i>

            <h1 className="text-[15px]  ml-3 text-xl text-gray-200 font-bold">
              Ustawienia
            </h1>
            <i className="bi bi-x ml-20 cursor-pointer lg:hidden"></i>
          </div>

          <hr className="my-2 text-gray-600"></hr>
          <UIToggle
            label="Autorzy"
            state={props.displayAuthors}
            useState={props.setDisplayAuthors}
            offMsg=""
          />
        </div>

        <div className="sm:col-span-4">
          <UIToggle
            label="Życiorysy"
            state={props.displayAuthorsTimeline}
            useState={props.setDisplayAuthorsTimeline}
            offMsg=""
            disabled={!props.displayAuthors}
          />
        </div>
        <div className="sm:col-span-4">
          <UIToggle
            label="Sympatie"
            state={props.displayAuthorRelations}
            useState={props.setDisplayAuthorRelations}
            offMsg=""
            disabled={!props.displayAuthors}
          />
        </div>
        <div className="sm:col-span-4">
          <UIToggle
            label="Publikacje"
            state={props.displayPublications}
            useState={props.setDisplayPublications}
            offMsg=""
          />
        </div>
        <div className="sm:col-span-4">
          <UIToggle
            label="Odniesienia"
            state={props.displayPublicationRelations}
            useState={props.setDisplayPublicationRelations}
            offMsg=""
            disabled={!props.displayPublications}
          />
        </div>
      </div>
    </div>
  );
};

export default Menu;
