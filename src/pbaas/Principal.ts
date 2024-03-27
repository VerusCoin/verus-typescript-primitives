import varuint from '../utils/varuint'
import bufferutils from '../utils/bufferutils'
import { BigNumber } from '../utils/types/BigNumber';
import { fromBase58Check, toBase58Check } from '../utils/address';
import { R_ADDR_VERSION } from '../constants/vdxf';
import { BN } from 'bn.js';

export const VERSION_INVALID = new BN(0, 10)
export const VERSION_CURRENT = new BN(1, 10)

const { BufferReader, BufferWriter } = bufferutils

class TxDestination {
    primary_addresses: Array<Buffer>;
  
    constructor(data: { primaryaddresses?: Array<string> } = null) {
  
       if(data != null) {
        for (const tempAddr of data.primaryaddresses) {
  
            let tempDecoded;
            try {
                let tempRaddress = fromBase58Check(tempAddr)
                tempDecoded = tempRaddress.hash
                if (tempDecoded.length != 20 || tempRaddress.version != R_ADDR_VERSION)
                    throw new Error("R address Error")
            } catch (e) {
  
                if (e.message === "R address Error")
                    throw new Error(e.message)
                tempDecoded = Buffer.from(tempAddr, 'hex')
                if (tempDecoded.length != 33)
                    throw new Error("Incorrect hex length of pub key")
            }
            this.primary_addresses = new Array<Buffer>; 
            this.primary_addresses.push(tempDecoded)
        }
      }
    }
  
    getAddressString() {
        let retval = [];
  
        for (const addr of this.primary_addresses)
  
            if (addr.length == 20) {
                retval.push(toBase58Check(addr, R_ADDR_VERSION));
            }
            else if (addr.length == 33) {
                retval.push(addr.toString('hex'));
            }
            else {
                retval.push("");
            }
    }
  
    txgetByteLength() {
        let byteLength = 0;
  
        byteLength += varuint.encodingLength(this.primary_addresses.length);
  
        for (const txDest of this.primary_addresses) {
            byteLength += varuint.encodingLength(txDest.length);
            byteLength += txDest.length;
        }
  
        return byteLength
    }
  
    txtoBuffer() {
        const bufferWriter = new BufferWriter(Buffer.alloc(this.txgetByteLength()))
  
        bufferWriter.writeVector(this.primary_addresses);
  
        return bufferWriter.buffer
    }
  
    txfromBuffer(buffer, offset: number = 0) {
        const reader = new BufferReader(buffer, offset);
        let count: number;
  
        count = reader.readVarInt().toNumber();
  
        this.primary_addresses = new Array<Buffer>;
  
        for (let i = 0; i < count; i++) {
            this.primary_addresses.push(reader.readVarSlice());
        }
  
        return reader.offset;
    }
  }
export class Principal extends TxDestination{
    flags: BigNumber;
    version: BigNumber;
    min_sigs: BigNumber;

    constructor (data?: { 
        version?: BigNumber | number, 
        flags?: BigNumber | number, 
        minimumsignatures?: BigNumber | number, 
        primaryaddresses?: Array<string>;
      }) {

        super(data);
    
        this.flags = VERSION_INVALID;
        this.version = VERSION_INVALID;
    
        if (data != null) {
          if (data.flags != null) this.flags = new BN(data.flags)
          if (data.version != null) this.version = new BN(data.version)
          if (data.minimumsignatures != null) this.min_sigs = new BN(data.minimumsignatures)
        }
      }

    _dataByteLength() {
        let byteLength = 0;

        byteLength += 4; //uint32 version size
        byteLength += 4; //uint32 flags size

        byteLength += this.txgetByteLength();
        byteLength += 4; //uint32 minimum signatures size

        return byteLength
    }

    _toBuffer() {
        const bufferWriter = new BufferWriter(Buffer.alloc(this._dataByteLength()))

        bufferWriter.writeUInt32(this.version.toNumber())
        bufferWriter.writeUInt32(this.flags.toNumber())
        bufferWriter.writeSlice(this.txtoBuffer());
        bufferWriter.writeUInt32(this.min_sigs.toNumber())

        return bufferWriter.buffer
    }

    _fromBuffer(buffer, offset: number = 0) {
        const reader = new BufferReader(buffer, offset);

        this.version = new BN(reader.readUInt32(), 10);
        this.flags = new BN(reader.readUInt32(), 10);

        reader.offset = this.txfromBuffer(reader.buffer, reader.offset);

        this.min_sigs = new BN(reader.readUInt32(), 10);

        return reader.offset;
    }
}

