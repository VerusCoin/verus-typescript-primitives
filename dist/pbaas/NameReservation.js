"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NameReservation = void 0;
const SerializableEntityBase_1 = require("../utils/types/SerializableEntityBase");
const bufferutils_1 = require("../utils/bufferutils");
const hash_1 = require("../utils/hash");
const address_1 = require("../utils/address");
const identityRegistration_1 = require("../utils/identityRegistration");
const IdentityID_1 = require("./IdentityID");
const CommitmentHash_1 = require("./CommitmentHash");
const identityRegistrationSerialization_1 = require("./identityRegistrationSerialization");
/** Legacy CNameReservation. Salt is raw uint256 bytes; JSON salt is display hex. */
class NameReservation extends SerializableEntityBase_1.SerializableEntityBase {
    constructor(data = {}) {
        var _a;
        super();
        this.name = data.name == null ? '' : data.name;
        if (data.referral != null)
            (0, identityRegistrationSerialization_1.assertIdentityID)(data.referral, 'Referral');
        if (data.salt != null && !Buffer.isBuffer(data.salt))
            throw new Error('Salt must be a Buffer of raw uint256 bytes');
        this.referral = new IdentityID_1.IdentityID(Buffer.from(((_a = data.referral) === null || _a === void 0 ? void 0 : _a.hash) || Buffer.alloc(20)));
        this.salt = Buffer.from(data.salt || Buffer.alloc(32));
    }
    validate() {
        (0, identityRegistrationSerialization_1.assertNameBytes)(this.name);
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
    /** Stricter wallet creation policy, separate from historical payload decoding. */
    validateForCreation() {
        this.validate();
        (0, identityRegistration_1.validateIdentityRegistrationName)(this.name);
    }
    getByteLength() {
        this.validate();
        return 1 + Buffer.byteLength(this.name, 'utf8') + 20 + 32;
    }
    toBuffer() {
        const writer = new bufferutils_1.default.BufferWriter(Buffer.alloc(this.getByteLength()));
        writer.writeVarSlice(Buffer.from(this.name, 'utf8'));
        writer.writeSlice(this.referral.hash);
        writer.writeSlice(this.salt);
        return writer.buffer;
    }
    /** Stream parser; supplying length rejects any trailing payload bytes. */
    fromBuffer(buffer, offset = 0, length) {
        const reader = (0, identityRegistrationSerialization_1.boundedReader)(buffer, offset, length);
        const name = (0, identityRegistrationSerialization_1.readName)(reader);
        const referral = new IdentityID_1.IdentityID(Buffer.from(reader.readSlice(20)));
        const salt = Buffer.from(reader.readSlice(32));
        const parsed = new NameReservation({ name, referral, salt });
        parsed.validate();
        (0, identityRegistrationSerialization_1.checkPayloadEnd)(reader.offset, offset, length);
        this.name = name;
        this.referral = referral;
        this.salt = salt;
        return reader.offset;
    }
    static fromHex(hex) {
        const bytes = (0, identityRegistrationSerialization_1.payloadFromHex)(hex);
        const result = new NameReservation();
        result.fromBuffer(bytes, 0, bytes.length);
        return result;
    }
    getCommitment() {
        return new CommitmentHash_1.CommitmentHash({ hash: (0, hash_1.hash)(this.toBuffer()) });
    }
    /**
     * Explicit context is mandatory: null denotes an explicitly selected absolute
     * root (the historical genesis case), never the daemon's implicit network root.
     */
    getIdentityAddress(parent) {
        this.validate();
        if (/[.@]/.test(this.name))
            throw new Error('Reservation must contain a leaf name');
        // CIdentity::GetID hashes a C string; NUL would truncate the daemon's name.
        if (this.name.includes('\0'))
            throw new Error('Cannot derive an identity address from a name containing NUL');
        if (parent === undefined)
            throw new Error('Legacy reservation requires explicit parent context');
        const parentID = parent === null ? null : (0, identityRegistrationSerialization_1.identityIDFromJSON)(parent, 'Parent', false);
        return (0, address_1.nameAndParentAddrToIAddr)(this.name, parentID === null || parentID === void 0 ? void 0 : parentID.toAddress());
    }
    toJSON() {
        this.validate();
        return {
            name: this.name,
            salt: Buffer.from(this.salt).reverse().toString('hex'),
            referral: this.referral.hash.equals(Buffer.alloc(20)) ? '' : this.referral.toAddress()
        };
    }
    /** Explicit metadata context, separate from JSON.stringify's property-key argument. */
    toJSONWithParent(parent) {
        return Object.assign(Object.assign({}, this.toJSON()), { parent: parent === null ? '' : parent, nameid: this.getIdentityAddress(parent) });
    }
    /** Parse canonical leaf data; callers resolve friendly names before calling. */
    static fromJSON(json, parent) {
        const result = new NameReservation({
            name: json.name,
            referral: (0, identityRegistrationSerialization_1.identityIDFromJSON)(json.referral == null ? '' : json.referral, 'Referral'),
            salt: (0, identityRegistrationSerialization_1.uint256FromHex)(json.salt, 'Salt')
        });
        result.validate();
        // Legacy metadata is not committed. Verify supplied nameid only against
        // explicit caller context, including the historical null-root exception.
        if (json.nameid != null) {
            if (parent === undefined)
                throw new Error('Legacy nameid metadata requires explicit parent context');
            if (json.nameid !== result.getIdentityAddress(parent))
                throw new Error('Reservation nameid does not match its name and parent');
        }
        return result;
    }
}
exports.NameReservation = NameReservation;
NameReservation.MAX_NAME_SIZE = identityRegistrationSerialization_1.MAX_IDENTITY_NAME_BYTES;
NameReservation.DEFAULT_OUTPUT_AMOUNT = 0;
