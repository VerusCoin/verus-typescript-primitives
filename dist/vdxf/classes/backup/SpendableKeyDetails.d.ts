import { SeedDetails, SeedDetailsInterface, SeedDetailsJson } from './SeedDetails';
export type SpendableKeyDetailsInterface = SeedDetailsInterface;
export type SpendableKeyDetailsJson = SeedDetailsJson;
export declare class SpendableKeyDetails extends SeedDetails {
    static FLAG_ENCRYPTED: import("bn.js");
    static FLAG_CONTAINS_KDF_ITERS: import("bn.js");
    static SEED_FORMAT_BIP39: import("bn.js");
    static DEFAULT_SEED_FORMAT: import("bn.js");
    static ENCRYPTION_FORMAT_NONE: import("bn.js");
    static ENCRYPTION_FORMAT_SALTED_TAGGED_AES_256_GCM: import("bn.js");
    static DEFAULT_ENCRYPTION_FORMAT: import("bn.js");
    constructor(data?: SpendableKeyDetailsInterface);
    static fromJson(json: SpendableKeyDetailsJson): SpendableKeyDetails;
}
