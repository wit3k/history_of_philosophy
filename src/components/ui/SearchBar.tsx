import { useEffect, useRef } from 'react'

type SearchBarProps = {
  open: boolean
  query: string
  onQueryChange: (query: string) => void
  onClose: () => void
  darkMode: boolean
}

const SearchBar = ({ open, query, onQueryChange, onClose, darkMode }: SearchBarProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  if (!open) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-3">
      <div
        className={
          'pointer-events-auto flex w-full max-w-md items-center gap-2 rounded-lg border px-3 py-2 shadow-lg backdrop-blur-md ' +
          (darkMode ? 'border-white/10 bg-gray-900/90' : 'border-black/10 bg-white/90')
        }
      >
        <svg
          aria-hidden="true"
          className="size-4 shrink-0 text-[#fe27be]"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          <path d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          ref={inputRef}
          aria-label="Szukaj osób i książek"
          className={
            'min-w-0 flex-1 bg-transparent text-sm outline-none ' +
            (darkMode
              ? 'text-gray-100 placeholder:text-gray-500'
              : 'text-gray-900 placeholder:text-gray-400')
          }
          onChange={e => onQueryChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Escape') {
              e.preventDefault()
              onClose()
            }
          }}
          placeholder="Szukaj osób i książek…"
          type="search"
          value={query}
        />
        <button
          aria-label="Zamknij wyszukiwanie"
          className={
            'rounded-md px-2 py-1 text-xs ' +
            (darkMode
              ? 'text-gray-300 hover:bg-white/10 hover:text-white'
              : 'text-gray-500 hover:bg-black/5 hover:text-gray-900')
          }
          onClick={onClose}
          type="button"
        >
          Esc
        </button>
      </div>
    </div>
  )
}

export default SearchBar
