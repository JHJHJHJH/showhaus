import React, {useEffect, useState} from "react";
import { useSelector, useDispatch } from "react-redux";
import { Source, Layer } from "react-map-gl";
import { booleanPointInPolygon, featureCollection } from '@turf/turf';
import axios from "axios";
import { updateTransactionsInRadius } from   "../../reducers/transactionSlice";

export default function TransactionLayers(){

    const dispatch = useDispatch();
    const mapViewState = useSelector((state) => state.mapViewState );
    const searchRadiusState = useSelector((state) => state.searchRadiusState );

    const [transactionsFoundGeojson, SetTransactionsFoundGeojson] = useState(null);
    const [transactionsGeojson, SetTransactionsGeojson] = useState(null);


    const foundTransactionsStyle = {
        id: 'found-transactions',
        type: 'circle',
        paint: {
            'circle-radius': 6,
            'circle-color': '#880808',
            'circle-opacity': 0.6
        }
    };

    const transactionsStyle = {
        id: 'transactions',
        type: 'circle',
        paint: {
            'circle-radius': 6,
            'circle-color': '#007cbf',
            'circle-opacity': 0
        }
    };

    useEffect(() => {
        async function init(){
            try {
                const emptyData = {"type": "FeatureCollection", "features": [] };                
                SetTransactionsFoundGeojson(emptyData);
            } catch (e) {
                console.error(e);
            }
        }

        //fetch ALL transaction data from API
        async function fetchData(){
            try {
                const response = await axios({
                    method:'get',
                    url: `${process.env.REACT_APP_BACKEND_URL}/location`,
                    headers: { },
                    params : { 
                        minLon: mapViewState.maxBounds.minLon,
                        minLat: mapViewState.maxBounds.minLat,
                        maxLon: mapViewState.maxBounds.maxLon,
                        maxLat: mapViewState.maxBounds.maxLat
                    }
                });
                console.log( response );

                SetTransactionsGeojson(response.data.data);
            } catch (e) {
                console.error(e);
            }
        }

        fetchData();

        init();

    }, [] ); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {

        //filters transactions within circle
        //sourceGeoJSON : all transactions (Point features)
        //filterFeature : geojson circle
        function getFeaturesWithinRadius(sourceGeoJSON, filterFeature) {
            // Loop through all the features in the source radiusGeojson and return the ones that 
            // are inside the filter feature (buffered radius) and are confirmed landing sites
            var joined = sourceGeoJSON.features.filter(function (feature) {
                return booleanPointInPolygon(feature, filterFeature);
            });
        
            return joined;
        }
        async function update(){
            try {
                if( searchRadiusState.location.latitude !== 0 && searchRadiusState.location.longitude !== 0 && transactionsGeojson != null){

                    var featuresInBuffer = getFeaturesWithinRadius(transactionsGeojson, searchRadiusState.searchRadius);

                    const foundTransactions = featureCollection(featuresInBuffer);
                    
                    SetTransactionsFoundGeojson(foundTransactions);
                    
                    dispatch( updateTransactionsInRadius(foundTransactions ));
                    // console.log ( "Transactions within radius...");
                    // console.log(foundTransactions) ;                   
                }

                
            } catch (e) {
                console.error(e);
            }
        }

        update();

    }, [searchRadiusState.location, searchRadiusState.radius, transactionsGeojson] );  // eslint-disable-line react-hooks/exhaustive-deps


    return(
        <>
        {/* <Source id="transactions"  type="geojson" data={transactionsGeojson} >
            <Layer {...transactionsStyle} />
        </Source> */}

        <Source id="found-transactions"  type="geojson" data={transactionsFoundGeojson} >
            <Layer {...foundTransactionsStyle} />
        </Source>
        </>
    );
}