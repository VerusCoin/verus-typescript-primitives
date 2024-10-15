/// <reference types="node" />
import { BufferDataVdxfObject } from '../index';
import { SerializableEntity } from '../../utils/types/SerializableEntity';
export declare class Attestation extends BufferDataVdxfObject {
    getAttestationData(): {
        [key: string]: AttestationViewRequest;
    };
}
export declare class AttestationViewRequest implements SerializableEntity {
    attestation_id: string;
    accepted_attestors: Array<string>;
    attestation_keys: Array<string>;
    attestor_filters: Array<string>;
    constructor(data?: {
        attestation_id?: string;
        accepted_attestors?: Array<string>;
        attestation_keys?: Array<string>;
        attestor_filters?: Array<string>;
    });
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number): number;
}
export declare class AttestationProvisioningData implements SerializableEntity {
    attestation_id: string;
    accepted_attestors: Array<string>;
    attestation_keys: Array<string>;
    attestor_filters: Array<string>;
    constructor(data?: {
        attestation_id?: string;
        accepted_attestors?: Array<string>;
        attestation_keys?: Array<string>;
        attestor_filters?: Array<string>;
    });
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number): number;
}
