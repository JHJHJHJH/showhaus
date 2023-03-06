import React from 'react';
import Map from 'react-map-gl';
import { updateLocation } from '../reducers/transactionSlice';
import { useSelector, useDispatch } from 'react-redux'
import { updateViewState } from '../reducers/mapViewStateSlice';
import { MapProvider, Marker} from 'react-map-gl';
import { LngLatBounds } from 'mapbox-gl';
import GeocoderControl from './map-ui/GeocoderControl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MrtLayers from './layers/MrtLayers';
// import DrawControl from './map-ui/DrawControl';
import TransactionLayers from './layers/TransactionLayers';
import MarkerLayer from './layers/MarkerLayer';
// import PositionMarker from './PositionMarker';
import SMRT_ICON from '../resources/smrt-icon.svg'
export default function MapContainer(){
 
    const transactionState = useSelector((state) => state.transactionState );
    const mapViewState = useSelector((state) => state.mapViewState );
    // const transactionState  = useSelector((state) => state.transactionState );
    
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

    // var markerTransact = new Marker();
    function add_marker (event) {
        var coordinates = event.lngLat;
        console.log('Lng:', coordinates.lng, 'Lat:', coordinates.lat);
        dispatch(updateLocation({ "latitude": coordinates.lat, "longitude" : coordinates.lng })) ;

        // markerTransact.setLngLat(coordinates).addTo(map.current.getMap() );
    }
    const handleLoad = async (e) => {
        if( map.current != null ){
            console.log("Assigning click events...");
            
            map.current.on('click', add_marker );

            map.current.on('click', (event) => {
                // var coordinates = event.lngLat;
                // console.log('Lng:', coordinates.lng, 'Lat:', coordinates.lat);
                // marker.setLngLat(coordinates).addTo(map.current.getMap());

                // If the user clicked on one of your markers, get its information.
                const features = map.current.getMap().queryRenderedFeatures(event.point, {
                  layers: ['transactions']
                });
                
                if (!features.length) { return; }
                const feature = features[0];

                const featTransaction = JSON.parse(feature.properties.transactions)
                console.log( featTransaction );
                //dispatch(onSelectSite(feature.properties.name));
                
            });

            map.current.addImage('smrt-icon', image, { sdf: true })
            
            //console.log(map.current) //debug

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
                    onMove = { evt => handleOnMove(evt, map) }
                >
                    
                    {/* <DrawControl
                        position="bottom-left"
                        displayControlsDefault={false}
                        controls={{
                            line_string: true,
                            trash: true
                        }}
                    /> */}
                    <Marker longitude={ transactionState.location.longitude } 
                            latitude={ transactionState.location.latitude }/>
                    <GeocoderControl 
                        mapboxAccessToken={process.env.REACT_APP_MAPBOX_API_KEY} 
                        position="top-left"
                    />
                    <MrtLayers/>
                    <TransactionLayers/>
                    <MarkerLayer/>

                </Map>
                {/* <ControlPanel/> */}

            </MapProvider>
        </>

    );
}