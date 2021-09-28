var LogLabel = React.createClass({
    decode : {
        "0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c" : (step, additionalData) => {
            var address = CodeDecoder.decodeAddress(abi.decode(["address"], step.topics[1])[0], undefined, additionalData, true);
            return <>Wrap of ~ {window.fromDecimals(abi.decode(["uint256"], step.data)[0].toString(), 18)} $ETH by {address}</>;
        },
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" : (step, additionalData) => {
            var amount = window.fromDecimals(abi.decode(["uint256"], step.data)[0].toString(), 18);
            if(amount === '0') {
                amount = window.fromDecimals(abi.decode(["uint256"], step.data)[0].toString(), 18, true);
            } else {
                amount = "~ " + amount;
            }
            var token = CodeDecoder.decodeAddress(step.address, step.addressCodeHash, additionalData);
            token = token.split(' ')[0];
            token = token.indexOf('0x') === 0 ? 'tokens' : ("$" + token);
            var verb = step.topics[1] === window.voidBytes32 ? "minted" : step.topics[2] === window.voidBytes32 ? "burned" : "transferred";
            var text = `${amount} ${token} ${verb}`;
            if(verb === "transferred" || verb === ' burned') {
                text += ` ${verb === 'transferred' ? 'from' : 'by'} ${CodeDecoder.decodeAddress(abi.decode(["address"], step.topics[1])[0], undefined, additionalData, true)}`;
            }
            if(verb === "transferred" || (verb === 'minted' && step.topics[2] !== window.voidBytes32)) {
                text += ` to ${CodeDecoder.decodeAddress(abi.decode(["address"], step.topics[2])[0], undefined, additionalData, true)}`;
            }
            if(verb === 'minted' && step.topics[2] === window.voidBytes32) {
                text += ' and then burned';
            }
            return <span ref={ref => ref && (ref.innerHTML = text)}></span>;
        }
    },
    render() {
        var { step, additionalData } = this.props;
        return (<>{(this.decode[step.topics[0]] && this.decode[step.topics[0]](step, additionalData)) || CodeDecoder.decodeLog(step, additionalData, true)}</>);
    }
});