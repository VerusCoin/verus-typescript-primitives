import { BN } from "bn.js";
import bufferutils from "../utils/bufferutils";

export const VDXF_OBJECT_DEFAULT_VERSION = new BN(1, 10)
export const HASH160_BYTE_LENGTH = 20
export const I_ADDR_VERSION = 102
export const R_ADDR_VERSION = 60
export const NULL_ADDRESS = "i3UXS5QPRQGNRDDqVnyWTnmFCTHDbzmsYk"

const VERUS_DATA_SIGNATURE_PREFIX_STRING = "Verus signed data:\n"

var bufferWriter = new bufferutils.BufferWriter(
  Buffer.alloc(VERUS_DATA_SIGNATURE_PREFIX_STRING.length + 1)
);

bufferWriter.writeVarSlice(
  Buffer.from(VERUS_DATA_SIGNATURE_PREFIX_STRING, "utf-8")
);

export const VERUS_DATA_SIGNATURE_PREFIX: Buffer = bufferWriter.buffer;