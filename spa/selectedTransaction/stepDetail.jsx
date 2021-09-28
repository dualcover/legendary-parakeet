var StepDetail = React.createClass({
    requiredScripts: [
        'assets/scripts/codeDecoder.js',
        'spa/components/address.jsx',
        'spa/components/tag.jsx'
    ],
    renderColor() {
        var step = this.props.step;
        var parent = !step.parent ? "" : step.parent.from + step.parent.to + step.parent.type + step.parent.data + step.parent.result;
        return web3.utils.sha3(parent + step.from + step.to + step.type + step.data + step.result).substring(2, 6);
    },
    render() {
        var { step, additionalData } = this.props;
        var color = "#" + this.renderColor();
        return (
            <div className={"w3-panel" + (step.parent ? " w3-margin-left" : "")} style={{ "border-color": color }}>
                <p>
                    From <Address address={CodeDecoder.decodeAddress(step.from, step.fromCodeHash, additionalData)} isContract={step.fromCodeHash} /> to <Address address={CodeDecoder.decodeAddress(step.to, step.toCodeHash, additionalData)} isContract={step.toCodeHash} />
                </p>
                <p>
                    <span>Type: </span>
                    <Tag>{step.type}</Tag>
                    <span> Verdict: </span>
                    <Tag color={step.success ? 'green' : 'red'} icon={step.success ? "check" : "times"}>{step.success ? 'SUCCESS' : 'FAILED'}</Tag>
                    {step.incomplete && <>
                        <span>{'\u00a0'}</span>
                        <Tag color={'khaki'} icon="warning">NOT RELIABLE STACK</Tag>
                    </>}
                </p>
                <p>
                    <span>Value: {window.fromDecimals(step.value, 18, true)} ETH</span>
                    <span> Gas: {window.formatMoney(step.gasUsed)}</span>
                    {step.gasPrice && <span> Gas Price: {window.fromDecimals(step.gasPrice, 9)} GWEI</span>}
                </p>
                <p>
                    {step.type !== 'CREATE' && step.type !== 'CREATE2' && step.type !== 'TRANSFER' && <>
                        <h5><b>Method</b></h5>
                        <h6><span className="w3-code">{CodeDecoder.decodeMethodLabel(step, additionalData)}</span></h6>
                        {step.params && step.params !== '0x' && <>
                            <h6>Input</h6>
                            <div className="w3-code w3-border-gray w3-light-gray" ref={ref => ref && (ref.innerHTML = CodeDecoder.decodeMethodInput(step, additionalData))} />
                        </>}
                    </>}
                    {((step.result && step.result !== '0x') || !step.success) && <>
                        <h6>Output</h6>
                        <div className="w3-code w3-border-gray w3-light-gray" ref={ref => ref && (ref.innerHTML = CodeDecoder.decodeMethodOutput(step, additionalData))} />
                    </>}
                </p>
                {step.logs && step.logs.length > 0 && <p>
                    <h5><b>Events</b></h5>
                    {step.logs.map(log => <div key={log.key} className="w3-container">
                        <h6><span className="w3-code">{CodeDecoder.decodeLog(log, additionalData)}</span></h6>
                        <p>Launcher: <Address address={CodeDecoder.decodeAddress(log.address, log.addressCodeHash, additionalData)} isContract={log.addressCodeHash} /></p>
                        <h6>Parameters</h6>
                        <div className="w3-code w3-border-gray w3-light-gray" ref={ref => ref && (ref.innerHTML = CodeDecoder.decodeLogInput(log, additionalData))} />
                    </div>)}
                </p>}
                {step.steps && step.steps.map((it, i) => <StepDetail key={i} step={it} additionalData={additionalData} />)}
            </div>
        );
    }
});