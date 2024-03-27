"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CPartialAttestationProof = exports.Attestation = exports.AttestationRequest = exports.AttestationData = exports.friendlyNames = exports.AttestationDataType = void 0;
const varuint_1 = require("../../utils/varuint");
const bufferutils_1 = require("../../utils/bufferutils");
const createHash = require("create-hash");
const address_1 = require("../../utils/address");
const vdxf_1 = require("../../constants/vdxf");
const __1 = require("../");
const MMR_1 = require("./MMR");
const keys_1 = require("../keys");
const Hash160_1 = require("./Hash160");
const __2 = require("..");
const IdentityData_1 = require("./IdentityData");
const { BufferReader, BufferWriter } = bufferutils_1.default;
class AttestationDataType {
    constructor(data, vdxfkey, salt) {
        this.salt = Buffer.alloc(0);
        this.dataItem = AttestationDataType.getDataItem(vdxfkey, data);
        if (salt) {
            this.salt = Buffer.from(salt, "hex");
        }
    }
    static getDataItem(vdxfkey, data) {
        var _a;
        switch (vdxfkey && ((_a = IdentityData_1.IdentityVdxfidMap[vdxfkey]) === null || _a === void 0 ? void 0 : _a.type)) {
            case 1 /* IdentityDataClassTypes.BUFFER_DATA_STRING */:
                return new __2.Utf8DataVdxfObject(data, vdxfkey);
            case 2 /* IdentityDataClassTypes.BUFFER_DATA_BYTES */:
                return new __2.HexDataVdxfObject(data, vdxfkey);
            case 3 /* IdentityDataClassTypes.BUFFER_DATA_BASE64 */:
                return new __2.BufferDataVdxfObject(data, vdxfkey, "base64");
            case 4 /* IdentityDataClassTypes.URL */:
                return new __2.BufferDataVdxfObject(data, vdxfkey, "utf8");
            case 5 /* IdentityDataClassTypes.PNG_IMAGE */:
                return new __2.PNGImageVdxfObject(data, vdxfkey);
            case 6 /* IdentityDataClassTypes.KEY_ONLY */:
                return new __1.VDXFObject(vdxfkey);
            case 7 /* IdentityDataClassTypes.BOOLEAN */:
                return new __2.HexDataVdxfObject(data, vdxfkey);
            case undefined:
            default:
                return new __2.HexDataVdxfObject(data, vdxfkey);
        }
    }
    dataByteLength() {
        let length = 0;
        length += this.dataItem.byteLength();
        length += varuint_1.default.encodingLength(this.salt.length);
        length += this.salt.length;
        return length;
    }
    toBuffer() {
        const buffer = Buffer.alloc(this.dataByteLength());
        const writer = new bufferutils_1.default.BufferWriter(buffer);
        writer.writeSlice(this.dataItem.toBuffer());
        writer.writeVarSlice(this.salt);
        return writer.buffer;
    }
    fromDataBuffer(buffer, offset = 0, vdxfkey) {
        const reader = new bufferutils_1.default.BufferReader(buffer, offset);
        reader.offset = this.dataItem.fromBuffer(reader.buffer, reader.offset, vdxfkey);
        this.salt = reader.readVarSlice();
        return reader.offset;
    }
}
exports.AttestationDataType = AttestationDataType;
const friendlyNames = (vdfxkey) => {
    if (vdfxkey in IdentityData_1.IdentityVdxfidMap) {
        return IdentityData_1.IdentityVdxfidMap[vdfxkey].name;
    }
    else {
        throw new Error("Unknown VDXF key");
    }
};
exports.friendlyNames = friendlyNames;
class AttestationData {
    constructor(components = new Map()) {
        this.components = components;
    }
    dataByteLength() {
        let byteLength = 0;
        byteLength += varuint_1.default.encodingLength(this.components.size);
        for (const [key, item] of this.components) {
            byteLength += varuint_1.default.encodingLength(key);
            byteLength += item.dataByteLength();
        }
        return byteLength;
    }
    toDataBuffer() {
        const bufferWriter = new BufferWriter(Buffer.alloc(this.dataByteLength()));
        bufferWriter.writeCompactSize(this.components.size);
        for (const [key, item] of this.components) {
            bufferWriter.writeCompactSize(key);
            bufferWriter.writeSlice(item.toBuffer());
        }
        return bufferWriter.buffer;
    }
    fromDataBuffer(buffer, offset) {
        const reader = new bufferutils_1.default.BufferReader(buffer, offset);
        const componentsLength = reader.readCompactSize();
        this.components = new Map();
        for (var i = 0; i < componentsLength; i++) {
            const key = reader.readCompactSize();
            const vdxfid = (0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION);
            const attestationData = new AttestationDataType(null, vdxfid);
            reader.offset = attestationData.fromDataBuffer(reader.buffer, reader.offset, vdxfid);
            this.components.set(key, attestationData);
        }
        return reader.offset;
    }
    size() {
        return this.components.size;
    }
    setDataFromJson(data, getSalt) {
        if (!this.components) {
            this.components = new Map();
        }
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            if (!(item.salt instanceof Buffer) || item.salt.length !== 32) {
                if (typeof getSalt === "function") {
                    item.salt = getSalt();
                }
                else {
                    throw new Error("Salt is required to be a 32 random byte Buffer");
                }
            }
            try {
                (0, address_1.fromBase58Check)(item.dataItem.vdxfkey);
            }
            catch (e) {
                throw new Error("Attestation Key is required to be base58 format");
            }
            this.components.set(i, item);
        }
    }
    getHash(key) {
        let value;
        value = this.components.get(key).toBuffer();
        return createHash("sha256").update(value).digest();
    }
}
exports.AttestationData = AttestationData;
class AttestationRequest extends __1.VDXFObject {
    dataByteLength() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        let length = 0;
        length += varuint_1.default.encodingLength((_b = (_a = this.data.accepted_attestors) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0);
        length += (_d = (_c = this.data.accepted_attestors) === null || _c === void 0 ? void 0 : _c.reduce((sum, current) => sum + current.byteLength(), 0)) !== null && _d !== void 0 ? _d : 0;
        length += varuint_1.default.encodingLength((_f = (_e = this.data.attestation_keys) === null || _e === void 0 ? void 0 : _e.length) !== null && _f !== void 0 ? _f : 0);
        length += (_h = (_g = this.data.attestation_keys) === null || _g === void 0 ? void 0 : _g.reduce((sum, current) => sum + current.byteLength(), 0)) !== null && _h !== void 0 ? _h : 0;
        length += varuint_1.default.encodingLength((_k = (_j = this.data.attestor_filters) === null || _j === void 0 ? void 0 : _j.length) !== null && _k !== void 0 ? _k : 0);
        length += (_m = (_l = this.data.attestor_filters) === null || _l === void 0 ? void 0 : _l.reduce((sum, current) => sum + current.byteLength(), 0)) !== null && _m !== void 0 ? _m : 0;
        return length;
    }
    toDataBuffer() {
        const writer = new bufferutils_1.default.BufferWriter(Buffer.alloc(this.dataByteLength()));
        writer.writeArray(this.data.accepted_attestors.map((x) => x.toBuffer()));
        writer.writeArray(this.data.attestation_keys.map((x) => x.toBuffer()));
        writer.writeArray(this.data.attestor_filters.map((x) => x.toBuffer()));
        return writer.buffer;
    }
    fromDataBuffer(buffer, offset) {
        const reader = new bufferutils_1.default.BufferReader(buffer, offset);
        reader.readVarInt(); //skip data length
        function readHash160Array(arr) {
            const length = reader.readVarInt();
            for (let i = 0; i < length.toNumber(); i++) {
                const member = new Hash160_1.Hash160();
                reader.offset = member.fromBuffer(reader.buffer, false, reader.offset);
                arr.push(member);
            }
            if (length.toNumber() === 0)
                arr = [];
        }
        readHash160Array(this.data.accepted_attestors);
        readHash160Array(this.data.attestation_keys);
        readHash160Array(this.data.attestor_filters);
        return reader.offset;
    }
    static initializeData(data) {
        var retData;
        if (typeof data === 'object') {
            retData = {
                accepted_attestors: (data.accepted_attestors || []).map((x) => typeof x === 'string' ? Hash160_1.Hash160.fromAddress(x) : x),
                attestation_keys: (data.attestation_keys || []).map((x) => typeof x === 'string' ? Hash160_1.Hash160.fromAddress(x) : x),
                attestor_filters: (data.attestor_filters || []).map((x) => typeof x === 'string' ? Hash160_1.Hash160.fromAddress(x) : x)
            };
        }
        else {
            retData = {
                accepted_attestors: [],
                attestation_keys: [],
                attestor_filters: []
            };
        }
        return retData;
    }
    toJson() {
        const { accepted_attestors, attestation_keys, attestor_filters } = this.data;
        return {
            vdxfkey: this.vdxfkey,
            data: {
                accepted_attestors: (accepted_attestors === null || accepted_attestors === void 0 ? void 0 : accepted_attestors.map((x) => x.toAddress())) || [],
                attestation_keys: (attestation_keys === null || attestation_keys === void 0 ? void 0 : attestation_keys.map((x) => x.toAddress())) || [],
                attestor_filters: (attestor_filters === null || attestor_filters === void 0 ? void 0 : attestor_filters.map((x) => x.toAddress())) || []
            }
        };
    }
}
exports.AttestationRequest = AttestationRequest;
class Attestation extends __1.VDXFObject {
    constructor(data, vdxfkey = keys_1.ATTESTATION_OBJECT.vdxfid) {
        super(vdxfkey);
        if (data) {
            this.data = data.data;
            this.signature = data.signature;
            this.mmr = data.mmr;
            this.system_id = data.system_id;
            this.signing_id = data.signing_id;
        }
    }
    dataByteLength() {
        let byteLength = 0;
        byteLength += this.data.dataByteLength();
        const _system_id = Hash160_1.Hash160.fromAddress(this.system_id);
        const _signing_id = Hash160_1.Hash160.fromAddress(this.signing_id);
        const _signature = this.signature
            ? this.signature
            : new __1.VerusIDSignature({ signature: "" });
        byteLength += _system_id.byteLength();
        byteLength += _signing_id.byteLength();
        byteLength += _signature.byteLength();
        if (this.mmr) {
            byteLength += this.mmr.getbyteLength();
        }
        else {
            byteLength += varuint_1.default.encodingLength(0);
        }
        return byteLength;
    }
    toDataBuffer() {
        const bufferWriter = new BufferWriter(Buffer.alloc(this.dataByteLength()));
        bufferWriter.writeSlice(this.data.toDataBuffer());
        const _system_id = Hash160_1.Hash160.fromAddress(this.system_id);
        const _signing_id = Hash160_1.Hash160.fromAddress(this.signing_id);
        const _signature = this.signature
            ? this.signature
            : new __1.VerusIDSignature({ signature: "" });
        bufferWriter.writeSlice(_system_id.toBuffer());
        bufferWriter.writeSlice(_signing_id.toBuffer());
        bufferWriter.writeSlice(_signature.toBuffer());
        if (this.mmr) {
            bufferWriter.writeVarSlice(this.mmr.toBuffer());
        }
        else {
            bufferWriter.writeCompactSize(0);
        }
        return bufferWriter.buffer;
    }
    fromDataBuffer(buffer, offset) {
        const reader = new bufferutils_1.default.BufferReader(buffer, offset);
        const attestationsByteLength = reader.readCompactSize(); //dummy read
        if (!this.data) {
            this.data = new AttestationData();
        }
        reader.offset = this.data.fromDataBuffer(reader.buffer, reader.offset);
        this.system_id = (0, address_1.toBase58Check)(reader.readSlice(vdxf_1.HASH160_BYTE_LENGTH), vdxf_1.I_ADDR_VERSION);
        this.signing_id = (0, address_1.toBase58Check)(reader.readSlice(vdxf_1.HASH160_BYTE_LENGTH), vdxf_1.I_ADDR_VERSION);
        const _sig = new __1.VerusIDSignature();
        reader.offset = _sig.fromBuffer(reader.buffer, reader.offset);
        this.signature = _sig;
        const leafLength = reader.readCompactSize();
        if (leafLength > 0) {
            const referenceTreeLength = reader.readCompactSize();
            const nodes = {};
            for (var i = 0; i < referenceTreeLength; i++) {
                const nodeIndex = reader.readCompactSize();
                const signature = reader.readVarSlice();
                nodes[nodeIndex] = signature;
            }
            if (Object.keys(nodes).length > 0) {
                this.mmr = new MMR_1.CMerkleMountainRange().fromBuffer(reader.buffer);
            }
        }
        return reader.offset;
    }
    createMMR() {
        if (!this.mmr) {
            this.mmr = new MMR_1.CMerkleMountainRange();
        }
        else {
            return this.mmr;
        }
        for (const [key, item] of this.data.components) {
            this.mmr.add(new MMR_1.CMMRNode(this.getHash(key)));
        }
        return this.mmr;
    }
    rootHash() {
        if (!this.mmr) {
            this.createMMR();
        }
        const view = new MMR_1.CMerkleMountainView(this.mmr);
        return view.GetRoot();
    }
    // returns an attestation with a sparse MMR containing the leaves specified
    getProof(keys) {
        const view = new MMR_1.CMerkleMountainView(this.mmr);
        const attestationItems = new AttestationData();
        const localCMMR = new MMR_1.CMMRProof();
        keys.forEach((key, index) => {
            view.GetProof(localCMMR, key);
            attestationItems.components.set(key, this.data.components.get(key));
        });
        const attestationAndProof = new CPartialAttestationProof({
            proof: localCMMR,
            componentsArray: attestationItems,
            system_id: this.system_id,
            signing_id: this.signing_id,
        });
        return attestationAndProof;
    }
    checkProof() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                for (const [key, item] of this.data.components) {
                    const hash = this.getHash(key);
                    const proof = null; //await this.mmr.getProof([key], null);
                    if (hash !== proof) {
                        throw new Error("Attestation not found in MMR");
                    }
                }
            }
            catch (e) {
                throw new Error("Error checking MMR");
            }
        });
    }
    getHash(key) {
        let returnBuffer;
        returnBuffer = this.data.components.get(key).toBuffer();
        return createHash("sha256").update(returnBuffer).digest();
    }
}
exports.Attestation = Attestation;
Attestation.TYPE_STRING = 1;
Attestation.TYPE_BYTES = 2;
Attestation.TYPE_BASE64 = 3;
Attestation.TYPE_URL = 4;
class CPartialAttestationProof extends __1.VDXFObject {
    constructor(data, vdxfkey = keys_1.ATTESTATION_VIEW_RESPONSE.vdxfid) {
        super(vdxfkey);
        this.EType = {
            TYPE_INVALID: 0,
            TYPE_ATTESTATION: 1,
            TYPE_LAST: 1
        };
        this.type = this.EType.TYPE_ATTESTATION;
        if (data) {
            this.proof = data.proof || new MMR_1.CMMRProof();
            this.componentsArray = data.componentsArray || new AttestationData();
            this.system_id = data.system_id;
            this.signing_id = data.signing_id;
        }
    }
    dataByteLength() {
        let byteLength = 0;
        byteLength += varuint_1.default.encodingLength(this.type);
        byteLength += this.proof.dataByteLength();
        byteLength += this.componentsArray.dataByteLength();
        const _system_id = Hash160_1.Hash160.fromAddress(this.system_id);
        const _signing_id = Hash160_1.Hash160.fromAddress(this.signing_id);
        const _signature = this.signature
            ? this.signature
            : new __1.VerusIDSignature({ signature: "" });
        byteLength += _system_id.byteLength();
        byteLength += _signing_id.byteLength();
        byteLength += _signature.byteLength();
        return byteLength;
    }
    toDataBuffer() {
        const bufferWriter = new BufferWriter(Buffer.alloc(this.dataByteLength()));
        bufferWriter.writeCompactSize(this.type);
        bufferWriter.writeSlice(this.proof.toBuffer());
        bufferWriter.writeSlice(this.componentsArray.toDataBuffer());
        const _system_id = Hash160_1.Hash160.fromAddress(this.system_id);
        const _signing_id = Hash160_1.Hash160.fromAddress(this.signing_id);
        const _signature = this.signature
            ? this.signature
            : new __1.VerusIDSignature({ signature: "" });
        bufferWriter.writeSlice(_system_id.toBuffer());
        bufferWriter.writeSlice(_signing_id.toBuffer());
        bufferWriter.writeSlice(_signature.toBuffer());
        return bufferWriter.buffer;
    }
    fromDataBuffer(buffer, offset) {
        const reader = new bufferutils_1.default.BufferReader(buffer, offset);
        const lengthOfBuffer = reader.readCompactSize(); //dummy read
        this.type = reader.readCompactSize();
        this.proof = new MMR_1.CMMRProof();
        reader.offset = this.proof.fromDataBuffer(reader.buffer, reader.offset);
        this.componentsArray = new AttestationData();
        reader.offset = this.componentsArray.fromDataBuffer(reader.buffer, reader.offset);
        this.system_id = (0, address_1.toBase58Check)(reader.readSlice(vdxf_1.HASH160_BYTE_LENGTH), vdxf_1.I_ADDR_VERSION);
        this.signing_id = (0, address_1.toBase58Check)(reader.readSlice(vdxf_1.HASH160_BYTE_LENGTH), vdxf_1.I_ADDR_VERSION);
        const _sig = new __1.VerusIDSignature();
        reader.offset = _sig.fromBuffer(reader.buffer, reader.offset);
        this.signature = _sig;
        return reader.offset;
    }
    checkProof(item) {
        const dataHash = this.componentsArray.getHash(item);
        let currentIndex = 0;
        const component = this.componentsArray.components.get(item);
        for (let value of this.componentsArray.components.values()) {
            if (component == value) {
                return this.proof.proofSequence[currentIndex].safeCheck(dataHash);
            }
            currentIndex++;
        }
        return Buffer.allocUnsafe(32);
    }
}
exports.CPartialAttestationProof = CPartialAttestationProof;
