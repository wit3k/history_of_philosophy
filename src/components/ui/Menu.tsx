import React, { type Dispatch, type ReactNode, type SetStateAction } from 'react'
import type Collection from '../../data/dto/Collection'
import './Menu.sass'
import UIToggle from './Toggle'

const DESKTOP_MEDIA_QUERY = '(min-width: 768px)'

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
    public displayPersonHistoryEvents: boolean,
    public setDisplayPersonHistoryEvents: Dispatch<SetStateAction<boolean>>,
    public darkMode: boolean,
    public setDarkMode: Dispatch<SetStateAction<boolean>>,
    public collectionsState: Collection[],
    public selectCollection: (collectionId: string) => void,
  ) {}
}

const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = React.useState(() => window.matchMedia(DESKTOP_MEDIA_QUERY).matches)
  React.useEffect(() => {
    const media = window.matchMedia(DESKTOP_MEDIA_QUERY)
    const onChange = () => setIsDesktop(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])
  return isDesktop
}

const Icon = ({ children }: { children: ReactNode }) => (
  <svg
    aria-hidden="true"
    className="size-4"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={1.5}
    viewBox="0 0 24 24"
  >
    {children}
  </svg>
)

const AuthorsIcon = () => (
  <Icon>
    <path d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
  </Icon>
)

const TimelineIcon = () => (
  <Icon>
    <path d="M8 12h8" />
    <circle cx="6" cy="12" r="2.25" />
    <circle cx="18" cy="12" r="2.25" />
  </Icon>
)

const RelationsIcon = () => (
  <Icon>
    <path d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
  </Icon>
)

const PublicationsIcon = () => (
  <Icon>
    <path d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
  </Icon>
)

const ReferencesIcon = () => (
  <Icon>
    <path d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
  </Icon>
)

const HistoryIcon = () => (
  <Icon>
    <path d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
  </Icon>
)

const PersonalEventsIcon = () => (
  <Icon>
    <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
  </Icon>
)

const DarkModeIcon = () => (
  <Icon>
    <path d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
  </Icon>
)

const FiltersIcon = () => (
  <Icon>
    <path d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </Icon>
)

const BarDivider = () => <span aria-hidden="true" className="mx-0.5 h-4 w-px shrink-0 bg-white/25" />

const ToggleButton = ({
  active,
  children,
  disabled,
  label,
  onChange,
}: {
  active: boolean
  children: ReactNode
  disabled?: boolean
  label: string
  onChange: (checked: boolean) => void
}) => (
  <span className="group relative shrink-0">
    <button
      aria-disabled={disabled || undefined}
      aria-label={label}
      aria-pressed={active}
      className={
        'flex size-7 items-center justify-center rounded-md transition ' +
        (disabled
          ? 'cursor-not-allowed text-gray-500'
          : active
            ? 'text-white'
            : 'text-gray-300 hover:bg-white/10 hover:text-white')
      }
      onClick={event => {
        if (!disabled) onChange(!active)
        if (event.detail !== 0) event.currentTarget.blur()
      }}
      style={active && !disabled ? { background: 'linear-gradient(90deg, #ff4f7e, #fe27be)' } : undefined}
      tabIndex={disabled ? -1 : 0}
      type="button"
    >
      {children}
    </button>
    <span className="pointer-events-none absolute top-full left-1/2 z-50 mt-1.5 -translate-x-1/2 rounded-md bg-gray-950 px-2 py-1 text-xs font-medium whitespace-nowrap text-gray-100 opacity-0 shadow-lg ring-1 ring-white/10 group-hover:opacity-100 group-has-[:focus-visible]:opacity-100 group-first:left-0 group-first:translate-x-0 group-last:left-auto group-last:translate-x-0 group-last:right-0">
      {label}
    </span>
  </span>
)

const Menu = (props: MenuProps) => {
  const isDesktop = useIsDesktop()
  const [filtersVisible, setFiltersVisible] = React.useState(() => window.matchMedia(DESKTOP_MEDIA_QUERY).matches)
  const groups: {
    active: boolean
    disabled?: boolean
    icon: ReactNode
    label: string
    onChange: (checked: boolean) => void
  }[][] = [
    [
      {
        active: props.displayAuthors,
        icon: <AuthorsIcon />,
        label: 'Autorzy',
        onChange: props.setDisplayAuthors,
      },
      {
        active: props.displayAuthorsTimeline,
        disabled: !props.displayAuthors,
        icon: <TimelineIcon />,
        label: 'Życiorysy',
        onChange: props.setDisplayAuthorsTimeline,
      },
      {
        active: props.displayAuthorRelations,
        disabled: !props.displayAuthors,
        icon: <RelationsIcon />,
        label: 'Sympatie',
        onChange: props.setDisplayAuthorRelations,
      },
    ],
    [
      {
        active: props.displayPublications,
        icon: <PublicationsIcon />,
        label: 'Publikacje',
        onChange: props.setDisplayPublications,
      },
      {
        active: props.displayPublicationRelations,
        disabled: !props.displayPublications,
        icon: <ReferencesIcon />,
        label: 'Odniesienia',
        onChange: props.setDisplayPublicationRelations,
      },
    ],
    [
      {
        active: props.displayHistoryEvents,
        icon: <HistoryIcon />,
        label: 'Wydarzenia historyczne',
        onChange: props.setDisplayHistoryEvents,
      },
      {
        active: props.displayPersonHistoryEvents,
        disabled: !props.displayAuthors,
        icon: <PersonalEventsIcon />,
        label: 'Wydarzenia osobiste',
        onChange: props.setDisplayPersonHistoryEvents,
      },
    ],
    [
      {
        active: props.darkMode,
        icon: <DarkModeIcon />,
        label: 'Tryb ciemny',
        onChange: props.setDarkMode,
      },
    ],
  ]

  const toolbarShifted = filtersVisible && isDesktop
  const toolbarHidden = filtersVisible && !isDesktop

  return (
    <div>
      <div
        className={`fixed top-2 z-40 transition-[left] duration-300 ${toolbarHidden ? 'hidden ' : ''}${toolbarShifted ? 'left-[308px]' : 'left-2'}`}
      >
        <div
          aria-label="Widok"
          className="flex flex-wrap items-center gap-0.5 rounded-lg border border-white/10 bg-gray-900/75 p-1 shadow-lg backdrop-blur-md"
          role="toolbar"
          style={{ maxWidth: toolbarShifted ? 'calc(100vw - 320px)' : 'calc(100vw - 1rem)' }}
        >
          {!filtersVisible && (
            <>
              <span className="group relative shrink-0">
                <button
                  aria-label="Filtry"
                  className="flex size-7 items-center justify-center rounded-md text-white"
                  onClick={event => {
                    setFiltersVisible(true)
                    if (event.detail !== 0) event.currentTarget.blur()
                  }}
                  style={{ background: 'linear-gradient(90deg, #ff4f7e, #fe27be)' }}
                  type="button"
                >
                  <FiltersIcon />
                </button>
                <span className="pointer-events-none absolute top-full left-0 z-50 mt-1.5 rounded-md bg-gray-950 px-2 py-1 text-xs font-medium whitespace-nowrap text-gray-100 opacity-0 shadow-lg ring-1 ring-white/10 group-hover:opacity-100 group-has-[:focus-visible]:opacity-100">
                  Filtry
                </span>
              </span>
              <BarDivider />
            </>
          )}
          {groups.map((group, groupIndex) => (
            <React.Fragment key={group[0].label}>
              {groupIndex > 0 && <BarDivider />}
              {group.map(item => (
                <ToggleButton
                  active={item.active}
                  disabled={item.disabled}
                  key={item.label}
                  label={item.label}
                  onChange={item.onChange}
                >
                  {item.icon}
                </ToggleButton>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div
        className={`sidebar fixed top-0 bottom-0 left-0 z-30 h-screen w-full bg-black/75 p-2 shadow backdrop-blur-xs md:w-[300px] ${filtersVisible ? '' : 'hidden'}`}
      >
        <div className="h-full text-xl text-gray-100">
          <div className="mt-1 flex items-center rounded-md p-2.5">
            <button
              aria-label="Ukryj filtry"
              className="cursor-pointer rounded-md px-2 py-1 text-slate-900"
              onClick={() => setFiltersVisible(false)}
              style={{ background: 'linear-gradient(90deg, #ff4f7e, #fe27be)' }}
              type="button"
            >
              <FiltersIcon />
            </button>
            <h1 className="ml-3 text-xl font-bold text-[#fe27be]">Filtry</h1>
          </div>

          <hr className="my-2 text-gray-600"></hr>

          <div className="scrollable-area">
            <h1 className="ml-3 text-xl font-bold text-[#fe27be]">Widoczna kolekcja</h1>

            {props.collectionsState.map((collection: Collection) => (
              <UIToggle
                disabled={false}
                key={collection.id}
                label={collection.name}
                offMsg=""
                state={collection.isActive}
                useState={(checked: boolean) => {
                  if (checked) props.selectCollection(collection.id)
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Menu
