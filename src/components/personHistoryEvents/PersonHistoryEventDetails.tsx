import type React from 'react'
import LocationListService from '../../data/db/LocationListService'
import type Person from '../../data/dto/Person'
import type PersonHistoryEvent from '../../data/dto/PersonHistoryEvent'
import Modal from '../ui/Modal'

class PersonHistoryEventDetailsProps {
  constructor(
    public currentEvent: PersonHistoryEvent,
    public currentPerson: Person,
    public displayModal: boolean,
    public setDisplayModal: React.Dispatch<React.SetStateAction<boolean>>,
    public locationCallback: (id: string) => void,
    public personCallback: (id: string) => void,
  ) {}
}

const formatYears = (event: PersonHistoryEvent) => {
  if (event.yearFrom == null) return ''
  if (event.yearTo == null || event.yearTo === event.yearFrom) return `${event.yearFrom}`
  return `${event.yearFrom}–${event.yearTo}`
}

const PersonHistoryEventDetails = (props: PersonHistoryEventDetailsProps) => {
  const location =
    props.currentEvent.locationId != null
      ? LocationListService.getById(props.currentEvent.locationId + '')
      : undefined

  return (
    <Modal displayModal={props.displayModal} setDisplayModal={props.setDisplayModal}>
      <div>
        <div className="text-3xl text-white italic p-5">{props.currentEvent.name}</div>
        <div className="p-5">
          <div className="mb-3 text-slate-300">{props.currentEvent.type}</div>
          <div className="mb-2">{formatYears(props.currentEvent)}</div>
          <div className="mb-2">
            <span
              className="text-pink-700 underline cursor-pointer"
              onClick={() => props.personCallback(props.currentPerson.id)}
              onKeyDown={() => props.personCallback(props.currentPerson.id)}
            >
              {props.currentPerson.name}
            </span>
          </div>
          {location && (
            <div>
              <span
                className="text-pink-700 underline cursor-pointer"
                onClick={() => props.locationCallback(props.currentEvent.locationId + '')}
                onKeyDown={() => props.locationCallback(props.currentEvent.locationId + '')}
              >
                {location.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default PersonHistoryEventDetails
