export function normalizeProject(project = {}){
    return {
        ...project,
        project: project.project,
        street: project.street,
        ura_private_resi_id: project.ura_private_resi_id,
        transaction_count: project.transaction_count,
        latest_contract_date: project.latest_contract_date,
        latest_price: project.latest_price,
        price_avg: project.price_avg,
        price_min: project.price_min,
        price_max: project.price_max,
        market_segment: project.market_segment
    };
}

export function getProjectKey(project = {}){
    const id = project.ura_private_resi_id ?? project.id;

    if(id !== undefined && id !== null && id !== ""){
        return String(id);
    }

    return `${project.project || ""}-${project.street || ""}`;
}
