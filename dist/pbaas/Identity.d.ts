import { BigNumber } from '../utils/types/BigNumber';
import { Principal } from './Principal';
import { IdentityID } from './IdentityID';
import { SaplingPaymentAddress } from './SaplingPaymentAddress';
import { ContentMultiMap, ContentMultiMapJson } from './ContentMultiMap';
import { SerializableEntity } from '../utils/types/SerializableEntity';
import { KeyID } from './KeyID';
export declare const IDENTITY_VERSION_VAULT: import("bn.js");
export declare const IDENTITY_VERSION_PBAAS: import("bn.js");
export declare const IDENITTY_VERSION_INVALID: import("bn.js");
export declare const IDENTITY_FLAG_REVOKED: import("bn.js");
export declare const IDENTITY_FLAG_ACTIVECURRENCY: import("bn.js");
export declare const IDENTITY_FLAG_LOCKED: import("bn.js");
export declare const IDENTITY_FLAG_TOKENIZED_CONTROL: import("bn.js");
export declare const IDENTITY_MAX_UNLOCK_DELAY: import("bn.js");
export declare const IDENTITY_MAX_NAME_LEN: import("bn.js");
export type Hashes = Map<string, Buffer>;
export type VerusCLIVerusIDJsonBase<T = ContentMultiMapJson> = {
    contentmap?: {
        [key: string]: string;
    };
    contentmultimap?: T;
    flags?: number;
    identityaddress?: string;
    minimumsignatures?: number;
    name?: string;
    parent?: string;
    primaryaddresses?: Array<string>;
    privateaddress?: string;
    recoveryauthority?: string;
    revocationauthority?: string;
    systemid?: string;
    timelock?: number;
    version?: number;
};
export type VerusCLIVerusIDJson = VerusCLIVerusIDJsonBase<ContentMultiMapJson>;
export type VerusIDInitData = {
    version?: BigNumber;
    flags?: BigNumber;
    minSigs?: BigNumber;
    primaryAddresses?: Array<KeyID>;
    parent?: IdentityID;
    systemId?: IdentityID;
    name?: string;
    contentMap?: Hashes;
    contentMultiMap?: ContentMultiMap;
    revocationAuthority?: IdentityID;
    recoveryAuthority?: IdentityID;
    privateAddresses?: Array<SaplingPaymentAddress>;
    unlockAfter?: BigNumber;
};
export declare class Identity extends Principal implements SerializableEntity {
    parent: IdentityID;
    systemId: IdentityID;
    name: string;
    contentMap: Hashes;
    contentMultiMap: ContentMultiMap;
    revocationAuthority: IdentityID;
    recoveryAuthority: IdentityID;
    privateAddresses: Array<SaplingPaymentAddress>;
    unlockAfter: BigNumber;
    static VERSION_INVALID: import("bn.js");
    static VERSION_VERUSID: import("bn.js");
    static VERSION_VAULT: import("bn.js");
    static VERSION_PBAAS: import("bn.js");
    static VERSION_CURRENT: import("bn.js");
    static VERSION_FIRSTVALID: import("bn.js");
    static VERSION_LASTVALID: import("bn.js");
    constructor(data?: VerusIDInitData);
    /** @deprecated Use systemId instead */
    get system_id(): IdentityID;
    /** @deprecated Use contentMap instead */
    get content_map(): Hashes;
    /** @deprecated Use contentMultiMap instead */
    get content_multimap(): ContentMultiMap;
    /** @deprecated Use revocationAuthority instead */
    get revocation_authority(): IdentityID;
    /** @deprecated Use recoveryAuthority instead */
    get recovery_authority(): IdentityID;
    /** @deprecated Use privateAddresses instead */
    get private_addresses(): Array<SaplingPaymentAddress>;
    /** @deprecated Use unlockAfter instead */
    get unlock_after(): BigNumber;
    protected containsParent(): boolean;
    protected containsSystemId(): boolean;
    protected containsName(): boolean;
    protected containsContentMap(): boolean;
    protected containsContentMultiMap(): boolean;
    protected containsRevocation(): boolean;
    protected containsRecovery(): boolean;
    protected containsPrivateAddresses(): boolean;
    protected containsUnlockAfter(): boolean;
    private getIdentityByteLength;
    getByteLength(): number;
    protected createContentMultiMap(): ContentMultiMap;
    clearContentMultiMap(): void;
    toBuffer(): Buffer<ArrayBufferLike>;
    fromBuffer(buffer: Buffer, offset?: number, parseVdxfObjects?: boolean): number;
    toJson(): VerusCLIVerusIDJson;
    getIdentityAddress(): string;
    isRevoked(): boolean;
    isLocked(): boolean;
    hasActiveCurrency(): boolean;
    hasTokenizedIdControl(): boolean;
    lock(unlockTime: BigNumber): void;
    unlock(height?: BigNumber, txExpiryHeight?: BigNumber): void;
    revoke(): void;
    unrevoke(): void;
    setPrimaryAddresses(addresses: Array<string>): void;
    setRevocation(iAddr: string): void;
    setRecovery(iAddr: string): void;
    setPrivateAddress(zAddr: string): void;
    upgradeVersion(version?: BigNumber): void;
    protected static internalFromJson<T>(json: VerusCLIVerusIDJson, ctor: new (...args: any[]) => T): T;
    static fromJson(json: VerusCLIVerusIDJson): Identity;
}
