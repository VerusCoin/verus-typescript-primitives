"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecipientConstraint = void 0;
const SerializableEntityBase_1 = require("../../../utils/types/SerializableEntityBase");
const bufferutils_1 = require("../../../utils/bufferutils");
const varuint_1 = require("../../../utils/varuint");
const CompactAddressObject_1 = require("../CompactAddressObject");
class RecipientConstraint extends SerializableEntityBase_1.SerializableEntityBase {
    constructor(data) {
        var _a;
        super();
        this.type = (_a = data === null || data === void 0 ? void 0 : data.type) !== null && _a !== void 0 ? _a : 0;
        this.identity = (data === null || data === void 0 ? void 0 : data.identity) || new CompactAddressObject_1.CompactIAddressObject();
    }
    static fromData(data) {
        if (data instanceof RecipientConstraint) {
            return data;
        }
        return new RecipientConstraint({
            type: data.type,
            identity: data.identity,
        });
    }
    getByteLength() {
        return varuint_1.default.encodingLength(this.type) + this.identity.getByteLength();
    }
    toBuffer() {
        const writer = new bufferutils_1.default.BufferWriter(Buffer.alloc(this.getByteLength()));
        writer.writeCompactSize(this.type);
        writer.writeSlice(this.identity.toBuffer());
        return writer.buffer;
    }
    fromBuffer(buffer, offset, rootSystemName = 'VRSC') {
        const reader = new bufferutils_1.default.BufferReader(buffer, offset);
        this.type = reader.readCompactSize();
        this.identity = new CompactAddressObject_1.CompactIAddressObject({ type: CompactAddressObject_1.CompactIAddressObject.TYPE_I_ADDRESS, address: '', rootSystemName });
        reader.offset = this.identity.fromBuffer(reader.buffer, reader.offset);
        return reader.offset;
    }
    toJson() {
        return {
            type: this.type,
            identity: this.identity.toJson(),
        };
    }
    static fromJson(data) {
        return new RecipientConstraint({
            type: data.type,
            identity: CompactAddressObject_1.CompactIAddressObject.fromCompactAddressObjectJson(data.identity),
        });
    }
    static requiredIDFromAddress(iaddr) {
        return new RecipientConstraint({
            type: RecipientConstraint.REQUIRED_ID,
            identity: CompactAddressObject_1.CompactIAddressObject.fromAddress(iaddr),
        });
    }
    static requiredSystemFromAddress(iaddr) {
        return new RecipientConstraint({
            type: RecipientConstraint.REQUIRED_SYSTEM,
            identity: CompactAddressObject_1.CompactIAddressObject.fromAddress(iaddr),
        });
    }
    static requiredParentFromAddress(iaddr) {
        return new RecipientConstraint({
            type: RecipientConstraint.REQUIRED_PARENT,
            identity: CompactAddressObject_1.CompactIAddressObject.fromAddress(iaddr),
        });
    }
    static requiredSystemFromFQN(fqn, rootSystemName = "VRSC") {
        return new RecipientConstraint({
            type: RecipientConstraint.REQUIRED_SYSTEM,
            identity: new CompactAddressObject_1.CompactIAddressObject({
                type: CompactAddressObject_1.CompactAddressObject.TYPE_FQN,
                address: fqn,
                rootSystemName: rootSystemName
            }),
        });
    }
    static requiredParentFromFQN(fqn, rootSystemName = "VRSC") {
        return new RecipientConstraint({
            type: RecipientConstraint.REQUIRED_PARENT,
            identity: new CompactAddressObject_1.CompactIAddressObject({
                type: CompactAddressObject_1.CompactAddressObject.TYPE_FQN,
                address: fqn,
                rootSystemName: rootSystemName
            }),
        });
    }
}
exports.RecipientConstraint = RecipientConstraint;
// Recipient Constraint Types - What types of Identity can login, e.g. REQUIRED_SYSTEM and "VRSC" means only identities on the Verus chain can login
RecipientConstraint.REQUIRED_ID = 1;
RecipientConstraint.REQUIRED_SYSTEM = 2;
RecipientConstraint.REQUIRED_PARENT = 3;
