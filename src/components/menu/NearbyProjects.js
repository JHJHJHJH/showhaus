import React from "react";
import { useSelector } from "react-redux";

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
        <div className="my-4 nearby-projects">
            <label className="font-bold">🏢 Projects</label>

            {projects.map((project) => (
                <div className="m-1.5 text-sm" key={`${project.project}-${project.street || ""}`}>
                    <div>
                        {project.project}
                        {project.street ? ` | ${project.street}` : ""}
                    </div>
                </div>
            ))}
        </div>
    );
}
