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

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

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
            <ResizablePanel className="overflow-y-auto bg-slate-50/80 backdrop-blur-md">
                <div className="p-6">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <div className="text-2xl font-black tracking-tight text-slate-800">Explore</div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Nearby Analysis</div>
                        </div>
                        <div className="flex items-center gap-2">
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
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <span>📊</span>
                                        <span>Analysis</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="py-4 text-center text-sm text-slate-500 italic">
                                        Detailed area analysis and trends coming soon.
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="nearby" className="space-y-4">
                            <NearbyMrt/>
                            <NearbySchools/>
                            <NearbyProjects/>
                            <NearbyLandUses/>
                        </TabsContent>

                        <TabsContent value="settings" className="space-y-3">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <span>📏</span>
                                        <span>Search Radius</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm">
                                        <label className="font-medium text-slate-700" htmlFor="radiusRange">Radius: {searchRadiusState.radius} km</label>
                                        <div className="mt-2 flex items-center gap-3">
                                            <input
                                                className="min-w-0 flex-1 accent-slate-700"
                                                type="range"
                                                min={0.1}
                                                max={5}
                                                step={0.1}
                                                value={searchRadiusState.radius}
                                                onChange={(e) => dispatch(updateRadius(e.target.value))}
                                                id="radiusRange"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <SchoolTypes/>
                            <PropertyTypes/>
                        </TabsContent>
                    </Tabs>
                </div>
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}
