import { LOGIN_CONSENT_DECISION_VDXF_KEY, VDXFObject } from "..";
import bufferutils from "../../utils/bufferutils";
import { Credential } from "../../pbaas/Credential";
import varuint from "../../utils/varuint";
import { Attestation } from "./Challenge";
import { Context } from "./Context";
import { Hash160 } from "./Hash160";
import { Request, RequestInterface } from "./Request";

export interface DecisionInterface {
  // Decision specific VDXF key
  decision_id: string;

  // Request that is signed
  request: RequestInterface;

  // String of unix representation of date string
  created_at: number;

  // Random hash string
  salt?: string;

  // Indicator of whether or not request was signed without user prompt
  skipped?: boolean;

  // General context
  context?: Context;

  // List of signatures, IDs and trust score objects
  attestations?: Array<Attestation>;

  // Optional list of credentials
  credentials?: Array<Credential>;
}

export class Decision extends VDXFObject {
  decision_id: string;
  context?: Context;
  request: Request;
  created_at: number;
  skipped?: boolean;
  attestations: Array<any>;
  salt?: string;
  credentials: Array<Credential>;

  constructor(
    decision: DecisionInterface = {
      decision_id: "",
      request: new Request(),
      created_at: 0,
    },
    vdxfkey: string = LOGIN_CONSENT_DECISION_VDXF_KEY.vdxfid
  ) {
    super(vdxfkey);

    this.decision_id = decision.decision_id;
    this.request = new Request(decision.request);
    this.context = decision.context;
    this.created_at = decision.created_at;
    this.attestations = decision.attestations;
    this.salt = decision.salt;
    this.skipped = decision.skipped ? true : false;

    // Parse the credentials given.
    this.credentials = [];

    if (decision.credentials && Array.isArray(decision.credentials)) {
      // Convert each credential into the Credential class if it isn't already.
      this.credentials = decision.credentials.map(cred => {
        if (cred instanceof Credential) {
          return cred;
        }
        return new Credential(cred);
      });
    }
  }

  dataByteLength(): number {
    let length = 0;

    const _challenge_id = Hash160.fromAddress(this.decision_id, true);
    const _salt = this.salt
      ? Hash160.fromAddress(this.salt, true)
      : Hash160.getEmpty();
    const _request = this.request ? this.request : new Request();
    const _context = this.context ? this.context : new Context();
    const _attestations = [];

    length += _challenge_id.byteLength();

    length += 8; // created_at

    length += _salt.byteLength();

    if (this.vdxfkey === LOGIN_CONSENT_DECISION_VDXF_KEY.vdxfid) { 
      length += 1; // skipped

      length += varuint.encodingLength(_attestations.length);
    }

    length += _request.byteLength();

    length += _context.byteLength();

    // The credential list has zero or more credentials.
    length += varuint.encodingLength(this.credentials.length);
    for (const cred of this.credentials) {
      const credLength = cred.getByteLength();
      length += varuint.encodingLength(credLength);
      length += credLength;
    }

    return length;
  }

  toDataBuffer(): Buffer {
    const buffer = Buffer.alloc(this.dataByteLength());
    const writer = new bufferutils.BufferWriter(buffer);

    const _decision_id = Hash160.fromAddress(this.decision_id, true);
    const _created_at = this.created_at;
    const _salt = this.salt
      ? Hash160.fromAddress(this.salt, true)
      : Hash160.getEmpty();
    const _request = this.request ? this.request : new Request();
    const _context = this.context ? this.context : new Context();
    const _attestations = [];

    writer.writeSlice(_decision_id.toBuffer());

    writer.writeUInt64(_created_at);

    writer.writeSlice(_salt.toBuffer());

    if (this.vdxfkey === LOGIN_CONSENT_DECISION_VDXF_KEY.vdxfid) {
      writer.writeUInt8(this.skipped ? 1 : 0);

      writer.writeArray(_attestations.map((x) => x.toBuffer()));
    }

    writer.writeSlice(_context.toBuffer());

    // The credentials must be written before the request as the provisioning decision
    // will read the decision and then the request separately afterwards.
    const bufferCreds = this.credentials.map(x => x.toBuffer());
    writer.writeVector(bufferCreds);

    writer.writeSlice(_request.toBuffer());

    return writer.buffer;
  }

  fromDataBuffer(
    buffer: Buffer,
    offset?: number,
    readRequest: boolean = true
  ): number {
    const reader = new bufferutils.BufferReader(buffer, offset);
    const decisionLength = reader.readCompactSize();

    if (decisionLength == 0) {
      throw new Error("Cannot create decision from empty buffer");
    } else {
      const _decision_id = new Hash160();
      reader.offset = _decision_id.fromBuffer(
        reader.buffer,
        true,
        reader.offset
      );
      this.decision_id = _decision_id.toAddress();

      this.created_at = reader.readUInt64();

      const _salt = new Hash160();
      reader.offset = _salt.fromBuffer(reader.buffer, true, reader.offset);
      this.salt = _salt.toAddress();

      if (this.vdxfkey === LOGIN_CONSENT_DECISION_VDXF_KEY.vdxfid) {
        this.skipped = reader.readUInt8() === 1 ? true : false;

        this.attestations = [];
        const attestationsLength = reader.readCompactSize();
  
        if (attestationsLength > 0) {
          throw new Error("Attestations currently unsupported");
        }  
      }

      const _context = new Context();
      reader.offset = _context.fromBuffer(reader.buffer, reader.offset);
      this.context = _context;

      const _credentials = reader.readVector() as Array<Buffer>;
      this.credentials = [];
      for (const _cred of _credentials) {
        const cred = new Credential(); 
        cred.fromBuffer(_cred, 0);  // Read each credential buffer separately.
        this.credentials.push(cred);
      }

      if (readRequest) {
        const _request = new Request();
        reader.offset = _request.fromBuffer(reader.buffer, reader.offset);
        this.request = _request;
      }
    }

    return reader.offset;
  }

  toJson() {
    return {
      vdxfkey: this.vdxfkey,
      decision_id: this.decision_id,
      context: this.context.toJson(),
      created_at: this.created_at,
      request: this.request.toJson(),
    };
  }
}