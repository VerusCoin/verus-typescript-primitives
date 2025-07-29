import bufferutils from "../utils/bufferutils";

export const isHexString = (s: string) => {
  try {
    const striBuf = Buffer.from(s, 'hex');
    striBuf.toString('hex');
  
    return true;
  } catch(e) {
    return false;
  }
}

export const readLimitedString = (reader: InstanceType<typeof bufferutils.BufferReader>, limit: number): Buffer => {
  const size = reader.readCompactSize();
  if (size > limit) {
    throw new Error("String length limit exceeded");
  }

  return reader.readSlice(size);
}