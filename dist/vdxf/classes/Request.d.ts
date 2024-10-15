/// <reference types="node" />
import { VDXFObject, VerusIDSignature, VerusIDSignatureInterface } from "../";
import { Challenge, ChallengeInterface } from "./Challenge";
export interface RequestInterface {
    system_id: string;
    signing_id: string;
    signature?: VerusIDSignatureInterface;
    challenge: ChallengeInterface;
}
export declare class Request extends VDXFObject {
    system_id: string;
    signing_id: string;
    signature?: VerusIDSignature;
    challenge: Challenge;
    constructor(request?: RequestInterface, vdxfkey?: string);
    getChallengeHash(signedBlockheight: number, signatureVersion?: number): Buffer;
    toJson(): {
        vdxfkey: string;
        system_id: string;
        signing_id: string;
        signature: import("../").VerusIDSignatureJson;
        challenge: {
            vdxfkey: string;
            challenge_id: string;
            requested_access: import("./Challenge").RequestedPermission[];
            requested_access_audience: import("./Challenge").Audience[];
            subject: import("./Challenge").Subject[];
            provisioning_info: import("./Challenge").ProvisioningInfo[];
            alt_auth_factors: import("./Challenge").AltAuthFactor[];
            session_id: string;
            attestations: import("./Attestation").Attestation[];
            redirect_uris: {
                uri: string;
                vdxfkey: string;
            }[];
            created_at: number;
            salt: string;
            context: import("./Context").Context;
            skip: boolean;
        };
    };
    protected _dataByteLength(signer?: string): number;
    protected _toDataBuffer(signer?: string): Buffer;
    dataByteLength(): number;
    toDataBuffer(): Buffer;
    protected _fromDataBuffer(buffer: Buffer, offset?: number): number;
    fromDataBuffer(buffer: Buffer, offset?: number): number;
    toWalletDeeplinkUri(): string;
    static fromWalletDeeplinkUri(uri: string): Request;
    toQrString(): string;
    static fromQrString(qrstring: string): Request;
}
