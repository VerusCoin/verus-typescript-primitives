import varint from '../utils/varint'
import varuint from '../utils/varuint'
import { fromBase58Check, toBase58Check } from "../utils/address";
import bufferutils from '../utils/bufferutils'
import { BN } from 'bn.js';
import { BigNumber } from '../utils/types/BigNumber';
import { I_ADDR_VERSION } from '../constants/vdxf';
import { VDXFData } from '../vdxf/index';
const { BufferReader, BufferWriter } = bufferutils
const createHash = require("create-hash");
import { VERUS_DATA_SIGNATURE_PREFIX } from "../constants/vdxf";
import { SaltedDataKey } from '../vdxf/vdxfdatakeys';

export class SaltedData extends VDXFData {

    salt: Buffer;

    static VERSION_INVALID = new BN(0);
    static FIRST_VERSION = new BN(1);
    static LAST_VERSION = new BN(1);
    static DEFAULT_VERSION = new BN(1);


    constructor(data?: Buffer, salt: Buffer = Buffer.alloc(0)) {
        super(data);
        if (salt.length != 0) {
            this.salt = salt;
        }
        this.vdxfkey = SaltedDataKey.vdxfid;
        this.version = SaltedData.DEFAULT_VERSION;

    }

    static fromJson(data: any) {

        const saltedData = new SaltedData();

        if (data) {
            if (data.version) {
                saltedData.version = new BN(data.version);
            } else {
                saltedData.version = SaltedData.DEFAULT_VERSION;
            }
            if (data.salt) saltedData.salt = Buffer.from(data.salt, 'hex');
            if (data.data) saltedData.data = Buffer.from(data.data, 'hex');
            if (data.key) saltedData.vdxfkey = data.key;
        }

        return saltedData;
    }
    getByteLength() {
        let byteLength = 0;

        byteLength += 20; //key
        byteLength += varint.encodingLength(this.version);
        byteLength += varuint.encodingLength(this.data.length + this.salt.length);
        byteLength += this.data.length + this.salt.length;

        return byteLength
    }

    toBuffer() {
        const bufferWriter = new BufferWriter(Buffer.alloc(this.getByteLength()))

        bufferWriter.writeSlice(fromBase58Check(this.vdxfkey).hash);
        bufferWriter.writeVarInt(this.version);
        bufferWriter.writeVarSlice(Buffer.concat([this.data, this.salt]));

        return bufferWriter.buffer
    }

    fromBuffer(buffer: Buffer, offset: number = 0) {
        const reader = new BufferReader(buffer, offset);

        this.vdxfkey = toBase58Check(reader.readSlice(20), I_ADDR_VERSION);
        this.version = reader.readVarInt();
        this.data = reader.readVarSlice();

        this.salt = this.data.slice(this.data.length - 32);
        this.data = this.data.slice(0, this.data.length - 32);

        return reader.offset;
    }

    toJson(): any {

        return {
            version: this.version.toString(),
            key: this.vdxfkey,
            data: this.data.toString('hex'),
            salt: this.salt.toString('hex')
        }
    }

    getHash(hw: (data: Buffer) => Buffer ):Buffer {

        const hash = hw(Buffer.concat([this.data, this.salt]));
        
        return hash;

    }
}