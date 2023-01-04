import * as React from 'react';
import TranasactionsTable from '../TransactionsTable';
import {useDispatch, useSelector} from 'react-redux';
import { updateOpacity, updateRadius } from '../../reducers/transactionSlice';

export default function ControlPanel() {
  const transactionState  = useSelector((state) => state.transactionState );
    
  const dispatch = useDispatch();
  
  return (
    <div className="absolute w-96 top-2 right-2 p-4 bg-white shadow-xl space-y-2  font-mono h-5/6">
      <h3 className="text-xl font-bold text-gray-500">Hausin</h3>
      <p>
        Private Housing Transactions
      </p>
      <hr />

      <div>
        <label >Opacity</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={transactionState.opacity}
          onChange={(e) => dispatch(updateOpacity( e.target.value ))}
          id="opacityRange"
        />
        {transactionState.opacity}
      </div>

      <div>
        <label >Radius</label>
        <input
          type="range"
          min={1}
          max={5}
          step={0.1}
          value={transactionState.radius}
          onChange={(e) =>  dispatch(updateRadius( e.target.value ))}
          id="radiusRange"
        />
        {transactionState.radius}
      </div>
      
      <TranasactionsTable/>

           
      <div className="text-xs">
        Some Legend (red : Landed, blue : condo, bla)
      </div>
      <div className="italic">
        Data source: URA
      </div>
    </div>
  );
}