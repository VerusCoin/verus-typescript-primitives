import { BN } from 'bn.js'
import { PartialSignData, PartialSignDataInitData } from '../../pbaas/PartialSignData'
import { IdentityID } from '../../pbaas/IdentityID'
import { SaplingPaymentAddress } from '../../pbaas/SaplingPaymentAddress'
import { PartialMMRData } from '../../pbaas/PartialMMRData'
import { DATA_TYPE_MESSAGE, DATA_TYPE_MMRDATA, DATA_TYPE_VDXFDATA } from '../../constants/pbaas'
import { FqnVdxfUniValue } from '../../pbaas/VdxfUniValue'
import { CompactIAddressObject } from '../../vdxf/classes/CompactAddressObject'
import * as VDXF_Data from '../../vdxf/vdxfdatakeys'

describe('PartialSignData serialization/deserialization', () => {
  function testCLIJsonSerialization(instance) {
    const cliJson = instance.toCLIJson();
    const fromCLIJsonInstance = PartialSignData.fromCLIJson(cliJson);
    expect(fromCLIJsonInstance.toCLIJson()).toEqual(cliJson);
  }

  function testBufferSerialization(instance) {
    const fromBufferInstance = new instance.constructor();
    fromBufferInstance.fromBuffer(instance.toBuffer());
    expect(fromBufferInstance.toBuffer().toString("hex")).toBe(instance.toBuffer().toString("hex"));
  }

  test('Round-trip with both standard buffer data and PartialMMRData', () => {
    // Create an instance of PartialMMRData to be used as our "MMR data"
    const mmrData = new PartialMMRData({
      flags: new BN('0', 10),
      data: [
        { type: new BN('2', 10), data: Buffer.from('src/__tests__/pbaas/partialmmrdata.test.ts', 'utf-8') },
        { type: new BN('3', 10), data: Buffer.from('Hello test message 12345', 'utf-8') },
      ],
      salt: [Buffer.from('=H319X:)@H2Z'), Buffer.from('s*1UHmVr?feI')],
      mmrhashtype: new BN('1', 10), // e.g. PartialMMRData.HASH_TYPE_SHA256
      priormmr: [
        Buffer.from('80a28cdff6bd91a2e96a473c234371fd8b67705a8c4956255ce7b8c7bf20470f02381c9a935f06cdf986a7c5facd77625befa11cf9fd4b59857b457394a8af979ab2830087a3b27041b37bc318484175'), 
        Buffer.from('d97fd4bbd9e88ca0c5822c12d5c9b272b2044722aa48b1c8fde178be6b59ccea509f403d3acd226c16ba3c32f0cb92e2fcaaa02b40d0bc5257e0fbf2e6c3d3d7f1a1df066967b193d131158ba5bef732')
      ],
    })

    // Define a base set of parameters for PartialSignData — with PartialMMRData
    const baseDataWithMMR: PartialSignDataInitData = {
      flags: new BN('0', 10),
      address: IdentityID.fromAddress('iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq'),
      prefixString: Buffer.from('example prefix', 'utf8'),
      vdxfKeys: [IdentityID.fromAddress('i81XL8ZpuCo9jmWLv5L5ikdxrGuHrrpQLz')],
      vdxfKeyNames: [Buffer.from('VDXFNAME', 'utf8')],
      boundHashes: [Buffer.from('0873c6ba879ce87f5c207a4382b273cac164361af0b9fe63d6d7b0d7af401fec', 'hex'), Buffer.from('0873c6ba879ce87f5c207a4382b273cac164361af0b9fe63d6d7b0d7af401fec', 'hex')],
      hashType: new BN('1', 10),
      encryptToAddress: SaplingPaymentAddress.fromAddressString(
        'zs1wczplx4kegw32h8g0f7xwl57p5tvnprwdmnzmdnsw50chcl26f7tws92wk2ap03ykaq6jyyztfa'
      ),
      createMMR: true,
      signature: Buffer.from('AeNjMwABQSAPBEuajDkRyy+OBJsWmDP3EUoqN9UjCJK9nmoSQiNoZWBK19OgGCYdEqr1CiFfBf8SFHVoUv4r2tb5Q3qsMTrp', 'base64'),
      dataType: DATA_TYPE_MMRDATA,
      data: mmrData, // This is the PartialMMRData object
    }

    // Define a base set of parameters for PartialSignData — with simple buffer data
    const baseDataWithBuffer = {
      ...baseDataWithMMR,
      dataType: DATA_TYPE_MESSAGE,
      data: Buffer.from('regular buffer data', 'utf8'),
    }

    // If you have two base configs (one with MMR data, one with Buffer data):
    const baseConfigs = [baseDataWithMMR, baseDataWithBuffer];
    const removableKeys = [
      'address',
      'prefixString',
      'vdxfKeys',
      'vdxfKeyNames',
      'boundHashes',
      'encryptToAddress',
      'signature',
      'data'
    ] as const;

    const finalTestData: PartialSignDataInitData[] = [];

    for (const base of baseConfigs) {
      // Always include the fully populated base
      finalTestData.push(base);

      // Create a single variation for each removable key
      for (const key of removableKeys) {
        const newConfig = { ...base };
        delete newConfig[key];

        // If removing data, also remove datatype
        if (key === 'data') {
          delete newConfig.dataType;
        }

        finalTestData.push(newConfig);
      }
    }

    // Now test finalTestData once.
    finalTestData.forEach((config, index) => {
      try {
        const psd = new PartialSignData(config);
        const serialized = psd.toBuffer();
  
        const psdFromBuffer = new PartialSignData();
        psdFromBuffer.fromBuffer(serialized);
  
        const reserialized = psdFromBuffer.toBuffer();
        expect(reserialized.toString('hex')).toBe(serialized.toString('hex'));
        testCLIJsonSerialization(psd);
      } catch(e) {
        console.error("Error in finalTestData entry:");
        console.error(config);
        throw e;
      }
    });
  })

  test('can (de)serialize signdata from CLI with vdxfdata and FQN inner key', () => {
    const cliJson = {
      address: 'iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq',
      vdxfdata: {
        [VDXF_Data.ContentMultiMapRemoveKeyName]: {
          version: 1,
          action: 3,
          entrykey: 'iD3yzD6KnrSG75d8RzirMD6SyvrAS2HxjH',
        },
      },
    };

    const psd = PartialSignData.fromCLIJson(cliJson);

    expect(psd.data).toBeInstanceOf(FqnVdxfUniValue);
    testCLIJsonSerialization(psd);
    testBufferSerialization(psd);
  });

  test('FQN inner key in vdxfdata is preserved as FQN type after binary round-trip', () => {
    const psd = PartialSignData.fromCLIJson({
      address: 'iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq',
      vdxfdata: {
        [VDXF_Data.ContentMultiMapRemoveKeyName]: {
          version: 1,
          action: 3,
          entrykey: 'iD3yzD6KnrSG75d8RzirMD6SyvrAS2HxjH',
        },
      },
    });

    const restored = new PartialSignData();
    restored.fromBuffer(psd.toBuffer());

    expect(restored.data).toBeInstanceOf(FqnVdxfUniValue);
    const uni = restored.data as FqnVdxfUniValue;
    expect(uni.values).toHaveLength(1);

    const innerKey = Object.keys(uni.values[0])[0];
    const compactAddr = new CompactIAddressObject();
    compactAddr.fromBuffer(Buffer.from(innerKey, 'hex'), 0);

    expect(compactAddr.isFQN()).toBe(true);
    expect(compactAddr.address).toBe(VDXF_Data.ContentMultiMapRemoveKeyName);
  });

  test('FQN inner key toJson returns FQN string, not iaddress', () => {
    const psd = PartialSignData.fromCLIJson({
      address: 'iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq',
      vdxfdata: {
        [VDXF_Data.ContentMultiMapRemoveKeyName]: {
          version: 1,
          action: 3,
          entrykey: 'iD3yzD6KnrSG75d8RzirMD6SyvrAS2HxjH',
        },
      },
    });

    const uni = psd.data as FqnVdxfUniValue;
    const json = uni.toJson() as Record<string, unknown>;

    expect(json[VDXF_Data.ContentMultiMapRemoveKeyName]).toBeDefined();
    expect(json[VDXF_Data.ContentMultiMapRemoveKey.vdxfid]).toBeUndefined();
  });

  test('PartialSignData constructed directly with FqnVdxfUniValue and FQN key round-trips correctly', () => {
    const uni = FqnVdxfUniValue.fromJson({
      [VDXF_Data.ContentMultiMapRemoveKeyName]: {
        version: 1,
        action: 3,
        entrykey: 'iD3yzD6KnrSG75d8RzirMD6SyvrAS2HxjH',
      },
    });

    const psd = new PartialSignData({
      address: IdentityID.fromAddress('iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq'),
      dataType: DATA_TYPE_VDXFDATA,
      data: uni,
    });

    testBufferSerialization(psd);
  });

  test('iaddress inner key and FQN inner key produce different buffers', () => {
    const psdFqn = PartialSignData.fromCLIJson({
      vdxfdata: {
        [VDXF_Data.ContentMultiMapRemoveKeyName]: {
          version: 1, action: 3, entrykey: 'iD3yzD6KnrSG75d8RzirMD6SyvrAS2HxjH',
        },
      },
    });

    const psdIaddr = PartialSignData.fromCLIJson({
      vdxfdata: {
        [VDXF_Data.ContentMultiMapRemoveKey.vdxfid]: {
          version: 1, action: 3, entrykey: 'iD3yzD6KnrSG75d8RzirMD6SyvrAS2HxjH',
        },
      },
    });

    expect(psdFqn.toBuffer().toString('hex')).not.toBe(psdIaddr.toBuffer().toString('hex'));
  });

  test('can (de)serialize signdata from CLI with vdxfdata', () => {
    const params = { 
      "address": "i6joVUtMohssU9pFAwojYrZfF9EmyAB95K", 
      "createmmr": true, 
      "encrypttoaddress": "zs1lyal620gwwyt0cyl6pwmcn8ewasu4c64hca6yfmkv4g9aw3cz67v3jn937emzl0vv4pgv506cq6", 
      "mmrdata": [
        { 
          "vdxfdata": 
            { 
              "i4GC1YGEVD21afWudGoFJVdnfjJ5XWnCQv": 
                { 
                  "version": 1, 
                  "flags": 0, 
                  "label": "i4GqsotHGa4czCdtg2d8FVHKfJFzVyBPrM", 
                  "mimetype": "text/plain", 
                  "objectdata": { "message": "John" } 
                } 
            } 
        }, 
        { 
          "vdxfdata": 
            { 
              "i4GC1YGEVD21afWudGoFJVdnfjJ5XWnCQv": 
                { 
                  "version": 1, 
                  "flags": 0, 
                  "label": "iHybTrNB1kXRrjsCtJXd6fvBKxepqMpS5Z", 
                  "mimetype": "text/plain", 
                  "objectdata": { "message": "Doe" } 
                } 
            } 
        }
      ] 
    };

    const psd = PartialSignData.fromCLIJson(params);

    testCLIJsonSerialization(psd);
    testBufferSerialization(psd);
  })
})