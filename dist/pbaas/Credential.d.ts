/// <reference types="bn.js" />
/// <reference types="node" />
import { BigNumber } from "../utils/types/BigNumber";
import { SerializableEntity } from "../utils/types/SerializableEntity";
export declare type CredentialJSON = {
    version?: number;
    flags?: number;
    credentialkey?: string;
    credential?: Object;
    scopes?: Object;
    label?: string;
};
export declare class Credential implements SerializableEntity {
    static VERSION_INVALID: import("bn.js");
    static VERSION_FIRST: import("bn.js");
    static VERSION_LAST: import("bn.js");
    static VERSION_CURRENT: import("bn.js");
    static FLAG_LABEL_PRESENT: import("bn.js");
    version: BigNumber;
    flags: BigNumber;
    credentialKey: string;
    credential: Object;
    scopes: Object;
    label: string;
    constructor(data?: {
        version?: BigNumber;
        flags?: BigNumber;
        credentialKey?: string;
        credential?: Object;
        scopes?: Object;
        label?: string;
    });
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number): number;
    hasLabel(): boolean;
    calcFlags(): BigNumber;
    setFlags(): void;
    isValid(): boolean;
    toJSON(): CredentialJSON;
    static fromJSON(json: CredentialJSON): Credential;
}
