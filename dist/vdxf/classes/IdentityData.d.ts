export declare const enum IdentityDataClassTypes {
    BUFFER_DATA_STRING = 1,
    BUFFER_DATA_BYTES = 2,
    BUFFER_DATA_BASE64 = 3,
    URL = 4,
    PNG_IMAGE = 5,
    KEY_ONLY = 6,
    BOOLEAN = 7
}
export declare const IdentityVdxfidMap: {
    [x: string]: {
        name: string;
        type: IdentityDataClassTypes;
    };
};
