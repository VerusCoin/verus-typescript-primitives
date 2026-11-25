import {
  CompactIAddressObject,
  ContentMultiMap,
  DELEGATOR_PROFILE_VDXF_KEY,
  FqnContentMultiMap,
  KvContent,
  ProfileMediaKey,
  UnsupportedDelegatorProfileError,
  assertDelegatorProfileSupportedV1,
} from "../index";

const profileKey = DELEGATOR_PROFILE_VDXF_KEY.vdxfid;
const profileName = DELEGATOR_PROFILE_VDXF_KEY.qualifiedname.name;

describe("v1 delegator profile compatibility", () => {
  test("accepts an effective map without the reserved key", () => {
    expect(() => assertDelegatorProfileSupportedV1({})).not.toThrow();
    expect(() =>
      assertDelegatorProfileSupportedV1(Object.create(null))
    ).not.toThrow();
    expect(() =>
      assertDelegatorProfileSupportedV1({
        [ProfileMediaKey.vdxfid]: ["deadbeef"],
        "vrsc::identity.profile.custom": null,
        "vrsctest::identity.profile.delegator": ["00"],
      })
    ).not.toThrow();
  });

  test.each([
    ["null", null],
    ["undefined", undefined],
    ["empty string", ""],
    ["empty vector", []],
    ["empty object", {}],
    ["false", false],
    ["zero", 0],
    ["opaque serialized bytes", ["deadbeef"]],
    ["encrypted descriptor", [{ encrypted: true, data: "aabbccdd" }]],
    ["malformed data", "not serialized profile data"],
    ["future profile version", [{ version: 999, restrictions: {} }]],
    ["multiple values", ["00", "11"]],
  ])("rejects a present key with %s", (_description, value) => {
    expect(() =>
      assertDelegatorProfileSupportedV1({ [profileKey]: value })
    ).toThrow(UnsupportedDelegatorProfileError);
  });

  test.each([
    ["canonical address", profileKey],
    ["qualified name", profileName],
    ["case-normalized qualified name", "vrsc::IDENTITY.PROFILE.DELEGATOR"],
  ])("recognizes the %s key representation", (_description, key) => {
    expect(() =>
      assertDelegatorProfileSupportedV1({ [key]: null })
    ).toThrow(UnsupportedDelegatorProfileError);
  });

  test.each([profileKey, profileName])(
    "reports unsupported when %s follows a malformed sibling key",
    (key) => {
      const raw = { "not-a-cmm-key": null, [key]: undefined };
      expect(() => assertDelegatorProfileSupportedV1(raw)).toThrow(
        UnsupportedDelegatorProfileError
      );
    }
  );

  test("recognizes a non-enumerable own qualified-name key", () => {
    const raw = Object.defineProperty({}, profileName, {
      enumerable: false,
      value: null,
    });
    expect(() => assertDelegatorProfileSupportedV1(raw)).toThrow(
      UnsupportedDelegatorProfileError
    );
  });

  test("exposes a stable unsupported error without including profile contents", () => {
    const secret = "profile-value-must-not-be-in-error";
    let caught: unknown;
    try {
      assertDelegatorProfileSupportedV1({ [profileKey]: secret });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(Error);
    expect(caught).toBeInstanceOf(UnsupportedDelegatorProfileError);
    expect(caught).toMatchObject({
      name: "UnsupportedDelegatorProfileError",
      code: "UNSUPPORTED_DELEGATOR_PROFILE",
    });
    expect((caught as Error).message).not.toContain(secret);
  });

  test("checks raw presence before a null value can be discarded by decoding", () => {
    const raw = { [profileKey]: null };
    expect(ContentMultiMap.fromJson(raw).kvContent.hasAddress(profileKey)).toBe(
      false
    );
    expect(() => assertDelegatorProfileSupportedV1(raw)).toThrow(
      UnsupportedDelegatorProfileError
    );
  });

  test("does not read or decode profile values", () => {
    const readValue = jest.fn(() => {
      throw new Error("Profile value must remain opaque");
    });
    const raw = Object.defineProperty({}, profileKey, {
      enumerable: true,
      get: readValue,
    });

    expect(() => assertDelegatorProfileSupportedV1(raw)).toThrow(
      UnsupportedDelegatorProfileError
    );
    expect(readValue).not.toHaveBeenCalled();
  });

  test("does not parse unrelated values or search their nested keys", () => {
    const readValue = jest.fn(() => {
      throw new Error("Unrelated metadata must remain opaque");
    });
    const raw = Object.defineProperty({}, ProfileMediaKey.vdxfid, {
      enumerable: true,
      get: readValue,
    });
    expect(() => assertDelegatorProfileSupportedV1(raw)).not.toThrow();
    expect(readValue).not.toHaveBeenCalled();
    expect(() =>
      assertDelegatorProfileSupportedV1({
        [ProfileMediaKey.vdxfid]: [{ [profileKey]: "00" }],
      })
    ).not.toThrow();
  });

  test("recognizes a key on a null-prototype RPC map", () => {
    const raw = Object.create(null);
    raw[profileKey] = undefined;
    expect(() => assertDelegatorProfileSupportedV1(raw)).toThrow(
      UnsupportedDelegatorProfileError
    );
  });

  test.each([ContentMultiMap, FqnContentMultiMap])(
    "handles effective %p maps with address and FQN keys",
    (MapType) => {
      for (const key of [
        CompactIAddressObject.fromAddress(profileKey),
        CompactIAddressObject.fromFQN(profileName),
      ]) {
        const values = new KvContent();
        const map = new MapType({ kvContent: values });
        expect(() => assertDelegatorProfileSupportedV1(map)).not.toThrow();

        values.set(key, []);
        expect(() => assertDelegatorProfileSupportedV1(map)).toThrow(
          UnsupportedDelegatorProfileError
        );

        // A complete effective view after removal is eligible again. The guard
        // does not treat historical presence as a permanent latch.
        values.deleteByAddress(profileKey);
        expect(() => assertDelegatorProfileSupportedV1(map)).not.toThrow();
      }
    }
  );

  test.each([
    ["missing", undefined],
    ["null", null],
    ["array", []],
    ["string", "{}"],
    ["number", 0],
    ["boolean", false],
    ["bytes", Buffer.alloc(0)],
    ["Date", new Date(0)],
    ["Map", new Map()],
    ["RPC response envelope", { result: { identity: { contentmultimap: {} } } }],
    ["RPC result", { identity: { contentmultimap: {} } }],
    ["identity JSON", { contentmultimap: {} }],
    ["uninitialized ContentMultiMap", new ContentMultiMap()],
  ])("does not mistake %s input for an absent profile", (_description, input) => {
    expect(() => assertDelegatorProfileSupportedV1(input as any)).toThrow();
  });
});
