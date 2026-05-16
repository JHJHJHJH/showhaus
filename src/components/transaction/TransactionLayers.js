import React, {useEffect, useMemo} from "react";
import { useSelector, useDispatch } from "react-redux";
import { Source, Layer } from "react-map-gl";
import { centroid, featureCollection } from '@turf/turf';
import { updateTransactionsInRadius } from   "../../reducers/transactionSlice";

export default function TransactionLayers(){

    const dispatch = useDispatch();
    const searchRadiusState = useSelector((state) => state.searchRadiusState );
    const transactionsFoundGeojson = useMemo(
        () => featureCollection((searchRadiusState.projectsInRadius || []).map(projectToTransactionFeature).filter(Boolean)),
        [searchRadiusState.projectsInRadius]
    );

    // const foundTransactionsStyle = {
    //     id: 'found-transactions',
    //     type: 'circle',
    //     paint: {
    //         'circle-radius': 6,
    //         'circle-color': '#880808',
    //         'circle-opacity': 0.6
    //     }
    // };
    const clusterTextStyle = {
        id: 'cluster-count',
        type: 'symbol',
        filter: ['has', 'point_count'],
        layout: {
            'text-field': ['get', 'point_count_abbreviated'],
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12
        }
    }

    const clusterStyle = {
        id: 'clusters',
        type: 'circle',
        filter: ['has', 'point_count'],
        paint: {
            // Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
            // with three steps to implement three types of circles:
            //   * Blue, 12px circles when transaction count is less than 70
            //   * Yellow, 22px circles when transaction count is between 70 and 400
            //   * Pink, 32px circles when transaction count is greater than or equal to 400
            'circle-color': [
                'step',
                ['get', 'point_count'],
                '#51bbd6',
                70,
                '#f1f075',
                350,
                '#f28cb1'
            ],
            'circle-radius': [
                'step',
                ['get', 'point_count'],
                15,
                70,
                24,
                400,
                35
            ],
            'circle-opacity': 0.9
        }
    };

    const transactionTextStyle = {
        id: 'transaction-count',
        type: 'symbol',
        filter: ['!', ['has', 'point_count']],
        minzoom: 15,
        layout: {
            'text-field': ['get', 'noOfTransactions'],
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12
        },
        paint: {
            'text-color': '#0f172a'
        }
    };

    const transactionPointStyle = {
        id: 'transaction-points',
        type: 'circle',
        filter: ['!', ['has', 'point_count']],
        minzoom: 15,
        paint: {
            'circle-color': [
                'step',
                ['get', 'noOfTransactions'],
                '#51bbd6',
                70,
                '#f1f075',
                350,
                '#f28cb1'
            ],
            'circle-radius': [
                'step',
                ['get', 'noOfTransactions'],
                15,
                70,
                24,
                400,
                35
            ],
            'circle-opacity': 0.9,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 2
        }
    };

    const projectNameStyle = {
        id: 'project-name',
        type: 'symbol',
        minzoom: 12,
        layout: {
            'text-field': ['coalesce', ['get', 'projectName'], ['get', 'project']],
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 11,
            'text-anchor': 'top',
            'text-offset': [0, 1.5],
            'text-max-width': 10,
        },
        paint: {
            'text-color': '#1e293b',
            'text-halo-color': '#ffffff',
            'text-halo-width': 1.5
        }
    };

    useEffect(() => {
        dispatch(updateTransactionsInRadius(transactionsFoundGeojson));
    }, [dispatch, transactionsFoundGeojson]);


    return(
        <>
        {/* <DeckGLOverlay layers={[ gridlayer ]}/>; */}
        <Source
            id="found-transactions"
            type="geojson"
            data={transactionsFoundGeojson}
            cluster={true}
            clusterRadius={80}
            clusterMaxZoom={18}
            clusterProperties={{
                'projectName': ['max', ['get', 'project']]
            }}
        >
            {/* <Layer {...foundTransactionsStyle} /> */}
            <Layer {...clusterStyle} />
            <Layer {...clusterTextStyle} />
            <Layer {...transactionPointStyle} />
            <Layer {...transactionTextStyle} />
            <Layer {...projectNameStyle} />
        </Source>
        
        {/* <DeckGL viewState={{
                        longitude: mapViewState.longitude,
                        latitude: mapViewState.latitude,
                        zoom: mapViewState.zoom
                    }} 
                    layers={[ heatmapLayer ]}/>; */}
        </>
    );
}

function projectToTransactionFeature(project){
    const geometry = getProjectPointGeometry(project.geometry);

    if(!geometry){
        return null;
    }

    const noOfTransactions = Number(project.transaction_count) || 0;
    const properties = { ...project };
    delete properties.geometry;

    return {
        type: "Feature",
        geometry,
        properties: {
            ...properties,
            noOfTransactions,
            transactions: JSON.stringify(projectSummaryTransactions(project)),
        },
    };
}

function getProjectPointGeometry(geometry){
    if(!geometry){
        return null;
    }

    if(geometry.type === "Point"){
        return geometry;
    }

    if(geometry.type === "Polygon" || geometry.type === "MultiPolygon"){
        return centroid({ type: "Feature", geometry, properties: {} }).geometry;
    }

    return null;
}

function projectSummaryTransactions(project){
    return [
        project.latest_price && {
            id: `${project.ura_private_resi_id || project.project}-latest`,
            price: Number(project.latest_price),
            contract_date: project.latest_contract_date,
        },
        project.price_max && {
            id: `${project.ura_private_resi_id || project.project}-max`,
            price: Number(project.price_max),
        },
        project.price_p90 && {
            id: `${project.ura_private_resi_id || project.project}-p90`,
            price: Number(project.price_p90),
        },
        project.price_p50 && {
            id: `${project.ura_private_resi_id || project.project}-p50`,
            price: Number(project.price_p50),
        },
        project.price_p10 && {
            id: `${project.ura_private_resi_id || project.project}-p10`,
            price: Number(project.price_p10),
        },
        project.price_min && {
            id: `${project.ura_private_resi_id || project.project}-min`,
            price: Number(project.price_min),
        },
    ].filter((transaction) => transaction && Number.isFinite(transaction.price));
}
