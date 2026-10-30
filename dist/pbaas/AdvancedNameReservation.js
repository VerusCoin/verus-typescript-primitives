"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedNameReservation = void 0;
const SerializableEntityBase_1 = require("../utils/types/SerializableEntityBase");
const bufferutils_1 = require("../utils/bufferutils");
const hash_1 = require("../utils/hash");
const address_1 = require("../utils/address");
const identityRegistration_1 = require("../utils/identityRegistration");
const IdentityID_1 = require("./IdentityID");
const CommitmentHash_1 = require("./CommitmentHash");
const identityRegistrationSerialization_1 = require("./identityRegistrationSerialization");
/** CAdvancedNameReservation version 1; its version is a fixed uint32 LE. */
class AdvancedNameReservation extends SerializableEntityBase_1.SerializableEntityBase {
    constructor(data = {}) {
        var _a, _b;
        super();
        this.version = data.version == null ? AdvancedNameReservation.VERSION_CURRENT : data.version;
        this.name = data.name == null ? '' : data.name;
        if (data.parent != null)
            (0, identityRegistrationSerialization_1.assertIdentityID)(data.parent, 'Parent');
        if (data.referral != null)
            (0, identityRegistrationSerialization_1.assertIdentityID)(data.referral, 'Referral');
        if (data.salt != null && !Buffer.isBuffer(data.salt))
            throw new Error('Salt must be a Buffer of raw uint256 bytes');
        this.parent = new IdentityID_1.IdentityID(Buffer.from(((_a = data.parent) === null || _a === void 0 ? void 0 : _a.hash) || Buffer.alloc(20)));
        this.referral = new IdentityID_1.IdentityID(Buffer.from(((_b = data.referral) === null || _b === void 0 ? void 0 : _b.hash) || Buffer.alloc(20)));
        this.salt = Buffer.from(data.salt || Buffer.alloc(32));
    }
    validate() {
        if (this.version !== AdvancedNameReservation.VERSION_CURRENT)
            throw new Error('Unsupported advanced reservation version');
        (0, identityRegistrationSerialization_1.assertNameBytes)(this.name);
        (0, identityRegistrationSerialization_1.assertIdentityID)(this.parent, 'Parent');
        (0, identityRegistrationSerialization_1.assertIdentityID)(this.referral, 'Referral');
        (0, identityRegistrationSerialization_1.assertUint256)(this.salt, 'Salt');
    }
    isValid() {
        try {
            this.validate();
            return true;
        }
        catch (_) {
            return false;
        }
    }
    validateForCreation() {
        this.validate();
        (0, identityRegistrationSerialization_1.assertIdentityID)(this.parent, 'Parent', false);
        (0, identityRegistration_1.validateIdentityRegistrationName)(this.name);
    }
    getByteLength() {
        this.validate();
        return 4 + 1 + Buffer.byteLength(this.name, 'utf8') + 20 + 20 + 32;
    }
    toBuffer() {
        const writer = new bufferutils_1.default.BufferWriter(Buffer.alloc(this.getByteLength()));
        writer.writeUInt32(this.version);
        writer.writeVarSlice(Buffer.from(this.name, 'utf8'));
        writer.writeSlice(this.parent.hash);
        writer.writeSlice(this.referral.hash);
        writer.writeSlice(this.salt);
        return writer.buffer;
    }
    /** Stream parser; supplying length rejects any trailing payload bytes. */
    fromBuffer(buffer, offset = 0, length) {
        const reader = (0, identityRegistrationSerialization_1.boundedReader)(buffer, offset, length);
        const version = reader.readUInt32();
        const name = (0, identityRegistrationSerialization_1.readName)(reader);
        const parent = new IdentityID_1.IdentityID(Buffer.from(reader.readSlice(20)));
        const referral = new IdentityID_1.IdentityID(Buffer.from(reader.readSlice(20)));
        const salt = Buffer.from(reader.readSlice(32));
        const parsed = new AdvancedNameReservation({ version, name, parent, referral, salt });
        parsed.validate();
        (0, identityRegistrationSerialization_1.checkPayloadEnd)(reader.offset, offset, length);
        this.version = version;
        this.name = name;
        this.parent = parent;
        this.referral = referral;
        this.salt = salt;
        return reader.offset;
    }
    static fromHex(hex) {
        const bytes = (0, identityRegistrationSerialization_1.payloadFromHex)(hex);
        const result = new AdvancedNameReservation();
        result.fromBuffer(bytes, 0, bytes.length);
        return result;
    }
    getCommitment() {
        return new CommitmentHash_1.CommitmentHash({ hash: (0, hash_1.hash)(this.toBuffer()) });
    }
    /**
     * A null serialized parent uses the daemon's global root when deriving nameid.
     * It does not mean an absolute, parentless identity. Require that context rather
     * than silently assuming a network; ordinary nonnull parents are self-contained.
     */
    getIdentityAddress(rootSystemName) {
        this.validate();
        if (/[.@]/.test(this.name))
            throw new Error('Reservation must contain a leaf name');
        // CIdentity::GetID hashes a C string; NUL would truncate the daemon's name.
        if (this.name.includes('\0'))
            throw new Error('Cannot derive an identity address from a name containing NUL');
        if (this.parent.hash.equals(Buffer.alloc(20))) {
            if (rootSystemName === undefined)
                throw new Error('Null-parent reservation requires explicit root system context');
            (0, identityRegistration_1.validateIdentityRegistrationName)(rootSystemName);
            // CleanName(..., addVerus=true) appends the root unless the leaf is already
            // the root name (ASCII case-insensitive). toIAddress implements that rule.
            return (0, address_1.toIAddress)(this.name, rootSystemName);
        }
        return (0, address_1.nameAndParentAddrToIAddr)(this.name, this.parent.toAddress());
    }
    toJSON() {
        return this.toJSONInRootContext();
    }
    /** Explicit context is separate from JSON.stringify's property-key argument. */
    toJSONWithRootSystem(rootSystemName) {
        return this.toJSONInRootContext(rootSystemName);
    }
    toJSONInRootContext(rootSystemName) {
        this.validate();
        return {
            version: this.version,
            name: this.name,
            parent: this.parent.toAddress(),
            referral: this.referral.hash.equals(Buffer.alloc(20)) ? '' : this.referral.toAddress(),
            salt: Buffer.from(this.salt).reverse().toString('hex'),
            nameid: this.getIdentityAddress(rootSystemName)
        };
    }
    static fromJSON(json, rootSystemName) {
        const result = new AdvancedNameReservation({
            version: json.version,
            name: json.name,
            parent: (0, identityRegistrationSerialization_1.identityIDFromJSON)(json.parent, 'Parent'),
            referral: (0, identityRegistrationSerialization_1.identityIDFromJSON)(json.referral == null ? '' : json.referral, 'Referral'),
            salt: (0, identityRegistrationSerialization_1.uint256FromHex)(json.salt, 'Salt')
        });
        result.validate();
        if (json.nameid != null && json.nameid !== result.getIdentityAddress(rootSystemName))
            throw new Error('Reservation nameid does not match its name and parent');
        return result;
    }
}
exports.AdvancedNameReservation = AdvancedNameReservation;
AdvancedNameReservation.VERSION_CURRENT = 1;
AdvancedNameReservation.MAX_NAME_SIZE = identityRegistrationSerialization_1.MAX_IDENTITY_NAME_BYTES;
AdvancedNameReservation.DEFAULT_OUTPUT_AMOUNT = 0;
