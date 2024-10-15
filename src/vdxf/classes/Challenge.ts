import {
  LOGIN_CONSENT_CHALLENGE_VDXF_KEY,
  ID_ADDRESS_VDXF_KEY,
  ID_PARENT_VDXF_KEY,
  ID_SYSTEMID_VDXF_KEY,
  Utf8DataVdxfObject,
  VDXFObject,
  Utf8OrBase58Object
} from "../";
import bufferutils from "../../utils/bufferutils";
import varuint from "../../utils/varuint";
import { Context } from "./Context";
import { Hash160 } from "./Hash160";
import { Attestation } from "./Attestation";
import { fromBase58Check, toBase58Check } from '../../utils/address';
import { HASH160_BYTE_LENGTH, I_ADDR_VERSION } from '../../constants/vdxf';
import { BufferDataVdxfObject, VDXFData } from '../index'


export class RedirectUri extends VDXFObject {
  uri: string;

  constructor(uri: string = "", vdxfkey: string = "") {
    super(vdxfkey);

    this.uri = uri;
  }

  dataByteLength(): number {
    return this.toDataBuffer().length;
  }

  toDataBuffer(): Buffer {
    return Buffer.from(this.uri, "utf-8");
  }

  fromDataBuffer(buffer: Buffer, offset?: number): number {
    const reader = new bufferutils.BufferReader(buffer, offset);

    this.uri = reader.readVarSlice().toString("utf-8");

    return reader.offset;
  }

  toJson() {
    return {
      uri: this.uri,
      vdxfkey: this.vdxfkey,
    };
  }
}

export class Subject extends Utf8OrBase58Object {
  constructor(data: string = "", vdxfkey: string = "") {
    super(data, vdxfkey, [
      ID_ADDRESS_VDXF_KEY.vdxfid,
      ID_PARENT_VDXF_KEY.vdxfid,
      ID_SYSTEMID_VDXF_KEY.vdxfid,
    ]);
  }
}

export class ProvisioningInfo extends Utf8OrBase58Object {
  constructor(data: string = "", vdxfkey: string = "") {
    super(data, vdxfkey, [
      ID_ADDRESS_VDXF_KEY.vdxfid,
      ID_PARENT_VDXF_KEY.vdxfid,
      ID_SYSTEMID_VDXF_KEY.vdxfid,
    ]);
  }
}

export class Audience extends Utf8DataVdxfObject { }

export class AltAuthFactor extends Utf8DataVdxfObject { }

export interface ChallengeInterface {
  // Challenge specific VDXF key
  challenge_id: string;

  // VDXF keys array of access requests
  requested_access?: Array<RequestedPermission> | null;

  // Array of members that will have access to scope
  requested_access_audience?: Array<Audience> | null;

  // Information about the ID you have to log in with, array of VDXF objects
  subject?: Array<Subject>;

  // Information about the provisioning endpoint and ID possibilities, can contain 
  // a webhook, and info regarding what ID will be provisioned to the user if they make a 
  // provisioning request.
  provisioning_info?: Array<ProvisioningInfo>

  // Array of alternate authentication factors required
  alt_auth_factors?: Array<AltAuthFactor> | null;

  // Temporary session VDXF key
  session_id?: string;

  // List of signatures, IDs and trust score objects
  attestations?: Array<Attestation>;

  // Array of VDXF objects defining behaviour on deeplink complete
  redirect_uris?: Array<RedirectUri>;

  // String of unix representation of date string
  created_at: number;

  // Boolean denoting whether or not to attempt to skip over UI based on
  // the user's decision to remember their login (will still be verified by the wallet)
  skip?: boolean;

  // Random hash string
  salt?: string;

  // Context
  context?: Context;
}

export class Challenge extends VDXFObject implements ChallengeInterface {
  challenge_id: string;
  requested_access?: Array<RequestedPermission> | null;
  requested_access_audience?: Array<Audience> | null;
  subject?: Array<Subject>;
  provisioning_info?: Array<ProvisioningInfo>;
  alt_auth_factors?: Array<AltAuthFactor> | null;
  session_id?: string;
  attestations?: Array<Attestation>;
  redirect_uris?: Array<RedirectUri>;
  created_at: number;
  skip?: boolean;
  salt?: string;
  context?: Context;

  constructor(
    challenge: ChallengeInterface = { challenge_id: "", created_at: 0 },
    vdxfkey: string = LOGIN_CONSENT_CHALLENGE_VDXF_KEY.vdxfid
  ) {
    super(vdxfkey);

    this.challenge_id = challenge.challenge_id;
    this.requested_access = challenge.requested_access ? challenge.requested_access.map((x) => new RequestedPermission(x.vdxfkey, x.data)) : challenge.requested_access;
    this.requested_access_audience = challenge.requested_access_audience;
    this.subject = challenge.subject
      ? challenge.subject.map((x) => new Subject(x.data, x.vdxfkey))
      : challenge.subject;
    this.provisioning_info = challenge.provisioning_info
      ? challenge.provisioning_info.map((x) => new ProvisioningInfo(x.data, x.vdxfkey))
      : challenge.provisioning_info;
    this.alt_auth_factors = challenge.alt_auth_factors;
    this.session_id = challenge.session_id;
    this.attestations = challenge.attestations;
    this.redirect_uris = challenge.redirect_uris
      ? challenge.redirect_uris.map((x) => new RedirectUri(x.uri, x.vdxfkey))
      : challenge.redirect_uris;
    this.created_at = challenge.created_at;
    this.salt = challenge.salt;
    this.context = challenge.context
      ? new Context(challenge.context.kv)
      : challenge.context;
    this.skip = challenge.skip ? true : false;
  }

  dataByteLength(): number {
    let length = 0;

    const _challenge_id = Hash160.fromAddress(this.challenge_id, true);
    const _created_at = this.created_at;
    const _salt = this.salt
      ? Hash160.fromAddress(this.salt, true)
      : Hash160.getEmpty();
    const _session_id = this.session_id
      ? Hash160.fromAddress(this.session_id, true)
      : Hash160.getEmpty();
    const _requested_access = this.requested_access
      ? this.requested_access
      : [];
    const _requested_access_audience = [];
    const _subject = this.subject ? this.subject : [];
    const _provisioning_info = this.provisioning_info ? this.provisioning_info : [];
    const _alt_auth_factors = [];
    const _attestations = this.attestations ? this.attestations : [];
    const _redirect_uris = this.redirect_uris ? this.redirect_uris : [];
    const _context = this.context ? this.context : new Context({});

    length += _challenge_id.byteLength();

    length += 8; // created_at

    length += _salt.byteLength();

    if (this.vdxfkey === LOGIN_CONSENT_CHALLENGE_VDXF_KEY.vdxfid) {
      length += 1; // skip

      length += _session_id.byteLength();

      length += varuint.encodingLength(_requested_access.length);
      length += _requested_access.reduce(
        (sum, current) => sum + current.byteLength(),
        0
      );

      length += varuint.encodingLength(_requested_access_audience.length);

      length += varuint.encodingLength(_subject.length);
      length += _subject.reduce(
        (sum, current) => sum + current.byteLength(),
        0
      );

      length += varuint.encodingLength(_provisioning_info.length);
      length += _provisioning_info.reduce(
        (sum, current) => sum + current.byteLength(),
        0
      );

      length += varuint.encodingLength(_alt_auth_factors.length);

      length += varuint.encodingLength(_attestations.length);
      length += _attestations.reduce(
        (sum, current) => sum + current.byteLength(),
        0
      );

      length += varuint.encodingLength(_redirect_uris.length);
      length += _redirect_uris.reduce(
        (sum, current) => sum + current.byteLength(),
        0
      );
    }

    length += _context.byteLength();

    return length;
  }

  toDataBuffer(): Buffer {
    const buffer = Buffer.alloc(this.dataByteLength());
    const writer = new bufferutils.BufferWriter(buffer);

    const _challenge_id = Hash160.fromAddress(this.challenge_id, true);
    const _created_at = this.created_at;
    const _salt = this.salt
      ? Hash160.fromAddress(this.salt, true)
      : Hash160.getEmpty();
    const _session_id = this.session_id
      ? Hash160.fromAddress(this.session_id, true)
      : Hash160.getEmpty();
    const _requested_access = this.requested_access
      ? this.requested_access
      : [];
    const _requested_access_audience = [];
    const _subject = this.subject ? this.subject : [];
    const _provisioning_info = this.provisioning_info ? this.provisioning_info : [];
    const _alt_auth_factors = [];
    const _attestations = this.attestations ? this.attestations : [];
    const _redirect_uris = this.redirect_uris ? this.redirect_uris : [];
    const _context = this.context ? this.context : new Context({});

    writer.writeSlice(_challenge_id.toBuffer());

    writer.writeUInt64(_created_at);

    writer.writeSlice(_salt.toBuffer());

    if (this.vdxfkey === LOGIN_CONSENT_CHALLENGE_VDXF_KEY.vdxfid) {
      writer.writeUInt8(this.skip ? 1 : 0);

      writer.writeSlice(_session_id.toBuffer());

      writer.writeArray(_requested_access.map((x) => x.toBuffer()));

      writer.writeArray(_requested_access_audience.map((x) => x.toBuffer()));

      writer.writeArray(_subject.map((x) => x.toBuffer()));

      writer.writeArray(_provisioning_info.map((x) => x.toBuffer()));

      writer.writeArray(_alt_auth_factors.map((x) => x.toBuffer()));

      writer.writeArray(_attestations.map((x) => x.toBuffer()));

      writer.writeArray(_redirect_uris.map((x) => x.toBuffer()));
    }

    writer.writeSlice(_context.toBuffer());

    return writer.buffer;
  }

  fromDataBuffer(buffer: Buffer, offset?: number): number {
    const reader = new bufferutils.BufferReader(buffer, offset);
    const challengeLength = reader.readCompactSize();

    if (challengeLength == 0) {
      throw new Error("Cannot create challenge from empty buffer");
    } else {
      const _challenge_id = new Hash160();
      reader.offset = _challenge_id.fromBuffer(
        reader.buffer,
        true,
        reader.offset
      );
      this.challenge_id = _challenge_id.toAddress();

      this.created_at = reader.readUInt64();

      const _salt = new Hash160();
      reader.offset = _salt.fromBuffer(reader.buffer, true, reader.offset);
      this.salt = _salt.toAddress();

      if (this.vdxfkey === LOGIN_CONSENT_CHALLENGE_VDXF_KEY.vdxfid) {
        this.skip = reader.readUInt8() === 1 ? true : false;

        const _session_id = new Hash160();
        reader.offset = _session_id.fromBuffer(
          reader.buffer,
          true,
          reader.offset
        );
        this.session_id = _session_id.toAddress();

        this.requested_access = [];
        const requestedAccessLength = reader.readCompactSize();

        for (let i = 0; i < requestedAccessLength; i++) {

          const _perm = new RequestedPermission();
          reader.offset = _perm.fromBuffer(reader.buffer, reader.offset);
          this.requested_access.push(_perm);
        }

        this.requested_access_audience = [];
        const audienceLength = reader.readCompactSize();

        if (audienceLength > 0) {
          throw new Error("Requested access audience currently unsupported");
        }

        this.subject = [];
        const subjectLength = reader.readCompactSize();

        for (let i = 0; i < subjectLength; i++) {
          const _subject = new Subject();
          reader.offset = _subject.fromBuffer(reader.buffer, reader.offset);
          this.subject.push(_subject);
        }

        this.provisioning_info = [];
        const provisioningInfoLength = reader.readCompactSize();

        for (let i = 0; i < provisioningInfoLength; i++) {
          const _provisioning_info = new ProvisioningInfo();
          reader.offset = _provisioning_info.fromBuffer(reader.buffer, reader.offset);
          this.provisioning_info.push(_provisioning_info);
        }

        this.alt_auth_factors = [];
        const altAuthFactorLength = reader.readCompactSize();

        if (altAuthFactorLength > 0) {
          throw new Error("Alt auth factors currently unsupported");
        }

        this.attestations = [];
        const attestationsLength = reader.readCompactSize();

        for (let i = 0; i < attestationsLength; i++) {
          const _att = new Attestation();
          reader.offset = _att.fromBuffer(reader.buffer, reader.offset);
          this.attestations.push(_att);
        }

        this.redirect_uris = [];
        const urisLength = reader.readCompactSize();

        for (let i = 0; i < urisLength; i++) {
          const _redirect_uri = new RedirectUri();
          reader.offset = _redirect_uri.fromBuffer(
            reader.buffer,
            reader.offset
          );
          this.redirect_uris.push(_redirect_uri);
        }
      }

      const _context = new Context();
      reader.offset = _context.fromBuffer(reader.buffer, reader.offset);
      this.context = _context;
    }

    return reader.offset;
  }

  toJson() {
    return {
      vdxfkey: this.vdxfkey,
      challenge_id: this.challenge_id,
      requested_access: this.requested_access,
      requested_access_audience: this.requested_access_audience,
      subject: this.subject,
      provisioning_info: this.provisioning_info,
      alt_auth_factors: this.alt_auth_factors,
      session_id: this.session_id,
      attestations: this.attestations,
      redirect_uris: this.redirect_uris
        ? this.redirect_uris.map((x) => x.toJson())
        : this.redirect_uris,
      created_at: this.created_at,
      salt: this.salt,
      context: this.context,
      skip: this.skip,
    };
  }
}

export class RequestedPermission extends VDXFObject {

  data: Array<Hash160>;

  constructor(vdxfkey?: string, data?: Array<Hash160> | Array<string>) {
    super(vdxfkey);

    if (data && data.length > 0) {
      if (data[0] instanceof Hash160) {
        this.data = data as Array<Hash160>;
      } else {
      this.data = data.map((x) => new Hash160(fromBase58Check(x).hash));
      }
    } else {
      this.data = [];
    }
  }

  dataByteLength(): number {

    let length = 0;

    length += varuint.encodingLength(this.data.length);

    for (let i = 0; i < this.data.length; i++) {
      length += 20;
    }

    return length;
  }

  toDataBuffer(): Buffer {
    const buffer = Buffer.alloc(this.dataByteLength());
    const writer = new bufferutils.BufferWriter(buffer);

    writer.writeCompactSize(this.data.length);

    for (let i = 0; i < this.data.length; i++) {
      writer.writeSlice(this.data[i].toBuffer());
    }

    return writer.buffer;
  }
  

  fromDataBuffer(buffer: Buffer, offset?: number): number {
    const reader = new bufferutils.BufferReader(buffer, offset);
    const contextLength = reader.readCompactSize();
    const numKeys = reader.readCompactSize();

    this.data = [];

    for (let i = 0; i < numKeys; i++) {
      this.data.push(new Hash160(reader.readSlice(20)));
    }

    return reader.offset;
  }

}