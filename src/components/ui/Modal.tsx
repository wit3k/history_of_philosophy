import type { JSX } from 'react'

class ModalProps {
  constructor(
    public displayModal: boolean,
    public setDisplayModal: React.Dispatch<React.SetStateAction<boolean>>,
    public children: JSX.Element,
  ) {}
}

const Modal: React.FC<ModalProps> = (props: ModalProps) => (
  <div
    className={
      'fixed inset-0 bg-gray-900/50 backdrop-blur-xs backdrop-brightness-200 ' + (props.displayModal ? '' : ' hidden')
    }
    onClick={() => props.setDisplayModal(false)}
  >
    <div className="flex items-center  justify-center h-screen overflow-y-scroll">
      <div
        className="drop-shadow-xl drop-shadow-cyan-500/50 rounded-lg w-[500px] border-r-20 border-pink-700 h-fit m-auto"
        onClick={e => {
          e.stopPropagation()
        }}
        style={{
          background: 'rgba(8, 8, 11, 1)',
        }}
      >
        <button
          className=" cursor-pointer text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700 -right-7 top-0 absolute"
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

export default Modal
