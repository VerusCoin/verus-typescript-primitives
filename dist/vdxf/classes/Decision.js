"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Decision = void 0;
const __1 = require("..");
const bufferutils_1 = require("../../utils/bufferutils");
const varuint_1 = require("../../utils/varuint");
const Context_1 = require("./Context");
const Hash160_1 = require("./Hash160");
const Request_1 = require("./Request");
class Decision extends __1.VDXFObject {
    constructor(decision = {
        decision_id: "",
        request: new Request_1.Request(),
        created_at: 0,
    }, vdxfkey = __1.LOGIN_CONSENT_DECISION_VDXF_KEY.vdxfid) {
        super(vdxfkey);
        this.decision_id = decision.decision_id;
        this.request = new Request_1.Request(decision.request);
        this.context = decision.context ? new Context_1.Context(decision.context.kv) : new Context_1.Context();
        this.created_at = decision.created_at;
        this.attestations = decision.attestations;
        this.salt = decision.salt;
        this.skipped = decision.skipped ? true : false;
    }
    dataByteLength() {
        let length = 0;
        const _challenge_id = Hash160_1.Hash160.fromAddress(this.decision_id, true);
        const _salt = this.salt
            ? Hash160_1.Hash160.fromAddress(this.salt, true)
            : Hash160_1.Hash160.getEmpty();
        const _request = this.request ? this.request : new Request_1.Request();
        const _context = this.context ? this.context : new Context_1.Context();
        const _attestations = [];
        length += _challenge_id.byteLength();
        length += 8; // created_at
        length += _salt.byteLength();
        if (this.vdxfkey === __1.LOGIN_CONSENT_DECISION_VDXF_KEY.vdxfid) {
            length += 1; // skipped
            length += varuint_1.default.encodingLength(_attestations.length);
        }
        length += _request.byteLength();
        length += _context.byteLength();
        return length;
    }
    toDataBuffer() {
        const buffer = Buffer.alloc(this.dataByteLength());
        const writer = new bufferutils_1.default.BufferWriter(buffer);
        const _decision_id = Hash160_1.Hash160.fromAddress(this.decision_id, true);
        const _created_at = this.created_at;
        const _salt = this.salt
            ? Hash160_1.Hash160.fromAddress(this.salt, true)
            : Hash160_1.Hash160.getEmpty();
        const _request = this.request ? this.request : new Request_1.Request();
        const _context = this.context ? this.context : new Context_1.Context();
        const _attestations = [];
        writer.writeSlice(_decision_id.toBuffer());
        writer.writeUInt64(_created_at);
        writer.writeSlice(_salt.toBuffer());
        if (this.vdxfkey === __1.LOGIN_CONSENT_DECISION_VDXF_KEY.vdxfid) {
            writer.writeUInt8(this.skipped ? 1 : 0);
            writer.writeArray(_attestations.map((x) => x.toBuffer()));
        }
        writer.writeSlice(_context.toBuffer());
        writer.writeSlice(_request.toBuffer());
        return writer.buffer;
    }
    fromDataBuffer(buffer, offset, readRequest = true) {
        const reader = new bufferutils_1.default.BufferReader(buffer, offset);
        const decisionLength = reader.readCompactSize();
        if (decisionLength == 0) {
            throw new Error("Cannot create decision from empty buffer");
        }
        else {
            const _decision_id = new Hash160_1.Hash160();
            reader.offset = _decision_id.fromBuffer(reader.buffer, true, reader.offset);
            this.decision_id = _decision_id.toAddress();
            this.created_at = reader.readUInt64();
            const _salt = new Hash160_1.Hash160();
            reader.offset = _salt.fromBuffer(reader.buffer, true, reader.offset);
            this.salt = _salt.toAddress();
            if (this.vdxfkey === __1.LOGIN_CONSENT_DECISION_VDXF_KEY.vdxfid) {
                this.skipped = reader.readUInt8() === 1 ? true : false;
                this.attestations = [];
                const attestationsLength = reader.readCompactSize();
                if (attestationsLength > 0) {
                    throw new Error("Attestations currently unsupported");
                }
            }
            const _context = new Context_1.Context();
            reader.offset = _context.fromBuffer(reader.buffer, reader.offset);
            this.context = _context;
            if (readRequest) {
                const _request = new Request_1.Request();
                reader.offset = _request.fromBuffer(reader.buffer, reader.offset);
                this.request = _request;
            }
        }
        return reader.offset;
    }
    toJson() {
        return {
            vdxfkey: this.vdxfkey,
            decision_id: this.decision_id,
            context: this.context.toJson(),
            created_at: this.created_at,
            request: this.request.toJson(),
        };
    }
}
exports.Decision = Decision;
