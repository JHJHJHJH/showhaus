import React, {useEffect, useState} from "react";
import { useSelector, useDispatch } from "react-redux";
import { Source, Layer } from "react-map-gl";
import { booleanPointInPolygon, featureCollection } from '@turf/turf';
import axios from "axios";
import { updateTransactionsInRadius } from   "../../reducers/transactionSlice";
import { updatePropertyTypes } from "../../reducers/searchRadiusSlice";

const EMPTY_GEOJSON = {"type": "FeatureCollection", "features": [] };

export default function TransactionLayers(){

    const dispatch = useDispatch();
    const mapViewState = useSelector((state) => state.mapViewState );
    const searchRadiusState = useSelector((state) => state.searchRadiusState );

    const [transactionsFoundGeojson, SetTransactionsFoundGeojson] = useState(EMPTY_GEOJSON);
    const [transactionsGeojson, SetTransactionsGeojson] = useState(null);
    const [transactionMeanPrice, SetTransactionMeanPrice]= useState(0)
    const [collectionHighestPrice, SetCollectionHighestPrice]= useState(1)
    const [collectionLowestPrice, SetCollectionLowestPrice]= useState(1)

    // const foundTransactionsStyle = {
    //     id: 'found-transactions',
    //     type: 'circle',
    //     paint: {
    //         'circle-radius': 6,
    //         'circle-color': '#880808',
    //         'circle-opacity': 0.6
    //     }
    // };
    const clusterTextStyle = {
        id: 'cluster-count',
        type: 'symbol',
        filter: ['has', 'point_count'],
        layout: {
            'text-field': ['get', 'point_count_abbreviated'],
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12
        }
    }

    const clusterStyle = {
        id: 'clusters',
        type: 'circle',
        filter: ['has', 'point_count'],
        paint: {
            // Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
            // with three steps to implement three types of circles:
            //   * Blue, 12px circles when transaction count is less than 70
            //   * Yellow, 22px circles when transaction count is between 70 and 400
            //   * Pink, 32px circles when transaction count is greater than or equal to 400
            'circle-color': [
                'step',
                ['get', 'point_count'],
                '#51bbd6',
                70,
                '#f1f075',
                350,
                '#f28cb1'
            ],
            'circle-radius': [
                'step',
                ['get', 'point_count'],
                15,
                70,
                24,
                400,
                35
            ],
            'circle-opacity': 0.9
        }
    };

    const transactionTextStyle = {
        id: 'transaction-count',
        type: 'symbol',
        minzoom: 15,
        layout: {
            'text-field': ['get', 'noOfTransactions'],
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12
        },
        paint: {
            'text-color': '#0f172a'
        }
    };

    const transactionPointStyle = {
        id: 'transaction-points',
        type: 'circle',
        minzoom: 15,
        paint: {
            'circle-color': [
                'step',
                ['get', 'noOfTransactions'],
                '#51bbd6',
                70,
                '#f1f075',
                350,
                '#f28cb1'
            ],
            'circle-radius': [
                'step',
                ['get', 'noOfTransactions'],
                15,
                70,
                24,
                400,
                35
            ],
            'circle-opacity': 0.9,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 2
        }
    };

    const clusterSourceTransactionTextStyle = {
        id: 'cluster-source-transaction-count',
        type: 'symbol',
        filter: ['!', ['has', 'point_count']],
        maxzoom: 15,
        layout: transactionTextStyle.layout,
        paint: transactionTextStyle.paint
    };

    const clusterSourceTransactionPointStyle = {
        id: 'cluster-source-transaction-points',
        type: 'circle',
        filter: ['!', ['has', 'point_count']],
        maxzoom: 15,
        paint: transactionPointStyle.paint
    };
    // const gridlayer = new GridLayer({
    //     id: 'new-grid-layer',
    //     transactionHeatMap,
    //     pickable: true,
    //     extruded: true,
    //     cellSize: 200,
    //     elevationScale: 4,
    //     getPosition: d => d.position
    //   });
    // const heatmapLayer = new HeatmapLayer({
    //     id: 'heatmapLayer',
    //     transactionHeatMap,
    //     getPosition: d => d.position,
    //     getWeight: d => d.weight,
    //     aggregation: 'SUM'
    //   });
    useEffect(() => {
        async function init(){
            try {
                SetTransactionsFoundGeojson(EMPTY_GEOJSON);
            } catch (e) {
                console.error(e);
            }
        }

        //fetch ALL transaction data from API
        async function fetchData(){
            try {
                const response = await axios({
                    method:'get',
                    url: `${process.env.REACT_APP_SHOWHOUSE_API_URL}/location`,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    params : { 
                        minLon: mapViewState.maxBounds.minLon,
                        minLat: mapViewState.maxBounds.minLat,
                        maxLon: mapViewState.maxBounds.maxLon,
                        maxLat: mapViewState.maxBounds.maxLat
                    }
                });
                const propertyTypes = new Set();
                //filter out prices below minValidPrice
                const minValidPrice = 100000;
                const feats = response.data.data.features;
                
                for (let i = 0; i < feats.length; i++) {
                    const feat = feats[i];
                    const transactions = feat.properties.transactions;
                    const newTransactions = [];
                    
                    for (let j = 0; j < transactions.length; j++) {
                        const transaction = transactions[j];
                        propertyTypes.add(transaction["property_type"]);
                        if(transaction.price < minValidPrice){
                            // console.log(transaction)
                            newTransactions.push( transaction);
                        }
                    }
                    if( transactions.length !== newTransactions.length ){
                        // console.log("Original tx array length = " + transactions.length );
                        // console.log("New tx array length = " + newTransactions.length );
                        feat.transactions = newTransactions;
                        // console.log("New feat array length = " + feat.transactions.length );
                    }
                    
                }
                
                dispatch(updatePropertyTypes([...propertyTypes].map((value) => { return {"id": value, "isChecked": true}})));
                SetTransactionsGeojson(response.data.data);
            } catch (e) {
                console.error(e);
            }
        }

        fetchData();

        init();

    }, [] ); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        function formatPrice(price) {
            return "$" + price.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,");
        }
        function updateTransactionData( data ){

            let collectionHighest = -1;
            let collectionLowest = 10000000000;
            let lowestTx;
            for(const i in data['features']){
                const feat = data['features'][i];
  
                var transactions =  feat['properties']['transactions'] || [];
                // console.log(transactions[0]['price'])
                // if (transactions.length > 0 ){
                let sum = 0;
                let highestPrice = -1;
                let lowestPrice = 10000000;
                
                for(const k in transactions){
                    const tx= transactions[k];
                    const price = tx['price'];
                    sum+= price;   
                    if( price> highestPrice ){
                        highestPrice = price;
                    }
                    if( price < lowestPrice ){
                        lowestTx = tx;
                        lowestPrice = price;
                    }
                }
                // var meanPrice = sum/ transactions.length;
                
                //default = highest
                const targetType = 'highest';
                let targetPrice = highestPrice;
                // if( targetType === 'lowest'){
                //     targetPrice = lowestPrice
                // } else if (targetType === 'mean'){
                //     targetPrice = meanPrice;
                // }


                if( highestPrice > collectionHighest ){
                    collectionHighest = highestPrice;
                }
                if( lowestPrice < collectionLowest ){
                    collectionLowest = lowestPrice;
                }
                //console.log("largest = " + collectionHighest + " | smallest = " + collectionLowest);

                // feat['properties']['meanPrice'] = meanPrice;
                feat['properties']['noOfTransactions'] = transactions.length;
                feat['properties']['highestPrice'] = highestPrice;
                feat['properties']['lowestPrice'] = lowestPrice;
            }

            SetCollectionLowestPrice(collectionLowest);
            SetCollectionHighestPrice(collectionHighest);
            // console.log( lowestTx );
            // console.log("Price range: " + formatPrice( collectionLowest) + " ~ " + formatPrice( collectionHighest) );
            // console.log(collectionHighest)
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
        function filterTransactions( transactionFeatureCollection ){
            let filteredFeatureCollection = {'type':'FeatureCollection', 'features':[]};
            let transactionFeatures = transactionFeatureCollection["features"];

            const checkedPropertyTypes = searchRadiusState.propertyTypes.reduce( (acc, current) => {
                if (current["isChecked"]) {
                    acc.push( current["id"]);
                }
                return acc;
            }, []);

            for (let i = 0; i < transactionFeatures.length; i++) {
                let feature = transactionFeatures[i];
                const transactions = feature["properties"]["transactions"] || [];
                if( transactions.length === 0 ){
                    continue;
                }

                if( checkedPropertyTypes.length === 0 ){
                    filteredFeatureCollection['features'].push(feature);
                    continue;
                }

                const hasCheckedTransactionType = transactions.some((transaction) => (
                    checkedPropertyTypes.includes(transaction["property_type"])
                ));

                if( hasCheckedTransactionType ){
                    filteredFeatureCollection['features'].push(feature);
                }
            }
            
            return filteredFeatureCollection;
            
        }
        async function update(){
            try {
                if( searchRadiusState.location.latitude !== 0 && searchRadiusState.location.longitude !== 0 && transactionsGeojson != null){

                    var featuresInBuffer = getFeaturesWithinRadius(transactionsGeojson, searchRadiusState.searchRadius);

                    const foundTransactions = featureCollection(featuresInBuffer);
                    
                    //filter selected propertyTypes
                    const filteredTransactions = filterTransactions( foundTransactions );

                    updateTransactionData(filteredTransactions);
                    SetTransactionsFoundGeojson(filteredTransactions);
                    dispatch( updateTransactionsInRadius(filteredTransactions ));
                    // console.log(foundTransactions);
                }

                
            } catch (e) {
                console.error(e);
            }
        }

        update();

    }, [ searchRadiusState.propertyTypes, searchRadiusState.location, searchRadiusState.radius, transactionsGeojson] );  // eslint-disable-line react-hooks/exhaustive-deps


    return(
        <>
        {/* <DeckGLOverlay layers={[ gridlayer ]}/>; */}
        <Source
            id="found-transactions"
            type="geojson"
            data={transactionsFoundGeojson}
            cluster={true}
            clusterRadius={80}
            clusterMaxZoom={18}
        >
            {/* <Layer {...foundTransactionsStyle} /> */}
            <Layer {...clusterStyle} />
            <Layer {...clusterTextStyle} />
            <Layer {...clusterSourceTransactionPointStyle} />
            <Layer {...clusterSourceTransactionTextStyle} />
        </Source>
        <Source
            id="transaction-points-source"
            type="geojson"
            data={transactionsFoundGeojson}
        >
            <Layer {...transactionPointStyle} />
            <Layer {...transactionTextStyle} />
        </Source>
        
        {/* <DeckGL viewState={{
                        longitude: mapViewState.longitude,
                        latitude: mapViewState.latitude,
                        zoom: mapViewState.zoom
                    }} 
                    layers={[ heatmapLayer ]}/>; */}
        </>
    );
}
