import { BigNumber } from '../utils/types/BigNumber';
import { SerializableEntity } from '../utils/types/SerializableEntity';
import { Identity, VerusCLIVerusIDJson, VerusIDInitData } from './Identity';
import { ContentMultiMap } from './ContentMultiMap';
export declare class PartialIdentity extends Identity implements SerializableEntity {
    contains: BigNumber;
    static PARTIAL_ID_CONTAINS_PARENT: import("bn.js");
    static PARTIAL_ID_CONTAINS_CONTENT_MULTIMAP: import("bn.js");
    static PARTIAL_ID_CONTAINS_PRIMARY_ADDRS: import("bn.js");
    static PARTIAL_ID_CONTAINS_REVOCATION: import("bn.js");
    static PARTIAL_ID_CONTAINS_RECOVERY: import("bn.js");
    static PARTIAL_ID_CONTAINS_UNLOCK_AFTER: import("bn.js");
    static PARTIAL_ID_CONTAINS_SYSTEM_ID: import("bn.js");
    static PARTIAL_ID_CONTAINS_PRIV_ADDRS: import("bn.js");
    static PARTIAL_ID_CONTAINS_CONTENT_MAP: import("bn.js");
    static PARTIAL_ID_CONTAINS_MINSIGS: import("bn.js");
    static PARTIAL_ID_CONTAINS_FLAGS: import("bn.js");
    static PARTIAL_ID_CONTAINS_VERSION: import("bn.js");
    constructor(data?: VerusIDInitData);
    containsFlags(): boolean;
    containsVersion(): boolean;
    containsPrimaryAddresses(): boolean;
    containsMinSigs(): boolean;
    containsParent(): boolean;
    containsSystemId(): boolean;
    containsContentMap(): boolean;
    containsContentMultiMap(): boolean;
    containsRevocation(): boolean;
    containsRecovery(): boolean;
    containsPrivateAddresses(): boolean;
    containsUnlockAfter(): boolean;
    createContentMultiMap(): ContentMultiMap;
    clearContentMultiMap(): void;
    private toggleContainsParent;
    private toggleContainsSystemId;
    private toggleContainsContentMap;
    private toggleContainsContentMultiMap;
    private toggleContainsRevocation;
    private toggleContainsRecovery;
    private toggleContainsPrivateAddresses;
    private toggleContainsUnlockAfter;
    private toggleContainsFlags;
    private toggleContainsVersion;
    private toggleContainsMinSigs;
    private toggleContainsPrimaryAddresses;
    private enableContainsFlags;
    private enableContainsUnlockAfter;
    private getPartialIdentityByteLength;
    getByteLength(): number;
    fromBuffer(buffer: Buffer, offset?: number, parseVdxfObjects?: boolean): number;
    toBuffer(): Buffer;
    static fromJson(json: VerusCLIVerusIDJson): PartialIdentity;
    lock(unlockTime: BigNumber): void;
    unlock(height?: BigNumber, txExpiryHeight?: BigNumber): void;
    revoke(): void;
    unrevoke(): void;
    /**
     * Returns an array of every key used in the content_multimap, both top-level and nested,
     * as strings. Keys that are hex-encoded CompactIAddressObject buffers are resolved via
     * toString() (which returns the iaddress or FQN string). Empty inner keys are skipped.
     */
    getContentMultiMapKeys(): string[];
    /**
     * Returns a partial identity with a plain ContentMultiMap equivalent of this PartialIdentity's
     * content_multimap. All outer keys are resolved to CompactIAddress objects as
     * i addresses (TYPE_I_ADDRESS, 20-byte hash on-wire format),
     * and all inner FqnVdxfUniValue objects are converted to plain VdxfUniValue with any FQN
     * keys resolved to their iaddress equivalents.
     *
     * Use this when the resulting ContentMultiMap must be daemon-compatible (e.g. for
     * comparing daemon output to identities made here).
     */
    withResolvedContentMultiMap(): PartialIdentity;
    toContentMultiMap(): ContentMultiMap;
}
