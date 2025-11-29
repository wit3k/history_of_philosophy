import React, { type Dispatch, type SetStateAction } from 'react'
import UIToggle from './Toggle'
import './Menu.sass'
import type Collection from '../../data/dto/Collection'

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
    public displayHistoryEvents: boolean,
    public setDisplayHistoryEvents: Dispatch<SetStateAction<boolean>>,
    public darkMode: boolean,
    public setDarkMode: Dispatch<SetStateAction<boolean>>,
    public collectionsState: Collection[],
    public toggleCollectionsState: (collectionId: string, checked: boolean) => void,
  ) {}
}

const Menu = (props: MenuProps) => {
  const [settingsVisible, setSettingsVisible] = React.useState(false)
  const [filtersVisible, setFiltersVisible] = React.useState(false)
  return (
    <div>
      <div
        className={
          'sidebar fixed top-0 bottom-0 lg:left-0  p-2  ' + (settingsVisible || filtersVisible ? 'hidden' : '')
        }
      >
        <div className="text-gray-100 text-xl">
          <div
            className="p-2.5 mt-1 flex items-center rounded-md cursor-pointer"
            onClick={() => setSettingsVisible(true)}
          >
            <i
              className="bi bi-app-indicator px-2 py-1 bg-blue-600 rounded-md text-slate-900 hover:text-white"
              style={{ background: 'linear-gradient(90deg, #ff4f7e, #fe27be)' }}
            >
              <svg
                className="size-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </i>
          </div>
        </div>
      </div>
      <div
        className={
          'sidebar fixed top-0 bottom-0 lg:left-15  p-2  ' + (settingsVisible || filtersVisible ? 'hidden' : '')
        }
      >
        <div className="text-gray-100 text-xl">
          <div
            className="p-2.5 mt-1 flex items-center rounded-md cursor-pointer"
            onClick={() => setFiltersVisible(true)}
          >
            <i
              className="bi bi-app-indicator px-2 py-1 bg-blue-600 rounded-md text-slate-900 hover:text-white"
              style={{ background: 'linear-gradient(90deg, #ff4f7e, #fe27be)' }}
            >
              <svg
                className="size-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z" />
                <path
                  clipRule="evenodd"
                  d="M21.707 21.707a1 1 0 0 1-1.414 0l-3.5-3.5a1 1 0 0 1 1.414-1.414l3.5 3.5a1 1 0 0 1 0 1.414Z"
                  fillRule="evenodd"
                />
              </svg>
            </i>
          </div>
        </div>
      </div>

      <div
        className={
          'sidebar fixed top-0 bottom-0 lg:left-0 duration-1000 p-2 w-full md:w-[300px] shadow h-screen bg-gray-900/50 backdrop-blur-xs backdrop-brightness-200 border-r-20 border-pink-700 ' +
          (filtersVisible ? '' : 'hidden')
        }
      >
        <div className="text-gray-100 text-xl h-full">
          <div
            className="p-2.5 mt-1 flex items-center rounded-md cursor-pointer"
            onClick={() => setFiltersVisible(false)}
          >
            <i
              className="bi bi-app-indicator px-2 py-1 bg-blue-600 rounded-md"
              style={{ background: 'linear-gradient(90deg, #ff4f7e, #fe27be)' }}
            >
              <svg
                className="size-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z" />
                <path
                  clipRule="evenodd"
                  d="M21.707 21.707a1 1 0 0 1-1.414 0l-3.5-3.5a1 1 0 0 1 1.414-1.414l3.5 3.5a1 1 0 0 1 0 1.414Z"
                  fillRule="evenodd"
                />
              </svg>
            </i>

            <h1 className="text-[15px]  ml-3 text-xl text-gray-200 font-bold">Filtry</h1>
            {/* <i className="bi bi-x ml-20 cursor-pointer lg:hidden"></i> */}
          </div>

          <hr className="my-2 text-gray-600"></hr>

          <div className="scrollable-area">
            <h1 className="text-[15px]  ml-3 text-xl text-gray-200 font-bold">Widoczne kolekcje</h1>

            {props.collectionsState.map((collection: Collection, i: number) => (
              <UIToggle
                disabled={false}
                key={'collection' + collection.id + i}
                label={collection.name}
                offMsg=""
                state={collection.isActive}
                useState={(checked: boolean) => props.toggleCollectionsState(collection.id, checked)}
              />
            ))}
          </div>
        </div>
      </div>

      <div
        className={
          'sidebar fixed top-0 bottom-0 lg:left-0 duration-1000 p-2 w-full md:w-[300px] shadow h-screen bg-gray-900/50 backdrop-blur-xs backdrop-brightness-200 border-r-20 border-pink-700 ' +
          (settingsVisible ? '' : 'hidden')
        }
      >
        <div className="text-gray-100 text-xl">
          <div
            className="p-2.5 mt-1 flex items-center rounded-md cursor-pointer"
            onClick={() => setSettingsVisible(false)}
          >
            <i
              className="bi bi-app-indicator px-2 py-1 bg-blue-600 rounded-md"
              style={{ background: 'linear-gradient(90deg, #ff4f7e, #fe27be)' }}
            >
              <svg
                className="size-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </i>

            <h1 className="text-[15px]  ml-3 text-xl text-gray-200 font-bold">Ustawienia</h1>
            {/* <i className="bi bi-x ml-20 cursor-pointer lg:hidden"></i> */}
          </div>

          <hr className="my-2 text-gray-600"></hr>
          <UIToggle label="Autorzy" offMsg="" state={props.displayAuthors} useState={props.setDisplayAuthors} />
        </div>

        <div className="sm:col-span-4">
          <UIToggle
            disabled={!props.displayAuthors}
            label="Życiorysy"
            offMsg=""
            state={props.displayAuthorsTimeline}
            useState={props.setDisplayAuthorsTimeline}
          />
        </div>
        <div className="sm:col-span-4">
          <UIToggle
            disabled={!props.displayAuthors}
            label="Sympatie"
            offMsg=""
            state={props.displayAuthorRelations}
            useState={props.setDisplayAuthorRelations}
          />
        </div>
        <div className="sm:col-span-4">
          <UIToggle
            label="Publikacje"
            offMsg=""
            state={props.displayPublications}
            useState={props.setDisplayPublications}
          />
        </div>
        <div className="sm:col-span-4">
          <UIToggle
            disabled={!props.displayPublications}
            label="Odniesienia"
            offMsg=""
            state={props.displayPublicationRelations}
            useState={props.setDisplayPublicationRelations}
          />
        </div>
        <div className="sm:col-span-4">
          <UIToggle
            label="Wydarzenia historyczne"
            offMsg=""
            state={props.displayHistoryEvents}
            useState={props.setDisplayHistoryEvents}
          />
        </div>
        <div className="sm:col-span-4">
          <UIToggle label="Tryb ciemny" offMsg="" state={props.darkMode} useState={props.setDarkMode} />
        </div>
      </div>
    </div>
  )
}

export default Menu
