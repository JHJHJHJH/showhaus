import React from "react";
import {useDispatch, useSelector} from 'react-redux';
import { FiSettings } from "react-icons/fi";
import { updateRadius } from "../../reducers/searchRadiusSlice";
import NearbyMrt from "./NearbyMrt";
import NearbyProjects from "./NearbyProjects";
import NearbySchools from "./NearbySchools";
import PropertyTypes from "./PropertyTypes";
import SchoolTypes from "./SchoolTypes";

export default function MenuComponent(){
    const searchRadiusState = useSelector((state) => state.searchRadiusState );
    const dispatch = useDispatch();

    return (
        <div className="p-4">
            <div className="mb-3 flex items-center justify-between">
                <div className="text-xl font-bold">📍 What's nearby ?</div>
                <div className="group relative">
                    <button
                        type="button"
                        className="rounded-full border border-slate-300 p-2 text-slate-600 transition hover:bg-slate-200"
                        aria-haspopup="dialog"
                        aria-label="Filter settings"
                        title="Filter settings"
                    >
                        <FiSettings className="h-5 w-5" />
                    </button>
                    <div className="invisible absolute right-0 top-full z-20 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 text-left opacity-0 shadow-xl transition-all duration-150 group-hover:visible group-hover:opacity-100">
                        <div className="mb-2 font-bold">Settings</div>
                        <div className="my-2 text-sm">
                            <label htmlFor="radiusRange">Radius (km)</label>

                            <input
                                className="mx-2"
                                type="range"
                                min={0.1}
                                max={5}
                                step={0.1}
                                value={searchRadiusState.radius}
                                onChange={(e) => dispatch(updateRadius(e.target.value))}
                                id="radiusRange"
                            />
                            {searchRadiusState.radius}
                        </div>
                        <SchoolTypes/>
                        <PropertyTypes/>
                    </div>
                </div>
            </div>

            <NearbyMrt/>
            <NearbySchools/>
            <NearbyProjects/>
        </div>
        
    )
}
