import React, { useEffect, useMemo, useState } from "react";
import { Source, Layer } from "react-map-gl";
import { useSelector } from "react-redux";
import { getLandUseGeojsonForKeys, getLandUseKey, getLandUseTypeColor } from "../../utils/landUseData";

const EMPTY_GEOJSON = {
    type: 'FeatureCollection',
    features: []
};

export default function LandUseLayer(){
    const landUsesInRadius = useSelector((state) => state.searchRadiusState.landUsesInRadius);

    const [landUsesInRadiusGeojson, setLandUsesInRadiusGeojson] = useState(EMPTY_GEOJSON);

    const landUseKeys = useMemo(() => (
        landUsesInRadius.map((landUse) => getLandUseKey(landUse))
    ), [landUsesInRadius]);

    useEffect(() => {
        let isCancelled = false;

        async function updateLandUseGeojson(){
            try {
                const geojson = await getLandUseGeojsonForKeys(landUseKeys);

                if(!isCancelled){
                    setLandUsesInRadiusGeojson(geojson);
                }
            } catch (e) {
                console.error(e);
            }
        }

        updateLandUseGeojson();

        return () => {
            isCancelled = true;
        };
    }, [landUseKeys]);

    const landUseFillStyle = {
        id: 'master-plan-2025-land-use-fill',
        type: 'fill',
        paint: {
            'fill-color': [
                'match',
                ['get', 'land_use_type'],
                'AGRICULTURE', getLandUseTypeColor('AGRICULTURE'),
                'BEACH AREA', getLandUseTypeColor('BEACH AREA'),
                'BUSINESS 1', getLandUseTypeColor('BUSINESS 1'),
                'BUSINESS 1 - WHITE', getLandUseTypeColor('BUSINESS 1 - WHITE'),
                'BUSINESS 2', getLandUseTypeColor('BUSINESS 2'),
                'BUSINESS 2 - WHITE', getLandUseTypeColor('BUSINESS 2 - WHITE'),
                'BUSINESS PARK', getLandUseTypeColor('BUSINESS PARK'),
                'BUSINESS PARK - WHITE', getLandUseTypeColor('BUSINESS PARK - WHITE'),
                'CEMETERY', getLandUseTypeColor('CEMETERY'),
                'CIVIC & COMMUNITY INSTITUTION', getLandUseTypeColor('CIVIC & COMMUNITY INSTITUTION'),
                'COMMERCIAL', getLandUseTypeColor('COMMERCIAL'),
                'COMMERCIAL & RESIDENTIAL', getLandUseTypeColor('COMMERCIAL & RESIDENTIAL'),
                'COMMERCIAL / INSTITUTION', getLandUseTypeColor('COMMERCIAL / INSTITUTION'),
                'EDUCATIONAL INSTITUTION', getLandUseTypeColor('EDUCATIONAL INSTITUTION'),
                'HEALTH & MEDICAL CARE', getLandUseTypeColor('HEALTH & MEDICAL CARE'),
                'HOTEL', getLandUseTypeColor('HOTEL'),
                'LIGHT RAPID TRANSIT', getLandUseTypeColor('LIGHT RAPID TRANSIT'),
                'MASS RAPID TRANSIT', getLandUseTypeColor('MASS RAPID TRANSIT'),
                'OPEN SPACE', getLandUseTypeColor('OPEN SPACE'),
                'PARK', getLandUseTypeColor('PARK'),
                'PLACE OF WORSHIP', getLandUseTypeColor('PLACE OF WORSHIP'),
                'PORT / AIRPORT', getLandUseTypeColor('PORT / AIRPORT'),
                'RESERVE SITE', getLandUseTypeColor('RESERVE SITE'),
                'RESIDENTIAL', getLandUseTypeColor('RESIDENTIAL'),
                'RESIDENTIAL / INSTITUTION', getLandUseTypeColor('RESIDENTIAL / INSTITUTION'),
                'RESIDENTIAL WITH COMMERCIAL AT 1ST STOREY', getLandUseTypeColor('RESIDENTIAL WITH COMMERCIAL AT 1ST STOREY'),
                'ROAD', getLandUseTypeColor('ROAD'),
                'SPECIAL USE', getLandUseTypeColor('SPECIAL USE'),
                'SPORTS & RECREATION', getLandUseTypeColor('SPORTS & RECREATION'),
                'TRANSPORT FACILITIES', getLandUseTypeColor('TRANSPORT FACILITIES'),
                'UTILITY', getLandUseTypeColor('UTILITY'),
                'WATERBODY', getLandUseTypeColor('WATERBODY'),
                'WHITE', getLandUseTypeColor('WHITE'),
                getLandUseTypeColor()
            ],
            'fill-opacity': ['interpolate', ['linear'], ['zoom'], 10, 0.18, 15, 0.38]
        }
    };

    const landUseLineStyle = {
        id: 'master-plan-2025-land-use-line',
        type: 'line',
        paint: {
            'line-color': '#475569',
            'line-opacity': ['interpolate', ['linear'], ['zoom'], 10, 0.08, 15, 0.35],
            'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.2, 16, 1]
        }
    };

    const landUseLabelStyle = {
        id: 'master-plan-2025-land-use-label',
        type: 'symbol',
        layout: {
            'text-field': ['get', 'land_use_type'],
            'text-size': ['interpolate', ['linear'], ['zoom'], 12, 0, 16, 10],
            'text-anchor': 'center',
            'text-allow-overlap': false
        },
        paint: {
            'text-color': '#0F172A',
            'text-halo-color': '#FFFFFF',
            'text-halo-width': 1
        }
    };

    return(
        <Source id="master-plan-2025-land-use-source" type="geojson" data={landUsesInRadiusGeojson}>
            <Layer {...landUseFillStyle} />
            <Layer {...landUseLineStyle} />
            <Layer {...landUseLabelStyle} />
        </Source>
    );
}
