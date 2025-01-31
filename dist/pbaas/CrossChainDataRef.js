"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrossChainDataRef = void 0;
const bufferutils_1 = require("../utils/bufferutils");
const PBaaSEvidenceRef_1 = require("./PBaaSEvidenceRef");
const IdentityMultimapRef_1 = require("./IdentityMultimapRef");
const URLRef_1 = require("./URLRef");
const { BufferReader, BufferWriter } = bufferutils_1.default;
class CrossChainDataRef {
    constructor(data) {
        this.ref = data || null;
    }
    which() {
        if (this.ref instanceof PBaaSEvidenceRef_1.PBaaSEvidenceRef) {
            return CrossChainDataRef.TYPE_CROSSCHAIN_DATAREF;
        }
        else if (this.ref instanceof IdentityMultimapRef_1.IdentityMultimapRef) {
            return CrossChainDataRef.TYPE_IDENTITY_DATAREF;
        }
        else if (this.ref instanceof URLRef_1.URLRef) {
            return CrossChainDataRef.TYPE_URL_REF;
        }
    }
    getByteLength() {
        let byteLength = 1; //type uint8
        byteLength += this.ref.getByteLength();
        return byteLength;
    }
    toBuffer() {
        const bufferWriter = new BufferWriter(Buffer.alloc(this.getByteLength()));
        bufferWriter.writeUInt8(this.which());
        bufferWriter.writeSlice(this.ref.toBuffer());
        return bufferWriter.buffer;
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        const type = reader.readUInt8();
        if (type == CrossChainDataRef.TYPE_CROSSCHAIN_DATAREF) {
            this.ref = new PBaaSEvidenceRef_1.PBaaSEvidenceRef();
        }
        else if (type == CrossChainDataRef.TYPE_IDENTITY_DATAREF) {
            this.ref = new IdentityMultimapRef_1.IdentityMultimapRef();
        }
        else if (type == CrossChainDataRef.TYPE_URL_REF) {
            this.ref = new URLRef_1.URLRef();
        }
        offset = this.ref.fromBuffer(buffer, reader.offset);
        return offset;
    }
    isValid() {
        switch (this.which()) {
            case CrossChainDataRef.TYPE_CROSSCHAIN_DATAREF:
                return this.ref.isValid();
            case CrossChainDataRef.TYPE_IDENTITY_DATAREF:
                return this.ref.isValid();
            case CrossChainDataRef.TYPE_URL_REF:
                return this.ref.isValid();
            default:
                return false;
        }
    }
    toJson() {
        return Object.assign(Object.assign({}, this.ref.toJson()), { type: this.which() });
    }
    static fromJson(data) {
        if (data.type == CrossChainDataRef.TYPE_CROSSCHAIN_DATAREF) {
            return new CrossChainDataRef(PBaaSEvidenceRef_1.PBaaSEvidenceRef.fromJson(data));
        }
        else if (data.type == CrossChainDataRef.TYPE_IDENTITY_DATAREF) {
            return new CrossChainDataRef(IdentityMultimapRef_1.IdentityMultimapRef.fromJson(data));
        }
        else if (data.type == CrossChainDataRef.TYPE_URL_REF) {
            return new CrossChainDataRef(URLRef_1.URLRef.fromJson(data));
        }
        else
            throw new Error("Invalid CrossChainDataRef type");
    }
}
exports.CrossChainDataRef = CrossChainDataRef;
CrossChainDataRef.TYPE_CROSSCHAIN_DATAREF = 0;
CrossChainDataRef.TYPE_IDENTITY_DATAREF = 1;
CrossChainDataRef.TYPE_URL_REF = 2;
