"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppAuthorizationResponseDetails = exports.AppAuthorizationOutcome = void 0;
const bn_js_1 = require("bn.js");
const validation_1 = require("../../../utils/validation");
const identityRegistrationSerialization_1 = require("../../../pbaas/identityRegistrationSerialization");
const varuint_1 = require("../../../utils/varuint");
const address_1 = require("../../../utils/address");
const vdxf_1 = require("../../../constants/vdxf");
const SerializableEntityBase_1 = require("../../../utils/types/SerializableEntityBase");
const AuthorizationSerialization_1 = require("./AuthorizationSerialization");
const CompactAddressObject_1 = require("../CompactAddressObject");
var AppAuthorizationOutcome;
(function (AppAuthorizationOutcome) {
    AppAuthorizationOutcome[AppAuthorizationOutcome["SUCCESS"] = 0] = "SUCCESS";
    AppAuthorizationOutcome[AppAuthorizationOutcome["REJECTED"] = 1] = "REJECTED";
    AppAuthorizationOutcome[AppAuthorizationOutcome["CANCELLED"] = 2] = "CANCELLED";
    AppAuthorizationOutcome[AppAuthorizationOutcome["FAILED"] = 3] = "FAILED";
    AppAuthorizationOutcome[AppAuthorizationOutcome["EXPIRED"] = 4] = "EXPIRED";
})(AppAuthorizationOutcome || (exports.AppAuthorizationOutcome = AppAuthorizationOutcome = {}));
/** Signed completion metadata; it does not replace fresh authorization-state checks. */
class AppAuthorizationResponseDetails extends SerializableEntityBase_1.SerializableEntityBase {
    constructor(data) {
        var _a, _b;
        super();
        this.version = AppAuthorizationResponseDetails.VERSION_CURRENT.clone();
        this.flags = AppAuthorizationResponseDetails.FLAGS_NONE.clone();
        if (data) {
            (0, validation_1.rejectUnknownFields)(data, [
                "version",
                "flags",
                "outcome",
                "requestSigningSystemID",
                "delegateID",
                "grantID",
                "storageBindings",
                "grantTransaction",
            ]);
            Object.assign(this, data);
            if ((data.version !== undefined && !bn_js_1.BN.isBN(data.version)) ||
                (data.flags !== undefined && !bn_js_1.BN.isBN(data.flags))) {
                throw new Error("Expected BN version and flags");
            }
            this.version = ((_a = data.version) !== null && _a !== void 0 ? _a : AppAuthorizationResponseDetails.VERSION_CURRENT).clone();
            this.flags = ((_b = data.flags) !== null && _b !== void 0 ? _b : AppAuthorizationResponseDetails.FLAGS_NONE).clone();
            if (data.flags === undefined) {
                if (data.grantID !== undefined) {
                    this.flags = this.flags.or(AppAuthorizationResponseDetails.FLAG_CONTAINS_GRANT_ID);
                }
                if (data.storageBindings !== undefined) {
                    this.flags = this.flags.or(AppAuthorizationResponseDetails.FLAG_CONTAINS_STORAGE_BINDINGS);
                }
                if (data.grantTransaction !== undefined) {
                    this.flags = this.flags.or(AppAuthorizationResponseDetails.FLAG_CONTAINS_GRANT_TRANSACTION);
                }
            }
            this.validate();
            if (this.grantID !== undefined) {
                this.grantID = this.grantID.toLowerCase();
            }
        }
    }
    /** Pass the original request requirement when validating a successful response. */
    validate(requiresSharedStorage = false) {
        var _a;
        if (!bn_js_1.BN.isBN(this.version) ||
            this.version.lt(AppAuthorizationResponseDetails.VERSION_FIRST) ||
            this.version.gt(AppAuthorizationResponseDetails.VERSION_LAST) ||
            !bn_js_1.BN.isBN(this.flags) ||
            this.flags.lt(AppAuthorizationResponseDetails.FLAGS_NONE) ||
            !this.flags
                .and(AppAuthorizationResponseDetails.FLAGS_SUPPORTED)
                .eq(this.flags) ||
            !Number.isInteger(this.outcome) ||
            this.outcome < AppAuthorizationOutcome.SUCCESS ||
            this.outcome > AppAuthorizationOutcome.EXPIRED) {
            throw new Error("Unsupported response version, flags or outcome");
        }
        (0, address_1.decodeDestination)(this.requestSigningSystemID, vdxf_1.I_ADDR_VERSION);
        (0, address_1.decodeDestination)(this.delegateID, vdxf_1.I_ADDR_VERSION);
        if (!this.flags
            .and(AppAuthorizationResponseDetails.FLAG_CONTAINS_GRANT_ID)
            .isZero() !==
            (this.grantID !== undefined) ||
            !this.flags
                .and(AppAuthorizationResponseDetails.FLAG_CONTAINS_STORAGE_BINDINGS)
                .isZero() !==
                (this.storageBindings !== undefined) ||
            !this.flags
                .and(AppAuthorizationResponseDetails.FLAG_CONTAINS_GRANT_TRANSACTION)
                .isZero() !==
                (this.grantTransaction !== undefined)) {
            throw new Error("Inconsistent response presence flags");
        }
        // Only completed success may claim a grant or its selected storage arrangement.
        if (this.outcome !== AppAuthorizationOutcome.SUCCESS &&
            !this.flags.eq(AppAuthorizationResponseDetails.FLAGS_NONE)) {
            throw new Error("Non-success response contains active grant data");
        }
        if (this.outcome === AppAuthorizationOutcome.SUCCESS &&
            (this.grantID === undefined ||
                (requiresSharedStorage && !((_a = this.storageBindings) === null || _a === void 0 ? void 0 : _a.length)))) {
            throw new Error("Incomplete success response");
        }
        if (this.grantID !== undefined) {
            (0, validation_1.decodeFixedLengthHex)(this.grantID, 32);
        }
        if (this.grantTransaction !== undefined) {
            (0, validation_1.rejectUnknownFields)(this.grantTransaction, ["txid", "vout"]);
            (0, validation_1.decodeFixedLengthHex)(this.grantTransaction.txid, 32);
            (0, validation_1.assertUint32)(this.grantTransaction.vout);
        }
        if (this.storageBindings !== undefined) {
            if (!Array.isArray(this.storageBindings) ||
                !this.storageBindings.length) {
                throw new Error("Invalid storage binding count");
            }
            const storageIDs = new Set();
            for (const binding of this.storageBindings) {
                (0, validation_1.rejectUnknownFields)(binding, [
                    "storageIdentity",
                    "revocationIdentity",
                    "recoveryIdentity",
                ]);
                // Selected storage and its authorities use the original request-signing system.
                for (const identityAddress of [
                    binding.storageIdentity,
                    binding.revocationIdentity,
                    binding.recoveryIdentity,
                ]) {
                    CompactAddressObject_1.CompactIAddressObject.validateCompactIdentityAddress(identityAddress);
                }
                const id = binding.storageIdentity.address;
                if (storageIDs.has(id)) {
                    throw new Error("Duplicate storage binding");
                }
                storageIDs.add(id);
            }
            for (const binding of this.storageBindings) {
                if (storageIDs.has(binding.revocationIdentity.address) ||
                    storageIDs.has(binding.recoveryIdentity.address)) {
                    throw new Error("Shared storage cannot be a revocation or recovery authority");
                }
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
        const parts = [
            varuint_1.default.encode(this.version.toNumber(), undefined, 0).buffer,
            varuint_1.default.encode(this.flags.toNumber(), undefined, 0).buffer,
            Buffer.from([this.outcome]),
            CompactAddressObject_1.CompactIAddressObject.fromAddress(this.requestSigningSystemID).toBuffer(),
            CompactAddressObject_1.CompactIAddressObject.fromAddress(this.delegateID).toBuffer(),
        ];
        if (this.grantID !== undefined) {
            parts.push((0, validation_1.decodeFixedLengthHex)(this.grantID, 32));
        }
        if (this.storageBindings !== undefined) {
            parts.push(varuint_1.default.encode(this.storageBindings.length, undefined, 0).buffer);
            for (const b of this.storageBindings) {
                parts.push(b.storageIdentity.toBuffer(), b.revocationIdentity.toBuffer(), b.recoveryIdentity.toBuffer());
            }
        }
        if (this.grantTransaction !== undefined) {
            // RPC transaction hashes are displayed opposite to their standard wire order.
            const index = Buffer.alloc(4);
            index.writeUInt32LE(this.grantTransaction.vout);
            parts.push(Buffer.from((0, validation_1.decodeFixedLengthHex)(this.grantTransaction.txid, 32)).reverse(), index);
        }
        return Buffer.concat(parts);
    }
    getByteLength() {
        return this.toBuffer().length;
    }
    fromBuffer(buffer, offset = 0, rootSystemName) {
        const reader = new AuthorizationSerialization_1.AuthorizationReader(buffer, offset);
        this.version = new bn_js_1.BN(reader.readCompactSize());
        if (this.version.lt(AppAuthorizationResponseDetails.VERSION_FIRST) ||
            this.version.gt(AppAuthorizationResponseDetails.VERSION_LAST)) {
            throw new Error("Unsupported response payload");
        }
        this.flags = new bn_js_1.BN(reader.readCompactSize());
        if (!this.flags
            .and(AppAuthorizationResponseDetails.FLAGS_SUPPORTED)
            .eq(this.flags)) {
            throw new Error("Unknown response flags");
        }
        this.outcome = reader.readUInt8();
        this.requestSigningSystemID = reader.address();
        this.delegateID = reader.address();
        this.grantID = !this.flags
            .and(AppAuthorizationResponseDetails.FLAG_CONTAINS_GRANT_ID)
            .isZero()
            ? reader.readSlice(32).toString("hex")
            : undefined;
        this.storageBindings = undefined;
        if (!this.flags
            .and(AppAuthorizationResponseDetails.FLAG_CONTAINS_STORAGE_BINDINGS)
            .isZero()) {
            // A binding is exactly three canonical compact I-addresses: S, R, then C.
            const count = reader.count(AuthorizationSerialization_1.STORAGE_BINDING_BYTE_LENGTH);
            this.storageBindings = [];
            for (let i = 0; i < count; i++) {
                this.storageBindings.push({
                    storageIdentity: CompactAddressObject_1.CompactIAddressObject.fromAddress(reader.address(), rootSystemName),
                    revocationIdentity: CompactAddressObject_1.CompactIAddressObject.fromAddress(reader.address(), rootSystemName),
                    recoveryIdentity: CompactAddressObject_1.CompactIAddressObject.fromAddress(reader.address(), rootSystemName),
                });
            }
        }
        this.grantTransaction = !this.flags
            .and(AppAuthorizationResponseDetails.FLAG_CONTAINS_GRANT_TRANSACTION)
            .isZero()
            ? {
                txid: Buffer.from(reader.readSlice(32)).reverse().toString("hex"),
                vout: reader.readUInt32(),
            }
            : undefined;
        (0, identityRegistrationSerialization_1.checkPayloadEnd)(reader.offset, offset, buffer.length - offset);
        this.validate();
        return reader.offset;
    }
    toJson() {
        var _a;
        this.validate();
        return {
            version: this.version.toNumber(),
            flags: this.flags.toNumber(),
            outcome: this.outcome,
            requestSigningSystemID: this.requestSigningSystemID,
            delegateID: this.delegateID,
            grantID: this.grantID,
            grantTransaction: this.grantTransaction && Object.assign({}, this.grantTransaction),
            storageBindings: (_a = this.storageBindings) === null || _a === void 0 ? void 0 : _a.map((b) => ({
                storageIdentity: b.storageIdentity.toJson(),
                revocationIdentity: b.revocationIdentity.toJson(),
                recoveryIdentity: b.recoveryIdentity.toJson(),
            })),
        };
    }
    static fromJson(json) {
        var _a;
        (0, validation_1.rejectUnknownFields)(json, [
            "version",
            "flags",
            "outcome",
            "requestSigningSystemID",
            "delegateID",
            "grantID",
            "storageBindings",
            "grantTransaction",
        ]);
        if (!Number.isSafeInteger(json.version) ||
            !Number.isSafeInteger(json.flags)) {
            throw new Error("Expected integer JSON version and flags");
        }
        return new AppAuthorizationResponseDetails(Object.assign(Object.assign({}, json), { version: new bn_js_1.BN(json.version), flags: new bn_js_1.BN(json.flags), storageBindings: (_a = json.storageBindings) === null || _a === void 0 ? void 0 : _a.map((b) => {
                (0, validation_1.rejectUnknownFields)(b, [
                    "storageIdentity",
                    "revocationIdentity",
                    "recoveryIdentity",
                ]);
                return {
                    storageIdentity: CompactAddressObject_1.CompactIAddressObject.compactIdentityAddressFromJson(b.storageIdentity),
                    revocationIdentity: CompactAddressObject_1.CompactIAddressObject.compactIdentityAddressFromJson(b.revocationIdentity),
                    recoveryIdentity: CompactAddressObject_1.CompactIAddressObject.compactIdentityAddressFromJson(b.recoveryIdentity),
                };
            }) }));
    }
}
exports.AppAuthorizationResponseDetails = AppAuthorizationResponseDetails;
AppAuthorizationResponseDetails.VERSION_INVALID = new bn_js_1.BN(0);
AppAuthorizationResponseDetails.VERSION_FIRST = new bn_js_1.BN(1);
AppAuthorizationResponseDetails.VERSION_LAST = new bn_js_1.BN(1);
AppAuthorizationResponseDetails.VERSION_CURRENT = new bn_js_1.BN(1);
AppAuthorizationResponseDetails.FLAGS_NONE = new bn_js_1.BN(0);
AppAuthorizationResponseDetails.FLAG_CONTAINS_GRANT_ID = new bn_js_1.BN(1);
AppAuthorizationResponseDetails.FLAG_CONTAINS_STORAGE_BINDINGS = new bn_js_1.BN(2);
AppAuthorizationResponseDetails.FLAG_CONTAINS_GRANT_TRANSACTION = new bn_js_1.BN(4);
AppAuthorizationResponseDetails.FLAGS_SUPPORTED = AppAuthorizationResponseDetails.FLAG_CONTAINS_GRANT_ID.or(AppAuthorizationResponseDetails.FLAG_CONTAINS_STORAGE_BINDINGS).or(AppAuthorizationResponseDetails.FLAG_CONTAINS_GRANT_TRANSACTION);
