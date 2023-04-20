import React from 'react';
import Map from 'react-map-gl';
import { updateLocation } from '../reducers/searchRadiusSlice';
import { useSelector, useDispatch } from 'react-redux'
import { updateViewState } from '../reducers/mapViewStateSlice';
import { MapProvider, Popup, Marker, NavigationControl} from 'react-map-gl';
import { LngLatBounds } from 'mapbox-gl';
import GeocoderControl from './map-ui/GeocoderControl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MrtLayers from './layers/MrtLayers';
// import DrawControl from './map-ui/DrawControl';
import TransactionLayers from './layers/TransactionLayers';
import MarkerLayer from './layers/MarkerLayer';
// import PositionMarker from './PositionMarker';
import SMRT_ICON from '../resources/smrt-icon.svg'
import SearchRadiusLayer from './layers/SearchRadiusLayer';
export default function MapContainer(){
    const searchRadiusState = useSelector((state) => state.searchRadiusState );
    const mapViewState = useSelector((state) => state.mapViewState );
    const [showPopup, setShowPopup] = React.useState(true);
    const [latitudePopup, setLatitudePopup] = React.useState(0);
    const [longitudePopup, setLongitudePopup] = React.useState(0);
    
    const dispatch = useDispatch();
    const map = React.useRef();


    const maxBounds = (m) => {
        const b = new LngLatBounds( [ m.maxBounds.minLon,  m.maxBounds.minLat], [ m.maxBounds.maxLon,  m.maxBounds.maxLat ] )
        return b;
    }

    const handleOnMove = (evt, map) => {        
        dispatch(updateViewState(evt.viewState)) ;

    }
    //add svg icon during runtime
    const image = new Image(30, 18);
    image.src = SMRT_ICON;

    //ADD MAPBOX MARKER ON CLICK
    function add_marker (event) {
        var coordinates = event.lngLat;
        //console.log('Marker | Lng:', coordinates.lng, 'Lat:', coordinates.lat);
        dispatch(updateLocation({ "latitude": coordinates.lat, "longitude" : coordinates.lng })) ;
        // markerTransact.setLngLat(coordinates).addTo(map.current.getMap() );
    }
    function formatPrice(price) {
        return "$" + price.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,");
    }

    const [projectName, setProjectName] = React.useState('');
    const [streetName, setStreetName] = React.useState('');
    const [numOfTransactions, setNumOfTransactions] = React.useState('');
    const [price, setPrice] = React.useState('');
    const handleLoad = async (e) => {
        if( map.current != null ){
            //ASSIGN CLICK EVENTS
            map.current.on('dblclick', add_marker );

            // map.current.on('click', (event) => {
            //     // If the user clicked on one of your markers, get its information.
            //     const features = map.current.getMap().queryRenderedFeatures(event.point, {
            //       layers: ['transactions']
            //     });
                
            //     if (!features.length) { return; }
            //     const feature = features[0];

            //     const featTransaction = JSON.parse(feature.properties.transactions)
            //     console.log( featTransaction );
            //     //dispatch(onSelectSite(feature.properties.name));
                
            // });

            map.current.addImage('smrt-icon', image, { sdf: true })
            //console.log(map.current) //debug

            map.current.on('click', 'clusters', (event) => {
                var latLng = event.features[0].geometry.coordinates;
                
                setLatitudePopup( latLng[0] );
                setLongitudePopup( latLng[1] );
                const projectName =  event.features[0].properties.project;
                const streetName =  event.features[0].properties.street;
                const numOfTransactions = event.features[0].properties.noOfTransactions;
                const formattedPrice = formatPrice( event.features[0].properties.highestPrice );
                
                setProjectName(projectName);
                setStreetName(streetName);
                setNumOfTransactions(numOfTransactions);
                setPrice(formattedPrice);
                setShowPopup(true);
            });
        }
    }

    return (
        <>
            <MapProvider>

                {/* <PositionMarker lat={mapViewState.latitude.toFixed(4)} lng={  mapViewState.longitude.toFixed(4) } zoom={ mapViewState.zoom.toFixed(4)}/> */}
                <Map
                    ref = {map}
                    id="map" //dictates name of useMap object
                    // style={{position: 'relative', width: '100%', height: '100%' }}
                    width ="100%"
                    height="100%"
                    mapStyle="mapbox://styles/han-aectech/ckzo28onn00k914p8bmr9hs03"
                    mapboxAccessToken={process.env.REACT_APP_MAPBOX_API_KEY}
                    initialViewState= {{
                        longitude: mapViewState.longitude,
                        latitude: mapViewState.latitude,
                        zoom: mapViewState.zoom
                    }}
                    maxBounds={ maxBounds(mapViewState) }
                    onLoad={handleLoad}
                    onMoveEnd = { evt => handleOnMove(evt, map) }
                >
                    
                    {/* <DrawControl
                        position="bottom-left"
                        displayControlsDefault={false}
                        controls={{
                            line_string: true,
                            trash: true
                        }}
                    /> */}

                    {/* PRICE POPUP  */}
                    {showPopup && (
                        <Popup longitude={latitudePopup} latitude={longitudePopup}
                            anchor="bottom"
                            onClose={() => setShowPopup(false)}
                            closeOnClick={false}
                        >
                            
                            <p><b>Project : </b> {projectName}</p>
                            <p><b>Street : </b> {streetName}</p>
                            <p><b>Transactions : </b> {numOfTransactions}</p>
                            <p><b>Price : </b> {price}</p>
                            
                        </Popup>)}
                    {/* TRANSACTION MARKER */}
                    <Marker longitude={ searchRadiusState.location.longitude } 
                            latitude={ searchRadiusState.location.latitude }/>
                    <GeocoderControl 
                        mapboxAccessToken={process.env.REACT_APP_MAPBOX_API_KEY} 
                        position="top-left"
                    />
                    <TransactionLayers/>
                    <SearchRadiusLayer/>
                    <MrtLayers/>
                    <TransactionLayers/>
                    <MarkerLayer/>
                    <NavigationControl/>

                </Map>
                {/* <ControlPanel/> */}

            </MapProvider>
        </>

    );
}