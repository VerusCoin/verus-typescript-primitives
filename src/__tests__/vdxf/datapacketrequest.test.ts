import { BN } from "bn.js";
import { 
  CompactAddressObject,
  CompactIAddressObject,
  DataPacketRequestDetails
} from "../../vdxf/classes";
import { DataDescriptor } from "../../pbaas";
import { VerifiableSignatureData } from "../../vdxf/classes/VerifiableSignatureData";


describe("DataPacketRequestDetails", () => {
  describe("constructor and basic properties", () => {
    test("creates instance with custom values", () => {
      const item = new DataPacketRequestDetails({
        version: new BN(DataPacketRequestDetails.DEFAULT_VERSION),
        flags: DataPacketRequestDetails.FLAG_HAS_STATEMENTS.or(DataPacketRequestDetails.FLAG_HAS_SIGNATURE).or(DataPacketRequestDetails.FLAG_HAS_REQUEST_ID).or(DataPacketRequestDetails.FLAG_HAS_SALT),
        signableObjects: [DataDescriptor.fromJson({ version: new BN(1), label: "123", objectdata: "0011223344aabbcc", flags: DataDescriptor.FLAG_LABEL_PRESENT })],
        statements: ["Statement 1", "Statement 2"],
        signature: new VerifiableSignatureData({
          version: new BN(1),
          signatureAsVch: Buffer.from("efc8d6b60c5b6efaeb3fce4b2c0749c317f2167549ec22b1bee411b8802d5aaf", 'hex'),
          hashType: new BN(1),
          flags: new BN(0),
          identityID: new CompactIAddressObject({ version: CompactAddressObject.DEFAULT_VERSION, type: CompactAddressObject.TYPE_I_ADDRESS, address: "i7LaXD2cdy1zeh33eHzZaEPyueT4yQmBfW", rootSystemName: "VRSC" }),
          systemID: new CompactIAddressObject({ version: CompactAddressObject.DEFAULT_VERSION, type: CompactAddressObject.TYPE_FQN, address: "VRSC", rootSystemName: "VRSC" }),
        }),
        requestID: CompactIAddressObject.fromAddress("iD4CrjbJBZmwEZQ4bCWgbHx9tBHGP9mdSQ"),
        salt: Buffer.from("4f66603f256d3f757b6dc3ea44802d4041d2a1901e06005028fd60b85a5878a2", "hex")
      });

      const detailsBuffer = item.toBuffer();

      const newDetails = new DataPacketRequestDetails();
      newDetails.fromBuffer(detailsBuffer);

      expect(newDetails.toJson()).toEqual(item.toJson());

      expect(newDetails.version.toString()).toBe(item.version.toString());
      expect(newDetails.flags.toString()).toBe(item.flags.toString());
      expect(newDetails.signableObjects.length).toBe(1);
      expect(newDetails.signableObjects[0].toJson().label).toBe("123");
      expect(newDetails.statements?.length).toBe(2);
      expect(newDetails.statements?.[0]).toBe("Statement 1");
      expect(newDetails.signature?.signatureAsVch.toString('hex')).toBe("efc8d6b60c5b6efaeb3fce4b2c0749c317f2167549ec22b1bee411b8802d5aaf");
      expect(newDetails.salt?.toString('hex')).toBe("4f66603f256d3f757b6dc3ea44802d4041d2a1901e06005028fd60b85a5878a2");
      expect(newDetails.toBuffer().toString('hex')).toBe(detailsBuffer.toString('hex'));
    });
  });
});
