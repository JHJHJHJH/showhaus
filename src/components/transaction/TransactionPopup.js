import { Popup  } from "react-map-gl";
import {useMap} from 'react-map-gl';
import { useEffect, useState } from "react";
import { transactionsDistribution } from "./TransactionUtils";
export function TransactionPopup(){
    const { map } = useMap();
    
    const [showPopup, setShowPopup] = useState(true);

    const [latitudePopup, setLatitudePopup] = useState(0);
    const [longitudePopup, setLongitudePopup] = useState(0);
    const [projectName, setProjectName] = useState('');
    const [streetName, setStreetName] = useState('');
    const [numOfTransactions, setNumOfTransactions] = useState('');
    const [locationId, setLocationId] = useState('');
    const [highestTx, setHighestTx]= useState({});
    const [medianTx, setMedianTx]= useState({});
    const [lowestTx, setLowestTx]= useState({});

    useEffect(() => {
        if (!map) {
            return undefined;
        }
        map.on('click', (event) => {
            if(showPopup){
                setShowPopup(false);
            }
        })
        map.on('click', 'clusters', (event) => {
                 
            var latLng = event.features[0].geometry.coordinates;
            var tx = event.features[0].properties.transactions;
            var transactions = JSON.parse(tx);
            // console.log(transactions);
            setLatitudePopup( latLng[0] );
            setLongitudePopup( latLng[1] );
            const projectName =  event.features[0].properties.project;
            const streetName =  event.features[0].properties.street;
            const locationId = event.features[0].properties.location_id;

            const numOfTransactions = transactions.length;
            const distribution = transactionsDistribution( transactions);
            setHighestTx(distribution["highestTransaction"]);
            setLowestTx(distribution["lowestTransaction"]);
            setMedianTx(distribution["medianTransaction"]);
            setLocationId(locationId);
            setProjectName(projectName);
            setStreetName(streetName);
            setNumOfTransactions(numOfTransactions);
            setShowPopup(true);
        });
    },[map]);

    return(
        (showPopup && <Popup longitude={latitudePopup} latitude={longitudePopup}
            anchor="bottom"
            maxWidth={"420px"}
            onClose={() => setShowPopup(false)}
            closeOnClick={false}
        >
            {/* <p><b>LocationId : </b> {locationId}</p> */}
            <p><b>Project : </b> {projectName}</p>
            <p><b>Street : </b> {streetName}</p>
            <p><b>Transactions : </b> {numOfTransactions}</p>
            <style>{"table{ width:100% } th,td{ text-align: left; padding-right:12px; }"}</style>
            <table >
                <tbody>
                <tr>
                    <th>Transaction</th>
                    <th>Price ($)</th>
                    <th>Area (m<sup>2</sup>)</th>
                    <th>Floor</th>
                </tr>
            
                <tr>
                    <td>Highest</td>
                    <td>{highestTx.price}</td>
                    <td>{highestTx.area}</td>
                    <td>{highestTx.floor_range}</td>
                </tr>
                <tr>
                    <td>Median</td>
                    <td>{medianTx.price}</td>
                    <td>{medianTx.area}</td>
                    <td>{medianTx.floor_range}</td>
                </tr>
                <tr>
                    <td>Lowest</td>
                    <td>{lowestTx.price}</td>
                    <td>{lowestTx.area}</td>
                    <td>{lowestTx.floor_range}</td>
                </tr>
                </tbody>
            </table>
        </Popup>)
    );
}