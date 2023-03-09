import React from "react";
import { useSelector } from "react-redux";
export default function NearbyMrt(){
    const searchRadiusState = useSelector((state) => state.searchRadiusState );

    return(
        <div className="nearby-mrt">
            <label className="font-bold" >What's nearby ?</label>
        
            {searchRadiusState.mrtStations.map( (stn, index) =>(
                <div className="my-2" key={index}> {stn} </div>  
            ))}
        </div>
    )
}