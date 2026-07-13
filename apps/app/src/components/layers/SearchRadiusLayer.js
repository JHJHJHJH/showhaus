import React, {useMemo} from "react";
import { useSelector } from "react-redux";
import { Source, Layer } from "react-map-gl";
import LandContextLayer from "./LandContextLayer";

const EMPTY_GEOJSON = {"type": "FeatureCollection", "features": [] };

export default function SearchRadiusLayer(){

    const searchRadiusState = useSelector((state) => state.searchRadiusState );
    const radiusGeojson = useMemo(() => {
        if(searchRadiusState.location.latitude === 0 || searchRadiusState.location.longitude === 0){
            return EMPTY_GEOJSON;
        }

        return searchRadiusState.searchRadius || EMPTY_GEOJSON;
    }, [searchRadiusState.location, searchRadiusState.searchRadius]);

    //Styles
    const radiusStyle = {
        id: 'search-radius',
        type: 'fill',
        paint: {
            'fill-color': '#546E7A',
            'fill-opacity': searchRadiusState.opacity
        }
    };

    return(
        <>
            <LandContextLayer/>
            <Source id="search-radius"  type="geojson" data={radiusGeojson} >
                <Layer {...radiusStyle} />
            </Source>
        </>
        
    );
}
