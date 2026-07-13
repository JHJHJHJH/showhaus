import * as React from 'react';
import {useState, useEffect } from 'react';
import { useSelector} from 'react-redux';
import { useControl } from 'react-map-gl';
import {MapboxOverlay} from '@deck.gl/mapbox';
import { ScatterplotLayer, TripsLayer} from 'deck.gl';
import {AmbientLight, PointLight, LightingEffect} from '@deck.gl/core';

function DeckGLOverlay(props) {
    const overlay = useControl(() => new MapboxOverlay(props));
    overlay.setProps(props);
    return null;
}

function calculatePattern( long, lat ){
    var numberOfPoints = 500;
    const dist = 0.0000025;
    var points = [];
    for (let i = 0; i < numberOfPoints; i++) {
        const theta = Math.PI/32 * Math.E * i ;
        
        const x= i * Math.cos( theta ) * dist; //long
        const y= i * Math.sin( theta ) * dist; //lat

        points.push({ 
            position: [long+x, lat +y ] ,
            size: 1
        });

    }
    // console.log( points );

    return points;
}

function calculateTripsPattern( long, lat ){
  var numberOfPoints = 500;
  const dist = 0.0000025;
  var points = [];
  for (let i = 0; i < numberOfPoints; i++) {
      const theta = Math.PI/32   * Math.E * i ;
      
      const x= i * Math.cos( theta ) * dist; //long
      const y= i * Math.sin( theta ) * dist; //lat

      points.push({ 
          position: [long+x, lat +y ] ,
          timestamp: i
      });

  }
  // console.log( points );

  return [points];
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


export default function MarkerLayer({theme = DEFAULT_THEME }) {
  const [time, setTime] = useState(0);
  const [animation] = useState({});

  const animate = () => {
    const loopLength = 500; // unit corresponds to the number of points
    const animationSpeed = 1; 
    
    setTime(t => (t + animationSpeed) % loopLength);
    animation.id = window.requestAnimationFrame(animate);
  };

  useEffect(() => {
    animation.id = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animation.id);
  }, [animation]); // eslint-disable-line react-hooks/exhaustive-deps

  const searchRadiusState = useSelector((state) => state.searchRadiusState );

  const scatterplotLayer = new ScatterplotLayer({
    id: 'my-scatterplot',
    // data: [
    //   {position: [ transactionState.location.longitude ,  transactionState.location.latitude], size: 2}
    // ],
    data : calculatePattern( searchRadiusState.location.longitude ,  searchRadiusState.location.latitude),
    opacity: 0.2,
    stroked: false,
    filled: true,
    getPosition: d => d.position,
    getRadius: d => 0.5,
    getFillColor: d => [0, 255, 0],
    getLineColor: d => [0, 0, 0]
  });
  /**
   * Data format:
   * [
   *   {
   *     waypoints: [
   *      {coordinates: [-122.3907988, 37.7664413], timestamp: 1554772579000}
   *      {coordinates: [-122.3908298,37.7667706], timestamp: 1554772579010}
   *       ...,
   *      {coordinates: [-122.4485672, 37.8040182], timestamp: 1554772580200}
   *     ]
   *   }
   * ]
   */
  const tripsLayer = new TripsLayer({
    id: 'trips-layer',
    data : calculateTripsPattern( searchRadiusState.location.longitude ,  searchRadiusState.location.latitude),
    getPath: d => d.map( p => p.position),
    // deduct start timestamp from each data point to avoid overflow
    getTimestamps: d => d.map( p => p.timestamp ),
    effects : theme.effects,
    getColor: [253, 128, 93],
    opacity: 0.8,
    widthMinPixels: 0.8,
    lineCapRounded: true,
    fadeTrail: true,
    trailLength: 1000,
    currentTime: time
  });

  
  return <DeckGLOverlay layers={[tripsLayer, scatterplotLayer]}/>;
}