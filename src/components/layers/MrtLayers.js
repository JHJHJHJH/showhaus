import React, {useEffect, useState} from "react";
import MRTLRTStn from '../../resources/MRT_RAIL_LINE_5M.json'
import MRT_RAIL_STN from  '../../resources/RAIL_STN.geojson'
// import RAIL_LINE_BASE from '../../resources/RAIL_LINE_BASE.geojson'
import { useControl, Source, Layer} from 'react-map-gl';
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


export default function MrtLayers( {theme = DEFAULT_THEME, loopLength = 120 } ){
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

    // const geojsonLyr = new GeoJsonLayer({
    //     id: 'geojson-layer',
    //     MRTLRTgeojson,
    //     pickable: true,
    //     stroked: false,
    //     filled: true,
    //     extruded: true,
    //     pointType: 'circle',
    //     lineWidthScale: 20,
    //     lineWidthMinPixels: 2,
    //     getFillColor: [160, 160, 180, 200],
    //     getLineColor: d => mapMrtColors(d.properties['RAIL_LINE']),
    //     getPointRadius: 100,
    //     getLineWidth: 1,
    //     getElevation: 30
    //   });
    const mrtStyle = {
        id: 'rail_line',
        type: 'line',
        paint: {
            'line-color': ['get','COLOR'],
            'line-width': 3,
            'line-opacity':0.4
        }
    };
    const stnStyle = {
        id: 'rail_stn',
        type: 'circle',
        paint: {
            'circle-color': ['get','COLOR'],
            'circle-radius': 5,
            'circle-opacity':0.7
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
        opacity: 0.1,
        widthMinPixels: 5,
        rounded: true,
        fadeTrail: true,
        trailLength: 5000,
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
                console.log(feature)
                var points = [];
                var timestamp = [];
                if( feature['geometry']['type'] !== 'LineString'){
                    break;
                }
              
                var coordinates = feature['geometry']['coordinates'];
                console.log(coordinates)
                var railLine = feature['properties']['RAIL_LINE'];
    
                for (let i = 0; i < coordinates.length; i++) {
                        
                    // const index = i % (stations.length) ;
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
        
            // console.log(tripsData );
            return tripsData;
        }
        


        async function init(){
            try {
                // console.log( MRTLRTStn );
                // const categorised = categoriseStations(MRTLRTStn);
                // const sorted  = sortCategorisedStations( categorised );
                const tripsData = generateTripsData( MRTLRTStn );
            
                SetMrtTripsData(tripsData);

            } catch (e) {
                console.error(e);
            }
        }


        // init();

    }, [mrtGeojson] );

    return(
        <>
            {/* <Source id="mrt"  type="geojson" data={mrtGeojson} >
                <Layer {...mrtStyle} />
            </Source> */}
            {/* <Source id="rail_line"  type="geojson" data={RAIL_LINE_BASE} >
                <Layer {...mrtStyle} />
            </Source> */}
            <Source id="rail_stn"  type="geojson" data={MRT_RAIL_STN} >
                <Layer {...stnStyle} />
            </Source>
            {/* <DeckGLOverlay layers={[ tripsLayer ]}/>; */}
        </>
    );
}