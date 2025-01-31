import { DataDescriptor } from "../../pbaas/DataDescriptor";
import { MMRDescriptor, MMRDescriptorJson } from "../../pbaas/MMRDescriptor";
import { SignatureData } from "../../pbaas/SignatureData";

describe('Create a personal info request', () => {
  test('serialize datadescriptor with nested datadescriptor', async () => {

    const personalDataCategory = DataDescriptor.fromJson({
      version: 1,
      "flags": 2,
      "objectdata": {
        "i4GC1YGEVD21afWudGoFJVdnfjJ5XWnCQv": {
          "version": 1,
          "flags": 96,
          "mimetype": "text/plain",
          "objectdata": {
            "message": "John"
          },
          "label": "i4GqsotHGa4czCdtg2d8FVHKfJFzVyBPrM"
        }
      },
      "salt": "4f66603f256d3f757b6dc3ea44802d4041d2a1901e06005028fd60b85a5878a2"
    });

    const initialDescriptor = personalDataCategory.toBuffer().toString('hex');
    const newDescriptor = new DataDescriptor();

    newDescriptor.fromBuffer(Buffer.from(initialDescriptor, 'hex'));

    expect(initialDescriptor).toStrictEqual(newDescriptor.toBuffer().toString('hex'));

  });

  test('serialize and deserialize a mmrdescriptor', async () => {

    const mmrdescriptor: MMRDescriptorJson = {
      "version": 1,
      "objecthashtype": 5,
      "mmrhashtype": 1,
      "mmrroot": {
        "version": 1,
        "flags": 0,
        "objectdata": "30395e0868b1953477e14bb5c16349622239a94115a4d1f02b72b6ecf8b1c79c"
      },
      "mmrhashes": {
        "version": 1,
        "flags": 0,
        "objectdata": "41d826d3c6cbbc3a96992670d2f604e959fd1a8c014102f1eac8f180bee7fb256b801b219e20612fbc9f5e99da111a8364d1197ff3e3fbef8259770f618dacee9489e8cd2cd5dd77d36ede6c42cebdabd85a5b5e8af60b"
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
                "message": "Chris"
              },
              "label": "i4GqsotHGa4czCdtg2d8FVHKfJFzVyBPrM"
            }
          },
          "salt": "4f66603f256d3f757b6dc3ea44802d4041d2a1901e06005028fd60b85a5878a2"
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
                "message": "Monkins"
              },
              "label": "iHybTrNB1kXRrjsCtJXd6fvBKxepqMpS5Z"
            }
          },
          "salt": "62fae0c46b2ad1177749e25fd6d48ccb40213d3cc72e4b2b0dc533039cbe8314"
        }
      ]
    }

    const mmrdescriptorBuffer = MMRDescriptor.fromJson(mmrdescriptor);
    const initialDescriptor = mmrdescriptorBuffer.toBuffer().toString('hex');
    const newDescriptor = new MMRDescriptor();

    newDescriptor.fromBuffer(Buffer.from(initialDescriptor, 'hex'));

    expect(initialDescriptor).toStrictEqual(newDescriptor.toBuffer().toString('hex'));

  });

  test('serialize and deserialize a mmrdescriptor', async () => {

    const mmrdescriptor = {
      "version": 1,
      "objecthashtype": 5,
      "mmrhashtype": 1,
      "mmrroot": {
        "version": 1,
        "flags": 0,
        "objectdata": "30395e0868b1953477e14bb5c16349622239a94115a4d1f02b72b6ecf8b1c79c"
      },
      "mmrhashes": {
        "version": 1,
        "flags": 0,
        "objectdata": "41d826d3c6cbbc3a96992670d2f604e959fd1a8c014102f1eac8f180bee7fb256b801b219e20612fbc9f5e99da111a8364d1197ff3e3fbef8259770f618dacee9489e8cd2cd5dd77d36ede6c42cebdabd85a5b5e8af60b"
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
                "message": "Chris"
              },
              "label": "i4GqsotHGa4czCdtg2d8FVHKfJFzVyBPrM"
            }
          },
          "salt": "4f66603f256d3f757b6dc3ea44802d4041d2a1901e06005028fd60b85a5878a2"
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
                "message": "Monkins"
              },
              "label": "iHybTrNB1kXRrjsCtJXd6fvBKxepqMpS5Z"
            }
          },
          "salt": "62fae0c46b2ad1177749e25fd6d48ccb40213d3cc72e4b2b0dc533039cbe8314"
        }
      ]
    }

    const mmrdescriptorBuffer = MMRDescriptor.fromJson(mmrdescriptor);
    const initialDescriptor = mmrdescriptorBuffer.toBuffer().toString('hex');
    const newDescriptor = new MMRDescriptor();

    newDescriptor.fromBuffer(Buffer.from(initialDescriptor, 'hex'));

    expect(initialDescriptor).toStrictEqual(newDescriptor.toBuffer().toString('hex'));

  });

  test('serialize and deserialize an encrypted mmrdescriptor', async () => {

    const encryptedmmrdescriptor = {
      "version": 1,
      "objecthashtype": 5,
      "mmrhashtype": 1,
      "mmrroot": {
        "version": 1,
        "flags": 5,
        "objectdata": "dec21b940a475989ac9220081ec3816a0026921594462841d2155a3d8462bdd8ada9f02cb7b795a01b842dce0a3c5bfe83e57fd46f34b19a67ee716a1e771264db1b7831cd2341a515",
        "epk": "bdea4d6f2a88a954bed38de4ed6e7f6ff7d483fc799f1428be2ccfe6f27c87c9"
      },
      "mmrhashes": {
        "version": 1,
        "flags": 5,
        "objectdata": "8ad904b879fc67d7f0ceee8accd593549af8225d03772153465c666bb552eff607883d3d07f154a5515e167d9952feb7e3c121033e18ae855cdad782bc7ccbeb8e4737e9fdfcad31dc066695014e8aec572d4de728b8a1dedd740891ee848f85cc5eb16959761d89feafd78ac1e93494d08ea50311fa424c436bdb24b47ff369",
        "epk": "7939e04d89b5713ad3a809ba4cedb4b320df8f380a8b5999e24ce4465fe43b18"
      },
      "datadescriptors": [
        {
          "version": 1,
          "flags": 5,
          "objectdata": "0e953a1bb2c81f2c101d9439736e9f614e1c289621dedfd4a0ff8455a36473c8023f4c8a35bdc546e8e48e17030cb7bc418ef248705f0873f3a1ce5674b800030294cace9b26d8d5cf06ac5a7a379be8c2a1d3e6643249312cfa83fbfe9f882a8f5cde0ddb4b940a53e5d4e69bacffa571b6e8eca218ee9d02b751c71426e8433aeabe6cf79e54495510626b5c43c690c47ca8770835",
          "epk": "c7f2304a170a54dbb97951a93f7444cf689d487e46172f2f5e54923aefe8865e"
        },
        {
          "version": 1,
          "flags": 5,
          "objectdata": "05615e1c62f2a0b5311ec1d4e78d7709f3e29ac52e98a87c4222796ee532f457d0f68a4759464d0d7ea72c90177752d7ee179cfcb25d42ff4d19755650443c1f26490d80db903d28423fb38bd32f19f855f50e52b1e53529da16da8755cfc9857a4a4af1bc4327caa691633a79ef718bcf4547abf5d4cc1f26f5f6919711fc99f6de8e351726d828b534aa090bdcdc5987b117fe0c0b2e06",
          "epk": "cf066d1ca66ea90a7a3de353e4a7db6fd4f88c7ae2eb47bcef9a78a0c8be6010"
        }
      ]
    }

    const mmrdescriptorBuffer = MMRDescriptor.fromJson(encryptedmmrdescriptor);
    const initialDescriptor = mmrdescriptorBuffer.toBuffer().toString('hex');
    const newDescriptor = new MMRDescriptor();

    newDescriptor.fromBuffer(Buffer.from(initialDescriptor, 'hex'));

    expect(initialDescriptor).toStrictEqual(newDescriptor.toBuffer().toString('hex'));

  });

  test('serialize and deserialize signaturedata', async () => {

    const signaturedata = {
      "version": 1,
      "systemid": "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
      "hashtype": 1,
      "signaturehash": "dfd3e3d82783360dfc675a09e6a226fd43119ef4e8d7cf553af96ea5883b51da",
      "identityid": "iKjrTCwoPFRk44fAi2nYNbPG16ZUQjv1NB",
      "signaturetype": 1,
      "signature": "AgXOCgAAAUEfCiSukK9tg46cYOpHmxzKjNquWDyNc8H58+uLSOYmqlUcNUxWB8j3nzT1RHKeJGygdAwrUj5iZ/A9H3+qYV9H9g=="
    }

    const mmrdescriptorBuffer = SignatureData.fromJson(signaturedata);
    const initialDescriptor = mmrdescriptorBuffer.toBuffer().toString('hex');
    const newDescriptor = new SignatureData();

    newDescriptor.fromBuffer(Buffer.from(initialDescriptor, 'hex'));

    expect(initialDescriptor).toStrictEqual(newDescriptor.toBuffer().toString('hex'));
    
  });



});
