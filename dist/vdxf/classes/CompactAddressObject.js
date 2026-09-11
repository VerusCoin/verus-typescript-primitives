"use strict";
/**
 * CompactIdentityObject - Class representing an id in the smallest possible format
 *
 * This class is used to represent an identity or address in a compact format, allowing for efficient
 * storage and transmission. The compact id can be represented either as a fully qualified name (FQN)
 * or as an identity address (iaddress) or as an x address (tag/index). The class includes methods for serialization, deserialization,
 * and validation of the compact id object.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompactIAddressObject = exports.CompactXAddressObject = exports.CompactAddressObject = void 0;
const bn_js_1 = require("bn.js");
const SerializableEntityBase_1 = require("../../utils/types/SerializableEntityBase");
const bufferutils_1 = require("../../utils/bufferutils");
const { BufferReader, BufferWriter } = bufferutils_1.default;
const varuint_1 = require("../../utils/varuint");
const address_1 = require("../../utils/address");
const vdxf_1 = require("../../constants/vdxf");
const pbaas_1 = require("../../constants/pbaas");
class CompactAddressObject extends SerializableEntityBase_1.SerializableEntityBase {
    constructor(data) {
        super();
        this.version = (data === null || data === void 0 ? void 0 : data.version) || new bn_js_1.BN(CompactAddressObject.DEFAULT_VERSION);
        this.type = (data === null || data === void 0 ? void 0 : data.type.toString()) || "1";
        this.address = (data === null || data === void 0 ? void 0 : data.address) || '';
        this.rootSystemName = (data === null || data === void 0 ? void 0 : data.rootSystemName) || 'VRSC';
        this.nameSpace = (data === null || data === void 0 ? void 0 : data.nameSpace) || (0, address_1.toIAddress)(this.rootSystemName);
    }
    get BNType() {
        return new bn_js_1.BN(this.type);
    }
    set setType(type) {
        this.type = type.toString();
    }
    isFQN() {
        return (this.BNType.eq(CompactAddressObject.TYPE_FQN));
    }
    isIaddress() {
        return (this.BNType.eq(CompactAddressObject.TYPE_I_ADDRESS));
    }
    isXaddress() {
        return (this.BNType.eq(CompactAddressObject.TYPE_X_ADDRESS));
    }
    isValid() {
        return this.address != null;
    }
    toIAddress() {
        if (this.isXaddress())
            throw new Error("Cannot convert I to X address");
        else if (this.isIaddress())
            return this.address;
        else if (this.isFQN()) {
            if (this.address.includes("::")) {
                return (0, address_1.getDataKey)(this.address, this.nameSpace, (0, address_1.toIAddress)(this.rootSystemName), vdxf_1.I_ADDR_VERSION).id;
            }
            else {
                return (0, address_1.toIAddress)(this.address, this.rootSystemName);
            }
        }
        else
            throw new Error("Unknown type");
    }
    toXAddress() {
        if (this.isIaddress())
            throw new Error("Cannot convert X to I address");
        else if (this.isXaddress())
            return this.address;
        else if (this.isFQN()) {
            if (this.address.includes("::")) {
                return (0, address_1.getDataKey)(this.address, this.nameSpace, (0, address_1.toIAddress)(this.rootSystemName), vdxf_1.X_ADDR_VERSION).id;
            }
            else {
                return (0, address_1.toXAddress)(this.address, this.rootSystemName);
            }
        }
        else
            throw new Error("Unknown type");
    }
    toString() {
        if (this.isIaddress()) {
            return this.toIAddress();
        }
        else if (this.isXaddress()) {
            return this.toXAddress();
        }
        else
            return this.address;
    }
    static fromIAddress(iaddr) {
        return new CompactAddressObject({
            address: iaddr,
            type: CompactAddressObject.TYPE_I_ADDRESS
        });
    }
    static fromXAddress(xaddr, nameSpace = pbaas_1.DEFAULT_VERUS_CHAINID) {
        return new CompactAddressObject({
            address: xaddr,
            nameSpace: nameSpace,
            type: CompactAddressObject.TYPE_X_ADDRESS
        });
    }
    getFQNWithoutSuffix() {
        if (!this.isFQN())
            return this.address;
        // If FQN ends with ".", it's explicitly defined - don't modify
        if (this.address.endsWith(".") || this.address.endsWith(".@"))
            return this.address;
        // Don't modify the root system name itself or VDXF keys
        if (this.address.toLowerCase() === this.rootSystemName.toLowerCase() || this.address.includes("::")) {
            return this.address;
        }
        const suffix = `.${this.rootSystemName.toLowerCase()}`;
        const lowerAddr = this.address.toLowerCase();
        // Check for pattern: .rootSystemName@ (e.g., "michael.vrsc@" → "michael@")
        if (lowerAddr.endsWith(`${suffix}@`)) {
            // Remove the suffix but keep the @
            return this.address.slice(0, -(suffix.length + 1)) + '@';
        }
        // Check for pattern: .rootSystemName (e.g., "michael.vrsc" → "michael")
        if (lowerAddr.endsWith(suffix)) {
            return this.address.slice(0, -suffix.length);
        }
        return this.address;
    }
    getByteLength() {
        let length = 0;
        length += varuint_1.default.encodingLength(this.version.toNumber());
        length += varuint_1.default.encodingLength(this.BNType.toNumber());
        if (this.isIaddress() || this.isXaddress()) {
            length += vdxf_1.HASH160_BYTE_LENGTH; // identityuint160
        }
        else {
            // For FQN, use the address without the root system suffix
            const addrToSerialize = this.getFQNWithoutSuffix();
            const addrLen = Buffer.from(addrToSerialize, 'utf8').byteLength;
            length += varuint_1.default.encodingLength(addrLen) + addrLen;
        }
        return length;
    }
    toBuffer() {
        const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));
        writer.writeCompactSize(this.version.toNumber());
        writer.writeCompactSize(this.BNType.toNumber());
        if (this.isIaddress() || this.isXaddress()) {
            writer.writeSlice((0, address_1.fromBase58Check)(this.address).hash);
        }
        else {
            // For FQN, write without the root system suffix to save space
            const addrToSerialize = this.getFQNWithoutSuffix();
            writer.writeVarSlice(Buffer.from(addrToSerialize, 'utf8'));
        }
        return writer.buffer;
    }
    fromBuffer(buffer, offset) {
        const reader = new BufferReader(buffer, offset);
        this.version = new bn_js_1.BN(reader.readCompactSize());
        this.type = new bn_js_1.BN(reader.readCompactSize()).toString();
        if (this.isIaddress() || this.isXaddress()) {
            this.address = (0, address_1.toBase58Check)(reader.readSlice(20), this.isIaddress() ? vdxf_1.I_ADDR_VERSION : vdxf_1.X_ADDR_VERSION);
        }
        else {
            // Read FQN as-is without re-adding suffix
            // The suffix was stripped during serialization and remains stripped
            this.address = reader.readVarSlice().toString('utf8');
        }
        return reader.offset;
    }
    toJson() {
        return {
            version: this.version.toNumber(),
            type: this.BNType.toNumber(),
            address: this.address,
            rootsystemname: this.rootSystemName,
        };
    }
    static fromJson(json) {
        const instance = new CompactAddressObject();
        instance.version = new bn_js_1.BN(json.version);
        instance.type = new bn_js_1.BN(json.type).toString();
        instance.address = json.address;
        instance.rootSystemName = json.rootsystemname;
        return instance;
    }
}
exports.CompactAddressObject = CompactAddressObject;
CompactAddressObject.VERSION_INVALID = new bn_js_1.BN(0);
CompactAddressObject.FIRST_VERSION = new bn_js_1.BN(1);
CompactAddressObject.LAST_VERSION = new bn_js_1.BN(1);
CompactAddressObject.DEFAULT_VERSION = new bn_js_1.BN(1);
CompactAddressObject.TYPE_FQN = new bn_js_1.BN(1);
CompactAddressObject.TYPE_I_ADDRESS = new bn_js_1.BN(2);
CompactAddressObject.TYPE_X_ADDRESS = new bn_js_1.BN(3);
class CompactXAddressObject extends CompactAddressObject {
    static fromAddress(xaddr, rootSystemName = "VRSC", nameSpace) {
        return new CompactXAddressObject({
            address: xaddr,
            nameSpace: nameSpace,
            rootSystemName: rootSystemName,
            type: CompactAddressObject.TYPE_X_ADDRESS
        });
    }
    static fromDataKey(xaddr, rootSystemName, nameSpace) {
        return new CompactXAddressObject({
            address: xaddr,
            nameSpace: nameSpace,
            rootSystemName: rootSystemName,
            type: CompactAddressObject.TYPE_FQN
        });
    }
    toAddress() {
        return this.toXAddress();
    }
    static fromCompactAddressObjectJson(json) {
        const inst = CompactAddressObject.fromJson(json);
        return inst;
    }
}
exports.CompactXAddressObject = CompactXAddressObject;
;
class CompactIAddressObject extends CompactAddressObject {
    static fromAddress(iaddr, rootSystemName = "VRSC", nameSpace) {
        return new CompactIAddressObject({
            address: iaddr,
            rootSystemName: rootSystemName,
            nameSpace: nameSpace,
            type: CompactAddressObject.TYPE_I_ADDRESS
        });
    }
    static fromFQN(iaddr, rootSystemName = "VRSC", nameSpace) {
        return new CompactIAddressObject({
            address: iaddr,
            rootSystemName: rootSystemName,
            nameSpace: nameSpace,
            type: CompactAddressObject.TYPE_FQN
        });
    }
    toAddress() {
        return this.toIAddress();
    }
    static fromCompactAddressObjectJson(json) {
        const inst = CompactAddressObject.fromJson(json);
        return new CompactIAddressObject({
            address: inst.address,
            nameSpace: inst.nameSpace,
            type: new bn_js_1.BN(inst.type),
            rootSystemName: inst.rootSystemName
        });
    }
}
exports.CompactIAddressObject = CompactIAddressObject;
;
