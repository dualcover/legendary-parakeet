var IndexController = function(view) {
    var context = this;
    context.view = view;

    context.onDump = async function onDump(dump) {
        delete window.chainId;
        window.chainId = dump?.chainId;
        view.setStateVar('transactions', []);
        view.setStateVar('selectedTransaction', null);
        var originalTransactions = dump.transactions.map(it => it);
        var transactions = JSON.parse(JSON.stringify(originalTransactions));
        for (var i in transactions) {
            var tx = {...transactions[i], i };
            var originalTransaction = {...originalTransactions[i], i };
            transactions[i] = context.attachParentAndTransaction(tx, tx, originalTransaction);
        }
        var additionalData = await context.prepareAdditionalData(dump.compiledContracts, dump.wellknownAddresses);
        if(!dump.transactionLabels || Object.values(dump.transactionLabels).length === 0 || !Object.values(dump.transactionLabels)[0]) {
            try {
                dump.transactionLabels = {
                    "Transactions - " : transactions[0].transactionHash
                }
            } catch(e) {
                delete dump.transactionLabels;
            }
        }
        dump.transactionLabels && (additionalData.transactionLists = prepareTransactionLists(dump.transactionLabels, transactions));
        view.setStateVar('additionalData', additionalData);
        view.setStateVar('transactions', transactions);
    };

    function prepareTransactionLists(transactionLabels, transactions) {
        var transactionLists = {};
        var keys = Object.keys(transactionLabels);
        for(var i = 1; i < keys.length; i++) {
            var key = keys[i - 1];
            transactionLists[key.endsWith(' - ') ? key.split(' - ')[0] : key] = transactions.slice(transactions.indexOf(transactions.filter(it => it.transactionHash === transactionLabels[key])[0]), transactions.indexOf(transactions.filter(it => it.transactionHash === transactionLabels[keys[i]])[0]));
        }
        var key = keys[keys.length - 1];
        transactionLists[key.endsWith(' - ') ? key.split(' - ')[0] : key] = transactions.slice(transactions.indexOf(transactions.filter(it => it.transactionHash === transactionLabels[key])[0]));
        return transactionLists;
    }

    context.attachParentAndTransaction = function attachParentAndTransaction(step, transaction, originalTransaction, parent) {
        parent && (step.parent = parent);
        parent && (step.transaction = transaction);
        step.originalTransaction = originalTransaction;
        if (step.steps && step.steps.length > 0) {
            for (var i in step.steps) {
                step.steps[i] = context.attachParentAndTransaction(step.steps[i], transaction, originalTransaction, step);
            }
        }
        if (step.logs && step.logs.length > 0) {
            for (var i in step.logs) {
                step.logs[i] = context.attachParentAndTransaction(step.logs[i], transaction, originalTransaction, step);
            }
        }
        return step;
    }

    context.prepareAdditionalData = async function prepareAdditionalData(compiledContracts, wellknownAddresses) {
        var remoteAdditionalData = {};
        try {
            remoteAdditionalData = JSON.parse(await (await fetch(window.context.remoteAdditionalDataLink)).text());
        } catch(e) {}
        var byBytecode = {};
        var methods = {};
        var logs = {};
        for (var entry of Object.entries({
                ...(remoteAdditionalData.wellKnownContracts || {}),
                ...(compiledContracts || {})
            })) {
            var key = entry[0];
            var name = entry[1].name;
            if(!name) {
                continue;
            }
            var abi = entry[1].abi;
            if(!abi) {
                continue;
            }
            var localMethods = {};
            var localLogs = {};
            abi.filter(it => it.type === 'function').forEach(it => localMethods = context.fillMethods(it, localMethods));
            abi.filter(it => it.type === 'event').forEach(it => localLogs = context.fillLogs(it, localLogs));
            byBytecode[key] = {
                name,
                methods: localMethods,
                logs: localLogs
            };
            methods = {...localMethods, ...methods };
            logs = {...localLogs, ...logs };
        }
        var wellknownAddressesInput = {...(remoteAdditionalData.wellknownAddresses || {}), ...(wellknownAddresses || {}) };
        for (var key of Object.keys(wellknownAddressesInput)) {
            var abi = wellknownAddressesInput[key].abi;
            wellknownAddressesInput[key] = {
                name: wellknownAddressesInput[key].name || wellknownAddressesInput[key]
            };
            abi && (wellknownAddressesInput[key].abi = abi);
        };

        var wellknownAddresses = {};
        Object.entries(wellknownAddressesInput).filter(it => !it[1].abi).forEach(it => wellknownAddresses[it[0]] = {
            ...it[1],
            methods : {},
            logs : {}
        });

        for (var entry of Object.entries(wellknownAddressesInput).filter(it => it[1].abi)) {
            var key = entry[0];
            var name = entry[1].name;
            var abi = entry[1].abi;
            var localMethods = {};
            var localLogs = {};
            abi.filter(it => it.type === 'function').forEach(it => localMethods = context.fillMethods(it, localMethods));
            abi.filter(it => it.type === 'event').forEach(it => localLogs = context.fillLogs(it, localLogs));
            wellknownAddresses[key] = {
                name,
                methods: localMethods,
                logs: localLogs
            };
            methods = {...localMethods, ...methods };
            logs = {...localLogs, ...logs };
        }

        return { byBytecode, wellknownAddresses, methods, logs };
    };

    function parseParam(param) {
        var lab = (param.internalType || param.type).split('struct ').join('').split('.');
        lab = lab[lab.length - 1].trim();
        param.indexed && (lab += ' indexed');
        var name = param.name;
        param.name && (lab += (' ' + param.name));
        var type = param.type;
        var typeForKey = type;
        var complexTypes = [];
        if (param.components) {
            type = 'tuple(';
            typeForKey = "("
            for (var i in param.components) {
                var complexType = parseParam(param.components[i = parseInt(i)]);
                complexTypes.push(complexType);
                type += complexType.type;
                typeForKey += complexType.typeForKey;
                i < (param.components.length - 1) && (type += ',');
                i < (param.components.length - 1) && (typeForKey += ',');
            }
            type += ')';
            typeForKey += ')';
            param.type.indexOf('[]') !== -1 && (type += '[]');
            param.type.indexOf('[]') !== -1 && (typeForKey += '[]');
        }
        return { type, name, complexTypes, lab, typeForKey };
    };

    context.fillMethods = function fillMethods(method, methods) {
        var inputTypes = [];
        var inputNames = [];
        var inputComplexTypes = [];
        var outputTypes = [];
        var outputNames = [];
        var outputComplexTypes = [];
        var label = method.name + "(";
        var key = method.name + "(";
        if (method.inputs && method.inputs.length > 0) {
            for (var i in method.inputs) {
                var { type, name, complexTypes, lab, typeForKey } = parseParam(method.inputs[i = parseInt(i)]);
                inputTypes.push(type);
                inputNames.push(name);
                inputComplexTypes.push(complexTypes);
                label += lab;
                i < (method.inputs.length - 1) && (label += ', ');
                key += typeForKey;
                i < (method.inputs.length - 1) && (key += ',');
            }
        }

        label += ")";

        if (method.outputs && method.outputs.length > 0) {
            label += " returns (";
            for (var i in method.outputs) {
                var { type, name, complexTypes, lab } = parseParam(method.outputs[i = parseInt(i)]);
                outputTypes.push(type);
                outputNames.push(name);
                outputComplexTypes.push(complexTypes);
                label += lab;
                i < (method.outputs.length - 1) && (label += ', ');
            }
            label += ")";
        }

        key = method.signature ? method.signature : web3util.utils.sha3(key + ")").substring(0, 10);

        methods[key] = {
            key,
            label,
            name: method.name,
            inputTypes,
            inputNames,
            inputComplexTypes,
            outputTypes,
            outputNames,
            outputComplexTypes
        };
        return methods;
    };

    context.fillLogs = function fillLogs(log, logs) {
        var key = log.name + "(";
        var label = log.name + "(";
        var inputTypes = [];
        var inputNames = [];
        var topicTypes = [];
        var topicNames = [];
        if (log.inputs && log.inputs.length > 0) {
            for (var i in log.inputs) {
                var input = log.inputs[i = parseInt(i)];
                var { type, name, lab } = parseParam(input);
                !input.indexed && inputTypes.push(type);
                !input.indexed && inputNames.push(name);
                input.indexed && topicTypes.push((type.indexOf("bytes") === -1 && type.indexOf("string") === -1) ? type : "");
                input.indexed && topicNames.push(name);
                label += lab;
                i < (log.inputs.length - 1) && (label += ', ');
                key += type;
                i < (log.inputs.length - 1) && (key += ',');
            }
        }
        key = window.web3util.utils.sha3(key + ")");
        logs[key] = {
            key,
            label: label + ")",
            name: log.name,
            inputTypes,
            inputNames,
            topicTypes,
            topicNames
        };
        return logs;
    };
};