import React, {useEffect, useState} from "react";
import { useSelector, useDispatch } from "react-redux";
import { Source, Layer } from "react-map-gl";
import { point,buffer, booleanPointInPolygon, featureCollection } from '@turf/turf';
import axios from "axios";
import { updateTransactions } from   "../../reducers/transactionSlice";

export default function SearchRadiusLayer(){

    const inputState = useSelector((state) => state.inputState );

    const [radiusGeojson, SetRadiusGeojson] = useState(null);

    //Styles
    const radiusStyle = {
        id: 'search-radius',
        type: 'fill',
        paint: {
            'fill-color': '#F1CF65',
            'fill-opacity': inputState.opacity
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
                if( inputState.location.latitude !== 0 && inputState.location.longitude !== 0 ){
                    SetRadiusGeojson( inputState.searchRadius );             
                }                
            } catch (e) {
                console.error(e);
            }
        }

        update();

    }, [inputState.location, inputState.radius] );  // eslint-disable-line react-hooks/exhaustive-deps


    return(
        <>
        <Source id="search-radius"  type="geojson" data={radiusGeojson} >
            <Layer {...radiusStyle} />
        </Source>
        </>
        
    );
}