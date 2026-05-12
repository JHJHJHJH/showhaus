import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateSchoolTypes } from "../../reducers/searchRadiusSlice";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export default function SchoolTypes(){
    const schoolTypes = useSelector((state) => state.searchRadiusState.schoolTypes);
    const dispatch = useDispatch();

    const handleCheckboxChecked = (event) => {
        const { name, checked } = event.target;
        const updatedSchoolTypes = schoolTypes.map((schoolType) => {
            if(schoolType.id === name){
                return {
                    ...schoolType,
                    isChecked: checked
                };
            }

            return schoolType;
        });

        dispatch(updateSchoolTypes(updatedSchoolTypes));
    };

    return(
        <Card className="school-type-opt">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                    <span>🎓</span>
                    <span>School Types</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 gap-1">
                    {schoolTypes.map((schoolType) => (
                        <label className="flex cursor-pointer items-center gap-2 rounded-md py-1 text-sm text-slate-700 transition-colors hover:bg-slate-50" key={schoolType.id}>
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-slate-500"
                                name={schoolType.id}
                                checked={schoolType.isChecked}
                                onChange={handleCheckboxChecked}
                            />
                            <span>{schoolType.label}</span>
                        </label>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
