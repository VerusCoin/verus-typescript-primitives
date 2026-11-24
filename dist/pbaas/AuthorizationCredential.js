"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorizationStorageBindingCredential = exports.AuthorizationCredential = void 0;
exports.deriveAppAuthorizationStorageManifest = deriveAppAuthorizationStorageManifest;
exports.verifyAppAuthorizationStorageManifest = verifyAppAuthorizationStorageManifest;
const keys_1 = require("../vdxf/keys");
const validation_1 = require("../utils/validation");
const serialization_1 = require("../utils/serialization");
const varuint_1 = require("../utils/varuint");
const address_1 = require("../utils/address");
const vdxf_1 = require("../constants/vdxf");
const AppAuthorizationGrant_1 = require("./AppAuthorizationGrant");
const bn_js_1 = require("bn.js");
const hash_1 = require("../utils/hash");
const Credential_1 = require("./Credential");
const STORAGE_BINDING_MANIFEST_TYPE = 1;
function withCanonicalGrantID(data) {
    const grantID = data.grantID.toLowerCase();
    return grantID === data.grantID ? data : Object.assign(Object.assign({}, data), { grantID });
}
function version(value, first, last) {
    if (!bn_js_1.BN.isBN(value) || value.lt(first) || value.gt(last)) {
        throw new Error("Unsupported credential version");
    }
    return value.toNumber();
}
/** Both the delegate and delegator retain an immutable approval-time baseline. */
function revisionToPayload(revision) {
    (0, validation_1.rejectUnknownFields)(revision, ["txid", "vout"]);
    return [
        (0, validation_1.normalizeFixedLengthHex)(revision.txid, 32),
        (0, validation_1.assertUint32)(revision.vout),
    ];
}
function revisionFromPayload(payload) {
    if (!Array.isArray(payload) || payload.length !== 2) {
        throw new Error("Invalid approval identity revision");
    }
    return { txid: payload[0], vout: payload[1] };
}
/** Decode only from a validated generic record; source U/system remains the caller's binding. */
function credentialPayload(record, expectedKey) {
    (0, address_1.decodeDestination)(expectedKey, vdxf_1.I_ADDR_VERSION);
    if (record.credentialKey !== expectedKey ||
        !record.flags.eq(record.calcFlags()) ||
        !record.isValid()) {
        throw new Error("Invalid authorization credential envelope");
    }
    (0, validation_1.rejectUnknownFields)(record.scopes, []);
    return record.credential;
}
/**
 * Typed records use their registered VDXF credential keys by default.
 * Explicit keys remain supported for callers using a separate namespace.
 */
class AuthorizationRecord {
    constructor(data, credentialKey) {
        this.data = data;
        this.credentialKey = credentialKey;
    }
    toCredential(credentialKey = this.credentialKey, label = "") {
        (0, address_1.decodeDestination)(credentialKey, vdxf_1.I_ADDR_VERSION);
        // Revalidate mutable data before emitting the compact, Core-compatible payload.
        const payload = this.toPayload();
        const record = new Credential_1.Credential({
            version: new bn_js_1.BN(Credential_1.Credential.VERSION_CURRENT),
            credentialKey,
            credential: payload,
            scopes: {},
            label,
        });
        // Credential already enforces Core's text bounds during construction.
        if (!record.isValid()) {
            throw new Error("Invalid authorization credential");
        }
        return record;
    }
}
AuthorizationRecord.VERSION_INVALID = new bn_js_1.BN(0);
AuthorizationRecord.VERSION_FIRST = new bn_js_1.BN(1);
AuthorizationRecord.VERSION_LAST = new bn_js_1.BN(1);
AuthorizationRecord.VERSION_CURRENT = new bn_js_1.BN(1);
/** Compact approval metadata with distinct delegate and delegator revision baselines. */
class AuthorizationCredential extends AuthorizationRecord {
    constructor(data) {
        super(data, AuthorizationCredential.CREDENTIAL_KEY);
        this.toPayload();
        this.data = withCanonicalGrantID(data);
    }
    getDelegateSystemID(rootSystemID) {
        return (0, AppAuthorizationGrant_1.resolveDelegateSystemID)(this.data.delegateSystemID, rootSystemID);
    }
    getDelegatorSystemID(rootSystemID) {
        return (0, AppAuthorizationGrant_1.resolveDelegatorSystemID)(this.data.delegatorSystemID, this.data.delegateSystemID, rootSystemID);
    }
    containsPermissions() {
        return !this.data.flags
            .and(AuthorizationCredential.FLAG_CONTAINS_PERMISSIONS)
            .isZero();
    }
    toPayload() {
        const d = this.data;
        (0, validation_1.rejectUnknownFields)(d, [
            "version",
            "flags",
            "grantID",
            "delegateSystemID",
            "delegatorSystemID",
            "delegateRevision",
            "delegatorRevision",
            "storageManifestHash",
        ]);
        for (const systemID of [d.delegateSystemID, d.delegatorSystemID]) {
            if (systemID !== undefined) {
                (0, address_1.decodeDestination)(systemID, vdxf_1.I_ADDR_VERSION);
            }
        }
        if (!bn_js_1.BN.isBN(d.flags) ||
            (!d.flags.eq(AuthorizationCredential.FLAGS_NONE) &&
                !d.flags.eq(AuthorizationCredential.FLAG_CONTAINS_STORAGE_BINDINGS)) ||
            !d.flags
                .and(AuthorizationCredential.FLAG_CONTAINS_STORAGE_BINDINGS)
                .isZero() !==
                (d.storageManifestHash !== undefined)) {
            throw new Error("Unsupported or inconsistent authorization flags");
        }
        return Object.assign(Object.assign(Object.assign(Object.assign({ v: version(d.version, AuthorizationCredential.VERSION_FIRST, AuthorizationCredential.VERSION_LAST), f: d.flags.toNumber(), g: (0, validation_1.normalizeFixedLengthHex)(d.grantID, 32) }, (d.delegateSystemID === undefined ? {} : { s: d.delegateSystemID })), (d.delegatorSystemID !== undefined &&
            d.delegatorSystemID !== d.delegateSystemID
            ? { sd: d.delegatorSystemID }
            : {})), { de: revisionToPayload(d.delegateRevision), dr: revisionToPayload(d.delegatorRevision) }), (d.storageManifestHash === undefined
            ? {}
            : { m: (0, validation_1.normalizeFixedLengthHex)(d.storageManifestHash, 32) }));
    }
    static fromCredential(record, expectedKey = AuthorizationCredential.CREDENTIAL_KEY) {
        return this.fromPayload(credentialPayload(record, expectedKey));
    }
    static fromPayload(payload) {
        (0, validation_1.rejectUnknownFields)(payload, ["v", "f", "g", "s", "sd", "de", "dr", "m"]);
        return new AuthorizationCredential({
            version: new bn_js_1.BN((0, validation_1.assertUint32)(payload.v)),
            flags: new bn_js_1.BN((0, validation_1.assertUint32)(payload.f)),
            grantID: payload.g,
            delegateSystemID: payload.s,
            delegatorSystemID: payload.sd,
            delegateRevision: revisionFromPayload(payload.de),
            delegatorRevision: revisionFromPayload(payload.dr),
            storageManifestHash: payload.m,
        });
    }
}
exports.AuthorizationCredential = AuthorizationCredential;
AuthorizationCredential.CREDENTIAL_KEY = keys_1.IDENTITY_CREDENTIAL_APPLICATION_AUTHORIZATION.vdxfid;
AuthorizationCredential.FLAGS_NONE = new bn_js_1.BN(0);
AuthorizationCredential.FLAG_CONTAINS_PERMISSIONS = new bn_js_1.BN(1);
AuthorizationCredential.FLAG_CONTAINS_STORAGE_BINDINGS = new bn_js_1.BN(2);
/** One independently manageable storage identity, bound to its authorization grant. */
class AuthorizationStorageBindingCredential extends AuthorizationRecord {
    constructor(data) {
        super(data, AuthorizationStorageBindingCredential.CREDENTIAL_KEY);
        this.toPayload();
        this.data = withCanonicalGrantID(data);
    }
    /** The caller supplies the resolved delegate system, or the network root for an orphan. */
    getSystemID(defaultSystemID) {
        const systemID = this.data.storageSystemID === undefined
            ? defaultSystemID
            : this.data.storageSystemID;
        if (systemID === undefined) {
            throw new Error("A storage system or inherited system is required");
        }
        (0, address_1.decodeDestination)(systemID, vdxf_1.I_ADDR_VERSION);
        return systemID;
    }
    get recordID() {
        return `${STORAGE_BINDING_MANIFEST_TYPE}:${this.data.relationshipIndex}`;
    }
    toPayload() {
        const d = this.data;
        (0, validation_1.rejectUnknownFields)(d, [
            "version",
            "grantID",
            "relationshipIndex",
            "storageSystemID",
            "storageID",
        ]);
        if (d.storageSystemID !== undefined) {
            (0, address_1.decodeDestination)(d.storageSystemID, vdxf_1.I_ADDR_VERSION);
        }
        (0, address_1.decodeDestination)(d.storageID, vdxf_1.I_ADDR_VERSION);
        return Object.assign(Object.assign({ v: version(d.version, AuthorizationStorageBindingCredential.VERSION_FIRST, AuthorizationStorageBindingCredential.VERSION_LAST), g: (0, validation_1.normalizeFixedLengthHex)(d.grantID, 32), i: (0, validation_1.assertUint32)(d.relationshipIndex) }, (d.storageSystemID === undefined ? {} : { s: d.storageSystemID })), { d: d.storageID });
    }
    static fromCredential(record, expectedKey = AuthorizationStorageBindingCredential.CREDENTIAL_KEY) {
        return this.fromPayload(credentialPayload(record, expectedKey));
    }
    static fromPayload(p) {
        (0, validation_1.rejectUnknownFields)(p, ["v", "g", "i", "s", "d"]);
        return new AuthorizationStorageBindingCredential({
            version: new bn_js_1.BN((0, validation_1.assertUint32)(p.v)),
            grantID: p.g,
            relationshipIndex: p.i,
            storageSystemID: p.s,
            storageID: p.d,
        });
    }
}
exports.AuthorizationStorageBindingCredential = AuthorizationStorageBindingCredential;
AuthorizationStorageBindingCredential.CREDENTIAL_KEY = keys_1.IDENTITY_CREDENTIAL_APPLICATION_AUTHORIZATION_STORAGE_BINDING.vdxfid;
/** Validate the complete binding set, collapse identical copies, and commit canonical bytes. */
function deriveAppAuthorizationStorageManifest(records, defaultSystemID) {
    const unique = new Map();
    let grant;
    // Copies must agree on their effective systems, regardless of whether s was omitted.
    // Put s first in both comparisons to keep JSON property order deterministic.
    for (const record of records) {
        if (!(record instanceof AuthorizationStorageBindingCredential)) {
            throw new Error("Unknown storage record");
        }
        const payload = Object.assign({ s: record.getSystemID(defaultSystemID) }, record.toPayload());
        const currentGrant = (0, validation_1.normalizeFixedLengthHex)(record.data.grantID, 32);
        if (grant !== undefined && grant !== currentGrant) {
            throw new Error("Mixed grant records");
        }
        grant = currentGrant;
        const previous = unique.get(record.recordID);
        if (previous &&
            JSON.stringify(Object.assign({ s: previous.getSystemID(defaultSystemID) }, previous.toPayload())) !== JSON.stringify(payload)) {
            throw new Error("Conflicting storage record");
        }
        unique.set(record.recordID, record);
    }
    // Sort indices numerically; lexical sorting would place relationship 10 before 2.
    const bindings = [...unique.values()].sort((a, b) => a.data.relationshipIndex - b.data.relationshipIndex);
    if (!bindings.length) {
        throw new Error("Empty storage manifest");
    }
    const storageIDs = new Set();
    bindings.forEach((binding, index) => {
        const { data } = binding;
        if (data.relationshipIndex !== index) {
            throw new Error("Noncontiguous relationships");
        }
        const identity = `${binding.getSystemID(defaultSystemID)}:${data.storageID}`;
        if (storageIDs.has(identity)) {
            throw new Error("Duplicate storage identity");
        }
        storageIDs.add(identity);
    });
    // The discriminator identifies the binding format within this commitment.
    // Commit decoded address IDs and little-endian indices, excluding JSON/encryption.
    const encoded = bindings.map((binding) => {
        const { data: d } = binding;
        return Buffer.concat([
            Buffer.from([STORAGE_BINDING_MANIFEST_TYPE]),
            (0, serialization_1.encodeUInt32LE)(d.relationshipIndex),
            (0, validation_1.decodeFixedLengthHex)(d.grantID, 32),
            (0, address_1.decodeDestination)(binding.getSystemID(defaultSystemID), vdxf_1.I_ADDR_VERSION),
            (0, address_1.decodeDestination)(d.storageID, vdxf_1.I_ADDR_VERSION),
        ]);
    });
    // Length-prefix each record to preserve unambiguous framing across implementations.
    return (0, hash_1.hashData)(Buffer.concat([
        Buffer.from("VerusAppAuthorizationStorage/v1\0"),
        varuint_1.default.encode(encoded.length, undefined, 0).buffer,
        ...encoded.flatMap((bytes) => [
            varuint_1.default.encode(bytes.length, undefined, 0).buffer,
            bytes,
        ]),
    ])).toString("hex");
}
/** Verify the committed set against this grant, including its grant ID. */
function verifyAppAuthorizationStorageManifest(grant, records, rootSystemID) {
    try {
        grant.toPayload();
        if (grant.data.flags
            .and(AuthorizationCredential.FLAG_CONTAINS_STORAGE_BINDINGS)
            .isZero()) {
            return records.length === 0;
        }
        if (records.some((record) => (0, validation_1.normalizeFixedLengthHex)(record.data.grantID, 32) !==
            (0, validation_1.normalizeFixedLengthHex)(grant.data.grantID, 32))) {
            return false;
        }
        return (deriveAppAuthorizationStorageManifest(records, grant.getDelegateSystemID(rootSystemID)) === (0, validation_1.normalizeFixedLengthHex)(grant.data.storageManifestHash, 32));
    }
    catch (_a) {
        return false;
    }
}
