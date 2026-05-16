import { buffer, point } from '@turf/turf';

jest.mock('react-map-gl', () => ({
    Source: () => null,
    Layer: () => null,
    useMap: () => ({ current: null }),
}));

const {
    LAND_CONTEXT_SOURCE_LAYERS,
    buildLandContextResultsSignature,
    processLandContextFeatures,
} = require('../components/layers/LandContextLayer');

const location = {
    longitude: 103.8,
    latitude: 1.3,
};

const schoolTypes = [
    { id: 'primary', isChecked: true },
    { id: 'secondary', isChecked: false },
];

const searchRadius = buffer(point([location.longitude, location.latitude]), 0.5, {
    units: 'kilometers',
});

function feature(geometry, properties){
    return {
        type: 'Feature',
        geometry,
        properties,
    };
}

function squareAroundLocation(){
    return {
        type: 'Polygon',
        coordinates: [[
            [103.799, 1.299],
            [103.801, 1.299],
            [103.801, 1.301],
            [103.799, 1.301],
            [103.799, 1.299],
        ]],
    };
}

test('processes land context features with dedupe, selected land use, schools, and projects', () => {
    const landUse = feature(squareAroundLocation(), {
        object_id: 'lu-1',
        lu_desc: 'RESIDENTIAL',
        gpr: '2.8',
    });
    const project = feature({
        type: 'Point',
        coordinates: [103.8001, 1.3001],
    }, {
        ura_private_resi_id: 10,
        project: 'ALPHA RESIDENCE',
        street: 'ALPHA ROAD',
        transaction_count: 4,
    });
    const primarySchool = feature({
        type: 'Point',
        coordinates: [103.8002, 1.3002],
    }, {
        name: 'PRIMARY A',
        school_type: 'primary',
        postal: '123456',
    });
    const secondarySchool = feature({
        type: 'Point',
        coordinates: [103.8003, 1.3003],
    }, {
        name: 'SECONDARY B',
        school_type: 'secondary',
        postal: '654321',
    });

    const result = processLandContextFeatures({
        sourceFeatures: [
            { sourceLayer: LAND_CONTEXT_SOURCE_LAYERS.LAND_USE, feature: landUse },
            { sourceLayer: LAND_CONTEXT_SOURCE_LAYERS.LAND_USE, feature: landUse },
            { sourceLayer: LAND_CONTEXT_SOURCE_LAYERS.PRIVATE_RESI, feature: project },
            { sourceLayer: LAND_CONTEXT_SOURCE_LAYERS.PRIVATE_RESI, feature: project },
            { sourceLayer: LAND_CONTEXT_SOURCE_LAYERS.SCHOOL, feature: primarySchool },
            { sourceLayer: LAND_CONTEXT_SOURCE_LAYERS.SCHOOL, feature: secondarySchool },
        ],
        searchRadius,
        location,
        schoolTypes,
    });

    expect(result.landUses).toHaveLength(1);
    expect(result.landUses[0]).toMatchObject({
        land_use_key: 'lu-1',
        land_use_type: 'RESIDENTIAL',
    });
    expect(result.selectedLandUse).toMatchObject({
        land_use_key: 'lu-1',
        land_use_type: 'RESIDENTIAL',
    });
    expect(result.projects).toHaveLength(1);
    expect(result.projects[0]).toMatchObject({
        ura_private_resi_id: 10,
        project: 'ALPHA RESIDENCE',
        transaction_count: 4,
    });
    expect(result.schools).toEqual([
        {
            name: 'PRIMARY A',
            school_type: 'primary',
            address: undefined,
            postal: '123456',
        },
    ]);
});

test('builds compact result signatures without serializing geometries', () => {
    const result = {
        landUses: [{ land_use_key: 'lu-1' }],
        projects: [{ ura_private_resi_id: 10, project: 'ALPHA RESIDENCE' }],
        schools: [{ name: 'PRIMARY A', school_type: 'primary', postal: '123456' }],
        selectedLandUse: { land_use_key: 'lu-1' },
        renderGeojson: {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: { land_context_layer: LAND_CONTEXT_SOURCE_LAYERS.LAND_USE },
                    geometry: squareAroundLocation(),
                },
            ],
        },
    };

    const signature = buildLandContextResultsSignature({
        ...result,
        processingContextSignature: 'tile-v1|103.800000|1.300000|0.200|primary',
    });

    expect(signature).toContain('tile-v1');
    expect(signature).toContain('lu-1');
    expect(signature).toContain('10');
    expect(signature).not.toContain('coordinates');
    expect(signature).not.toContain('103.799');
});
