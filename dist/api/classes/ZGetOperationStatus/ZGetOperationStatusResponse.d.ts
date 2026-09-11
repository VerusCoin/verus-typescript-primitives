import { ApiResponse } from "../../ApiResponse";
export type z_operation = {
    id: string;
    status: string;
    method: string;
    creation_time: number;
    result?: {
        [key: string]: any;
    };
    error?: {
        code: number;
        message: string;
    };
    execution_secs?: number;
    params: {
        [key: string]: any;
    } | Array<{
        [key: string]: any;
    }>;
};
export declare class ZGetOperationStatusResponse extends ApiResponse {
    result: Array<z_operation>;
}
