import { IdentityUpdateRequestDetails } from "../../vdxf/classes/identity/IdentityUpdateRequestDetails";
import { IdentityUpdateResponseDetails } from "../../vdxf/classes/identity/IdentityUpdateResponseDetails";
import { ContentMultiMap } from "../../pbaas";
import { PartialSignData } from "../../pbaas/PartialSignData";
import { 
  TEST_BASE_SIGN_DATA_WITH_MMR_DATA, 
  TEST_CLI_ID_UPDATE_REQUEST_JSON, 
  TEST_CLI_ID_UPDATE_REQUEST_JSON_HEX,
  TEST_EXPIRYHEIGHT, 
  TEST_MMR_DATA, 
  TEST_PARTIAL_IDENTITY, 
  TEST_REQUESTID,
  TEST_SIGNDATA_MAP,
  TEST_SYSTEMID, 
  TEST_TXID 
} from "../constants/fixtures";

describe("IdentityUpdate request/response details Serialization", () => {
  function testSerialization(instance: any) {
    const fromBufferInstance = new instance.constructor();
    fromBufferInstance.fromBuffer(instance.toBuffer());
    expect(fromBufferInstance.toBuffer().toString("hex")).toBe(instance.toBuffer().toString("hex"));
  }

  function testJsonSerialization(instance: any) {
    const json = instance.toJson();
    const fromJsonInstance = instance.constructor.fromJson(json);
    const newJson = fromJsonInstance.toJson();

    expect(newJson).toEqual(json);
  }

  function testCLIJsonSerialization(instance: IdentityUpdateRequestDetails) {
    const cliJson = instance.toCLIJson();

    const fromCLIJsonInstance = IdentityUpdateRequestDetails.fromCLIJson(cliJson);
    
    expect(fromCLIJsonInstance.toCLIJson()).toEqual(cliJson);
  }

  test("Serialize/Deserialize basic IdentityUpdateRequestDetails", () => {
    const requestDetails = new IdentityUpdateRequestDetails({ 
      requestID: TEST_REQUESTID,
      systemID: TEST_SYSTEMID, 
      identity: TEST_PARTIAL_IDENTITY, 
      expiryHeight: TEST_EXPIRYHEIGHT,
      signDataMap: TEST_SIGNDATA_MAP
    });

    testSerialization(requestDetails);
    expect(() => requestDetails.toCLIJson()).toThrow('Prior-MMR combination');
  });

  test("Serialize/Deserialize basic IdentityUpdateResponseDetails", () => {
    const responseDetails = new IdentityUpdateResponseDetails({ requestID: TEST_REQUESTID });

    testSerialization(responseDetails);
  });

  test("Remove optional fields from IdentityUpdateRequestDetails", () => {
    let baseRequestDetailsConfig = { 
      requestID: TEST_REQUESTID,
      systemID: TEST_SYSTEMID, 
      identity: TEST_PARTIAL_IDENTITY,
      expiryHeight: TEST_EXPIRYHEIGHT,
      signDataMap: TEST_SIGNDATA_MAP
    };

    const toRemove = ["expiryHeight", "signDataMap", "systemID"];

    for (let i = 0; i < toRemove.length + 1; i++) {
      const newRequestDetails = new IdentityUpdateRequestDetails({ ...baseRequestDetailsConfig });

      testSerialization(newRequestDetails);

      if (baseRequestDetailsConfig.signDataMap) {
        expect(() => newRequestDetails.toCLIJson()).toThrow('Prior-MMR combination');
      } else {
        testCLIJsonSerialization(newRequestDetails);
      }

      if (i < toRemove.length) {
        delete baseRequestDetailsConfig[toRemove[i]]
      }
    }
  });

  test("Remove optional fields from IdentityUpdateResponseDetails", () => {
    const txidbuf = Buffer.from(TEST_TXID, 'hex').reverse();
    let baseResponseDetailsConfig = { requestID: TEST_REQUESTID, txid: txidbuf };
   
    const toRemove = ["txid"];

    for (let i = 0; i < toRemove.length + 1; i++) {
      const newResponseDetails = new IdentityUpdateResponseDetails({ ...baseResponseDetailsConfig });

      testSerialization(newResponseDetails);

      if (i < toRemove.length) {
        delete baseResponseDetailsConfig[toRemove[i]]
      }
    }
  });

  test("Serialize/Deserialize IdentityUpdateRequestDetails to/from JSON", () => {
    const requestDetails = new IdentityUpdateRequestDetails({ 
      requestID: TEST_REQUESTID,
      systemID: TEST_SYSTEMID, 
      identity: TEST_PARTIAL_IDENTITY, 
      expiryHeight: TEST_EXPIRYHEIGHT,
      signDataMap: TEST_SIGNDATA_MAP
    });

    testJsonSerialization(requestDetails);
    expect(() => requestDetails.toCLIJson()).toThrow('Prior-MMR combination');
  });

  test("Serialize/Deserialize IdentityUpdateResponseDetails to/from JSON", () => {
    const txidbuf = Buffer.from(TEST_TXID, 'hex').reverse();

    let baseResponseDetailsConfig = { requestID: TEST_REQUESTID, txid: txidbuf };

    const responseDetails = new IdentityUpdateResponseDetails(baseResponseDetailsConfig);

    testJsonSerialization(responseDetails);
  });

  test("Serialize/Deserialize IdentityUpdateRequestDetails to/from JSON", () => {
    const requestDetails = new IdentityUpdateRequestDetails({ 
      requestID: TEST_REQUESTID,
      systemID: TEST_SYSTEMID, 
      identity: TEST_PARTIAL_IDENTITY, 
      expiryHeight: TEST_EXPIRYHEIGHT,
      signDataMap: TEST_SIGNDATA_MAP
    });

    testJsonSerialization(requestDetails);
    expect(() => requestDetails.toCLIJson()).toThrow('Prior-MMR combination');
  });

  test("Serialize/Deserialize IdentityUpdateResponseDetails to/from JSON", () => {
    const responseDetails = new IdentityUpdateResponseDetails({ 
      requestID: TEST_REQUESTID,
      txid: Buffer.from(TEST_TXID, 'hex').reverse()
    });

    testJsonSerialization(responseDetails);
  });

  test("Serialize/Deserialize PartialIdentity to/from JSON", () => {
    testJsonSerialization(TEST_PARTIAL_IDENTITY);
  });

  test("Serialize/Deserialize PartialSignData to/from JSON", () => {
    const partialSignData = new PartialSignData(TEST_BASE_SIGN_DATA_WITH_MMR_DATA);
    testJsonSerialization(partialSignData);
  });

  test("Serialize/Deserialize PartialMMRData to/from JSON", () => {
    testJsonSerialization(TEST_MMR_DATA);
  });

  test("Serialize/Deserialize ContentMultiMap to/from JSON", () => {
    const contentMultiMap = ContentMultiMap.fromJson({
      "iPsFBfFoCcxtuZNzE8yxPQhXVn4dmytf8j": [
        { "iK7a5JNJnbeuYWVHCDRpJosj3irGJ5Qa8c": "Test String 123454321" }
      ]
    });

    testJsonSerialization(contentMultiMap);
  });

  test("Set txid from string sets buffer and flag", () => {
    const requestDetails = new IdentityUpdateRequestDetails({ 
      identity: TEST_PARTIAL_IDENTITY
    });

    requestDetails.setTxidFromString(TEST_TXID);

    expect(requestDetails.containsTxid()).toBe(true);
    expect(requestDetails.getTxidString()).toBe(TEST_TXID);
    expect(requestDetails.txid?.toString("hex")).toBe(Buffer.from(TEST_TXID, "hex").reverse().toString("hex"));
  });

  test("Set response txid from string sets buffer and flag", () => {
    const responseDetails = new IdentityUpdateResponseDetails({ 
      requestID: TEST_REQUESTID
    });

    responseDetails.setTxidFromString(TEST_TXID);

    expect(responseDetails.containsTxid()).toBe(true);
    expect(responseDetails.getTxidString()).toBe(TEST_TXID);
    expect(responseDetails.txid?.toString("hex")).toBe(Buffer.from(TEST_TXID, "hex").reverse().toString("hex"));
  });

  test('rejects CLI request metadata that the partial MMR envelope cannot retain', () => {
    const original = JSON.stringify(TEST_CLI_ID_UPDATE_REQUEST_JSON);

    expect(() => IdentityUpdateRequestDetails.fromCLIJson(
      TEST_CLI_ID_UPDATE_REQUEST_JSON
    )).toThrow('exactly one supported data key');
    expect(JSON.stringify(TEST_CLI_ID_UPDATE_REQUEST_JSON)).toBe(original);
  });

  test('round-trips supported MMR data through an identity update envelope', () => {
    const req = IdentityUpdateRequestDetails.fromCLIJson({
      name: 'data',
      contentmultimap: {
        i5CXAPoCLothTntExgvc5kK38u2wyHtFCg: {
          data: { createmmr: true, mmrdata: [{ serializedhex: '616263' }] },
        },
      },
    });

    testCLIJsonSerialization(req);
    testJsonSerialization(req);
    testSerialization(req);
  });

  test("Deserialize cli identity update details", () => {
    const req = IdentityUpdateRequestDetails.fromCLIJson(
      TEST_CLI_ID_UPDATE_REQUEST_JSON_HEX, 
      {
        systemid: TEST_SYSTEMID.toAddress() as string, 
        requestid: TEST_REQUESTID.toJson(),
        expiryheight: TEST_EXPIRYHEIGHT.toString(), 
        txid: TEST_TXID
      }
    );

    testCLIJsonSerialization(req);
    testJsonSerialization(req);
    testSerialization(req);
  })

  test("Deserialize cli identity update details", () => {
    const detailsProps = {
      requestID: TEST_REQUESTID.toJson(),
      expiryHeight: TEST_EXPIRYHEIGHT.toString(), 
      txid: TEST_TXID
    };

    expect(IdentityUpdateRequestDetails.fromCLIJson(
      { name: "data" }, 
      detailsProps
    ).getIdentityAddress()).toEqual("iHhi8aSwJcA5SzP2jE2M3wcsuVcnMdh6Fr");

    expect(IdentityUpdateRequestDetails.fromCLIJson(
      { name: "Mozek86", parent: "iQ2TqQot9W7mLrcCRJKnAZmaPTTY6sx4S4" }, 
      detailsProps
    ).getIdentityAddress()).toEqual("i6joVUtMohssU9pFAwojYrZfF9EmyAB95K");

    expect(IdentityUpdateRequestDetails.fromCLIJson(
      { name: "VRSC" }, 
      detailsProps
    ).getIdentityAddress()).toEqual("i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV");
    
    expect(IdentityUpdateRequestDetails.fromCLIJson(
      { name: "VRSCTEST" }, 
      detailsProps
    ).getIdentityAddress()).toEqual("iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq");
  })
});
