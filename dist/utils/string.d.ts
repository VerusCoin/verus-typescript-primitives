/// <reference types="node" />
import bufferutils from "../utils/bufferutils";
export declare const isHexString: (s: string) => boolean;
export declare const readLimitedString: (reader: InstanceType<typeof bufferutils.BufferReader>, limit: number) => Buffer;
