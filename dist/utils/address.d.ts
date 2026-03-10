export declare const fromBase58Check: (address: string) => {
    version: number;
    hash: Buffer;
};
export declare const toBase58Check: (hash: Buffer, version: number) => string;
export declare const nameAndParentAddrToAddr: (name: string, parentIAddr?: string, version?: number) => string;
export declare const nameAndParentAddrToIAddr: (name: string, parentIAddr?: string) => string;
export declare const fqnToAddress: (fullyqualifiedname: string, rootSystemName?: string, version?: number) => string;
export declare const fqnToParentFqn: (fullyqualifiedname: string, rootSystemName?: string) => string | null;
export declare const fqnToParentAddress: (fullyqualifiedname: string, rootSystemName?: string) => string | null;
export declare const toIAddress: (fullyqualifiedname: string, rootSystemName?: string) => string;
export declare const toXAddress: (fullyqualifiedname: string, rootSystemName?: string) => string;
export declare function getDataKey(keyName: string, nameSpaceID?: string, verusChainId?: string, version?: number): {
    id: string;
    namespace: string;
};
export declare const decodeDestination: (destination: string) => Buffer;
export declare const decodeEthDestination: (destination: string) => Buffer;
