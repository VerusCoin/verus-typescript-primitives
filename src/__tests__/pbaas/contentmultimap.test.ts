import { ContentMultiMap, ContentMultiMapJsonValue, FqnContentMultiMap, KvContent } from "../../pbaas/ContentMultiMap";
import { DATA_TYPE_STRING } from "../../vdxf";
import { VDXF_UNI_VALUE_VERSION_CURRENT, VdxfUniValue } from "../../pbaas/VdxfUniValue";
import { VdxfUniType } from "../../pbaas/VdxfUniValue";
import { manyContentMultimapData } from "../constants/fixtures";
import { CompactIAddressObject } from "../../vdxf/classes/CompactAddressObject";
import {
  ID_PARENT_VDXF_KEY,
  IDENTITY_UPDATE_REQUEST_VDXF_KEY,
  IDENTITY_UPDATE_RESPONSE_VDXF_KEY,
} from "../../vdxf/keys";

// Real VDXF data keys with known iaddresses from keys.ts
const FQN_KEY_1_NAME   = ID_PARENT_VDXF_KEY.qualifiedname.name;        // "vrsc::identity.parent"
const FQN_KEY_1_IADDR  = ID_PARENT_VDXF_KEY.vdxfid;                    // "i6aJSTKfNiDZ4rPxj1pPh4Y8xDmh1GqYm9"
const FQN_KEY_1_VALUE  = ID_PARENT_VDXF_KEY.hash160result;              // 20-byte hex content

const FQN_KEY_2_NAME   = IDENTITY_UPDATE_REQUEST_VDXF_KEY.qualifiedname.name;  // "vrsc::identity.update.request"
const FQN_KEY_2_IADDR  = IDENTITY_UPDATE_REQUEST_VDXF_KEY.vdxfid;              // "iQJAPr53wZnjLyGpGdjiNZhSwSTXSfyoYy"
const FQN_KEY_2_VALUE  = IDENTITY_UPDATE_REQUEST_VDXF_KEY.hash160result;

const FQN_KEY_3_VALUE  = IDENTITY_UPDATE_RESPONSE_VDXF_KEY.hash160result;

// Plain iaddresses used as TYPE_I_ADDRESS keys
const IADDR_A = "iPsFBfFoCcxtuZNzE8yxPQhXVn4dmytf8j";
const IADDR_B = "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq";
const IADDR_C = "i5v3h9FWVdRFbNHU7DfcpGykQjRaHtMqu7";
const IADDR_D = "i81XL8ZpuCo9jmWLv5L5ikdxrGuHrrpQLz";

describe('Serializes and deserializes ContentMultiMap', () => {
  const vdxfunivaluedata = new Array<{ [key: string]: VdxfUniType }>;
  vdxfunivaluedata.push({ [DATA_TYPE_STRING.vdxfid]: "Test String 123454321" });

  const vdxfunivalue = new VdxfUniValue({
    values: vdxfunivaluedata,
    version: VDXF_UNI_VALUE_VERSION_CURRENT
  });

  function testContentMultimapWithKvContent(kv: KvContent) {
    const c = new ContentMultiMap({
      kvContent: kv
    });

    const cFromBuf = new ContentMultiMap();

    cFromBuf.fromBuffer(c.toBuffer());

    expect(cFromBuf.toBuffer().toString('hex')).toBe(c.toBuffer().toString('hex'));
    expect(ContentMultiMap.fromJson(c.toJson()).toBuffer().toString("hex")).toBe(cFromBuf.toBuffer().toString('hex'));
  }

  test('test CMM with vdxfunivalue content', () => {
    const kvcontent = new KvContent();
    kvcontent.set(CompactIAddressObject.fromAddress(IADDR_A), [vdxfunivalue]);
    testContentMultimapWithKvContent(kvcontent);
  });

  test('test CMM with array of vdxfunivalue content', () => {
    const kvcontent = new KvContent();
    kvcontent.set(CompactIAddressObject.fromAddress(IADDR_A), [vdxfunivalue, vdxfunivalue, vdxfunivalue, vdxfunivalue]);
    kvcontent.set(CompactIAddressObject.fromAddress(IADDR_B), [Buffer.alloc(20).fill("h")]);
    kvcontent.set(CompactIAddressObject.fromAddress(IADDR_C), [Buffer.alloc(20).fill("h"), Buffer.alloc(20).fill("h"), Buffer.alloc(20).fill("h")]);
    kvcontent.set(CompactIAddressObject.fromAddress(IADDR_D), [vdxfunivalue]);
    testContentMultimapWithKvContent(kvcontent);
  });

  test('test CMM from json', () => {
    const cmm = ContentMultiMap.fromJson(manyContentMultimapData as unknown as { [key: string]: ContentMultiMapJsonValue });

    expect(cmm.toJson()).toEqual(manyContentMultimapData);
  });

  test('fromJson with FQN key (contains "::") creates TYPE_FQN entry', () => {
    const cmm = ContentMultiMap.fromJson({
      [FQN_KEY_1_NAME]: [FQN_KEY_1_VALUE]
    });

    const [key] = [...cmm.kvContent.entries()][0];
    expect(key.isFQN()).toBe(true);
    expect(key.address).toBe(FQN_KEY_1_NAME);
  });

  test('FQN key toIAddress() matches the known vdxfid from keys.ts', () => {
    const cmm = ContentMultiMap.fromJson({ [FQN_KEY_1_NAME]: [FQN_KEY_1_VALUE] });

    const [key] = [...cmm.kvContent.entries()][0];
    // The iaddress derived from the FQN must match the vdxfid recorded in keys.ts.
    expect(key.toIAddress()).toBe(FQN_KEY_1_IADDR);
  });

  test('toJson for FQN key outputs the FQN name string, not the resolved iaddress', () => {
    const cmm = ContentMultiMap.fromJson({ [FQN_KEY_1_NAME]: [FQN_KEY_1_VALUE] });
    const json = cmm.toJson();

    expect(Object.keys(json)).toContain(FQN_KEY_1_NAME);
    expect(Object.keys(json)).not.toContain(FQN_KEY_1_IADDR);
  });

  test('FQN key survives ContentMultiMap JSON round-trip as TYPE_FQN', () => {
    const original = ContentMultiMap.fromJson({ [FQN_KEY_1_NAME]: [FQN_KEY_1_VALUE] });
    const roundTripped = ContentMultiMap.fromJson(original.toJson());

    const [key] = [...roundTripped.kvContent.entries()][0];
    expect(key.isFQN()).toBe(true);
    expect(key.address).toBe(FQN_KEY_1_NAME);
    expect(key.toIAddress()).toBe(FQN_KEY_1_IADDR);
  });

  test('FQN key in ContentMultiMap binary round-trip loses TYPE_FQN (daemon-compatible behaviour)', () => {
    // ContentMultiMap uses the 20-byte daemon-wire format: the FQN is resolved
    // to its iaddress before serialization and cannot be recovered from the buffer.
    const original = ContentMultiMap.fromJson({ [FQN_KEY_1_NAME]: [FQN_KEY_1_VALUE] });

    const restored = new ContentMultiMap();
    restored.fromBuffer(original.toBuffer());

    const [key] = [...restored.kvContent.entries()][0];
    expect(key.isIaddress()).toBe(true);
    expect(key.toIAddress()).toBe(FQN_KEY_1_IADDR);
  });
});

describe('KvContent key management', () => {
  test('overwriting the same key (identical toBuffer) is allowed', () => {
    const kv = new KvContent();
    const key = CompactIAddressObject.fromAddress(IADDR_A);

    kv.set(key, [Buffer.from('first', 'utf8')]);
    kv.set(key, [Buffer.from('second', 'utf8')]);

    expect(kv.size).toBe(1);
    expect(kv.get(key)![0].toString('utf8')).toBe('second');
  });

  test('setting TYPE_I_ADDRESS key that resolves to same iaddress as existing FQN key throws', () => {
    // vrsc::identity.parent resolves to i6aJSTKfNiDZ4rPxj1pPh4Y8xDmh1GqYm9.
    // Adding that iaddress directly after the FQN key must be rejected.
    const kv = new KvContent();
    const fqnKey   = CompactIAddressObject.fromFQN(FQN_KEY_1_NAME);
    const iaddrKey = CompactIAddressObject.fromAddress(FQN_KEY_1_IADDR);

    kv.set(fqnKey, [Buffer.from(FQN_KEY_1_VALUE, 'hex')]);
    expect(() => kv.set(iaddrKey, [Buffer.from(FQN_KEY_2_VALUE, 'hex')])).toThrow();
  });

  test('setting FQN key that resolves to same iaddress as existing TYPE_I_ADDRESS key throws', () => {
    const kv = new KvContent();
    const iaddrKey = CompactIAddressObject.fromAddress(FQN_KEY_1_IADDR);
    const fqnKey   = CompactIAddressObject.fromFQN(FQN_KEY_1_NAME);

    kv.set(iaddrKey, [Buffer.from(FQN_KEY_1_VALUE, 'hex')]);
    expect(() => kv.set(fqnKey, [Buffer.from(FQN_KEY_2_VALUE, 'hex')])).toThrow();
  });

  test('has returns true for a set key, false otherwise', () => {
    const kv = new KvContent();
    const key   = CompactIAddressObject.fromFQN(FQN_KEY_1_NAME);
    const other = CompactIAddressObject.fromFQN(FQN_KEY_2_NAME);

    kv.set(key, []);
    expect(kv.has(key)).toBe(true);
    expect(kv.has(other)).toBe(false);
  });

  test('get returns the stored value for a set key', () => {
    const kv  = new KvContent();
    const key = CompactIAddressObject.fromFQN(FQN_KEY_1_NAME);
    const val = [Buffer.from(FQN_KEY_1_VALUE, 'hex')];

    kv.set(key, val);
    expect(kv.get(key)).toEqual(val);
  });

  test('delete removes the key and allows re-adding it', () => {
    const kv  = new KvContent();
    const key = CompactIAddressObject.fromFQN(FQN_KEY_1_NAME);

    kv.set(key, []);
    expect(kv.delete(key)).toBe(true);
    expect(kv.has(key)).toBe(false);

    expect(() => kv.set(key, [])).not.toThrow();
  });

  test('entries iterator reconstructs CompactIAddressObjects with correct types and iaddresses', () => {
    const kv       = new KvContent();
    const fqnKey   = CompactIAddressObject.fromFQN(FQN_KEY_1_NAME);
    const iaddrKey = CompactIAddressObject.fromAddress(IADDR_B);

    kv.set(fqnKey, [Buffer.from(FQN_KEY_1_VALUE, 'hex')]);
    kv.set(iaddrKey, [Buffer.from(FQN_KEY_2_VALUE, 'hex')]);

    const entries = [...kv.entries()];
    expect(entries).toHaveLength(2);

    const fqnEntry   = entries.find(([k]) => k.isFQN());
    const iaddrEntry = entries.find(([k]) => k.isIaddress());

    expect(fqnEntry).toBeDefined();
    expect(fqnEntry![0].address).toBe(FQN_KEY_1_NAME);
    expect(fqnEntry![0].toIAddress()).toBe(FQN_KEY_1_IADDR);

    expect(iaddrEntry).toBeDefined();
    expect(iaddrEntry![0].toIAddress()).toBe(IADDR_B);
  });
});

describe('FqnContentMultiMap preserves key types through binary round-trips', () => {
  test('TYPE_I_ADDRESS key is preserved through binary round-trip', () => {
    const cmm = new FqnContentMultiMap();
    cmm.kvContent = new KvContent();
    cmm.kvContent.set(
      CompactIAddressObject.fromAddress(IADDR_A),
      [Buffer.from(FQN_KEY_1_VALUE, 'hex')]
    );

    const restored = new FqnContentMultiMap();
    restored.fromBuffer(cmm.toBuffer());

    const [key] = [...restored.kvContent.entries()][0];
    expect(key.isIaddress()).toBe(true);
    expect(key.toIAddress()).toBe(IADDR_A);
  });

  test('TYPE_FQN key is preserved through binary round-trip and resolves to correct iaddress', () => {
    const cmm = FqnContentMultiMap.fromJson({ [FQN_KEY_1_NAME]: [FQN_KEY_1_VALUE] });

    const restored = new FqnContentMultiMap();
    restored.fromBuffer(cmm.toBuffer());

    const [key] = [...restored.kvContent.entries()][0];
    expect(key.isFQN()).toBe(true);
    expect(key.address).toBe(FQN_KEY_1_NAME);
    // Must still resolve to the well-known vdxfid from keys.ts
    expect(key.toIAddress()).toBe(FQN_KEY_1_IADDR);
  });

  test('multiple FQN and TYPE_I_ADDRESS keys all survive binary round-trip', () => {
    const cmm = FqnContentMultiMap.fromJson({
      [FQN_KEY_1_NAME]: [FQN_KEY_1_VALUE],  // vrsc::identity.parent → i6aJSTK...
      [FQN_KEY_2_NAME]: [FQN_KEY_2_VALUE],  // vrsc::identity.update.request → iQJAPr5...
      [IADDR_A]:        [FQN_KEY_3_VALUE],  // plain iaddress key
    });

    const restored = new FqnContentMultiMap();
    restored.fromBuffer(cmm.toBuffer());

    const entries = [...restored.kvContent.entries()];
    expect(entries).toHaveLength(3);

    const fqn1 = entries.find(([k]) => k.isFQN() && k.address === FQN_KEY_1_NAME);
    const fqn2 = entries.find(([k]) => k.isFQN() && k.address === FQN_KEY_2_NAME);
    const ia   = entries.find(([k]) => k.isIaddress());

    expect(fqn1).toBeDefined();
    expect(fqn1![0].toIAddress()).toBe(FQN_KEY_1_IADDR);

    expect(fqn2).toBeDefined();
    expect(fqn2![0].toIAddress()).toBe(FQN_KEY_2_IADDR);

    expect(ia).toBeDefined();
    expect(ia![0].toIAddress()).toBe(IADDR_A);
  });

  test('FqnContentMultiMap binary output is larger than ContentMultiMap for same FQN key', () => {
    // FqnContentMultiMap writes the full CompactIAddressObject (version + type + FQN string),
    // ContentMultiMap writes only 20 bytes.
    const fqnCmm   = FqnContentMultiMap.fromJson({ [FQN_KEY_1_NAME]: [FQN_KEY_1_VALUE] });
    const plainCmm = ContentMultiMap.fromJson({ [FQN_KEY_1_NAME]: [FQN_KEY_1_VALUE] });

    expect(fqnCmm.toBuffer().length).toBeGreaterThan(plainCmm.toBuffer().length);
    expect(fqnCmm.toBuffer().toString('hex')).not.toBe(plainCmm.toBuffer().toString('hex'));
  });

  test('FqnContentMultiMap JSON round-trip preserves FQN key name and resolved iaddress', () => {
    const cmm      = FqnContentMultiMap.fromJson({ [FQN_KEY_1_NAME]: [FQN_KEY_1_VALUE] });
    const json     = cmm.toJson();
    const restored = FqnContentMultiMap.fromJson(json);

    const [key] = [...restored.kvContent.entries()][0];
    expect(key.isFQN()).toBe(true);
    expect(key.address).toBe(FQN_KEY_1_NAME);
    expect(key.toIAddress()).toBe(FQN_KEY_1_IADDR);
  });
});
