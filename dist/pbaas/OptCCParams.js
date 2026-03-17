"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptCCParams = void 0;
const bscript = require("../utils/script");
const evals_1 = require("../utils/evals");
const varuint_1 = require("../utils/varuint");
const TxDestination_1 = require("./TxDestination");
const bn_js_1 = require("bn.js");
const bufferutils_1 = require("../utils/bufferutils");
class OptCCParams {
    constructor(data) {
        if (data != null) {
            const d = data;
            if (Object.prototype.hasOwnProperty.call(d, 'eval_code')) {
                throw new Error("OptCCParams: snake_case property names are no longer supported. Use 'evalCode' instead of 'eval_code'.");
            }
            if (Object.prototype.hasOwnProperty.call(d, 'vdata')) {
                throw new Error("OptCCParams: Use 'vData' instead of 'vdata'.");
            }
        }
        if (data === null || data === void 0 ? void 0 : data.version)
            this.version = data.version;
        if (data === null || data === void 0 ? void 0 : data.evalCode)
            this.evalCode = data.evalCode;
        if (data === null || data === void 0 ? void 0 : data.m)
            this.m = data.m;
        if (data === null || data === void 0 ? void 0 : data.n)
            this.n = data.n;
        if (data === null || data === void 0 ? void 0 : data.destinations)
            this.destinations = data.destinations;
        else
            this.destinations = [];
        if (data === null || data === void 0 ? void 0 : data.vData)
            this.vData = data.vData;
        else
            this.vData = [];
    }
    /** @deprecated Use evalCode instead */
    get eval_code() { return this.evalCode; }
    /** @deprecated Use vData instead */
    get vdata() { return this.vData; }
    getParamObject() {
        switch (this.evalCode.toNumber()) {
            case evals_1.EVALS.EVAL_NONE:
                {
                    return null;
                }
            case evals_1.EVALS.EVAL_STAKEGUARD:
            case evals_1.EVALS.EVAL_CURRENCY_DEFINITION:
            case evals_1.EVALS.EVAL_NOTARY_EVIDENCE:
            case evals_1.EVALS.EVAL_EARNEDNOTARIZATION:
            case evals_1.EVALS.EVAL_ACCEPTEDNOTARIZATION:
            case evals_1.EVALS.EVAL_FINALIZE_NOTARIZATION:
            case evals_1.EVALS.EVAL_CURRENCYSTATE:
            case evals_1.EVALS.EVAL_RESERVE_TRANSFER:
            case evals_1.EVALS.EVAL_RESERVE_OUTPUT:
            case evals_1.EVALS.EVAL_RESERVE_DEPOSIT:
            case evals_1.EVALS.EVAL_CROSSCHAIN_EXPORT:
            case evals_1.EVALS.EVAL_CROSSCHAIN_IMPORT:
            case evals_1.EVALS.EVAL_IDENTITY_PRIMARY:
            case evals_1.EVALS.EVAL_IDENTITY_COMMITMENT:
            case evals_1.EVALS.EVAL_IDENTITY_RESERVATION:
            case evals_1.EVALS.EVAL_FINALIZE_EXPORT:
            case evals_1.EVALS.EVAL_FEE_POOL:
            case evals_1.EVALS.EVAL_NOTARY_SIGNATURE:
                {
                    if (this.vData.length) {
                        return this.vData[0];
                    }
                    else {
                        return null;
                    }
                }
            default:
                {
                    return null;
                }
        }
    }
    isValid() {
        var validEval = false;
        switch (this.evalCode.toNumber()) {
            case evals_1.EVALS.EVAL_NONE:
                {
                    validEval = true;
                    break;
                }
            case evals_1.EVALS.EVAL_STAKEGUARD:
            case evals_1.EVALS.EVAL_CURRENCY_DEFINITION:
            case evals_1.EVALS.EVAL_NOTARY_EVIDENCE:
            case evals_1.EVALS.EVAL_EARNEDNOTARIZATION:
            case evals_1.EVALS.EVAL_ACCEPTEDNOTARIZATION:
            case evals_1.EVALS.EVAL_FINALIZE_NOTARIZATION:
            case evals_1.EVALS.EVAL_CURRENCYSTATE:
            case evals_1.EVALS.EVAL_RESERVE_TRANSFER:
            case evals_1.EVALS.EVAL_RESERVE_OUTPUT:
            case evals_1.EVALS.EVAL_RESERVE_DEPOSIT:
            case evals_1.EVALS.EVAL_CROSSCHAIN_EXPORT:
            case evals_1.EVALS.EVAL_CROSSCHAIN_IMPORT:
            case evals_1.EVALS.EVAL_IDENTITY_PRIMARY:
            case evals_1.EVALS.EVAL_IDENTITY_COMMITMENT:
            case evals_1.EVALS.EVAL_IDENTITY_RESERVATION:
            case evals_1.EVALS.EVAL_FINALIZE_EXPORT:
            case evals_1.EVALS.EVAL_FEE_POOL:
            case evals_1.EVALS.EVAL_NOTARY_SIGNATURE:
                {
                    validEval = this.vData && this.vData.length > 0;
                }
        }
        return (validEval &&
            this.version.gt(new bn_js_1.BN(0)) &&
            this.version.lt(new bn_js_1.BN(4)) &&
            ((this.version.lt(new bn_js_1.BN(3)) && this.evalCode.lt(new bn_js_1.BN(2))) ||
                (this.evalCode.lte(new bn_js_1.BN(26)) && this.m.lte(this.n))));
    }
    static fromChunk(chunk) {
        const writer = new bufferutils_1.default.BufferWriter(Buffer.alloc(varuint_1.default.encodingLength(chunk.length)), 0);
        writer.writeCompactSize(chunk.length);
        const params = new OptCCParams();
        params.fromBuffer(Buffer.concat([writer.buffer, chunk]));
        return params;
    }
    toChunk() {
        return this.internalToBuffer(true);
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new bufferutils_1.default.BufferReader(buffer, offset);
        const scriptInVector = reader.readVarSlice();
        const chunks = bscript.decompile(scriptInVector);
        const firstChunk = chunks[0];
        if (!Buffer.isBuffer(firstChunk)) {
            throw new Error('invalid first chunk date type');
        }
        if (firstChunk.length !== 4) {
            throw new Error('invalid optional parameters header');
        }
        const chunkReader = new bufferutils_1.default.BufferReader(firstChunk, 0);
        this.version = new bn_js_1.BN(chunkReader.readUInt8());
        this.evalCode = new bn_js_1.BN(chunkReader.readUInt8());
        this.m = new bn_js_1.BN(chunkReader.readUInt8());
        this.n = new bn_js_1.BN(chunkReader.readUInt8());
        // now, we should have n keys followed by data objects for later versions, otherwise all keys and one data object
        if (this.version.lte(new bn_js_1.BN(0)) ||
            this.version.gt(new bn_js_1.BN(3)) ||
            this.evalCode.lt(new bn_js_1.BN(0)) ||
            this.evalCode.gt(new bn_js_1.BN(0x1a)) || // this is the last valid eval code as of version 3
            (this.version.lt(new bn_js_1.BN(3)) && this.n.lt(new bn_js_1.BN(1))) ||
            this.n.gt(new bn_js_1.BN(4)) ||
            (this.version.lt(new bn_js_1.BN(3)) && this.n.gte(new bn_js_1.BN(chunks.length))) ||
            this.n.gt(new bn_js_1.BN(chunks.length))) {
            // invalid header values
            throw new Error('invalid header values');
        }
        // now, we have chunks left that are either destinations or data vectors
        const limit = this.n.eq(new bn_js_1.BN(chunks.length)) ? this.n : this.n.add(new bn_js_1.BN(1));
        this.destinations = [];
        let loop;
        for (loop = 1; this.version && loop < limit.toNumber(); loop++) {
            const currChunk = chunks[loop];
            if (Buffer.isBuffer(currChunk)) {
                const oneDest = TxDestination_1.TxDestination.fromChunk(currChunk);
                this.destinations.push(oneDest);
            }
        }
        for (; this.version && loop < chunks.length; loop++) {
            const currChunk = chunks[loop];
            if (Buffer.isBuffer(currChunk))
                this.vData.push(currChunk);
        }
        return offset;
    }
    internalGetByteLength(asChunk) {
        const chunks = [Buffer.alloc(4)];
        chunks[0][0] = this.version.toNumber();
        chunks[0][1] = this.evalCode.toNumber();
        chunks[0][2] = this.m.toNumber();
        chunks[0][3] = this.n.toNumber();
        this.destinations.forEach(x => {
            chunks.push(x.toChunk());
        });
        this.vData.forEach(x => {
            chunks.push(x);
        });
        const buf = bscript.compile(chunks);
        return asChunk ? buf.length : (varuint_1.default.encodingLength(buf.length) + buf.length);
    }
    getByteLength() {
        return this.internalGetByteLength(false);
    }
    internalToBuffer(asChunk) {
        const chunks = [Buffer.alloc(4)];
        chunks[0][0] = this.version.toNumber();
        chunks[0][1] = this.evalCode.toNumber();
        chunks[0][2] = this.m.toNumber();
        chunks[0][3] = this.n.toNumber();
        this.destinations.forEach(x => {
            chunks.push(x.toChunk());
        });
        this.vData.forEach(x => {
            chunks.push(x);
        });
        const scriptStore = bscript.compile(chunks);
        const buf = bscript.compile(chunks);
        const len = asChunk ? buf.length : varuint_1.default.encodingLength(buf.length) + buf.length;
        const buffer = Buffer.alloc(len);
        const writer = new bufferutils_1.default.BufferWriter(buffer);
        if (asChunk) {
            writer.writeSlice(scriptStore);
        }
        else {
            writer.writeVarSlice(scriptStore);
        }
        return writer.buffer;
    }
    toBuffer() {
        return this.internalToBuffer(false);
    }
}
exports.OptCCParams = OptCCParams;
