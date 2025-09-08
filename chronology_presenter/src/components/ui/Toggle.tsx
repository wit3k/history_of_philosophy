import { useId, type Dispatch, type SetStateAction } from 'react';
import './Toggle.sass';

class UIToggleProps<S> {
  constructor(
    public label: string,
    public state: S,
    public useState: Dispatch<SetStateAction<S>>,
    public disabled?: boolean,
    public offMsg?: string,
  ) {}
}

const UIToggle = (props: UIToggleProps<boolean>) => {
  const id = useId();
  return (
    <div
      className={
        !props.disabled
          ? 'neumorphism-toggle'
          : 'neumorphism-toggle switchDisabled'
      }
    >
      <input
        type="checkbox"
        id={id}
        checked={props.state}
        onChange={(e) => {
          if (!props.disabled) {
            props.useState(e.target.checked);
          }
        }}
      />
      <label htmlFor={id}>
        <div className="switch">
          <div className="dot"></div>
        </div>
        <span>{props.label}</span>
      </label>
      <span>{props.offMsg}</span>
    </div>
  );
};

export default UIToggle;
