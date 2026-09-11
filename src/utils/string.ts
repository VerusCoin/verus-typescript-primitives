import bufferutils from "../utils/bufferutils";

export const isHexString = (s: string) => {
  return typeof s === 'string' && s.length % 2 === 0 && !/[^0-9a-fA-F]/.test(s);
}

export const readLimitedString = (reader: InstanceType<typeof bufferutils.BufferReader>, limit: number): Buffer => {
  const size = reader.readCompactSize();
  if (size > limit) {
    throw new Error("String length limit exceeded");
  }

  return reader.readSlice(size);
}
