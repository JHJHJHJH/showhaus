import * as React from 'react';
import TranasactionsTable from '../TransactionsTable';
import {useDispatch, useSelector} from 'react-redux';
import { updateOpacity, updateRadius } from '../../reducers/transactionSlice';

export default function ControlPanel() {
  const transactionState  = useSelector((state) => state.transactionState );
    
  const dispatch = useDispatch();
  
  return (
    <div className="absolute top-2 right-2 flex w-96 flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/90 p-5 shadow-2xl backdrop-blur-sm h-[85vh]">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black tracking-tight text-slate-800">Hausin</h3>
        <div className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">Private Housing</div>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <label htmlFor="opacityRange">Opacity</label>
            <span className="font-mono text-slate-900">{Math.round(transactionState.opacity * 100)}%</span>
          </div>
          <input
            className="w-full accent-slate-700"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={transactionState.opacity}
            onChange={(e) => dispatch(updateOpacity(e.target.value))}
            id="opacityRange"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <label htmlFor="radiusRange">Radius</label>
            <span className="font-mono text-slate-900">{transactionState.radius}km</span>
          </div>
          <input
            className="w-full accent-slate-700"
            type="range"
            min={1}
            max={5}
            step={0.1}
            value={transactionState.radius}
            onChange={(e) => dispatch(updateRadius(e.target.value))}
            id="radiusRange"
          />
        </div>
      </div>
      
      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200 bg-white shadow-inner">
        <TranasactionsTable />
      </div>

      <div className="flex flex-col gap-1 text-[10px] text-slate-500">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-500"></span>
          <span>Landed</span>
          <span className="h-2 w-2 rounded-full bg-blue-500 ml-1"></span>
          <span>Condo</span>
        </div>
        <div className="flex items-center justify-between italic">
          <span>Data source: URA</span>
          <span>Master Plan 2025</span>
        </div>
      </div>
    </div>
  );
}