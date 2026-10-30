import { SerializableEntityBase } from '../utils/types/SerializableEntityBase';
import { BigNumber } from '../utils/types/BigNumber';
import { SerializableEntity } from '../utils/types/SerializableEntity';
import { AllowedHashes } from '../constants/pbaas';
import { VdxfUniValue, VdxfUniValueJson } from './VdxfUniValue';
export type PartialMMRDataUnit = {
    type: BigNumber;
    data: Buffer | VdxfUniValue;
};
export type PartialMMRDataInitData = {
    flags?: BigNumber;
    data?: Array<PartialMMRDataUnit>;
    salt?: Array<Buffer>;
    mmrhashtype?: BigNumber;
    priormmr?: Array<Buffer>;
};
export type PartialMMRDataJson = {
    flags?: string;
    data?: Array<{
        type: string;
        data: string | VdxfUniValueJson;
    }>;
    salt?: Array<string>;
    mmrhashtype?: string;
    priormmr?: Array<string>;
};
export type CLIMMRDataStringKey = 'filename' | 'serializedhex' | 'message' | 'datahash';
export type CLIMMRDataKey = CLIMMRDataStringKey | 'vdxfdata';
export type SingleKeyMMRData = {
    [K in CLIMMRDataStringKey]: {
        [P in K]: string;
    };
}[CLIMMRDataStringKey];
export type PartialMMRDataCLIJson = {
    mmrdata: Array<SingleKeyMMRData | {
        ['vdxfdata']: VdxfUniValueJson;
    }>;
    mmrsalt?: Array<string>;
    mmrhashtype?: AllowedHashes;
};
/**
 * Request-envelope storage, not a daemon wire class. RAWSTRING and prior-MMR
 * fields remain serializable locally, but cannot be converted to RPC requests.
 */
export declare class PartialMMRData extends SerializableEntityBase implements SerializableEntity {
    flags: BigNumber;
    data: Array<PartialMMRDataUnit>;
    mmrhashtype?: BigNumber;
    salt?: Array<Buffer>;
    priormmr?: Array<Buffer>;
    static CONTAINS_SALT: import("bn.js");
    static CONTAINS_PRIORMMR: import("bn.js");
    constructor(data?: PartialMMRDataInitData);
    protected containsSalt(): boolean;
    protected containsPriorMMR(): boolean;
    private toggleContainsSalt;
    private toggleContainsPriorMMR;
    private getPartialMMRDataByteLength;
    getByteLength(): number;
    fromBuffer(buffer: Buffer, offset?: number): number;
    toBuffer(): Buffer;
    toJson(): PartialMMRDataJson;
    static fromJson(json: PartialMMRDataJson): PartialMMRData;
    toCLIJson(): PartialMMRDataCLIJson;
    static fromCLIJson(json: PartialMMRDataCLIJson): PartialMMRData;
}
