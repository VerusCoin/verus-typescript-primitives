/// <reference types="node" />
import { VDXFObject, VerusIDSignature } from "../";
import { CMerkleMountainRange, CMMRProof } from "./MMR";
import { Hash160 } from "./Hash160";
import { Utf8DataVdxfObject, HexDataVdxfObject, BufferDataVdxfObject, PNGImageVdxfObject } from '..';
export declare class AttestationDataType {
    dataItem: Utf8DataVdxfObject | HexDataVdxfObject | BufferDataVdxfObject | PNGImageVdxfObject | VDXFObject;
    salt: Buffer;
    constructor(data?: any, vdxfkey?: string, salt?: string);
    static getDataItem(vdxfkey: any, data: any): any;
    dataByteLength(): number;
    toBuffer(): Buffer;
    fromDataBuffer(buffer: Buffer, offset?: number, vdxfkey?: string): number;
}
export declare const friendlyNames: (vdfxkey: any) => string;
export declare class AttestationData {
    components: Map<number, AttestationDataType>;
    constructor(components?: Map<number, AttestationDataType>);
    dataByteLength(): number;
    toDataBuffer(): Buffer;
    fromDataBuffer(buffer: Buffer, offset?: number): number;
    size(): number;
    setDataFromJson(data: Array<AttestationDataType>, getSalt: Function): void;
    getHash(key: any): Buffer;
}
export interface AttestationRequestInterfaceDataInterface {
    accepted_attestors: Array<Hash160 | string>;
    attestation_keys: Array<Hash160 | string>;
    attestor_filters?: Array<Hash160 | string>;
}
export declare class AttestationRequest extends VDXFObject {
    data: AttestationRequestInterfaceDataInterface;
    dataByteLength(): number;
    toDataBuffer(): Buffer;
    fromDataBuffer(buffer: Buffer, offset?: number): number;
    static initializeData(data: string | AttestationRequestInterfaceDataInterface): any;
    toJson(): {
        vdxfkey: string;
        data: {
            accepted_attestors: string[];
            attestation_keys: string[];
            attestor_filters: string[];
        };
    };
}
export declare class Attestation extends VDXFObject {
    static TYPE_STRING: number;
    static TYPE_BYTES: number;
    static TYPE_BASE64: number;
    static TYPE_URL: number;
    data: AttestationData;
    system_id: string;
    signing_id: string;
    signature?: VerusIDSignature;
    mmr: CMerkleMountainRange;
    constructor(data?: {
        data?: AttestationData;
        signature?: VerusIDSignature;
        mmr?: CMerkleMountainRange;
        system_id: string;
        signing_id: string;
    }, vdxfkey?: string);
    dataByteLength(): number;
    toDataBuffer(): Buffer;
    fromDataBuffer(buffer: Buffer, offset?: number): number;
    createMMR(): CMerkleMountainRange;
    rootHash(): Buffer;
    getProof(keys: Array<number>): CPartialAttestationProof;
    checkProof(): Promise<void>;
    getHash(key: any): Buffer;
}
export declare class CPartialAttestationProof extends VDXFObject {
    private EType;
    type: number;
    proof: CMMRProof;
    componentsArray: AttestationData;
    system_id: string;
    signing_id: string;
    signature?: VerusIDSignature;
    constructor(data?: {
        proof?: CMMRProof;
        componentsArray?: AttestationData;
        system_id: string;
        signing_id: string;
    }, vdxfkey?: string);
    dataByteLength(): number;
    toDataBuffer(): Buffer;
    fromDataBuffer(buffer: Buffer, offset?: number): number;
    checkProof(item: number): Buffer;
}
