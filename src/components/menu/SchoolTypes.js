import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateSchoolTypes } from "../../reducers/searchRadiusSlice";

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
        <div className="my-4 school-type-opt">
            <label className="font-bold">School Types</label>

            {schoolTypes.map((schoolType) => (
                <label className="my-1 block text-sm" key={schoolType.id}>
                    <input
                        type="checkbox"
                        className="mx-2 scale-90"
                        name={schoolType.id}
                        checked={schoolType.isChecked}
                        onChange={handleCheckboxChecked}
                    />
                    {schoolType.label}
                </label>
            ))}
        </div>
    );
}
