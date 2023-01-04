import React, {useEffect, useState} from "react";
import { useSelector, useDispatch } from "react-redux";
import { Source, Layer } from "react-map-gl";
import { point,buffer, booleanPointInPolygon, featureCollection } from '@turf/turf';
import axios from "axios";
import { updateTransactions } from   "../../reducers/transactionSlice";

export default function TransactionLayers(){

    const dispatch = useDispatch();
    const mapViewState = useSelector((state) => state.mapViewState );
    const transactionState = useSelector((state) => state.transactionState );

    const [radiusGeojson, SetRadiusGeojson] = useState(null);
    const [transactionsFoundGeojson, SetTransactionsFoundGeojson] = useState(null);
    const [transactionsGeojson, SetTransactionsGeojson] = useState(null);



    //Styles
    const radiusStyle = {
        id: 'search-radius',
        type: 'fill',
        paint: {
            'fill-color': '#F1CF65',
            'fill-opacity': transactionState.opacity
        }
    };

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
                SetRadiusGeojson(emptyData);
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
        //Source
        //https://labs.mapbox.com/education/proximity-analysis/selecting-within-a-distance/#your-turn
        //Creates radiusGeojson circle
        function makeRadius(lngLatArray, radiusInMeters){
            var pt = point(lngLatArray);
            var buffered = buffer(pt, radiusInMeters, { units: 'kilometers' });
            return buffered;
        }

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
                if( transactionState.location.latitude !== 0 && transactionState.location.longitude !== 0 && transactionsGeojson != null){
                    
                    const searchRadius = makeRadius( [ transactionState.location.longitude, transactionState.location.latitude ], transactionState.radius )
    
                    SetRadiusGeojson( searchRadius );

                    var featuresInBuffer = getFeaturesWithinRadius(transactionsGeojson, searchRadius);

                    const foundTransactions = featureCollection(featuresInBuffer);
                    
                    SetTransactionsFoundGeojson(foundTransactions);
                    
                    dispatch( updateTransactions(foundTransactions ));
                    console.log ( "Transactions within radius...");
                    console.log(foundTransactions) ;                   
                }

                
            } catch (e) {
                console.error(e);
            }
        }

        update();

    }, [transactionState.location, transactionState.radius, transactionsGeojson] );  // eslint-disable-line react-hooks/exhaustive-deps


    return(
        <>
        <Source id="search-radius"  type="geojson" data={radiusGeojson} >
            <Layer {...radiusStyle} />
        </Source>

        <Source id="transactions"  type="geojson" data={transactionsGeojson} >
            <Layer {...transactionsStyle} />
        </Source>

        <Source id="found-transactions"  type="geojson" data={transactionsFoundGeojson} >
            <Layer {...foundTransactionsStyle} />
        </Source>
        </>
        
    );
}