import { DataDescriptor, } from "../../pbaas/DataDescriptor";
import { PBaaSEvidenceRef } from "../../pbaas/PBaaSEvidenceRef";
import { UTXORef } from "../../pbaas/UTXORef";
import { URLRef } from "../../pbaas/URLRef";
import { IdentityMultimapRef } from "../../pbaas/IdentityMultimapRef";
import { CrossChainDataRef } from "../../pbaas/CrossChainDataRef";
import { VdxfUniValue } from "../../pbaas/VdxfUniValue";
import { SignatureData } from "../../pbaas/SignatureData";
import { TransferDestination, DEST_ID } from "../../pbaas/TransferDestination";
import * as VDXF_Data from '../../vdxf/vdxfdatakeys';
import { toBase58Check, fromBase58Check } from '../../utils/address';
import { BN } from "bn.js";

describe('Serializes and deserializes dataDescriptors', () => {

  test('Nested datadescriptor with dataDescriptor in it', async () => {

    const nestedDescriptor = DataDescriptor.fromJson({
      version: 1,
      "flags": 2,
      "objectdata": {
        "i4GC1YGEVD21afWudGoFJVdnfjJ5XWnCQv": {
          "version": 1,
          "flags": 96,
          "mimetype": "text/plain",
          "objectdata": {
            "message": "Something 1"
          },
          "label": "label 1"
        }
      },
      "salt": "4f66603f256d3f757b6dc3ea44802d4041d2a1901e06005028fd60b85a5878a2"
    });

    const serializedDesc = nestedDescriptor.toBuffer().toString('hex'); // Serialize the request to a hex string
    const newDescriptor = new DataDescriptor();

    newDescriptor.fromBuffer(Buffer.from(serializedDesc, 'hex')); // Deserialize the request from the hex string
    expect(serializedDesc).toStrictEqual(newDescriptor.toBuffer().toString('hex')) // Compare the original serialized request to the new serialized request

  });

  test('Datadescriptor with CrossChainDataRef', async () => {

    const evid = new PBaaSEvidenceRef();

    evid.version = new BN(1);
    evid.flags = new BN(1); //type IS_EVIDENCE = 1
    evid.output = new UTXORef({ hash: Buffer.from('30395e0868b1953477e14bb5c16349622239a94115a4d1f02b72b6ecf8b1c79c', 'hex'), n: new BN(0) });
    evid.object_num = new BN(0);
    evid.sub_object = new BN(0);
    evid.system_id = "i5v3h9FWVdRFbNHU7DfcpGykQjRaHtMqu7";

    const crossChainRef = new CrossChainDataRef(evid);
    const dataKeyMap = new Map();
    dataKeyMap.set(VDXF_Data.CrossChainDataRefKey.vdxfid, crossChainRef);
    const crossChainVector = new VdxfUniValue({ values: dataKeyMap });

    const nestedDescriptor = DataDescriptor.fromJson({
      version: 1,
      "flags": 2, //FLAG_SALT_PRESENT = 2
      "objectdata": crossChainVector.toBuffer().toString('hex'),
      "salt": "4f66603f256d3f757b6dc3ea44802d4041d2a1901e06005028fd60b85a5878a2"
    });

    const serializedDesc = nestedDescriptor.toBuffer().toString('hex'); // Serialize the request to a hex string
    const newDescriptor = new DataDescriptor();

    newDescriptor.fromBuffer(Buffer.from(serializedDesc, 'hex')); // Deserialize the request from the hex string
    expect(serializedDesc).toStrictEqual(newDescriptor.toBuffer().toString('hex')) // Compare the original serialized request to the new serialized request
    expect(newDescriptor.objectdata)
  });
  test('Datadescriptor with TransferDestination', async () => {

    const destid = "iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm";

    const txDest = new TransferDestination({
      type: DEST_ID,
      destination_bytes: fromBase58Check(destid).hash
    });

    const destinationKeyMap = new Map();
    destinationKeyMap.set(VDXF_Data.CrossChainDataRefKey.vdxfid, txDest);

    const txDestVector = new VdxfUniValue({ values: destinationKeyMap });

    const nestedDescriptor = DataDescriptor.fromJson({
      version: 1,
      "flags": 2, //FLAG_SALT_PRESENT = 2
      "objectdata": txDestVector.toBuffer().toString('hex'),
      "salt": "4f66603f256d3f757b6dc3ea44802d4041d2a1901e06005028fd60b85a5878a2"
    });

    const serializedDesc = nestedDescriptor.toBuffer().toString('hex'); // Serialize the request to a hex string
    const newDescriptor = new DataDescriptor();

    newDescriptor.fromBuffer(Buffer.from(serializedDesc, 'hex')); // Deserialize the request from the hex string
    expect(serializedDesc).toStrictEqual(newDescriptor.toBuffer().toString('hex')) // Compare the original serialized request to the new serialized request
  });
  test('Datadescriptor with SignatureData', async () => {

    const sigData = SignatureData.fromJson({
      "version": 1,
      "systemid": "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
      "hashtype": 1,
      "signaturehash": "dfd3e3d82783360dfc675a09e6a226fd43119ef4e8d7cf553af96ea5883b51da",
      "identityid": "iKjrTCwoPFRk44fAi2nYNbPG16ZUQjv1NB",
      "signaturetype": 1,
      "signature": "AgXOCgAAAUEfCiSukK9tg46cYOpHmxzKjNquWDyNc8H58+uLSOYmqlUcNUxWB8j3nzT1RHKeJGygdAwrUj5iZ/A9H3+qYV9H9g=="
    });

    const sigDataMap = new Map();
    sigDataMap.set(VDXF_Data.CrossChainDataRefKey.vdxfid, sigData);

    const sigUniValue = new VdxfUniValue({ values: sigDataMap });

    const nestedDescriptor = DataDescriptor.fromJson({
      version: 1,
      "flags": 2, //FLAG_SALT_PRESENT = 2
      "objectdata": sigUniValue.toBuffer().toString('hex'),
      "salt": "4f66603f256d3f757b6dc3ea44802d4041d2a1901e06005028fd60b85a5878a2"
    });

    const serializedDesc = nestedDescriptor.toBuffer().toString('hex'); // Serialize the request to a hex string
    const newDescriptor = new DataDescriptor();

    newDescriptor.fromBuffer(Buffer.from(serializedDesc, 'hex')); // Deserialize the request from the hex string
    expect(serializedDesc).toStrictEqual(newDescriptor.toBuffer().toString('hex')) // Compare the original serialized request to the new serialized request
  });

  test('deserialize and desserialize mmrhashes', async () => {

    const mmrhashes = DataDescriptor.fromJson({
      "version": 1,
      "flags": 0,
      "objectdata": "41d826d3c6cbbc3a96992670d2f604e959fd1a8c014102c78ee8fa7c01db81cbf60181fc9baa101aa8c07d40c324d771145699168d3b18867a587f139173cf8b961d581fe15bbf15f5d02813a615e54c050d2b6b1cd4ee"
    })

    const initialDescriptor = mmrhashes.toBuffer().toString('hex');
    const newDescriptor = new DataDescriptor();

    newDescriptor.fromBuffer(Buffer.from(initialDescriptor, 'hex'));

    expect(initialDescriptor).toStrictEqual(newDescriptor.toBuffer().toString('hex'));

    // test to see if the hashed object is the correct size
    const hashes = mmrhashes.DecodeHashVector();
    expect(typeof hashes).toStrictEqual('object')
    expect(hashes.length).toStrictEqual(2);
    expect(hashes[0].length).toStrictEqual(32);
    expect(hashes[1].length).toStrictEqual(32);

  });
  test('Datadescriptor with URLRef', async () => {
      
      const urlRef = new URLRef({ version: new BN(1), url: "https://verus.io" });
  
      const urlRefMap = new Map();
      urlRefMap.set(VDXF_Data.CrossChainDataRefKey.vdxfid, urlRef);
  
      const urlRefUniValue = new VdxfUniValue({ values: urlRefMap });
  
      const nestedDescriptor = DataDescriptor.fromJson({
        version: 1,
        "flags": 2, //FLAG_SALT_PRESENT = 2
        "objectdata": urlRefUniValue.toBuffer().toString('hex'),
        "salt": "4f66603f256d3f757b6dc3ea44802d4041d2a1901e06005028fd60b85a5878a2"
      });
  
      const serializedDesc = nestedDescriptor.toBuffer().toString('hex'); // Serialize the request to a hex string
      const newDescriptor = new DataDescriptor();
  
      newDescriptor.fromBuffer(Buffer.from(serializedDesc, 'hex')); // Deserialize the request from the hex string
      expect(serializedDesc).toStrictEqual(newDescriptor.toBuffer().toString('hex')) // Compare the original serialized request to the new serialized request
    });
  test('Datadescriptor with IdentityMultimapRef', async () => {
      
      const idMultimap = new IdentityMultimapRef({
        version: new BN(1),
        flags: new BN(0),
        id_ID: "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
        key: "i4GC1YGEVD21afWudGoFJVdnfjJ5XWnCQv",
        height_start: new BN(0),
        height_end: new BN(0),
        data_hash: Buffer.alloc(0),
        system_id: "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq"
      });
  
      const idMultimapMap = new Map();
      idMultimapMap.set(VDXF_Data.CrossChainDataRefKey.vdxfid, idMultimap);
  
      const idMultimapUniValue = new VdxfUniValue({ values: idMultimapMap });
  
      const nestedDescriptor = DataDescriptor.fromJson({
        version: 1,
        "flags": 2, //FLAG_SALT_PRESENT = 2
        "objectdata": idMultimapUniValue.toBuffer().toString('hex'),
        "salt": "4f66603f256d3f757b6dc3ea44802d4041d2a1901e06005028fd60b85a5878a2"
      });
  
      const serializedDesc = nestedDescriptor.toBuffer().toString('hex'); // Serialize the request to a hex string
      const newDescriptor = new DataDescriptor();
  
      newDescriptor.fromBuffer(Buffer.from(serializedDesc, 'hex')); // Deserialize the request from the hex string
      expect(serializedDesc).toStrictEqual(newDescriptor.toBuffer().toString('hex')) // Compare the original serialized request to the new serialized request
    });
});
