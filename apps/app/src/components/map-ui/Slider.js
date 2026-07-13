import { useState } from 'react';
// const { useState } = React;

export default function Slider() {
  const [state, setSlide] = useState(100);

  const handleChange = e => {

    console.log('setting level', e.target.value)

    setSlide(e.target.value);

  };

  return (
    <>
    <input
      type="range"
      id="opacity"
      min={0}
      max={100}
      step={0.5}
      // value={state} // don't set value from state
      defaultValue={state} // but instead pass state value as default value
      onChange={e => console.log(e.target.value)} // don't set state on all change as react will re-render
      onMouseUp={handleChange} // only set state when handle is released
    />
    <div>{state}</div>
    </> );
};