import { useEffect, useState } from "react";
import { RiCloseLine } from "react-icons/ri";
import { Popup, useMap } from "react-map-gl";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../ui/table";
import { transactionsDistribution } from "./TransactionUtils";

function renderValue(value) {
    return value === undefined || value === null || value === "" ? "-" : value;
}

export function TransactionPopup() {
    const { map } = useMap();

    const [showPopup, setShowPopup] = useState(false);
    const [latitudePopup, setLatitudePopup] = useState(0);
    const [longitudePopup, setLongitudePopup] = useState(0);
    const [projectName, setProjectName] = useState('');
    const [streetName, setStreetName] = useState('');
    const [numOfTransactions, setNumOfTransactions] = useState('');
    const [locationId, setLocationId] = useState('');
    const [highestTx, setHighestTx]= useState({});
    const [medianTx, setMedianTx]= useState({});
    const [lowestTx, setLowestTx]= useState({});

    useEffect(() => {
        if (!map) {
            return undefined;
        }

        const handleMapClick = (event) => {
            if (!map.getLayer("clusters")) {
                setShowPopup(false);
                return;
            }

            const clickedClusters = map.queryRenderedFeatures(event.point, {
                layers: ["clusters"],
            });

            if (clickedClusters.length === 0) {
                setShowPopup(false);
            }
        };

        const handleClusterClick = (event) => {
            const [longitude, latitude] = event.features[0].geometry.coordinates;
            const transactions = JSON.parse(event.features[0].properties.transactions);
            const projectName = event.features[0].properties.project;
            const streetName = event.features[0].properties.street;
            const locationId = event.features[0].properties.location_id;

            const numOfTransactions = transactions.length;
            const distribution = transactionsDistribution(transactions);
            setHighestTx(distribution["highestTransaction"]);
            setLowestTx(distribution["lowestTransaction"]);
            setMedianTx(distribution["medianTransaction"]);
            setLatitudePopup(latitude);
            setLongitudePopup(longitude);
            setLocationId(locationId);
            setProjectName(projectName);
            setStreetName(streetName);
            setNumOfTransactions(numOfTransactions);
            setShowPopup(true);
        };

        map.on('click', handleMapClick);
        map.on('click', 'clusters', handleClusterClick);

        return () => {
            map.off('click', handleMapClick);
            map.off('click', 'clusters', handleClusterClick);
        };
    }, [map]);

    const rows = [
        { label: "Highest", transaction: highestTx },
        { label: "Median", transaction: medianTx },
        { label: "Lowest", transaction: lowestTx },
    ];

    return (
        showPopup && (
        <Popup
            longitude={longitudePopup}
            latitude={latitudePopup}
            anchor="bottom"
            className="transaction-popup"
            maxWidth="420px"
            onClose={() => setShowPopup(false)}
            closeButton={false}
            closeOnClick={false}
        >
            <div className="w-[min(22rem,calc(100vw-3rem))] overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-900 shadow-xl shadow-slate-900/10">
                <div className="relative border-b border-slate-200 bg-slate-50/90 px-4 py-3">
                    <button
                        aria-label="Close transaction popup"
                        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-100 hover:text-slate-900"
                        type="button"
                        onClick={() => setShowPopup(false)}
                    >
                        <RiCloseLine className="h-4 w-4" />
                    </button>
                    <div className="pr-6 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                        Transaction summary
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
                            Location
                        </div>
                        <div className="mt-1 truncate text-sm font-medium text-slate-700">
                            {renderValue(locationId)}
                        </div>
                    </div>
                </div>

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
        </Popup>)
    );
}
