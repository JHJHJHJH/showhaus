import React from "react";
import { useSelector } from "react-redux";
import { formatSchoolType, getSchoolKey, getSchoolTypeColor, SCHOOL_TYPE_ORDER } from "../../utils/schoolData";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export default function NearbySchools(){
    const schoolsInRadius = useSelector((state) => state.searchRadiusState.schoolsInRadius) || [];

    const sortedSchools = [...schoolsInRadius].sort((a, b) => {
        const aIndex = SCHOOL_TYPE_ORDER.indexOf(a.school_type);
        const bIndex = SCHOOL_TYPE_ORDER.indexOf(b.school_type);

        if(aIndex === -1 && bIndex === -1){
            return String(a.school_type || '').localeCompare(String(b.school_type || '')) || a.name.localeCompare(b.name);
        }

        if(aIndex === -1){
            return 1;
        }

        if(bIndex === -1){
            return -1;
        }

        return aIndex - bIndex || a.name.localeCompare(b.name);
    });

    return(
        <Card className="nearby-schools">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                    <span>🏫</span>
                    <span>Nearby Schools</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {sortedSchools.length > 0 ? (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {sortedSchools.map((school) => (
                            <div className="flex items-start gap-2 py-1 text-sm text-slate-700" key={getSchoolKey(school)}>
                                <span
                                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                                    style={{ backgroundColor: getSchoolTypeColor(school.school_type) }}
                                    title={formatSchoolType(school.school_type)}
                                    aria-label={formatSchoolType(school.school_type)}
                                />
                                <div className="leading-tight">{school.name}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-2 text-center text-xs text-slate-500 italic">
                        No schools found in radius
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
