import React, {useEffect, useState} from "react";
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
function DeckGLOverlay(props) {
    const overlay = useControl(() => new MapboxOverlay(props));
    overlay.setProps(props);
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
    const [time, setTime] = useState(0);
    const [animation] = useState({});
    const [mrtGeojson, SetMrtGeojson] = useState(null);
    const [mrtTripsData, SetMrtTripsData] = useState(null);

    const animate = () => {
        const animationSpeed = 1; 
        
        setTime(t => (t + animationSpeed) % loopLength);
        
        animation.id = window.requestAnimationFrame(animate);
    };

    useEffect(() => {
        animation.id = window.requestAnimationFrame(animate);
        return () => window.cancelAnimationFrame(animation.id);
    }, [animation]);

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
            // "icon-halo-color": "rgba(255, 0, 0 ,0.5)",
            "icon-color": ['get', 'COLOR'],
            // "icon-halo-color": ['get', 'COLOR'],
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
    const stnStyle = {
        id: 'rail_stn',
        type: 'circle',
        paint: {
            'circle-color': ['get','COLOR'],
            // 'circle-radius': 5,
            // When zoom is 10, txt-size is 0.
            // When zoom(into) is 20, txt-size is 10
            "circle-radius": ['interpolate', ['linear'], ['zoom'], 10, 2, 20, 6], 
            'circle-opacity':0.7
        }
    };
    const stnTxtStyle = {
        "id": "rail_stn_txt",
        "type": "symbol",
        "paint": {
            "text-color": ['get','COLOR'], //Color of your choice
            // "text-halo-blur": textHaloBlur,
            // "text-halo-color": textHaloColor,
            // "text-halo-width": textHaloWidth,
            // "text-opacity": textOpacity
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
    const tripsLayer = new TripsLayer({
        id: 'mrt-layer',
        data : mrtTripsData,
        getPath: d => d.path,
        // deduct start timestamp from each data point to avoid overflow
        getTimestamps: d => d.timestamps,
        effects : theme.effects,
        getColor: d => d.color,
        opacity: 0.5,
        widthMinPixels: 2,
        lineCapRounded: true,
        fadeTrail: true,
        trailLength: 150,
        currentTime: time,
        depthTest: false
    });

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
    useEffect(() => { 
        function generateTripsData( railLines ){

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
                // var reversedPoints = []
                // var reversedTimestamp = []
                for (let i = 0; i < coordinates.length; i++) {
                    const index = i;
                    const coord = coordinates[index];
    
                    points.push(coord);
                    timestamp.push( i * loopLength/coordinates.length  );

                    // reversedPoints.push( coordinates[coordinates.length-i]);
                    // reversedTimestamp.push( i * loopLength/coordinates.length  );
                }

                const pathObj = {
                    "path" : points,
                    "timestamps" : timestamp,
                    "color" : mapMrtColors(railLine)
                }

                // const reversedPathObj = {
                //     "path" : reversedPoints,
                //     "timestamps" : reversedTimestamp,
                //     "color" : mapMrtColors(railLine)
                // }

                tripsData.push( pathObj );
                // tripsData.push( reversedPathObj );

            }
        
            // console.log(tripsData );
            return tripsData;
        }
        
        async function init(){
            try {
                const tripsData = generateTripsData( MRTLRTStn );
            
                SetMrtTripsData(tripsData);

            } catch (e) {
                console.error(e);
            }
        }

        init();

    }, [mrtGeojson] );

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

                    //SetMrtFoundGeojson(foundMrts);
                    
                    dispatch( updateMrtInRadius(foundMrts ));
                    // console.log ( "Transactions within radius...");
                    // console.log(foundMrts) ;                   
                }

                
            } catch (e) {
                console.error(e);
            }
        }

        update();

    }, [searchRadiusState.location, searchRadiusState.radius, MRT_RAIL_STN] );  // eslint-disable-line react-hooks/exhaustive-deps

    return(
        <>
            {/* <Source id="mrt"  type="geojson" data={mrtGeojson} >
                <Layer {...mrtStyle} />
            </Source> */}

            <Source id="rail_stn"  type="geojson" data={MRT_RAIL_STN} >
                <Layer {...stnIconStyle} />
                <Layer {...stnTxtStyle} />
                {/* <Layer {...stnStyle} /> */}
            </Source>
            <Source id="rail_line"  type="geojson" data={RAIL_LINE_BASE} >
                <Layer {...baseMrtStyle} />
            </Source>
            <DeckGLOverlay layers={[ tripsLayer ]}/>;
        </>
    );
}