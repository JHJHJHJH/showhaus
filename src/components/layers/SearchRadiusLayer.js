import React, {useEffect, useState} from "react";
import { useSelector, useDispatch } from "react-redux";
import { Source, Layer } from "react-map-gl";
import { booleanPointInPolygon } from '@turf/turf';
import { updateLandUsesInRadius, updateSchoolsInRadius, updateSelectedLandUse } from "../../reducers/searchRadiusSlice";
import { getLandUseAtLocation, getLandUsesInRadius } from "../../utils/landUseData";
import { getCheckedSchoolTypes, getSchoolsGeojson, normalizeSchool } from "../../utils/schoolData";

const SCHOOLS_GEOJSON = getSchoolsGeojson();
const EMPTY_GEOJSON = {"type": "FeatureCollection", "features": [] };

export default function SearchRadiusLayer(){

    const dispatch = useDispatch();
    const searchRadiusState = useSelector((state) => state.searchRadiusState );

    const [radiusGeojson, SetRadiusGeojson] = useState(EMPTY_GEOJSON);

    //Styles
    const radiusStyle = {
        id: 'search-radius',
        type: 'fill',
        paint: {
            'fill-color': '#546E7A',
            'fill-opacity': searchRadiusState.opacity
        }
    };

    //update radius geojson when user change 
    //marker location AND radius settings
    useEffect(() => {
        let isCancelled = false;

        function updateRadiusAndSchools(){
            try {
                if( searchRadiusState.location.latitude !== 0 && searchRadiusState.location.longitude !== 0 ){
                    SetRadiusGeojson( searchRadiusState.searchRadius );
                    const checkedSchoolTypes = getCheckedSchoolTypes(searchRadiusState.schoolTypes);

                    const schoolsInRadius = SCHOOLS_GEOJSON.features
                        .filter((feature) => booleanPointInPolygon(feature, searchRadiusState.searchRadius))
                        .filter((feature) => checkedSchoolTypes.includes(feature.properties.school_type))
                        .map((feature) => normalizeSchool(feature.properties));

                    if(isCancelled){
                        return;
                    }

                    dispatch(updateSchoolsInRadius(schoolsInRadius));
                } else {
                    SetRadiusGeojson(EMPTY_GEOJSON);
                    dispatch(updateSchoolsInRadius([]));
                }
            } catch (e) {
                console.error(e);
            }
        }

        async function updateLandUses(){
            try {
                if( searchRadiusState.location.latitude === 0 || searchRadiusState.location.longitude === 0 ){
                    dispatch(updateLandUsesInRadius([]));
                    dispatch(updateSelectedLandUse(null));
                    return;
                }

                const landUsesInRadius = await getLandUsesInRadius(searchRadiusState.searchRadius);

                if(!isCancelled){
                    dispatch(updateLandUsesInRadius(landUsesInRadius));
                }
            } catch (e) {
                console.error(e);
            }
        }

        async function updateSelectedPlotLandUse(){
            try {
                if( searchRadiusState.location.latitude === 0 || searchRadiusState.location.longitude === 0 ){
                    dispatch(updateSelectedLandUse(null));
                    return;
                }

                const selectedLandUse = await getLandUseAtLocation(searchRadiusState.location);

                if(!isCancelled){
                    dispatch(updateSelectedLandUse(selectedLandUse));
                }
            } catch (e) {
                console.error(e);
            }
        }

        updateRadiusAndSchools();
        updateLandUses();
        updateSelectedPlotLandUse();

        return () => {
            isCancelled = true;
        };

    }, [searchRadiusState.location, searchRadiusState.radius, searchRadiusState.schoolTypes] );  // eslint-disable-line react-hooks/exhaustive-deps


    return(
        <>
        <Source id="search-radius"  type="geojson" data={radiusGeojson} >
            <Layer {...radiusStyle} />
        </Source>
        </>
        
    );
}
