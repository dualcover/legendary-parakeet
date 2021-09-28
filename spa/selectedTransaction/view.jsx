var SelectedTransaction = React.createClass({
    requiredScripts: [
        'spa/components/address.jsx',
        'spa/components/tag.jsx',
        'spa/selectedTransaction/stepDetail.jsx'
    ],
    render() {
        var _this = this;
        var transaction = this.props.transaction;
        var transactionsList = this.props.transactionsList;
        var additionalData = this.props.additionalData;
        var currentIndex = transactionsList.indexOf(transaction);
        var onPrev = currentIndex > 0 && (() => _this.props.onTransaction(transactionsList[currentIndex - 1], transactionsList));
        var onNext = currentIndex < transactionsList.length - 1 && (() => _this.props.onTransaction(transactionsList[currentIndex + 1], transactionsList));
        var current = currentIndex + 1;
        var length = transactionsList.length;
        return (
            <div className="w3-container">
                <div className="w3-container">
                    <div className="w3-container w3-left">
                        <a className="w3-button" href="javascript:;" onClick={() => _this.props.onTransaction()}>
                            <i className="fa fa-arrow-left"></i>
                            {"\u00a0"}
                            Back
                        </a>
                    </div>
                    <div className="w3-container w3-right">
                        <a className={"w3-button" + (onPrev ? "" : " w3-disabled")} href="javascript:;" onClick={onPrev}>
                            <i className="fa fa-arrow-left"></i>
                            {"\u00a0"}
                            Prev
                        </a>
                        {"\u00a0"}
                        <span>{currentIndex + 1} of {transactionsList.length}</span>
                        {"\u00a0"}
                        <a className={"w3-button" + (onNext ? "" : " w3-disabled")} href="javascript:;" onClick={onNext}>
                            Next
                            {"\u00a0"}
                            <i className="fa fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
                <h3>Transaction <a target="_blank" href={`https://etherscan.io/tx/${transaction.transactionHash}`}>{transaction.transactionHash}</a> | Block: #{transaction.blockNumber}{transaction.blockTimestamp && <> | Mined at: {new Date(transaction.blockTimestamp * 1000).toLocaleString()}</>}</h3>
                <StepDetail step={transaction} additionalData={additionalData} />
            </div>
        );
    }
});