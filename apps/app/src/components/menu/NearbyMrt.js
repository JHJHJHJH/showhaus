import React from "react";
import { useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { FiMapPin } from "react-icons/fi";

export default function NearbyMrt(){
    const searchRadiusState = useSelector((state) => state.searchRadiusState );
    const mrtList = searchRadiusState.mrtStations || [];

    return(
        <Card className="nearby-mrt">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                    <span>🚆</span>
                    <span>Nearby MRT</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {mrtList.length > 0 ? (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {mrtList.map((stn, index) => (
                            <div className="flex items-center gap-2 py-1 text-sm text-slate-700" key={index}>
                                <FiMapPin className="h-3 w-3 shrink-0 text-slate-400" />
                                <span className="truncate">{stn}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-2 text-center text-xs text-slate-500 italic">
                        No MRT stations found in radius
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
