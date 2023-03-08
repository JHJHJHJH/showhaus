import React from "react";
import { useSelector, useDispatch } from "react-redux";
export default function NearbyMrt(){
    const searchRadiusState = useSelector((state) => state.searchRadiusState );

    return(
        <div className="nearby-mrt">
            <label className="font-bold" >What's nearby ?</label>
        
            {searchRadiusState.mrtStations.map( (stn) =>(
                <div className="my-2" key={stn}> {stn} </div>  
            ))}
        </div>
    )
}