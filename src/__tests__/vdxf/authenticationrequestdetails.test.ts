import { BN } from "bn.js";
import { 
  AuthenticationRequestDetails,
  CompactAddressObject,
  CompactIAddressObject,
  RecipientConstraint
} from "../../vdxf/classes";
import { SERIALIZED_AUTHENTICATION_REQUEST_DETAILS, TEST_CHALLENGE_ID, TEST_IDENTITY_ID_1, TEST_IDENTITY_ID_2, TEST_IDENTITY_ID_3, TEST_SYSTEMID } from "../constants/fixtures";

describe("AuthenticationRequestDetails", () => {
  describe("constructor and basic properties", () => {
    test("creates instance with minimal required data", () => {
      const details = new AuthenticationRequestDetails();

      const detailsBuffer = details.toBuffer();

      const newDetails = new AuthenticationRequestDetails();
      newDetails.fromBuffer(detailsBuffer);

      expect(details.flags?.toString()).toBe("0");
      expect(details.recipientConstraints).toBeNull();
      expect(detailsBuffer.toString('hex')).toBe(newDetails.toBuffer().toString('hex'));
    });

    test("creates instance with all optional data", () => {
      const details = new AuthenticationRequestDetails({
        requestID: CompactIAddressObject.fromAddress(TEST_CHALLENGE_ID, TEST_SYSTEMID.toAddress()!),
        recipientConstraints: [
          { type: RecipientConstraint.REQUIRED_ID, identity: new CompactIAddressObject({ version: CompactAddressObject.DEFAULT_VERSION, type: CompactAddressObject.TYPE_I_ADDRESS, address: TEST_IDENTITY_ID_1, rootSystemName: "VRSC" }) },
          { type: RecipientConstraint.REQUIRED_SYSTEM, identity: new CompactIAddressObject({ version: CompactAddressObject.DEFAULT_VERSION, type: CompactAddressObject.TYPE_I_ADDRESS, address: TEST_IDENTITY_ID_2, rootSystemName: "VRSC" }) },
          { type: RecipientConstraint.REQUIRED_PARENT, identity: new CompactIAddressObject({ version: CompactAddressObject.DEFAULT_VERSION, type: CompactAddressObject.TYPE_I_ADDRESS, address: TEST_IDENTITY_ID_3, rootSystemName: "VRSC" }) }
        ],
        expiryTime: new BN(2938475938457) // 1 hour from now
      });

      const detailsBuffer = details.toBuffer();

      const newDetails = new AuthenticationRequestDetails();
      newDetails.fromBuffer(detailsBuffer);

      expect(newDetails.requestID!.toAddress()).toBe(TEST_CHALLENGE_ID);
      expect(newDetails.recipientConstraints?.length).toBe(3);
      expect(newDetails.expiryTime?.toString()).toBe("2938475938457");

      expect(detailsBuffer.toString('hex')).toBe(newDetails.toBuffer().toString('hex'));
    
      expect(details.toBuffer().toString('hex')).toBe(SERIALIZED_AUTHENTICATION_REQUEST_DETAILS.toString('hex'));

    });

    test("creates instance with default constructor", () => {
      const details = new AuthenticationRequestDetails();

      expect(details.hasRequestID()).toBe(false);
      expect(details.flags?.toString()).toBe("0");
      expect(details.recipientConstraints).toBeNull();
    });
  }); 

  describe("JSON serialization", () => {
    test("preserves recipient constraints through JSON text and wire serialization", () => {
      const details = new AuthenticationRequestDetails();
      details.fromBuffer(SERIALIZED_AUTHENTICATION_REQUEST_DETAILS);

      const json = JSON.parse(JSON.stringify(details.toJson()));
      expect(json.recipientconstraints).toHaveLength(3);
      expect(json).not.toHaveProperty("recipientConstraints");

      const restored = AuthenticationRequestDetails.fromJson(json);
      expect(restored.recipientConstraints.map(constraint => ({
        type: constraint.type,
        address: constraint.identity.toAddress(),
      }))).toEqual([
        { type: RecipientConstraint.REQUIRED_ID, address: TEST_IDENTITY_ID_1 },
        { type: RecipientConstraint.REQUIRED_SYSTEM, address: TEST_IDENTITY_ID_2 },
        { type: RecipientConstraint.REQUIRED_PARENT, address: TEST_IDENTITY_ID_3 },
      ]);
      expect(restored.requestID.toAddress()).toBe(TEST_CHALLENGE_ID);
      expect(restored.flags.toString()).toBe("7");
      expect(restored.expiryTime.toString()).toBe("2938475938457");
      expect(restored.isValid()).toBe(true);
      expect(restored.toBuffer()).toEqual(SERIALIZED_AUTHENTICATION_REQUEST_DETAILS);
    });
  });
});
