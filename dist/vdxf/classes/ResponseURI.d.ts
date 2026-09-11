import { SerializableEntityBase } from '../../utils/types/SerializableEntityBase';
import { BigNumber } from "../../utils/types/BigNumber";
import { SerializableEntity } from "../../utils/types/SerializableEntity";
export type ResponseURIJson = {
    type: string;
    uri: string;
};
export declare class ResponseURI extends SerializableEntityBase implements SerializableEntity {
    uri: Buffer;
    type: BigNumber;
    static TYPE_INVALID: import("bn.js");
    static TYPE_POST: import("bn.js");
    static TYPE_REDIRECT: import("bn.js");
    constructor(data?: {
        uri?: Buffer;
        type?: BigNumber;
    });
    getUriString(): string;
    static fromUriString(str: string, type?: BigNumber): ResponseURI;
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number): number;
    toJson(): ResponseURIJson;
    static fromJson(json: ResponseURIJson): ResponseURI;
}
