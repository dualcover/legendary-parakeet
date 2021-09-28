var SelectedTransaction = React.createClass({
    requiredScripts: [
        'spa/components/address.jsx',
        'spa/components/tag.jsx',
        'spa/selectedTransaction/stepDetail.jsx',
        'spa/selectedTransaction/logLabel.jsx'
    ],
    extractHighlights(transaction) {
        var LOG = transaction.logs && transaction.logs.length > 0;
        var VALUE = !isNaN(parseInt(transaction.value)) && parseInt(transaction.value) !== 0;
        var highlights = {
            [transaction.type] : transaction.type === 'TRANSFER'
        };
        var _this = this;
        (transaction.steps || []).forEach(step => highlights = {...highlights, ..._this.extractHighlights(step)});
        highlights = Object.keys(highlights).sort().reduce((acc, key) => ({...acc, [key] : highlights[key]}), {});
        highlights = LOG ? {...highlights, LOG} : highlights;
        highlights = VALUE && Object.values(highlights).length > 1 ? {...highlights, VALUE} : highlights;
        return highlights;
    },
    render() {
        var _this = this;
        var transaction = this.props.transaction;
        var transactionsList = this.props.transactionsList;
        var additionalData = this.props.additionalData;
        var currentIndex = transactionsList.indexOf(transaction);
        var onPrev = currentIndex > 0 && (() => _this.props.onTransaction(transactionsList[currentIndex - 1], transactionsList));
        var onNext = currentIndex < transactionsList.length - 1 && (() => _this.props.onTransaction(transactionsList[currentIndex + 1], transactionsList));
        
        var [showDetails, setShowDetails] = useState(false);
        var [highlights, setHighlights] = useState({});
        useEffect(() => setHighlights(_this.extractHighlights(transaction)), [transaction]);
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
                <h3>Transaction <a target="_blank" href={window.getEtherscanAddress(`tx/${transaction.transactionHash}`)}>{transaction.transactionHash}</a> | Block: #{transaction.blockNumber}{transaction.blockTimestamp && <> | Mined at: {new Date(transaction.blockTimestamp * 1000).toLocaleString()}</>}</h3>
                <p>
                    <label>
                        Show details
                        {'\u00a0'}
                        <input type='radio' onChange={() => setShowDetails(true)} checked={showDetails}/>
                    </label>
                    {'\u00a0'}
                    <label>
                        Collapse details
                        {'\u00a0'}
                        <input type='radio' onChange={() => setShowDetails(false)} checked={!showDetails}/>
                    </label>
                    {Object.entries(highlights).length > 1 && Object.entries(highlights).map((it => <>
                        {'\u00a0'}
                        |
                        {'\u00a0'}
                        <label>
                            Show {it[0]}
                            {'\u00a0'}
                            <input type='checkbox' onChange={e => setHighlights({...highlights, [it[0]] : e.currentTarget.checked})} checked={it[1]}/>
                        </label>
                    </>))}
                </p>
                <StepDetail step={transaction} additionalData={additionalData} showDetails={showDetails} highlights={highlights}/>
            </div>
        );
    }
});