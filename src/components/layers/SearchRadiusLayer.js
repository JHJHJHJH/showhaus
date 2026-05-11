import React, {useEffect, useState} from "react";
import { useSelector, useDispatch } from "react-redux";
import { Source, Layer } from "react-map-gl";
import { booleanPointInPolygon } from '@turf/turf';
import { updateSchoolsInRadius } from "../../reducers/searchRadiusSlice";
import { getCheckedSchoolTypes, getSchoolsGeojson, normalizeSchool } from "../../utils/schoolData";

const SCHOOLS_GEOJSON = getSchoolsGeojson();

export default function SearchRadiusLayer(){

    const dispatch = useDispatch();
    const searchRadiusState = useSelector((state) => state.searchRadiusState );

    const [radiusGeojson, SetRadiusGeojson] = useState(null);

    //Styles
    const radiusStyle = {
        id: 'search-radius',
        type: 'fill',
        paint: {
            'fill-color': '#546E7A',
            'fill-opacity': searchRadiusState.opacity
        }
    };

    useEffect(() => {
        async function init(){
            try {
                const emptyData = {"type": "FeatureCollection", "features": [] };                
                SetRadiusGeojson(emptyData);
            } catch (e) {
                console.error(e);
            }
        }

        init();

    }, [] ); // eslint-disable-line react-hooks/exhaustive-deps

    //update radius geojson when user change 
    //marker location AND radius settings
    useEffect(() => {
        async function update(){
            try {
                if( searchRadiusState.location.latitude !== 0 && searchRadiusState.location.longitude !== 0 ){
                    SetRadiusGeojson( searchRadiusState.searchRadius );
                    const checkedSchoolTypes = getCheckedSchoolTypes(searchRadiusState.schoolTypes);

                    const schoolsInRadius = SCHOOLS_GEOJSON.features
                        .filter((feature) => booleanPointInPolygon(feature, searchRadiusState.searchRadius))
                        .filter((feature) => checkedSchoolTypes.includes(feature.properties.school_type))
                        .map((feature) => normalizeSchool(feature.properties));

                    dispatch(updateSchoolsInRadius(schoolsInRadius));
                }                
            } catch (e) {
                console.error(e);
            }
        }

        update();

    }, [searchRadiusState.location, searchRadiusState.radius, searchRadiusState.schoolTypes] );  // eslint-disable-line react-hooks/exhaustive-deps


    return(
        <>
        <Source id="search-radius"  type="geojson" data={radiusGeojson} >
            <Layer {...radiusStyle} />
        </Source>
        </>
        
    );
}
