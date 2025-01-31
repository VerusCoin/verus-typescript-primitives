import { DataDescriptor } from "../../pbaas/DataDescriptor";
import { MMRDescriptor, MMRDescriptorJson } from "../../pbaas/MMRDescriptor";
import { SignatureData } from "../../pbaas/SignatureData";

describe('Create a personal info request', () => {
    test('serialize and deserialize a mmrdescriptor', async () => {

        const mmrdescriptor = {
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

        const mmrdescriptorBuffer = MMRDescriptor.fromJson(mmrdescriptor);
        const initialDescriptor = mmrdescriptorBuffer.toBuffer().toString('hex');
        const newDescriptor = new MMRDescriptor();

        newDescriptor.fromBuffer(Buffer.from(initialDescriptor, 'hex'));

        expect(initialDescriptor).toStrictEqual(newDescriptor.toBuffer().toString('hex'));
        expect(mmrdescriptor).toStrictEqual(newDescriptor.toJson());

    });

    test('serialize and deserialize an encrypted mmrdescriptor', async () => {

        const serializedDatadescriptor = "010501010549b00ad8606acbf5234700daa308a2c64c1f9466c11d47255a60f8ccf9c74ba82b994a03b9b0331bc6f1bf25bbc8b4453a130d65b6a9dc21f7589967e88e51d930682469b03873c54e7720d89d4a9333fe85519a447b886b6c6c8aabee6fb144e9742b76b745dbdfd83c9a0105808207c6db9c149dcaff5f502baf891642e67e7e303c0ba8130f2bff76d8247929bc7ce55fdf66bac03ea808006dc5e71aa12deaff355985c7770ee7a534d9cea2bfc10851ed5c91467083ffb1f746161f5d567b4be5c98d72300e1762697d5f62067d819ac0b35ac2c712c6e8e04cefaecaf759f38f4fa3ff4d3fc4d1dccbb6b820230df92c25958999741329ed3dafc7825900807cbf6b02becc236ce573158a4f0201057c97c0b93faab9462670a5a13da88d9ca796db968ae9c9f1b88df67c564b73cb63f752248402844522efaa62e5b42ce816d0a9f44ca14efaf6f7fe47d916e77b54266c5cac39c6771e899ebda093c566d33bbf60b4a598ea45bf2f5fb1f0cd782baaf092a880a799e0771144a9e9422eec107e43d23ba9386bb46dde0920d7a908ddf6f4d6261d25c62ca086bb3f570b07d74a59256feed13d64d6fbadd201057bd1ce7cab498d9a87bbf3c8d5f255cf209e87adf01f407751959f2d49f23056597a51240e90d5f758adc92e819f77f698fe754c9ea350c213dbcbffdaeb6d9a55bbaf705af9a375c855e7a8ca486bc65b1bd24c35e13f437a7490ecaffeff0323e7508a6cc4e36c5414b4cd7d3125ffabfa3fe85a56e4f6e539925b20822d2b817613d5eb5daf4893afc57289d0081f8fe225c77e1e4839aa0822b9a5"
        const mmrdescriptor = {
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
        const mmrdescriptorFromSerialized = new MMRDescriptor();
        const mmrdescriptorFromJson = MMRDescriptor.fromJson(mmrdescriptor);
        
        mmrdescriptorFromSerialized.fromBuffer(Buffer.from(serializedDatadescriptor, "hex"));

        const initialDescriptor = mmrdescriptorFromSerialized.toBuffer().toString('hex');
        const newDescriptor = mmrdescriptorFromJson.toBuffer().toString('hex');

        expect(initialDescriptor).toStrictEqual(newDescriptor);
        expect(mmrdescriptorFromJson.toJson()).toStrictEqual(mmrdescriptorFromSerialized.toJson());


    });

    test('serialize and deserialize an encrypted mmrdescriptor', async () => {

        const mmrdescriptor = {
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

        const mmrdescriptorBuffer = MMRDescriptor.fromJson(mmrdescriptor);
        const initialDescriptor = mmrdescriptorBuffer.toBuffer().toString('hex');
        const newDescriptor = new MMRDescriptor();

        newDescriptor.fromBuffer(Buffer.from(initialDescriptor, 'hex'));

        expect(initialDescriptor).toStrictEqual(newDescriptor.toBuffer().toString('hex'));
        expect(mmrdescriptor).toStrictEqual(newDescriptor.toJson());

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
});