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
        if (data === null || data === void 0 ? void 0 : data.parent)
            this.parent = data.parent;
        if (data === null || data === void 0 ? void 0 : data.system_id)
            this.system_id = data.system_id;
        if (data === null || data === void 0 ? void 0 : data.name)
            this.name = data.name;
        if (data === null || data === void 0 ? void 0 : data.content_map)
            this.content_map = data.content_map;
        else
            this.content_map = new Map();
        if (data === null || data === void 0 ? void 0 : data.content_multimap)
            this.content_multimap = data.content_multimap;
        else
            this.content_multimap = new ContentMultiMap_1.ContentMultiMap({ kv_content: new Map() });
        if (data === null || data === void 0 ? void 0 : data.revocation_authority)
            this.revocation_authority = data.revocation_authority;
        if (data === null || data === void 0 ? void 0 : data.recovery_authority)
            this.recovery_authority = data.recovery_authority;
        if (data === null || data === void 0 ? void 0 : data.private_addresses)
            this.private_addresses = data.private_addresses;
        if (data === null || data === void 0 ? void 0 : data.unlock_after)
            this.unlock_after = data.unlock_after;
    }
    getByteLength() {
        let length = 0;
        length += super.getByteLength();
        length += this.parent.getByteLength();
        const nameLength = Buffer.from(this.name, "utf8").length;
        length += varuint_1.default.encodingLength(nameLength);
        length += nameLength;
        if (this.version.gte(exports.IDENTITY_VERSION_PBAAS)) {
            length += this.content_multimap.getByteLength();
        }
        if (this.version.lt(exports.IDENTITY_VERSION_PBAAS)) {
            length += varuint_1.default.encodingLength(this.content_map.size);
            for (const m of this.content_map.entries()) {
                length += 20; //uint160 key
                length += 32; //uint256 hash
            }
        }
        length += varuint_1.default.encodingLength(this.content_map.size);
        for (const m of this.content_map.entries()) {
            length += 20; //uint160 key
            length += 32; //uint256 hash
        }
        length += this.revocation_authority.getByteLength(); //uint160 revocation authority
        length += this.recovery_authority.getByteLength(); //uint160 recovery authority
        // privateaddresses
        length += varuint_1.default.encodingLength(this.private_addresses ? this.private_addresses.length : 0);
        if (this.private_addresses) {
            for (const n of this.private_addresses) {
                length += n.getByteLength();
            }
        }
        // post PBAAS
        if (this.version.gte(exports.IDENTITY_VERSION_VAULT)) {
            length += this.system_id.getByteLength(); //uint160 systemid
            length += 4; //uint32 unlockafter
        }
        return length;
    }
    toBuffer() {
        const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));
        writer.writeSlice(super.toBuffer());
        writer.writeSlice(this.parent.toBuffer());
        writer.writeVarSlice(Buffer.from(this.name, "utf8"));
        //contentmultimap
        if (this.version.gte(exports.IDENTITY_VERSION_PBAAS)) {
            writer.writeSlice(this.content_multimap.toBuffer());
        }
        //contentmap
        if (this.version.lt(exports.IDENTITY_VERSION_PBAAS)) {
            writer.writeCompactSize(this.content_map.size);
            for (const [key, value] of this.content_map.entries()) {
                writer.writeSlice((0, address_1.fromBase58Check)(key).hash);
                writer.writeSlice(value);
            }
        }
        //contentmap2
        writer.writeCompactSize(this.content_map.size);
        for (const [key, value] of this.content_map.entries()) {
            writer.writeSlice((0, address_1.fromBase58Check)(key).hash);
            writer.writeSlice(value);
        }
        writer.writeSlice(this.revocation_authority.toBuffer());
        writer.writeSlice(this.recovery_authority.toBuffer());
        // privateaddresses
        writer.writeCompactSize(this.private_addresses ? this.private_addresses.length : 0);
        if (this.private_addresses) {
            for (const n of this.private_addresses) {
                writer.writeSlice(n.toBuffer());
            }
        }
        // post PBAAS
        if (this.version.gte(exports.IDENTITY_VERSION_VAULT)) {
            writer.writeSlice(this.system_id.toBuffer());
            writer.writeUInt32(this.unlock_after.toNumber());
        }
        return writer.buffer;
    }
    fromBuffer(buffer, offset = 0, parseVdxfObjects = false) {
        const reader = new BufferReader(buffer, offset);
        reader.offset = super.fromBuffer(reader.buffer, reader.offset);
        const _parent = new IdentityID_1.IdentityID();
        reader.offset = _parent.fromBuffer(reader.buffer, reader.offset);
        this.parent = _parent;
        this.name = Buffer.from(reader.readVarSlice()).toString('utf8');
        //contentmultimap
        if (this.version.gte(exports.IDENTITY_VERSION_PBAAS)) {
            const multimap = new ContentMultiMap_1.ContentMultiMap();
            reader.offset = multimap.fromBuffer(reader.buffer, reader.offset, parseVdxfObjects);
            this.content_multimap = multimap;
        }
        // contentmap
        if (this.version.lt(exports.IDENTITY_VERSION_PBAAS)) {
            const contentMapSize = reader.readVarInt();
            this.content_map = new Map();
            for (var i = 0; i < contentMapSize.toNumber(); i++) {
                const contentMapKey = (0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION);
                this.content_map.set(contentMapKey, reader.readSlice(32));
            }
        }
        const contentMapSize = reader.readVarInt();
        this.content_map = new Map();
        for (var i = 0; i < contentMapSize.toNumber(); i++) {
            const contentMapKey = (0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION);
            this.content_map.set(contentMapKey, reader.readSlice(32));
        }
        const _revocation = new IdentityID_1.IdentityID();
        reader.offset = _revocation.fromBuffer(reader.buffer, reader.offset);
        this.revocation_authority = _revocation;
        const _recovery = new IdentityID_1.IdentityID();
        reader.offset = _recovery.fromBuffer(reader.buffer, reader.offset);
        this.recovery_authority = _recovery;
        const numPrivateAddresses = reader.readVarInt();
        if (numPrivateAddresses.gt(new bn_js_1.BN(0)))
            this.private_addresses = [];
        for (var i = 0; i < numPrivateAddresses.toNumber(); i++) {
            const saplingAddr = new SaplingPaymentAddress_1.SaplingPaymentAddress();
            reader.offset = saplingAddr.fromBuffer(reader.buffer, reader.offset);
            this.private_addresses.push(saplingAddr);
        }
        if (this.version.gte(exports.IDENTITY_VERSION_VAULT)) {
            const _system = new IdentityID_1.IdentityID();
            reader.offset = _system.fromBuffer(reader.buffer, reader.offset);
            this.system_id = _system;
            this.unlock_after = new bn_js_1.BN(reader.readUInt32(), 10);
        }
        else {
            this.system_id = _parent;
            this.unlock_after = new bn_js_1.BN(0);
        }
        return reader.offset;
    }
    toJson() {
        const contentmap = {};
        for (const [key, value] of this.content_map.entries()) {
            const valueCopy = Buffer.from(value);
            contentmap[(0, address_1.fromBase58Check)(key).hash.reverse().toString('hex')] = valueCopy.reverse().toString('hex');
        }
        const ret = {
            contentmap,
            contentmultimap: this.content_multimap.toJson(),
            flags: this.flags.toNumber(),
            minimumsignatures: this.min_sigs.toNumber(),
            name: this.name,
            parent: this.parent.toAddress(),
            primaryaddresses: this.primary_addresses.map(x => x.toAddress()),
            recoveryauthority: this.recovery_authority.toAddress(),
            revocationauthority: this.revocation_authority.toAddress(),
            systemid: this.system_id.toAddress(),
            timelock: this.unlock_after.toNumber(),
            version: this.version.toNumber(),
            identityaddress: this.getIdentityAddress()
        };
        if (this.private_addresses != null && this.private_addresses.length > 0) {
            ret.privateaddress = this.private_addresses[0].toAddressString();
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
        this.flags = this.flags.xor(exports.IDENTITY_FLAG_LOCKED);
        this.unlock_after = unlockAfter;
    }
    unlock(height = new bn_js_1.BN(0), txExpiryHeight = new bn_js_1.BN(0)) {
        if (this.isRevoked()) {
            this.flags = this.flags.and(exports.IDENTITY_FLAG_LOCKED.notn(16));
            this.unlock_after = new bn_js_1.BN(0);
        }
        else if (this.isLocked()) {
            this.flags = this.flags.and(exports.IDENTITY_FLAG_LOCKED.notn(16));
            this.unlock_after = this.unlock_after.add(txExpiryHeight);
        }
        else if (height.gt(this.unlock_after)) {
            this.unlock_after = new bn_js_1.BN(0);
        }
        if (this.unlock_after.gt((txExpiryHeight.add(exports.IDENTITY_MAX_UNLOCK_DELAY)))) {
            this.unlock_after = txExpiryHeight.add(exports.IDENTITY_MAX_UNLOCK_DELAY);
        }
    }
    revoke() {
        this.flags = this.flags.xor(exports.IDENTITY_FLAG_REVOKED);
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
        this.primary_addresses = primaryAddresses;
    }
    setRevocation(iAddr) {
        this.revocation_authority = IdentityID_1.IdentityID.fromAddress(iAddr);
    }
    setRecovery(iAddr) {
        this.recovery_authority = IdentityID_1.IdentityID.fromAddress(iAddr);
    }
    setPrivateAddress(zAddr) {
        this.private_addresses = [SaplingPaymentAddress_1.SaplingPaymentAddress.fromAddressString(zAddr)];
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
            this.system_id = this.parent ? this.parent : IdentityID_1.IdentityID.fromAddress(this.getIdentityAddress());
            this.version = Identity.VERSION_VAULT;
        }
        if (this.version.lt(Identity.VERSION_PBAAS)) {
            this.version = Identity.VERSION_PBAAS;
        }
    }
    static fromJson(json) {
        const contentmap = new Map();
        for (const key in json.contentmap) {
            const reverseKey = Buffer.from(key, 'hex').reverse();
            const iAddrKey = (0, address_1.toBase58Check)(reverseKey, vdxf_1.I_ADDR_VERSION);
            contentmap.set(iAddrKey, Buffer.from(json.contentmap[key], 'hex').reverse());
        }
        return new Identity({
            version: new bn_js_1.BN(json.version, 10),
            flags: new bn_js_1.BN(json.flags, 10),
            min_sigs: new bn_js_1.BN(json.minimumsignatures, 10),
            primary_addresses: json.primaryaddresses.map(x => KeyID_1.KeyID.fromAddress(x)),
            parent: IdentityID_1.IdentityID.fromAddress(json.parent),
            system_id: json.systemid ? IdentityID_1.IdentityID.fromAddress(json.systemid) : undefined,
            name: json.name,
            content_map: contentmap,
            content_multimap: ContentMultiMap_1.ContentMultiMap.fromJson(json.contentmultimap),
            revocation_authority: IdentityID_1.IdentityID.fromAddress(json.revocationauthority),
            recovery_authority: IdentityID_1.IdentityID.fromAddress(json.recoveryauthority),
            private_addresses: json.privateaddress == null ? [] : [SaplingPaymentAddress_1.SaplingPaymentAddress.fromAddressString(json.privateaddress)],
            unlock_after: new bn_js_1.BN(json.timelock, 10)
        });
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
