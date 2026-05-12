import React from "react";
import { useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

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
            <CardHeader>
                <CardTitle>🏢 Projects</CardTitle>
            </CardHeader>
            <CardContent>
                {projects.map((project) => (
                    <div className="py-1 text-sm" key={`${project.project}-${project.street || ""}`}>
                        <div>
                            {project.project}
                            {project.street ? (
                                <span className="ml-1 text-xs text-slate-500">{toPascalCase(project.street)}</span>
                            ) : null}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
