"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletBackup = void 0;
const bn_js_1 = require("bn.js");
const SeedDetails_1 = require("./SeedDetails");
class WalletBackup extends SeedDetails_1.SeedDetails {
    constructor(data) {
        super(data);
    }
    static fromJson(json) {
        var _a, _b, _c, _d;
        return new WalletBackup({
            flags: new bn_js_1.BN((_a = json.flags) !== null && _a !== void 0 ? _a : 0, 10),
            seedFormat: new bn_js_1.BN((_b = json.seedformat) !== null && _b !== void 0 ? _b : WalletBackup.DEFAULT_SEED_FORMAT.toNumber(), 10),
            encryptionFormat: new bn_js_1.BN((_c = json.encryptionformat) !== null && _c !== void 0 ? _c : WalletBackup.DEFAULT_ENCRYPTION_FORMAT.toNumber(), 10),
            KDFIters: new bn_js_1.BN((_d = json.KDFIters) !== null && _d !== void 0 ? _d : 0, 10),
            data: json.data ? Buffer.from(json.data, 'hex') : Buffer.alloc(0)
        });
    }
}
exports.WalletBackup = WalletBackup;
WalletBackup.FLAG_ENCRYPTED = SeedDetails_1.SeedDetails.FLAG_ENCRYPTED;
WalletBackup.FLAG_CONTAINS_KDF_ITERS = SeedDetails_1.SeedDetails.FLAG_CONTAINS_KDF_ITERS;
WalletBackup.SEED_FORMAT_BIP39 = SeedDetails_1.SeedDetails.SEED_FORMAT_BIP39;
WalletBackup.DEFAULT_SEED_FORMAT = SeedDetails_1.SeedDetails.DEFAULT_SEED_FORMAT;
WalletBackup.ENCRYPTION_FORMAT_NONE = SeedDetails_1.SeedDetails.ENCRYPTION_FORMAT_NONE;
WalletBackup.ENCRYPTION_FORMAT_SALTED_TAGGED_AES_256_GCM = SeedDetails_1.SeedDetails.ENCRYPTION_FORMAT_SALTED_TAGGED_AES_256_GCM;
WalletBackup.DEFAULT_ENCRYPTION_FORMAT = SeedDetails_1.SeedDetails.DEFAULT_ENCRYPTION_FORMAT;
