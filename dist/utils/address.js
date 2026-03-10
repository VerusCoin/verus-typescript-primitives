"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeEthDestination = exports.decodeDestination = exports.toXAddress = exports.toIAddress = exports.fqnToParentAddress = exports.fqnToParentFqn = exports.fqnToAddress = exports.nameAndParentAddrToIAddr = exports.nameAndParentAddrToAddr = exports.toBase58Check = exports.fromBase58Check = void 0;
exports.getDataKey = getDataKey;
const pbaas_1 = require("../constants/pbaas");
const vdxf_1 = require("../constants/vdxf");
const hash_1 = require("./hash");
const tolower_1 = require("./tolower");
const bs58check = require("bs58check");
const fromBase58Check = (address) => {
    var payload = bs58check.decode(address);
    // TODO: 4.0.0, move to "toOutputScript"
    if (payload.length < 21)
        throw new TypeError(address + " is too short");
    if (payload.length > 22)
        throw new TypeError(address + " is too long");
    var multibyte = payload.length === 22;
    var offset = multibyte ? 2 : 1;
    var version = multibyte ? payload.readUInt16BE(0) : payload[0];
    var hash = payload.slice(offset);
    // Turn hash to buffer with Buffer.from due to strange bug where certain JS engines
    // don't keep hash a buffer
    return { version: version, hash: Buffer.from(hash) };
};
exports.fromBase58Check = fromBase58Check;
const toBase58Check = (hash, version) => {
    // Zcash adds an extra prefix resulting in a bigger (22 bytes) payload. We identify them Zcash by checking if the
    // version is multibyte (2 bytes instead of 1)
    var multibyte = version > 0xff;
    var size = multibyte ? 22 : 21;
    var offset = multibyte ? 2 : 1;
    var payload = Buffer.allocUnsafe(size);
    multibyte
        ? payload.writeUInt16BE(version, 0)
        : payload.writeUInt8(version, 0);
    hash.copy(payload, offset);
    return bs58check.encode(payload);
};
exports.toBase58Check = toBase58Check;
const nameAndParentAddrToAddr = (name, parentIAddr, version = vdxf_1.I_ADDR_VERSION) => {
    let idHash;
    const nameBuffer = Buffer.from((0, tolower_1.toLowerCaseCLocale)(name), "utf8");
    if (parentIAddr == null) {
        idHash = (0, hash_1.hash)(nameBuffer);
    }
    else {
        idHash = (0, hash_1.hash)(nameBuffer);
        idHash = (0, hash_1.hash)((0, exports.fromBase58Check)(parentIAddr).hash, idHash);
    }
    return (0, exports.toBase58Check)((0, hash_1.hash160)(idHash), version);
};
exports.nameAndParentAddrToAddr = nameAndParentAddrToAddr;
const nameAndParentAddrToIAddr = (name, parentIAddr) => {
    return (0, exports.nameAndParentAddrToAddr)(name, parentIAddr, vdxf_1.I_ADDR_VERSION);
};
exports.nameAndParentAddrToIAddr = nameAndParentAddrToIAddr;
const fqnToAddress = (fullyqualifiedname, rootSystemName = "", version = vdxf_1.I_ADDR_VERSION) => {
    const splitFqnAt = fullyqualifiedname.split("@").filter(x => x.length > 0);
    if (splitFqnAt.length !== 1)
        throw new Error("Invalid name");
    const cleanFqn = splitFqnAt[0];
    const splitFqnDot = cleanFqn.split('.');
    if ((0, tolower_1.toLowerCaseCLocale)(splitFqnDot[splitFqnDot.length - 1]) !== (0, tolower_1.toLowerCaseCLocale)(rootSystemName) &&
        splitFqnDot[splitFqnDot.length - 1] !== "") {
        splitFqnDot.push(rootSystemName);
    }
    const name = splitFqnDot.shift();
    let Parent;
    for (let i = splitFqnDot.length - 1; i >= 0; i--) {
        let idHash;
        const parentName = Buffer.from((0, tolower_1.toLowerCaseCLocale)(splitFqnDot[i]), "utf8");
        if (parentName.length > 0) {
            if (Parent == null) {
                idHash = (0, hash_1.hash)(parentName);
            }
            else {
                idHash = (0, hash_1.hash)(parentName);
                idHash = (0, hash_1.hash)(Parent, idHash);
            }
            Parent = (0, hash_1.hash160)(idHash);
        }
    }
    let idHash;
    const nameBuffer = Buffer.from((0, tolower_1.toLowerCaseCLocale)(name), "utf8");
    if (Parent == null) {
        idHash = (0, hash_1.hash)(nameBuffer);
    }
    else {
        idHash = (0, hash_1.hash)(nameBuffer);
        idHash = (0, hash_1.hash)(Parent, idHash);
    }
    return (0, exports.toBase58Check)((0, hash_1.hash160)(idHash), version);
};
exports.fqnToAddress = fqnToAddress;
const fqnToParentFqn = (fullyqualifiedname, rootSystemName = "") => {
    const splitFqnAt = fullyqualifiedname.split("@").filter(x => x.length > 0);
    if (splitFqnAt.length !== 1)
        throw new Error("Invalid name");
    const splitFqnDot = splitFqnAt[0].split('.');
    if ((0, tolower_1.toLowerCaseCLocale)(splitFqnDot[splitFqnDot.length - 1]) !== (0, tolower_1.toLowerCaseCLocale)(rootSystemName) &&
        splitFqnDot[splitFqnDot.length - 1] !== "") {
        splitFqnDot.push(rootSystemName);
    }
    splitFqnDot.shift();
    const parentSegments = splitFqnDot.filter(s => s.length > 0);
    if (parentSegments.length === 0)
        return null;
    return parentSegments.join(".");
};
exports.fqnToParentFqn = fqnToParentFqn;
const fqnToParentAddress = (fullyqualifiedname, rootSystemName = "") => {
    const parentFqn = (0, exports.fqnToParentFqn)(fullyqualifiedname, rootSystemName);
    return parentFqn ? (0, exports.fqnToAddress)(parentFqn + ".", "") : null;
};
exports.fqnToParentAddress = fqnToParentAddress;
const toIAddress = (fullyqualifiedname, rootSystemName = "") => {
    return (0, exports.fqnToAddress)(fullyqualifiedname, rootSystemName, vdxf_1.I_ADDR_VERSION);
};
exports.toIAddress = toIAddress;
const toXAddress = (fullyqualifiedname, rootSystemName = "") => {
    return (0, exports.fqnToAddress)(fullyqualifiedname, rootSystemName, vdxf_1.X_ADDR_VERSION);
};
exports.toXAddress = toXAddress;
function trimSpaces(name, removeDuals) {
    // Unicode "dual spaces" — visually space-like but potentially problematic
    const dualSpaces = [
        "\u0020", "\u00A0", "\u1680", "\u2000", "\u2001", "\u2002", "\u2003", "\u2004",
        "\u2005", "\u2006", "\u2007", "\u2008", "\u2009", "\u200A", "\u200C", "\u200D",
        "\u202F", "\u205F", "\u3000"
    ];
    const isDual = (char) => dualSpaces.includes(char);
    const chars = [...name];
    const toRemove = [];
    const allDuals = [];
    for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        if (isDual(char)) {
            const wasLastDual = allDuals.length && allDuals[allDuals.length - 1] === i - 1;
            const shouldRemove = removeDuals ||
                i === allDuals.length ||
                i === chars.length - 1 ||
                (removeDuals && wasLastDual);
            if (shouldRemove) {
                toRemove.push(i);
            }
            allDuals.push(i);
            // Edge case: chain of duals at the end
            if (i > 0 &&
                i === chars.length - 1 &&
                wasLastDual) {
                let toRemoveIdx = toRemove.length - 1;
                let nextDual = 0;
                for (let j = allDuals.length - 1; j >= 0; j--) {
                    const idx = allDuals[j];
                    if (nextDual && idx !== nextDual - 1)
                        break;
                    if (toRemoveIdx < 0 || toRemove[toRemoveIdx] !== idx) {
                        toRemove.splice(++toRemoveIdx, 0, idx);
                    }
                    toRemoveIdx--;
                    nextDual = idx;
                }
            }
        }
    }
    // Remove characters from end to start
    for (let i = toRemove.length - 1; i >= 0; i--) {
        chars.splice(toRemove[i], 1);
    }
    return chars.join("");
}
function parseSubNames(name, addVerus, removeDuals = false, verusChainName = pbaas_1.DEFAULT_VERUS_CHAINNAME) {
    const parts = name.split("@");
    if (parts.length === 0 ||
        parts.length > 2 ||
        (parts.length > 1 && trimSpaces(parts[1], removeDuals) !== parts[1])) {
        return { names: [], chain: "" };
    }
    let chain = "";
    let explicitChain = false;
    if (parts.length === 2 && parts[1] !== "") {
        chain = parts[1];
        explicitChain = true;
    }
    let retNames = parts[0].split(".");
    // If the name ends with a dot, it's an indicator to not add Verus
    if (retNames[retNames.length - 1] === "") {
        addVerus = false;
        retNames.pop();
    }
    const verusChainNameLc = (0, tolower_1.toLowerCaseCLocale)(verusChainName);
    if (addVerus) {
        if (explicitChain) {
            const chainParts = chain.split(".");
            const lastChainPart = (0, tolower_1.toLowerCaseCLocale)(chainParts[chainParts.length - 1]);
            if (lastChainPart !== "" && lastChainPart !== verusChainNameLc) {
                chainParts.push(verusChainNameLc);
                chain = chainParts.join(".");
            }
            else if (lastChainPart === "") {
                chainParts.pop();
                chain = chainParts.join(".");
            }
        }
        const lastName = (0, tolower_1.toLowerCaseCLocale)(retNames[retNames.length - 1]);
        if (lastName !== "" && lastName !== verusChainNameLc) {
            retNames.push(verusChainNameLc);
        }
        else if (lastName === "") {
            retNames.pop();
        }
    }
    for (let i = 0; i < retNames.length; i++) {
        if (retNames[i].length > pbaas_1.KOMODO_ASSETCHAIN_MAXLEN - 1) {
            retNames[i] = retNames[i].slice(0, pbaas_1.KOMODO_ASSETCHAIN_MAXLEN - 1);
        }
        if (retNames[i].length === 0 ||
            retNames[i] !== trimSpaces(retNames[i], removeDuals)) {
            return { names: [], chain: "" };
        }
    }
    return { names: retNames, chain };
}
function cleanName(name, parent, removeDuals = false, verusChainName = pbaas_1.DEFAULT_VERUS_CHAINNAME) {
    const { names: subNames } = parseSubNames(name, false, removeDuals, verusChainName);
    if (subNames.length === 0) {
        throw new Error("No subnames found in name");
    }
    let newParent = parent ? (0, exports.fromBase58Check)(parent).hash : null;
    // Remove "verus" suffix if already handled and parent is not null
    const last = subNames[subNames.length - 1];
    if (newParent &&
        subNames.length > 1 &&
        (0, tolower_1.toLowerCaseCLocale)(last) === (0, tolower_1.toLowerCaseCLocale)(verusChainName)) {
        subNames.pop();
    }
    // Build up the parent hash from right to left
    for (let i = subNames.length - 1; i > 0; i--) {
        const parentNameStr = Buffer.from((0, tolower_1.toLowerCaseCLocale)(subNames[i]), 'utf8');
        let idHash;
        if (!newParent) {
            idHash = (0, hash_1.hash)(parentNameStr); // Hash from a string
        }
        else {
            const combined = (0, hash_1.hash)(parentNameStr); // First hash
            idHash = (0, hash_1.hash)(newParent, combined); // Combine with parent
        }
        newParent = (0, hash_1.hash160)(idHash); // Get new parent as uint160
    }
    return { name: subNames[0], parent: newParent ? (0, exports.toBase58Check)(newParent, vdxf_1.I_ADDR_VERSION) : null };
}
function getID(name, parent, verusChainName = pbaas_1.DEFAULT_VERUS_CHAINNAME, version = vdxf_1.I_ADDR_VERSION) {
    const _cleanName = name === "::" ? { name, parent } : cleanName(name, parent, false, verusChainName);
    if (_cleanName.name.length == 0)
        return pbaas_1.NULL_I_ADDR;
    return (0, exports.nameAndParentAddrToAddr)(_cleanName.name, _cleanName.parent, version);
}
function getDataKey(keyName, nameSpaceID, verusChainId = pbaas_1.DEFAULT_VERUS_CHAINID, version = vdxf_1.I_ADDR_VERSION) {
    let keyCopy = keyName;
    const addressParts = keyName.split(":");
    // If the first part of the address is a namespace, it is followed by a double colon
    // Namespace specifiers have no implicit root
    if (addressParts.length > 2 && addressParts[1] === "") {
        nameSpaceID = (0, exports.toIAddress)(addressParts[0]);
        keyName = addressParts.join(":");
        for (let i = 2; i < addressParts.length; i++) {
            keyCopy = i === 2 ? addressParts[i] : keyCopy + ":" + addressParts[i];
        }
    }
    if (!nameSpaceID) {
        nameSpaceID = verusChainId;
    }
    const parent = getID("::", nameSpaceID, undefined, version);
    return { id: getID(keyCopy, parent, undefined, version), namespace: nameSpaceID };
}
const decodeDestination = (destination) => {
    try {
        const data = (0, exports.fromBase58Check)(destination);
        return data.hash;
    }
    catch (e) {
        throw new Error("Invalid destination address: " + destination);
    }
};
exports.decodeDestination = decodeDestination;
const decodeEthDestination = (destination) => {
    if (destination.startsWith("0x")) {
        destination = destination.slice(2);
    }
    if (destination.length !== 40) {
        throw new Error("Invalid Ethereum address: " + destination);
    }
    return Buffer.from(destination, "hex");
};
exports.decodeEthDestination = decodeEthDestination;
