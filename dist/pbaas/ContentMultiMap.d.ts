import { VdxfUniValue, VdxfUniValueJson } from './VdxfUniValue';
import { SerializableEntity } from '../utils/types/SerializableEntity';
import { KvMap } from '../utils/KvMap';
export type ContentMultiMapPrimitive = VdxfUniValue | Buffer;
export type ContentMultiMapPrimitiveJson = VdxfUniValueJson | string;
export type ContentMultiMapJsonValue = ContentMultiMapPrimitiveJson | Array<ContentMultiMapPrimitiveJson>;
export type ContentMultiMapJson = {
    [key: string]: ContentMultiMapJsonValue;
};
export type KvValueArrayItem = Buffer | ContentMultiMapJson;
export declare function isKvValueArrayItemVdxfUniValueJson(x: ContentMultiMapJsonValue): x is VdxfUniValueJson;
/**
 * KvContent is KvMap specialized for ContentMultiMap values.
 * Keys are CompactIAddressObject; values are arrays of ContentMultiMapPrimitive.
 */
export declare class KvContent extends KvMap<Array<ContentMultiMapPrimitive>> {
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
