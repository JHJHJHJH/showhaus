import React from "react";
import { useSelector } from "react-redux";
import {
    FiBarChart2,
    FiBriefcase,
    FiCpu,
    FiGrid,
    FiHome,
    FiLayers,
    FiMaximize2,
    FiSliders,
    FiTrendingUp,
} from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

const developmentOptions = [
    {
        key: "commercialResidential",
        title: "Commercial and Resi",
        icon: FiLayers,
        zone: "Commercial and Residential",
        residential: "Minimum 60%",
        commercial: "Maximum 40%",
        note: "Hotel can count into commercial quantum where supported.",
    },
    {
        key: "commercial",
        title: "Commercial Mixed Use",
        icon: FiBriefcase,
        zone: "Commercial",
        residential: "By Competent Authority",
        commercial: "Minimum 60%",
        note: "Non-commercial quantum is subject to Competent Authority evaluation.",
    },
    {
        key: "residentialFirstStorey",
        title: "Resi w/ Commercial at 1st Storey",
        icon: FiHome,
        zone: "Residential with Commercial at First Storey",
        residential: "Upper floors",
        commercial: "First storey footprint",
        note: "Commercial uses are generally confined to the first storey.",
    },
];

function asNumber(value){
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

function average(values){
    if(values.length === 0){
        return null;
    }

    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatNumber(value, options = {}){
    if(value === null || value === undefined || Number.isNaN(value)){
        return "Not available";
    }

    return value.toLocaleString(undefined, {
        maximumFractionDigits: 0,
        ...options,
    });
}

function formatGpr(value){
    if(value === null || value === undefined){
        return "Not available";
    }

    return Number(value).toFixed(1).replace(/\.0$/, ".0");
}

function getGprStatus(gprValues){
    if(gprValues.length > 0){
        return {
            label: "Master Plan ratio found",
            tone: "bg-emerald-100 text-emerald-800 border-emerald-200",
        };
    }

    return {
        label: "Needs Master Plan check",
        tone: "bg-amber-100 text-amber-800 border-amber-200",
    };
}

function groupLandUses(landUses){
    return Array.from(
        landUses.reduce((acc, landUse) => {
            const landUseType = landUse.LU_DESC || landUse.land_use_type || "UNKNOWN";
            const existing = acc.get(landUseType) || {
                count: 0,
                gprs: new Set(),
                land_use_type: landUseType,
            };

            existing.count += 1;

            if(landUse.gpr){
                existing.gprs.add(landUse.gpr);
            }

            acc.set(landUseType, existing);
            return acc;
        }, new Map()).values()
    ).sort((a, b) => b.count - a.count || a.land_use_type.localeCompare(b.land_use_type));
}

function MetricTile({ icon: Icon, label, value, detail }){
    return (
        <div className="min-w-0 rounded-lg border border-slate-200 bg-white/80 p-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
                <div className="rounded-md bg-slate-100 p-1.5 text-slate-600">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</div>
            </div>
            <div className="mt-3 truncate text-xl font-black text-slate-900" title={String(value)}>{value}</div>
            <div className="mt-1 truncate text-xs text-slate-500" title={detail}>{detail}</div>
        </div>
    );
}

function ControlCell({ title, value, detail, tone = "bg-slate-100 text-slate-800 border-slate-200" }){
    return (
        <div className={`min-h-[116px] rounded-lg border p-3 ${tone}`}>
            <div className="text-[10px] font-black uppercase tracking-wide opacity-70">{title}</div>
            <div className="mt-2 rounded-md bg-white/70 px-2 py-1 text-xl font-black leading-tight shadow-sm">{value}</div>
            <div className="mt-2 text-xs leading-snug opacity-80">{detail}</div>
        </div>
    );
}

function DevelopmentOption({ option, gfa }){
    const residentialGfa = gfa ? gfa * 0.6 : null;
    const commercialGfa = gfa ? gfa * 0.4 : null;
    const commercialMinimumGfa = gfa ? gfa * 0.6 : null;

    let gfaLabel = "Building footprint";

    if(option.key === "commercialResidential"){
        gfaLabel = `${formatNumber(residentialGfa)} sqm residential minimum and ${formatNumber(commercialGfa)} sqm commercial maximum`;
    }

    if(option.key === "commercial"){
        gfaLabel = `${formatNumber(commercialMinimumGfa)} sqm commercial minimum`;
    }

    return (
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(14rem,0.75fr)]">
            <div className="rounded-lg border border-slate-200 bg-white/80 p-3 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">Development Type</div>
                <div className="mt-2 text-base font-black leading-tight text-slate-900">{option.title}</div>
                <div className="mt-1 text-xs text-slate-500">{option.zone}</div>
                <div className="mt-3 rounded-md bg-emerald-50 px-2 py-1.5 text-xs font-black text-emerald-800">
                    {gfaLabel}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-slate-200 bg-slate-100 p-3">
                    <div className="font-bold text-slate-500">Residential</div>
                    <div className="mt-2 text-lg font-black text-slate-900">{option.residential}</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-100 p-3">
                    <div className="font-bold text-slate-500">Commercial</div>
                    <div className="mt-2 text-lg font-black text-slate-900">{option.commercial}</div>
                </div>
            </div>
            <div className="md:col-span-2">
                <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white/80 p-3 text-xs leading-snug text-slate-600">
                    <FiSliders className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                    <span>{option.note}</span>
                </div>
            </div>
        </div>
    );
}

export default function AnalysisPanel(){
    const searchRadiusState = useSelector((state) => state.searchRadiusState);
    const transactions = useSelector((state) => state.transactionState.transactions || []);

    const analysis = React.useMemo(() => {
        const radius = Number(searchRadiusState.radius) || 0;
        const selectedLandUse = searchRadiusState.selectedLandUse;
        const areaSqm = asNumber(selectedLandUse?.area);
        const landUses = searchRadiusState.landUsesInRadius || [];
        const landUseGroups = groupLandUses(landUses);
        const selectedPlotGpr = asNumber(selectedLandUse?.gpr);
        const numericGprs = selectedPlotGpr !== null ? [selectedPlotGpr] : [];
        const areaNumericGprs = landUses
            .map((landUse) => asNumber(landUse.gpr))
            .filter((gpr) => gpr !== null);
        const highestGpr = numericGprs.length > 0 ? Math.max(...numericGprs) : null;
        const averageGpr = average(areaNumericGprs);
        const indicativeGfa = (highestGpr !== null && areaSqm !== null) ? areaSqm * highestGpr : null;
        const gprStatus = getGprStatus(numericGprs);
        const selectedPlotLandUse = selectedLandUse?.LU_DESC || selectedLandUse?.land_use_type || null;
        const commercialLedUses = landUseGroups.filter((group) => (
            group.land_use_type.includes("COMMERCIAL") || group.land_use_type.includes("WHITE") || group.land_use_type.includes("HOTEL")
        ));
        const transactionAverageQuantum = average(transactions.map((transaction) => asNumber(transaction.price)).filter((price) => price !== null));

        return {
            areaSqm,
            averageGpr,
            commercialLedUses,
            gprStatus,
            highestGpr,
            indicativeGfa,
            landUseGroups,
            radius,
            selectedPlotLandUse,
            transactionAverageQuantum,
            transactionCount: transactions.length,
        };
    }, [searchRadiusState, transactions]);

    const controlMatrix = [
        {
            title: "Indicative Gross Floor Area",
            value: analysis.indicativeGfa ? `${formatNumber(analysis.indicativeGfa)} sqm` : "Pending",
            detail: "Selected plot area multiplied by its gross plot ratio",
        },
        {
            title: "Floor Height",
            value: "5.0 m and 3.6 m",
            detail: "Commercial maximum 5.0 m; residential upper floors maximum 3.6 m",
            tone: "bg-indigo-100 text-indigo-800 border-indigo-200",
        },
        {
            title: "Building Height",
            value: "75 m",
            detail: "Technical height control (mock value)",
            tone: "bg-emerald-100 text-emerald-800 border-emerald-200",
        },
    ];

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <FiBarChart2 className="h-4 w-4 text-slate-500" aria-hidden="true" />
                                Selected Plot
                            </CardTitle>
                            <div className="mt-1 text-xs text-slate-500">
                                Priority planning controls for the marked plot
                            </div>
                        </div>
                        <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wide ${analysis.gprStatus.tone}`}>
                            {analysis.gprStatus.label}
                        </span>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-3">
                        <MetricTile
                            icon={FiMaximize2}
                            label="Plot Area"
                            value={`${formatNumber(analysis.areaSqm)} sqm`}
                            detail="Selected plot area from Master Plan"
                        />
                        <MetricTile
                            icon={FiTrendingUp}
                            label="Gross Plot Ratio"
                            value={analysis.highestGpr ? formatGpr(analysis.highestGpr) : "Not available"}
                            detail="Selected plot value from GPR"
                        />
                        <MetricTile
                            icon={FiLayers}
                            label="Land Use"
                            value={analysis.selectedPlotLandUse || "No selected plot"}
                            detail="Selected plot value from LU_DESC"
                        />
                    </div>

                    <div>
                        <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                                <FiGrid className="h-4 w-4 text-slate-500" aria-hidden="true" />
                                Key Control Matrix
                            </div>
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Planning mock</div>
                        </div>
                        <div className="grid gap-2 md:grid-cols-3">
                            {controlMatrix.map((item) => (
                                <ControlCell {...item} key={item.title} />
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <FiHome className="h-4 w-4 text-slate-500" aria-hidden="true" />
                        Selected Plot Use Quantum
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue={developmentOptions[0].key}>
                        <TabsList className="!grid h-auto w-full grid-cols-3">
                            {developmentOptions.map((option) => (
                                <TabsTrigger className="min-h-[2.75rem] whitespace-normal px-2 text-xs leading-tight" key={option.key} value={option.key}>
                                    <option.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                                    <span>{option.title}</span>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                        {developmentOptions.map((option) => (
                            <TabsContent key={option.key} value={option.key}>
                                <DevelopmentOption
                                    gfa={analysis.indicativeGfa}
                                    option={option}
                                />
                            </TabsContent>
                        ))}
                    </Tabs>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <FiCpu className="h-4 w-4 text-slate-500" aria-hidden="true" />
                        Area Analysis
                    </CardTitle>
                    <div className="text-xs text-slate-500">
                        Wider context for the selected plot
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-3">
                        <MetricTile
                            icon={FiBriefcase}
                            label="Average Quantum"
                            value={analysis.transactionAverageQuantum ? `$${formatNumber(analysis.transactionAverageQuantum)}` : "No data"}
                            detail={`${analysis.transactionCount} nearby caveats`}
                        />
                        <MetricTile
                            icon={FiHome}
                            label="Nearby Caveats"
                            value={formatNumber(analysis.transactionCount)}
                            detail="Transactions in the analysis area"
                        />
                        <MetricTile
                            icon={FiLayers}
                            label="Commercial-Led Uses"
                            value={formatNumber(analysis.commercialLedUses.length)}
                            detail="Commercial, white, or hotel Master Plan uses"
                        />
                    </div>
                    <div className="space-y-3 text-sm leading-6 text-slate-700">
                        <div className="rounded-lg border border-sky-100 bg-sky-50/50 p-3">
                            <div className="mb-2 flex items-center gap-2">
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-[10px] font-bold text-white">AI</div>
                                <span className="text-xs font-black uppercase tracking-wider text-sky-800">Intelligence Summary</span>
                            </div>
                            <div className="space-y-2">
                                <p>
                                    {analysis.selectedPlotLandUse ? (
                                        <>
                                            The selected plot is zoned for <strong className="text-sky-900">{analysis.selectedPlotLandUse}</strong>. 
                                            {analysis.highestGpr && ` With a Gross Plot Ratio of ${formatGpr(analysis.highestGpr)}, it supports an indicative GFA of approximately ${formatNumber(analysis.indicativeGfa)} sqm.`}
                                        </>
                                    ) : (
                                        "Select a plot on the map to see a detailed planning and quantum analysis."
                                    )}
                                </p>
                                {analysis.commercialLedUses.length > 0 && (
                                    <p>
                                        The surrounding area has <strong className="text-sky-900">{analysis.commercialLedUses.length} commercial-led</strong> land uses, suggesting a {analysis.commercialLedUses.length > 5 ? "high" : "moderate"} potential for mixed-use synergy. 
                                        {analysis.transactionCount > 0 && ` Nearby transaction data shows an average quantum of $${formatNumber(analysis.transactionAverageQuantum)} across ${analysis.transactionCount} caveats.`}
                                    </p>
                                )}
                                <p className="text-[10px] leading-tight text-slate-500 italic">
                                    Planning Note: Mixed-use developments must satisfy specific floor-to-floor height limits (5.0m commercial, 3.6m residential) and urban design guidelines for the {analysis.selectedPlotLandUse || "selected"} zone.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
