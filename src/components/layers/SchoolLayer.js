import React, { useMemo } from "react";
import { Source, Layer } from "react-map-gl";
import { useSelector } from "react-redux";
import { getSchoolKey, getSchoolTypeColor, getSchoolsGeojson } from "../../utils/schoolData";

const SCHOOL_GEOJSON = getSchoolsGeojson();

export default function SchoolLayer(){
    const schoolsInRadius = useSelector((state) => state.searchRadiusState.schoolsInRadius);

    const schoolsInRadiusGeojson = useMemo(() => {
        const foundSchoolKeys = new Set(schoolsInRadius.map((school) => getSchoolKey(school)));

        return {
            type: 'FeatureCollection',
            features: SCHOOL_GEOJSON.features.filter((feature) => foundSchoolKeys.has(getSchoolKey(feature.properties)))
        };
    }, [schoolsInRadius]);

    const schoolPointStyle = {
        id: 'school-points',
        type: 'circle',
        paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 3, 16, 7],
            'circle-color': [
                'match',
                ['get', 'school_type'],
                'primary', getSchoolTypeColor('primary'),
                'secondary', getSchoolTypeColor('secondary'),
                'post-secondary', getSchoolTypeColor('post-secondary'),
                'moe-kindergarten', getSchoolTypeColor('moe-kindergarten'),
                getSchoolTypeColor()
            ],
            'circle-stroke-color': '#FFFFFF',
            'circle-stroke-width': 1.5,
            'circle-opacity': 0.9
        }
    };

    const schoolLabelStyle = {
        id: 'school-labels',
        type: 'symbol',
        layout: {
            'text-field': ['get', 'name'],
            'text-size': ['interpolate', ['linear'], ['zoom'], 12, 0, 15, 10],
            'text-anchor': 'top',
            'text-offset': [0, 0.8],
            'text-allow-overlap': false
        },
        paint: {
            'text-color': '#334155',
            'text-halo-color': '#FFFFFF',
            'text-halo-width': 1
        }
    };

    return(
        <Source id="school-source" type="geojson" data={schoolsInRadiusGeojson}>
            <Layer {...schoolPointStyle} />
            <Layer {...schoolLabelStyle} />
        </Source>
    );
}
