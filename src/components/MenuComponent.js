import React from "react";
import {useDispatch, useSelector} from 'react-redux';
import { updateRadius } from "../reducers/searchRadiusSlice";
import NearbyMrt from "./menu/NearbyMrt";
import PropertyTypes from "./menu/PropertyTypes";

export default function MenuComponent(){
    const searchRadiusState = useSelector((state) => state.searchRadiusState );
    const dispatch = useDispatch();
    return (
        <div className="p-4">
            <div className="font-bold my-2">Settings</div>

            <div className="my-2">
                <label >Radius (km)</label>
                
                <input
                    type="range"
                    min={1}
                    max={5}
                    step={0.1}
                    value={searchRadiusState.radius}
                    onChange={(e) =>  dispatch(updateRadius( e.target.value ))}
                    id="radiusRange"
                />
                {searchRadiusState.radius}
            </div>
            <PropertyTypes/>
            <NearbyMrt/>
        </div>
        
    )
}