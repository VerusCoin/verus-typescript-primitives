import { SerializableEntityBase } from '../../../utils/types/SerializableEntityBase';
import { BigNumber } from "../../../utils/types/BigNumber";
import { SerializableDataEntity, SerializableEntity } from "../../../utils/types/SerializableEntity";
import { OrdinalVDXFObjectReservedData, OrdinalVDXFObjectReservedDataJson } from "../../../constants/ordinals/types";
export interface OrdinalVDXFObjectInterfaceTemplate<T> {
    version?: BigNumber;
    type?: BigNumber;
    key?: string;
    data?: T;
}
export type OrdinalVDXFObjectJsonTemplate<T> = {
    version: string;
    type: string;
    vdxfkey?: string;
    data?: T;
};
export type BufferOrOrdinalVDXFObjectReservedData = Buffer | OrdinalVDXFObjectReservedData;
export type StringOrOrdinalVDXFObjectReservedDataJson = string | OrdinalVDXFObjectReservedDataJson;
export type OrdinalVDXFObjectInterface = OrdinalVDXFObjectInterfaceTemplate<BufferOrOrdinalVDXFObjectReservedData>;
export type OrdinalVDXFObjectJson = OrdinalVDXFObjectJsonTemplate<StringOrOrdinalVDXFObjectReservedDataJson>;
export type OrdinalVDXFObjectDataClass = new (...args: any[]) => OrdinalVDXFObjectReservedData;
export type OrdinalVDXFObjectClass = new (...args: any[]) => OrdinalVDXFObject;
export declare const getOrdinalVDXFObjectClassForType: (type: BigNumber) => OrdinalVDXFObjectClass;
export declare class OrdinalVDXFObject extends SerializableEntityBase implements SerializableEntity {
    version: BigNumber;
    type: BigNumber;
    key?: string;
    data?: BufferOrOrdinalVDXFObjectReservedData;
    static VERSION_INVALID: import("bn.js");
    static VERSION_FIRST: import("bn.js");
    static VERSION_LAST: import("bn.js");
    static VERSION_CURRENT: import("bn.js");
    constructor(request?: OrdinalVDXFObjectInterfaceTemplate<BufferOrOrdinalVDXFObjectReservedData>);
    isDefinedByVdxfKey(): boolean;
    isDefinedByTextVdxfKey(): boolean;
    isDefinedByIDOrCurrencyFQN(): boolean;
    isDefinedByCustomKey(): boolean;
    getIAddressKey(): string;
    getDataByteLength(): number;
    toDataBuffer(): Buffer;
    fromDataBuffer(buffer: Buffer, rootSystemName?: string): void;
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBufferOptionalType(buffer: Buffer, offset?: number, type?: BigNumber, key?: string, rootSystemName?: string): number;
    fromBuffer(buffer: Buffer, offset?: number): number;
    toJson(): OrdinalVDXFObjectJson;
    static createFromBuffer(buffer: Buffer, offset?: number, optimizeWithOrdinal?: boolean, rootSystemName?: string): {
        offset: number;
        obj: OrdinalVDXFObject;
    };
}
export declare class GeneralTypeOrdinalVDXFObject extends OrdinalVDXFObject implements SerializableDataEntity {
    data: Buffer;
    key: string;
    constructor(request?: OrdinalVDXFObjectInterfaceTemplate<Buffer>);
    getDataByteLength(): number;
    toDataBuffer(): Buffer;
    fromDataBuffer(buffer: Buffer, rootSystemName?: string): void;
    static fromJson(details: OrdinalVDXFObjectJson): GeneralTypeOrdinalVDXFObject;
}
