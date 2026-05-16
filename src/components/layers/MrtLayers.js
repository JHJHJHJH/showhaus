import React, {useEffect, useMemo, useRef} from "react";
import MRTLRTStn from '../../resources/rail-line-dense5m.json'
import RAIL_LINE_BASE from '../../resources/rail-line-base.geojson'
import { useControl, Source, Layer } from 'react-map-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { TripsLayer } from 'deck.gl';
import { AmbientLight, PointLight, LightingEffect } from '@deck.gl/core';
import { useSelector, useDispatch } from "react-redux";
import { booleanPointInPolygon, featureCollection } from '@turf/turf';
import MRT_RAIL_STN from  '../../resources/RAIL_STN.js'
import { updateMrtInRadius } from "../../reducers/searchRadiusSlice";

function MrtTripsOverlay({data, theme, loopLength}) {
    const overlay = useControl(() => new MapboxOverlay({layers: []}));
    const propsRef = useRef({data, theme, loopLength});

    useEffect(() => {
        propsRef.current = {data, theme, loopLength};
    }, [data, theme, loopLength]);

    useEffect(() => {
        let animationId;
        let lastFrameTime;
        let currentTime = 0;

        const animate = (frameTime) => {
            if(lastFrameTime == null){
                lastFrameTime = frameTime;
            }

            const elapsedFrames = (frameTime - lastFrameTime) / (1000 / 60);
            lastFrameTime = frameTime;
            currentTime = (currentTime + elapsedFrames) % propsRef.current.loopLength;

            overlay.setProps({
                layers: propsRef.current.data ? [
                    createTripsLayer({
                        data: propsRef.current.data,
                        theme: propsRef.current.theme,
                        currentTime,
                    })
                ] : [],
            });

            animationId = window.requestAnimationFrame(animate);
        };

        animationId = window.requestAnimationFrame(animate);

        return () => window.cancelAnimationFrame(animationId);
    }, [overlay]);

    return null;
}

const ambientLight = new AmbientLight({
    color: [255, 255, 255],
    intensity: 1.0
});
  
const pointLight = new PointLight({
    color: [255, 255, 255],
    intensity: 2.0,
    position: [-74.05, 40.7, 8000]
});

const material = {
    ambient: 0.1,
    diffuse: 0.6,
    shininess: 32,
    specularColor: [60, 64, 70]
};

const lightingEffect = new LightingEffect({ambientLight, pointLight});

const DEFAULT_THEME = {
    buildingColor: [74, 80, 87],
    trailColor0: [253, 128, 93],
    trailColor1: [23, 184, 190],
    material,
    effects: [lightingEffect]
};


export default function MrtLayers( {theme = DEFAULT_THEME, loopLength = 800 } ){
    
    const dispatch = useDispatch();
    const mrtTripsData = useMemo(() => generateTripsData(MRTLRTStn, loopLength), [loopLength]);

    const stnIconStyle = {
        id: 'rail_stn_icon',
        type: 'symbol',
        layout: {
            'icon-image': 'smrt-icon',
            'icon-allow-overlap': true,
            'icon-offset' : [0,-20],
            'icon-size': ['interpolate', ['linear'], ['zoom'], 10, 0.5, 20, 1.3],
           
        },
        paint: {
            "icon-color": ['get', 'COLOR'],
            "icon-halo-width": 0.0
        }
    };

    const baseMrtStyle = {
        id: 'rail_line',
        type: 'line',
        paint: {
            'line-color': ['get','COLOR'],
            'line-width': 1,
            'line-opacity':0.4
        }
    };

    const stnTxtStyle = {
        "id": "rail_stn_txt",
        "type": "symbol",
        "paint": {
            "text-color": ['get','COLOR'], //Color of your choice
        },
        "layout": {
            "text-field": ['get', 'STN_NAME'], 
            // When zoom is 10, txt-size is 0.
            // When zoom(into) is 20, txt-size is 10
            "text-size": ['interpolate', ['linear'], ['zoom'], 10, 0, 20, 10], 
            // "text-font": textFontFamily,
            "text-rotation-alignment": "auto",
            "text-allow-overlap": true,
            "text-anchor": "top",
            "text-offset": [0, -4]
        }
    };
    const searchRadiusState = useSelector((state) => state.searchRadiusState );

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
                if( searchRadiusState.location.latitude !== 0 && searchRadiusState.location.longitude !== 0 && MRT_RAIL_STN != null){

                    var featuresInBuffer = getFeaturesWithinRadius(MRT_RAIL_STN, searchRadiusState.searchRadius);
                    
                    const foundMrts = featureCollection(featuresInBuffer);

                    dispatch( updateMrtInRadius(foundMrts ));
                }

                
            } catch (e) {
                console.error(e);
            }
        }

        update();

    }, [searchRadiusState.location, searchRadiusState.radius, MRT_RAIL_STN] );  // eslint-disable-line react-hooks/exhaustive-deps

    return(
        <>
            <Source id="rail_stn"  type="geojson" data={MRT_RAIL_STN} >
                <Layer {...stnIconStyle} />
                <Layer {...stnTxtStyle} />
            </Source>
            <Source id="rail_line"  type="geojson" data={RAIL_LINE_BASE} >
                <Layer {...baseMrtStyle} />
            </Source>
            <MrtTripsOverlay data={mrtTripsData} theme={theme} loopLength={loopLength} />
        </>
    );
}

function createTripsLayer({data, theme, currentTime}){
    return new TripsLayer({
        id: 'mrt-layer',
        data,
        getPath: d => d.path,
        getTimestamps: d => d.timestamps,
        effects : theme.effects,
        getColor: d => d.color,
        opacity: 0.5,
        widthMinPixels: 2,
        lineCapRounded: true,
        fadeTrail: true,
        trailLength: 150,
        currentTime,
        depthTest: false
    });
}

function generateTripsData( railLines, loopLength ){
    var tripsData = []
    const features = railLines['features'];
    for( const k in features ){
        const feature = features[k];

        let coordinates = {};
        if( feature['geometry']['type'] === 'LineString'){
            coordinates = feature['geometry']['coordinates']
        }
        else if ( feature['geometry']['type'] === 'MultiLineString'){
            coordinates = feature['geometry']['coordinates'][0]
        }
        
        var railLine = feature['properties']['RAIL_LINE'];
        var points = [];
        var timestamp = [];

        for (let i = 0; i < coordinates.length; i++) {
            const index = i;
            const coord = coordinates[index];

            points.push(coord);
            timestamp.push( i * loopLength/coordinates.length  );
        }

        const pathObj = {
            "path" : points,
            "timestamps" : timestamp,
            "color" : mapMrtColors(railLine)
        }

        tripsData.push( pathObj );
        
    }

    return tripsData;
}

function mapMrtColors( line ){
    let rgb = [0,0,0];
    switch(line){
        case 'NS':
            rgb = [228,53,48];
            break;
        case 'TE':
            rgb = [159,94,29];
            break;
        case 'EW':
        case 'CG':
            rgb = [12,153,67];
            break;
        case 'NE':
            rgb = [161,45,182];
            break;
        case 'CE':
        case 'CC':
            rgb = [255,162,35];
            break;
        case 'DT':
            rgb = [5,89,185];
            break;
        
        case 'PT':
        case 'ST':
        case 'SW':
        case 'BP':
        case 'PE':
        case 'PW':
        case 'SE':
            rgb = [142,155,144]
            break;
        default:
            throw new Error('MRT Line not supported');
    }
    return rgb;
}
