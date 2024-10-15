import { ApiResponse } from "../../ApiResponse";
import { SignatureDataInfo } from "../../../utils/types/Signature";
import { MmrDescriptorParameters } from "../../../utils/types/MmrDescriptor";
import { DataDescriptorInfo } from "../../../utils/types/DataDescriptor";
export declare class SignDataResponse extends ApiResponse {
    result: {
        mmrdescriptor_encrypted?: MmrDescriptorParameters;
        mmrdescriptor?: MmrDescriptorParameters;
        signature?: string;
        signaturedata_encrypted?: DataDescriptorInfo;
        signaturedata_ssk?: string;
        signaturedata?: SignatureDataInfo;
        system?: string;
        systemid?: string;
        hashtype?: string;
        mmrhashtype?: string;
        hash?: string;
        identity?: string;
        canonicalname?: string;
        address?: string;
        signatureheight?: number;
    };
}
