export function formatPrice(price) {
    return "$" + price.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,");
}

function formatTransaction(transaction) {
    if (!transaction || transaction.price === undefined || transaction.price === null || transaction.price === "") {
        return {};
    }

    return {
        ...transaction,
        price: formatPrice(Number(transaction.price)),
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

export function transactionsDistribution(transactions){
    const sortedTransactions = [...transactions].sort(function(a, b) {
        return a.price - b.price;
    });

    const highest = sortedTransactions[sortedTransactions.length - 1];
    const lowest = sortedTransactions[0];
    const median = sortedTransactions.length > 2
        ? sortedTransactions[Math.floor(sortedTransactions.length / 2)]
        : {};
    const percentile90 = percentileTransaction(sortedTransactions, 90);
    const percentile10 = percentileTransaction(sortedTransactions, 10);

    return {
        "highestTransaction": formatTransaction(highest),
        "percentile90Transaction": formatTransaction(percentile90),
        "medianTransaction": formatTransaction(median),
        "percentile10Transaction": formatTransaction(percentile10),
        "lowestTransaction": formatTransaction(lowest),
    }
}
