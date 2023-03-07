import React from "react";
import {useDispatch, useSelector} from 'react-redux';
import { updateRadius } from "../reducers/inputSlice";
import NearbyMrt from "./nearbys/NearbyMrt";

export default function MenuComponent(){
    const inputState = useSelector((state) => state.inputState );
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
                    value={inputState.radius}
                    onChange={(e) =>  dispatch(updateRadius( e.target.value ))}
                    id="radiusRange"
                />
                {inputState.radius}
            </div>
            <NearbyMrt/>
        </div>
        
    )
}