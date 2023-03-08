import React from "react";
import { useSelector, useDispatch } from "react-redux";
export default function NearbyMrt(){
    const nearbyState = useSelector((state) => state.nearbyState );

    return(
        <div className="nearby-mrt font-bold">
            <label >What's nearby ?</label>
            
        </div>
    )
}