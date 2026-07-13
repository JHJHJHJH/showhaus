import React from "react";
import '../styles/PositionMarker.css'
export default function PositionMarker( props ){
    return(
        <div className="position-marker" style={{zIndex: '1'}}>
            Longitude: {props.lng} | Latitude: {props.lat} | Zoom: {props.zoom}
        </div>
    )
}