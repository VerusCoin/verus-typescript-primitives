import { TxDestination } from './TxDestination';
import { SerializableEntity } from '../utils/types/SerializableEntity';
import { BigNumber } from '../utils/types/BigNumber';
export type VData = Array<Buffer>;
export declare class OptCCParams implements SerializableEntity {
    version: BigNumber;
    evalCode: BigNumber;
    m: BigNumber;
    n: BigNumber;
    destinations: Array<TxDestination>;
    vData: VData;
    constructor(data?: {
        version?: BigNumber;
        evalCode?: BigNumber;
        m?: BigNumber;
        n?: BigNumber;
        destinations?: Array<TxDestination>;
        vData?: VData;
    });
    /** @deprecated Use evalCode instead */
    get eval_code(): BigNumber;
    /** @deprecated Use vData instead */
    get vdata(): VData;
    getParamObject(): null | Buffer;
    isValid(): boolean;
    static fromChunk(chunk: Buffer): OptCCParams;
    toChunk(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number): number;
    internalGetByteLength(asChunk: boolean): number;
    getByteLength(): number;
    private internalToBuffer;
    toBuffer(): Buffer;
}
