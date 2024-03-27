/// <reference types="node" />
import { Decision, DecisionInterface } from "./Decision";
import { VDXFObject, VerusIDSignature, VerusIDSignatureInterface } from "../";
export interface ResponseInterface {
    system_id: string;
    signing_id: string;
    signature?: VerusIDSignatureInterface;
    decision: DecisionInterface;
}
export declare class Response extends VDXFObject {
    system_id: string;
    signing_id: string;
    signature?: VerusIDSignature;
    decision: Decision;
    constructor(response?: ResponseInterface, vdxfkey?: string);
    getDecisionHash(signedBlockheight: number, signatureVersion?: number): Buffer;
    dataByteLength(): number;
    toDataBuffer(): Buffer;
    fromDataBuffer(buffer: Buffer, offset?: number): number;
    toJson(): {
        vdxfkey: string;
        system_id: string;
        signature: VerusIDSignature;
        signing_id: string;
        decision: {
            vdxfkey: string;
            decision_id: string;
            context: {
                kv: {
                    [key: string]: string;
                };
                vdxfkey: string;
            };
            created_at: number;
            request: {
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
        };
    };
}
