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
            defaultSize="35vw"
            minSize={280}
            maxSize="50vw"
        >
            <ResizableHandle />
            <ResizablePanel className="overflow-y-auto">
                <div className="p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <div className="text-xl font-bold">Explore</div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                className="rounded-full border border-slate-300 p-2 text-slate-600 transition hover:bg-slate-100"
                                aria-label="Collapse nearby menu"
                                title="Collapse nearby menu"
                                onClick={onCollapse}
                            >
                                <FiEyeOff className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <Tabs defaultValue="analysis">
                        <TabsList className="!grid w-full grid-cols-3">
                            <TabsTrigger value="analysis">
                                <FiBarChart2 className="h-4 w-4" aria-hidden="true" />
                                Analysis
                            </TabsTrigger>
                            <TabsTrigger value="nearby">
                                <FiMapPin className="h-4 w-4" aria-hidden="true" />
                                Nearby
                            </TabsTrigger>
                            <TabsTrigger value="settings">
                                <FiSettings className="h-4 w-4" aria-hidden="true" />
                                Settings
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="analysis">
                        </TabsContent>

                        <TabsContent value="nearby" className="space-y-3">
                            <NearbyMrt/>
                            <NearbySchools/>
                            <NearbyProjects/>
                            <NearbyLandUses/>
                        </TabsContent>

                        <TabsContent value="settings">
                            <div className="space-y-4 rounded-md border border-slate-200 bg-white p-4">
                                <div className="text-sm">
                                    <label className="font-medium text-slate-700" htmlFor="radiusRange">Radius (km)</label>
                                    <div className="mt-2 flex items-center gap-3">
                                        <input
                                            className="min-w-0 flex-1"
                                            type="range"
                                            min={0.1}
                                            max={5}
                                            step={0.1}
                                            value={searchRadiusState.radius}
                                            onChange={(e) => dispatch(updateRadius(e.target.value))}
                                            id="radiusRange"
                                        />
                                        <span className="w-10 text-right text-sm font-semibold text-slate-700">
                                            {searchRadiusState.radius}
                                        </span>
                                    </div>
                                </div>
                                <SchoolTypes/>
                                <PropertyTypes/>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}
