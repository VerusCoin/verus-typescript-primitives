import { IdentityID } from './IdentityID';
import { I_ADDR_VERSION } from '../constants/vdxf';
import { KOMODO_ASSETCHAIN_MAXLEN } from '../constants/pbaas';
import { decodeDestination } from '../utils/address';
import bufferutils from '../utils/bufferutils';

export const MAX_IDENTITY_NAME_BYTES = KOMODO_ASSETCHAIN_MAXLEN - 1;

export function assertNameBytes(name: string): Buffer {
  if (typeof name !== 'string') throw new Error('Reservation name must be a string');
  const bytes = Buffer.from(name, 'utf8');
  if (!bytes.length || bytes.length > MAX_IDENTITY_NAME_BYTES || bytes.toString('utf8') !== name) {
    throw new Error('Reservation name must be valid UTF-8 and contain 1–64 bytes');
  }
  return bytes;
}

export function assertIdentityID(id: IdentityID, field: string, allowNull = true): void {
  if (!id || id.version !== I_ADDR_VERSION || id.varlength ||
      !Buffer.isBuffer(id.hash) || id.hash.length !== 20 ||
      (!allowNull && id.hash.equals(Buffer.alloc(20)))) {
    throw new Error(`${field} must be ${allowNull ? 'a' : 'a non-null'} identity ID`);
  }
}

export function identityIDFromJSON(address: string, field: string, allowNull = true): IdentityID {
  const id = new IdentityID(allowNull && address === '' ? Buffer.alloc(20) : decodeDestination(address, I_ADDR_VERSION));
  assertIdentityID(id, field, allowNull);
  return id;
}

/** uint256 display hex is the reverse of the raw bytes used in serialization. */
export function uint256FromHex(hex: string, field: string): Buffer {
  if (typeof hex !== 'string' || !/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error(`${field} must contain exactly 64 hexadecimal characters`);
  }
  return Buffer.from(hex, 'hex').reverse();
}

export function assertUint256(value: Buffer, field: string, allowNull = false): void {
  if (!Buffer.isBuffer(value) || value.length !== 32 ||
      (!allowNull && value.equals(Buffer.alloc(32)))) {
    throw new Error(`${field} must be ${allowNull ? 'a' : 'a nonzero'} 32-byte value`);
  }
}

export function payloadFromHex(hex: string): Buffer {
  if (typeof hex !== 'string' || !hex.length || !/^(?:[0-9a-fA-F]{2})+$/.test(hex)) {
    throw new Error('Payload must be nonempty, even-length hexadecimal data');
  }
  return Buffer.from(hex, 'hex');
}

export function boundedReader(buffer: Buffer, offset: number, length?: number): InstanceType<typeof bufferutils.BufferReader> {
  if (!Buffer.isBuffer(buffer) || !Number.isSafeInteger(offset) || offset < 0 || offset > buffer.length ||
      (length != null && (!Number.isSafeInteger(length) || length < 0 || length > buffer.length - offset))) {
    throw new Error('Invalid payload bounds');
  }
  return new bufferutils.BufferReader(length == null ? buffer : buffer.subarray(0, offset + length), offset);
}

export function readName(reader: InstanceType<typeof bufferutils.BufferReader>): string {
  const length = reader.readCompactSize();
  if (!length || length > MAX_IDENTITY_NAME_BYTES) throw new Error('Invalid reservation name length');
  const bytes = reader.readSlice(length);
  const name = bytes.toString('utf8');
  if (!Buffer.from(name, 'utf8').equals(bytes)) throw new Error('Invalid UTF-8 reservation name');
  return name;
}

export function checkPayloadEnd(end: number, offset: number, length?: number): void {
  if (length != null && end !== offset + length) throw new Error('Trailing reservation or commitment data');
}
