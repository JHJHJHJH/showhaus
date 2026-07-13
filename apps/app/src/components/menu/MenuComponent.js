import React from "react";
import {useDispatch, useSelector} from 'react-redux';
import { FiBarChart2, FiEyeOff, FiMapPin, FiSettings } from "react-icons/fi";
import { updateRadius } from "../../reducers/searchRadiusSlice";
import NearbyMrt from "./NearbyMrt";
import NearbyProjects from "./NearbyProjects";
import NearbySchools from "./NearbySchools";
import NearbyLandUses from "./NearbyLandUses";
import PropertyTypes from "./PropertyTypes";
import SchoolTypes from "./SchoolTypes";
import AnalysisPanel from "./AnalysisPanel";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "../ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

export default function MenuComponent({ onCollapse }){
    const searchRadiusState = useSelector((state) => state.searchRadiusState );
    const dispatch = useDispatch();

    return (
        <ResizablePanelGroup
            className="z-20"
            defaultSize="50vw"
            minSize={280}
            maxSize="65vw"
        >
            <ResizableHandle />
            <ResizablePanel className="overflow-y-auto bg-slate-50/80 backdrop-blur-md">
                <div className="p-6">
                    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <div className="text-2xl font-black tracking-tight text-slate-800">Explore</div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Nearby Analysis</div>
                        </div>
                        <div className="flex flex-1 items-center justify-end gap-2">
                            <div className="min-w-[140px] max-w-[190px] flex-1 text-sm">
                                <label className="flex items-center justify-between gap-3 font-medium text-slate-700" htmlFor="radiusRange">
                                    <span>Radius</span>
                                    <span className="font-mono text-slate-900">{searchRadiusState.radius} km</span>
                                </label>
                                <input
                                    className="mt-1 w-full accent-slate-700"
                                    type="range"
                                    min={0.1}
                                    max={5}
                                    step={0.1}
                                    value={searchRadiusState.radius}
                                    onChange={(e) => dispatch(updateRadius(e.target.value))}
                                    id="radiusRange"
                                />
                            </div>
                            <button
                                type="button"
                                className="rounded-full border border-slate-200 bg-white p-2.5 text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 hover:shadow-md"
                                aria-label="Collapse nearby menu"
                                title="Collapse nearby menu"
                                onClick={onCollapse}
                            >
                                <FiEyeOff className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <Tabs defaultValue="nearby">
                        <TabsList className="!grid w-full grid-cols-3">
                            <TabsTrigger value="nearby">
                                <FiMapPin className="h-4 w-4" aria-hidden="true" />
                                Nearby
                            </TabsTrigger>
                            <TabsTrigger value="analysis">
                                <FiBarChart2 className="h-4 w-4" aria-hidden="true" />
                                Analysis
                            </TabsTrigger>
                            <TabsTrigger value="settings">
                                <FiSettings className="h-4 w-4" aria-hidden="true" />
                                Settings
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="nearby" className="space-y-4">
                            <NearbyMrt/>
                            <NearbySchools/>
                            <NearbyProjects/>
                            <NearbyLandUses/>
                        </TabsContent>

                        <TabsContent value="analysis">
                            <AnalysisPanel />
                        </TabsContent>

                        <TabsContent value="settings" className="space-y-3">
                            <SchoolTypes/>
                            <PropertyTypes/>
                        </TabsContent>
                    </Tabs>
                </div>
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}
