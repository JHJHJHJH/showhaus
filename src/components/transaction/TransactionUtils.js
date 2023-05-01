export function formatPrice(price) {
    return "$" + price.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,");
}

export function transactionsDistribution(transactions){
    const sortedTransactions = transactions.sort(function(a, b) {
        return a.price - b.price;
    });

    let highest;
    let lowest;
    let median;
    if( sortedTransactions.length === 1 ){
        const singleTx = sortedTransactions[0];
        singleTx['price'] = formatPrice(singleTx['price']);
        highest = singleTx;
        lowest = singleTx;
        median = {}
    } else if ( sortedTransactions.length === 2 ){
        const lowestPriceTx = sortedTransactions[0];
        lowestPriceTx['price'] = formatPrice(lowestPriceTx['price']);
        const highestPriceTx = sortedTransactions[sortedTransactions.length-1];
        highestPriceTx['price'] = formatPrice(highestPriceTx['price']);
        highest = highestPriceTx;
        lowest = lowestPriceTx;
        median = {}
    } else {
        const lowestPriceTx = sortedTransactions[0];
        lowestPriceTx['price'] = formatPrice(lowestPriceTx['price']);
        const highestPriceTx = sortedTransactions[sortedTransactions.length-1];
        highestPriceTx['price'] = formatPrice(highestPriceTx['price']);      
        const medianTransaction = sortedTransactions[ Math.floor(sortedTransactions.length/2)]
        medianTransaction['price'] = formatPrice(medianTransaction['price']);
        highest = highestPriceTx;
        lowest = lowestPriceTx;
        median = medianTransaction;
    }       

    return { "highestTransaction": highest, "lowestTransaction": lowest, "medianTransaction": median}
}