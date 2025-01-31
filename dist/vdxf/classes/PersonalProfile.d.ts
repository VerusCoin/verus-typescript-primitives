import { VDXFObject } from "..";
export declare class DataCategory extends VDXFObject {
    data: Array<string>;
    category: string;
    details: string;
    constructor(vdxfid?: string, data?: Array<string>, category?: string, details?: string);
}
