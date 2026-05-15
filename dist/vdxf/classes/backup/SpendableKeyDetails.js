"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpendableKeyDetails = void 0;
const bn_js_1 = require("bn.js");
const SeedDetails_1 = require("./SeedDetails");
class SpendableKeyDetails extends SeedDetails_1.SeedDetails {
    constructor(data) {
        super(data);
    }
    static fromJson(json) {
        var _a, _b, _c, _d;
        return new SpendableKeyDetails({
            flags: new bn_js_1.BN((_a = json.flags) !== null && _a !== void 0 ? _a : 0, 10),
            seedFormat: new bn_js_1.BN((_b = json.seedformat) !== null && _b !== void 0 ? _b : SpendableKeyDetails.DEFAULT_SEED_FORMAT.toNumber(), 10),
            encryptionFormat: new bn_js_1.BN((_c = json.encryptionformat) !== null && _c !== void 0 ? _c : SpendableKeyDetails.DEFAULT_ENCRYPTION_FORMAT.toNumber(), 10),
            KDFIters: new bn_js_1.BN((_d = json.KDFIters) !== null && _d !== void 0 ? _d : 0, 10),
            data: json.data ? Buffer.from(json.data, 'hex') : Buffer.alloc(0)
        });
    }
}
exports.SpendableKeyDetails = SpendableKeyDetails;
SpendableKeyDetails.FLAG_ENCRYPTED = SeedDetails_1.SeedDetails.FLAG_ENCRYPTED;
SpendableKeyDetails.FLAG_CONTAINS_KDF_ITERS = SeedDetails_1.SeedDetails.FLAG_CONTAINS_KDF_ITERS;
SpendableKeyDetails.SEED_FORMAT_BIP39 = SeedDetails_1.SeedDetails.SEED_FORMAT_BIP39;
SpendableKeyDetails.DEFAULT_SEED_FORMAT = SeedDetails_1.SeedDetails.DEFAULT_SEED_FORMAT;
SpendableKeyDetails.ENCRYPTION_FORMAT_NONE = SeedDetails_1.SeedDetails.ENCRYPTION_FORMAT_NONE;
SpendableKeyDetails.ENCRYPTION_FORMAT_SALTED_TAGGED_AES_256_GCM = SeedDetails_1.SeedDetails.ENCRYPTION_FORMAT_SALTED_TAGGED_AES_256_GCM;
SpendableKeyDetails.DEFAULT_ENCRYPTION_FORMAT = SeedDetails_1.SeedDetails.DEFAULT_ENCRYPTION_FORMAT;
