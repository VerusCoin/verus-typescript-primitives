import { SignDataArgs, SignDataRequest } from "../../api/classes/SignData/SignDataRequest";
import { DataDescriptorInfo } from "../../utils/types/DataDescriptor";
import { SignDataParameters } from "../../utils/types/SignData";

const chain = "VRSC";
const address = "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq";

describe("signdata request JSON fields", () => {
  test("accepts and preserves daemon nested data and metadata names", () => {
    // wallet/rpcwallet.cpp GetDataMessage reads serializedhex/serializedbase64;
    // signdata reads the item's label and mimetype when creating its descriptor.
    const args: SignDataArgs = {
      address,
      createmmr: true,
      mmrdata: [
        { serializedhex: "00", label: "binary", mimetype: "application/octet-stream" },
        { serializedbase64: "aGVsbG8=", mimetype: "text/plain" },
        { message: "hello", mimetype: "text/plain" },
        { filename: "data.bin" },
        { datahash: "00".repeat(32) },
        { vdxfdata: "00" },
      ],
    };
    const request = new SignDataRequest(chain, args);
    const restored = SignDataRequest.fromJson(JSON.parse(JSON.stringify(request.toJson())));

    expect(request.getParams()).toEqual([args]);
    expect(restored.getParams()).toEqual([args]);
  });

  test.each<SignDataParameters>([{ messagehex: "00" }, { messagebase64: "aGVsbG8=" }])(
    "preserves valid top-level signing fields %j",
    (data) => {
      const args: SignDataArgs = { address, ...data };
      const request = new SignDataRequest(chain, args);
      const restored = SignDataRequest.fromJson(JSON.parse(JSON.stringify(request.toJson())));
      expect(restored.getParams()).toEqual([args]);
    }
  );

  test("does not advertise top-level names or raw descriptors as nested signing inputs", () => {
    // @ts-expect-error Nested hex input uses serializedhex.
    const hex: SignDataArgs = { mmrdata: [{ messagehex: "00" }] };
    // @ts-expect-error Nested base64 input uses serializedbase64.
    const base64: SignDataArgs = { mmrdata: [{ messagebase64: "AA==" }] };
    // @ts-expect-error Daemon JSON metadata uses lowercase mimetype.
    const mime: SignDataArgs = { mmrdata: [{ message: "hello", mimeType: "text/plain" }] };
    // @ts-expect-error A raw descriptor is not a GetDataMessage input.
    const descriptor: SignDataArgs = { mmrdata: [{ objectdata: "00" }] };

    expect([hex, base64, mime, descriptor]).toHaveLength(4);
  });

  test("models daemon descriptor MIME metadata with lowercase mimetype", () => {
    const descriptor: DataDescriptorInfo = { objectdata: "00", mimetype: "application/octet-stream" };
    expect(JSON.parse(JSON.stringify(descriptor)).mimetype).toBe("application/octet-stream");
    // @ts-expect-error CDataDescriptor::ToUniValue emits mimetype, not mimeType.
    const legacy: DataDescriptorInfo = { mimeType: "text/plain" };
    expect(legacy).toBeDefined();
  });
});
