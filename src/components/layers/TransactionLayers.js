import React, {useEffect, useState} from "react";
import { useSelector, useDispatch } from "react-redux";
import { Source, Layer } from "react-map-gl";
import { booleanPointInPolygon, featureCollection } from '@turf/turf';
import axios from "axios";
import { updateTransactionsInRadius } from   "../../reducers/transactionSlice";
import { updatePropertyTypes } from "../../reducers/searchRadiusSlice";

export default function TransactionLayers(){

    const dispatch = useDispatch();
    const mapViewState = useSelector((state) => state.mapViewState );
    const searchRadiusState = useSelector((state) => state.searchRadiusState );

    const [transactionsFoundGeojson, SetTransactionsFoundGeojson] = useState(null);
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
        filter: ['has', 'noOfTransactions'],
        layout: {
            'text-field': ['get', 'noOfTransactions'],
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12
        }
    }

    const clusterStyle = {
        id: 'clusters',
        type: 'circle',
        filter: ['has', 'noOfTransactions'],
        paint: {
            // Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
            // with three steps to implement three types of circles:
            //   * Blue, 20px circles when point count is less than 100
            //   * Yellow, 30px circles when point count is between 100 and 750
            //   * Pink, 40px circles when point count is greater than or equal to 750
            'circle-color': [
                'step',
                ['get', 'noOfTransactions'],
                '#51bbd6',
                100,
                '#f1f075',
                750,
                '#f28cb1'
            ],
            'circle-radius': [
                'step',
                ['get', 'noOfTransactions'],
                20,
                100,
                30,
                750,
                40
            ]
        }
    };

    const heatLayer = {
        'id': 'heat',
        'type': 'heatmap',
        'maxzoom': 15,
        'paint': {
            // increase weight as diameter breast height increases
            'heatmap-weight': {
                'property': 'highestPrice', //to switch according to user input
                'type': 'exponential',
                'stops': [
                    [collectionLowestPrice, 1],
                    [collectionHighestPrice, 2]
                ]
            },
            // increase intensity as zoom level increases
            'heatmap-intensity': {
                'stops': [
                    [11, 0.1],
                    [15, 1]
                ]
            },
            // use sequential color palette to use exponentially as the weight increases
            'heatmap-color': [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0,
                'rgba(43,131,186,0)',
                0.2,
                'rgb(171,221,164)',
                0.4,
                'rgb(255,255,191)',
                0.6,
                'rgb(253,174,97)',
                0.8,
                'rgb(215,25,28)'
            ],
            // increase radius as zoom increases
            'heatmap-radius': {
                'stops': [
                    [11, 15],
                    [15, 20]
                ]
            },
            // decrease opacity to transition into the circle layer
            // 'heatmap-opacity': {
            //     'default': 1,
            //     'stops': [
            //         [14, 1],
            //         [15, 0.2]
            //     ]
            // }
        }
    }
    const heatCircle = {
            id: 'tx-circle',
            type: 'circle',
            minzoom: 14,
            paint: {
            // increase the radius of the circle as the zoom level and dbh value increases
            'circle-radius': {
                property: 'highestPrice',
                type: 'exponential',
                stops: [
                [{ zoom: 14, value: collectionLowestPrice }, 3],
                [{ zoom: 14, value: collectionHighestPrice }, 6],
                [{ zoom: 17, value: collectionLowestPrice }, 15],
                [{ zoom: 17, value: collectionHighestPrice }, 30]
                ]
            },
            'circle-color': {
                property: 'highestPrice',
                type: 'exponential',
                stops: [
                    [collectionLowestPrice, 'rgb(43,131,186)'],
                    [collectionLowestPrice+ 1*((collectionHighestPrice-collectionLowestPrice)/4), 'rgb(171,221,164)'],
                    [collectionLowestPrice+ 2*((collectionHighestPrice-collectionLowestPrice)/4), 'rgb(255,255,191)'],
                    [collectionLowestPrice+ 3*((collectionHighestPrice-collectionLowestPrice)/4), 'rgb(253,174,97)'],
                    [collectionHighestPrice, 'rgb(215,25,28)'],
                ]
            },
            'circle-stroke-color': 'white',
            'circle-stroke-width': 1,
            'circle-opacity': {
                type: 'exponential',
                stops: [
                    [14, 0.1],
                    [15, 0.9]
                ]
            }
        }
        
    }
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
                        if(transaction.price > minValidPrice){
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
                console.log( response );
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
  
                var transactions =  feat['properties']['transactions'];
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
            console.log("Price range: " + formatPrice( collectionLowest) + " ~ " + formatPrice( collectionHighest) );
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
                if( checkedPropertyTypes.includes(feature["properties"]["transactions"][0]["property_type"])){
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
                    
                    SetTransactionsFoundGeojson(filteredTransactions);
                    
                    dispatch( updateTransactionsInRadius(filteredTransactions ));

                    updateTransactionData(filteredTransactions);
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
        <Source id="found-transactions"  type="geojson" data={transactionsFoundGeojson} cluster={true} clusterRadius={50}>
            {/* <Layer {...foundTransactionsStyle} /> */}
            {/* <Layer {...heatLayer} /> */}
            <Layer {...clusterStyle} beforeId={"cluster-count"}/>
            <Layer {...clusterTextStyle}  />
            
            {/* <Layer {...heatCircle} /> */}
            
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