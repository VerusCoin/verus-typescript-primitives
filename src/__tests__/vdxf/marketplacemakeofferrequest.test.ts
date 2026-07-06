import { BN } from "bn.js";
import { MarketplaceMakeOfferRequestDetails, MarketplaceMakeOfferRequestOrdinalVDXFObject, GenericRequest } from "../../vdxf/classes";
import { MarketplaceMakeOfferParams } from "../../vdxf/classes/request/MarketplaceMakeOfferRequestDetails";
import { MARKETPLACE_MAKEOFFER_REQUEST_VDXF_ORDINAL } from "../../constants/ordinals/ordinals";
import { TransferDestination, DEST_PKH } from "../../pbaas/TransferDestination";
import { fromBase58Check } from "../../utils/address";

describe("MarketplaceMakeOfferRequestDetails", () => {
  it("should serialize and deserialize correctly", () => {
    const details = new MarketplaceMakeOfferRequestDetails({
      rawTransactionHex: "0102030405",
      offerDescription: "Test Offer"
    });

    const ordinalObj = new MarketplaceMakeOfferRequestOrdinalVDXFObject({
      data: details,
      type: MARKETPLACE_MAKEOFFER_REQUEST_VDXF_ORDINAL
    });

    const buffer = ordinalObj.toBuffer();
    const parsedObj = new MarketplaceMakeOfferRequestOrdinalVDXFObject();
    parsedObj.fromBuffer(buffer);

    expect(parsedObj.data.rawTransactionHex).toBe("0102030405");
    expect(parsedObj.data.offerDescription).toBe("Test Offer");
  });

  it("should embed correctly into GenericRequest", () => {
    const details = new MarketplaceMakeOfferRequestDetails({
      rawTransactionHex: "0102030405",
      offerDescription: "Test Offer"
    });

    const ordinalObj = new MarketplaceMakeOfferRequestOrdinalVDXFObject({
      data: details,
      type: MARKETPLACE_MAKEOFFER_REQUEST_VDXF_ORDINAL
    });

    const request = new GenericRequest({
      details: [ordinalObj]
    });

    const reqBuffer = request.toBuffer();
    const parsedReq = new GenericRequest();
    parsedReq.fromBuffer(reqBuffer);

    expect(parsedReq.details.length).toBe(1);
    const parsedDetails = parsedReq.details[0] as MarketplaceMakeOfferRequestOrdinalVDXFObject;
    expect(parsedDetails.data.rawTransactionHex).toBe("0102030405");
    expect(parsedDetails.data.offerDescription).toBe("Test Offer");
  });

  it("should serialize and deserialize offer params correctly", () => {
    const offerParams = new MarketplaceMakeOfferParams({
      offeredIdentityId: "iN388XsmXaj7H3SLy5L1QgVztn99Yfv3b1", // example NFT identity i-address
      payoutDestination: new TransferDestination({
        type: DEST_PKH,
        destinationBytes: fromBase58Check("RHCnxQP14Cug3JJJSUvoXM35suPw4ZqqAa").hash
      }),
      forCurrencyId: "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq", // vrsctest
      forAmountSats: new BN("500000000", 10),
      expiryHeight: new BN("1135109", 10)
    });

    const details = new MarketplaceMakeOfferRequestDetails({
      offerDescription: "Sell Mostry@ for 5 VRSCTEST",
      offerParams
    });

    expect(details.containsOfferParams()).toBe(true);
    expect(details.containsRawTx()).toBe(false);
    expect(details.isValid()).toBe(true);
    expect(offerParams.isValid()).toBe(true);
    expect(new MarketplaceMakeOfferRequestDetails({ offerDescription: "desc only" }).isValid()).toBe(false);

    const request = new GenericRequest({
      details: [
        new MarketplaceMakeOfferRequestOrdinalVDXFObject({
          data: details,
          type: MARKETPLACE_MAKEOFFER_REQUEST_VDXF_ORDINAL
        })
      ]
    });

    const parsedReq = new GenericRequest();
    parsedReq.fromBuffer(request.toBuffer());

    const parsed = (parsedReq.details[0] as MarketplaceMakeOfferRequestOrdinalVDXFObject).data;
    expect(parsed.offerDescription).toBe("Sell Mostry@ for 5 VRSCTEST");
    expect(parsed.offerParams.offeredIdentityId).toBe("iN388XsmXaj7H3SLy5L1QgVztn99Yfv3b1");
    expect(parsed.offerParams.forCurrencyId).toBe("iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq");
    expect(parsed.offerParams.forAmountSats.toString(10)).toBe("500000000");
    expect(parsed.offerParams.expiryHeight.toString(10)).toBe("1135109");
    expect(parsed.offerParams.payoutDestination.getAddressString()).toBe("RHCnxQP14Cug3JJJSUvoXM35suPw4ZqqAa");

    // JSON round trip
    const json = parsed.toJson();
    const fromJson = MarketplaceMakeOfferRequestDetails.fromJson(json);
    expect(fromJson.toBuffer().toString('hex')).toBe(parsed.toBuffer().toString('hex'));
  });
});
