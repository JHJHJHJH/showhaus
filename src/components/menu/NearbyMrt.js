import React from "react";
import { useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export default function NearbyMrt(){
    const searchRadiusState = useSelector((state) => state.searchRadiusState );

    return(
        <Card className="nearby-mrt">
            <CardHeader>
                <CardTitle>🚆 MRT</CardTitle>
            </CardHeader>
            <CardContent>
                {searchRadiusState.mrtStations.map( (stn, index) =>(
                    <div className="py-1 text-sm" key={index}> {stn} </div>
                ))}
            </CardContent>
        </Card>
    )
}
