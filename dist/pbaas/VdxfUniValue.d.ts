/// <reference types="bn.js" />
/// <reference types="node" />
import { BigNumber } from '../utils/types/BigNumber';
import { SerializableEntity } from '../utils/types/SerializableEntity';
import { CurrencyValueMap } from './CurrencyValueMap';
import { Rating, RatingJson } from './Rating';
import { TransferDestination, TransferDestinationJson } from './TransferDestination';
import { ContentMultiMapRemove, ContentMultiMapRemoveJson } from './ContentMultiMapRemove';
import { CrossChainDataRef, CrossChainDataRefJson } from './CrossChainDataRef';
import { SignatureData, SignatureJsonDataInterface } from './SignatureData';
import { DataDescriptor, DataDescriptorJson } from './DataDescriptor';
import { MMRDescriptor, MMRDescriptorJson } from './MMRDescriptor';
export declare const VDXF_UNI_VALUE_VERSION_INVALID: import("bn.js");
export declare const VDXF_UNI_VALUE_VERSION_CURRENT: import("bn.js");
export declare type VdxfUniType = string | Buffer | BigNumber | CurrencyValueMap | Rating | TransferDestination | ContentMultiMapRemove | CrossChainDataRef | SignatureData | DataDescriptor | MMRDescriptor;
export interface VdxfUniValueJson {
    [key: string]: string | number | RatingJson | TransferDestinationJson | ContentMultiMapRemoveJson | CrossChainDataRefJson | SignatureJsonDataInterface | DataDescriptorJson | MMRDescriptorJson;
    serializedHex?: string;
    serializedBase64?: string;
    message?: string;
}
export declare type JsonSerializableObject = CurrencyValueMap | Rating | TransferDestination | ContentMultiMapRemove | CrossChainDataRef | SignatureData | DataDescriptor | MMRDescriptor;
export declare class VdxfUniValue implements SerializableEntity {
    values: Map<string, VdxfUniType>;
    version: BigNumber;
    constructor(data?: {
        values: Map<string, VdxfUniType>;
        version?: BigNumber;
    });
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number): number;
    VDXFDataToUniValue(buffer: Buffer, offset?: number, pSuccess?: any): {
        objectUni: {
            key: string;
            value: VdxfUniType;
        };
        offset: number;
        pSuccess: {
            value: boolean;
        };
    };
    static fromJson(obj: VdxfUniValueJson): VdxfUniValue;
    toJson(): VdxfUniValueJson;
}
