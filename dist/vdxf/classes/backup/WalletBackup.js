"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletBackup = void 0;
const bn_js_1 = require("bn.js");
const bufferutils_1 = require("../../../utils/bufferutils");
const varuint_1 = require("../../../utils/varuint");
const { BufferReader, BufferWriter } = bufferutils_1.default;
class WalletBackup {
    constructor(data) {
        this.flags = (data === null || data === void 0 ? void 0 : data.flags) || new bn_js_1.BN(0, 10);
        this.seedFormat = (data === null || data === void 0 ? void 0 : data.seedFormat) || WalletBackup.DEFAULT_SEED_FORMAT;
        this.encryptionFormat = (data === null || data === void 0 ? void 0 : data.encryptionFormat) || WalletBackup.DEFAULT_ENCRYPTION_FORMAT;
        this.data = (data === null || data === void 0 ? void 0 : data.data) || Buffer.alloc(0);
        if (data === null || data === void 0 ? void 0 : data.encrypted)
            this.setEncrypted();
        if (data === null || data === void 0 ? void 0 : data.containsKdfIters)
            this.setContainsKdfIters();
    }
    isEncrypted() {
        return this.flags.and(WalletBackup.FLAG_ENCRYPTED).eq(WalletBackup.FLAG_ENCRYPTED);
    }
    containsKdfIters() {
        return this.flags.and(WalletBackup.FLAG_CONTAINS_KDF_ITERS).eq(WalletBackup.FLAG_CONTAINS_KDF_ITERS);
    }
    setEncrypted() {
        this.flags = this.flags.or(WalletBackup.FLAG_ENCRYPTED);
    }
    setContainsKdfIters() {
        this.flags = this.flags.or(WalletBackup.FLAG_CONTAINS_KDF_ITERS);
    }
    isBIP39() {
        return this.seedFormat.eq(WalletBackup.SEED_FORMAT_BIP39);
    }
    usesSaltedTaggedAes256Gcm() {
        return this.encryptionFormat.eq(WalletBackup.ENCRYPTION_FORMAT_SALTED_TAGGED_AES_256_GCM);
    }
    isValid() {
        let valid = this.flags.gte(new bn_js_1.BN(0, 10));
        valid && (valid = this.seedFormat.gte(new bn_js_1.BN(1, 10)));
        valid && (valid = this.encryptionFormat.gte(new bn_js_1.BN(0, 10)));
        valid && (valid = Buffer.isBuffer(this.data));
        if (this.isEncrypted() && this.usesSaltedTaggedAes256Gcm()) {
            valid && (valid = this.containsKdfIters());
        }
        return valid;
    }
    getByteLength() {
        let length = 0;
        length += varuint_1.default.encodingLength(this.flags.toNumber());
        length += varuint_1.default.encodingLength(this.seedFormat.toNumber());
        length += varuint_1.default.encodingLength(this.encryptionFormat.toNumber());
        length += varuint_1.default.encodingLength(this.data.length);
        length += this.data.length;
        return length;
    }
    toBuffer() {
        const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));
        writer.writeCompactSize(this.flags.toNumber());
        writer.writeCompactSize(this.seedFormat.toNumber());
        writer.writeCompactSize(this.encryptionFormat.toNumber());
        writer.writeVarSlice(this.data);
        return writer.buffer;
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        this.flags = new bn_js_1.BN(reader.readCompactSize(), 10);
        this.seedFormat = new bn_js_1.BN(reader.readCompactSize(), 10);
        this.encryptionFormat = new bn_js_1.BN(reader.readCompactSize(), 10);
        this.data = reader.readVarSlice();
        return reader.offset;
    }
    toJson() {
        return {
            flags: this.flags.toNumber(),
            seedformat: this.seedFormat.toNumber(),
            encryptionformat: this.encryptionFormat.toNumber(),
            data: this.data.toString('hex')
        };
    }
    static fromJson(json) {
        var _a, _b, _c;
        return new WalletBackup({
            flags: new bn_js_1.BN((_a = json.flags) !== null && _a !== void 0 ? _a : 0, 10),
            seedFormat: new bn_js_1.BN((_b = json.seedformat) !== null && _b !== void 0 ? _b : WalletBackup.DEFAULT_SEED_FORMAT.toNumber(), 10),
            encryptionFormat: new bn_js_1.BN((_c = json.encryptionformat) !== null && _c !== void 0 ? _c : WalletBackup.DEFAULT_ENCRYPTION_FORMAT.toNumber(), 10),
            data: json.data ? Buffer.from(json.data, 'hex') : Buffer.alloc(0)
        });
    }
}
exports.WalletBackup = WalletBackup;
WalletBackup.FLAG_ENCRYPTED = new bn_js_1.BN(1, 10);
WalletBackup.FLAG_CONTAINS_KDF_ITERS = new bn_js_1.BN(2, 10);
WalletBackup.SEED_FORMAT_BIP39 = new bn_js_1.BN(1, 10);
WalletBackup.DEFAULT_SEED_FORMAT = WalletBackup.SEED_FORMAT_BIP39;
WalletBackup.ENCRYPTION_FORMAT_NONE = new bn_js_1.BN(0, 10);
WalletBackup.ENCRYPTION_FORMAT_SALTED_TAGGED_AES_256_GCM = new bn_js_1.BN(1, 10);
WalletBackup.DEFAULT_ENCRYPTION_FORMAT = WalletBackup.ENCRYPTION_FORMAT_NONE;
