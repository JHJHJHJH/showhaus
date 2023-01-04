import React from 'react';
import Map from 'react-map-gl';
import { useSelector, useDispatch } from 'react-redux'
import { updateViewState } from '../reducers/mapViewStateSlice';
import {MapProvider} from 'react-map-gl';
import { LngLatBounds } from 'mapbox-gl';
import GeocoderControl from './map-ui/GeocoderControl';
import 'mapbox-gl/dist/mapbox-gl.css';

// import DrawControl from './map-ui/DrawControl';
import TransactionLayers from './layers/TransactionLayers';
import MarkerLayer from './layers/MarkerLayer';
// import PositionMarker from './PositionMarker';
export default function MapContainer(){

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
    
    const handleLoad = async (e) => {
        if( map.current != null ){
            console.log("Assigning click event...");
            
            map.current.on('click', (event) => {
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
                    
                    <GeocoderControl 
                        mapboxAccessToken={process.env.REACT_APP_MAPBOX_API_KEY} 
                        position="top-left" 
                    />

                    {/* <MrtLayers/> */}
                    <TransactionLayers/>
                    <MarkerLayer/>

                </Map>
                {/* <ControlPanel/> */}

            </MapProvider>
        </>

    );
}