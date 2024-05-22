import * as keylist from '../keys';
export declare const friendlyName: (vdfxkey: any) => string;
export declare const getIdentityDataType: (vdfxkey: any) => string | keylist.VDXFKeyInterface;
export declare const IdentityVdxfidMap: {
    [x: string]: {
        name: string;
        type: keylist.VDXFKeyInterface;
    } | {
        name: string;
        type: string;
    };
};
