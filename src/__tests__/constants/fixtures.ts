import { BN } from "bn.js"
import { ContentMultiMap, IDENTITY_VERSION_PBAAS, IdentityID, KeyID, SaplingPaymentAddress } from "../../pbaas"
import { PartialIdentity } from "../../pbaas/PartialIdentity"
import { PartialMMRData } from "../../pbaas/PartialMMRData"
import { PartialSignData, PartialSignDataInitData } from "../../pbaas/PartialSignData"
import { DATA_TYPE_MMRDATA } from "../../constants/pbaas"
import { CompactIAddressObject } from "../../vdxf/classes"

export const manyContentMultimapData = {
  "iGdWifeNFcN69JiFwmcZTYT1zPYpFumGhq": [
    // String
    {
      "iK7a5JNJnbeuYWVHCDRpJosj3irGJ5Qa8c": "Test String 123454321"
    },
    // Byte Vector
    {
      "iKMhRLX1JHQihVZx2t2pAWW2uzmK6AzwW3": "3cc8db378593b7a6d32883a3948bb1d0"
    },
    // Currency Value Map
    {
      "iMrGhzkZq5fpWWSa1RambRySFPb7CuvKuX": {
        "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq": "1.12345",
        "iFawzbS99RqGs7J2TNxME1TmmayBGuRkA2": "100000000"
      }
    },
    // Rating
    {
      "iHJComZUXXGniLkDhjYprWYEN8qvQGDoam": {
        "version": 1,
        "trustlevel": 2,
        "ratingsmap": {
          "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq": "3cc8db378593b7a6d32883a3948bb1d0",
          "i8jHXEEYEQ7KEoYe6eKXBib8cUBZ6vjWSd": "3428665f7b02feb976dd53394b1518893428665f7b02feb976dd53394b151889"
        }
      }
    },
    // Transfer Destination
    {
      "i91L6zwZQrkbNVMB1AZ1Z671qybexRmeVK": {
        "address": "RWCqoWfSKaDoGeiwD6ZxX2dwkMx2oHJM56",
        "auxdests": [
          {
            "address": "iJitWFN8PY37GrBVtF38HyftG8WohWipbL",
            "type": 4
          }
        ],
        "type": 66
      }
    },
    // Content Multi Map Remove
    {
      "i5Zkx5Z7tEfh42xtKfwbJ5LgEWE9rEgpFY": {
        "version": 1,
        "action": 1,
        "entrykey": "iFawzbS99RqGs7J2TNxME1TmmayBGuRkA2",
        "valuehash": "6121b03740b55731afc11d6df70fb2358ab2200a4ba0e75ad1d79fd037314311"
      }
    },
    {
      "i5Zkx5Z7tEfh42xtKfwbJ5LgEWE9rEgpFY": {
        "version": 1,
        "action": 2,
        "entrykey": "iFawzbS99RqGs7J2TNxME1TmmayBGuRkA2",
        "valuehash": "6121b03740b55731afc11d6df70fb2358ab2200a4ba0e75ad1d79fd037314311"
      }
    },
    {
      "i5Zkx5Z7tEfh42xtKfwbJ5LgEWE9rEgpFY": {
        "version": 1,
        "action": 3,
        "entrykey": "iFawzbS99RqGs7J2TNxME1TmmayBGuRkA2"
      }
    },
    {
      "i5Zkx5Z7tEfh42xtKfwbJ5LgEWE9rEgpFY": {
        "version": 1,
        "action": 4
      }
    },
    // Cross Chain Data Reference (type Identity Multimap Reference)
    {
      "iP3euVSzNcXUrLNHnQnR9G6q8jeYuGSxgw": {
        "type": 1,
        "version": 1,
        "flags": 7,
        "vdxfkey": "iGdWifeNFcN69JiFwmcZTYT1zPYpFumGhq",
        "startheight": 1000,
        "endheight": 5000000,
        "datahash": "e4231634a6478dcbdcb5111411ee481bbdc1112e4e6216e32f37741f9ba31600",
        "systemid": "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
        "identityid": "i91L6zwZQrkbNVMB1AZ1Z671qybexRmeVK"
      }
    },
    // Encrypted data in a data descriptor (reference to other data)
    {
      "i4GC1YGEVD21afWudGoFJVdnfjJ5XWnCQv": {
        "version": 1,
        "flags": 13,
        "objectdata": "645f601c64bb1df7dc62732869e0e74590a33d3132035d0a1475425ee8d674c67c3649de6e0882296bd238ea6d7f6b730eac708424a1b9bff64e4610c5483a178f5bbc17ca65eea19e36246d8564523bd43b37c5fa168cc216a83332bb1d784d4620e73c54585c81",
        "epk": "7654be28752898669fb4aa5b0a8cfed358ebb0c7755879afa1daf5474335f58c",
        "ivk": "cfe44d214ba3ecc2942dd3df2d0486c788c3ec0bb7415811ba8a0074088d1406"
      }
    },
    // MMR Descriptor
    {
      "i9dVDb4LgfMYrZD1JBNP2uaso4bNAkT4Jr": {
        "version": 1,
        "objecthashtype": 5,
        "mmrhashtype": 5,
        "mmrroot": {
          "version": 1,
          "flags": 0,
          "objectdata": "3e9ebbf6c7cc1cffde3d8fe5c62d2919e1bf6eb99ed9d5dfb305bba71b6c9f1373b50267b0bb2c08d99ea76b09430018125a9748486650995dc1831701b90e82a394ea99fa2770c68bcecd484732a07dab3aac72751593b321c3e6c9273adb0309b9fc5917e74399"
        },
        "mmrhashes": {
          "version": 1,
          "flags": 0,
          "objectdata": "ba128a8ec42f1541895d1cefcae1b452543dce5653ae71d9c6e56c316833ba15f8d7d977878aadef2e42894e68c25ddd4d96bed0d257ba8e000b009946702ffa9e64e6cdb3fa8d81522ba39da177b050fef0ba89884c4f0e084de007df3d5ef7f410e5d9f388a716"
        },
        "datadescriptors": [{
          "version": 1,
          "flags": 0,
          "objectdata": "544338da640c2a9ed9d646be434a044c6a03c29c875f0ae93fbd3a59433f260027d97b5d8e569b37a906db1789e9c2280744b4ae7d90959c12f3b617a07024ab96b08db8e9606c6cd8b5929518c3057bdecae9859d41c953a7def5af72f297efc9e0b181719fed34"
        },
        {
          "version": 1,
          "flags": 0,
          "objectdata": "07809896a9c50e7396f01a12b3bf7ed4006962840e95c646290d9e1731b9705b2fd867fd781aecaa0e34b13beeefdea3f924b67d87c189f9c1dc662ef58ac59dc93d360e97f86d65a03304141f68a66a84af74884c35df54a856db003e8afd10d3db89f722d48689"
        }]
      }
    },
    // Signature Data
    {
      "i7PcVF9wwPtQ6p6jDtCVpohX65pTZuP2ah": {
        "version": 1,
        "systemid": "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
        "hashtype": 5,
        "signaturehash": "ad35af52bb6931b5c87a56007ccef84c524cecd55a1abdcf6657742c317de3e2",
        "identityid": "iGdWifeNFcN69JiFwmcZTYT1zPYpFumGhq",
        "signaturetype": 1,
        "signature": "AS9bCAABQSDInfy9XdqKvFLDcZiwGf4ZTzUZbG/AHiF8se5OfrBTLFT202GOr7BQ7D3U05myRkvK4P6lY/UG45OXHVYEhQqB",
        "vdxfkeys": ["iG89yjgnQEqSVv3dShPHpTUkCtJt96gzVU"],
        "vdxfkeynames": ["iG89yjgnQEqSVv3dShPHpTUkCtJt96gzVU"], //TODO: fix this as is should be "vrsc::identity.provisioning.states.complete"
        "boundhashes": ["ad35af52bb6931b5c87a56007ccef84c524cecd55a1abdcf6657742c317de3e2"]
      }
    },

    // Cross Chain Data Reference (type PBaaSEvidenceRef)
    {
      "iP3euVSzNcXUrLNHnQnR9G6q8jeYuGSxgw": {
        "type": 0,
        "version": 1,
        "flags": 3,
        "output": {
          "txid": "e4231634a6478dcbdcb5111411ee481bbdc1112e4e6216e32f37741f9ba31600",
          "voutnum": 1
        },
        "objectnum": 1,
        "subobject": 1,
        "systemid": "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq"
      }
    },

    // Cross Chain Data Reference (type URLRef)

    {
      "iP3euVSzNcXUrLNHnQnR9G6q8jeYuGSxgw": {
        "type": 2,
        "version": 2,
        "flags": 0,
        "url": "https://verus.io",
        "datahash": ""
      }
    },

    // credential
    {
      "iDTG49YLqmkHMYRyuQBYgEyTByQwAzqGd6": {
        "version": 1,
        "flags": 1,
        "credentialkey": "i3esdByX2PKx5vJiuNrRb61KAKqsBEMxac",
        "credential": { name: "Test Account" },
        "scopes": { address: "Test Address" },
        "label": "Label 1"
      }
    }
  ]
}

export const jsonSignatureData = {
  "version": 1,
  "systemid": "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
  "hashtype": 1,
  "signaturehash": "5d4df476e085302969907c6a4f524b608bfb3c9678fbf14dde80ea68393293b7",
  "identityid": "iRmBDWNs2WahXDAvS2TEsJyJwwHXhwcs7w",
  "signaturetype": 1,
  "signature": "AgXWXwAAAUEgXkg+UCZTQWI82aCJuvS5E/lptTd9WIBEwJt9I5hw1/cgWkpFgfRA230BBJ69/pX13nprBxE/nH953G/T2mnyRQ=="
}

export const jsonMMRDescriptor = {
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
export const chainobjectsjsonobj = {
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

export const CrossChainProofjsonob = {
  "version": 1,
  "chainobjects": [
    {
      "vdxftype": "i6ZGLNfqu4cQ3h98VHimETwnWtizMwCJw6",
      "value": {
        "version": 1,
        "hex": "0101020084fd6a00fd5c160103a6ef9ea235635e328124ff3429db9f9e91b64e2d0000000000000000000000000000000000000000000000000000000000000000000000000201000000010a0001010108a2ebb2c55f83a8e2a426a53320ed4d42124f4dfe0c7f010008a2ebb2c55f83a8e2a426a53320ed4d42124f4d01fef27e01000105feca7e0100cb2c409c407dc3145bbfdc1fee729e09fa1ab62e5446af090a5037c4d7a62a92e33ede028f18659e4903ded5ab9940d75a4208d43599170c0ce59c6b1d91223dd686879cb19c4393ae993566a810e3ec3f257198d3aaa8910afac629f106e05f17e2e39f2d4d19cc9fc9a0c8cce69f8628b935bc8cef45941e393ecfc565b37f9edfdeb557f6cee17826cb0ae7f1c887c15d2d056b65b0c50874cf3b245d9d46efe6f4dd7aee3d019525751e5cafdb4287e87fa35554cc40ac30de9667170d59a457742659c0b028073e61af9943dc8580880ca243b9a023001e4642f3aa8c7694a0a07b906166a39e8e4a91d37f73f7eb5c6a3db14946a53f84cd70edd9c4283625e1ddb44c64654d598bd457205081bc291c7aad8389c514557a85764bfc868bde6e6906b9bdc1cda13689d70f88ce5d04b74ed40852bdc73ba8004b48cb2b2439a99a85891a58ec8da8fbb66991795aa0081d46b354fe368e09f8076b313a3097ab9f598b5dc2a034ea6061efcede5b92d457ee4321f87b53b5f282fcd9f2598ccab59cb06d53ccc6cf904373a95cfd82b72bc0b41844f1565dd21025d29132ded1c9b1012b5d560333f932f79bbc23847eed75657e58c9e09f4f3e72356d5f4636ad2d82a34a5bc0017f87ec5fe79a6c0b2806a389ba3d97df75cd544ee872254fa0493d4afd88bc161be985cf61f6abe7efea2a87f0a8e6a8b13cc9e44727cd064d5f298bf304db02fe9585a25b696e1dc4c7b82eef232360394bffeab5c2b052e8d2e48795eb3bedf6a3e457a468bbed6accd75d4610c4b4ce7d20a72e9fb1a949078f6fc752539f202a308b2bbd89b5790a1ca72def5dc2f42ca619a383ab563e118cecd601e00ca7b796700f07da4e40e0ef204e88223c67e8336d272d0700e32275900041c712735f52b774d47472e7e7bdf66231fa77a0d8ad72e370acf2924433788f0958088e2b2eacec83c8aee44c260f6ef1057e1fef4ad22ed00c2cfef0a569b5868e211c06c5d6dcca2032d57586e85e65ca1de854fc803dda4a5812212aa1fe8581dd62fa62878122ded28641a7aa1533c7b6cf28345e6f7f788dfa74c25f2ef76f92ae08f280ac57f3ff74dd2984c24f9771260a8b1f8fa954b1e1012a1fb6fed408a7a3fbb560412d159ad7134f12f2fad2424602261ad0a3286247e6c65ff0e4593a35ee6030229b54d32b6277269f8691b5116fdf6ca99b12cb110259fd9f31e1bdd80de28d520d05f2586e58a26f3365aafaa04dfa597948b272a1104649908452d002161f4699998f58203f5b5cdeb5ca61851ca88e01914da9bc50ac622d4b8eace6b84f28f187329facd8983b3764135ba02902b05417905f9701a295d8ac33fcd973ca9bc97e83aedaef94156cfe4866b6d898c265a6c223dd43ae82e8134a40fa4216c56bc7a72e5c67933f4a2fb3996b64b20b7285f217df76391378b086127f09442de7a2233aa9112132c7947c34490ab04807c5338c5ffc00f7af401f96ea685e583c52168dcde2ff2b4cebe79c3b981ca9aed66faf9e69a867db2693b25420fe7acfd4efac0448feac38e69105cc61e2ddffb098f5be542cb191b4a6feb4f5dd34842270e41fccc7c21cd7dac4681948168bd47e04f1543068236a3e8a7728a2285e399acb20d0647ee32ea5490a42c539d0cb9edbb3b97976e65290240449ac567a34b73d920f9119e6066b63ce683bbd40f1fb9bccee4b08f39355947747d2625513bacc2b0a52ae8dea122e27d65381f4e055d529f70e96c44d8b837b6b50336827028ceb6db09af52503a7552d35798fe1b29161363fc007480a4cef4c385f365f245a954c9007325f017219abf697ed69e63b24c46630c1fe15ac9ad8ef0b8f2680b4ab49c8812dbee6994278d7f1d9312c2f9b3a0e078d2f9ec7b06aa9a71cf87305b7e4c2a2679746c4b606e846265f2265286fd4d6290dd3c1f008cfbe45d3abdbb4cceae5dbf403043f7a7602d4587553b283515892e953e225183aa4e74cb95a74a96b68ad7942ede6130b79096f72bced362b6edd02a7cab8a1b5bd263dfbf9baf2a6e551dae5a28ce056a7a20c610c6d9bb727ccb50f02d148d91258ca8ba1b4fa93bc25c0bc5f66d0b52699361ddd658a7a8a2338ec5bb976d78e299c7001ad929cb063265a992674e01dfd20416f21d6be5ecae9d6c332684f8f465954f9c1dc372d5bf15a424cdacbdd71c1633b53e42756c8ec5f8610ce822d401b69d9f85e8c48f2c8259ce6b3b656c25ef9850f36a234bd0aa5726b2be742e8fab09633f396c9b3858da7bcc8ee492f7b8c605ef3a40e20dcfb3f31a5a23eb15d79e6525564ef120630e6e81f692711bcd37c69e55737be56f37db6dba74da47221887195b5558d9d9fcfc63b35cf112c73df7e8030558887596024c74defa9c08c1a11855a31f1c2fff5f5592de5d0d66fc924a228adb0b4dba1bb05faa179d1614be639f71b8ce80019547baceda813288954a870bbd39abe9f5a757c1708dda20197f52f20ef107bca78b15d1bd310d461d721bf21892807880c02a5c062dd967cdc7605f41f26e9c2b67d9ba97957159fb09a023e66ced7f93abc2ec25a614203cf0659e8e42df645cc5bb0ea501835dab5d4c8c13265e8872d293f943cfffa013f642b972125fccd9f5d41cb3211b71e9185393dea88fa70af04bc3f00dff5b4bdc7451f1af7411e407b6145e06eff79e6cacaa7b0044082edd0b814a5ccab204facd0c5efe3a6a89fd55d1a37b999be99d4e3c086735234eea07fe6667d79e5bb4f4c69cdbe519dd8fbab891b100b8ab94d37ebbe5c1b33b624e50ca4bc66351cd33891f54660fb8c351a2030f6d8348f46dd9b39c600172a4f26ff281b2393dce8698c6de4f47317f3d8284e70423defdab6290dc533bbdfc5294a7c21df1a4f5b0ddcb13c2f2bfb30f89009593d0ebc2b84db396a1229a2e3e2c1e0580b8a93c66f46eb28a81a4db3f0d4ae0f1b070b4c5ed855ee3bf519cb164542d18d2694b12dc33af70aa3cabc88b55f26d1e096555683991df4a8d07dbf984b08ef8738b0d3817e6411255be440f2d9a3083141dcff86ba681a9eaf105670e3359ac0bc3f430aa7aee13dc89666ce1ce421a4881236cc9f224a660f04f281fcca132d21b0ce97e485f4d54dcefe73d404bb23afe2bd8f8b4784462a1bff8e70b46bd0afe4b39613384c8f80b019393e1f4fb6c5aea7fbd8f99b4dfcffd67f053dfe0162980eedda738f422353a1409b22ae02581e8f1630c3e24bffed51b10d9f3dce713af1ae175546bc53bd1a53972fff74d717891e20c7e2dedec2fa24eb6f926831c09e99527ee16fb9f792a5b066c18370608dbcd221b7287451b77a2dea90db73b1a5c1e74978627ce7adf1a69cb7fccc3e400e53a7b7ad0e0d60f42986933ae344e6c65f4f2e98a493cfd05e6e76320260890973edfc8b10d99b96dcdc9bb645d2d1e41dc739d041df2ac0f1d70ced8e170b9b8f12ec666393eb368cae554a0e0ad896cb0fd4fa43be077c3145d400d9acf893e1de2dc1b9ac53785b62a39c63482e49f5b0ea4f3306f2bcd6893749b5a9429bd60b5606ae5ae37f8e72bc78733a84b48a9a96196d6e3bb045d21fbe6fe86154eea8f91c6bed9120277a2022163c43cb4329c5827d084ec42b93236efda560a6633353b6c1b3c8f918d8c02ffa4016d5faca92bb892f349f144c5cc4f07fcbba9a225b4027a3e0f29a0c100c512cf69d5461f18063fab76d5bab9e0f62c7d2d7556715abe861f80e714ae156d114ad3b10cd861f6ff1c1c03ef0d662bd9d1971cd2b6104c30bdcee70a83a86a64d6f891dc5a84ebbd96b9466eebdbbab5751e04af942a37ee5d8a2330ae2c902e4c6e2795801d0197d7a5c1a3c86af8786e1784832cf90fb8cad13d4f93ec51b6844cdd4a46e08bef89b5004ac15cf7c80828a029b3705ba797214abd9386d01d3a4a459af169a61d2d96c005382cd40a2a43d9c8b3d30fd1b6116e42f80b5187cd6372b04084993b8356654f73ef9d377ebc0de3cb90910c784b8208e8d54a859f106171df0f8a2799d3de804f9e5bc93bd1051dd0bb30cc0d03b2db7b6ade7649ed7dd883f886f2cdd3b6834368ef7805f0948ab550c68d93ce29f6bfbb1b6f503e73d48c1c0df34e03340b24a2af66307b42480a2182e0216c09c66e23f36da2bc88c57be62e93ff48c6160f20e77a8376ea765d1f5f9a2740b14637e5e09c589ab9fd56f084a9884ad234f179e5cbb8ce06026408770e5122fa78410686b854398877f1d3c6adb9af564fb1e25cbececc9242407153c3e2bd4b20a6d0b1389ea7e022ce0562254cb977140912f5501c87fb15621ee8a058e7d3eaaa643b7d70bc17533bbd324a6813291efe5c24785d08e9aa7f10e363132dba9725694ab015d24acbfa7d2e5a401940ad85b4c7b39399798283da4338c3c008c7050f75f3bf2487140ee8852e3dd917aff73ccf82388d5beb5f3aa7e1aad4a14354889dea3220b3aef3c7bc0319cf161c78a68a550d030ca787860ec5507b213ed3d949d25bbe573ff92e668f1bafe4da845446637fa6894becfd7273c4864f09c4e0bdecb68f09d08bdfdbc56198929764b514d6466588693f8a5684bcc9e7df90970acf2c35c3d8d2079bf489f5ccea6fb8dcbbc45036e67e90a7976b3847ec6fb0d0c052747dc925cd18fdc571702c240f7fbab6b439a83715f1c1388991bf768caf049795430c9100bb364086b8616d8485e089ae627d7015c107286a78ae7f19595a8d486c8c28a906b2f5fbe6d9cc938c02467d0c52892b9512eb2fb6d37316374c2098b914d2c8655433892110a13e14f64e1ba76c5bc28663e8c39e790317c2c0e2b4e0a2e23128aa9adff3bacf173a50de7884328961c782d5ac439075dd7f74ac34066c635986bcdaa73c98cfecf90011f7d8d5d528790a7aece352bbdc7ca642d14092182a4d794ab132779c0eef59010cec9212bd214d3b22c9da443ec11958fcf4f9bb79ab8c5c95c45ca61a658224aca9c3e0476b01c257c330c2ad3292a5f0e63f76b4bee4d627cc48d2a7a0bb8908839973de23751d7230d5d5eb7d5411d989bfde4b557e435dadbd675117c0e5ee9aea6d765bfa70f3b9ac7fcaea2b89299b6271265cfb106971cdd0dc0e82f73a1187156db9ea8acc321e70cf61c4a92949aaea8aa0496bf3494f2f70d27615642dcf50888ccef5a92269567369642eec0aa333883d076c7320e14036fdd95c3c0d472fa08daac5fa7ab52fc3c740a089df3e7f98e4eee0d84c81337ca8ee55bbf43d15bb41c7603bd5dab9e24e0c42b66ebc0970c2dca4e3374a0fead14c8810db70b4a16583a7669f26e98ec7ad6460fd91f3699437dc2aabb3cba8f2498e702fc0aafd06de4884ea53a2b25ab781d68c870d442439b28415eede77fd008c359b0b77b3f94ea9a723c49642c9fbc1984799f429468eefbbca9f66bf8e689fcdb20e13067b14dda08ddd42e519f6f5dc7dcb980d9b942c72fc1d12cffa3bc528005a64165be53f4c89a88d52644c773138404ee092d6d4f0ff919aa78cb174d5d2aaca1f9254d5276e794aad9c13c86dea440a95ec1a40305768067f52b9feee5f9625208f1a0cad2c0b629f7ac96371c1b7fc60556fc1230dee7557a006c6311327dfb704e5958b7a1b1653cc8ded4bf97002b4e5724378af5baf96b3d5b0ef551ab568a93334546661ae05a5df9b5f3738666ecb218c875aed51d7235422625bfb987d801ba511f1b2e0b3687acf9b196355a655f308f67a5452f79eca96da89ed4a73f9cd8a0439fcbe98354e77fc52d0955e8e61f67d407c9863db1fd100272696e9d7da6e6ee6e9d6d929fd8bb5d5cd28f14a71f32e905d6f8d30d97971034792c0d9975cbafacd2537ba8c5121ecc432aeb016beb67b224e0d2bb36d7a7eec870e71f367f448e503f24f9f8e22a4264dc1d9df419c6bbd6da933c0ec2d5a55eff50ee554c7a0f78d126b524d7443f9adeb866ec9f15aa5585563e37faaa447a74d09691d487dc246c403274a8df5e449aca59c65c7432ac22b16cbba3655ca609da4eb1e265199978d525dbd6e54dc527fdba850b1c1a58f69832eca549b0ba95837b3e1076230c0a721a746e20aed5d5ab43d72ec0e0d0bc285cef9e4383834bf9b1a3dc260e7c41c97b587f55eed496acd718cd7098cc73be488c7cc36f12ffb79fc91eb507afe07a479ff719fb300637f4e935ec57316be1d86653f74dd2bd2dd38648444f51f4f599951f1fece92f16646bcec7442ef8a5cc867fca3133017d1ff326e2ee86289a9053bf72b13b5a82aa6d3e6a68c27221747eb34aa6d3b69d51f69f5d1e04644654e5de2f62232d1aba7671c1618044923c33ef3917a23724a9a76b7268db70a653a7caa6628f88bb40d4db9e13ac9407f7b04b16c8e81b94cfeab2f1d0aa8cfb30dcda302f16b2155e5bd38731ff2a8ec9ab01b00369565e06af4fc3f1df13af2b39d86030ea851bffce731fb66ef39b3faca33c91ddfcc98e730ec4cc11e7528cc480fd8b3368685ccbe502019d96fe12bde7803dd89c66745fd570242efd3523a0ff54a93fd96ebbb63841f01f91772ddc8cfef68f255be25ddff6710357502c95ece9160600f6d642f2dd963bd13e15b621475b0314328050d6431a10e27a3bb3dd916bee5f9bec5886c6c6730c8c4be1f678f49c17229d23235a8181c86bd6376c8c81b6283c059efa3d4db27161b4ff409d00a39de77c801f456d5bfe48527c9824cc2e4deb07432b49b47162ff81dbc88cb4dbd1a5a8ff9d21e3f4f6ee746219054f783d04686c66b037716765a67c11880297b9094b971d65d4a838eb4014b08c5429be595e19dc9b446f9a3fb410a33c8619c4574bb4f738029a84a07d2ad5f314ece9ed4aaee70e106b52303ebab5e007b6854bcd7715c0759a86db2daf51e9ec5771bc225adb5052f900d5d785c67f85be14a5c717e1c1d0d5599eee5baa97a35ee9eb7b117f0400842a495a73fa38a1c0a151faa89db3049ad40d9b0186c875aa3d04ff3eb379cb5f1e582a5d426679258b06949144d6a2f500fdefcb0dc8051c4d41a8453477830b89cf30614c5e7115255a3ed04eccaf4a3ece21c07c54021ae0078a00d9d39a2b788aa67018181a95522f35c61081f0985bea35819d113aa32a2e555ee9161c7175ee062ee0d064f9a11f848233b763977d728864d1186bf36a9b053254979fc9f1c7f20eac274b539c2dff5e2dd2e7c0d9b875f11587759f9742c1e531aff68d1a053f1562ca4a4eb96527f810d2697dc453585fa255d96cf4f86a15268f3e144b1b78928f3aeab89e7f466f248d4637f551add96512c2b65f449e5c7ea628106cb0e6de27f7b52e101f60ea5182b8ff7f45fa0c7947f8bb5cd1e3dd318dd0756bcefef4e4484917e3ab1a42277b047abaed73671761b0b6c5fa675bf85ff3e117fbd7b13e06052b06db23d87e74e8462419f9c13817f97921dbe19be9cfad8e84f54a9fe6e654aafecad8509060b7e96679e5921f4435b3581f7a6ae0dfd0820eaf04f896a683a0d6763411e0159339d6cf0dc5eb48542f824c0352b2354a891219d7d65fec295922664bc664f4484cbbd46a79b8ef5b06df2f906b842a6faba12ee15ef4bfc746393b325867b406401026239bccdc83e50d7738fbf03deab030680091cde2c457813d40c17f3fa2dd905fcf3f06dcd285001f2b1e7605f9b19d83e121514134acc46f82e91597e52e7d7d76c6f949f3341762ae4f29ab074b690a4b71ddfd2a7576b587fb1fd4b31db9e73bce34660a4aeaec8eecb0108c1d84b8e3364a0245299484d7b291fac81fa6c0442191936c07d03f3582fcc34f32a00c3125e3a0f6e0ec5cfac10829ca4d30c131f8bb5e008a6810"
      }
    }]
}

export const mmrDescriptorForRootProof = {
  "mmrdescriptor": {
    "version": 1,
    "objecthashtype": 5,
    "mmrhashtype": 1,
    "mmrroot": {
      "version": 1,
      "flags": 0,
      "objectdata": "76e4ccbe88fc98ff5f3617230bbd78a3d1639ed8c9da0265dadcc239cafccb52"
    },
    "mmrhashes": {
      "version": 1,
      "flags": 0,
      "objectdata": "41d826d3c6cbbc3a96992670d2f604e959fd1a8c01a1058f4ed5c31a3955ed35e14d8cba7e189ce901f3da86016be3c5008dfd82bb1427ffbcb04ceee00bb28e675edae9aec09aee78f95543641408623e57300ca913f4e2731ed070b141585c2353f312ea8217f8e61507ec966bd4d53756ebd94133b4c84288273104cdc12c639ff71f02bb0616e838b4ce5c7d3c6a6f495b2539b9b132bcdd73ad50aa60967d3294cca5e4efd2ca4b5d2dd549397097f00c876ff10b"
    },
    "datadescriptors": [
      {
        "version": 1,
        "flags": 2,
        "objectdata": {
          "i4GC1YGEVD21afWudGoFJVdnfjJ5XWnCQv": {
            "version": 1,
            "flags": 96,
            "mimetype": "text/plain",
            "objectdata": {
              "message": "Valu Proof of Humanity"
            },
            "label": "iEEjVkvM9Niz4u2WCr6QQzx1zpVSvDFub1"
          }
        },
        "salt": "1decc354866b80edd7b817c410e95973931f53611352dfdf62cc9fe9523178f2"
      },
      {
        "version": 1,
        "flags": 2,
        "objectdata": {
          "i4GC1YGEVD21afWudGoFJVdnfjJ5XWnCQv": {
            "version": 1,
            "flags": 96,
            "mimetype": "text/plain",
            "objectdata": {
              "message": "monkins.VRSCTEST@"
            },
            "label": "iAkd3VBhYQ3MK6PUCtfhXrLVNbqSghxxpn"
          }
        },
        "salt": "af3e8faec6949b069a74b8ff378b26049bdd3adc896f4d757a71253680c10789"
      },
      {
        "version": 1,
        "flags": 2,
        "objectdata": {
          "i4GC1YGEVD21afWudGoFJVdnfjJ5XWnCQv": {
            "version": 1,
            "flags": 96,
            "mimetype": "text/plain",
            "objectdata": {
              "message": "1980/01/01"
            },
            "label": "iSZsa7C4esogN3W6fBngUHR6GvSmt7We4j"
          }
        },
        "salt": "1833bd338ac45baf1843c3131db88306b1ae2dbfc74df4b7747204244546f220"
      },
      {
        "version": 1,
        "flags": 2,
        "objectdata": {
          "i4GC1YGEVD21afWudGoFJVdnfjJ5XWnCQv": {
            "version": 1,
            "flags": 96,
            "mimetype": "text/plain",
            "objectdata": {
              "message": "true"
            },
            "label": "iAXYYrZaipc4DAmAKXUFYZxavsf6uBJqaj"
          }
        },
        "salt": "8304a1c176e82701efbc5b833bf5885d9edb982a43d599b6f68e205b4ba6c3b1"
      },
      {
        "version": 1,
        "flags": 2,
        "objectdata": {
          "i4GC1YGEVD21afWudGoFJVdnfjJ5XWnCQv": {
            "version": 1,
            "flags": 96,
            "mimetype": "image/png",
            "objectdata": "89504e470d0a1a0a0000000d4948445200000032000000440803000000f49a965f0000000467414d410000b18f0bfc6105000000017352474200aece1ce90000000970485973000013ee000013ee014e80294e000002e2504c5445ffffff401c10f8ba8bfffffff3f2f2ecebebe6e5e5fffffffffffffafafbf7b17e411c102c1208fbba8bf9ba8b2c1008f8b98af8b27ffeffff3f1b0ff8b17d2d1109f8b484f9b788f9b889faba8af8ae79f8bb8cf8b3823e190e3c1b0e220802f9b27ef8b6873a190df8b685340f04ffbb86fbbc8cfbbd8df7ae78fab889f8b07ef7af7b33140a3a1609f8b280fcbc8ef7ac77ffb984280e06fabb8cfab98bf5b688ffc08ff6b381351207fdbe8fffc694ffc291feb784f7b98937160d381206fab07c482920f6a46f52362cffbe8cfdb682faddc5fceee4fef8f2f7f6f63c190c3113072a120a35160afab8872f140cfdbd8d250c05ecae82fcbb8959403995674a8b5c42150000f7b07dfefcfaf8ac79f8be91f7c29c60453e310e02c28463ffbb88ffc28cffc493db996f492614e4a476080101fbe2cffbe9dbfefefdfbe6d5f7b483fef2e9ebe8e7fffbf8f9b381806f6a2b0e063d1b12cec8c6cbc5c2e9aa7ecc956f4e2e21d39e7aa86a4f55301cfbb684f2af7db27d59a56f4ffcb581f8c9a5fbdfc9f6b27f7b6661f9d4b8fadac0fad7bdf6a771dfdcdbf4ba8ff8ccab8f807af2b588230a03391d13ce916a3f241b6c544c857b799f7052c28d69ac7959764d359e644ae8a77b8b7a74afa7a6e19f71d69d73c78a62b87e5cf2f1f12c0600f59f68644c45f9d0b23f2117bbb1af8a766fc4bfbdfafafad2ccc9432318f4b082f8c59e976a4c563b339a8d88f0b184afa29fdca27ae3a47ae2e1e0bd825fa296938f523c68432e926d57fec08f77513c6a48377d553effbd8a603c2c8052361d0403bf8862f6bf96e0aa82efb588a4775beeeeedf59b62a57555c0bbbab6aca9a99f9d6e442c624233b0856aa39b99d299725f3723efaa79928684d2d0d1fec19285573bdbd7d7c68d66ffd0aa493f3ec79977d5956b7671712c22231c1518544e509f918dfef5f071605e6f5853b77857ffecded7885cb88565e3bca0ffcba34e2a17d6b39befded1fff5e3b5b6b7442d2c755b5448383788634e241a1d53b328f90000000a74524e53edffffffedededf2dced5773ff8b000006b44944415448c795d7774052791c00701fdc5dddefd903790e3c1413504840191290a2397225224edcdb421a962b2d4754364ddb53db65d9ded9de7b5fdeb5ebf6def7ffbdc7f2215addf70f85c7efc36f7cbf3fdeef390d1fe6e4109f7e64feffc9c78e9f0d1beee4441e18f177d2ee90c9ddd5ebd2d276911dc3c981e877a409961db87d3c4dbdff503cf943c8d139f98a3d1182308e226af181aa0f20931777705008f5865008f29ebeaeba7ac7ed435f1dd83d14d9d41dff20229f0559038dc88b085328389ccd7955559b06239b96efda9a2f84fa03f61626a028d61d9410169657b9f84efc4052c9daa380860814157236475d1f406ea913bca1a1034dd83979c0c0bab786c330fc0e0347a5ad9b4c24d57350f8dd0412d6ed3c4a2495f9d0fb4842d402e2c0e2a384f0fb081c1e451c58150bb55c87cd7f07c330670e811ce7582e7b3321ac35ca62c1b680209b57ece827951cd37733d5cece6a148604146735334cad6631996182f1024b41a0d0e66ffbc9b270ec124bed86c77894e9362004f880513862ce37dd56b2603f5628e329d3da7c2414cc08061267010b858579bbaeeb6956b27c3b130a73d626ae3e5b97e8330d6be2ec269138db00f68aa24185fb8935b6151b974652d75e58d8539bb1d4872291482222b46d144a1b1e5a6d5b9bc44dedbd9d989765e130d3cd27a328d077c4e8e22ba7133bb66b96de5f7932f1cccdf47d2b56751d6b6c4c4fd43059bb096427070ea368cfcbbde82412a977ccb553570f5fbb7765cc8c7d4b8aa2b138e7e7b75aab993efd09811ce2c002cdd2e9eda1be182131b80fb9cae2ab29fea37316229e588c0a4dcf6cd3b0222613c8823dde948e876b9a66e1bd604649a292a452ec05c3f47ec4acf40ba735d3f2f40442cb0b97d4b1fd66c911d2608124f915bda4f87c6eb75f16e76bcfcf34cacf8584f429b9fe9e888dfaf786848414f7f59d7b49d17c6947aa153e67c4c6e88d8d976a0fa72c09ea935a44dfd5c3b52b57edcb5881a42c4db427f15117cffa456f2c1daf6696363cbabb2ac83c09e5cd865238412150e46704d7651eb7dfc89599e9456b1b4a577f71f217a650c8ac1d6d1235a56aefd247179a1a2fc0e9273397db935b1757153d6d2a0b15cbcb2ea5df4d58518c93de8d0dab1b4b6689c57ea11b9e9ecdb49ffea4d8e7c70a47889b5dc1c86671a1bcfd08d7b4d8b2b533fdc68d0400b83617afc85c4f24b445cda73a43e946009ac562f1d4c0d054f3ec196c237e41dcec02a27f4c9cf13db19745637fd830d563a6785c596757e7e35023d5b26286d00d4d19195d25cde2e8da86f9ad44b2cd2bd2559794d27436aa43ab3ddfd56c218cd44bcb2e66fefde75fa757163fcc288c21925676241fa46e5cf7e4ed83d7e5afd6af4ca69b92993c63fd1fe5e5cb9f1fddfd22baacd36f0291c46024c03de859dcdb37ff96bf22ff944437551b75e1ef55e5e56f5efff62cd937205b359148e68922c7025f12bdefc599b47bbffeec4fa2b2cdd5e5b9f7fe3fa7660479781af8916c3b1213b9052724aab2b83724156f2eb72c003d64cc985e2a892ed76d996f4766e373619bc66fae4824906e57ccbe4077233b96482a54c6ec002f42e923016c0691b001ff86c72422895519b203885fec48785b72e26804f2754e6076808edddf84aab327ee40347f6f1691e85bb2452eae06aaad095d673f172f20e22fb2afe49848911104da0883adb3131e00f0c16c7b92953bdfe80a926cc42b105b0b956d665e00885ab206dc2bb372792e9665c6db98a6a2b2f64a0780979be570df5fc43302772bf130d5b24a65cb0a106d733c2a6c131975eed671194c98ea6b5b2f209aeb48e61208c9685a62c45235d4408cb43a925622717fec2145b83d3d0ceb548028c691cc13817ec22d39664cddf0dd41a975898168b62399cd03c0cb9688a0833dee3532936030d818e14d702415180930a75c8a90107f29e2ef2f95e28b866705f0273a9258a003c05465488d4c1914a454262329353215c240b05f1e9d7c9223c9cae15b46c63d525050bfa6bebe7ecd9a02ac433c2b80779936c811ae55847de481e7832b5b5b56f2b2e4488dcc1f7be769b05f30029972195f0053fe19aaf6234b0e161428f1998cc2b3b2573f582fe45819dfc5c5bc67b805274e9ca84f9192102a82a59ea7fa7a8813ec442366cc45d22b5b9ba2c486151cec11087886d8a10ebdb40ad9672e5ee6f26570a578ea83830d40b430964c1bf29c3c2997c7975389b749039fd71247d6eb873e5a67c5c84480b087e522c604fdfb0ef07173653cebef86af7ce1bc2976831afc31811c17936360d3a97436bda502db8ab4f73f59e029aa989b7b39b735564ffea0270beba4e2f0bd4efb3fe41de1e434d883d5bb62d8f0ff006fa1dc92c313756b0000000049454e44ae426082",
            "label": "iC22PxGqY7Mx3YT9kNrW1d11JNyGL56N8e"
          }
        },
        "salt": "b8efa9bf9fe0823a2f19909956a24c7681aa901f5512ea8f2671d7d94af40db4"
      }
    ]
  }
}

export const TEST_IDENTITY_ID = "i8jHXEEYEQ7KEoYe6eKXBib8cUBZ6vjWSd"

export const TEST_SYSTEMID = IdentityID.fromAddress("iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq");
export const TEST_SIGNINGID = IdentityID.fromAddress("iPsFBfFoCcxtuZNzE8yxPQhXVn4dmytf8j");
export const TEST_REQUESTID = CompactIAddressObject.fromAddress("iPsFBfFoCcxtuZNzE8yxPQhXVn4dmytf8j");
export const TEST_CREATEDAT = new BN("1700000000", 10);
export const TEST_EXPIRYHEIGHT = new BN("123456");
export const TEST_SALT = Buffer.from('=H319X:)@H2Z');
export const TEST_TXID = "2474d2c7b3586cedd8bf7f4a9af7c26e794ea2fc44853f17a30148e2ed857a95";

export const TEST_CONTENTMAP = new Map();
TEST_CONTENTMAP.set("iPsFBfFoCcxtuZNzE8yxPQhXVn4dmytf8j", Buffer.alloc(32));
TEST_CONTENTMAP.set("iK7a5JNJnbeuYWVHCDRpJosj3irGJ5Qa8c", Buffer.alloc(32));

export const TEST_CLI_ID_UPDATE_REQUEST_JSON = {
  "name": "data",
  "contentmultimap": {
      "i5CXAPoCLothTntExgvc5kK38u2wyHtFCg": {
          "data": {"createmmr":true, "mmrdata":[{"message": "{\"rail_transport\": 43326.71, \"public_bus_transport\": 83452.4, \"air_transport\": 1306.83, \"urban_public_transport\": -1, \"time\": 993945600}", "mimetype": "application/json", "label": "quarter_3_2001_transport_passenger_data_cz"}]}
      }
  }
}

export const TEST_CLI_ID_UPDATE_REQUEST_JSON_HEX = {
  "name":"[32][32]",
  "parent":"iF6hHpRXpmhLq77eksQzqQrWuminKtzmxT",
  "contentmultimap": {
    "i4d7U1aZhmoxZbWx8AVezh6z1YewAnuw3V": [
      {
        "i4GC1YGEVD21afWudGoFJVdnfjJ5XWnCQv": {
          "version": 1,
          "flags": 32,
          "label": "i3bgiLuaxTr6smF8q6xLG4jvvhF1mmrkM2",
          "objectdata": {
            "serializedhex": "08a2ebb2c55f83a8e2a426a53320ed4d42124f4d010c012001010776657273696f6e08a2ebb2c55f83a8e2a426a53320ed4d42124f4d011d01600a656d706c6f796d656e7404747970650a746578742f706c61696e08a2ebb2c55f83a8e2a426a53320ed4d42124f4d011d016009446576656c6f706572057469746c650a746578742f706c61696e08a2ebb2c55f83a8e2a426a53320ed4d42124f4d0157016044426f6479206f6620636c61696d20676f657320686572652c207768617420796f75206861766520646f6e652c207768617420796f7520686176652061636869657665642e04626f64790a746578742f706c61696e08a2ebb2c55f83a8e2a426a53320ed4d42124f4d011d016009323031392d323032300564617465730a746578742f706c61696e08a2ebb2c55f83a8e2a426a53320ed4d42124f4d011f01600a323032352d30312d3330066973737565640a746578742f706c61696e08a2ebb2c55f83a8e2a426a53320ed4d42124f4d012f012020cc2b8109fb5566cf98297aaf5c80e2fb0a5051c3252a7957b13ba5433767e23a0b7265666572656e63654944"
          }
        }
      },
      {
        "i4GC1YGEVD21afWudGoFJVdnfjJ5XWnCQv": {
          "version": 1,
          "flags": 32,
          "label": "i3bgiLuaxTr6smF8q6xLG4jvvhF1mmrkM2",
          "objectdata": {
            "serializedhex": "08a2ebb2c55f83a8e2a426a53320ed4d42124f4d010c012001010776657273696f6e08a2ebb2c55f83a8e2a426a53320ed4d42124f4d011d01600a656d706c6f796d656e7404747970650a746578742f706c61696e08a2ebb2c55f83a8e2a426a53320ed4d42124f4d012301600f436869656620446576656c6f706572057469746c650a746578742f706c61696e08a2ebb2c55f83a8e2a426a53320ed4d42124f4d0157016044426f6479206f6620636c61696d20676f657320686572652c207768617420796f75206861766520646f6e652c207768617420796f7520686176652061636869657665642e04626f64790a746578742f706c61696e08a2ebb2c55f83a8e2a426a53320ed4d42124f4d011d016009323032312d323032340564617465730a746578742f706c61696e08a2ebb2c55f83a8e2a426a53320ed4d42124f4d011f01600a323032352d30312d3239066973737565640a746578742f706c61696e08a2ebb2c55f83a8e2a426a53320ed4d42124f4d015a016040373962343830376333303465383035333831666438653165376234383865353062363032613033333366663266663633636264313564363362366163383835650b7265666572656e636549440a746578742f706c61696e"
          }
        }
      }
    ]
  }
}

export const TEST_PARTIAL_IDENTITY = new PartialIdentity({
  flags: new BN("0"),
  version: IDENTITY_VERSION_PBAAS,
  min_sigs: new BN(1),
  primary_addresses: [
    KeyID.fromAddress("RQVsJRf98iq8YmRQdehzRcbLGHEx6YfjdH"),
    KeyID.fromAddress("RP4Qct9197i5vrS11qHVtdyRRoAHVNJS47")
  ],
  parent: IdentityID.fromAddress("iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq"),
  system_id: IdentityID.fromAddress("iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq"),
  name: "TestID",
  content_map: TEST_CONTENTMAP,
  content_multimap: ContentMultiMap.fromJson({
    iPsFBfFoCcxtuZNzE8yxPQhXVn4dmytf8j: [
      { iK7a5JNJnbeuYWVHCDRpJosj3irGJ5Qa8c: 'Test String 123454321' },
      { iK7a5JNJnbeuYWVHCDRpJosj3irGJ5Qa8c: 'Test String 123454321' },
      { iK7a5JNJnbeuYWVHCDRpJosj3irGJ5Qa8c: 'Test String 123454321' },
      { iK7a5JNJnbeuYWVHCDRpJosj3irGJ5Qa8c: 'Test String 123454321' }
    ],
    iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq: '6868686868686868686868686868686868686868',
    i5v3h9FWVdRFbNHU7DfcpGykQjRaHtMqu7: [
      '6868686868686868686868686868686868686868',
      '6868686868686868686868686868686868686868',
      '6868686868686868686868686868686868686868'
    ],
    i81XL8ZpuCo9jmWLv5L5ikdxrGuHrrpQLz: { iK7a5JNJnbeuYWVHCDRpJosj3irGJ5Qa8c: 'Test String 123454321' }
  }),
  recovery_authority: IdentityID.fromAddress("i81XL8ZpuCo9jmWLv5L5ikdxrGuHrrpQLz"),
  revocation_authority: IdentityID.fromAddress("i5v3h9FWVdRFbNHU7DfcpGykQjRaHtMqu7"),
  unlock_after: new BN("123456", 10),
  private_addresses: [SaplingPaymentAddress.fromAddressString("zs1wczplx4kegw32h8g0f7xwl57p5tvnprwdmnzmdnsw50chcl26f7tws92wk2ap03ykaq6jyyztfa")]
});

export const TEST_MMR_DATA = new PartialMMRData({
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

export const TEST_BASE_SIGN_DATA_WITH_MMR_DATA: PartialSignDataInitData = {
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
  data: TEST_MMR_DATA, // This is the PartialMMRData object
}

export const TEST_SIGNDATA_MAP = new Map();
TEST_SIGNDATA_MAP.set("iBvyi1nuCrTA4g44xN9N7EU1t6a7gwb4h8", new PartialSignData(TEST_BASE_SIGN_DATA_WITH_MMR_DATA))

// Test constants with valid addresses from the codebase
export const TEST_CHALLENGE_ID = "iMdf3BJ1mEtKMAJqNg8hj5fMnCUCc3bpFN";
export const TEST_IDENTITY_ID_1 = "i7LaXD2cdy1zeh33eHzZaEPyueT4yQmBfW"; 
export const TEST_IDENTITY_ID_2 = "i84T3MWcb6zWcwgNZoU3TXtrUn9EqM84A4";
export const TEST_IDENTITY_ID_3 = "iJ5LnijKvp1wkL4hB3EsJ5kjcE4T8VL4hD";

export const SERIALIZED_AUTHENTICATION_REQUEST_DETAILS = Buffer.from("070102c72c5b342995a2186f96271e91686c5e942d13e1030101022a5fc0e9dedf4f1e8351fe652a140e9dd38fa5a9020102324afad29f51859c54050db854d2c9bb52acd9bd030102a0276f355ad37d8e5d2d10f16c1d051b6f6ead62ff9982d02aac020000", 'hex');
