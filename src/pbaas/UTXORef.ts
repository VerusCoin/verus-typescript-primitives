import { SerializableEntityBase } from '../utils/types/SerializableEntityBase';
import bufferutils from '../utils/bufferutils'
import { BN } from 'bn.js';
import { BigNumber } from '../utils/types/BigNumber';
import { HASH256_BYTE_LENGTH } from '../constants/vdxf';
import { SerializableEntity } from '../utils/types/SerializableEntity';

const { BufferReader, BufferWriter } = bufferutils

export class UTXORef extends SerializableEntityBase implements SerializableEntity {
  hash: Buffer;
  n: BigNumber;

  constructor(data?: { hash?: Buffer, n?: BigNumber }) {
    super();
    this.hash = data?.hash || Buffer.alloc(0);
    this.n = data?.n || new BN(0);
  }

  getByteLength() {
    let byteLength = 0;

    byteLength += HASH256_BYTE_LENGTH; // hash uint256
    byteLength += 4;  // n uint32

    return byteLength
  }

  toBuffer() {
    const bufferWriter = new BufferWriter(Buffer.alloc(this.getByteLength()))

    bufferWriter.writeSlice(this.hash);
    bufferWriter.writeUInt32(this.n.toNumber());

    return bufferWriter.buffer
  }

  fromBuffer(buffer: Buffer, offset: number = 0) {
    const reader = new BufferReader(buffer, offset);

    this.hash = reader.readSlice(32);
    this.n = new BN(reader.readUInt32());

    return reader.offset;
  }

  isValid(): boolean {
    return this.n.lt(new BN(0xffffffff));
  }

  toJson() {
    return {
      txid: Buffer.from(this.hash).reverse().toString('hex'),
      voutnum: this.n.toNumber()
    }
  }

  static fromJson(data: { txid: string, voutnum: string }): UTXORef {
    return new UTXORef({
      hash: Buffer.from(data.txid, 'hex').reverse(),
      n: new BN(data.voutnum, 10)
    });
  }
}