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
    getDecisionHash(signedBlockheight: number, signatureVersion?: number): Buffer<ArrayBufferLike>;
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
            context: ReturnType<import("./Context").Context["toJson"]>;
            created_at: number;
            salt?: string;
            skipped?: boolean;
            request: ReturnType<import("./Request").Request["toJson"]>;
        };
    };
}
