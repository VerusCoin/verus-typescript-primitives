/// <reference types="node" />
import { VDXFObject } from "..";
import { Attestation } from "./Challenge";
import { Context } from "./Context";
import { Request, RequestInterface } from "./Request";
export interface DecisionInterface {
    decision_id: string;
    request: RequestInterface;
    created_at: number;
    salt?: string;
    skipped?: boolean;
    context?: Context;
    attestations?: Array<Attestation>;
}
export declare class Decision extends VDXFObject {
    decision_id: string;
    context?: Context;
    request: Request;
    created_at: number;
    skipped?: boolean;
    attestations: Array<any>;
    salt?: string;
    constructor(decision?: DecisionInterface, vdxfkey?: string);
    dataByteLength(): number;
    toDataBuffer(): Buffer;
    fromDataBuffer(buffer: Buffer, offset?: number, readRequest?: boolean): number;
    toJson(): {
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
            signature: import("..").VerusIDSignatureJson;
            challenge: {
                vdxfkey: string;
                challenge_id: string;
                requested_access: import("./Challenge").RequestedPermission[];
                requested_access_audience: import("./Challenge").RequestedPermission[];
                subject: import("./Challenge").Subject[];
                provisioning_info: import("./Challenge").ProvisioningInfo[];
                alt_auth_factors: import("./Challenge").AltAuthFactor[];
                session_id: string;
                attestations: Attestation[];
                redirect_uris: {
                    uri: string;
                    vdxfkey: string;
                }[];
                created_at: number;
                salt: string;
                context: Context;
                skip: boolean;
            };
        };
    };
}
