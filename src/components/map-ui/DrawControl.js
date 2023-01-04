import MapboxDraw from '@mapbox/mapbox-gl-draw';
import {useControl, useMap} from 'react-map-gl';
import { distance } from '@turf/turf';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
export default function DrawControl(props) {
    const { map } = useMap();
    map.on('draw.create', (event) => {
        
        const featureCollection = draw.getAll();
        
        if( featureCollection.features.length > 1 ){
            
            const firstId = featureCollection.features[0].id;
            draw.delete( firstId );
        }

        var options = {
            units: 'kilometers'
        }; // units can be degrees, radians, miles, or kilometers, just be sure to change the units in the text box to match. 
        const points = featureCollection.features[0].geometry.coordinates;

        var total = 0;
        for (let i = 0; i < points.length-1; i++) {
            const from = points[i];
            const to = points[i+1];
            var d = distance(to, from, options);
            total += d;    
        }
        
        console.log( "Distance: " + total + " km" );
        
    });
    const draw = useControl(
        () => 
            new MapboxDraw(props), {
        position: props.position
    });

  return null;
}