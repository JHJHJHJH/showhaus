import React, {useEffect, useState} from "react";
import MRTLRTStn from '../../resources/MRTLRTStn_EPSG4326.json'
import { useControl} from 'react-map-gl';
import {MapboxOverlay} from '@deck.gl/mapbox';
import { TripsLayer } from 'deck.gl';
import {AmbientLight, PointLight, LightingEffect} from '@deck.gl/core';

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


export default function MrtLayers( {theme = DEFAULT_THEME, loopLength = 1800 } ){
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

    // const mrtStyle = {
    //     id: 'mrt',
    //     type: 'circle',
    //     paint: {
    //         'circle-radius': 4,
    //         'circle-color': '#009645',
    //         'circle-opacity': 0.6
    //     }
    // };
    const tripsLayer = new TripsLayer({
        id: 'mrt-layer',
        data : mrtTripsData,
        getPath: d => d.path,
        // deduct start timestamp from each data point to avoid overflow
        getTimestamps: d => d.timestamps,
        effects : theme.effects,
        getColor: d => d.color,
        opacity: 0.8,
        widthMinPixels: 3,
        rounded: true,
        fadeTrail: true,
        trailLength: 10000,
        currentTime: time,
        depthTest: false
      });
    // const lineLayer =  new LineLayer({
    //     id: 'line',
    //     data: mrtTripsData,
    //     opacity: 0.8,
    //     getSourcePosition: d => d.start,
    //     getTargetPosition: d => d.end,
    //     getColor: d => d.color,
    //     getWidth: 1,
    //     pickable: true
    //   })
    useEffect(() => {
        function cleanDuplicateStations( mrtJson ){
            const cleaned = { type: "FeatureCollection", features: [] }
            const stationList = []
            for (let i = 0; i < mrtJson.features.length; i++) {
                const feature = mrtJson.features[i];
                const stnName = feature.properties['STN_NAME'];
                
                if( !stationList.includes(stnName) ){
                    cleaned.features.push( feature );
                    stationList.push( stnName);
                }
            }
            return cleaned;
        }
        
        function categoriseStations( mrtJson ){
            const cleanedMrtJson = cleanDuplicateStations( mrtJson );
            const stationDict = {}
        
            for (let i = 0; i < cleanedMrtJson.features.length; i++) {
                const feature = JSON.parse(JSON.stringify(cleanedMrtJson.features[i]));
                const stationNumber = feature.properties['STN_NO'];
                
                const split = stationNumber.split('/');
                for (let j = 0; j < split.length; j++) {
                    const clonedFeature = JSON.parse(JSON.stringify(cleanedMrtJson.features[i]));
                    const line = split[j].substring(0,2);
                    const number = split[j].substring(2);
                    clonedFeature.properties["LINE"] = line;
                    clonedFeature.properties["LINE_NO"] = number;
                    
                    if( line in stationDict ){
                        stationDict[ line ].push( clonedFeature );
                    }
                    else {
                        stationDict[ line ] = [ clonedFeature ];
                    }
                }
        
                cleanedMrtJson.features[i] = feature;
            }
        
            return stationDict;
        }
        
        function sortCategorisedStations( categorisedStations ){
        
            const clonedStations = JSON.parse(JSON.stringify(categorisedStations));
        
            for (const key in clonedStations) {
                const stations = clonedStations[key];
                //console.log(  stations )
                stations.sort(function(a,b){
                    return a.properties['LINE_NO'] - b.properties['LINE_NO'];
                });
        
                clonedStations[key] = stations;
            }
        
            return clonedStations;
        
        }
        
        function generateTripsData( sortedStations ){

            var tripsData = []
            //var numberOfPoints = 100;
            for (const key in sortedStations) {
                var points = [];
                var timestamp = [];
                if (Object.hasOwnProperty.call(sortedStations, key)) {
                    const stations = sortedStations[key];
                    
                    if( stations.length < 2){
                        break;
                    }
        
                    for (let i = 0; i < stations.length; i++) {
                        
                        // const index = i % (stations.length) ;
                        const index = i;
                        const station = stations[index];
        
                        points.push(station.geometry.coordinates);
                        timestamp.push( i * loopLength/stations.length  );
                    }
                }
                const pathObj = {
                    "path" : points,
                    "timestamps" : timestamp,
                    "color" : mapMrtColors(key)
                }
                tripsData.push( pathObj );
            }
        
            console.log(tripsData );
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

        async function init(){
            try {

                const categorised = categoriseStations(MRTLRTStn);
                const sorted  = sortCategorisedStations( categorised );
                const tripsData = generateTripsData( sorted );
            
                SetMrtTripsData(tripsData);

            } catch (e) {
                console.error(e);
            }
        }


        init();

    }, [mrtGeojson] );

    return(
        <>
            {/* <Source id="mrt"  type="geojson" data={mrtGeojson} >
                <Layer {...mrtStyle} />
            </Source> */}
            <DeckGLOverlay layers={[tripsLayer]}/>;
        </>
    );
}