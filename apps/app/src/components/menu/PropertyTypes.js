import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { updatePropertyTypes } from "../../reducers/searchRadiusSlice";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export default function PropertyTypes(){
    const propertyTypes = useSelector((state) => state.searchRadiusState.propertyTypes);
    const dispatch = useDispatch();

    const handleCheckboxChecked = (event) => {
        const { name, checked } = event.target;
        const updatedPropertyTypes = propertyTypes.map((pt) => {
            if (pt.id === name) {
                return { ...pt, isChecked: checked };
            }
            return pt;
        });

        dispatch(updatePropertyTypes(updatedPropertyTypes));
    }

    return(
        <Card className="property-opt">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                    <span>🏠</span>
                    <span>Property Types</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 gap-1">
                    {propertyTypes.map((propertyType, index) => (
                        <label className="flex cursor-pointer items-center gap-2 rounded-md py-1 text-sm text-slate-700 transition-colors hover:bg-slate-50" key={index}>
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-slate-500"
                                name={propertyType.id}
                                checked={propertyType.isChecked}
                                onChange={handleCheckboxChecked}
                            />
                            <span>{propertyType.id}</span>
                        </label>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}