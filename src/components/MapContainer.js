import React from 'react';
import Map from 'react-map-gl';
import { updateLocation } from '../reducers/searchRadiusSlice';
import { useSelector, useDispatch } from 'react-redux'
import { updateViewState } from '../reducers/mapViewStateSlice';
import { MapProvider, Marker, NavigationControl} from 'react-map-gl';
import mapboxgl, { LngLatBounds } from 'mapbox-gl';
import GeocoderControl from './map-ui/GeocoderControl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MrtLayers from './layers/MrtLayers';
// import DrawControl from './map-ui/DrawControl';
import TransactionLayers from './transaction/TransactionLayers';
// import PositionMarker from './PositionMarker';
import SMRT_ICON from '../resources/smrt-icon.svg'
import SearchRadiusLayer from './layers/SearchRadiusLayer';
import SchoolLayer from './layers/SchoolLayer';
import LandUseLayer from './layers/LandUseLayer';
import { TransactionPopup } from './transaction/TransactionPopup';

// The following is required to stop mapbox-gl from throwing an error in some environments
// when using it with Webpack 5 / react-scripts 5.
// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
mapboxgl.workerClass = require('worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker').default;

export default function MapContainer({ onMapDoubleClick }){
    const searchRadiusState = useSelector((state) => state.searchRadiusState );
    const mapViewState = useSelector((state) => state.mapViewState );

    const dispatch = useDispatch();
    const map = React.useRef();
    const mapContainer = React.useRef();
    const searchRadiusStateRef = React.useRef(searchRadiusState);
    const onMapDoubleClickRef = React.useRef(onMapDoubleClick);

    React.useEffect(() => {
        searchRadiusStateRef.current = searchRadiusState;
    }, [searchRadiusState]);

    React.useEffect(() => {
        onMapDoubleClickRef.current = onMapDoubleClick;
    }, [onMapDoubleClick]);

    React.useEffect(() => {
        if (!mapContainer.current) {
            return undefined;
        }

        const resizeMap = () => {
            map.current?.resize?.();
            map.current?.getMap?.()?.resize?.();
        };

        if (!window.ResizeObserver) {
            window.addEventListener('resize', resizeMap);
            return () => window.removeEventListener('resize', resizeMap);
        }

        const resizeObserver = new window.ResizeObserver(resizeMap);
        resizeObserver.observe(mapContainer.current);
        resizeMap();

        return () => resizeObserver.disconnect();
    }, []);

    const maxBounds = (m) => {
        const b = new LngLatBounds( [ m.maxBounds.minLon,  m.maxBounds.minLat], [ m.maxBounds.maxLon,  m.maxBounds.maxLat ] )
        return b;
    }

    const searchRadiusBounds = React.useCallback((lngLat, radiusInKm) => {
        const latDelta = radiusInKm / 110.574;
        const latRadians = lngLat.lat * Math.PI / 180;
        const lngDelta = radiusInKm / (111.320 * Math.max(Math.cos(latRadians), 0.01));

        return new LngLatBounds(
            [lngLat.lng - lngDelta, lngLat.lat - latDelta],
            [lngLat.lng + lngDelta, lngLat.lat + latDelta]
        );
    }, []);

    const fitBoundsPadding = React.useCallback(() => {
        const bounds = mapContainer.current?.getBoundingClientRect();
        const shortestSide = Math.min(bounds?.width || 0, bounds?.height || 0);
        const padding = Math.max(40, Math.min(96, Math.round(shortestSide * 0.12)));

        return { top: padding, bottom: padding, left: padding, right: padding };
    }, []);

    const fitMapToSearchRadius = React.useCallback((location, radius, duration = 350) => {
        if (!map.current || location.latitude === 0 || location.longitude === 0) {
            return;
        }

        map.current.fitBounds(
            searchRadiusBounds({ lng: location.longitude, lat: location.latitude }, radius),
            { padding: fitBoundsPadding(), duration }
        );
    }, [fitBoundsPadding, searchRadiusBounds]);

    const nextAnimationDurationRef = React.useRef(null);

    React.useEffect(() => {
        const duration = nextAnimationDurationRef.current ?? 350;
        fitMapToSearchRadius(searchRadiusState.location, searchRadiusState.radius, duration);
        nextAnimationDurationRef.current = null;
    }, [fitMapToSearchRadius, searchRadiusState.location, searchRadiusState.radius]);

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
        onMapDoubleClickRef.current?.();
        nextAnimationDurationRef.current = 3000;
        dispatch(updateLocation({ "latitude": coordinates.lat, "longitude" : coordinates.lng })) ;
    }

    const handleLoad = async (e) => {
        if( map.current != null ){
            //ASSIGN CLICK EVENTS
            map.current.on('dblclick', add_marker );

            map.current.addImage('smrt-icon', image, { sdf: true });

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

            

        }
    }

    return (
        <div ref={mapContainer} className="relative h-full w-full">
            <MapProvider>

                {/* <PositionMarker lat={mapViewState.latitude.toFixed(4)} lng={  mapViewState.longitude.toFixed(4) } zoom={ mapViewState.zoom.toFixed(4)}/> */}
                <Map
                    ref = {map}
                    id="map" //dictates name of useMap object
                    style={{ width: '100%', height: '100%' }}
                    mapStyle="mapbox://styles/mapbox/light-v11"
                    mapboxAccessToken={process.env.REACT_APP_MAPBOX_API_KEY}
                    initialViewState= {{
                        longitude: mapViewState.longitude,
                        latitude: mapViewState.latitude,
                        zoom: mapViewState.zoom
                    }}
                    maxBounds={ maxBounds(mapViewState) }
                    onLoad={handleLoad}
                    onMoveEnd = { evt => handleOnMove(evt, map) }
                    doubleClickZoom={false}
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
                    <TransactionPopup/>
                    {/* TRANSACTION MARKER */}
                    <Marker longitude={ searchRadiusState.location.longitude } 
                            latitude={ searchRadiusState.location.latitude }/>
                    <GeocoderControl 
                        mapboxAccessToken={process.env.REACT_APP_MAPBOX_API_KEY} 
                        position="top-left"
                    />
                    
                    <LandUseLayer/>
                    <SearchRadiusLayer/>
                    <MrtLayers/>
                    <SchoolLayer/>
                    <TransactionLayers/>
                    {/* <MarkerLayer/> */}
                    <NavigationControl/>

                </Map>
                {/* <ControlPanel/> */}

            </MapProvider>
            <div className="pointer-events-none absolute bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-full border border-slate-200 bg-white/95 px-4 py-2 text-center text-xs font-semibold text-slate-800 shadow-lg shadow-slate-900/10 backdrop-blur sm:text-sm">
                📍 Dbl-click on the map to explore!
            </div>
        </div>

    );
}
