import React from "react";
import {useDispatch, useSelector} from 'react-redux';
import { updateRadius } from "../reducers/transactionSlice";

export default function MenuComponent(){
    const transactionState  = useSelector((state) => state.transactionState );
    
    const dispatch = useDispatch();
    return (
        <div className="p-4">
            <div className="font-bold">Settings</div>

            <div>
                <label >Radius (km)</label>
                
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
        </div>
        
    )
}