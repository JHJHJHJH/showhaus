import * as React from 'react';
export default function TransactionSettings() {
    return (
        <>
        <h4 className="text-m font-bold">Distance (km)</h4>
        <div className="distance-input"></div>
          {1}
          <input
            type="range"
            min={1}
            max={10}
            step= {0.1}
             >
          </input>
          {10}
        <h4 class="text-m font-bold">Types</h4>
        <div className="grid grid-rows-2">
          <div >
            <label class="inline-block w-40">Condominium</label>
            <input
              class="ml-5"
              type="checkbox"
              name="allday"
              // checked={allDays}
              // onChange={evt => onChangeAllDays(evt.target.checked)}
            />
          </div>
          <div>
            <label class="inline-block w-40">Landed</label>
            <input
              class="ml-5"
              type="checkbox"
              name="allday"
              // checked={allDays}
              // onChange={evt => onChangeAllDays(evt.target.checked)}
            />
          </div>
          
        </div>
        <h4 className="text-m font-bold">Date</h4>
        <div>
          2015
          <input
            type="range"
            // disabled={allDays}
            min={1}
            max={10}
            // value={selectedDay}
            step={1}
            // onChange={onSelectDay}
          />
          2022
        </div>
        </>
    );
}