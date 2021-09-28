var StepDetail = React.createClass({
    requiredScripts: [
        'assets/scripts/codeDecoder.js',
        'spa/components/address.jsx',
        'spa/components/tag.jsx'
    ],
    renderColor() {
        var step = this.props.step;
        var parent = !step.parent ? "" : step.parent.from + step.parent.to + step.parent.type + step.parent.data + step.parent.result;
        return web3.utils.sha3(parent + step.from + step.to + step.type + step.data + step.result).substring(2, 5);
    },
    renderSubSteps(step, additionalData, showDetails, highlights) {
        var subSteps = [];
        subSteps = [...(step.steps || []), ...(step.logs || [])].reduce((acc, it) => ({...acc, [it.index] : it}), {});
        subSteps = Object.keys(subSteps).sort((a, b) => parseInt(a) - parseInt(b)).map(it => subSteps[it]);
        return subSteps.map((it, i) => <StepDetail key={i} step={it} additionalData={additionalData} showDetails={showDetails} highlights={highlights}/>);
    },
    render() {
        var { step, additionalData, showDetails, highlights } = this.props;

        var [details, setDetails] = useState(showDetails);

        useEffect(() => setDetails(showDetails), [showDetails]);

        var color = "#" + this.renderColor();

        var subSteps = this.renderSubSteps(step, additionalData, showDetails, highlights);

        if(highlights.VALUE && (step.value && step.value !== '0')) {
        } else if(step.parent && !highlights[step.type]) {
            return subSteps;
        }
        return (
            <div className={"w3-panel" + (step.parent ? " w3-margin-left" : "")} style={{ "border-color": color }}>
                {step.type !== 'LOG' && <p>
                    From <Address value={step.from} address={CodeDecoder.decodeAddress(step.from, step.fromCodeHash, additionalData)} isContract={step.fromCodeHash} /> to <Address value={step.to} address={CodeDecoder.decodeAddress(step.to, step.toCodeHash, additionalData)} isContract={step.toCodeHash} />
                </p>}
                <a onClick={() => setDetails(!details)} style={{ cursor: 'pointer' }}>
                    <p>
                        <span style={{"font-weight" : (!details || ((step.type === 'CREATE' || step.type === 'CREATE2' || step.type === 'TRANSFER') && !showDetails)) ? "bolder" : "normal"}}><i className={`fa fa-${step.type === 'LOG' ? 'bullhorn' : 'arrow-right-arrow-left'}`}></i>{"\u00a0"}{step.type === 'LOG' ? <LogLabel step={step} additionalData={additionalData} /> : CodeDecoder.decodeMethodLabel(step, additionalData, true)}</span>
                        {'\u00a0'}
                        |
                        {'\u00a0'}
                        <Tag>{step.type}</Tag>
                        {step.type !== 'LOG' && <>
                            {'\u00a0'}
                            |
                            {'\u00a0'}
                            <Tag color={step.success ? 'green' : 'red'} icon={step.success ? "check" : "times"}>{step.success ? 'SUCCESS' : 'FAILED'}</Tag>
                            {step.incomplete && <>
                                <span>{'\u00a0'}</span>
                                <Tag color={'khaki'} icon="warning">NOT RELIABLE STACK</Tag>
                            </>}
                        </>}
                    </p>
                </a>
                <p>
                    {(step.type === 'CALL' || step.type === 'CREATE' || step.type === 'CREATE2' || step.type === 'TRANSFER') && <span>Value: {window.fromDecimals(step.value, 18, true)} ETH</span>}
                    {step.gasUsed && <span> Gas: {window.formatMoney(step.gas)}</span>}
                    {step.gasUsed && <span> Gas Used: {window.formatMoney(step.gasUsed)}</span>}
                    {step.gasPrice && <span> Gas Price: {window.fromDecimals(step.gasPrice, 9, true)} GWEI</span>}
                </p>
                {step.type !== 'LOG' && details && <p>
                    {step.type !== 'CREATE' && step.type !== 'CREATE2' && step.type !== 'TRANSFER' && <>
                        <h5><b>Method</b></h5>
                        <h6><span className="w3-code">{CodeDecoder.decodeMethodLabel(step, additionalData)}</span></h6>
                        {step.params && step.params !== '0x' && <>
                            <h6>Input</h6>
                            <div className="w3-code w3-border-gray w3-light-gray" ref={ref => ref && (ref.innerHTML = CodeDecoder.decodeMethodInput(step, additionalData))} />
                        </>}
                    </>}
                    {((step.result && step.result !== '0x') || !step.success) && details && <>
                        <h6>Output</h6>
                        <div className="w3-code w3-border-gray w3-light-gray" ref={ref => ref && (ref.innerHTML = CodeDecoder.decodeMethodOutput(step, additionalData))} />
                    </>}
                </p>}
                {step.type === 'LOG' && details && <p>
                    <h5><b>Event</b></h5>
                    <div className="w3-container">
                        <h6><span className="w3-code">{CodeDecoder.decodeLog(step, additionalData)}</span></h6>
                        <p>Launcher: <Address value={step.address} address={CodeDecoder.decodeAddress(step.address, step.addressCodeHash, additionalData)} isContract={step.addressCodeHash} /></p>
                        <h6>Parameters</h6>
                        <div className="w3-code w3-border-gray w3-light-gray" ref={ref => ref && (ref.innerHTML = CodeDecoder.decodeLogInput(step, additionalData, true))} />
                    </div>
                </p>}
                {subSteps}
            </div>
        );
    }
});