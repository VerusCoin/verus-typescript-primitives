import varint from '../utils/varint'
import varuint from '../utils/varuint'
import { fromBase58Check, toBase58Check } from "../utils/address";
import bufferutils from '../utils/bufferutils'
import { BN } from 'bn.js';
import { BigNumber } from '../utils/types/BigNumber';
import { I_ADDR_VERSION } from '../constants/vdxf';
import { SerializableEntity } from '../utils/types/SerializableEntity';
const { BufferReader, BufferWriter } = bufferutils

export class ContentMultiMapRemove implements SerializableEntity {
  version: BigNumber;
  action: BigNumber;
  entryKey: string;
  valueHash: Buffer;

  static VERSION_INVALID = new BN(0);
  static VERSION_FIRST = new BN(1);
  static VERSION_LAST = new BN(1);
  static VERSION_CURRENT = new BN(1);
  static ACTION_FIRST = new BN(1);
  static ACTION_REMOVE_ONE_KEYVALUE = new BN(1);
  static ACTION_REMOVE_ALL_KEYVALUE = new BN(2);
  static ACTION_REMOVE_ALL_KEY = new BN(3);
  static ACTION_CLEAR_MAP = new BN(4);
  static ACTION_LAST = new BN(4);

  constructor (data: { version?: BigNumber, action?: BigNumber, entryKey?: string, valueHash?: Buffer}) {
    this.version = data.version || new BN(1, 10);
    this.action = data.action || new BN(0, 10);
    this.entryKey = data.entryKey || "";
    this.valueHash = data.valueHash || Buffer.alloc(0);
  }

  getByteLength() {
    let byteLength = 0;

    byteLength += 4; // version uint32
    byteLength + 4; // action uint32
    if (this.action != ContentMultiMapRemove.ACTION_CLEAR_MAP){
      byteLength += 20
      if (this.action != ContentMultiMapRemove.ACTION_REMOVE_ALL_KEY){
        byteLength += 32
      }
    }
    return byteLength
  }

  toBuffer () {
    const bufferWriter = new BufferWriter(Buffer.alloc(this.getByteLength()))

    bufferWriter.writeUInt32(this.version.toNumber());
    bufferWriter.writeUInt32(this.action.toNumber());
    
    if (this.action != ContentMultiMapRemove.ACTION_CLEAR_MAP){
      bufferWriter.writeSlice(fromBase58Check(this.entryKey).hash);
      if (this.action != ContentMultiMapRemove.ACTION_REMOVE_ALL_KEY){
        bufferWriter.writeSlice(this.valueHash);
      }
    }

    return bufferWriter.buffer
  }

  fromBuffer (buffer: Buffer, offset: number = 0) {
    const reader = new BufferReader(buffer, offset);
    
    this.version = new BN(reader.readUInt32());
    this.action = new BN(reader.readUInt32());

    if (this.action != ContentMultiMapRemove.ACTION_CLEAR_MAP){
      this.entryKey = toBase58Check(reader.readSlice(20), I_ADDR_VERSION)
      if (this.action != ContentMultiMapRemove.ACTION_REMOVE_ALL_KEY){
        this.valueHash = reader.readSlice(32)
      }
    }
    return reader.offset;
  }
}