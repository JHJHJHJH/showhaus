import React from "react";
import { useSelector } from "react-redux";
import { formatLandUseType, getLandUseTypeColor, LAND_USE_TYPE_ORDER } from "../../utils/landUseData";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export default function NearbyLandUses(){
    const landUsesInRadius = useSelector((state) => state.searchRadiusState.landUsesInRadius);

    const landUseGroups = Array.from(
        landUsesInRadius.reduce((acc, landUse) => {
            const landUseType = landUse.land_use_type;

            acc.set(landUseType, {
                land_use_type: landUseType,
                count: (acc.get(landUseType)?.count || 0) + 1
            });

            return acc;
        }, new Map()).values()
    ).sort((a, b) => {
        const aIndex = LAND_USE_TYPE_ORDER.indexOf(a.land_use_type);
        const bIndex = LAND_USE_TYPE_ORDER.indexOf(b.land_use_type);

        if(aIndex === -1 && bIndex === -1){
            return String(a.land_use_type || '').localeCompare(String(b.land_use_type || ''));
        }

        if(aIndex === -1){
            return 1;
        }

        if(bIndex === -1){
            return -1;
        }

        return aIndex - bIndex;
    });

    return(
        <Card className="nearby-land-uses">
            <CardHeader>
                <CardTitle>🗺️ Land Use</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-x-3 gap-y-2">
                {landUseGroups.map((landUse) => (
                    <div className="flex min-w-0 items-start gap-2 text-sm" key={landUse.land_use_type}>
                        <span
                            className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: getLandUseTypeColor(landUse.land_use_type) }}
                            title={formatLandUseType(landUse.land_use_type)}
                            aria-label={formatLandUseType(landUse.land_use_type)}
                        />
                        <div className="min-w-0">
                            <span className="break-words">{formatLandUseType(landUse.land_use_type)}</span>
                            <span className="ml-1 text-xs text-slate-500">{landUse.count}</span>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
