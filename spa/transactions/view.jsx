var Transactions = React.createClass({
    requiredScripts: [
        'assets/scripts/codeDecoder.js',
        'spa/components/address.jsx',
        'spa/components/tag.jsx'
    ],
    render() {
        var _this = this;
        return (
            <div className="w3-container">
                <h2>{this.props.title || "Transactions"}</h2>
                <table className="w3-table-all w3-hoverable">
                    <thead>
                        <tr className="w3-theme">
                            <th>Txn Hash</th>
                            <th>Method</th>
                            <th>Block</th>
                            <th>From</th>
                            <th>To</th>
                            <th>{"\u00a0"}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.props.transactions.map(transaction => <tr key={transaction.transactionHash} id={"txn_" + transaction.transactionHash}>
                            <td>
                                <a href={"#txn_" + transaction.transactionHash} onClick={() => this.props.onTransaction(transaction)}>{window.shortenWord(transaction.transactionHash, 15)}</a>
                            </td>
                            <td>
                                <Tag bold={!transaction.method || transaction.method === '0x' || (!transaction.parent && transaction.type !== 'CALL')}>
                                    {CodeDecoder.decodeMethodLabel(transaction, _this.props.additionalData, true)}
                                </Tag>
                            </td>
                            <td>
                                # {transaction.blockNumber}
                            </td>
                            <td>
                                <Address address={CodeDecoder.decodeAddress(transaction.from, transaction.fromCodeHash, _this.props.additionalData, true)} isContract={transaction.fromCodeHash} shorten />
                            </td>
                            <td>
                                <Address address={CodeDecoder.decodeAddress(transaction.to, transaction.toCodeHash, _this.props.additionalData, true)} isContract={transaction.toCodeHash} shorten />
                            </td>
                            <td>
                                <Tag color={transaction.success ? 'green' : 'red'} icon={transaction.success ? "check" : "times"}>
                                    {transaction.success ? 'SUCCESS' : 'FAILED'}
                                    {transaction.incomplete && <>
                                        {'\u00a0'}
                                        <i className='fa fa-warning w3-right' style={{ "color": 'khaki' }}></i>
                                    </>}
                                </Tag>
                            </td>
                        </tr>)}
                    </tbody>
                </table>
            </div>
        );
    }
});