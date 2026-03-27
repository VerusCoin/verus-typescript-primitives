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
        flags: DataPacketRequestDetails.FLAG_HAS_STATEMENTS.or(DataPacketRequestDetails.FLAG_HAS_SIGNATURE).or(DataPacketRequestDetails.FLAG_HAS_REQUEST_ID),
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
        requestID: CompactIAddressObject.fromAddress("iD4CrjbJBZmwEZQ4bCWgbHx9tBHGP9mdSQ")
      });

      const detailsBuffer = item.toBuffer();

      const newDetails = new DataPacketRequestDetails();
      newDetails.fromBuffer(detailsBuffer);

      expect(newDetails.toJson()).toEqual(item.toJson());

      expect(newDetails.version.toString()).toBe(item.version.toString());
      expect(newDetails.flags.toString()).toBe(item.flags.toString());
      expect(newDetails.signableObjects.length).toBe(1);
      expect((newDetails.signableObjects[0] as DataDescriptor).toJson().label).toBe("123");
      expect(newDetails.statements?.length).toBe(2);
      expect(newDetails.statements?.[0]).toBe("Statement 1");
      expect(newDetails.signature?.signatureAsVch.toString('hex')).toBe("efc8d6b60c5b6efaeb3fce4b2c0749c317f2167549ec22b1bee411b8802d5aaf");
      expect(newDetails.toBuffer().toString('hex')).toBe(detailsBuffer.toString('hex'));
    });

    test("round trips with string signable objects", () => {
      const item = new DataPacketRequestDetails({
        flags: new BN(0),
        signableObjects: ["sign this document", "and this one too"],
      });

      const buf = item.toBuffer();
      const restored = new DataPacketRequestDetails();
      restored.fromBuffer(buf);

      expect(restored.signableObjects.length).toBe(2);
      expect(restored.signableObjects[0]).toBe("sign this document");
      expect(restored.signableObjects[1]).toBe("and this one too");
      expect(restored.toBuffer().toString('hex')).toBe(buf.toString('hex'));
    });

    test("round trips with mixed DataDescriptor and string signable objects", () => {
      const dd = DataDescriptor.fromJson({ version: new BN(1), label: "test", objectdata: "aabb", flags: DataDescriptor.FLAG_LABEL_PRESENT });
      const item = new DataPacketRequestDetails({
        flags: new BN(0),
        signableObjects: [dd, "a string object", dd],
      });

      const buf = item.toBuffer();
      const restored = new DataPacketRequestDetails();
      restored.fromBuffer(buf);

      expect(restored.signableObjects.length).toBe(3);
      expect(restored.signableObjects[0]).toBeInstanceOf(DataDescriptor);
      expect((restored.signableObjects[0] as DataDescriptor).toJson().label).toBe("test");
      expect(restored.signableObjects[1]).toBe("a string object");
      expect(restored.signableObjects[2]).toBeInstanceOf(DataDescriptor);
      expect(restored.toBuffer().toString('hex')).toBe(buf.toString('hex'));
    });

    test("toJson / fromJson round trips with mixed types", () => {
      const dd = DataDescriptor.fromJson({ version: new BN(1), label: "lbl", objectdata: "ff", flags: DataDescriptor.FLAG_LABEL_PRESENT });
      const item = new DataPacketRequestDetails({
        flags: new BN(0),
        signableObjects: [dd, "hello world"],
      });

      const json = item.toJson();
      expect(json.signableobjects[0].type).toBe(0);
      expect(json.signableobjects[1].type).toBe(1);
      expect(json.signableobjects[1].data).toBe("hello world");

      const restored = DataPacketRequestDetails.fromJson(json);
      expect(restored.signableObjects[0]).toBeInstanceOf(DataDescriptor);
      expect(restored.signableObjects[1]).toBe("hello world");
      expect(restored.toBuffer().toString('hex')).toBe(item.toBuffer().toString('hex'));
    });
  });
});
