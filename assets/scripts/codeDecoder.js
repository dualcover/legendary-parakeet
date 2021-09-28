window.CodeDecoder = (function CodeDecoder() {

    var evmErrors = {
        0x01 : "Using assert",
        0x11 : "SafeMath over-/under-flows",
        0x12 : "Divide by 0",
        0x21 : "Conversion into non-existent enum type",
        0x22 : "Incorrectly encoded storage byte array",
        0x31 : "pop() on an empty array",
        0x32 : "Index out of bounds exception",
        0x41 : "Allocating too much memory or creating a too large array",
        0x51 : "Calling a zero-initialized variable of internal function type"
    };

    function truncatedAddress(address) {
        if(address.indexOf('0x') !== 0) {
            return address;
        }
        return address.substring(0, 6) + '...' + address.substring(address.length - 6);
    }

    function toHTML(result) {
        return JSON.stringify(result, null, 4).split('\\n').join('\n').split('\n').join('<br/>').split(' ').join('&nbsp;').split("\\\"").join('\"').split('\"\"').join('\"').split('&space;').join(' ').split('<DEBUGGER_DECODED_INPUT_EMPTY_STRING>').join('');
    }

    function decodeMethodLabel(step, additionalData, short) {
        if (!step.parent && step.type !== 'CALL') {
            return step.type;
        }
        if (!step.method || step.method === '0x') {
            return step.type;
        }
        var version = short ? 'name' : 'label';
        var method;
        if (step.to && step.toCodeHash !== '0x') {
            var method = additionalData.wellknownAddresses[step.to]?.methods[step.method];
            if (!method) {
                method = additionalData.byBytecode[step.toCodeHash]?.methods[step.method];
            }
        }
        if (!method) {
            method = additionalData.methods[step.method];
        }
        return method ? method[version] : step.method;
    };

    function cleanDecodedOutput(output, additionalData) {
        if(!output) {
            return (typeof output).toLowerCase() === 'string' ? '<DEBUGGER_DECODED_INPUT_EMPTY_STRING>' : output;
        }
        if(output instanceof Array) {
            return output.map(it => cleanDecodedOutput(it, additionalData));
        }
        var asString = output.toString();
        if(asString.toLowerCase() === '[object object]') {
            return Object.values(output).map(it => cleanDecodedOutput(it, additionalData));
        }
        try {
            return decodeAddress(web3.utils.toChecksumAddress(asString), "", additionalData, false, true);
        } catch(e) {
            if(asString && asString.toLowerCase().indexOf("0x") === 0) {
                var method = "0x";
                var params = "0x";
                try {
                    method = asString.substring(0, 10);
                    params += asString.substring(10);
                } catch(ex) {}
                if(method !== '0x') {
                    var value = decodeMethodInput({
                        method,
                        params
                    }, additionalData, true);
                    if(value === params) {
                        return asString;
                    }
                    var result = {
                        "Decoded Method" : additionalData.methods[method].label,
                        "Decoded Input" : value
                    }
                    return result;
                }
            }
        }
        return asString;
    }

    function parseComplexTypeItem(output, complexType) {
        if(complexType.type.endsWith('[]')) {
            var cpT = {...complexType};
            cpT.type = cpT.type.substring(0, cpT.type.length - 2);
            return output.map(it => parseComplexTypeItem(it, cpT));
        } else if(complexType.complexTypes.length > 0) {
            return parseComplexType(output, complexType.complexTypes);
        }
        return output;
    }

    function parseComplexType(subject, complexTypes) {
        var result = {};
        for(var i in subject) {
            result[complexTypes[i].name || i] = parseComplexTypeItem(subject[i], complexTypes[i]);
        }
        return result;
    }

    function decodeMethodInput(step, additionalData, raw) {
        var method = additionalData.wellknownAddresses[step.to]?.methods[step.method];
        if (!method) {
            method = additionalData.byBytecode[step.toCodeHash]?.methods[step.method];
        }
        if (!method) {
            method = additionalData.methods[step.method];
        }
        if (!method || !method.inputTypes || method.inputTypes.length === 0) {
            return step.params;
        }
        try {
            var output = abi.decode(method.inputTypes, step.params);
            output = cleanDecodedOutput(output, additionalData);
            var result = {};
            for (var i in method.inputNames) {
                if(method.inputComplexTypes[i].length !== 0) {
                    output[i] = method.inputTypes[i].endsWith('[]') ? output[i].map(it => parseComplexType(it, method.inputComplexTypes[i])) : parseComplexType(output[i], method.inputComplexTypes[i]);
                }
                result[method.inputNames[i] || i] = output[i];
            }
            return raw ? result : toHTML(Object.keys(result).length === 1 && Object.keys(result)[0] === '0' ? result[0] : result);
        } catch (e) {
            return step.params;
        }
    };

    function decodeMethodOutput(step, additionalData) {
        if (!step.success) {
            if (!step.errorData || step.errorData === '0x') {
                return "revert";
            }
            var errorData = step.errorData.toString();
            if (errorData.indexOf('0x08c379a0') === 0) {
                errorData = "0x" + errorData.substring(11);
                errorData = abi.decode(["string"], errorData)[0];
            }
            if (errorData.indexOf('0x4e487b71') === 0) {
                errorData = "0x" + errorData.substring(11);
                errorData = parseInt(abi.decode(["uint256"], errorData)[0].toString());
                errorData = evmErrors[errorData] ? ("Panic(0x" + errorData.toString(16) + "): " + evmErrors[errorData]) : errorData;
            }
            return errorData;
        }
        var method = additionalData.wellknownAddresses[step.to]?.methods[step.method];
        if (!method) {
            method = additionalData.byBytecode[step.toCodeHash]?.methods[step.method];
        }
        if (!method) {
            method = additionalData.methods[step.method];
        }
        if (!method || !method.outputTypes || method.outputTypes.length === 0) {
            return step.result;
        }
        try {
            var output = abi.decode(method.outputTypes, step.result);
            output = cleanDecodedOutput(output, additionalData);
            var result = {};
            for (var i in method.outputNames) {
                if(method.outputComplexTypes[i].length !== 0) {
                    output[i] = method.outputTypes[i].endsWith('[]') ? output[i].map(it => parseComplexType(it, method.outputComplexTypes[i])) : parseComplexType(output[i], method.outputComplexTypes[i]);
                }
                result[method.outputNames[i] || i] = output[i];
            }
            return toHTML(Object.keys(result).length === 1 && Object.keys(result)[0] === '0' ? result[0] : result);
        } catch (e) {
            return step.result;
        }
    };

    function decodeAddress(address, codeHash, additionalData, shorten, html) {
        var addressLabel = html ? `<a&space;target='_blank'&space;href='${window.getEtherscanAddress(`address/${address}`)}'>${truncatedAddress(address)}</a>` : address;
        var name = additionalData.wellknownAddresses[address]?.name;
        if (!name) {
            var data = additionalData.byBytecode[codeHash];
            name = data?.name;
            if(name) {
                (additionalData.wellknownAddresses = additionalData.wellknownAddresses || {})[address] = data;
            }
        }
        var result = name ? (name + (shorten ? "" : ` (${address})`)) : address;
        if(!html) {
            return shorten ? truncatedAddress(result) : result;
        }
        return name ? (name + (shorten ? "" : ` (${addressLabel})`)) : addressLabel;
    }

    function decodeLog(inputLog, additionalData, short) {
        var log = additionalData.wellknownAddresses[inputLog.address]?.logs[inputLog.topics[0]];
        if (!log) {
            log = additionalData.byBytecode[inputLog.addressCodeHash]?.logs[inputLog.topics[0]];
        }
        if (!log) {
            log = additionalData.logs[inputLog.topics[0]];
        }
        return log ? short ? log.label.substring(0, log.label.indexOf('(')) : log.label : inputLog.topics[0] || "???";
    }

    function decodeLogInput(inputLog, additionalData, html) {
        var log = additionalData.wellknownAddresses[inputLog.address]?.logs[inputLog.topics[0]];
        if (!log) {
            log = additionalData.byBytecode[inputLog.addressCodeHash]?.logs[inputLog.topics[0]];
        }
        if (!log) {
            log = additionalData.logs[inputLog.topics[0]];
        }
        if(!log) {
            return "";
        }
        var result = {};
        if (log.topicTypes && log.topicTypes.length > 0) {
            try {
                var topics = {};
                for (var i in log.topicTypes) {
                    var output = inputLog.topics[(i = parseInt(i)) + 1];
                    try {
                        output = abi.decode([log.topicTypes[i]], output)[0].toString();
                        output = cleanDecodedOutput(output, additionalData);
                    } catch (e) {}
                    var name = log.topicNames[i];
                    topics[name || i] = output;
                }
                result.Topics = topics;
            } catch (e) {}
        }
        if (inputLog.data && inputLog.data !== '0x') {
            try {
                var data = {};
                var output = abi.decode(log.inputTypes, inputLog.data);
                output = cleanDecodedOutput(output, additionalData);
                for (var i in log.inputNames) {
                    var name = log.inputNames[i];
                    data[name || i] = output[i];
                }
                result.Data = data;
            } catch (e) {}
        }
        return html ? toHTML(result) : result;
    }

    return {
        decodeMethodLabel,
        decodeMethodInput,
        decodeMethodOutput,
        decodeAddress,
        decodeLog,
        decodeLogInput,
        truncatedAddress
    }
})();