import { booleanIntersects, booleanPointInPolygon, point } from '@turf/turf';
import masterPlanLandUse from '../resources/MasterPlan2025LandUseLayer.geojson';

export const LAND_USE_TYPE_ORDER = [
    'RESIDENTIAL',
    'RESIDENTIAL WITH COMMERCIAL AT 1ST STOREY',
    'COMMERCIAL & RESIDENTIAL',
    'COMMERCIAL',
    'COMMERCIAL / INSTITUTION',
    'BUSINESS 1',
    'BUSINESS 1 - WHITE',
    'BUSINESS 2',
    'BUSINESS 2 - WHITE',
    'BUSINESS PARK',
    'BUSINESS PARK - WHITE',
    'EDUCATIONAL INSTITUTION',
    'CIVIC & COMMUNITY INSTITUTION',
    'HEALTH & MEDICAL CARE',
    'PLACE OF WORSHIP',
    'PARK',
    'OPEN SPACE',
    'SPORTS & RECREATION',
    'BEACH AREA',
    'WATERBODY',
    'ROAD',
    'MASS RAPID TRANSIT',
    'LIGHT RAPID TRANSIT',
    'TRANSPORT FACILITIES',
    'UTILITY',
    'RESERVE SITE',
    'WHITE',
    'HOTEL',
    'AGRICULTURE',
    'CEMETERY',
    'PORT / AIRPORT',
    'SPECIAL USE',
    'RESIDENTIAL / INSTITUTION'
];

export const LAND_USE_TYPE_COLORS = {
    'AGRICULTURE': '#84CC16',
    'BEACH AREA': '#FACC15',
    'BUSINESS 1': '#F59E0B',
    'BUSINESS 1 - WHITE': '#FDBA74',
    'BUSINESS 2': '#EA580C',
    'BUSINESS 2 - WHITE': '#FED7AA',
    'BUSINESS PARK': '#D97706',
    'BUSINESS PARK - WHITE': '#FDE68A',
    'CEMETERY': '#71717A',
    'CIVIC & COMMUNITY INSTITUTION': '#6366F1',
    'COMMERCIAL': '#EF4444',
    'COMMERCIAL & RESIDENTIAL': '#F43F5E',
    'COMMERCIAL / INSTITUTION': '#EC4899',
    'EDUCATIONAL INSTITUTION': '#0EA5E9',
    'HEALTH & MEDICAL CARE': '#06B6D4',
    'HOTEL': '#A855F7',
    'LIGHT RAPID TRANSIT': '#64748B',
    'MASS RAPID TRANSIT': '#334155',
    'OPEN SPACE': '#22C55E',
    'PARK': '#16A34A',
    'PLACE OF WORSHIP': '#8B5CF6',
    'PORT / AIRPORT': '#475569',
    'RESERVE SITE': '#94A3B8',
    'RESIDENTIAL': '#F97316',
    'RESIDENTIAL / INSTITUTION': '#FB7185',
    'RESIDENTIAL WITH COMMERCIAL AT 1ST STOREY': '#FB923C',
    'ROAD': '#9CA3AF',
    'SPECIAL USE': '#7C3AED',
    'SPORTS & RECREATION': '#14B8A6',
    'TRANSPORT FACILITIES': '#0F766E',
    'UTILITY': '#0284C7',
    'WATERBODY': '#38BDF8',
    'WHITE': '#CBD5E1'
};

let landUseDataPromise = null;

export function getLandUseTypeColor(landUseType){
    return LAND_USE_TYPE_COLORS[landUseType] || '#64748B';
}

export function formatLandUseType(landUseType){
    return toTitleCase(String(landUseType || '').replace(/\s*\/\s*/g, ' / '));
}

export function getLandUseKey(landUse){
    return String(landUse.land_use_key || landUse.OBJECTID);
}

export function normalizeLandUse(landUse){
    return {
        ...landUse,
        land_use_key: String(landUse.OBJECTID),
        land_use_type: landUse.LU_DESC || 'UNKNOWN',
        land_use_text: landUse.LU_TEXT,
        gpr: landUse.GPR,
        area: landUse['SHAPE.AREA']
    };
}

export async function getLandUsesInRadius(searchRadius){
    if(!searchRadius?.geometry){
        return [];
    }

    const landUseData = await loadLandUseData();
    const searchBbox = getGeometryBbox(searchRadius.geometry);

    return landUseData.index
        .filter((indexedFeature) => bboxIntersects(indexedFeature.bbox, searchBbox))
        .filter((indexedFeature) => booleanIntersects(indexedFeature.feature, searchRadius))
        .map((indexedFeature) => indexedFeature.feature.properties);
}

export async function getLandUseAtLocation(location){
    if(!location || location.latitude === 0 || location.longitude === 0){
        return null;
    }

    const landUseData = await loadLandUseData();
    const selectedPoint = point([location.longitude, location.latitude]);

    const selectedFeature = landUseData.index
        .filter((indexedFeature) => bboxContainsPoint(indexedFeature.bbox, selectedPoint.geometry.coordinates))
        .find((indexedFeature) => booleanPointInPolygon(selectedPoint, indexedFeature.feature));

    return selectedFeature?.feature.properties || null;
}

export async function getLandUseGeojsonForKeys(landUseKeys){
    const landUseData = await loadLandUseData();

    return {
        type: 'FeatureCollection',
        features: landUseKeys
            .map((landUseKey) => landUseData.featuresByKey.get(String(landUseKey)))
            .filter(Boolean)
    };
}

async function loadLandUseData(){
    if(!landUseDataPromise){
        landUseDataPromise = readMasterPlanLandUse().then((geojson) => {
            const normalizedGeojson = {
                ...geojson,
                features: geojson.features.map((feature) => ({
                    ...feature,
                    properties: normalizeLandUse(feature.properties)
                }))
            };

            const featuresByKey = normalizedGeojson.features.reduce((acc, feature) => {
                acc.set(feature.properties.land_use_key, feature);
                return acc;
            }, new Map());

            const index = normalizedGeojson.features.map((feature) => ({
                feature,
                bbox: getGeometryBbox(feature.geometry)
            }));

            return {
                featuresByKey,
                index
            };
        });
    }

    return landUseDataPromise;
}

async function readMasterPlanLandUse(){
    if(masterPlanLandUse?.features){
        return masterPlanLandUse;
    }

    const response = await fetch(masterPlanLandUse);

    if(!response.ok){
        throw new Error(`Failed to load Master Plan 2025 land use GeoJSON: ${response.status}`);
    }

    return response.json();
}

function getGeometryBbox(geometry){
    const bbox = [Infinity, Infinity, -Infinity, -Infinity];

    walkCoordinates(geometry.coordinates, bbox);

    return bbox;
}

function walkCoordinates(coordinates, bbox){
    if(typeof coordinates[0] === 'number'){
        const [longitude, latitude] = coordinates;
        bbox[0] = Math.min(bbox[0], longitude);
        bbox[1] = Math.min(bbox[1], latitude);
        bbox[2] = Math.max(bbox[2], longitude);
        bbox[3] = Math.max(bbox[3], latitude);
        return;
    }

    coordinates.forEach((coordinate) => walkCoordinates(coordinate, bbox));
}

function bboxIntersects(a, b){
    return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
}

function bboxContainsPoint(bbox, coordinates){
    const [longitude, latitude] = coordinates;
    return longitude >= bbox[0] && longitude <= bbox[2] && latitude >= bbox[1] && latitude <= bbox[3];
}

function toTitleCase(str) {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}
