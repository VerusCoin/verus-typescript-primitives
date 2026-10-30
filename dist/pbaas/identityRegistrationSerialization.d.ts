import { IdentityID } from './IdentityID';
import bufferutils from '../utils/bufferutils';
export declare const MAX_IDENTITY_NAME_BYTES: number;
export declare function assertNameBytes(name: string): Buffer;
export declare function assertIdentityID(id: IdentityID, field: string, allowNull?: boolean): void;
export declare function identityIDFromJSON(address: string, field: string, allowNull?: boolean): IdentityID;
/** uint256 display hex is the reverse of the raw bytes used in serialization. */
export declare function uint256FromHex(hex: string, field: string): Buffer;
export declare function assertUint256(value: Buffer, field: string, allowNull?: boolean): void;
export declare function payloadFromHex(hex: string): Buffer;
export declare function boundedReader(buffer: Buffer, offset: number, length?: number): InstanceType<typeof bufferutils.BufferReader>;
export declare function readName(reader: InstanceType<typeof bufferutils.BufferReader>): string;
export declare function checkPayloadEnd(end: number, offset: number, length?: number): void;
