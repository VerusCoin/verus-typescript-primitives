/// <reference types="node" />
/// <reference types="bn.js" />
import { BigNumber } from '../utils/types/BigNumber';
import { SerializableEntity } from '../utils/types/SerializableEntity';
export interface ContentMultiMapRemoveJson {
    version: number;
    action: number;
    entrykey: string;
    valuehash: string;
}
export declare class ContentMultiMapRemove implements SerializableEntity {
    version: BigNumber;
    action: BigNumber;
    entry_key: string;
    value_hash: Buffer;
    static VERSION_INVALID: import("bn.js");
    static VERSION_FIRST: import("bn.js");
    static VERSION_LAST: import("bn.js");
    static VERSION_CURRENT: import("bn.js");
    static ACTION_FIRST: import("bn.js");
    static ACTION_REMOVE_ONE_KEYVALUE: import("bn.js");
    static ACTION_REMOVE_ALL_KEYVALUE: import("bn.js");
    static ACTION_REMOVE_ALL_KEY: import("bn.js");
    static ACTION_CLEAR_MAP: import("bn.js");
    static ACTION_LAST: import("bn.js");
    constructor(data?: {
        version?: BigNumber;
        action?: BigNumber;
        entry_key?: string;
        value_hash?: Buffer;
    });
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number): number;
    static fromJson(data: ContentMultiMapRemoveJson): ContentMultiMapRemove;
    toJson(): ContentMultiMapRemoveJson;
    isValid(): boolean;
}
