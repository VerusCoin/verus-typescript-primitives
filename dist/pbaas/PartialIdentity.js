"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartialIdentity = void 0;
const Identity_1 = require("./Identity");
const ContentMultiMap_1 = require("./ContentMultiMap");
const VdxfUniValue_1 = require("./VdxfUniValue");
const CompactAddressObject_1 = require("../vdxf/classes/CompactAddressObject");
const bn_js_1 = require("bn.js");
const varint_1 = require("../utils/varint");
const bufferutils_1 = require("../utils/bufferutils");
const { BufferReader, BufferWriter } = bufferutils_1.default;
class PartialIdentity extends Identity_1.Identity {
    constructor(data) {
        var _a, _b;
        super(data);
        // Always use FqnContentMultiMap so FQN keys survive binary round-trips.
        // Also convert any plain VdxfUniValue inner values to FqnVdxfUniValue so
        // that the serialization format is consistent regardless of how the
        // PartialIdentity was constructed (fromJson vs direct constructor).
        if (!(this.contentMultimap instanceof ContentMultiMap_1.FqnContentMultiMap)) {
            const srcKvContent = (_b = (_a = this.contentMultimap) === null || _a === void 0 ? void 0 : _a.kvContent) !== null && _b !== void 0 ? _b : new ContentMultiMap_1.KvContent();
            const newKvContent = new ContentMultiMap_1.KvContent();
            for (const [key, values] of srcKvContent.entries()) {
                newKvContent.set(key, values.map(v => {
                    if (v instanceof VdxfUniValue_1.VdxfUniValue && !(v instanceof VdxfUniValue_1.FqnVdxfUniValue)) {
                        return VdxfUniValue_1.FqnVdxfUniValue.fromVdxfUniValue(v);
                    }
                    return v;
                }));
            }
            this.contentMultimap = new ContentMultiMap_1.FqnContentMultiMap({ kvContent: newKvContent });
        }
        this.contains = new bn_js_1.BN("0");
        if (data === null || data === void 0 ? void 0 : data.parent)
            this.toggleContainsParent();
        if (data === null || data === void 0 ? void 0 : data.systemId)
            this.toggleContainsSystemId();
        if (data === null || data === void 0 ? void 0 : data.contentMap)
            this.toggleContainsContentMap();
        if (data === null || data === void 0 ? void 0 : data.contentMultimap)
            this.toggleContainsContentMultiMap();
        if (data === null || data === void 0 ? void 0 : data.revocationAuthority)
            this.toggleContainsRevocation();
        if (data === null || data === void 0 ? void 0 : data.recoveryAuthority)
            this.toggleContainsRecovery();
        if ((data === null || data === void 0 ? void 0 : data.privateAddresses) && data.privateAddresses.length > 0)
            this.toggleContainsPrivateAddresses();
        if (data === null || data === void 0 ? void 0 : data.unlockAfter)
            this.toggleContainsUnlockAfter();
        if (data === null || data === void 0 ? void 0 : data.flags)
            this.toggleContainsFlags();
        if (data === null || data === void 0 ? void 0 : data.minSigs)
            this.toggleContainsMinSigs();
        if (data === null || data === void 0 ? void 0 : data.version)
            this.toggleContainsVersion();
        if ((data === null || data === void 0 ? void 0 : data.primaryAddresses) && data.primaryAddresses.length > 0)
            this.toggleContainsPrimaryAddresses();
    }
    containsFlags() {
        return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_FLAGS).toNumber());
    }
    containsVersion() {
        return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_VERSION).toNumber());
    }
    containsPrimaryAddresses() {
        return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_PRIMARY_ADDRS).toNumber());
    }
    containsMinSigs() {
        return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_MINSIGS).toNumber());
    }
    containsParent() {
        return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_PARENT).toNumber());
    }
    containsSystemId() {
        return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_SYSTEM_ID).toNumber());
    }
    containsContentMap() {
        return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_CONTENT_MAP).toNumber());
    }
    containsContentMultiMap() {
        return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_CONTENT_MULTIMAP).toNumber());
    }
    containsRevocation() {
        return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_REVOCATION).toNumber());
    }
    containsRecovery() {
        return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_RECOVERY).toNumber());
    }
    containsPrivateAddresses() {
        return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_PRIV_ADDRS).toNumber());
    }
    containsUnlockAfter() {
        return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_UNLOCK_AFTER).toNumber());
    }
    createContentMultiMap() {
        return new ContentMultiMap_1.FqnContentMultiMap();
    }
    clearContentMultiMap() {
        this.contentMultimap = new ContentMultiMap_1.FqnContentMultiMap({ kvContent: new ContentMultiMap_1.KvContent() });
    }
    toggleContainsParent() {
        this.contains = this.contains.xor(PartialIdentity.PARTIAL_ID_CONTAINS_PARENT);
    }
    toggleContainsSystemId() {
        this.contains = this.contains.xor(PartialIdentity.PARTIAL_ID_CONTAINS_SYSTEM_ID);
    }
    toggleContainsContentMap() {
        this.contains = this.contains.xor(PartialIdentity.PARTIAL_ID_CONTAINS_CONTENT_MAP);
    }
    toggleContainsContentMultiMap() {
        this.contains = this.contains.xor(PartialIdentity.PARTIAL_ID_CONTAINS_CONTENT_MULTIMAP);
    }
    toggleContainsRevocation() {
        this.contains = this.contains.xor(PartialIdentity.PARTIAL_ID_CONTAINS_REVOCATION);
    }
    toggleContainsRecovery() {
        this.contains = this.contains.xor(PartialIdentity.PARTIAL_ID_CONTAINS_RECOVERY);
    }
    toggleContainsPrivateAddresses() {
        this.contains = this.contains.xor(PartialIdentity.PARTIAL_ID_CONTAINS_PRIV_ADDRS);
    }
    toggleContainsUnlockAfter() {
        this.contains = this.contains.xor(PartialIdentity.PARTIAL_ID_CONTAINS_UNLOCK_AFTER);
    }
    toggleContainsFlags() {
        this.contains = this.contains.xor(PartialIdentity.PARTIAL_ID_CONTAINS_FLAGS);
    }
    toggleContainsVersion() {
        this.contains = this.contains.xor(PartialIdentity.PARTIAL_ID_CONTAINS_VERSION);
    }
    toggleContainsMinSigs() {
        this.contains = this.contains.xor(PartialIdentity.PARTIAL_ID_CONTAINS_MINSIGS);
    }
    toggleContainsPrimaryAddresses() {
        this.contains = this.contains.xor(PartialIdentity.PARTIAL_ID_CONTAINS_PRIMARY_ADDRS);
    }
    enableContainsFlags() {
        this.contains = this.contains.or(PartialIdentity.PARTIAL_ID_CONTAINS_FLAGS);
    }
    enableContainsUnlockAfter() {
        this.contains = this.contains.or(PartialIdentity.PARTIAL_ID_CONTAINS_UNLOCK_AFTER);
    }
    getPartialIdentityByteLength() {
        let length = 0;
        length += varint_1.default.encodingLength(this.contains);
        length += super.getByteLength();
        return length;
    }
    getByteLength() {
        return this.getPartialIdentityByteLength();
    }
    fromBuffer(buffer, offset = 0, parseVdxfObjects = false) {
        const reader = new BufferReader(buffer, offset);
        this.contains = reader.readVarInt();
        reader.offset = super.fromBuffer(reader.buffer, reader.offset, parseVdxfObjects);
        return reader.offset;
    }
    toBuffer() {
        const writer = new BufferWriter(Buffer.alloc(this.getPartialIdentityByteLength()));
        writer.writeVarInt(this.contains);
        writer.writeSlice(super.toBuffer());
        return writer.buffer;
    }
    static fromJson(json) {
        const instance = Identity_1.Identity.internalFromJson(json, PartialIdentity);
        // Replace contentMultimap with FqnContentMultiMap so inner values are
        // FqnVdxfUniValue instances that preserve FQN keys through binary round-trips.
        if (json.contentmultimap) {
            instance.contentMultimap = ContentMultiMap_1.FqnContentMultiMap.fromJson(json.contentmultimap);
        }
        return instance;
    }
    lock(unlockTime) {
        this.enableContainsFlags();
        this.enableContainsUnlockAfter();
        return super.lock(unlockTime);
    }
    unlock(height = new bn_js_1.BN(0), txExpiryHeight = new bn_js_1.BN(0)) {
        this.enableContainsFlags();
        this.enableContainsUnlockAfter();
        return super.unlock(height, txExpiryHeight);
    }
    revoke() {
        this.enableContainsFlags();
        this.enableContainsUnlockAfter();
        return super.revoke();
    }
    unrevoke() {
        this.enableContainsFlags();
        return super.unrevoke();
    }
    /**
     * Returns an array of every key used in the contentMultimap, both top-level and nested,
     * as strings. Keys that are hex-encoded CompactIAddressObject buffers are resolved via
     * toString() (which returns the iaddress or FQN string). Empty inner keys are skipped.
     */
    getContentMultiMapKeys() {
        const keys = [];
        for (const [key, values] of this.contentMultimap.kvContent.entries()) {
            keys.push(key.toString());
            for (const univalue of values) {
                if (univalue instanceof VdxfUniValue_1.FqnVdxfUniValue) {
                    for (const [key, value] of univalue.entries()) {
                        keys.push(key.toString());
                    }
                }
            }
        }
        return keys;
    }
    /**
     * Returns a partial identity with a plain ContentMultiMap equivalent of this PartialIdentity's
     * contentMultimap. All outer keys are resolved to CompactIAddress objects as
     * i addresses (TYPE_I_ADDRESS, 20-byte hash on-wire format),
     * and all inner FqnVdxfUniValue objects are converted to plain VdxfUniValue with any FQN
     * keys resolved to their iaddress equivalents.
     *
     * Use this when the resulting ContentMultiMap must be daemon-compatible (e.g. for
     * comparing daemon output to identities made here).
     */
    withResolvedContentMultiMap() {
        const clone = new PartialIdentity();
        clone.fromBuffer(this.toBuffer());
        clone.contentMultimap = this.toContentMultiMap();
        return clone;
    }
    toContentMultiMap() {
        const newKvContent = new ContentMultiMap_1.KvContent();
        for (const [key, values] of this.contentMultimap.kvContent.entries()) {
            const iAddrKey = CompactAddressObject_1.CompactIAddressObject.fromAddress(key.toIAddress());
            const newValues = values.map(v => {
                if (v instanceof VdxfUniValue_1.FqnVdxfUniValue) {
                    const resolvedValues = v.values.map(inner => {
                        const innerKey = Object.keys(inner)[0];
                        if (innerKey === '')
                            return inner;
                        const compactAddr = new CompactAddressObject_1.CompactIAddressObject();
                        compactAddr.fromBuffer(Buffer.from(innerKey, 'hex'), 0);
                        return { [compactAddr.toIAddress()]: inner[innerKey] };
                    });
                    return new VdxfUniValue_1.VdxfUniValue({ values: resolvedValues, version: v.version });
                }
                return v;
            });
            newKvContent.set(iAddrKey, newValues);
        }
        return new ContentMultiMap_1.ContentMultiMap({ kvContent: newKvContent });
    }
}
exports.PartialIdentity = PartialIdentity;
PartialIdentity.PARTIAL_ID_CONTAINS_PARENT = new bn_js_1.BN("1", 10);
PartialIdentity.PARTIAL_ID_CONTAINS_CONTENT_MULTIMAP = new bn_js_1.BN("2", 10);
PartialIdentity.PARTIAL_ID_CONTAINS_PRIMARY_ADDRS = new bn_js_1.BN("4", 10);
PartialIdentity.PARTIAL_ID_CONTAINS_REVOCATION = new bn_js_1.BN("8", 10);
PartialIdentity.PARTIAL_ID_CONTAINS_RECOVERY = new bn_js_1.BN("16", 10);
PartialIdentity.PARTIAL_ID_CONTAINS_UNLOCK_AFTER = new bn_js_1.BN("32", 10);
PartialIdentity.PARTIAL_ID_CONTAINS_SYSTEM_ID = new bn_js_1.BN("64", 10);
PartialIdentity.PARTIAL_ID_CONTAINS_PRIV_ADDRS = new bn_js_1.BN("128", 10);
PartialIdentity.PARTIAL_ID_CONTAINS_CONTENT_MAP = new bn_js_1.BN("256", 10);
PartialIdentity.PARTIAL_ID_CONTAINS_MINSIGS = new bn_js_1.BN("512", 10);
PartialIdentity.PARTIAL_ID_CONTAINS_FLAGS = new bn_js_1.BN("1024", 10);
PartialIdentity.PARTIAL_ID_CONTAINS_VERSION = new bn_js_1.BN("2048", 10);
