"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppAuthorizationRequestDetails = exports.AppAuthorizationOfferRole = void 0;
const bn_js_1 = require("bn.js");
const validation_1 = require("../../../utils/validation");
const identityRegistrationSerialization_1 = require("../../../pbaas/identityRegistrationSerialization");
const string_1 = require("../../../utils/string");
const varuint_1 = require("../../../utils/varuint");
const SerializableEntityBase_1 = require("../../../utils/types/SerializableEntityBase");
const SpendableKeyDetails_1 = require("../backup/SpendableKeyDetails");
const AuthorizationSerialization_1 = require("./AuthorizationSerialization");
const CompactAddressObject_1 = require("../CompactAddressObject");
var AppAuthorizationOfferRole;
(function (AppAuthorizationOfferRole) {
    AppAuthorizationOfferRole[AppAuthorizationOfferRole["STORAGE"] = 1] = "STORAGE";
    AppAuthorizationOfferRole[AppAuthorizationOfferRole["AUTHORITY"] = 2] = "AUTHORITY";
    AppAuthorizationOfferRole[AppAuthorizationOfferRole["REVOCATION"] = 3] = "REVOCATION";
    AppAuthorizationOfferRole[AppAuthorizationOfferRole["RECOVERY"] = 4] = "RECOVERY";
})(AppAuthorizationOfferRole || (exports.AppAuthorizationOfferRole = AppAuthorizationOfferRole = {}));
/** Payload only: admission must also validate the signed GenericRequest contract. */
class AppAuthorizationRequestDetails extends SerializableEntityBase_1.SerializableEntityBase {
    constructor(data = {}) {
        var _a, _b;
        super();
        (0, validation_1.rejectUnknownFields)(data, [
            "version",
            "flags",
            "gift",
            "offeredIdentities",
        ]);
        if ((data.version !== undefined && !bn_js_1.BN.isBN(data.version)) ||
            (data.flags !== undefined && !bn_js_1.BN.isBN(data.flags))) {
            throw new Error("Expected BN version and flags");
        }
        this.version = ((_a = data.version) !== null && _a !== void 0 ? _a : AppAuthorizationRequestDetails.VERSION_CURRENT).clone();
        this.gift = data.gift;
        this.offeredIdentities = data.offeredIdentities;
        this.flags = ((_b = data.flags) !== null && _b !== void 0 ? _b : AppAuthorizationRequestDetails.FLAGS_NONE).clone();
        if (data.flags === undefined) {
            if (data.gift !== undefined) {
                this.flags = this.flags.or(AppAuthorizationRequestDetails.FLAG_CONTAINS_GIFT);
            }
            if (data.offeredIdentities !== undefined) {
                this.flags = this.flags.or(AppAuthorizationRequestDetails.FLAG_CONTAINS_OFFERS);
            }
        }
        this.validate();
    }
    containsPermissions() {
        return !this.flags
            .and(AppAuthorizationRequestDetails.FLAG_CONTAINS_PERMISSIONS)
            .isZero();
    }
    /** Every offered identity is resolved on the enclosing request-signing system. */
    validate() {
        if (!bn_js_1.BN.isBN(this.version) ||
            this.version.lt(AppAuthorizationRequestDetails.VERSION_FIRST) ||
            this.version.gt(AppAuthorizationRequestDetails.VERSION_LAST) ||
            !bn_js_1.BN.isBN(this.flags) ||
            this.flags.lt(AppAuthorizationRequestDetails.FLAGS_NONE) ||
            !this.flags
                .and(AppAuthorizationRequestDetails.FLAGS_SUPPORTED)
                .eq(this.flags)) {
            throw new Error("Unsupported authorization version or flags");
        }
        if (!this.flags
            .and(AppAuthorizationRequestDetails.FLAG_CONTAINS_GIFT)
            .isZero() !==
            (this.gift !== undefined) ||
            !this.flags
                .and(AppAuthorizationRequestDetails.FLAG_CONTAINS_OFFERS)
                .isZero() !==
                (this.offeredIdentities !== undefined)) {
            throw new Error("Inconsistent authorization flags");
        }
        if (this.gift !== undefined &&
            (!(this.gift instanceof SpendableKeyDetails_1.SpendableKeyDetails) || !this.gift.isValid())) {
            throw new Error("Invalid authorization gift");
        }
        // Offers are a role inventory; adjacency does not assign storage authorities.
        if (this.offeredIdentities !== undefined) {
            if (!Array.isArray(this.offeredIdentities) ||
                !this.offeredIdentities.length) {
                throw new Error("Invalid offer count");
            }
            const seen = new Set();
            for (const offer of this.offeredIdentities) {
                (0, validation_1.rejectUnknownFields)(offer, ["role", "identity"]);
                if (!Number.isInteger(offer.role) ||
                    offer.role < AppAuthorizationOfferRole.STORAGE ||
                    offer.role > AppAuthorizationOfferRole.RECOVERY) {
                    throw new Error("Invalid offer");
                }
                CompactAddressObject_1.CompactIAddressObject.validateCompactIdentityAddress(offer.identity);
                const key = JSON.stringify([offer.role, offer.identity.address]);
                if (seen.has(key)) {
                    throw new Error("Duplicate role/identity offer");
                }
                seen.add(key);
            }
        }
    }
    isValid() {
        try {
            this.toBuffer();
            return true;
        }
        catch (_a) {
            return false;
        }
    }
    toBuffer() {
        this.validate();
        // Versions, flags and lengths use CompactSize.
        const parts = [
            varuint_1.default.encode(this.version.toNumber(), undefined, 0).buffer,
            varuint_1.default.encode(this.flags.toNumber(), undefined, 0).buffer,
        ];
        if (this.gift) {
            const bytes = this.gift.toBuffer();
            parts.push(varuint_1.default.encode(bytes.length, undefined, 0).buffer, bytes);
        }
        if (this.offeredIdentities) {
            parts.push(varuint_1.default.encode(this.offeredIdentities.length, undefined, 0).buffer);
            for (const offer of this.offeredIdentities) {
                parts.push(Buffer.from([offer.role]), offer.identity.toBuffer());
            }
        }
        return Buffer.concat(parts);
    }
    getByteLength() {
        return this.toBuffer().length;
    }
    fromBuffer(buffer, offset = 0, rootSystemName) {
        const reader = new AuthorizationSerialization_1.AuthorizationReader(buffer, offset);
        this.version = new bn_js_1.BN(reader.readCompactSize());
        if (this.version.lt(AppAuthorizationRequestDetails.VERSION_FIRST) ||
            this.version.gt(AppAuthorizationRequestDetails.VERSION_LAST)) {
            throw new Error("Unsupported authorization version");
        }
        this.flags = new bn_js_1.BN(reader.readCompactSize());
        if (!this.flags
            .and(AppAuthorizationRequestDetails.FLAGS_SUPPORTED)
            .eq(this.flags)) {
            throw new Error("Unsupported authorization flags");
        }
        this.gift = undefined;
        this.offeredIdentities = undefined;
        if (!this.flags
            .and(AppAuthorizationRequestDetails.FLAG_CONTAINS_GIFT)
            .isZero()) {
            // The declared length isolates the gift; admission size policy belongs to clients.
            const bytes = reader.readVarSlice();
            this.gift = new SpendableKeyDetails_1.SpendableKeyDetails();
            if (this.gift.fromBuffer(bytes) !== bytes.length) {
                throw new Error("Trailing gift bytes");
            }
        }
        if (!this.flags
            .and(AppAuthorizationRequestDetails.FLAG_CONTAINS_OFFERS)
            .isZero()) {
            // Each offer contains only a role byte and a canonical compact I-address.
            const count = reader.count(AuthorizationSerialization_1.ROLE_TAGGED_IDENTITY_ADDRESS_BYTE_LENGTH);
            this.offeredIdentities = [];
            for (let i = 0; i < count; i++) {
                this.offeredIdentities.push({
                    role: reader.readUInt8(),
                    identity: CompactAddressObject_1.CompactIAddressObject.fromAddress(reader.address(), rootSystemName),
                });
            }
        }
        // The ordinal wrapper must pass the complete, isolated payload to this parser.
        (0, identityRegistrationSerialization_1.checkPayloadEnd)(reader.offset, offset, buffer.length - offset);
        this.validate();
        return reader.offset;
    }
    toJson() {
        var _a, _b;
        this.validate();
        return {
            version: this.version.toNumber(),
            flags: this.flags.toNumber(),
            gift: (_a = this.gift) === null || _a === void 0 ? void 0 : _a.toJson(),
            offeredIdentities: (_b = this.offeredIdentities) === null || _b === void 0 ? void 0 : _b.map((o) => ({
                role: o.role,
                identity: o.identity.toJson(),
            })),
        };
    }
    static fromJson(json) {
        var _a;
        (0, validation_1.rejectUnknownFields)(json, [
            "version",
            "flags",
            "gift",
            "offeredIdentities",
        ]);
        if (json.gift && !(0, string_1.isHexString)(json.gift.data)) {
            throw new Error("Invalid gift bytes");
        }
        if (!Number.isSafeInteger(json.version) ||
            !Number.isSafeInteger(json.flags)) {
            throw new Error("Expected integer JSON version and flags");
        }
        return new AppAuthorizationRequestDetails(Object.assign(Object.assign({}, json), { version: new bn_js_1.BN(json.version), flags: new bn_js_1.BN(json.flags), gift: json.gift === undefined
                ? undefined
                : SpendableKeyDetails_1.SpendableKeyDetails.fromJson(json.gift), offeredIdentities: (_a = json.offeredIdentities) === null || _a === void 0 ? void 0 : _a.map((o) => {
                (0, validation_1.rejectUnknownFields)(o, ["role", "identity"]);
                return {
                    role: o.role,
                    identity: CompactAddressObject_1.CompactIAddressObject.compactIdentityAddressFromJson(o.identity),
                };
            }) }));
    }
}
exports.AppAuthorizationRequestDetails = AppAuthorizationRequestDetails;
AppAuthorizationRequestDetails.VERSION_INVALID = new bn_js_1.BN(0);
AppAuthorizationRequestDetails.VERSION_FIRST = new bn_js_1.BN(1);
AppAuthorizationRequestDetails.VERSION_LAST = new bn_js_1.BN(1);
AppAuthorizationRequestDetails.VERSION_CURRENT = new bn_js_1.BN(1);
AppAuthorizationRequestDetails.FLAGS_NONE = new bn_js_1.BN(0);
AppAuthorizationRequestDetails.FLAG_REQUIRES_SHARED_STORAGE = new bn_js_1.BN(1);
AppAuthorizationRequestDetails.FLAG_CONTAINS_GIFT = new bn_js_1.BN(2);
AppAuthorizationRequestDetails.FLAG_CONTAINS_OFFERS = new bn_js_1.BN(4);
AppAuthorizationRequestDetails.FLAG_CONTAINS_PERMISSIONS = new bn_js_1.BN(16);
AppAuthorizationRequestDetails.FLAGS_SUPPORTED = AppAuthorizationRequestDetails.FLAG_REQUIRES_SHARED_STORAGE.or(AppAuthorizationRequestDetails.FLAG_CONTAINS_GIFT).or(AppAuthorizationRequestDetails.FLAG_CONTAINS_OFFERS);
