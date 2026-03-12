import { BN } from "bn.js";
import { PRINCIPAL_DEFAULT_FLAGS, PRINCIPAL_VERSION_CURRENT, Principal } from "../../pbaas/Principal";
import { KeyID } from "../../pbaas/KeyID";
import { fromBase58Check } from "../../utils/address";
import { FqnVdxfUniValue, VDXF_UNI_VALUE_VERSION_CURRENT, VdxfUniValue } from "../../pbaas/VdxfUniValue";
import { ContentMultiMapRemove } from "../../pbaas/ContentMultiMapRemove";
import { ContentMultiMap, FqnContentMultiMap } from "../../pbaas/ContentMultiMap";
import { DATA_TYPE_STRING, VERUSPAY_INVOICE_VDXF_KEY } from "../../vdxf";
import { Rating } from "../../pbaas/Rating";
import { CurrencyValueMap } from "../../pbaas";
import { CrossChainDataRef, CrossChainDataRefJson } from "../../pbaas/CrossChainDataRef";
import { SaltedData } from "../../pbaas/SaltedData";
import { SignatureData } from "../../pbaas/SignatureData";
import { MMRDescriptor } from "../../pbaas/MMRDescriptor";
import { URLRef, URLRefJson } from "../../pbaas/URLRef";
import { VdxfUniType, VdxfUniValueJson } from "../../pbaas/VdxfUniValue";
import { CrossChainProof } from "../../pbaas/CrossChainProof";
import * as VDXF_Data from '../../vdxf/vdxfdatakeys';
import { manyContentMultimapData, jsonSignatureData, jsonMMRDescriptor } from "../constants/fixtures";


describe('Encodes and decodes VdxfUniValue', () => {
  function testBufferSerialization(instance) {
    const fromBufferInstance = new instance.constructor();
    fromBufferInstance.fromBuffer(instance.toBuffer());
    expect(fromBufferInstance.toBuffer().toString("hex")).toBe(instance.toBuffer().toString("hex"));
  }

  test('encode/decode VdxfUniValue with string data', () => {
    const values = new Array<{ [key: string]: VdxfUniType }>;
    values.push({ [DATA_TYPE_STRING.vdxfid]: "Test String 123454321" });

    const v = new VdxfUniValue({
      values,
      version: VDXF_UNI_VALUE_VERSION_CURRENT
    });

    const vFromBuf = new VdxfUniValue();

    vFromBuf.fromBuffer(v.toBuffer(), 0);
    vFromBuf.fromBuffer(v.toBuffer(), 0);

    expect(vFromBuf.toBuffer().toString('hex')).toBe(v.toBuffer().toString('hex'));
    expect(VdxfUniValue.fromJson(v.toJson()).toBuffer().toString('hex')).toBe(vFromBuf.toBuffer().toString('hex'));
  });

  test('encode/decode vdxfunivalue non-array with string data', () => {
    const uni = VdxfUniValue.fromJson({
      "i4GC1YGEVD21afWudGoFJVdnfjJ5XWnCQv":{
         "version":1,
         "flags":96,
         "mimetype":"text/plain",
         "objectdata":{
            "message":"John"
         },
         "label":"i4GqsotHGa4czCdtg2d8FVHKfJFzVyBPrM"
      }
    })
    
    testBufferSerialization(uni);
  })

  test('fail to encode/decode VdxfUniValue with unknown data', () => {
    const values = new Array<{ [key: string]: VdxfUniType }>;
    values.push({ [VERUSPAY_INVOICE_VDXF_KEY.vdxfid]: Buffer.alloc(20) });

    const v = new VdxfUniValue({
      values,
      version: VDXF_UNI_VALUE_VERSION_CURRENT
    });

    const vFromBuf = new VdxfUniValue();

    expect(() => vFromBuf.fromBuffer(v.toBuffer(), 0)).toThrow();
  });

  // This test uses serialized data from the daemon adter putting in the Rating object into a contentmultimap.
  const multiMapwithRating = "979e0d9bc8c91be03c57bab5b45ddcf17fd5ca32011c0100000002011af5b8015c64d39ab44c60ead8317f9f5a9b6c4c0101"

  test('fail to encode/decode VdxfUniValue with unknown data', () => {

    const ratingMap = { "version": 1, "trustlevel": 2, "ratingsmap": { "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV": "01" } }

    const jsonRating = Rating.fromJson(ratingMap);

    const v = new VdxfUniValue();
    v.fromBuffer(Buffer.from(multiMapwithRating, 'hex'));

    const extractedRating = v.values[0]['iHJComZUXXGniLkDhjYprWYEN8qvQGDoam'] as Rating;

    expect(jsonRating.toBuffer().toString('hex')).toBe(extractedRating.toBuffer().toString('hex'));
  });

  const multimapwithCurrencymap = "c98f1f7e5804ec1b180192f87125aefcc270db25011d011af5b8015c64d39ab44c60ead8317f9f5a9b6c4c00a0724e1809000000f478f668655"

  const multimapwithcrosschaindataref = "d6ae5ac0571b22d161261b87c748f6e0aee0334d011302011068747470733a2f2f76657275732e696f"

  const multimapwithsignaturedata = "2af2a488d317c76af6f764ec2c04009a9e358bb4019901a6ef9ea235635e328124ff3429db9f9e91b64e2d0120b793323968ea80de4df1fb78963cfb8b604b524f6a7c9069293085e076f44d5df478f668655e60f6b49e2424053166ba2cf2413901000000490205d65f00000141205e483e50265341623cd9a089baf4b913f969b5377d588044c09b7d239870d7f7205a4a4581f440db7d01049ebdfe95f5de7a6b07113f9c7f79dc6fd3da69f245"

  const multimapwithmmrdescriptor = "4382a62b73169697c3698d2f00bed6024c3a279701fd5402010501010549b00ad8606acbf5234700daa308a2c64c1f9466c11d47255a60f8ccf9c74ba82b994a03b9b0331bc6f1bf25bbc8b4453a130d65b6a9dc21f7589967e88e51d930682469b03873c54e7720d89d4a9333fe85519a447b886b6c6c8aabee6fb144e9742b76b745dbdfd83c9a0105808207c6db9c149dcaff5f502baf891642e67e7e303c0ba8130f2bff76d8247929bc7ce55fdf66bac03ea808006dc5e71aa12deaff355985c7770ee7a534d9cea2bfc10851ed5c91467083ffb1f746161f5d567b4be5c98d72300e1762697d5f62067d819ac0b35ac2c712c6e8e04cefaecaf759f38f4fa3ff4d3fc4d1dccbb6b820230df92c25958999741329ed3dafc7825900807cbf6b02becc236ce573158a4f0201057c97c0b93faab9462670a5a13da88d9ca796db968ae9c9f1b88df67c564b73cb63f752248402844522efaa62e5b42ce816d0a9f44ca14efaf6f7fe47d916e77b54266c5cac39c6771e899ebda093c566d33bbf60b4a598ea45bf2f5fb1f0cd782baaf092a880a799e0771144a9e9422eec107e43d23ba9386bb46dde0920d7a908ddf6f4d6261d25c62ca086bb3f570b07d74a59256feed13d64d6fbadd201057bd1ce7cab498d9a87bbf3c8d5f255cf209e87adf01f407751959f2d49f23056597a51240e90d5f758adc92e819f77f698fe754c9ea350c213dbcbffdaeb6d9a55bbaf705af9a375c855e7a8ca486bc65b1bd24c35e13f437a7490ecaffeff0323e7508a6cc4e36c5414b4cd7d3125ffabfa3fe85a56e4f6e539925b20822d2b817613d5eb5daf4893afc57289d0081f8fe225c77e1e4839aa0822b9a5"

  test('deserialize currency map from vdxfuniValue', () => {
    const v = new VdxfUniValue();
    v.fromBuffer(Buffer.from(multimapwithCurrencymap, 'hex'));

    const currencyMap = v.values[0]['iMrGhzkZq5fpWWSa1RambRySFPb7CuvKuX'] as CurrencyValueMap;

    const jsonCurrencyMap = { "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV": "100000.00000000" };
    const currencyMapFromJson = CurrencyValueMap.fromJson(jsonCurrencyMap, true);

    expect(currencyMap.toBuffer().toString('hex')).toBe(currencyMapFromJson.toBuffer().toString('hex'));
  });

  test('deserialize crosschain data ref from vdxfuniValue', () => {
    const v = new VdxfUniValue();
    v.fromBuffer(Buffer.from(multimapwithcrosschaindataref, 'hex'));

    const crossChainDataRef = v.values[0]['iP3euVSzNcXUrLNHnQnR9G6q8jeYuGSxgw'] as CrossChainDataRef;

    const jsonCrossChainDataRef = { "version": "1", "url": "https://verus.io" };

    const crossChainDataRefFromJson = new CrossChainDataRef(URLRef.fromJson(jsonCrossChainDataRef));

    expect(crossChainDataRef.toBuffer().toString('hex')).toBe(crossChainDataRefFromJson.toBuffer().toString('hex'));
  });

  test('deserialize signature data from vdxfuniValue', () => {
    const v = new VdxfUniValue();
    v.fromBuffer(Buffer.from(multimapwithsignaturedata, 'hex'));

    const signatureData = v.values[0]['i7PcVF9wwPtQ6p6jDtCVpohX65pTZuP2ah'] as SignatureData;


    const signatureDataFromJson = SignatureData.fromJson(jsonSignatureData);

    expect(signatureData.toBuffer().toString('hex')).toBe(signatureDataFromJson.toBuffer().toString('hex'));
  });

  test('deserialize mmr descriptor from vdxfuniValue', () => {
    const v = new VdxfUniValue();
    v.fromBuffer(Buffer.from(multimapwithmmrdescriptor, 'hex'));

    const mmrDescriptor = v.values[0]['i9dVDb4LgfMYrZD1JBNP2uaso4bNAkT4Jr'] as MMRDescriptor;

    const mmrDescriptorFromJson = MMRDescriptor.fromJson(jsonMMRDescriptor);

    expect(mmrDescriptor.toBuffer().toString('hex')).toBe(mmrDescriptorFromJson.toBuffer().toString('hex'));
  });

  test('deserialize datadescriptor to Json back to Object', () => {

    const nestedDescriptor = VdxfUniValue.fromJson({
      "i4GC1YGEVD21afWudGoFJVdnfjJ5XWnCQv": {
        "version": 1,
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
      }
    });

    const serializedUni = nestedDescriptor.toBuffer().toString('hex'); // Serialize the request to a hex string

    const newVdxfValue = new VdxfUniValue();

    newVdxfValue.fromBuffer(Buffer.from(serializedUni, 'hex')); // Deserialize the request from the hex string

    const nestedJson = nestedDescriptor.toJson();

    const newJson = newVdxfValue.toJson();

    expect(nestedJson).toStrictEqual(newJson);
  });

  test('deserialize nested datadescriptor array with partial hex to Json back to Object', () => {
    const partial = VdxfUniValue.fromJson([{
      "i4GC1YGEVD21afWudGoFJVdnfjJ5XWnCQv": {
        "version": 1,
        "flags": 32,
        "objectdata": [
          {
            "i4GC1YGEVD21afWudGoFJVdnfjJ5XWnCQv": {
              "version": 1,
              "flags": 32,
              "objectdata": "01",
              "label": "version"
            }
          },
          "08a2ebb2c55f83a8e2a426a01600a656d706c6f796d656e7404747970650a746578742f706c61696e08a2ebb2c55f83a8e2a426a53320ed4d42124f4d012301600f436869656620446576656c6f706572057469746c650a746578742f706c61696e08a2ebb2c55f83a8e2a426a53320ed4d42124f4d0157016044426f6479206f6620636c61696d20676f657320686572652c207768617420796f75206861766520646f6e652c207768617420796f7520686176652061636869657665642e04626f64790a746578742f706c61696e08a2ebb2c55f83a8e2a426a53320ed4d42124f4d011d016009323032312d323032340564617465730a746578742f706c61696e08a2ebb2c55f83a8e2a426a53320ed4d42124f4d011f01600a323032352d30312d3239066973737565640a746578742f706c61696e08a2ebb2c55f83a8e2a426a53320ed4d42124f4d015a016040373962343830376333303465383035333831666438653165376234383865353062363032613033333366663266663633636264313564363362366163383835650b7265666572656e636549440a746578742f706c61696"
        ],
        "label": "i3bgiLuaxTr6smF8q6xLG4jvvhF1mmrkM2"
      }
    }
    ])

    const serializedUni = partial.toBuffer().toString('hex'); // Serialize the request to a hex string

    const newVdxfValue = new VdxfUniValue();

    newVdxfValue.fromBuffer(Buffer.from(serializedUni, 'hex')); // Deserialize the request from the hex string

    const nestedJson = partial.toJson();

    const newJson = newVdxfValue.toJson();

    expect(nestedJson).toStrictEqual(newJson);
  });

  test('deserialize various vdxfunivalues', () => {

    const jsonData = manyContentMultimapData['iGdWifeNFcN69JiFwmcZTYT1zPYpFumGhq'];

    // String
    const stringData = 'ab8b7b8b4418de66e611921699a328126461c0e50116155465737420537472696e6720313233343534333231'
    const stringObject = new VdxfUniValue();
    stringObject.fromBuffer(Buffer.from(stringData, 'hex'));

    expect(stringObject.values[0]).toStrictEqual(jsonData.find(item => item[DATA_TYPE_STRING.vdxfid] != undefined));
    expect(stringObject.toBuffer().toString('hex')).toBe(stringData);
    expect(stringData).toBe(VdxfUniValue.fromJson({ "iK7a5JNJnbeuYWVHCDRpJosj3irGJ5Qa8c": "Test String 123454321" }).toBuffer().toString('hex'));

    // Byte Vector
    const byteVectorData = 'ae377010192abb2513f705519f62066046e63acc0111103cc8db378593b7a6d32883a3948bb1d0'
    const vectorObject = new VdxfUniValue();
    vectorObject.fromBuffer(Buffer.from(byteVectorData, 'hex'));
    expect(vectorObject.values[0]).toStrictEqual(jsonData.find(item => item[VDXF_Data.DataByteVectorKey.vdxfid] != undefined));
    expect(vectorObject.toBuffer().toString('hex')).toBe(byteVectorData);
    expect(byteVectorData).toBe(VdxfUniValue.fromJson({ "iKMhRLX1JHQihVZx2t2pAWW2uzmK6AzwW3": "3cc8db378593b7a6d32883a3948bb1d0" }).toBuffer().toString('hex'));

    // Currency Value Map
    const currencyValueMapData = 'c98f1f7e5804ec1b180192f87125aefcc270db2501390284d881e355c1c87dd84baa2e068dc3829e140d3c0000c16ff2862300a6ef9ea235635e328124ff3429db9f9e91b64e2da83fb20600000000'
    const currencyValueMapObject = new VdxfUniValue();
    currencyValueMapObject.fromBuffer(Buffer.from(currencyValueMapData, 'hex'));

    expect(currencyValueMapObject.toJson()).toStrictEqual(jsonData.find(item => item[VDXF_Data.DataCurrencyMapKey.vdxfid] != undefined));
    expect(currencyValueMapObject.toBuffer().toString('hex')).toBe(currencyValueMapData);
    expect(currencyValueMapData).toBe(VdxfUniValue.fromJson(jsonData[2]).toBuffer().toString('hex'));

    // Rating
    const ratingData = '979e0d9bc8c91be03c57bab5b45ddcf17fd5ca32016001000000020239a34181d4d91a55d7bd8100580e5eca59265ca4203428665f7b02feb976dd53394b1518893428665f7b02feb976dd53394b151889a6ef9ea235635e328124ff3429db9f9e91b64e2d103cc8db378593b7a6d32883a3948bb1d0'
    const ratingObject = new VdxfUniValue();
    ratingObject.fromBuffer(Buffer.from(ratingData, 'hex'));
    expect(ratingObject.toJson()).toStrictEqual(jsonData.find(item => item[VDXF_Data.DataRatingsKey.vdxfid] != undefined));
    expect(ratingObject.toBuffer().toString('hex')).toBe(ratingData);
    expect(ratingData).toBe(VdxfUniValue.fromJson(jsonData[3]).toBuffer().toString('hex'));

    // Transfer Destination
    const transferDestiantionData = '3cac111c0c35ea486ab13760148393847387f392022e4214e5880d57bad810578d87dc5028a9a1c7be12e91f01160414a7414cd89c2d282bac9b61ed5bf3679d4b66a5f6'
    const transferDestinationObject = new VdxfUniValue();
    transferDestinationObject.fromBuffer(Buffer.from(transferDestiantionData, 'hex'));
    const test1 = transferDestinationObject.toJson()
    expect(transferDestinationObject.toJson()).toStrictEqual(jsonData.find(item => item[VDXF_Data.DataTransferDestinationKey.vdxfid] != undefined));
    expect(transferDestinationObject.toBuffer().toString('hex')).toBe(transferDestiantionData);
    expect(transferDestiantionData).toBe(VdxfUniValue.fromJson(jsonData[4]).toBuffer().toString('hex'));

    // CMM Remove
    const CMMData = '16ed9d732d8886b1972dc8beb72df8e486b993d30136010184d881e355c1c87dd84baa2e068dc3829e140d3c11433137d09fd7d15ae7a04b0a20b28a35b20ff76d1dc1af3157b54037b02161'
    const CMMObject = new VdxfUniValue();
    CMMObject.fromBuffer(Buffer.from(CMMData, 'hex'));
    expect(CMMObject.toJson()).toStrictEqual(jsonData.find(item => item[VDXF_Data.ContentMultiMapRemoveKey.vdxfid] != undefined));
    expect(CMMObject.toBuffer().toString('hex')).toBe(CMMData);
    expect(CMMData).toBe(VdxfUniValue.fromJson(jsonData[5]).toBuffer().toString('hex'));

    // Cross Chain Data Ref
    const crossChainDataRefData = 'd6ae5ac0571b22d161261b87c748f6e0aee0334d01650101073cac111c0c35ea486ab13760148393847387f392904cc869a56610c8174ead6c547fbae1954852af866881b095400016a39b1f74372fe316624e2e11c1bd1b48ee111411b5dccb8d47a6341623e4a6ef9ea235635e328124ff3429db9f9e91b64e2d'
    const crossChainDataRefObject = new VdxfUniValue();
    crossChainDataRefObject.fromBuffer(Buffer.from(crossChainDataRefData, 'hex'));
    expect(crossChainDataRefObject.toJson()).toStrictEqual(jsonData.find(item => item[VDXF_Data.CrossChainDataRefKey.vdxfid] != undefined));
    expect(crossChainDataRefObject.toBuffer().toString('hex')).toBe(crossChainDataRefData);
    expect(crossChainDataRefData).toBe(VdxfUniValue.fromJson(jsonData[9]).toBuffer().toString('hex'));

    // Encrypted data in data desc
    const encryptedDataDescriptorData = '08a2ebb2c55f83a8e2a426a53320ed4d42124f4d01ad010d68645f601c64bb1df7dc62732869e0e74590a33d3132035d0a1475425ee8d674c67c3649de6e0882296bd238ea6d7f6b730eac708424a1b9bff64e4610c5483a178f5bbc17ca65eea19e36246d8564523bd43b37c5fa168cc216a83332bb1d784d4620e73c54585c81207654be28752898669fb4aa5b0a8cfed358ebb0c7755879afa1daf5474335f58c20cfe44d214ba3ecc2942dd3df2d0486c788c3ec0bb7415811ba8a0074088d1406'
    const encryptedDataDescriptorObject = new VdxfUniValue();
    encryptedDataDescriptorObject.fromBuffer(Buffer.from(encryptedDataDescriptorData, 'hex'));
    expect(encryptedDataDescriptorObject.toJson()).toStrictEqual(jsonData.find(item => item[VDXF_Data.DataDescriptorKey.vdxfid] != undefined));
    expect(encryptedDataDescriptorObject.toBuffer().toString('hex')).toBe(encryptedDataDescriptorData);
    expect(encryptedDataDescriptorData).toBe(VdxfUniValue.fromJson(jsonData[10]).toBuffer().toString('hex'));

    // MMR Desc
    const mmrData = '4382a62b73169697c3698d2f00bed6024c3a279701fdb0010105050100683e9ebbf6c7cc1cffde3d8fe5c62d2919e1bf6eb99ed9d5dfb305bba71b6c9f1373b50267b0bb2c08d99ea76b09430018125a9748486650995dc1831701b90e82a394ea99fa2770c68bcecd484732a07dab3aac72751593b321c3e6c9273adb0309b9fc5917e74399010068ba128a8ec42f1541895d1cefcae1b452543dce5653ae71d9c6e56c316833ba15f8d7d977878aadef2e42894e68c25ddd4d96bed0d257ba8e000b009946702ffa9e64e6cdb3fa8d81522ba39da177b050fef0ba89884c4f0e084de007df3d5ef7f410e5d9f388a71602010068544338da640c2a9ed9d646be434a044c6a03c29c875f0ae93fbd3a59433f260027d97b5d8e569b37a906db1789e9c2280744b4ae7d90959c12f3b617a07024ab96b08db8e9606c6cd8b5929518c3057bdecae9859d41c953a7def5af72f297efc9e0b181719fed3401006807809896a9c50e7396f01a12b3bf7ed4006962840e95c646290d9e1731b9705b2fd867fd781aecaa0e34b13beeefdea3f924b67d87c189f9c1dc662ef58ac59dc93d360e97f86d65a03304141f68a66a84af74884c35df54a856db003e8afd10d3db89f722d48689'
    const mmrObject = new VdxfUniValue();
    mmrObject.fromBuffer(Buffer.from(mmrData, 'hex'));
    expect(mmrObject.toJson()).toStrictEqual(jsonData.find(item => item[VDXF_Data.MMRDescriptorKey.vdxfid] != undefined));
    expect(mmrObject.toBuffer().toString('hex')).toBe(mmrData);
    expect(mmrData).toBe(VdxfUniValue.fromJson(jsonData[11]).toBuffer().toString('hex'));

    // Signature Data
    const signatureData = '2af2a488d317c76af6f764ec2c04009a9e358bb401ef01a6ef9ea235635e328124ff3429db9f9e91b64e2d0520ad35af52bb6931b5c87a56007ccef84c524cecd55a1abdcf6657742c317de3e2904cc869a56610c8174ead6c547fbae1954852af01018abf682d52180134b2f1094355fc199742a88d7d012269473839796a676e5145715356763364536850487054556b43744a743936677a565501e2e37d312c745766cfbd1a5ad5ec4c524cf8ce7c00567ac8b53169bb52af35ad48012f5b0800014120c89dfcbd5dda8abc52c37198b019fe194f35196c6fc01e217cb1ee4e7eb0532c54f6d3618eafb050ec3dd4d399b2464bcae0fea563f506e393971d5604850a81'
    const signatureObject = new VdxfUniValue();
    signatureObject.fromBuffer(Buffer.from(signatureData, 'hex'));
    expect(signatureObject.toJson()).toStrictEqual(jsonData.find(item => item[VDXF_Data.SignatureDataKey.vdxfid] != undefined));
    expect(signatureObject.toBuffer().toString('hex')).toBe(signatureData);
    expect(signatureData).toBe(VdxfUniValue.fromJson(jsonData[12]).toBuffer().toString('hex'));
    
    // Cross Chain Data Ref pbaasevidence
    const pbaasEvidenceRefdata = 'd6ae5ac0571b22d161261b87c748f6e0aee0334d013d0001030016a39b1f74372fe316624e2e11c1bd1b48ee111411b5dccb8d47a6341623e4010000000101a6ef9ea235635e328124ff3429db9f9e91b64e2d'
    const pbaasEvidenceRefObject = new VdxfUniValue();
    pbaasEvidenceRefObject.fromBuffer(Buffer.from(pbaasEvidenceRefdata, 'hex'));
    expect(pbaasEvidenceRefObject.toJson()).toStrictEqual(jsonData[13]);
    expect(pbaasEvidenceRefObject.toBuffer().toString('hex')).toBe(pbaasEvidenceRefdata);
    expect(pbaasEvidenceRefdata).toBe(VdxfUniValue.fromJson(jsonData[13]).toBuffer().toString('hex'));
    

    //Cross Chain Data Reference (type URLRef)
    const urldata = 'd6ae5ac0571b22d161261b87c748f6e0aee0334d01140202001068747470733a2f2f76657275732e696f'
    const urlObject = new VdxfUniValue();
    urlObject.fromBuffer(Buffer.from(urldata, 'hex'));
    expect(urlObject.toJson()).toStrictEqual(jsonData[14]);
    expect(urlObject.toBuffer().toString('hex')).toBe(urldata);
    expect(urldata).toBe(VdxfUniValue.fromJson(jsonData[14]).toBuffer().toString('hex'));

    //Credential
    const credentialdata = '6d7401412e7ee923567eb8ac2d9f0c7102c2fb090151010101f503c4f232c4599167a02357c25b75d5ad3ff0177b226e616d65223a2254657374204163636f756e74227d1a7b2261646472657373223a22546573742041646472657373227d074c6162656c2031'
    const credentialObject = new VdxfUniValue();
    credentialObject.fromBuffer(Buffer.from(credentialdata, 'hex'));

    expect(credentialObject.toJson()).toStrictEqual(jsonData[15]);
    expect(credentialObject.toBuffer().toString('hex')).toBe(credentialdata);
    expect(credentialdata).toBe(VdxfUniValue.fromJson(jsonData[15]).toBuffer().toString('hex'));

  });

});

describe('VdxfUniValue FQN key support', () => {
  // "vrsc::identity.multimapremove" resolves to this vdxfid
  const CMM_REMOVE_VDXFID = VDXF_Data.ContentMultiMapRemoveKey.vdxfid;
  const CMM_REMOVE_FQN = VDXF_Data.ContentMultiMapRemoveKeyName;

  const cmmRemovePayload = { version: 1, action: 3, entrykey: "iD3yzD6KnrSG75d8RzirMD6SyvrAS2HxjH" };

  test('VdxfUniValue.fromJson accepts FQN key and produces same buffer as iaddress key', () => {
    const fromFqn = VdxfUniValue.fromJson({ [CMM_REMOVE_FQN]: cmmRemovePayload });
    const fromIaddr = VdxfUniValue.fromJson({ [CMM_REMOVE_VDXFID]: cmmRemovePayload });

    expect(fromFqn.toBuffer().toString('hex')).toBe(fromIaddr.toBuffer().toString('hex'));
  });

  test('VdxfUniValue.fromJson with FQN key stores value as ContentMultiMapRemove', () => {
    const uni = VdxfUniValue.fromJson({ [CMM_REMOVE_FQN]: cmmRemovePayload });

    expect(uni.values).toHaveLength(1);
    const value = uni.values[0][CMM_REMOVE_VDXFID];
    expect(value).toBeInstanceOf(ContentMultiMapRemove);

    const cmm = value as ContentMultiMapRemove;
    expect(cmm.version.toNumber()).toBe(1);
    expect(cmm.action.toNumber()).toBe(3);
  });

  test('VdxfUniValue with FQN key survives buffer round-trip', () => {
    const uni = VdxfUniValue.fromJson({ [CMM_REMOVE_FQN]: cmmRemovePayload });
    const buf = uni.toBuffer();

    const roundTripped = new VdxfUniValue();
    roundTripped.fromBuffer(buf);

    expect(roundTripped.toBuffer().toString('hex')).toBe(buf.toString('hex'));
    expect(roundTripped.values[0][CMM_REMOVE_VDXFID]).toBeInstanceOf(ContentMultiMapRemove);
  });

  test('FqnContentMultiMap with FQN outer and FQN inner VdxfUniValue key (the user example)', () => {
    const json = {
      [CMM_REMOVE_FQN]: [{
        [CMM_REMOVE_FQN]: cmmRemovePayload
      }]
    };

    // Should not throw
    const map = FqnContentMultiMap.fromJson(json);
    const buf = map.toBuffer();

    // Round-trip
    const roundTripped = new FqnContentMultiMap();
    roundTripped.fromBuffer(buf, 0, true);
    expect(roundTripped.toBuffer().toString('hex')).toBe(buf.toString('hex'));

    // The inner value should be a FqnVdxfUniValue with the FQN key preserved
    const entries = [...roundTripped.kvContent.entries()];
    expect(entries).toHaveLength(1);
    const [, values] = entries[0];
    expect(values).toHaveLength(1);
    const uni = values[0] as FqnVdxfUniValue;
    expect(uni).toBeInstanceOf(FqnVdxfUniValue);
    // FQN key is preserved in toJson() output
    expect((uni.toJson() as any)[CMM_REMOVE_FQN]).toBeInstanceOf(Object);
    // The actual value type is accessible via the first entry of values
    expect(Object.values(uni.values[0])[0]).toBeInstanceOf(ContentMultiMapRemove);
  });

  test('FQN keys across multiple supported VdxfUniValue types resolve correctly', () => {
    // String type
    const strFqn = VdxfUniValue.fromJson({ [VDXF_Data.DataStringKeyName]: "hello" });
    const strIaddr = VdxfUniValue.fromJson({ [VDXF_Data.DataStringKey.vdxfid]: "hello" });
    expect(strFqn.toBuffer().toString('hex')).toBe(strIaddr.toBuffer().toString('hex'));

    // ByteVector type
    const bvFqn = VdxfUniValue.fromJson({ [VDXF_Data.DataByteVectorKeyName]: "deadbeef" });
    const bvIaddr = VdxfUniValue.fromJson({ [VDXF_Data.DataByteVectorKey.vdxfid]: "deadbeef" });
    expect(bvFqn.toBuffer().toString('hex')).toBe(bvIaddr.toBuffer().toString('hex'));

    // ContentMultiMapRemove type
    const cmmFqn = VdxfUniValue.fromJson({ [CMM_REMOVE_FQN]: cmmRemovePayload });
    const cmmIaddr = VdxfUniValue.fromJson({ [CMM_REMOVE_VDXFID]: cmmRemovePayload });
    expect(cmmFqn.toBuffer().toString('hex')).toBe(cmmIaddr.toBuffer().toString('hex'));
  });
});

describe('FqnVdxfUniValue', () => {
  const CMM_REMOVE_VDXFID = VDXF_Data.ContentMultiMapRemoveKey.vdxfid;
  const CMM_REMOVE_FQN = VDXF_Data.ContentMultiMapRemoveKeyName;
  const cmmRemovePayload = { version: 1, action: 3, entrykey: "iD3yzD6KnrSG75d8RzirMD6SyvrAS2HxjH" };

  test('FqnVdxfUniValue.fromJson preserves FQN key', () => {
    const uni = FqnVdxfUniValue.fromJson({ [CMM_REMOVE_FQN]: cmmRemovePayload });

    expect(uni).toBeInstanceOf(FqnVdxfUniValue);
    expect(uni.values).toHaveLength(1);
    // Keys are stored as hex of CompactIAddressObject internally
    expect(Object.values(uni.values[0])[0]).toBeInstanceOf(ContentMultiMapRemove);
    // toJson() restores the original FQN key
    expect((uni.toJson() as any)[CMM_REMOVE_FQN]).toBeDefined();
    expect((uni.toJson() as any)[CMM_REMOVE_VDXFID]).toBeUndefined();
  });

  test('FqnVdxfUniValue with FQN key survives buffer round-trip preserving FQN', () => {
    const uni = FqnVdxfUniValue.fromJson({ [CMM_REMOVE_FQN]: cmmRemovePayload });
    const buf = uni.toBuffer();

    const roundTripped = new FqnVdxfUniValue();
    roundTripped.fromBuffer(buf);

    expect(roundTripped.toBuffer().toString('hex')).toBe(buf.toString('hex'));
    // FQN key preserved in toJson() after round-trip
    expect((roundTripped.toJson() as any)[CMM_REMOVE_FQN]).toBeDefined();
    expect((roundTripped.toJson() as any)[CMM_REMOVE_VDXFID]).toBeUndefined();

    const cmm = Object.values(roundTripped.values[0])[0] as ContentMultiMapRemove;
    expect(cmm).toBeInstanceOf(ContentMultiMapRemove);
    expect(cmm.version.toNumber()).toBe(1);
    expect(cmm.action.toNumber()).toBe(3);
  });

  test('FqnVdxfUniValue with iaddress key survives buffer round-trip', () => {
    const uni = FqnVdxfUniValue.fromJson({ [CMM_REMOVE_VDXFID]: cmmRemovePayload });
    const buf = uni.toBuffer();

    const roundTripped = new FqnVdxfUniValue();
    roundTripped.fromBuffer(buf);

    expect(roundTripped.toBuffer().toString('hex')).toBe(buf.toString('hex'));
    expect(Object.values(roundTripped.values[0])[0]).toBeInstanceOf(ContentMultiMapRemove);
    // iaddress key preserved in toJson()
    expect((roundTripped.toJson() as any)[CMM_REMOVE_VDXFID]).toBeDefined();
  });

  test('FqnVdxfUniValue FQN and iaddress keys produce different buffers', () => {
    // FQN key encodes CompactIAddressObject TYPE_FQN; iaddress encodes TYPE_I_ADDRESS
    const fromFqn = FqnVdxfUniValue.fromJson({ [CMM_REMOVE_FQN]: cmmRemovePayload });
    const fromIaddr = FqnVdxfUniValue.fromJson({ [CMM_REMOVE_VDXFID]: cmmRemovePayload });

    expect(fromFqn.toBuffer().toString('hex')).not.toBe(fromIaddr.toBuffer().toString('hex'));
  });

  test('FqnVdxfUniValue string key survives round-trip with FQN preserved', () => {
    const uni = FqnVdxfUniValue.fromJson({ [VDXF_Data.DataStringKeyName]: "hello fqn" });
    const buf = uni.toBuffer();

    const roundTripped = new FqnVdxfUniValue();
    roundTripped.fromBuffer(buf);

    expect(roundTripped.toBuffer().toString('hex')).toBe(buf.toString('hex'));
    // FQN key preserved in toJson()
    expect((roundTripped.toJson() as any)[VDXF_Data.DataStringKeyName]).toBe("hello fqn");
  });

  test('FqnContentMultiMap with iaddress outer key and FQN inner key round-trips correctly', () => {
    const json = {
      [CMM_REMOVE_VDXFID]: [{
        [CMM_REMOVE_FQN]: cmmRemovePayload
      }]
    };

    const map = FqnContentMultiMap.fromJson(json);
    const buf = map.toBuffer();

    const roundTripped = new FqnContentMultiMap();
    roundTripped.fromBuffer(buf, 0, true);
    expect(roundTripped.toBuffer().toString('hex')).toBe(buf.toString('hex'));

    const entries = [...roundTripped.kvContent.entries()];
    const [, values] = entries[0];
    const uni = values[0] as FqnVdxfUniValue;
    expect(uni).toBeInstanceOf(FqnVdxfUniValue);
    // FQN inner key preserved in toJson()
    expect((uni.toJson() as any)[CMM_REMOVE_FQN]).toBeDefined();
    expect(Object.values(uni.values[0])[0]).toBeInstanceOf(ContentMultiMapRemove);
  });

  test('ContentMultiMap with object and no array in inner area passes', () => {
    const json = {
      [CMM_REMOVE_VDXFID]: {
        [CMM_REMOVE_VDXFID]: cmmRemovePayload
      }
    };

    const map = ContentMultiMap.fromJson(json);
    const buf = map.toBuffer();

    const roundTripped = new ContentMultiMap();
    roundTripped.fromBuffer(buf, 0, true);
    expect(roundTripped.toBuffer().toString('hex')).toBe(buf.toString('hex'));
  });

  test('ContentMultiMap non-array style produces identical buffer to single-item array style', () => {
    const arrayStyle = {
      [CMM_REMOVE_VDXFID]: [{ [CMM_REMOVE_VDXFID]: cmmRemovePayload }]
    };
    const objectStyle = {
      [CMM_REMOVE_VDXFID]: { [CMM_REMOVE_VDXFID]: cmmRemovePayload }
    };

    const arrayMap = ContentMultiMap.fromJson(arrayStyle);
    const objectMap = ContentMultiMap.fromJson(objectStyle);

    expect(objectMap.toBuffer().toString('hex')).toBe(arrayMap.toBuffer().toString('hex'));
  });

  test('FqnContentMultiMap non-array style produces identical buffer to single-item array style', () => {
    const arrayStyle = {
      [CMM_REMOVE_VDXFID]: [{ [CMM_REMOVE_FQN]: cmmRemovePayload }]
    };
    const objectStyle = {
      [CMM_REMOVE_VDXFID]: { [CMM_REMOVE_FQN]: cmmRemovePayload }
    };

    const arrayMap = FqnContentMultiMap.fromJson(arrayStyle);
    const objectMap = FqnContentMultiMap.fromJson(objectStyle);

    expect(objectMap.toBuffer().toString('hex')).toBe(arrayMap.toBuffer().toString('hex'));
  });

  test('FqnContentMultiMap non-array with FQN outer key produces identical buffer to array style', () => {
    const arrayStyle = {
      [CMM_REMOVE_FQN]: [{ [CMM_REMOVE_FQN]: cmmRemovePayload }]
    };
    const objectStyle = {
      [CMM_REMOVE_FQN]: { [CMM_REMOVE_FQN]: cmmRemovePayload }
    };

    const arrayMap = FqnContentMultiMap.fromJson(arrayStyle);
    const objectMap = FqnContentMultiMap.fromJson(objectStyle);

    expect(objectMap.toBuffer().toString('hex')).toBe(arrayMap.toBuffer().toString('hex'));
  });
});
