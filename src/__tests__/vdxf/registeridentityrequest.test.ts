import { BN } from "bn.js";
import { RegisterIdentityRequestDetails, RegisterIdentityRequestOrdinalVDXFObject, GenericRequest } from "../../vdxf/classes";
import { RegisterIdentityParams } from "../../vdxf/classes/request/RegisterIdentityRequestDetails";
import { REGISTER_IDENTITY_REQUEST_VDXF_ORDINAL } from "../../constants/ordinals/ordinals";

describe("RegisterIdentityRequestDetails", () => {
  it("should serialize and deserialize correctly", () => {
    const details = new RegisterIdentityRequestDetails({
      returnTxHex: "0102030405",
      description: "Register Alice"
    });

    const ordinalObj = new RegisterIdentityRequestOrdinalVDXFObject({
      data: details,
      type: REGISTER_IDENTITY_REQUEST_VDXF_ORDINAL
    });

    const buffer = ordinalObj.toBuffer();
    const parsedObj = new RegisterIdentityRequestOrdinalVDXFObject();
    parsedObj.fromBuffer(buffer);

    expect(parsedObj.data.returnTxHex).toBe("0102030405");
    expect(parsedObj.data.description).toBe("Register Alice");
  });

  it("should serialize and deserialize register params correctly", () => {
    const registerParams = new RegisterIdentityParams({
      name: "alice",
      parent: "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
      primaryAddresses: ["RHCnxQP14Cug3JJJSUvoXM35suPw4ZqqAa"],
      revocationAuthority: "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
      recoveryAuthority: "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
      commitmentTxid: "a".repeat(64),
      commitmentVout: 1
    });

    const details = new RegisterIdentityRequestDetails({
      description: "Register alice@",
      registerParams,
      returnTxHex: "aabbcc"
    });

    expect(details.containsRegisterParams()).toBe(true);
    expect(details.containsReturnTx()).toBe(true);
    expect(details.isValid()).toBe(true);
    expect(registerParams.isValid()).toBe(true);

    const request = new GenericRequest({
      details: [
        new RegisterIdentityRequestOrdinalVDXFObject({
          data: details,
          type: REGISTER_IDENTITY_REQUEST_VDXF_ORDINAL
        })
      ]
    });

    const parsedReq = new GenericRequest();
    parsedReq.fromBuffer(request.toBuffer());

    const parsed = (parsedReq.details[0] as RegisterIdentityRequestOrdinalVDXFObject).data;
    expect(parsed.description).toBe("Register alice@");
    expect(parsed.returnTxHex).toBe("aabbcc");
    expect(parsed.registerParams.name).toBe("alice");
    expect(parsed.registerParams.parent).toBe("iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq");
    expect(parsed.registerParams.primaryAddresses[0]).toBe("RHCnxQP14Cug3JJJSUvoXM35suPw4ZqqAa");
    expect(parsed.registerParams.commitmentTxid).toBe("a".repeat(64));
    expect(parsed.registerParams.commitmentVout).toBe(1);

    const json = parsed.toJson();
    const fromJson = RegisterIdentityRequestDetails.fromJson(json);
    expect(fromJson.toBuffer().toString('hex')).toBe(parsed.toBuffer().toString('hex'));
  });
});
