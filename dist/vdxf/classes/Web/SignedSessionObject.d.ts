import { VDXFObject, VerusIDSignature, VerusIDSignatureInterface } from "../../";
import { SignedSessionObjectData } from "./SignedSessionObjectData";
export interface AuthorizedWebRequestInterface {
    system_id: string;
    signing_id: string;
    signature?: VerusIDSignatureInterface;
    data: SignedSessionObjectData;
}
/**
 * @deprecated Disabled and scheduled for removal in a future release. Construction always throws.
 */
export declare class SignedSessionObject extends VDXFObject {
    system_id: string;
    signing_id: string;
    signature?: VerusIDSignature;
    data: SignedSessionObjectData;
    constructor(request?: AuthorizedWebRequestInterface);
    getDataHash(signedBlockheight: number, signatureVersion?: number): Buffer<ArrayBufferLike>;
    toJson(): {
        vdxfkey: string;
        system_id: string;
        signing_id: string;
        signature: import("../../").VerusIDSignatureJson;
        challenge: {
            session_id: string;
            timestamp_micro: number;
            body: string;
        };
    };
    protected _dataByteLength(signer?: string): number;
    protected _toDataBuffer(signer?: string): Buffer;
    dataByteLength(): number;
    toDataBuffer(): Buffer;
    protected _fromDataBuffer(buffer: Buffer, offset?: number): number;
    fromDataBuffer(buffer: Buffer, offset?: number): number;
    getHeaders(): {
        "VDXF-Key": string;
        "VDXF-Version": string;
        "VerusID-Session-ID": string;
        "VerusID-Timestamp-Micro": string;
        "VerusID-Signature": string;
    };
    static fromHttpRequest(headers: {
        [key: string]: string;
    }, body: string, system_id: string, signing_id: string): SignedSessionObject;
}
