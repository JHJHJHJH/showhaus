import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RiCloseLine } from "react-icons/ri";
import { useMap } from "react-map-gl";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../ui/table";
import TransactionsDrawer from "../TransactionsDrawer";
import { transactionsDistribution } from "./TransactionUtils";

const TRANSACTION_LAYER_IDS = ["clusters", "transaction-points"];
const TRANSACTION_POINT_LAYER_IDS = ["transaction-points"];
const PRIVATE_RESI_LAYER_IDS = [
    "land-context-private-resi-fill",
    "land-context-private-resi-line",
    "land-context-private-resi-points",
    "land-context-private-resi-labels",
];

function renderValue(value) {
    return value === undefined || value === null || value === "" ? "-" : value;
}

function formatPriceValue(value) {
    const price = Number(value);

    if (!Number.isFinite(price)) {
        return value;
    }

    return "$" + price.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,");
}

function summaryTransaction(price, contractDate, area, floor) {
    return price === undefined || price === null || price === ""
        ? {}
        : {
            price: formatPriceValue(price),
            contract_date: contractDate,
            area,
            floor_range: floor,
        };
}

function hasSummaryTransactionData(properties = {}) {
    return (
        properties.latest_price !== undefined ||
        properties.price_max !== undefined ||
        properties.price_p90 !== undefined ||
        properties.price_p50 !== undefined ||
        properties.price_p10 !== undefined ||
        properties.price_min !== undefined
    );
}

function getSummaryDistribution(properties = {}) {
    return {
        latestTransaction: summaryTransaction(properties.latest_price, properties.latest_contract_date),
        highestTransaction: summaryTransaction(properties.price_max, undefined, properties.price_max_area, properties.price_max_floor),
        percentile90Transaction: summaryTransaction(properties.price_p90, undefined, properties.price_p90_area, properties.price_p90_floor),
        medianTransaction: summaryTransaction(properties.price_p50, undefined, properties.price_p50_area, properties.price_p50_floor),
        percentile10Transaction: summaryTransaction(properties.price_p10, undefined, properties.price_p10_area, properties.price_p10_floor),
        lowestTransaction: summaryTransaction(properties.price_min, undefined, properties.price_min_area, properties.price_min_floor),
    };
}

function parseTransactions(value) {
    if (Array.isArray(value)) {
        return value;
    }

    if (!value) {
        return [];
    }

    return JSON.parse(value);
}

function projectKey(value) {
    return String(value || "").trim().toLowerCase();
}

function getFeatureCenter(feature, event) {
    if (feature.geometry?.type === "Point") {
        return feature.geometry.coordinates;
    }

    return event.lngLat ? event.lngLat.toArray() : undefined;
}

function getTransactionsForPrivateResidentialFeature(feature, transactionRows) {
    if (hasSummaryTransactionData(feature.properties)) {
        return [];
    }

    const project = projectKey(feature.properties.project);
    const street = projectKey(feature.properties.street);

    if (!project) {
        return [];
    }

    return transactionRows
        .filter((transaction) => (
            projectKey(transaction.project) === project &&
            (!street || projectKey(transaction.street) === street)
        ))
        .map((transaction) => ({
            id: transaction.id,
            price: transaction.price,
            area: transaction.area,
            type_of_sale: transaction.type_of_sale,
            property_type: transaction.property_type,
            floor_range: transaction.floor_range,
            contract_date: transaction.contract_date,
        }));
}

export function TransactionPopup() {
    const { map } = useMap();
    const transactionRows = useSelector((state) => state.transactionState.transactions || []);

    const [showPopup, setShowPopup] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [streetName, setStreetName] = useState('');
    const [numOfTransactions, setNumOfTransactions] = useState('');
    const [locationId, setLocationId] = useState('');
    const [latestTx, setLatestTx] = useState({});
    const [highestTx, setHighestTx]= useState({});
    const [percentile90Tx, setPercentile90Tx]= useState({});
    const [medianTx, setMedianTx]= useState({});
    const [percentile10Tx, setPercentile10Tx]= useState({});
    const [lowestTx, setLowestTx]= useState({});

    useEffect(() => {
        if (!map) {
            return undefined;
        }

        const showTransactionPopup = (event, feature, transactions) => {
            const projectName = feature.properties.project;
            const streetName = feature.properties.street;
            const locationId = feature.properties.location_id || feature.properties.ura_private_resi_id;

            const numOfTransactions = feature.properties.noOfTransactions || feature.properties.transaction_count || transactions.length;
            const distribution = hasSummaryTransactionData(feature.properties)
                ? getSummaryDistribution(feature.properties)
                : transactionsDistribution(transactions);
            setLatestTx(distribution["latestTransaction"]);
            setHighestTx(distribution["highestTransaction"]);
            setPercentile90Tx(distribution["percentile90Transaction"]);
            setLowestTx(distribution["lowestTransaction"]);
            setMedianTx(distribution["medianTransaction"]);
            setPercentile10Tx(distribution["percentile10Transaction"]);
            setLocationId(locationId);
            setProjectName(projectName);
            setStreetName(streetName);
            setNumOfTransactions(numOfTransactions);
            setShowPopup(true);

            const center = getFeatureCenter(feature, event);

            if (!center) {
                return;
            }

            map.easeTo({
                center,
                offset: [130, 0],
                duration: 500
            });
        };

        const expandCluster = (feature) => {
            const source = map.getSource("found-transactions");

            if (!source) {
                return;
            }

            setShowPopup(false);

            source.getClusterExpansionZoom(feature.properties.cluster_id, (error, zoom) => {
                if (error) {
                    return;
                }

                map.easeTo({
                    center: feature.geometry.coordinates,
                    zoom,
                    duration: 500
                });
            });
        };

        const handleMapClick = (event) => {
            const transactionLayerIds = [...TRANSACTION_LAYER_IDS, ...PRIVATE_RESI_LAYER_IDS]
                .filter((layerId) => map.getLayer(layerId));

            if (transactionLayerIds.length === 0) {
                setShowPopup(false);
                return;
            }

            const clickedClusters = map.queryRenderedFeatures(event.point, {
                layers: transactionLayerIds,
            });

            const clickedCluster = clickedClusters.find((feature) => feature.layer?.id === "clusters");
            const clickedTransactionFeature = clickedClusters.find((feature) => (
                feature.layer?.id && TRANSACTION_POINT_LAYER_IDS.includes(feature.layer.id)
            ));
            const clickedPrivateResidentialFeature = clickedClusters.find((feature) => (
                feature.layer?.id && PRIVATE_RESI_LAYER_IDS.includes(feature.layer.id)
            ));

            if (clickedCluster) {
                expandCluster(clickedCluster);
                return;
            }

            if (clickedTransactionFeature) {
                const transactions = parseTransactions(clickedTransactionFeature.properties.transactions);
                showTransactionPopup(event, clickedTransactionFeature, transactions);
                return;
            }

            if (clickedPrivateResidentialFeature) {
                const transactions = getTransactionsForPrivateResidentialFeature(clickedPrivateResidentialFeature, transactionRows);
                showTransactionPopup(event, clickedPrivateResidentialFeature, transactions);
                return;
            }

            if (clickedClusters.length === 0) {
                setShowPopup(false);
            }
        };

        map.on('click', handleMapClick);

        return () => {
            map.off('click', handleMapClick);
        };
    }, [map, transactionRows]);

    const rows = [
        { label: "Highest", transaction: highestTx },
        { label: "90th pct", transaction: percentile90Tx },
        { label: "Median", transaction: medianTx },
        { label: "10th pct", transaction: percentile10Tx },
        { label: "Lowest", transaction: lowestTx },
    ];

    return (
        showPopup && (
            <div className="pointer-events-auto absolute left-4 top-20 z-20 flex max-h-[calc(100%-7rem)] w-[min(23rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-900 shadow-xl shadow-slate-900/10">
                <div className="relative border-b border-slate-200 bg-slate-50/90 px-4 py-3">
                    <button
                        aria-label="Close transaction panel"
                        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-100 hover:text-slate-900"
                        type="button"
                        onClick={() => setShowPopup(false)}
                    >
                        <RiCloseLine className="h-4 w-4" />
                    </button>
                    <div className="flex items-center justify-between pr-10">
                        <div className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                            Transaction summary
                        </div>
                        <div className="text-[10px] font-medium text-slate-400">
                            ID: {renderValue(locationId)}
                        </div>
                    </div>
                    <div className="mt-1 pr-6 text-base font-semibold leading-snug">
                        {renderValue(projectName)}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                        {renderValue(streetName)}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 border-b border-slate-200 px-4 py-3">
                    <div>
                        <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                            Transactions
                        </div>
                        <div className="mt-1 text-lg font-semibold text-slate-900">
                            {renderValue(numOfTransactions)}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                            Last Transacted
                        </div>
                        <div className="mt-1 truncate text-sm font-semibold text-slate-900">
                            {renderValue(latestTx.price)} <span className="text-xs font-normal text-slate-500">({renderValue(latestTx.contract_date)})</span>
                        </div>
                    </div>
                </div>

                <div className="min-h-0 overflow-auto">
                    <Table>
                        <TableHeader className="bg-white">
                            <TableRow className="hover:bg-white">
                                <TableHead className="h-9 px-4 text-[10px] tracking-[0.16em]">
                                    Type
                                </TableHead>
                                <TableHead className="h-9 px-3 text-right text-[10px] tracking-[0.16em]">
                                    Price
                                </TableHead>
                                <TableHead className="h-9 px-3 text-right text-[10px] tracking-[0.16em]">
                                    Area
                                </TableHead>
                                <TableHead className="h-9 px-4 text-center text-[10px] tracking-[0.16em]">
                                    Floor
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.map(({ label, transaction }) => (
                                <TableRow key={label} className="hover:bg-slate-50">
                                    <TableCell className="px-4 py-3 text-xs font-medium text-slate-900">
                                        {label}
                                    </TableCell>
                                    <TableCell className="px-3 py-3 text-right text-xs font-medium">
                                        {renderValue(transaction.price)}
                                    </TableCell>
                                    <TableCell className="px-3 py-3 text-right text-xs">
                                        {renderValue(transaction.area)}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-center text-xs">
                                        {renderValue(transaction.floor_range)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="shrink-0 border-t border-slate-200 bg-slate-50/90 p-3">
                    <TransactionsDrawer />
                </div>
            </div>
        )
    );
}
