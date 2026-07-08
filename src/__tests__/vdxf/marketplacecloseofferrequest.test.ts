import { MarketplaceCloseOfferRequestDetails, MarketplaceCloseOfferRequestOrdinalVDXFObject, GenericRequest } from "../../vdxf/classes";
import { MarketplaceCloseOfferParams } from "../../vdxf/classes/request/MarketplaceCloseOfferRequestDetails";
import { MARKETPLACE_CLOSEOFFER_REQUEST_VDXF_ORDINAL } from "../../constants/ordinals/ordinals";

describe("MarketplaceCloseOfferRequestDetails", () => {
  it("should serialize and deserialize correctly", () => {
    const closeOfferParams = new MarketplaceCloseOfferParams({
      offerTxid: "3d6a4705".repeat(8)
    });

    const details = new MarketplaceCloseOfferRequestDetails({
      offerDescription: "Unlist Mostry@",
      closeOfferParams
    });

    const ordinalObj = new MarketplaceCloseOfferRequestOrdinalVDXFObject({
      data: details,
      type: MARKETPLACE_CLOSEOFFER_REQUEST_VDXF_ORDINAL
    });

    const buffer = ordinalObj.toBuffer();
    const parsedObj = new MarketplaceCloseOfferRequestOrdinalVDXFObject();
    parsedObj.fromBuffer(buffer);

    expect(parsedObj.data.offerDescription).toBe("Unlist Mostry@");
    expect(parsedObj.data.closeOfferParams.offerTxid).toBe(closeOfferParams.offerTxid);
  });

  it("should embed correctly into GenericRequest", () => {
    const closeOfferParams = new MarketplaceCloseOfferParams({
      offerTxid: "844a2e3d".repeat(8)
    });

    const details = new MarketplaceCloseOfferRequestDetails({
      closeOfferParams
    });

    const ordinalObj = new MarketplaceCloseOfferRequestOrdinalVDXFObject({
      data: details,
      type: MARKETPLACE_CLOSEOFFER_REQUEST_VDXF_ORDINAL
    });

    const request = new GenericRequest({
      details: [ordinalObj]
    });

    const reqBuffer = request.toBuffer();
    const parsedReq = new GenericRequest();
    parsedReq.fromBuffer(reqBuffer);

    expect(parsedReq.details.length).toBe(1);
    const parsedDetails = parsedReq.details[0] as MarketplaceCloseOfferRequestOrdinalVDXFObject;
    expect(parsedDetails.data.closeOfferParams.offerTxid).toBe(closeOfferParams.offerTxid);
  });

  it("requires closeOfferParams to be present and valid", () => {
    expect(new MarketplaceCloseOfferRequestDetails({ offerDescription: "desc only" }).isValid()).toBe(false);

    const invalidParams = new MarketplaceCloseOfferParams({ offerTxid: "not-a-txid" });
    expect(invalidParams.isValid()).toBe(false);
    expect(new MarketplaceCloseOfferRequestDetails({ closeOfferParams: invalidParams }).isValid()).toBe(false);

    const validParams = new MarketplaceCloseOfferParams({
      offerTxid: "a1b2c3d4".repeat(8)
    });
    expect(validParams.isValid()).toBe(true);
    expect(new MarketplaceCloseOfferRequestDetails({ closeOfferParams: validParams }).isValid()).toBe(true);
  });

  it("round-trips through JSON", () => {
    const closeOfferParams = new MarketplaceCloseOfferParams({
      offerTxid: "a1b2c3d4".repeat(8)
    });

    const details = new MarketplaceCloseOfferRequestDetails({
      offerDescription: "Unlist Mostry@",
      closeOfferParams
    });

    const json = details.toJson();
    const fromJson = MarketplaceCloseOfferRequestDetails.fromJson(json);

    expect(fromJson.toBuffer().toString('hex')).toBe(details.toBuffer().toString('hex'));
  });
});
