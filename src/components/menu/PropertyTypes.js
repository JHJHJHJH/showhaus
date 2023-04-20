import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { updatePropertyTypes } from "../../reducers/searchRadiusSlice";
export default function PropertyTypes(){
    const searchRadiusState = useSelector((state) => state.searchRadiusState );
    const dispatch = useDispatch();
    const handleCheckboxChecked = (event) => {
        const { name, checked } = event.target;
        const tempState = JSON.parse(JSON.stringify(searchRadiusState.propertyTypes));;

        tempState.forEach((propertyTypes) => {
          if (propertyTypes["id"] === name){
            propertyTypes["isChecked"] = checked;
            
          }
        });

        dispatch(updatePropertyTypes([...tempState]));

    }
    return(
        <div className="property-opt">
            <label className="font-bold" >Property Types</label>
        
            {searchRadiusState.propertyTypes.map( (propertyType, index) =>(
                <label className="block my-1 text-sm"  key={index} >
                    <input 
                        type="checkbox" 
                        className="mx-2 scale-90" 
                        name={propertyType["id"]} 
                        checked={propertyType["isChecked"]}
                        onChange={handleCheckboxChecked}
                    />
                    {propertyType["id"]}
                </label>
            ))}
        </div>
    )
}