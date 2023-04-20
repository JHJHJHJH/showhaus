import React from "react";
import { useSelector } from "react-redux";
export default function NearbyMrt(){
    const searchRadiusState = useSelector((state) => state.searchRadiusState );

    return(
        <div className="my-4 nearby-mrt">
            <label className="font-bold" >What's nearby ?</label>
        
            {searchRadiusState.mrtStations.map( (stn, index) =>(
                <div className="m-1.5 text-sm" key={index}> {stn} </div>  
            ))}
        </div>
    )
}