import { SerializableEntityBase } from '../../../utils/types/SerializableEntityBase';
import { BigNumber } from '../../../utils/types/BigNumber';
import { SerializableEntity } from '../../../utils/types/SerializableEntity';
import { CompactIAddressObject, CompactAddressObjectJson } from '../CompactAddressObject';
export type AuthenticationResponseDetailsJson = {
    flags: string;
    requestid?: CompactAddressObjectJson;
};
export declare class AuthenticationResponseDetails extends SerializableEntityBase implements SerializableEntity {
    flags?: BigNumber;
    requestID?: CompactIAddressObject;
    static FLAG_HAS_REQUEST_ID: import("bn.js");
    constructor(data?: {
        flags?: BigNumber;
        requestID?: CompactIAddressObject;
    });
    hasRequestID(): boolean;
    setFlags(): void;
    calcFlags(flags?: BigNumber): BigNumber;
    toSha256(): Buffer<ArrayBufferLike>;
    getByteLength(): number;
    toBuffer(): Buffer<ArrayBufferLike>;
    fromBuffer(buffer: Buffer, offset?: number, rootSystemName?: string): number;
    toJson(): AuthenticationResponseDetailsJson;
    static fromJson(json: AuthenticationResponseDetailsJson): AuthenticationResponseDetails;
}
