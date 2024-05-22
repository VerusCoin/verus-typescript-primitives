import * as keylist from './keys';
export declare const keymap: {
    [key: string]: keylist.VDXFKeyInterface;
};
export declare const attestationDataKeys: {
    [key: string]: keylist.VDXFKeyInterface;
};
export declare const IdentityVdxfidMap: {
    [x: string]: {
        name: string;
        type: keylist.VDXFKeyInterface;
    } | {
        name: string;
        type: string;
    };
};
