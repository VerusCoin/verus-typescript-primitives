/// <reference types="bn.js" />
/// <reference types="node" />
import { BigNumber } from '../utils/types/BigNumber';
import { KeyID } from './KeyID';
import { SerializableEntity } from '../utils/types/SerializableEntity';
export declare const PRINCIPAL_DEFAULT_FLAGS: import("bn.js");
export declare const PRINCIPAL_VERSION_INVALID: import("bn.js");
export declare const PRINCIPAL_VERSION_CURRENT: import("bn.js");
export declare class Principal implements SerializableEntity {
    flags: BigNumber;
    version: BigNumber;
    min_sigs?: BigNumber;
    primary_addresses?: Array<KeyID>;
    constructor(data?: {
        version?: BigNumber;
        flags?: BigNumber;
        min_sigs?: BigNumber;
        primary_addresses?: Array<KeyID>;
    });
    protected serializeFlags(): boolean;
    protected serializeVersion(): boolean;
    protected serializePrimaryAddresses(): boolean;
    protected serializeMinSigs(): boolean;
    private getSelfByteLength;
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number): number;
}
