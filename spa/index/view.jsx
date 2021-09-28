var Index = React.createClass({
    requiredModules: [
        'spa/config',
        'spa/transactions',
        'spa/selectedTransaction'
    ],
    requiredScripts: [
        'assets/scripts/codeDecoder.js'
    ],
    getDefaultSubscriptions() {
        return {
            'dump': this.controller.onDump
        }
    },
    render() {
        var [additionalData] = useState(null, "additionalData");
        var [transactions] = useState(null, "transactions");
        var [selectedTransaction, setSelectedTransaction] = useState(null, "selectedTransaction");
        var [transactionsList, setTransactionsList] = useState(null);
        function onTransaction(sT, tL) {
            setTransactionsList(tL);
            setSelectedTransaction(sT);
        }
        return (<>
            <Config />
            {selectedTransaction && <SelectedTransaction additionalData={additionalData} transaction={selectedTransaction} transactionsList={transactionsList} onTransaction={onTransaction} />}
            {!selectedTransaction && (!transactions || transactions.length === 0) && <h1 className="w3-container">No Transactions right now</h1>}
            {!selectedTransaction && transactions && transactions.length > 0 && (!additionalData || !additionalData.transactionLists) && <Transactions additionalData={additionalData} transactions={transactions} onTransaction={setSelectedTransaction} />}
            {!selectedTransaction && transactions && transactions.length > 0 && additionalData && additionalData.transactionLists && Object.entries(additionalData.transactionLists).map(entry => <Transactions title={entry[0]} additionalData={additionalData} transactions={entry[1]} onTransaction={sT => onTransaction(sT, entry[1])} />)}
        </>
        );
    }
});