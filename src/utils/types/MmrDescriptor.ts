import { DataDescriptorInfo } from './DataDescriptor';

export type MmrDescriptorParameters = {
  version?: number;
  objecthashtype?: number;
  mmrhashtype?: number;
  mmrroot?: DataDescriptorInfo;
  mmrhashes?: DataDescriptorInfo;
  datadescriptors?: DataDescriptorInfo[];
}
