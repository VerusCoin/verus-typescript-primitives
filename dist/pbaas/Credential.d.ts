/// <reference types="bn.js" />
/// <reference types="node" />
import { BigNumber } from "../utils/types/BigNumber";
import { SerializableEntity } from "../utils/types/SerializableEntity";
export declare type CredentialJSON = {
    version?: number;
    flags?: number;
    credentialType?: number;
    credential?: string;
    recipient?: string;
    note?: string;
};
export declare class Credential implements SerializableEntity {
    static VERSION_INVALID: import("bn.js");
    static VERSION_FIRST: import("bn.js");
    static VERSION_LAST: import("bn.js");
    static VERSION_CURRENT: import("bn.js");
    static FLAG_NOTE_PRESENT: import("bn.js");
    static CREDENTIAL_UNKNOWN: import("bn.js");
    static CREDENTIAL_USERNAME: import("bn.js");
    static CREDENTIAL_PASSWORD: import("bn.js");
    static CREDENTIAL_CARD_NUMBER: import("bn.js");
    static CREDENTIAL_CARD_EXPIRATION_MONTH: import("bn.js");
    static CREDENTIAL_CARD_EXPIRATION_YEAR: import("bn.js");
    static CREDENTIAL_CARD_SECURITY_CODE: import("bn.js");
    static CREDENTIAL_ADDRESS: import("bn.js");
    static CREDENTIAL_AREA_CODE: import("bn.js");
    static CREDENTIAL_DATE_OF_BIRTH: import("bn.js");
    static CREDENTIAL_ID: import("bn.js");
    static CREDENTIAL_PHONE_NUMBER: import("bn.js");
    version: BigNumber;
    flags: BigNumber;
    credentialType: BigNumber;
    credential: string;
    recipient: string;
    note: string;
    constructor(data?: {
        version?: BigNumber;
        flags?: BigNumber;
        credentialType?: BigNumber;
        credential?: string;
        recipient?: string;
        note?: string;
    });
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number): number;
    hasNote(): boolean;
    calcFlags(): BigNumber;
    setFlags(): void;
    isValid(): boolean;
    toJSON(): CredentialJSON;
    static fromJSON(json: CredentialJSON): Credential;
}
