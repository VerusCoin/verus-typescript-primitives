"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Identity = exports.IDENTITY_MAX_NAME_LEN = exports.IDENTITY_MAX_UNLOCK_DELAY = exports.IDENTITY_FLAG_TOKENIZED_CONTROL = exports.IDENTITY_FLAG_LOCKED = exports.IDENTITY_FLAG_ACTIVECURRENCY = exports.IDENTITY_FLAG_REVOKED = exports.IDENITTY_VERSION_INVALID = exports.IDENTITY_VERSION_PBAAS = exports.IDENTITY_VERSION_VAULT = void 0;
const varuint_1 = require("../utils/varuint");
const bufferutils_1 = require("../utils/bufferutils");
const Principal_1 = require("./Principal");
const address_1 = require("../utils/address");
const vdxf_1 = require("../constants/vdxf");
const bn_js_1 = require("bn.js");
const IdentityID_1 = require("./IdentityID");
const SaplingPaymentAddress_1 = require("./SaplingPaymentAddress");
const ContentMultiMap_1 = require("./ContentMultiMap");
const KeyID_1 = require("./KeyID");
exports.IDENTITY_VERSION_VAULT = new bn_js_1.BN(2, 10);
exports.IDENTITY_VERSION_PBAAS = new bn_js_1.BN(3, 10);
exports.IDENITTY_VERSION_INVALID = new bn_js_1.BN(0, 10);
exports.IDENTITY_FLAG_REVOKED = new bn_js_1.BN("8000", 16); // set when this identity is revoked
exports.IDENTITY_FLAG_ACTIVECURRENCY = new bn_js_1.BN("1", 16); // flag that is set when this ID is being used as an active currency name
exports.IDENTITY_FLAG_LOCKED = new bn_js_1.BN("2", 16); // set when this identity is locked
exports.IDENTITY_FLAG_TOKENIZED_CONTROL = new bn_js_1.BN("4", 16); // set when revocation/recovery over this identity can be performed by anyone who controls its token
exports.IDENTITY_MAX_UNLOCK_DELAY = new bn_js_1.BN(60).mul(new bn_js_1.BN(24)).mul(new bn_js_1.BN(22)).mul(new bn_js_1.BN(365)); // 21+ year maximum unlock time for an ID w/1 minute blocks, not adjusted for avg blocktime in first PBaaS
exports.IDENTITY_MAX_NAME_LEN = new bn_js_1.BN(64);
const { BufferReader, BufferWriter } = bufferutils_1.default;
class Identity extends Principal_1.Principal {
    constructor(data) {
        super(data);
        if (data != null) {
            const d = data;
            const deprecated = ['system_id', 'content_map', 'content_multimap', 'revocation_authority', 'recovery_authority', 'private_addresses', 'unlock_after'].filter(k => k in d);
            if (deprecated.length > 0) {
                const map = { system_id: 'systemId', content_map: 'contentMap', content_multimap: 'contentMultiMap', revocation_authority: 'revocationAuthority', recovery_authority: 'recoveryAuthority', private_addresses: 'privateAddresses', unlock_after: 'unlockAfter' };
                throw new Error(`Identity: snake_case property names are no longer supported. Rename: ${deprecated.map(k => `'${k}' → '${map[k]}'`).join(', ')}.`);
            }
        }
        if (data === null || data === void 0 ? void 0 : data.version)
            this.version = data.version;
        else
            this.version = Identity.VERSION_CURRENT;
        if (data === null || data === void 0 ? void 0 : data.parent)
            this.parent = data.parent;
        if (data === null || data === void 0 ? void 0 : data.systemId)
            this.systemId = data.systemId;
        if (data === null || data === void 0 ? void 0 : data.name)
            this.name = data.name;
        if (data === null || data === void 0 ? void 0 : data.contentMap)
            this.contentMap = data.contentMap;
        else
            this.contentMap = new Map();
        if (data === null || data === void 0 ? void 0 : data.contentMultiMap)
            this.contentMultiMap = data.contentMultiMap;
        else
            this.contentMultiMap = new ContentMultiMap_1.ContentMultiMap({ kvContent: new ContentMultiMap_1.KvContent() });
        if (data === null || data === void 0 ? void 0 : data.revocationAuthority)
            this.revocationAuthority = data.revocationAuthority;
        if (data === null || data === void 0 ? void 0 : data.recoveryAuthority)
            this.recoveryAuthority = data.recoveryAuthority;
        if (data === null || data === void 0 ? void 0 : data.privateAddresses)
            this.privateAddresses = data.privateAddresses;
        if (data === null || data === void 0 ? void 0 : data.unlockAfter)
            this.unlockAfter = data.unlockAfter;
    }
    /** @deprecated Use systemId instead */
    get system_id() { return this.systemId; }
    /** @deprecated Use contentMap instead */
    get content_map() { return this.contentMap; }
    /** @deprecated Use contentMultiMap instead */
    get content_multimap() { return this.contentMultiMap; }
    /** @deprecated Use revocationAuthority instead */
    get revocation_authority() { return this.revocationAuthority; }
    /** @deprecated Use recoveryAuthority instead */
    get recovery_authority() { return this.recoveryAuthority; }
    /** @deprecated Use privateAddresses instead */
    get private_addresses() { return this.privateAddresses; }
    /** @deprecated Use unlockAfter instead */
    get unlock_after() { return this.unlockAfter; }
    containsParent() {
        return true;
    }
    containsSystemId() {
        return true;
    }
    containsName() {
        return true;
    }
    containsContentMap() {
        return true;
    }
    containsContentMultiMap() {
        return true;
    }
    containsRevocation() {
        return true;
    }
    containsRecovery() {
        return true;
    }
    containsPrivateAddresses() {
        return true;
    }
    containsUnlockAfter() {
        return true;
    }
    getIdentityByteLength() {
        let length = 0;
        length += super.getByteLength();
        if (this.containsParent())
            length += this.parent.getByteLength();
        if (this.containsName()) {
            const nameLength = Buffer.from(this.name, "utf8").length;
            length += varuint_1.default.encodingLength(nameLength);
            length += nameLength;
        }
        if (this.containsContentMultiMap() && this.version.gte(exports.IDENTITY_VERSION_PBAAS)) {
            length += this.contentMultiMap.getByteLength();
        }
        if (this.containsContentMap()) {
            if (this.version.lt(exports.IDENTITY_VERSION_PBAAS)) {
                length += varuint_1.default.encodingLength(this.contentMap.size);
                for (const m of this.contentMap.entries()) {
                    length += vdxf_1.HASH160_BYTE_LENGTH; //uint160 key
                    length += vdxf_1.HASH256_BYTE_LENGTH;
                }
            }
            length += varuint_1.default.encodingLength(this.contentMap.size);
            for (const m of this.contentMap.entries()) {
                length += vdxf_1.HASH160_BYTE_LENGTH; //uint160 key
                length += vdxf_1.HASH256_BYTE_LENGTH; //uint256 hash
            }
        }
        if (this.containsRevocation())
            length += this.revocationAuthority.getByteLength(); //uint160 revocation authority
        if (this.containsRecovery())
            length += this.recoveryAuthority.getByteLength(); //uint160 recovery authority
        if (this.containsPrivateAddresses()) {
            length += varuint_1.default.encodingLength(this.privateAddresses ? this.privateAddresses.length : 0);
            if (this.privateAddresses) {
                for (const n of this.privateAddresses) {
                    length += n.getByteLength();
                }
            }
        }
        // post PBAAS
        if (this.version.gte(exports.IDENTITY_VERSION_VAULT)) {
            if (this.containsSystemId())
                length += this.systemId.getByteLength(); //uint160 systemid
            if (this.containsUnlockAfter())
                length += 4; //uint32 unlockafter
        }
        return length;
    }
    getByteLength() {
        return this.getIdentityByteLength();
    }
    createContentMultiMap() {
        return new ContentMultiMap_1.ContentMultiMap();
    }
    clearContentMultiMap() {
        this.contentMultiMap = new ContentMultiMap_1.ContentMultiMap({ kvContent: new ContentMultiMap_1.KvContent() });
    }
    toBuffer() {
        const writer = new BufferWriter(Buffer.alloc(this.getIdentityByteLength()));
        writer.writeSlice(super.toBuffer());
        if (this.containsParent())
            writer.writeSlice(this.parent.toBuffer());
        if (this.containsName())
            writer.writeVarSlice(Buffer.from(this.name, "utf8"));
        //contentmultimap
        if (this.containsContentMultiMap() && this.version.gte(exports.IDENTITY_VERSION_PBAAS)) {
            writer.writeSlice(this.contentMultiMap.toBuffer());
        }
        if (this.containsContentMap()) {
            //contentmap
            if (this.version.lt(exports.IDENTITY_VERSION_PBAAS)) {
                writer.writeCompactSize(this.contentMap.size);
                for (const [key, value] of this.contentMap.entries()) {
                    writer.writeSlice((0, address_1.fromBase58Check)(key).hash);
                    writer.writeSlice(value);
                }
            }
            //contentmap2
            writer.writeCompactSize(this.contentMap.size);
            for (const [key, value] of this.contentMap.entries()) {
                writer.writeSlice((0, address_1.fromBase58Check)(key).hash);
                writer.writeSlice(value);
            }
        }
        if (this.containsRevocation())
            writer.writeSlice(this.revocationAuthority.toBuffer());
        if (this.containsRecovery())
            writer.writeSlice(this.recoveryAuthority.toBuffer());
        if (this.containsPrivateAddresses()) {
            // privateaddresses
            writer.writeCompactSize(this.privateAddresses ? this.privateAddresses.length : 0);
            if (this.privateAddresses) {
                for (const n of this.privateAddresses) {
                    writer.writeSlice(n.toBuffer());
                }
            }
        }
        // post PBAAS
        if (this.version.gte(exports.IDENTITY_VERSION_VAULT)) {
            if (this.containsSystemId())
                writer.writeSlice(this.systemId.toBuffer());
            if (this.containsUnlockAfter())
                writer.writeUInt32(this.unlockAfter.toNumber());
        }
        return writer.buffer;
    }
    fromBuffer(buffer, offset = 0, parseVdxfObjects = false) {
        const reader = new BufferReader(buffer, offset);
        reader.offset = super.fromBuffer(reader.buffer, reader.offset);
        const _parent = new IdentityID_1.IdentityID();
        if (this.containsParent()) {
            reader.offset = _parent.fromBuffer(reader.buffer, reader.offset);
            this.parent = _parent;
        }
        if (this.containsName())
            this.name = Buffer.from(reader.readVarSlice()).toString('utf8');
        if (this.containsContentMultiMap()) {
            //contentmultimap
            if (this.version.gte(exports.IDENTITY_VERSION_PBAAS)) {
                const multimap = this.createContentMultiMap();
                reader.offset = multimap.fromBuffer(reader.buffer, reader.offset, parseVdxfObjects);
                this.contentMultiMap = multimap;
            }
        }
        if (this.containsContentMap()) {
            // contentmap
            if (this.version.lt(exports.IDENTITY_VERSION_PBAAS)) {
                const contentMapSize = reader.readVarInt();
                this.contentMap = new Map();
                for (var i = 0; i < contentMapSize.toNumber(); i++) {
                    const contentMapKey = (0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION);
                    this.contentMap.set(contentMapKey, reader.readSlice(32));
                }
            }
            const contentMapSize = reader.readVarInt();
            this.contentMap = new Map();
            for (var i = 0; i < contentMapSize.toNumber(); i++) {
                const contentMapKey = (0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION);
                this.contentMap.set(contentMapKey, reader.readSlice(32));
            }
        }
        if (this.containsRevocation()) {
            const _revocation = new IdentityID_1.IdentityID();
            reader.offset = _revocation.fromBuffer(reader.buffer, reader.offset);
            this.revocationAuthority = _revocation;
        }
        if (this.containsRecovery()) {
            const _recovery = new IdentityID_1.IdentityID();
            reader.offset = _recovery.fromBuffer(reader.buffer, reader.offset);
            this.recoveryAuthority = _recovery;
        }
        if (this.containsPrivateAddresses()) {
            const numPrivateAddresses = reader.readVarInt();
            if (numPrivateAddresses.gt(new bn_js_1.BN(0)))
                this.privateAddresses = [];
            for (var i = 0; i < numPrivateAddresses.toNumber(); i++) {
                const saplingAddr = new SaplingPaymentAddress_1.SaplingPaymentAddress();
                reader.offset = saplingAddr.fromBuffer(reader.buffer, reader.offset);
                this.privateAddresses.push(saplingAddr);
            }
        }
        if (this.version.gte(exports.IDENTITY_VERSION_VAULT)) {
            if (this.containsSystemId()) {
                const _system = new IdentityID_1.IdentityID();
                reader.offset = _system.fromBuffer(reader.buffer, reader.offset);
                this.systemId = _system;
            }
            if (this.containsUnlockAfter()) {
                this.unlockAfter = new bn_js_1.BN(reader.readUInt32(), 10);
            }
        }
        else {
            this.systemId = _parent;
            this.unlockAfter = new bn_js_1.BN(0);
        }
        return reader.offset;
    }
    toJson() {
        const contentmap = {};
        if (this.containsContentMap()) {
            for (const [key, value] of this.contentMap.entries()) {
                const valueCopy = Buffer.from(value);
                contentmap[(0, address_1.fromBase58Check)(key).hash.reverse().toString('hex')] = valueCopy.reverse().toString('hex');
            }
        }
        const ret = {
            contentmap: this.containsContentMap() ? contentmap : undefined,
            contentmultimap: this.containsContentMultiMap() ? this.contentMultiMap.toJson() : undefined,
            flags: this.containsFlags() ? this.flags.toNumber() : undefined,
            minimumsignatures: this.containsMinSigs() ? this.minSigs.toNumber() : undefined,
            name: this.name,
            parent: this.containsParent() ? this.parent.toAddress() : undefined,
            primaryaddresses: this.containsPrimaryAddresses() ? this.primaryAddresses.map(x => x.toAddress()) : undefined,
            recoveryauthority: this.containsRecovery() ? this.recoveryAuthority.toAddress() : undefined,
            revocationauthority: this.containsRevocation() ? this.revocationAuthority.toAddress() : undefined,
            systemid: this.containsSystemId() ? this.systemId.toAddress() : undefined,
            timelock: this.containsUnlockAfter() ? this.unlockAfter.toNumber() : undefined,
            version: this.containsVersion() ? this.version.toNumber() : undefined,
            identityaddress: this.containsParent() ? this.getIdentityAddress() : undefined
        };
        if (this.privateAddresses != null && this.privateAddresses.length > 0) {
            ret.privateaddress = this.privateAddresses[0].toAddressString();
        }
        for (const key in ret) {
            if (ret[key] === undefined)
                delete ret[key];
        }
        return ret;
    }
    getIdentityAddress() {
        return (0, address_1.nameAndParentAddrToIAddr)(this.name, this.parent.toAddress());
    }
    isRevoked() {
        return !!(this.flags.and(exports.IDENTITY_FLAG_REVOKED).toNumber());
    }
    isLocked() {
        return !!(this.flags.and(exports.IDENTITY_FLAG_LOCKED).toNumber());
    }
    hasActiveCurrency() {
        return !!(this.flags.and(exports.IDENTITY_FLAG_ACTIVECURRENCY).toNumber());
    }
    hasTokenizedIdControl() {
        return !!(this.flags.and(exports.IDENTITY_FLAG_TOKENIZED_CONTROL).toNumber());
    }
    lock(unlockTime) {
        let unlockAfter = unlockTime;
        if (unlockTime.lte(new bn_js_1.BN(0))) {
            unlockAfter = new bn_js_1.BN(1);
        }
        else if (unlockTime.gt(exports.IDENTITY_MAX_UNLOCK_DELAY)) {
            unlockAfter = exports.IDENTITY_MAX_UNLOCK_DELAY;
        }
        this.flags = this.flags.or(exports.IDENTITY_FLAG_LOCKED);
        this.unlockAfter = unlockAfter;
    }
    unlock(height = new bn_js_1.BN(0), txExpiryHeight = new bn_js_1.BN(0)) {
        if (this.isRevoked()) {
            this.flags = this.flags.and(exports.IDENTITY_FLAG_LOCKED.notn(16));
            this.unlockAfter = new bn_js_1.BN(0);
        }
        else if (this.isLocked()) {
            this.flags = this.flags.and(exports.IDENTITY_FLAG_LOCKED.notn(16));
            this.unlockAfter = this.unlockAfter.add(txExpiryHeight);
        }
        else if (height.gt(this.unlockAfter)) {
            this.unlockAfter = new bn_js_1.BN(0);
        }
        if (this.unlockAfter.gt((txExpiryHeight.add(exports.IDENTITY_MAX_UNLOCK_DELAY)))) {
            this.unlockAfter = txExpiryHeight.add(exports.IDENTITY_MAX_UNLOCK_DELAY);
        }
    }
    revoke() {
        this.flags = this.flags.or(exports.IDENTITY_FLAG_REVOKED);
        this.unlock();
    }
    unrevoke() {
        this.flags = this.flags.and(exports.IDENTITY_FLAG_REVOKED.notn(16));
    }
    setPrimaryAddresses(addresses) {
        const primaryAddresses = [];
        for (const str of addresses) {
            const addr = KeyID_1.KeyID.fromAddress(str);
            if (addr.version !== vdxf_1.R_ADDR_VERSION)
                throw new Error("Primary addresses must be r-addresses.");
            else {
                primaryAddresses.push(addr);
            }
        }
        this.primaryAddresses = primaryAddresses;
    }
    setRevocation(iAddr) {
        this.revocationAuthority = IdentityID_1.IdentityID.fromAddress(iAddr);
    }
    setRecovery(iAddr) {
        this.recoveryAuthority = IdentityID_1.IdentityID.fromAddress(iAddr);
    }
    setPrivateAddress(zAddr) {
        this.privateAddresses = [SaplingPaymentAddress_1.SaplingPaymentAddress.fromAddressString(zAddr)];
    }
    upgradeVersion(version = Identity.VERSION_CURRENT) {
        if (version.eq(this.version))
            return;
        if (version.lt(this.version))
            throw new Error("Cannot downgrade version");
        if (version.lt(Identity.VERSION_PBAAS))
            throw new Error("Cannot upgrade to a version less than PBAAS");
        if (version.gt(Identity.VERSION_CURRENT))
            throw new Error("Cannot upgrade to a version greater than the current known version");
        if (this.version.lt(Identity.VERSION_VAULT)) {
            this.systemId = this.parent ? this.parent : IdentityID_1.IdentityID.fromAddress(this.getIdentityAddress());
            this.version = Identity.VERSION_VAULT;
        }
        if (this.version.lt(Identity.VERSION_PBAAS)) {
            this.version = Identity.VERSION_PBAAS;
        }
    }
    static internalFromJson(json, ctor) {
        const contentmap = new Map();
        if (json.contentmap) {
            for (const key in json.contentmap) {
                const reverseKey = Buffer.from(key, 'hex').reverse();
                const iAddrKey = (0, address_1.toBase58Check)(reverseKey, vdxf_1.I_ADDR_VERSION);
                contentmap.set(iAddrKey, Buffer.from(json.contentmap[key], 'hex').reverse());
            }
        }
        return new ctor({
            version: json.version != null ? new bn_js_1.BN(json.version, 10) : undefined,
            flags: json.flags != null ? new bn_js_1.BN(json.flags, 10) : undefined,
            minSigs: json.minimumsignatures ? new bn_js_1.BN(json.minimumsignatures, 10) : undefined,
            primaryAddresses: json.primaryaddresses ? json.primaryaddresses.map(x => KeyID_1.KeyID.fromAddress(x)) : undefined,
            parent: json.parent ? IdentityID_1.IdentityID.fromAddress(json.parent) : undefined,
            systemId: json.systemid ? IdentityID_1.IdentityID.fromAddress(json.systemid) : undefined,
            name: json.name,
            contentMap: json.contentmap ? contentmap : undefined,
            contentMultiMap: json.contentmultimap ? ContentMultiMap_1.ContentMultiMap.fromJson(json.contentmultimap) : undefined,
            revocationAuthority: json.revocationauthority ? IdentityID_1.IdentityID.fromAddress(json.revocationauthority) : undefined,
            recoveryAuthority: json.recoveryauthority ? IdentityID_1.IdentityID.fromAddress(json.recoveryauthority) : undefined,
            privateAddresses: json.privateaddress == null ? [] : [SaplingPaymentAddress_1.SaplingPaymentAddress.fromAddressString(json.privateaddress)],
            unlockAfter: json.timelock != null ? new bn_js_1.BN(json.timelock, 10) : undefined
        });
    }
    static fromJson(json) {
        return Identity.internalFromJson(json, Identity);
    }
}
exports.Identity = Identity;
Identity.VERSION_INVALID = new bn_js_1.BN(0);
Identity.VERSION_VERUSID = new bn_js_1.BN(1);
Identity.VERSION_VAULT = new bn_js_1.BN(2);
Identity.VERSION_PBAAS = new bn_js_1.BN(3);
Identity.VERSION_CURRENT = Identity.VERSION_PBAAS;
Identity.VERSION_FIRSTVALID = new bn_js_1.BN(1);
Identity.VERSION_LASTVALID = new bn_js_1.BN(3);
