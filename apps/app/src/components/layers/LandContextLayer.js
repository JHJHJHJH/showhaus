import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Source, Layer, useMap } from "react-map-gl";
import { useDispatch, useSelector } from "react-redux";
import { booleanIntersects, booleanPointInPolygon, featureCollection, intersect, point } from "@turf/turf";
import axios from "axios";
import { updateLandContextResults } from "../../reducers/searchRadiusSlice";
import { getCheckedSchoolTypes, getSchoolKey, getSchoolTypeColor, normalizeSchool } from "../../utils/schoolData";
import { getLandUseKey, getLandUseTypeColor, normalizeLandUse } from "../../utils/landUseData";
import { getProjectKey, normalizeProject } from "../../utils/projectData";

const LAND_CONTEXT_SOURCE_ID = "land-context-source";
const LAND_CONTEXT_RENDER_SOURCE_ID = "land-context-render-source";
const LAND_CONTEXT_MIN_ZOOM = 2;
const SHOWHOUSE_API_URL = process.env.REACT_APP_SHOWHOUSE_API_URL || "http://localhost:8080/api";
const LAND_CONTEXT_TILEJSON_URL = `${SHOWHOUSE_API_URL.replace(/\/$/, "")}/tiles/land-context`;
export const LAND_CONTEXT_SOURCE_LAYERS = {
    LAND_USE: "landuse",
    PRIVATE_RESI: "ura-private-resi",
    SCHOOL: "school",
};
const LAND_CONTEXT_QUERY_SOURCE_LAYERS = Object.values(LAND_CONTEXT_SOURCE_LAYERS);

const LAND_USE_FILL_LAYER_ID = "land-context-land-use-fill";
const LAND_USE_HIGHLIGHT_FILL_LAYER_ID = "land-context-land-use-highlight-fill";
const LAND_USE_HIGHLIGHT_LINE_LAYER_ID = "land-context-land-use-highlight-line";

const LAND_USE_TYPE_EXPRESSION = ["coalesce", ["get", "land_use_type"], ["get", "LU_DESC"], ["get", "lu_desc"], "UNKNOWN"];
const LAND_USE_KEY_EXPRESSION = [
    "to-string",
    ["coalesce", ["get", "land_use_key"], ["get", "OBJECTID"], ["get", "object_id"], ["get", "id"], ""]
];
const LAND_USE_FILTER = [
    "all",
    ["==", ["geometry-type"], "Polygon"],
    ["any", ["has", "land_use_type"], ["has", "LU_DESC"], ["has", "lu_desc"]]
];
const SCHOOL_FILTER = ["all", ["==", ["geometry-type"], "Point"], ["has", "school_type"]];
const PRIVATE_RESI_POINT_FILTER = ["all", ["==", ["geometry-type"], "Point"], ["has", "project"]];
const PRIVATE_RESI_POLYGON_FILTER = ["all", ["==", ["geometry-type"], "Polygon"], ["has", "project"]];
const EMPTY_GEOJSON = { type: "FeatureCollection", features: [] };

export default function LandContextLayer(){
    const { current: map } = useMap();
    const dispatch = useDispatch();
    const {
        location,
        radius,
        schoolTypes,
        searchRadius,
    } = useSelector((state) => state.searchRadiusState);

    const [hoveredLandUseKey, setHoveredLandUseKey] = useState(null);
    const [renderGeojson, setRenderGeojson] = useState(EMPTY_GEOJSON);
    const [tileJson, setTileJson] = useState(null);
    const hoveredLandUseKeyRef = useRef(null);
    const renderSignatureRef = useRef(null);
    const processTimerRef = useRef(null);
    const processingTokenRef = useRef(0);

    const tileSourceTiles = useMemo(() => {
        if(!tileJson?.tiles){
            return null;
        }

        return tileJson.tiles;
    }, [tileJson]);

    const processingContextSignature = useMemo(() => (
        buildProcessingContextSignature({
            location,
            radius,
            schoolTypes,
            tileSourceTiles,
        })
    ), [location, radius, schoolTypes, tileSourceTiles]);

    const updateLandContextFromTiles = useCallback((processingToken = processingTokenRef.current) => {
        if(!map || !tileSourceTiles || !searchRadius?.geometry || location.latitude === 0 || location.longitude === 0){
            updateLandContextState({
                dispatch,
                landUses: [],
                projects: [],
                schools: [],
                selectedLandUse: null,
                renderGeojson: EMPTY_GEOJSON,
                renderSignatureRef,
                setRenderGeojson,
                processingContextSignature,
            });
            return;
        }

        const source = map.getSource(LAND_CONTEXT_SOURCE_ID);

        if(!source || !map.isSourceLoaded(LAND_CONTEXT_SOURCE_ID)){
            return;
        }

        let sourceFeatures = [];

        LAND_CONTEXT_QUERY_SOURCE_LAYERS.forEach((sourceLayer) => {
            try {
                sourceFeatures.push(
                    ...map.querySourceFeatures(LAND_CONTEXT_SOURCE_ID, { sourceLayer })
                        .map((mapFeature) => ({ sourceLayer, mapFeature }))
                );
            } catch (e) {
                console.error(e);
            }
        });

        const results = processLandContextFeatures({
            sourceFeatures,
            searchRadius,
            location,
            schoolTypes,
        });

        if(processingToken !== processingTokenRef.current){
            return;
        }

        updateLandContextState({
            dispatch,
            ...results,
            renderSignatureRef,
            setRenderGeojson,
            processingContextSignature,
        });
    }, [dispatch, location, map, schoolTypes, searchRadius, tileSourceTiles, processingContextSignature]);

    const scheduleLandContextProcessing = useCallback(() => {
        if(processTimerRef.current){
            window.clearTimeout(processTimerRef.current);
        }

        const processingToken = processingTokenRef.current + 1;
        processingTokenRef.current = processingToken;
        processTimerRef.current = window.setTimeout(() => {
            processTimerRef.current = null;
            updateLandContextFromTiles(processingToken);
        }, 75);
    }, [updateLandContextFromTiles]);

    useEffect(() => {
        hoveredLandUseKeyRef.current = hoveredLandUseKey;
    }, [hoveredLandUseKey]);

    useEffect(() => {
        let isCurrentRequest = true;

        async function loadTileJson(){
            try {
                const response = await axios.get(LAND_CONTEXT_TILEJSON_URL);

                if(isCurrentRequest){
                    setTileJson(response.data);
                }
            } catch (e) {
                console.error(e);

                if(isCurrentRequest){
                    setTileJson(null);
                }
            }
        }

        setTileJson(null);
        setRenderGeojson(EMPTY_GEOJSON);
        renderSignatureRef.current = null;
        loadTileJson();

        return () => {
            isCurrentRequest = false;
        };
    }, []);

    useEffect(() => () => {
        if(processTimerRef.current){
            window.clearTimeout(processTimerRef.current);
        }
    }, []);

    useEffect(() => {
        if(!map || !tileSourceTiles){
            return undefined;
        }

        const handleHover = (event) => {
            const nextHoveredLandUseKey = getLandUseFeatureKey(event.features?.[0]?.properties) || null;

            if(nextHoveredLandUseKey !== hoveredLandUseKeyRef.current){
                setHoveredLandUseKey(nextHoveredLandUseKey);
            }
        };

        const handleMouseEnter = () => {
            map.getCanvas().style.cursor = "pointer";
        };

        const handleMouseLeave = () => {
            map.getCanvas().style.cursor = "";
            setHoveredLandUseKey(null);
        };

        map.on("mouseenter", LAND_USE_FILL_LAYER_ID, handleMouseEnter);
        map.on("mousemove", LAND_USE_FILL_LAYER_ID, handleHover);
        map.on("mouseleave", LAND_USE_FILL_LAYER_ID, handleMouseLeave);

        return () => {
            map.off("mouseenter", LAND_USE_FILL_LAYER_ID, handleMouseEnter);
            map.off("mousemove", LAND_USE_FILL_LAYER_ID, handleHover);
            map.off("mouseleave", LAND_USE_FILL_LAYER_ID, handleMouseLeave);
            map.getCanvas().style.cursor = "";
        };
    }, [map, tileSourceTiles]);

    useEffect(() => {
        if(!map || !tileSourceTiles){
            return undefined;
        }

        const handleIdle = () => scheduleLandContextProcessing();

        map.on("idle", handleIdle);
        const idleTimer = window.setTimeout(handleIdle, 0);

        return () => {
            map.off("idle", handleIdle);
            window.clearTimeout(idleTimer);
        };
    }, [map, tileSourceTiles, scheduleLandContextProcessing]);

    useEffect(() => {
        if(!map || !tileSourceTiles){
            return;
        }

        scheduleLandContextProcessing();
    }, [map, tileSourceTiles, processingContextSignature, scheduleLandContextProcessing]);

    if(!tileSourceTiles){
        return null;
    }

    const landUseHighlightFilter = hoveredLandUseKey
        ? ["all", ...LAND_USE_FILTER.slice(1), ["==", LAND_USE_KEY_EXPRESSION, hoveredLandUseKey]]
        : ["all", ...LAND_USE_FILTER.slice(1), ["==", LAND_USE_KEY_EXPRESSION, ""]];

    return(
        <>
            <Source
                id={LAND_CONTEXT_SOURCE_ID}
                type="vector"
                tiles={tileSourceTiles}
            >
                <Layer {...landUseTileLoaderStyle} />
                <Layer {...privateResidentialPolygonTileLoaderStyle} />
                <Layer {...privateResidentialPointTileLoaderStyle} />
                <Layer {...schoolTileLoaderStyle} />
            </Source>
            <Source
                id={LAND_CONTEXT_RENDER_SOURCE_ID}
                type="geojson"
                data={renderGeojson}
            >
                <Layer {...withoutSourceLayer(landUseFillStyle)} />
                <Layer {...withoutSourceLayer(landUseLineStyle)} />
                <Layer {...withoutSourceLayer(privateResidentialFillStyle)} />
                <Layer {...withoutSourceLayer(privateResidentialLineStyle)} />
                <Layer {...withoutSourceLayer(privateResidentialPointStyle)} />
                <Layer {...landUseHighlightFillStyle(landUseHighlightFilter)} />
                <Layer {...landUseHighlightLineStyle(landUseHighlightFilter)} />
                <Layer {...withoutSourceLayer(privateResidentialLabelStyle)} />
                <Layer {...withoutSourceLayer(landUseLabelStyle)} />
                <Layer {...withoutSourceLayer(schoolPointStyle)} />
                <Layer {...withoutSourceLayer(schoolLabelStyle)} />
            </Source>
        </>
    );
}

const landUseTileLoaderStyle = {
    id: "land-context-land-use-tile-loader",
    type: "fill",
    "source-layer": LAND_CONTEXT_SOURCE_LAYERS.LAND_USE,
    filter: LAND_USE_FILTER,
    paint: {
        "fill-opacity": 0,
    }
};

const privateResidentialPolygonTileLoaderStyle = {
    id: "land-context-private-resi-polygon-tile-loader",
    type: "fill",
    "source-layer": LAND_CONTEXT_SOURCE_LAYERS.PRIVATE_RESI,
    filter: PRIVATE_RESI_POLYGON_FILTER,
    paint: {
        "fill-opacity": 0,
    }
};

const privateResidentialPointTileLoaderStyle = {
    id: "land-context-private-resi-point-tile-loader",
    type: "circle",
    "source-layer": LAND_CONTEXT_SOURCE_LAYERS.PRIVATE_RESI,
    filter: PRIVATE_RESI_POINT_FILTER,
    paint: {
        "circle-opacity": 0,
    }
};

const schoolTileLoaderStyle = {
    id: "land-context-school-tile-loader",
    type: "circle",
    "source-layer": LAND_CONTEXT_SOURCE_LAYERS.SCHOOL,
    filter: SCHOOL_FILTER,
    paint: {
        "circle-opacity": 0,
    }
};

const landUseFillStyle = {
    id: LAND_USE_FILL_LAYER_ID,
    type: "fill",
    "source-layer": LAND_CONTEXT_SOURCE_LAYERS.LAND_USE,
    filter: LAND_USE_FILTER,
    paint: {
        "fill-color": [
            "match",
            LAND_USE_TYPE_EXPRESSION,
            "AGRICULTURE", getLandUseTypeColor("AGRICULTURE"),
            "BEACH AREA", getLandUseTypeColor("BEACH AREA"),
            "BUSINESS 1", getLandUseTypeColor("BUSINESS 1"),
            "BUSINESS 1 - WHITE", getLandUseTypeColor("BUSINESS 1 - WHITE"),
            "BUSINESS 2", getLandUseTypeColor("BUSINESS 2"),
            "BUSINESS 2 - WHITE", getLandUseTypeColor("BUSINESS 2 - WHITE"),
            "BUSINESS PARK", getLandUseTypeColor("BUSINESS PARK"),
            "BUSINESS PARK - WHITE", getLandUseTypeColor("BUSINESS PARK - WHITE"),
            "CEMETERY", getLandUseTypeColor("CEMETERY"),
            "CIVIC & COMMUNITY INSTITUTION", getLandUseTypeColor("CIVIC & COMMUNITY INSTITUTION"),
            "COMMERCIAL", getLandUseTypeColor("COMMERCIAL"),
            "COMMERCIAL & RESIDENTIAL", getLandUseTypeColor("COMMERCIAL & RESIDENTIAL"),
            "COMMERCIAL / INSTITUTION", getLandUseTypeColor("COMMERCIAL / INSTITUTION"),
            "EDUCATIONAL INSTITUTION", getLandUseTypeColor("EDUCATIONAL INSTITUTION"),
            "HEALTH & MEDICAL CARE", getLandUseTypeColor("HEALTH & MEDICAL CARE"),
            "HOTEL", getLandUseTypeColor("HOTEL"),
            "LIGHT RAPID TRANSIT", getLandUseTypeColor("LIGHT RAPID TRANSIT"),
            "MASS RAPID TRANSIT", getLandUseTypeColor("MASS RAPID TRANSIT"),
            "OPEN SPACE", getLandUseTypeColor("OPEN SPACE"),
            "PARK", getLandUseTypeColor("PARK"),
            "PLACE OF WORSHIP", getLandUseTypeColor("PLACE OF WORSHIP"),
            "PORT / AIRPORT", getLandUseTypeColor("PORT / AIRPORT"),
            "RESERVE SITE", getLandUseTypeColor("RESERVE SITE"),
            "RESIDENTIAL", getLandUseTypeColor("RESIDENTIAL"),
            "RESIDENTIAL / INSTITUTION", getLandUseTypeColor("RESIDENTIAL / INSTITUTION"),
            "RESIDENTIAL WITH COMMERCIAL AT 1ST STOREY", getLandUseTypeColor("RESIDENTIAL WITH COMMERCIAL AT 1ST STOREY"),
            "ROAD", getLandUseTypeColor("ROAD"),
            "SPECIAL USE", getLandUseTypeColor("SPECIAL USE"),
            "SPORTS & RECREATION", getLandUseTypeColor("SPORTS & RECREATION"),
            "TRANSPORT FACILITIES", getLandUseTypeColor("TRANSPORT FACILITIES"),
            "UTILITY", getLandUseTypeColor("UTILITY"),
            "WATERBODY", getLandUseTypeColor("WATERBODY"),
            "WHITE", getLandUseTypeColor("WHITE"),
            getLandUseTypeColor()
        ],
        "fill-opacity": ["interpolate", ["linear"], ["zoom"], LAND_CONTEXT_MIN_ZOOM, 0.18, 15, 0.38]
    }
};

const landUseLineStyle = {
    id: "land-context-land-use-line",
    type: "line",
    "source-layer": LAND_CONTEXT_SOURCE_LAYERS.LAND_USE,
    filter: LAND_USE_FILTER,
    paint: {
        "line-color": "#475569",
        "line-opacity": ["interpolate", ["linear"], ["zoom"], LAND_CONTEXT_MIN_ZOOM, 0.08, 15, 0.35],
        "line-width": ["interpolate", ["linear"], ["zoom"], LAND_CONTEXT_MIN_ZOOM, 0.2, 16, 1]
    }
};

function landUseHighlightFillStyle(filter){
    return {
        id: LAND_USE_HIGHLIGHT_FILL_LAYER_ID,
        type: "fill",
        filter,
        paint: {
            "fill-color": "#F8FAFC",
            "fill-opacity": ["interpolate", ["linear"], ["zoom"], LAND_CONTEXT_MIN_ZOOM, 0.28, 15, 0.45]
        }
    };
}

function landUseHighlightLineStyle(filter){
    return {
        id: LAND_USE_HIGHLIGHT_LINE_LAYER_ID,
        type: "line",
        filter,
        paint: {
            "line-color": "#0F172A",
            "line-opacity": 0.3,
            "line-width": ["interpolate", ["linear"], ["zoom"], LAND_CONTEXT_MIN_ZOOM, 1.2, 16, 2.5]
        }
    };
}

const landUseLabelStyle = {
    id: "land-context-land-use-label",
    type: "symbol",
    "source-layer": LAND_CONTEXT_SOURCE_LAYERS.LAND_USE,
    filter: LAND_USE_FILTER,
    layout: {
        "text-field": LAND_USE_TYPE_EXPRESSION,
        "text-size": ["interpolate", ["linear"], ["zoom"], 12, 0, 16, 10],
        "text-anchor": "center",
        "text-allow-overlap": false
    },
    paint: {
        "text-color": "#0F172A",
        "text-halo-color": "#FFFFFF",
        "text-halo-width": 1
    }
};

const privateResidentialFillStyle = {
    id: "land-context-private-resi-fill",
    type: "fill",
    "source-layer": LAND_CONTEXT_SOURCE_LAYERS.PRIVATE_RESI,
    filter: PRIVATE_RESI_POLYGON_FILTER,
    paint: {
        "fill-color": "#2563EB",
        "fill-opacity": ["interpolate", ["linear"], ["zoom"], LAND_CONTEXT_MIN_ZOOM, 0.08, 15, 0.24]
    }
};

const privateResidentialLineStyle = {
    id: "land-context-private-resi-line",
    type: "line",
    "source-layer": LAND_CONTEXT_SOURCE_LAYERS.PRIVATE_RESI,
    filter: PRIVATE_RESI_POLYGON_FILTER,
    paint: {
        "line-color": "#1D4ED8",
        "line-opacity": ["interpolate", ["linear"], ["zoom"], LAND_CONTEXT_MIN_ZOOM, 0.18, 15, 0.5],
        "line-width": ["interpolate", ["linear"], ["zoom"], LAND_CONTEXT_MIN_ZOOM, 0.3, 16, 1.4]
    }
};

const privateResidentialPointStyle = {
    id: "land-context-private-resi-points",
    type: "circle",
    "source-layer": LAND_CONTEXT_SOURCE_LAYERS.PRIVATE_RESI,
    filter: PRIVATE_RESI_POINT_FILTER,
    paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], LAND_CONTEXT_MIN_ZOOM, 2, 16, 7],
        "circle-color": "#2563EB",
        "circle-stroke-color": "#FFFFFF",
        "circle-stroke-width": 1.2,
        "circle-opacity": 0.85
    }
};

const privateResidentialLabelStyle = {
    id: "land-context-private-resi-labels",
    type: "symbol",
    "source-layer": LAND_CONTEXT_SOURCE_LAYERS.PRIVATE_RESI,
    filter: ["any", PRIVATE_RESI_POINT_FILTER, PRIVATE_RESI_POLYGON_FILTER],
    minzoom: 15,
    layout: {
        "text-field": ["get", "project"],
        "text-size": 10,
        "text-anchor": "top",
        "text-offset": [0, 0.8],
        "text-allow-overlap": false
    },
    paint: {
        "text-color": "#1E3A8A",
        "text-halo-color": "#FFFFFF",
        "text-halo-width": 1
    }
};

const schoolPointStyle = {
    id: "land-context-school-points",
    type: "circle",
    "source-layer": LAND_CONTEXT_SOURCE_LAYERS.SCHOOL,
    filter: SCHOOL_FILTER,
    paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], LAND_CONTEXT_MIN_ZOOM, 3, 16, 7],
        "circle-color": [
            "match",
            ["get", "school_type"],
            "primary", getSchoolTypeColor("primary"),
            "secondary", getSchoolTypeColor("secondary"),
            "post-secondary", getSchoolTypeColor("post-secondary"),
            "moe-kindergarten", getSchoolTypeColor("moe-kindergarten"),
            getSchoolTypeColor()
        ],
        "circle-stroke-color": "#FFFFFF",
        "circle-stroke-width": 1.5,
        "circle-opacity": 0.9
    }
};

const schoolLabelStyle = {
    id: "land-context-school-labels",
    type: "symbol",
    "source-layer": LAND_CONTEXT_SOURCE_LAYERS.SCHOOL,
    filter: SCHOOL_FILTER,
    layout: {
        "text-field": ["get", "name"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 12, 0, 15, 10],
        "text-anchor": "top",
        "text-offset": [0, 0.8],
        "text-allow-overlap": false
    },
    paint: {
        "text-color": "#334155",
        "text-halo-color": "#FFFFFF",
        "text-halo-width": 1
    }
};

function toGeojsonFeature(mapFeature){
    if(!mapFeature){
        return null;
    }

    const feature = typeof mapFeature.toJSON === "function" ? mapFeature.toJSON() : mapFeature;

    return {
        type: "Feature",
        properties: feature.properties || {},
        geometry: feature.geometry,
    };
}

function isLandUseFeature(feature){
    return (
        isPolygonGeometry(feature.geometry) &&
        Boolean(feature.properties.land_use_type || feature.properties.LU_DESC || feature.properties.lu_desc)
    );
}

function isSchoolFeature(feature){
    return (
        feature.geometry?.type === "Point" &&
        Boolean(feature.properties.school_type && feature.properties.name)
    );
}

function isPrivateResidentialFeature(feature){
    return (
        Boolean(feature.properties.project) &&
        (feature.geometry?.type === "Point" || isPolygonGeometry(feature.geometry))
    );
}

function isPolygonGeometry(geometry){
    return geometry?.type === "Polygon" || geometry?.type === "MultiPolygon";
}

function featureIntersectsRadius(feature, searchRadius){
    if(feature.geometry?.type === "Point"){
        return booleanPointInPolygon(feature, searchRadius);
    }

    return isPolygonGeometry(feature.geometry) && booleanIntersects(feature, searchRadius);
}

function clipFeatureToRadius(feature, searchRadius, radiusHit){
    if(!radiusHit){
        return null;
    }

    if(feature.geometry?.type === "Point"){
        return feature;
    }

    if(!isPolygonGeometry(feature.geometry)){
        return null;
    }

    try {
        const clipped = intersect(feature, searchRadius);

        if(!clipped?.geometry){
            return null;
        }

        return {
            ...clipped,
            properties: {
                ...feature.properties,
            },
        };
    } catch (e) {
        console.error(e);
        return null;
    }
}

function getFeatureForRadiusRender(feature, searchRadius, sourceLayer, radiusHit){
    if(sourceLayer === LAND_CONTEXT_SOURCE_LAYERS.LAND_USE){
        return radiusHit ? feature : null;
    }

    return clipFeatureToRadius(feature, searchRadius, radiusHit);
}

export function processLandContextFeatures({
    sourceFeatures,
    searchRadius,
    location,
    schoolTypes,
}){
    const checkedSchoolTypes = getCheckedSchoolTypes(schoolTypes);
    const selectedPoint = point([location.longitude, location.latitude]);
    const seenFeatureKeys = new Set();
    const landUsesByKey = new Map();
    const projectsByKey = new Map();
    const schoolsByKey = new Map();
    let selectedLandUse = null;
    const clippedFeatures = [];

    sourceFeatures.forEach(({ sourceLayer, mapFeature, feature: rawFeature }) => {
        const feature = toGeojsonFeature(mapFeature || rawFeature);

        if(!feature?.geometry || !feature?.properties){
            return;
        }

        const featureDedupeKey = getFeatureDedupeKey(sourceLayer, feature);

        if(seenFeatureKeys.has(featureDedupeKey)){
            return;
        }

        seenFeatureKeys.add(featureDedupeKey);

        const radiusHit = featureIntersectsRadius(feature, searchRadius);
        const renderFeature = getFeatureForRadiusRender(feature, searchRadius, sourceLayer, radiusHit);

        if(renderFeature){
            clippedFeatures.push({
                ...renderFeature,
                properties: {
                    ...renderFeature.properties,
                    land_context_layer: sourceLayer,
                },
            });
        }

        if(isLandUseFeature(feature)){
            const normalizedLandUse = normalizeLandUse(feature.properties);
            const landUseFeature = {
                ...feature,
                properties: normalizedLandUse,
            };
            const landUseKey = getLandUseKey(normalizedLandUse);

            if(landUseKey && radiusHit){
                landUsesByKey.set(landUseKey, normalizedLandUse);
            }

            if(!selectedLandUse && booleanPointInPolygon(selectedPoint, landUseFeature)){
                selectedLandUse = normalizedLandUse;
            }

            return;
        }

        if(isPrivateResidentialFeature(feature)){
            const normalizedProject = {
                ...normalizeProject(feature.properties),
                geometry: feature.geometry,
            };
            const projectKey = getProjectKey(normalizedProject);

            if(projectKey && radiusHit){
                projectsByKey.set(projectKey, normalizedProject);
            }

            return;
        }

        if(isSchoolFeature(feature)){
            const normalizedSchool = normalizeSchool(feature.properties);

            if(checkedSchoolTypes.includes(normalizedSchool.school_type) && radiusHit){
                schoolsByKey.set(getSchoolKey(normalizedSchool), normalizedSchool);
            }
        }
    });

    return {
        landUses: Array.from(landUsesByKey.values()),
        projects: Array.from(projectsByKey.values()),
        schools: Array.from(schoolsByKey.values()),
        selectedLandUse,
        renderGeojson: featureCollection(clippedFeatures),
    };
}

function updateLandContextState({
    dispatch,
    landUses,
    projects,
    schools,
    selectedLandUse,
    renderGeojson,
    renderSignatureRef,
    setRenderGeojson,
    processingContextSignature,
}){
    const nextSignature = buildLandContextResultsSignature({
        landUses,
        projects,
        schools,
        selectedLandUse,
        renderGeojson,
        processingContextSignature,
    });

    if(nextSignature === renderSignatureRef.current){
        return;
    }

    renderSignatureRef.current = nextSignature;
    setRenderGeojson(renderGeojson);
    dispatch(updateLandContextResults({
        landUses,
        projects,
        schools,
        selectedLandUse,
    }));
}

function getLandUseFeatureKey(properties = {}){
    const key = properties.land_use_key ?? properties.OBJECTID ?? properties.object_id ?? properties.id ?? "";
    return String(key);
}

function withoutSourceLayer(layerStyle){
    const { "source-layer": sourceLayer, ...geojsonLayerStyle } = layerStyle;
    return geojsonLayerStyle;
}

function buildProcessingContextSignature({
    location,
    radius,
    schoolTypes,
    tileSourceTiles,
}){
    return [
        (tileSourceTiles || []).join(","),
        roundCoordinate(location.longitude),
        roundCoordinate(location.latitude),
        Number(radius || 0).toFixed(3),
        getCheckedSchoolTypes(schoolTypes).join(","),
    ].join("|");
}

export function buildLandContextResultsSignature({
    landUses,
    projects,
    schools,
    selectedLandUse,
    renderGeojson,
    processingContextSignature = "",
}){
    return [
        processingContextSignature,
        compactKeySignature(landUses, getLandUseKey),
        compactKeySignature(projects, getProjectKey),
        compactKeySignature(schools, getSchoolKey),
        selectedLandUse ? getLandUseKey(selectedLandUse) : "",
        compactRenderSignature(renderGeojson),
    ].join("||");
}

function compactKeySignature(items, getKey){
    const keys = items
        .map((item) => getKey(item))
        .filter(Boolean)
        .sort();

    return `${keys.length}:${keys.join(",")}`;
}

function compactRenderSignature(renderGeojson){
    const layerCounts = new Map();

    (renderGeojson?.features || []).forEach((feature) => {
        const layer = feature.properties?.land_context_layer || "unknown";
        const geometryType = feature.geometry?.type || "unknown";
        const key = `${layer}:${geometryType}`;
        layerCounts.set(key, (layerCounts.get(key) || 0) + 1);
    });

    return Array.from(layerCounts.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, count]) => `${key}:${count}`)
        .join(",");
}

function getFeatureDedupeKey(sourceLayer, feature){
    return [
        sourceLayer,
        getFeatureStableKey(sourceLayer, feature.properties),
        feature.geometry?.type || "",
        getGeometryExtentSignature(feature.geometry),
    ].join("|");
}

function getFeatureStableKey(sourceLayer, properties = {}){
    if(sourceLayer === LAND_CONTEXT_SOURCE_LAYERS.LAND_USE){
        return getLandUseFeatureKey(properties);
    }

    if(sourceLayer === LAND_CONTEXT_SOURCE_LAYERS.PRIVATE_RESI){
        return getProjectKey(properties);
    }

    if(sourceLayer === LAND_CONTEXT_SOURCE_LAYERS.SCHOOL){
        return getSchoolKey(properties);
    }

    return String(properties.id ?? "");
}

function getGeometryExtentSignature(geometry){
    const extent = {
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity,
        count: 0,
    };

    visitCoordinates(geometry?.coordinates, extent);

    if(extent.count === 0){
        return "empty";
    }

    return [
        extent.count,
        roundCoordinate(extent.minX),
        roundCoordinate(extent.minY),
        roundCoordinate(extent.maxX),
        roundCoordinate(extent.maxY),
    ].join(",");
}

function visitCoordinates(coordinates, extent){
    if(!Array.isArray(coordinates)){
        return;
    }

    if(typeof coordinates[0] === "number" && typeof coordinates[1] === "number"){
        const [lng, lat] = coordinates;
        extent.minX = Math.min(extent.minX, lng);
        extent.minY = Math.min(extent.minY, lat);
        extent.maxX = Math.max(extent.maxX, lng);
        extent.maxY = Math.max(extent.maxY, lat);
        extent.count += 1;
        return;
    }

    coordinates.forEach((child) => visitCoordinates(child, extent));
}

function roundCoordinate(value){
    return Number(value || 0).toFixed(6);
}
