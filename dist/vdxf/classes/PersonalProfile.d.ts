/// <reference types="node" />
import { VDXFObject } from "..";
export declare class DataCategory {
    data: Array<VDXFObject>;
    category: string;
    details: string;
    vdxfid: string;
    constructor(data: Array<VDXFObject> | Array<{
        vdxfid: string;
    }>, category: string, vdxfid: string, details: string);
}
declare class PersonalDataCategory extends DataCategory {
    constructor();
}
declare class ContactDataCategory extends DataCategory {
    constructor();
}
declare class LocationDataCategory extends DataCategory {
    constructor();
}
declare class BankingDataCategory extends DataCategory {
    constructor();
}
declare class DocumentsCategory extends DataCategory {
    constructor();
}
export declare const defaultPersonalProfileDataTemplate: (PersonalDataCategory | ContactDataCategory | LocationDataCategory | BankingDataCategory | DocumentsCategory)[];
export declare class PersonalProfileDataStore extends VDXFObject {
    data: {
        [key: string]: DataCategory;
    };
    constructor(data?: Array<DataCategory>);
    dataByteLength(): number;
    toDataBuffer(): Buffer;
    fromDataBuffer(buffer: Buffer, offset?: number): number;
    toJson(): {
        data: {
            [key: string]: DataCategory;
        };
    };
}
export {};
