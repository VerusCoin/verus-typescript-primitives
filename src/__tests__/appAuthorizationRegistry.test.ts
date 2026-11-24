import { BN } from "bn.js";
import {
  APP_AUTHORIZATION_REQUEST_VDXF_KEY,
  APP_AUTHORIZATION_RESPONSE_VDXF_KEY,
  IDENTITY_CREDENTIAL_APPLICATION_AUTHORIZATION,
  IDENTITY_CREDENTIAL_APPLICATION_AUTHORIZATION_STORAGE_BINDING,
  DELEGATOR_PROFILE_VDXF_KEY,
  AppAuthorizationRequestDetails,
  AppAuthorizationResponseDetails,
  AppAuthorizationRequestOrdinalVDXFObject,
  AppAuthorizationResponseOrdinalVDXFObject,
  AuthorizationCredential,
  AuthorizationStorageBindingCredential,
  GenericRequest,
  GenericResponse,
  OrdinalVDXFObject,
  getDataKey,
  fromBase58Check,
  keymap,
  registerOrdinals,
} from "../index";

const keys = [
  APP_AUTHORIZATION_REQUEST_VDXF_KEY,
  APP_AUTHORIZATION_RESPONSE_VDXF_KEY,
  IDENTITY_CREDENTIAL_APPLICATION_AUTHORIZATION,
  IDENTITY_CREDENTIAL_APPLICATION_AUTHORIZATION_STORAGE_BINDING,
  DELEGATOR_PROFILE_VDXF_KEY,
];
const identity = APP_AUTHORIZATION_REQUEST_VDXF_KEY.vdxfid;

beforeAll(() => registerOrdinals());

test("delegator profile reservation retains its permanent outer key", () => {
  expect(DELEGATOR_PROFILE_VDXF_KEY.qualifiedname.name).toBe(
    "vrsc::identity.profile.delegator"
  );
  expect(DELEGATOR_PROFILE_VDXF_KEY.vdxfid).toBe(
    "iEt9qLvLckny1TVJz9ECTqXmktXKKM2sg9"
  );
  expect(keymap[DELEGATOR_PROFILE_VDXF_KEY.vdxfid]).toBe(
    DELEGATOR_PROFILE_VDXF_KEY
  );
  expect(fromBase58Check(DELEGATOR_PROFILE_VDXF_KEY.indexid)).toEqual({
    version: 137,
    hash: fromBase58Check(DELEGATOR_PROFILE_VDXF_KEY.vdxfid).hash,
  });
});

test("catalog keys match their qualified names and RPC hash byte order", () => {
  expect(new Set(keys.map((key) => key.vdxfid)).size).toBe(keys.length);
  for (const key of keys) {
    expect(getDataKey(key.qualifiedname.name)).toEqual({
      id: key.vdxfid,
      namespace: key.qualifiedname.namespace,
    });
    expect(fromBase58Check(key.vdxfid).hash.reverse().toString("hex")).toBe(
      key.hash160result
    );
  }
});

test("registered request and response ordinals round trip through envelopes", () => {
  const request = new AppAuthorizationRequestOrdinalVDXFObject({
    data: new AppAuthorizationRequestDetails(),
  });
  const response = new AppAuthorizationResponseOrdinalVDXFObject({
    data: new AppAuthorizationResponseDetails({
      outcome: 1,
      requestSigningSystemID: identity,
      delegateID: identity,
    }),
  });

  for (const value of [request, response]) {
    const bytes = value.toBuffer();
    const decoded = OrdinalVDXFObject.createFromBuffer(bytes);
    expect(decoded.offset).toBe(bytes.length);
    expect(decoded.obj.toBuffer()).toEqual(bytes);
    expect(decoded.obj.constructor).toBe(value.constructor);
  }

  expect(
    AppAuthorizationRequestOrdinalVDXFObject.fromJson(
      request.toJson() as any
    ).toBuffer()
  ).toEqual(request.toBuffer());
  expect(
    AppAuthorizationResponseOrdinalVDXFObject.fromJson(
      response.toJson() as any
    ).toBuffer()
  ).toEqual(response.toBuffer());

  const envelope = new GenericRequest({
    details: [request],
    flags: GenericRequest.BASE_FLAGS,
  });
  expect(GenericRequest.fromQrString(envelope.toQrString()).toBuffer()).toEqual(
    envelope.toBuffer()
  );
  expect(
    GenericRequest.fromWalletDeeplinkUri(
      envelope.toWalletDeeplinkUri()
    ).toBuffer()
  ).toEqual(envelope.toBuffer());
  const reply = new GenericResponse({
    details: [response],
    flags: GenericResponse.BASE_FLAGS,
  });
  const decodedReply = new GenericResponse();
  decodedReply.fromBuffer(reply.toBuffer());
  expect(decodedReply.toBuffer()).toEqual(reply.toBuffer());
});

test("typed credential codecs use their distinct registered keys by default", () => {
  const grant = new AuthorizationCredential({
    version: new BN(1),
    flags: new BN(0),
    grantID: "aa".repeat(32),
    signingSystemID: identity,
    delegateRevision: { txid: "bb".repeat(32), vout: 0 },
    delegatorRevision: { txid: "cc".repeat(32), vout: 1 },
  });
  const binding = new AuthorizationStorageBindingCredential({
    version: new BN(1),
    grantID: "aa".repeat(32),
    relationshipIndex: 0,
    storageSystemID: identity,
    storageID: identity,
  });
  expect(grant.toCredential().credentialKey).toBe(keys[2].vdxfid);
  expect(binding.toCredential().credentialKey).toBe(keys[3].vdxfid);
  expect(
    AuthorizationCredential.fromCredential(grant.toCredential()).toPayload()
  ).toEqual(grant.toPayload());
  expect(
    AuthorizationStorageBindingCredential.fromCredential(
      binding.toCredential()
    ).toPayload()
  ).toEqual(binding.toPayload());
  expect(() =>
    AuthorizationCredential.fromCredential(binding.toCredential())
  ).toThrow();
});
