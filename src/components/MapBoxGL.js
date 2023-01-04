import React, { useEffect, useRef, useState } from "react";
// eslint-disable-next-line import/no-webpack-loader-syntax
import mapboxgl from "!mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
// eslint-disable-next-line import/no-webpack-loader-syntax, import/no-unresolved
//mapboxgl.workerClass = require('worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker').default;
const styles = {
  width: "100vw",
  height: "calc(100vh)",
  position: "absolute"
};

const MapboxGLMap = (props) => {
  const [map, setMap] = useState(null);
  const mapContainer = useRef(null);

  useEffect(() => {
    mapboxgl.accessToken = props.mapboxAccessToken;
    const initializeMap = ({ setMap, mapContainer }) => {
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: props.mapStyle, // stylesheet location
        center: [0, 0],
        zoom: 5
      });

      map.on("load", () => {
        setMap(map);
        map.resize();
      });
    };

    if (!map) initializeMap({ setMap, mapContainer });
  }, [map]);

  return <div ref={el => (mapContainer.current = el)} style={styles} />;
};

export default MapboxGLMap;