"use strict";
/**
 * ProvisioningIdentity - Class for handling identity provisioning requests
 *
 * This class is used when an application is requesting the provisioning or creation of a new identity
 * within the Verus blockchain ecosystem. The request includes:
 * - System ID (e.g., VRSC@) defining the blockchain system
 * - Parent ID (e.g., Token@) defining the parent namespace
 * - Identity ID (e.g., john.VRSC@) defining the full identity to be provisioned
 * - Flags indicating which components are present and required
 *
 * The user's wallet can use these parameters to understand the complete identity hierarchy
 * and present a clear provisioning request to the user, showing the system context,
 * parent namespace, and the specific identity being created. This enables secure,
 * user-controlled identity provisioning with proper namespace management.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProvisionIdentityDetails = void 0;
const bufferutils_1 = require("../../../utils/bufferutils");
const SerializableEntityBase_1 = require("../../../utils/types/SerializableEntityBase");
const bn_js_1 = require("bn.js");
const CompactAddressObject_1 = require("../CompactAddressObject");
const varuint_1 = require("../../../utils/varuint");
const RequestURI_1 = require("../RequestURI");
class ProvisionIdentityDetails extends SerializableEntityBase_1.SerializableEntityBase {
    constructor(data) {
        super();
        this.version = (data === null || data === void 0 ? void 0 : data.version) || ProvisionIdentityDetails.DEFAULT_VERSION;
        this.flags = (data === null || data === void 0 ? void 0 : data.flags) || new bn_js_1.BN(0, 10);
        this.uri = data === null || data === void 0 ? void 0 : data.uri;
        this.systemID = data === null || data === void 0 ? void 0 : data.systemID;
        this.parentID = data === null || data === void 0 ? void 0 : data.parentID;
        this.identityID = data === null || data === void 0 ? void 0 : data.identityID;
        this.setFlags();
    }
    hasSystemId() {
        return this.flags.and(ProvisionIdentityDetails.FLAG_HAS_SYSTEMID).eq(ProvisionIdentityDetails.FLAG_HAS_SYSTEMID);
    }
    hasParentId() {
        return this.flags.and(ProvisionIdentityDetails.FLAG_HAS_PARENTID).eq(ProvisionIdentityDetails.FLAG_HAS_PARENTID);
    }
    hasIdentityId() {
        return this.flags.and(ProvisionIdentityDetails.FLAG_HAS_IDENTITY_ID).eq(ProvisionIdentityDetails.FLAG_HAS_IDENTITY_ID);
    }
    hasUri() {
        return this.flags.and(ProvisionIdentityDetails.FLAG_HAS_URI).eq(ProvisionIdentityDetails.FLAG_HAS_URI);
    }
    getByteLength() {
        let length = 0;
        length += varuint_1.default.encodingLength(this.flags.toNumber());
        if (this.hasUri()) {
            if (this.uri == null)
                throw new Error("Missing uri for ProvisionIdentityDetails with FLAG_HAS_URI set");
            length += this.uri.getByteLength();
        }
        if (this.hasSystemId()) {
            length += this.systemID.getByteLength();
        }
        if (this.hasParentId()) {
            length += this.parentID.getByteLength();
        }
        if (this.hasIdentityId()) {
            length += this.identityID.getByteLength();
        }
        return length;
    }
    toBuffer() {
        const writer = new bufferutils_1.default.BufferWriter(Buffer.alloc(this.getByteLength()));
        writer.writeCompactSize(this.flags.toNumber());
        if (this.hasUri()) {
            if (this.uri == null)
                throw new Error("Missing uri for ProvisionIdentityDetails with FLAG_HAS_URI set");
            writer.writeSlice(this.uri.toBuffer());
        }
        if (this.hasSystemId()) {
            writer.writeSlice(this.systemID.toBuffer());
        }
        if (this.hasParentId()) {
            writer.writeSlice(this.parentID.toBuffer());
        }
        if (this.hasIdentityId()) {
            writer.writeSlice(this.identityID.toBuffer());
        }
        return writer.buffer;
    }
    fromBuffer(buffer, offset, rootSystemName = 'VRSC') {
        const reader = new bufferutils_1.default.BufferReader(buffer, offset);
        if (buffer.length == 0)
            throw new Error("Cannot create provision identity from empty buffer");
        this.flags = new bn_js_1.BN(reader.readCompactSize());
        if (this.hasUri()) {
            this.uri = new RequestURI_1.RequestURI();
            reader.offset = this.uri.fromBuffer(reader.buffer, reader.offset);
        }
        else {
            this.uri = undefined;
        }
        if (this.hasSystemId()) {
            const systemID = new CompactAddressObject_1.CompactIAddressObject({ type: CompactAddressObject_1.CompactIAddressObject.TYPE_I_ADDRESS, address: '', rootSystemName });
            reader.offset = systemID.fromBuffer(reader.buffer, reader.offset);
            this.systemID = systemID;
        }
        if (this.hasParentId()) {
            const parentID = new CompactAddressObject_1.CompactIAddressObject({ type: CompactAddressObject_1.CompactIAddressObject.TYPE_I_ADDRESS, address: '', rootSystemName });
            reader.offset = parentID.fromBuffer(reader.buffer, reader.offset);
            this.parentID = parentID;
        }
        if (this.hasIdentityId()) {
            const identityID = new CompactAddressObject_1.CompactIAddressObject({ type: CompactAddressObject_1.CompactIAddressObject.TYPE_I_ADDRESS, address: '', rootSystemName });
            reader.offset = identityID.fromBuffer(reader.buffer, reader.offset);
            this.identityID = identityID;
        }
        return reader.offset;
    }
    toJson() {
        return {
            version: this.version.toNumber(),
            flags: this.flags.toNumber(),
            uri: this.uri ? this.uri.toJson() : null,
            systemid: this.systemID ? this.systemID.toJson() : null,
            parentid: this.parentID ? this.parentID.toJson() : null,
            identityid: this.identityID ? this.identityID.toJson() : null,
        };
    }
    static fromJson(data) {
        const provision = new ProvisionIdentityDetails();
        provision.version = new bn_js_1.BN((data === null || data === void 0 ? void 0 : data.version) || 0);
        provision.flags = new bn_js_1.BN((data === null || data === void 0 ? void 0 : data.flags) || 0);
        if (provision.hasUri()) {
            if ((data === null || data === void 0 ? void 0 : data.uri) == null) {
                throw new Error("Missing uri for ProvisionIdentityDetails with FLAG_HAS_URI set");
            }
            provision.uri = RequestURI_1.RequestURI.fromJson(data.uri);
        }
        if (provision.hasSystemId()) {
            provision.systemID = CompactAddressObject_1.CompactIAddressObject.fromCompactAddressObjectJson(data.systemid);
        }
        if (provision.hasParentId()) {
            provision.parentID = CompactAddressObject_1.CompactIAddressObject.fromCompactAddressObjectJson(data.parentid);
        }
        if (provision.hasIdentityId()) {
            provision.identityID = CompactAddressObject_1.CompactIAddressObject.fromCompactAddressObjectJson(data.identityid);
        }
        return provision;
    }
    calcFlags() {
        let flags = new bn_js_1.BN(this.flags);
        if (this.systemID) {
            flags = flags.or(ProvisionIdentityDetails.FLAG_HAS_SYSTEMID);
        }
        if (this.parentID) {
            flags = flags.or(ProvisionIdentityDetails.FLAG_HAS_PARENTID);
        }
        if (this.identityID) {
            flags = flags.or(ProvisionIdentityDetails.FLAG_HAS_IDENTITY_ID);
        }
        if (this.uri) {
            flags = flags.or(ProvisionIdentityDetails.FLAG_HAS_URI);
        }
        return flags;
    }
    setFlags() {
        this.flags = this.calcFlags();
    }
    isValid() {
        let valid = this.flags != null && this.flags.gte(new bn_js_1.BN(0));
        valid && (valid = this.version != null);
        if (this.hasUri()) {
            valid && (valid = this.uri != null);
        }
        return valid;
    }
}
exports.ProvisionIdentityDetails = ProvisionIdentityDetails;
// Version
ProvisionIdentityDetails.DEFAULT_VERSION = new bn_js_1.BN(1, 10);
ProvisionIdentityDetails.VERSION_FIRSTVALID = new bn_js_1.BN(1, 10);
ProvisionIdentityDetails.VERSION_LASTVALID = new bn_js_1.BN(1, 10);
// flags include params // parent same as signer
ProvisionIdentityDetails.FLAG_HAS_SYSTEMID = new bn_js_1.BN(1, 10);
ProvisionIdentityDetails.FLAG_HAS_PARENTID = new bn_js_1.BN(2, 10);
ProvisionIdentityDetails.FLAG_HAS_IDENTITY_ID = new bn_js_1.BN(4, 10);
ProvisionIdentityDetails.FLAG_HAS_URI = new bn_js_1.BN(8, 10);
