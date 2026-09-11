import { ApiResponse } from "../../ApiResponse";
export declare class GetAddressMempoolResponse extends ApiResponse {
    result: Array<{
        satoshis: number;
        txid: string;
        index: number;
        spending: boolean;
        timestamp: number;
        prevtxid?: string;
        prevout?: number;
        address: string;
        currencyvalues?: {
            [key: string]: number;
        };
        currencynames?: {
            [key: string]: string;
        };
        sent?: {
            outputfunctions?: Array<string>;
            privateoutput?: number;
            outputs: Array<{
                addresses: string | Array<string>;
                amounts: {
                    [key: string]: number;
                };
            }>;
        };
    }>;
}
