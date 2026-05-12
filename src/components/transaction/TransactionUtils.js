export function formatPrice(price) {
    return "$" + price.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,");
}

function formatDate(dateStr) {
    if (!dateStr || typeof dateStr !== "string" || dateStr.length !== 4) {
        return dateStr;
    }
    return dateStr.substring(0, 2) + "/" + dateStr.substring(2, 4);
}

function formatTransaction(transaction) {
    if (!transaction || transaction.price === undefined || transaction.price === null || transaction.price === "") {
        return {};
    }

    return {
        ...transaction,
        price: formatPrice(Number(transaction.price)),
        contract_date: formatDate(transaction.contract_date),
    };
}

function percentileTransaction(sortedTransactions, percentile) {
    if (sortedTransactions.length === 0) {
        return {};
    }

    const index = Math.ceil((percentile / 100) * sortedTransactions.length) - 1;
    const boundedIndex = Math.min(Math.max(index, 0), sortedTransactions.length - 1);
    return sortedTransactions[boundedIndex];
}

function parseMMYY(dateStr) {
    if (!dateStr || typeof dateStr !== "string" || dateStr.length !== 4) {
        return 0;
    }
    const month = parseInt(dateStr.substring(0, 2), 10);
    const year = parseInt(dateStr.substring(2, 4), 10);
    // Assuming 2000+ for 00-49 and 1900+ for 50-99 (though SG property data is usually recent)
    const fullYear = year < 50 ? 2000 + year : 1900 + year;
    return fullYear * 100 + month;
}

export function transactionsDistribution(transactions){
    const sortedByPrice = [...transactions].sort(function(a, b) {
        return a.price - b.price;
    });

    const sortedByDate = [...transactions].sort(function(a, b) {
        return parseMMYY(b.contract_date) - parseMMYY(a.contract_date);
    });

    const latest = sortedByDate[0];
    const highest = sortedByPrice[sortedByPrice.length - 1];
    const lowest = sortedByPrice[0];
    const median = sortedByPrice.length > 0
        ? sortedByPrice[Math.floor(sortedByPrice.length / 2)]
        : {};
    const percentile90 = percentileTransaction(sortedByPrice, 90);
    const percentile10 = percentileTransaction(sortedByPrice, 10);

    return {
        "latestTransaction": formatTransaction(latest),
        "highestTransaction": formatTransaction(highest),
        "percentile90Transaction": formatTransaction(percentile90),
        "medianTransaction": formatTransaction(median),
        "percentile10Transaction": formatTransaction(percentile10),
        "lowestTransaction": formatTransaction(lowest),
    }
}
