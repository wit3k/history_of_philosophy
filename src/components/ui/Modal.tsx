import type { JSX } from 'react'

class ModalProps {
  constructor(
    public displayModal: boolean,
    public setDisplayModal: React.Dispatch<React.SetStateAction<boolean>>,
    public children: JSX.Element,
    public darkMode: boolean = true,
  ) {}
}

const Modal: React.FC<ModalProps> = (props: ModalProps) => {
  const dark = props.darkMode ?? true
  return (
    <div
      className={
        'fixed inset-0 z-[100] ' +
        (dark
          ? 'bg-gray-900/50 backdrop-blur-xs backdrop-brightness-200 '
          : 'bg-black/25 backdrop-blur-xs ') +
        (props.displayModal ? '' : ' hidden')
      }
      onClick={() => props.setDisplayModal(false)}
    >
      <div className="flex h-screen items-center justify-center overflow-y-scroll">
        <div
          className={
            'drop-shadow-xl m-auto h-fit w-[500px] rounded-lg border-r-20 border-pink-700 ' +
            (dark ? 'drop-shadow-cyan-500/50' : 'drop-shadow-pink-500/20')
          }
          onClick={e => {
            e.stopPropagation()
          }}
          style={{
            background: dark ? 'rgba(8, 8, 11, 1)' : 'rgba(255, 255, 255, 0.97)',
            color: dark ? undefined : '#111827',
          }}
        >
          <button
            className={
              'absolute -right-7 top-0 me-2 mb-2 cursor-pointer rounded-lg border px-5 py-2.5 text-sm font-medium focus:outline-none focus:ring-4 ' +
              (dark
                ? 'border-gray-600 bg-gray-800 text-white hover:border-gray-600 hover:bg-gray-700 focus:ring-gray-700'
                : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-100 focus:ring-gray-200')
            }
            onClick={() => props.setDisplayModal(false)}
            type="button"
          >
            X
          </button>

          {props.children}
        </div>
      </div>
    </div>
  )
}

export default Modal
