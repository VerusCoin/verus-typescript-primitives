import { BN } from "bn.js";
import { PRINCIPAL_DEFAULT_FLAGS, PRINCIPAL_VERSION_CURRENT, Principal } from "../../pbaas/Principal";
import { KeyID } from "../../pbaas/KeyID";
import { fromBase58Check } from "../../utils/address";
import { VDXF_UNI_VALUE_VERSION_CURRENT, VdxfUniValue } from "../../pbaas/VdxfUniValue";
import { DATA_TYPE_STRING, VERUSPAY_INVOICE_VDXF_KEY } from "../../vdxf";
import { Rating } from "../../pbaas/Rating";
import { CurrencyValueMap } from "../../pbaas";
import { CrossChainDataRef, CrossChainDataRefJson } from "../../pbaas/CrossChainDataRef";
import { SaltedData } from "../../pbaas/SaltedData";
import { SignatureData } from "../../pbaas/SignatureData";
import { MMRDescriptor } from "../../pbaas/MMRDescriptor";
import { URLRef, URLRefJson } from "../../pbaas/URLRef";
import { CrossChainProof } from "../../pbaas/CrossChainProof";
import * as VDXF_Data from '../../vdxf/vdxfdatakeys';
import { DataDescriptor } from "../../pbaas/DataDescriptor";

describe('Encodes and decodes VdxfUniValue', () => {
  test('encode/decode VdxfUniValue with string data', () => {
    const values = new Map();
    values.set(DATA_TYPE_STRING.vdxfid, "Test String 123454321");

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

  test('fail to encode/decode VdxfUniValue with unknown data', () => {
    const values = new Map();
    values.set(VERUSPAY_INVOICE_VDXF_KEY.vdxfid, Buffer.alloc(20));

    const v = new VdxfUniValue({
      values,
      version: VDXF_UNI_VALUE_VERSION_CURRENT
    });

    const vFromBuf = new VdxfUniValue();

    expect(() => vFromBuf.fromBuffer(v.toBuffer(), 0)).toThrowError();
  });

  // This test uses serialized data from the daemon adter putting in the Rating object into a contentmultimap.
  const multiMapwithRating = "979e0d9bc8c91be03c57bab5b45ddcf17fd5ca32011c0100000002011af5b8015c64d39ab44c60ead8317f9f5a9b6c4c0101"
  
  test('fail to encode/decode VdxfUniValue with unknown data', () => {
    
    const ratingMap = {"version":1, "trustlevel":2, "ratingsmap":{"i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV":"01"}}

    const jsonRating = Rating.fromJson(ratingMap);

    const v = new VdxfUniValue();
    v.fromBuffer(Buffer.from(multiMapwithRating, 'hex'));

    const extractedRating = v.values.get('iHJComZUXXGniLkDhjYprWYEN8qvQGDoam') as Rating;

    expect(jsonRating.toBuffer().toString('hex')).toBe(extractedRating.toBuffer().toString('hex'));
  });

  const multimapwithCurrencymap = "c98f1f7e5804ec1b180192f87125aefcc270db25011d011af5b8015c64d39ab44c60ead8317f9f5a9b6c4c00a0724e1809000000f478f668655"

  const multimapwithcrosschaindataref = "d6ae5ac0571b22d161261b87c748f6e0aee0334d011302011068747470733a2f2f76657275732e696f"

  const multimapwithsignaturedata = "2af2a488d317c76af6f764ec2c04009a9e358bb4019901a6ef9ea235635e328124ff3429db9f9e91b64e2d0120b793323968ea80de4df1fb78963cfb8b604b524f6a7c9069293085e076f44d5df478f668655e60f6b49e2424053166ba2cf2413901000000490205d65f00000141205e483e50265341623cd9a089baf4b913f969b5377d588044c09b7d239870d7f7205a4a4581f440db7d01049ebdfe95f5de7a6b07113f9c7f79dc6fd3da69f245"

  const multimapwithmmrdescriptor = "4382a62b73169697c3698d2f00bed6024c3a279701fd5402010501010549b00ad8606acbf5234700daa308a2c64c1f9466c11d47255a60f8ccf9c74ba82b994a03b9b0331bc6f1bf25bbc8b4453a130d65b6a9dc21f7589967e88e51d930682469b03873c54e7720d89d4a9333fe85519a447b886b6c6c8aabee6fb144e9742b76b745dbdfd83c9a0105808207c6db9c149dcaff5f502baf891642e67e7e303c0ba8130f2bff76d8247929bc7ce55fdf66bac03ea808006dc5e71aa12deaff355985c7770ee7a534d9cea2bfc10851ed5c91467083ffb1f746161f5d567b4be5c98d72300e1762697d5f62067d819ac0b35ac2c712c6e8e04cefaecaf759f38f4fa3ff4d3fc4d1dccbb6b820230df92c25958999741329ed3dafc7825900807cbf6b02becc236ce573158a4f0201057c97c0b93faab9462670a5a13da88d9ca796db968ae9c9f1b88df67c564b73cb63f752248402844522efaa62e5b42ce816d0a9f44ca14efaf6f7fe47d916e77b54266c5cac39c6771e899ebda093c566d33bbf60b4a598ea45bf2f5fb1f0cd782baaf092a880a799e0771144a9e9422eec107e43d23ba9386bb46dde0920d7a908ddf6f4d6261d25c62ca086bb3f570b07d74a59256feed13d64d6fbadd201057bd1ce7cab498d9a87bbf3c8d5f255cf209e87adf01f407751959f2d49f23056597a51240e90d5f758adc92e819f77f698fe754c9ea350c213dbcbffdaeb6d9a55bbaf705af9a375c855e7a8ca486bc65b1bd24c35e13f437a7490ecaffeff0323e7508a6cc4e36c5414b4cd7d3125ffabfa3fe85a56e4f6e539925b20822d2b817613d5eb5daf4893afc57289d0081f8fe225c77e1e4839aa0822b9a5"

  test('deserialize currency map from vdxfuniValue', () => {
    const v = new VdxfUniValue();
    v.fromBuffer(Buffer.from(multimapwithCurrencymap, 'hex'));

    const currencyMap = v.values.get('iMrGhzkZq5fpWWSa1RambRySFPb7CuvKuX') as CurrencyValueMap;

    const jsonCurrencyMap = {"i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV":"10000000000000"};
    const currencyMapFromJson = CurrencyValueMap.fromJson(jsonCurrencyMap, true);

    expect(currencyMap.toBuffer().toString('hex')).toBe(currencyMapFromJson.toBuffer().toString('hex'));
  });

  test('deserialize crosschain data ref from vdxfuniValue', () => {
    const v = new VdxfUniValue();
    v.fromBuffer(Buffer.from(multimapwithcrosschaindataref, 'hex'));

    const crossChainDataRef = v.values.get('iP3euVSzNcXUrLNHnQnR9G6q8jeYuGSxgw') as CrossChainDataRef;

    const jsonCrossChainDataRef = {"version":"1", "url":"https://verus.io"};

    const crossChainDataRefFromJson = new CrossChainDataRef(URLRef.fromJson(jsonCrossChainDataRef));

    expect(crossChainDataRef.toBuffer().toString('hex')).toBe(crossChainDataRefFromJson.toBuffer().toString('hex'));
  });

  test('deserialize signature data from vdxfuniValue', () => {
    const v = new VdxfUniValue();
    v.fromBuffer(Buffer.from(multimapwithsignaturedata, 'hex'));

    const signatureData = v.values.get('i7PcVF9wwPtQ6p6jDtCVpohX65pTZuP2ah') as SignatureData;

    const jsonSignatureData = {
			"version": 1,
			"systemid": "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
			"hashtype": 1,
			"signaturehash": "5d4df476e085302969907c6a4f524b608bfb3c9678fbf14dde80ea68393293b7",
			"identityid": "iRmBDWNs2WahXDAvS2TEsJyJwwHXhwcs7w",
			"signaturetype": 1,
			"signature": "AgXWXwAAAUEgXkg+UCZTQWI82aCJuvS5E/lptTd9WIBEwJt9I5hw1/cgWkpFgfRA230BBJ69/pX13nprBxE/nH953G/T2mnyRQ=="
		  }
    const signatureDataFromJson = SignatureData.fromJson(jsonSignatureData);

    expect(signatureData.toBuffer().toString('hex')).toBe(signatureDataFromJson.toBuffer().toString('hex'));
  });

  test('deserialize mmr descriptor from vdxfuniValue', () => {
    const v = new VdxfUniValue();
    v.fromBuffer(Buffer.from(multimapwithmmrdescriptor, 'hex'));

    const mmrDescriptor = v.values.get('i9dVDb4LgfMYrZD1JBNP2uaso4bNAkT4Jr') as MMRDescriptor;

    const jsonMMRDescriptor ={
      "version": 1,
      "objecthashtype": 5,
      "mmrhashtype": 1,
      "mmrroot": {
          "version": 1,
          "flags": 5,
          "objectdata": "b00ad8606acbf5234700daa308a2c64c1f9466c11d47255a60f8ccf9c74ba82b994a03b9b0331bc6f1bf25bbc8b4453a130d65b6a9dc21f7589967e88e51d930682469b03873c54e77",
          "epk": "d89d4a9333fe85519a447b886b6c6c8aabee6fb144e9742b76b745dbdfd83c9a"
      },
      "mmrhashes": {
          "version": 1,
          "flags": 5,
          "objectdata": "8207c6db9c149dcaff5f502baf891642e67e7e303c0ba8130f2bff76d8247929bc7ce55fdf66bac03ea808006dc5e71aa12deaff355985c7770ee7a534d9cea2bfc10851ed5c91467083ffb1f746161f5d567b4be5c98d72300e1762697d5f62067d819ac0b35ac2c712c6e8e04cefaecaf759f38f4fa3ff4d3fc4d1dccbb6b8",
          "epk": "230df92c25958999741329ed3dafc7825900807cbf6b02becc236ce573158a4f"
      },
      "datadescriptors": [
          {
              "version": 1,
              "flags": 5,
              "objectdata": "97c0b93faab9462670a5a13da88d9ca796db968ae9c9f1b88df67c564b73cb63f752248402844522efaa62e5b42ce816d0a9f44ca14efaf6f7fe47d916e77b54266c5cac39c6771e899ebda093c566d33bbf60b4a598ea45bf2f5fb1f0cd782baaf092a880a799e0771144a9e9422eec107e43d23ba9386bb46dde09",
              "epk": "d7a908ddf6f4d6261d25c62ca086bb3f570b07d74a59256feed13d64d6fbadd2"
          },
          {
              "version": 1,
              "flags": 5,
              "objectdata": "d1ce7cab498d9a87bbf3c8d5f255cf209e87adf01f407751959f2d49f23056597a51240e90d5f758adc92e819f77f698fe754c9ea350c213dbcbffdaeb6d9a55bbaf705af9a375c855e7a8ca486bc65b1bd24c35e13f437a7490ecaffeff0323e7508a6cc4e36c5414b4cd7d3125ffabfa3fe85a56e4f6e539925b",
              "epk": "822d2b817613d5eb5daf4893afc57289d0081f8fe225c77e1e4839aa0822b9a5"
          }
      ]
  }
    const mmrDescriptorFromJson = MMRDescriptor.fromJson(jsonMMRDescriptor);

    expect(mmrDescriptor.toBuffer().toString('hex')).toBe(mmrDescriptorFromJson.toBuffer().toString('hex'));
  });

  test('deserialize salted data from vdxfuniValue', () => {
    const test = () => {


      const jsonob = {
        "version": 1,
        "chainobjects": [
          {
            "vdxftype": "i6ZGLNfqu4cQ3h98VHimETwnWtizMwCJw6",
            "value": {
              "version": 1,
              "hex": "01010108a2ebb2c55f83a8e2a426a53320ed4d42124f4da408a2ebb2c55f83a8e2a426a53320ed4d42124f4d018e01056ad69c87487592c161133433da3e3231483f63ef87888ca187baae4c5c078bf07ac69953b003076f5dccff0fcea0aa24d00ef79010efb4b4985dbf1d857439de6890604757529c94030042845b5e787ae2eeb7890ae9b16437c551bf273fc883012ff238f97b4c96a75087207482423ffa5f03d55e3bd941fd6f7f488584e12662c299d0a5d20c4069c5b51a"
            }
          }
        ]
      }


    
      const egg = CrossChainProof.fromJson(jsonob);

      if(egg.chainObjects[0].vdxfd == VDXF_Data.DataDescriptorKey.vdxfid){

        const data = new VdxfUniValue();
        data.fromBuffer(egg.chainObjects[0].dataVec);
        console.log(data.toJson());

      }

      console.log(egg.toJson());
    
    }
    
    test();
  });

  test('deserialize salted data from vdxfuniValue', () => {
    const test = () => {


      const jsonob = {"version":1,"chainobjects":[{"vdxftype":"i6ZGLNfqu4cQ3h98VHimETwnWtizMwCJw6","value":{"version":1,"hex":"0101020084fd6a00fd5c160103a6ef9ea235635e328124ff3429db9f9e91b64e2d0000000000000000000000000000000000000000000000000000000000000000000000000201000000010a0001010108a2ebb2c55f83a8e2a426a53320ed4d42124f4dfe0c7f010008a2ebb2c55f83a8e2a426a53320ed4d42124f4d01fef27e01000105feca7e0100cb2c409c407dc3145bbfdc1fee729e09fa1ab62e5446af090a5037c4d7a62a92e33ede028f18659e4903ded5ab9940d75a4208d43599170c0ce59c6b1d91223dd686879cb19c4393ae993566a810e3ec3f257198d3aaa8910afac629f106e05f17e2e39f2d4d19cc9fc9a0c8cce69f8628b935bc8cef45941e393ecfc565b37f9edfdeb557f6cee17826cb0ae7f1c887c15d2d056b65b0c50874cf3b245d9d46efe6f4dd7aee3d019525751e5cafdb4287e87fa35554cc40ac30de9667170d59a457742659c0b028073e61af9943dc8580880ca243b9a023001e4642f3aa8c7694a0a07b906166a39e8e4a91d37f73f7eb5c6a3db14946a53f84cd70edd9c4283625e1ddb44c64654d598bd457205081bc291c7aad8389c514557a85764bfc868bde6e6906b9bdc1cda13689d70f88ce5d04b74ed40852bdc73ba8004b48cb2b2439a99a85891a58ec8da8fbb66991795aa0081d46b354fe368e09f8076b313a3097ab9f598b5dc2a034ea6061efcede5b92d457ee4321f87b53b5f282fcd9f2598ccab59cb06d53ccc6cf904373a95cfd82b72bc0b41844f1565dd21025d29132ded1c9b1012b5d560333f932f79bbc23847eed75657e58c9e09f4f3e72356d5f4636ad2d82a34a5bc0017f87ec5fe79a6c0b2806a389ba3d97df75cd544ee872254fa0493d4afd88bc161be985cf61f6abe7efea2a87f0a8e6a8b13cc9e44727cd064d5f298bf304db02fe9585a25b696e1dc4c7b82eef232360394bffeab5c2b052e8d2e48795eb3bedf6a3e457a468bbed6accd75d4610c4b4ce7d20a72e9fb1a949078f6fc752539f202a308b2bbd89b5790a1ca72def5dc2f42ca619a383ab563e118cecd601e00ca7b796700f07da4e40e0ef204e88223c67e8336d272d0700e32275900041c712735f52b774d47472e7e7bdf66231fa77a0d8ad72e370acf2924433788f0958088e2b2eacec83c8aee44c260f6ef1057e1fef4ad22ed00c2cfef0a569b5868e211c06c5d6dcca2032d57586e85e65ca1de854fc803dda4a5812212aa1fe8581dd62fa62878122ded28641a7aa1533c7b6cf28345e6f7f788dfa74c25f2ef76f92ae08f280ac57f3ff74dd2984c24f9771260a8b1f8fa954b1e1012a1fb6fed408a7a3fbb560412d159ad7134f12f2fad2424602261ad0a3286247e6c65ff0e4593a35ee6030229b54d32b6277269f8691b5116fdf6ca99b12cb110259fd9f31e1bdd80de28d520d05f2586e58a26f3365aafaa04dfa597948b272a1104649908452d002161f4699998f58203f5b5cdeb5ca61851ca88e01914da9bc50ac622d4b8eace6b84f28f187329facd8983b3764135ba02902b05417905f9701a295d8ac33fcd973ca9bc97e83aedaef94156cfe4866b6d898c265a6c223dd43ae82e8134a40fa4216c56bc7a72e5c67933f4a2fb3996b64b20b7285f217df76391378b086127f09442de7a2233aa9112132c7947c34490ab04807c5338c5ffc00f7af401f96ea685e583c52168dcde2ff2b4cebe79c3b981ca9aed66faf9e69a867db2693b25420fe7acfd4efac0448feac38e69105cc61e2ddffb098f5be542cb191b4a6feb4f5dd34842270e41fccc7c21cd7dac4681948168bd47e04f1543068236a3e8a7728a2285e399acb20d0647ee32ea5490a42c539d0cb9edbb3b97976e65290240449ac567a34b73d920f9119e6066b63ce683bbd40f1fb9bccee4b08f39355947747d2625513bacc2b0a52ae8dea122e27d65381f4e055d529f70e96c44d8b837b6b50336827028ceb6db09af52503a7552d35798fe1b29161363fc007480a4cef4c385f365f245a954c9007325f017219abf697ed69e63b24c46630c1fe15ac9ad8ef0b8f2680b4ab49c8812dbee6994278d7f1d9312c2f9b3a0e078d2f9ec7b06aa9a71cf87305b7e4c2a2679746c4b606e846265f2265286fd4d6290dd3c1f008cfbe45d3abdbb4cceae5dbf403043f7a7602d4587553b283515892e953e225183aa4e74cb95a74a96b68ad7942ede6130b79096f72bced362b6edd02a7cab8a1b5bd263dfbf9baf2a6e551dae5a28ce056a7a20c610c6d9bb727ccb50f02d148d91258ca8ba1b4fa93bc25c0bc5f66d0b52699361ddd658a7a8a2338ec5bb976d78e299c7001ad929cb063265a992674e01dfd20416f21d6be5ecae9d6c332684f8f465954f9c1dc372d5bf15a424cdacbdd71c1633b53e42756c8ec5f8610ce822d401b69d9f85e8c48f2c8259ce6b3b656c25ef9850f36a234bd0aa5726b2be742e8fab09633f396c9b3858da7bcc8ee492f7b8c605ef3a40e20dcfb3f31a5a23eb15d79e6525564ef120630e6e81f692711bcd37c69e55737be56f37db6dba74da47221887195b5558d9d9fcfc63b35cf112c73df7e8030558887596024c74defa9c08c1a11855a31f1c2fff5f5592de5d0d66fc924a228adb0b4dba1bb05faa179d1614be639f71b8ce80019547baceda813288954a870bbd39abe9f5a757c1708dda20197f52f20ef107bca78b15d1bd310d461d721bf21892807880c02a5c062dd967cdc7605f41f26e9c2b67d9ba97957159fb09a023e66ced7f93abc2ec25a614203cf0659e8e42df645cc5bb0ea501835dab5d4c8c13265e8872d293f943cfffa013f642b972125fccd9f5d41cb3211b71e9185393dea88fa70af04bc3f00dff5b4bdc7451f1af7411e407b6145e06eff79e6cacaa7b0044082edd0b814a5ccab204facd0c5efe3a6a89fd55d1a37b999be99d4e3c086735234eea07fe6667d79e5bb4f4c69cdbe519dd8fbab891b100b8ab94d37ebbe5c1b33b624e50ca4bc66351cd33891f54660fb8c351a2030f6d8348f46dd9b39c600172a4f26ff281b2393dce8698c6de4f47317f3d8284e70423defdab6290dc533bbdfc5294a7c21df1a4f5b0ddcb13c2f2bfb30f89009593d0ebc2b84db396a1229a2e3e2c1e0580b8a93c66f46eb28a81a4db3f0d4ae0f1b070b4c5ed855ee3bf519cb164542d18d2694b12dc33af70aa3cabc88b55f26d1e096555683991df4a8d07dbf984b08ef8738b0d3817e6411255be440f2d9a3083141dcff86ba681a9eaf105670e3359ac0bc3f430aa7aee13dc89666ce1ce421a4881236cc9f224a660f04f281fcca132d21b0ce97e485f4d54dcefe73d404bb23afe2bd8f8b4784462a1bff8e70b46bd0afe4b39613384c8f80b019393e1f4fb6c5aea7fbd8f99b4dfcffd67f053dfe0162980eedda738f422353a1409b22ae02581e8f1630c3e24bffed51b10d9f3dce713af1ae175546bc53bd1a53972fff74d717891e20c7e2dedec2fa24eb6f926831c09e99527ee16fb9f792a5b066c18370608dbcd221b7287451b77a2dea90db73b1a5c1e74978627ce7adf1a69cb7fccc3e400e53a7b7ad0e0d60f42986933ae344e6c65f4f2e98a493cfd05e6e76320260890973edfc8b10d99b96dcdc9bb645d2d1e41dc739d041df2ac0f1d70ced8e170b9b8f12ec666393eb368cae554a0e0ad896cb0fd4fa43be077c3145d400d9acf893e1de2dc1b9ac53785b62a39c63482e49f5b0ea4f3306f2bcd6893749b5a9429bd60b5606ae5ae37f8e72bc78733a84b48a9a96196d6e3bb045d21fbe6fe86154eea8f91c6bed9120277a2022163c43cb4329c5827d084ec42b93236efda560a6633353b6c1b3c8f918d8c02ffa4016d5faca92bb892f349f144c5cc4f07fcbba9a225b4027a3e0f29a0c100c512cf69d5461f18063fab76d5bab9e0f62c7d2d7556715abe861f80e714ae156d114ad3b10cd861f6ff1c1c03ef0d662bd9d1971cd2b6104c30bdcee70a83a86a64d6f891dc5a84ebbd96b9466eebdbbab5751e04af942a37ee5d8a2330ae2c902e4c6e2795801d0197d7a5c1a3c86af8786e1784832cf90fb8cad13d4f93ec51b6844cdd4a46e08bef89b5004ac15cf7c80828a029b3705ba797214abd9386d01d3a4a459af169a61d2d96c005382cd40a2a43d9c8b3d30fd1b6116e42f80b5187cd6372b04084993b8356654f73ef9d377ebc0de3cb90910c784b8208e8d54a859f106171df0f8a2799d3de804f9e5bc93bd1051dd0bb30cc0d03b2db7b6ade7649ed7dd883f886f2cdd3b6834368ef7805f0948ab550c68d93ce29f6bfbb1b6f503e73d48c1c0df34e03340b24a2af66307b42480a2182e0216c09c66e23f36da2bc88c57be62e93ff48c6160f20e77a8376ea765d1f5f9a2740b14637e5e09c589ab9fd56f084a9884ad234f179e5cbb8ce06026408770e5122fa78410686b854398877f1d3c6adb9af564fb1e25cbececc9242407153c3e2bd4b20a6d0b1389ea7e022ce0562254cb977140912f5501c87fb15621ee8a058e7d3eaaa643b7d70bc17533bbd324a6813291efe5c24785d08e9aa7f10e363132dba9725694ab015d24acbfa7d2e5a401940ad85b4c7b39399798283da4338c3c008c7050f75f3bf2487140ee8852e3dd917aff73ccf82388d5beb5f3aa7e1aad4a14354889dea3220b3aef3c7bc0319cf161c78a68a550d030ca787860ec5507b213ed3d949d25bbe573ff92e668f1bafe4da845446637fa6894becfd7273c4864f09c4e0bdecb68f09d08bdfdbc56198929764b514d6466588693f8a5684bcc9e7df90970acf2c35c3d8d2079bf489f5ccea6fb8dcbbc45036e67e90a7976b3847ec6fb0d0c052747dc925cd18fdc571702c240f7fbab6b439a83715f1c1388991bf768caf049795430c9100bb364086b8616d8485e089ae627d7015c107286a78ae7f19595a8d486c8c28a906b2f5fbe6d9cc938c02467d0c52892b9512eb2fb6d37316374c2098b914d2c8655433892110a13e14f64e1ba76c5bc28663e8c39e790317c2c0e2b4e0a2e23128aa9adff3bacf173a50de7884328961c782d5ac439075dd7f74ac34066c635986bcdaa73c98cfecf90011f7d8d5d528790a7aece352bbdc7ca642d14092182a4d794ab132779c0eef59010cec9212bd214d3b22c9da443ec11958fcf4f9bb79ab8c5c95c45ca61a658224aca9c3e0476b01c257c330c2ad3292a5f0e63f76b4bee4d627cc48d2a7a0bb8908839973de23751d7230d5d5eb7d5411d989bfde4b557e435dadbd675117c0e5ee9aea6d765bfa70f3b9ac7fcaea2b89299b6271265cfb106971cdd0dc0e82f73a1187156db9ea8acc321e70cf61c4a92949aaea8aa0496bf3494f2f70d27615642dcf50888ccef5a92269567369642eec0aa333883d076c7320e14036fdd95c3c0d472fa08daac5fa7ab52fc3c740a089df3e7f98e4eee0d84c81337ca8ee55bbf43d15bb41c7603bd5dab9e24e0c42b66ebc0970c2dca4e3374a0fead14c8810db70b4a16583a7669f26e98ec7ad6460fd91f3699437dc2aabb3cba8f2498e702fc0aafd06de4884ea53a2b25ab781d68c870d442439b28415eede77fd008c359b0b77b3f94ea9a723c49642c9fbc1984799f429468eefbbca9f66bf8e689fcdb20e13067b14dda08ddd42e519f6f5dc7dcb980d9b942c72fc1d12cffa3bc528005a64165be53f4c89a88d52644c773138404ee092d6d4f0ff919aa78cb174d5d2aaca1f9254d5276e794aad9c13c86dea440a95ec1a40305768067f52b9feee5f9625208f1a0cad2c0b629f7ac96371c1b7fc60556fc1230dee7557a006c6311327dfb704e5958b7a1b1653cc8ded4bf97002b4e5724378af5baf96b3d5b0ef551ab568a93334546661ae05a5df9b5f3738666ecb218c875aed51d7235422625bfb987d801ba511f1b2e0b3687acf9b196355a655f308f67a5452f79eca96da89ed4a73f9cd8a0439fcbe98354e77fc52d0955e8e61f67d407c9863db1fd100272696e9d7da6e6ee6e9d6d929fd8bb5d5cd28f14a71f32e905d6f8d30d97971034792c0d9975cbafacd2537ba8c5121ecc432aeb016beb67b224e0d2bb36d7a7eec870e71f367f448e503f24f9f8e22a4264dc1d9df419c6bbd6da933c0ec2d5a55eff50ee554c7a0f78d126b524d7443f9adeb866ec9f15aa5585563e37faaa447a74d09691d487dc246c403274a8df5e449aca59c65c7432ac22b16cbba3655ca609da4eb1e265199978d525dbd6e54dc527fdba850b1c1a58f69832eca549b0ba95837b3e1076230c0a721a746e20aed5d5ab43d72ec0e0d0bc285cef9e4383834bf9b1a3dc260e7c41c97b587f55eed496acd718cd7098cc73be488c7cc36f12ffb79fc91eb507afe07a479ff719fb300637f4e935ec57316be1d86653f74dd2bd2dd38648444f51f4f599951f1fece92f16646bcec7442ef8a5cc867fca3133017d1ff326e2ee86289a9053bf72b13b5a82aa6d3e6a68c27221747eb34aa6d3b69d51f69f5d1e04644654e5de2f62232d1aba7671c1618044923c33ef3917a23724a9a76b7268db70a653a7caa6628f88bb40d4db9e13ac9407f7b04b16c8e81b94cfeab2f1d0aa8cfb30dcda302f16b2155e5bd38731ff2a8ec9ab01b00369565e06af4fc3f1df13af2b39d86030ea851bffce731fb66ef39b3faca33c91ddfcc98e730ec4cc11e7528cc480fd8b3368685ccbe502019d96fe12bde7803dd89c66745fd570242efd3523a0ff54a93fd96ebbb63841f01f91772ddc8cfef68f255be25ddff6710357502c95ece9160600f6d642f2dd963bd13e15b621475b0314328050d6431a10e27a3bb3dd916bee5f9bec5886c6c6730c8c4be1f678f49c17229d23235a8181c86bd6376c8c81b6283c059efa3d4db27161b4ff409d00a39de77c801f456d5bfe48527c9824cc2e4deb07432b49b47162ff81dbc88cb4dbd1a5a8ff9d21e3f4f6ee746219054f783d04686c66b037716765a67c11880297b9094b971d65d4a838eb4014b08c5429be595e19dc9b446f9a3fb410a33c8619c4574bb4f738029a84a07d2ad5f314ece9ed4aaee70e106b52303ebab5e007b6854bcd7715c0759a86db2daf51e9ec5771bc225adb5052f900d5d785c67f85be14a5c717e1c1d0d5599eee5baa97a35ee9eb7b117f0400842a495a73fa38a1c0a151faa89db3049ad40d9b0186c875aa3d04ff3eb379cb5f1e582a5d426679258b06949144d6a2f500fdefcb0dc8051c4d41a8453477830b89cf30614c5e7115255a3ed04eccaf4a3ece21c07c54021ae0078a00d9d39a2b788aa67018181a95522f35c61081f0985bea35819d113aa32a2e555ee9161c7175ee062ee0d064f9a11f848233b763977d728864d1186bf36a9b053254979fc9f1c7f20eac274b539c2dff5e2dd2e7c0d9b875f11587759f9742c1e531aff68d1a053f1562ca4a4eb96527f810d2697dc453585fa255d96cf4f86a15268f3e144b1b78928f3aeab89e7f466f248d4637f551add96512c2b65f449e5c7ea628106cb0e6de27f7b52e101f60ea5182b8ff7f45fa0c7947f8bb5cd1e3dd318dd0756bcefef4e4484917e3ab1a42277b047abaed73671761b0b6c5fa675bf85ff3e117fbd7b13e06052b06db23d87e74e8462419f9c13817f97921dbe19be9cfad8e84f54a9fe6e654aafecad8509060b7e96679e5921f4435b3581f7a6ae0dfd0820eaf04f896a683a0d6763411e0159339d6cf0dc5eb48542f824c0352b2354a891219d7d65fec295922664bc664f4484cbbd46a79b8ef5b06df2f906b842a6faba12ee15ef4bfc746393b325867b406401026239bccdc83e50d7738fbf03deab030680091cde2c457813d40c17f3fa2dd905fcf3f06dcd285001f2b1e7605f9b19d83e121514134acc46f82e91597e52e7d7d76c6f949f3341762ae4f29ab074b690a4b71ddfd2a7576b587fb1fd4b31db9e73bce34660a4aeaec8eecb0108c1d84b8e3364a0245299484d7b291fac81fa6c0442191936c07d03f3582fcc34f32a00c3125e3a0f6e0ec5cfac10829ca4d30c131f8bb5e008a6810"}}]}
    
      const egg = CrossChainProof.fromJson(jsonob);

      if(egg. chainObjects[0].vdxfd == VDXF_Data.DataDescriptorKey.vdxfid){

        const data = new VdxfUniValue();
        data.fromBuffer(egg.chainObjects[0].dataVec);
       // console.log(data.toJson());

      }

    //  console.log(JSON.stringify(egg.toJson()));
    
    }
    
    test();
  });


});