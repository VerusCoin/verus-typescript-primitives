import { VdxfUniValue, VdxfUniValueJson } from './VdxfUniValue';
import { SerializableEntity } from '../utils/types/SerializableEntity';
import { CompactIAddressObject } from '../vdxf/classes/CompactAddressObject';
export type ContentMultiMapPrimitive = VdxfUniValue | Buffer;
export type ContentMultiMapPrimitiveJson = VdxfUniValueJson | string;
export type ContentMultiMapJsonValue = ContentMultiMapPrimitiveJson | Array<ContentMultiMapPrimitiveJson>;
export type ContentMultiMapJson = {
    [key: string]: ContentMultiMapJsonValue;
};
export type KvValueArrayItem = Buffer | ContentMultiMapJson;
export declare function isKvValueArrayItemVdxfUniValueJson(x: ContentMultiMapJsonValue): x is VdxfUniValueJson;
/**
 * KvContent wraps a Map whose internal keys are hex strings of CompactIAddressObject.toBuffer().
 * External callers always use CompactIAddressObject for keys.
 *
 * Keys whose toIAddress() resolves to the same iaddress are not allowed, because an FQN and a
 * TYPE_I_ADDRESS key can evaluate to the same underlying iaddress and would collide on-chain.
 */
export declare class KvContent {
    private _map;
    private static toInternalKey;
    private static keyFromInternalKey;
    get size(): number;
    set(key: CompactIAddressObject, value: Array<ContentMultiMapPrimitive>): this;
    get(key: CompactIAddressObject): Array<ContentMultiMapPrimitive> | undefined;
    has(key: CompactIAddressObject): boolean;
    delete(key: CompactIAddressObject): boolean;
    entries(): IterableIterator<[CompactIAddressObject, Array<ContentMultiMapPrimitive>]>;
}
export declare class ContentMultiMap implements SerializableEntity {
    kvContent: KvContent;
    constructor(data?: {
        kvContent: KvContent;
    });
    getByteLength(): number;
    toBuffer(): Buffer<ArrayBufferLike>;
    fromBuffer(buffer: Buffer, offset?: number, parseVdxfObjects?: boolean): number;
    static fromJson(obj: {
        [key: string]: ContentMultiMapJsonValue;
    }): ContentMultiMap;
    toJson(): ContentMultiMapJson;
}
/**
 * FqnContentMultiMap is a ContentMultiMap variant used exclusively in PartialIdentity.
 * It serializes keys as full CompactIAddressObjects (preserving TYPE_FQN through binary
 * round-trips) rather than the daemon-compatible 20-byte iaddress hash format used by
 * ContentMultiMap. These two formats are not interchangeable.
 */
export declare class FqnContentMultiMap extends ContentMultiMap {
    getByteLength(): number;
    toBuffer(): Buffer<ArrayBufferLike>;
    fromBuffer(buffer: Buffer, offset?: number, parseVdxfObjects?: boolean): number;
    static fromJson(obj: {
        [key: string]: ContentMultiMapJsonValue;
    }): FqnContentMultiMap;
}
