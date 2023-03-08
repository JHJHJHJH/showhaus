import React from "react";
import { useSelector, useDispatch } from "react-redux";
export default function NearbyMrt(){

    const dispatch = useDispatch();
    const inputState = useSelector((state) => state.inputState );

    // useEffect(() => {
    //     //Source
    //     //https://labs.mapbox.com/education/proximity-analysis/selecting-within-a-distance/#your-turn
    //     //Creates radiusGeojson circle
    //     function makeRadius(lngLatArray, radiusInMeters){
    //         var pt = point(lngLatArray);
    //         var buffered = buffer(pt, radiusInMeters, { units: 'kilometers' });
    //         return buffered;
    //     }

    //     //filters transactions within circle
    //     //sourceGeoJSON : all transactions (Point features)
    //     //filterFeature : geojson circle
    //     function getFeaturesWithinRadius(sourceGeoJSON, filterFeature) {
    //         // Loop through all the features in the source radiusGeojson and return the ones that 
    //         // are inside the filter feature (buffered radius) and are confirmed landing sites
    //         var joined = sourceGeoJSON.features.filter(function (feature) {
    //             return booleanPointInPolygon(feature, filterFeature);
    //         });
        
    //         return joined;
    //     }
    //     async function update(){
    //         try {
    //             if( inputState.location.latitude !== 0 && inputState.location.longitude !== 0 && transactionsGeojson != null){
    //                 const searchRadius = makeRadius( [ inputState.location.longitude, inputState.location.latitude ], inputState.radius )
    
    //                 SetRadiusGeojson( searchRadius );

    //                 var featuresInBuffer = getFeaturesWithinRadius(transactionsGeojson, searchRadius);

    //                 const foundTransactions = featureCollection(featuresInBuffer);
                    
    //                 SetTransactionsFoundGeojson(foundTransactions);
                    
    //                 dispatch( updateTransactions(foundTransactions ));
    //                 console.log ( "Transactions within radius...");
    //                 console.log(foundTransactions) ;                   
    //             }

                
    //         } catch (e) {
    //             console.error(e);
    //         }
    //     }

    //     update();

    // }, [inputState.location, inputState.radius, transactionsGeojson] );  // eslint-disable-line react-hooks/exhaustive-deps

    return(
        <div className="nearby-mrt font-bold">
            <label >What's nearby ?</label>
                
        </div>
    )
}