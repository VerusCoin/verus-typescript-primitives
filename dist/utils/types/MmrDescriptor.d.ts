import { DataDescriptorInfo } from './DataDescriptor';
export declare type MmrDescriptorParameters = {
    version?: number;
    objecthashtype?: number;
    mmrhashtype?: number;
    mmrroot?: DataDescriptorInfo;
    mmrhashes?: DataDescriptorInfo;
    datadescriptors?: DataDescriptorInfo[];
};
