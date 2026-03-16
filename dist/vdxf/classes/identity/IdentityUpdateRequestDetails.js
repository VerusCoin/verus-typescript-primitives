"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityUpdateRequestDetails = void 0;
const varuint_1 = require("../../../utils/varuint");
const bufferutils_1 = require("../../../utils/bufferutils");
const address_1 = require("../../../utils/address");
const createHash = require("create-hash");
const PartialIdentity_1 = require("../../../pbaas/PartialIdentity");
const PartialSignData_1 = require("../../../pbaas/PartialSignData");
const bn_js_1 = require("bn.js");
const pbaas_1 = require("../../../pbaas");
const pbaas_2 = require("../../../constants/pbaas");
const CompactAddressObject_1 = require("../CompactAddressObject");
const KvMap_1 = require("../../../utils/KvMap");
const VdxfUniValue_1 = require("../../../pbaas/VdxfUniValue");
const { BufferReader, BufferWriter } = bufferutils_1.default;
class IdentityUpdateRequestDetails {
    constructor(data) {
        this.flags = data && data.flags ? data.flags : new bn_js_1.BN("0", 10);
        if (data === null || data === void 0 ? void 0 : data.requestID) {
            if (!this.containsRequestID())
                this.toggleContainsRequestID();
            this.requestID = data.requestID;
        }
        if (data === null || data === void 0 ? void 0 : data.identity) {
            this.identity = data.identity;
        }
        if (data === null || data === void 0 ? void 0 : data.expiryHeight) {
            if (!this.expires())
                this.toggleExpires();
            this.expiryHeight = data.expiryHeight;
        }
        if (data === null || data === void 0 ? void 0 : data.systemID) {
            if (!this.containsSystem())
                this.toggleContainsSystem();
            this.systemID = data.systemID;
        }
        if (data === null || data === void 0 ? void 0 : data.txid) {
            if (!this.containsTxid())
                this.toggleContainsTxid();
            this.txid = data.txid;
        }
        if (data === null || data === void 0 ? void 0 : data.signDataMap) {
            if (!this.containsSignData())
                this.toggleContainsSignData();
            this.signDataMap = data.signDataMap;
        }
    }
    expires() {
        return !!(this.flags.and(IdentityUpdateRequestDetails.IDENTITY_UPDATE_REQUEST_EXPIRES).toNumber());
    }
    containsSignData() {
        return !!(this.flags.and(IdentityUpdateRequestDetails.IDENTITY_UPDATE_REQUEST_CONTAINS_SIGNDATA).toNumber());
    }
    containsSystem() {
        return !!(this.flags.and(IdentityUpdateRequestDetails.IDENTITY_UPDATE_REQUEST_CONTAINS_SYSTEM).toNumber());
    }
    containsRequestID() {
        return !!(this.flags.and(IdentityUpdateRequestDetails.IDENTITY_UPDATE_REQUEST_CONTAINS_REQUEST_ID).toNumber());
    }
    containsTxid() {
        return !!(this.flags.and(IdentityUpdateRequestDetails.IDENTITY_UPDATE_REQUEST_CONTAINS_TXID).toNumber());
    }
    toggleExpires() {
        this.flags = this.flags.xor(IdentityUpdateRequestDetails.IDENTITY_UPDATE_REQUEST_EXPIRES);
    }
    toggleContainsSignData() {
        this.flags = this.flags.xor(IdentityUpdateRequestDetails.IDENTITY_UPDATE_REQUEST_CONTAINS_SIGNDATA);
    }
    toggleContainsSystem() {
        this.flags = this.flags.xor(IdentityUpdateRequestDetails.IDENTITY_UPDATE_REQUEST_CONTAINS_SYSTEM);
    }
    toggleContainsRequestID() {
        this.flags = this.flags.xor(IdentityUpdateRequestDetails.IDENTITY_UPDATE_REQUEST_CONTAINS_REQUEST_ID);
    }
    toggleContainsTxid() {
        this.flags = this.flags.xor(IdentityUpdateRequestDetails.IDENTITY_UPDATE_REQUEST_CONTAINS_TXID);
    }
    toSha256() {
        return createHash("sha256").update(this.toBuffer()).digest();
    }
    getContentMultiMapKeys() {
        var _a;
        const keys = [];
        if ((_a = this.identity) === null || _a === void 0 ? void 0 : _a.containsContentMultiMap()) {
            keys.push(...this.identity.getContentMultiMapKeys());
        }
        if (this.containsSignData()) {
            for (const [key, psd] of this.signDataMap.entries()) {
                keys.push(key.toString());
                if (psd.data instanceof VdxfUniValue_1.FqnVdxfUniValue) {
                    for (const [key, value] of psd.data.entries()) {
                        keys.push(key.toString());
                    }
                }
            }
        }
        return keys;
    }
    getIdentityAddress(isTestnet = false) {
        if (this.identity.name === "VRSC" || this.identity.name === "VRSCTEST") {
            return (0, address_1.nameAndParentAddrToIAddr)(this.identity.name);
        }
        else if (this.identity.parent) {
            return this.identity.getIdentityAddress();
        }
        else if (isTestnet) {
            return (0, address_1.nameAndParentAddrToIAddr)(this.identity.name, (0, address_1.nameAndParentAddrToIAddr)("VRSCTEST"));
        }
        else {
            return (0, address_1.nameAndParentAddrToIAddr)(this.identity.name, (0, address_1.nameAndParentAddrToIAddr)("VRSC"));
        }
    }
    getByteLength() {
        let length = 0;
        length += varuint_1.default.encodingLength(this.flags.toNumber());
        if (this.containsRequestID()) {
            length += this.requestID.getByteLength();
        }
        length += this.identity.getByteLength();
        if (this.expires())
            length += varuint_1.default.encodingLength(this.expiryHeight.toNumber());
        if (this.containsSystem())
            length += this.systemID.getByteLength();
        if (this.containsTxid()) {
            length += pbaas_2.UINT_256_LENGTH;
        }
        if (this.containsSignData()) {
            length += varuint_1.default.encodingLength(this.signDataMap.size);
            for (const [key, value] of this.signDataMap.entries()) {
                length += key.getByteLength();
                length += value.getByteLength();
            }
        }
        return length;
    }
    toBuffer() {
        const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));
        writer.writeCompactSize(this.flags.toNumber());
        if (this.containsRequestID()) {
            writer.writeSlice(this.requestID.toBuffer());
        }
        writer.writeSlice(this.identity.toBuffer());
        if (this.expires())
            writer.writeCompactSize(this.expiryHeight.toNumber());
        if (this.containsSystem())
            writer.writeSlice(this.systemID.toBuffer());
        if (this.containsTxid()) {
            if (this.txid.length !== pbaas_2.UINT_256_LENGTH)
                throw new Error("invalid txid length");
            writer.writeSlice(this.txid);
        }
        if (this.containsSignData()) {
            writer.writeCompactSize(this.signDataMap.size);
            for (const [key, value] of this.signDataMap.entries()) {
                writer.writeSlice(key.toBuffer());
                writer.writeSlice(value.toBuffer());
            }
        }
        return writer.buffer;
    }
    fromBuffer(buffer, offset = 0, parseVdxfObjects = true, rootSystemName = 'VRSC') {
        const reader = new BufferReader(buffer, offset);
        this.flags = new bn_js_1.BN(reader.readCompactSize());
        if (this.containsRequestID()) {
            this.requestID = new CompactAddressObject_1.CompactIAddressObject({ type: CompactAddressObject_1.CompactIAddressObject.TYPE_I_ADDRESS, address: '', rootSystemName });
            reader.offset = this.requestID.fromBuffer(reader.buffer, reader.offset);
        }
        this.identity = new PartialIdentity_1.PartialIdentity();
        reader.offset = this.identity.fromBuffer(reader.buffer, reader.offset, parseVdxfObjects);
        if (this.expires()) {
            this.expiryHeight = new bn_js_1.BN(reader.readCompactSize());
        }
        if (this.containsSystem()) {
            this.systemID = new pbaas_1.IdentityID();
            reader.offset = this.systemID.fromBuffer(reader.buffer, reader.offset);
        }
        if (this.containsTxid()) {
            this.txid = reader.readSlice(pbaas_2.UINT_256_LENGTH);
        }
        if (this.containsSignData()) {
            this.signDataMap = new KvMap_1.KvMap();
            const size = reader.readCompactSize();
            for (let i = 0; i < size; i++) {
                const key = new CompactAddressObject_1.CompactIAddressObject();
                const value = new PartialSignData_1.PartialSignData();
                reader.offset = key.fromBuffer(reader.buffer, reader.offset);
                reader.offset = value.fromBuffer(reader.buffer, reader.offset);
                this.signDataMap.set(key, value);
            }
        }
        return reader.offset;
    }
    getTxidString() {
        return (Buffer.from(this.txid.toString('hex'), 'hex').reverse()).toString('hex');
    }
    setTxidFromString(txid) {
        this.txid = Buffer.from(txid, 'hex').reverse();
        if (!this.containsTxid())
            this.toggleContainsTxid();
    }
    toJson() {
        let signDataJson;
        if (this.signDataMap) {
            signDataJson = {};
            for (const [key, psd] of this.signDataMap.entries()) {
                signDataJson[key.toIAddress()] = psd.toJson();
            }
        }
        return {
            flags: this.flags ? this.flags.toString(10) : undefined,
            requestid: this.containsRequestID() ? this.requestID.toJson() : undefined,
            identity: this.identity ? this.identity.toJson() : undefined,
            expiryheight: this.expiryHeight ? this.expiryHeight.toString(10) : undefined,
            systemid: this.systemID ? this.systemID.toAddress() : undefined,
            txid: this.txid ? this.getTxidString() : undefined,
            signdatamap: signDataJson
        };
    }
    static fromJson(json) {
        let signDataMap;
        if (json.signdatamap) {
            signDataMap = new KvMap_1.KvMap();
            for (const key in json.signdatamap) {
                signDataMap.set(CompactAddressObject_1.CompactIAddressObject.fromAddress(key), PartialSignData_1.PartialSignData.fromJson(json.signdatamap[key]));
            }
        }
        return new IdentityUpdateRequestDetails({
            flags: json.flags ? new bn_js_1.BN(json.flags, 10) : undefined,
            requestID: json.requestid ? CompactAddressObject_1.CompactIAddressObject.fromCompactAddressObjectJson(json.requestid) : undefined,
            identity: json.identity ? PartialIdentity_1.PartialIdentity.fromJson(json.identity) : undefined,
            expiryHeight: json.expiryheight ? new bn_js_1.BN(json.expiryheight, 10) : undefined,
            systemID: json.systemid ? pbaas_1.IdentityID.fromAddress(json.systemid) : undefined,
            signDataMap,
            txid: json.txid ? Buffer.from(json.txid, 'hex').reverse() : undefined,
        });
    }
    toCLIJson() {
        if (!this.identity)
            throw new Error("No identity details to update");
        const idJson = this.identity.toJson();
        if (this.containsSignData()) {
            if (!idJson.contentmultimap)
                idJson.contentmultimap = {};
            for (const [key, psd] of this.signDataMap.entries()) {
                idJson.contentmultimap[key.toIAddress()] = {
                    "data": psd.toCLIJson()
                };
            }
        }
        return idJson;
    }
    static fromCLIJson(json, details) {
        let identity;
        let signDataMap;
        if (json.contentmultimap) {
            const cmm = Object.assign({}, json.contentmultimap);
            for (const key in cmm) {
                if (cmm[key]['data']) {
                    if (!signDataMap)
                        signDataMap = new KvMap_1.KvMap();
                    const psd = PartialSignData_1.PartialSignData.fromCLIJson(cmm[key]['data']);
                    if (key.includes("::")) {
                        signDataMap.set(CompactAddressObject_1.CompactIAddressObject.fromFQN(key), psd);
                    }
                    else {
                        signDataMap.set(CompactAddressObject_1.CompactIAddressObject.fromAddress(key), psd);
                    }
                    delete cmm[key];
                }
            }
            json = Object.assign(Object.assign({}, json), { contentmultimap: cmm });
        }
        identity = PartialIdentity_1.PartialIdentity.fromJson(json);
        return new IdentityUpdateRequestDetails({
            identity,
            signDataMap,
            systemID: (details === null || details === void 0 ? void 0 : details.systemid) ? pbaas_1.IdentityID.fromAddress(details.systemid) : undefined,
            requestID: (details === null || details === void 0 ? void 0 : details.requestid) ? CompactAddressObject_1.CompactIAddressObject.fromCompactAddressObjectJson(details.requestid) : undefined,
            expiryHeight: (details === null || details === void 0 ? void 0 : details.expiryheight) ? new bn_js_1.BN(details.expiryheight, 10) : undefined,
            txid: (details === null || details === void 0 ? void 0 : details.txid) ? Buffer.from(details.txid, 'hex').reverse() : undefined,
        });
    }
}
exports.IdentityUpdateRequestDetails = IdentityUpdateRequestDetails;
// stored in natural order, if displayed as text make sure to reverse!
IdentityUpdateRequestDetails.IDENTITY_UPDATE_REQUEST_VALID = new bn_js_1.BN(0, 10);
IdentityUpdateRequestDetails.IDENTITY_UPDATE_REQUEST_CONTAINS_SIGNDATA = new bn_js_1.BN(1, 10);
IdentityUpdateRequestDetails.IDENTITY_UPDATE_REQUEST_EXPIRES = new bn_js_1.BN(2, 10);
IdentityUpdateRequestDetails.IDENTITY_UPDATE_REQUEST_CONTAINS_REQUEST_ID = new bn_js_1.BN(4, 10);
IdentityUpdateRequestDetails.IDENTITY_UPDATE_REQUEST_CONTAINS_SYSTEM = new bn_js_1.BN(8, 10);
IdentityUpdateRequestDetails.IDENTITY_UPDATE_REQUEST_CONTAINS_TXID = new bn_js_1.BN(16, 10);
