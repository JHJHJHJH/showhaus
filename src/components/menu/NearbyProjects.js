import React from "react";
import { useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { FiHome } from "react-icons/fi";

function toPascalCase(value = ""){
    return value
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

export default function NearbyProjects(){
    const transactions = useSelector((state) => state.transactionState.transactions || []);

    const projects = Array.from(
        transactions.reduce((acc, transaction) => {
            const project = transaction.project;
            const street = transaction.street;

            if(!project){
                return acc;
            }

            const key = `${project}|${street || ""}`;
            if(!acc.has(key)){
                acc.set(key, { project, street });
            }

            return acc;
        }, new Map()).values()
    ).sort((a, b) => (
        a.project.localeCompare(b.project) || String(a.street || "").localeCompare(String(b.street || ""))
    ));

    return(
        <Card className="nearby-projects">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                    <span>🏢</span>
                    <span>Nearby Projects</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {projects.length > 0 ? (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {projects.map((project) => (
                            <div className="flex items-start gap-2 py-1 text-sm text-slate-700" key={`${project.project}-${project.street || ""}`}>
                                <FiHome className="mt-1 h-3 w-3 shrink-0 text-slate-400" />
                                <div className="min-w-0 leading-tight">
                                    <div className="truncate font-medium" title={project.project}>{project.project}</div>
                                    {project.street ? (
                                        <div className="truncate text-[10px] uppercase tracking-wider text-slate-400" title={toPascalCase(project.street)}>{toPascalCase(project.street)}</div>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-2 text-center text-xs text-slate-500 italic">
                        No projects found in radius
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
