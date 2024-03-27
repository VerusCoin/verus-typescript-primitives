import * as keylist from './keys';
import * as AttestationData from './classes/IdentityData';
export declare const keymap: {
    [key: string]: keylist.VDXFKeyInterface;
};
export declare const attestationDataKeys: {
    [key: string]: keylist.VDXFKeyInterface;
};
export declare const IdentityVdxfidMap: {
    [x: string]: {
        name: string;
        type: AttestationData.IdentityDataClassTypes;
    };
};
