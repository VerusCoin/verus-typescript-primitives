import { Credential } from "../../pbaas/Credential";
import {IDENTITY_CREDENTIAL_PLAINLOGIN} from "../../vdxf/keys";

const verifyCredentialSerialization = (c: Credential) => {
  const cFromBuf = new Credential();
  cFromBuf.fromBuffer(c.toBuffer());

  expect(cFromBuf.isValid()).toBe(true);
  expect(cFromBuf).toEqual(c);

  // Test JSON serialization and deserialization.
  const cJson = c.toJSON();
  const cFromJson = Credential.fromJSON(cJson);

  expect(cFromJson.isValid()).toBe(true);
  expect(cFromJson).toEqual(c);
};

describe('Serializes and deserializes Credential', () => {
  test('(de)serialize Credential without label', () => {
    const c = new Credential({
      version: Credential.VERSION_CURRENT,
      credentialKey: IDENTITY_CREDENTIAL_PLAINLOGIN.vdxfid,
      credential: ["myname", "mypassword"],
      scopes: ["CardUsingApplication@"],
    });

    verifyCredentialSerialization(c);
  });

  test('(de)serialize Credential with label', () => {
    const c = new Credential({
      version: Credential.VERSION_CURRENT,
      credentialKey: IDENTITY_CREDENTIAL_PLAINLOGIN.vdxfid,
      credential: ["terrible name", "terrible password 1"],
      scopes: ["MailService@", "SecondaryMailService@"],
      label: "hint: bad",
    });

    verifyCredentialSerialization(c);
  });

  test('Credential with invalid version', () => {
    const c = new Credential({
      version: Credential.VERSION_INVALID,
    });

    expect(c.isValid()).toBe(false);
  });

  test('(de)serialize Credential with JSON object credential and scopes', () => {
    const c = new Credential({
      version: Credential.VERSION_CURRENT,
      credentialKey: "iHdfNK2nkKsxWAdRYToBpDRHFU9EnJGSG4",
      credential: {
        "first": "thing",
        "second": "mypassword"
      },
      scopes: {
        "place": "Location"
      },
    });

    verifyCredentialSerialization(c);
  });

  test('(de)serialize Credential with String credential and scopes', () => {
    const c = new Credential({
      version: Credential.VERSION_CURRENT,
      credentialKey: "iHdfNK2nkKsxWAdRYToBpDRHFU9anJGSG4",
      credential: "cred",
      scopes: "scope@"
    });

    verifyCredentialSerialization(c);
  });

  test('create Credential from and to JSON using fromJSON and toJson', () => {
    const credential = ["testuser", "testpass"];
    const scopes = ["TestService@"];
    const label = "test credential";

    const credentialJSON = {
      version: Credential.VERSION_CURRENT.toNumber(),
      credentialkey: IDENTITY_CREDENTIAL_PLAINLOGIN.vdxfid,
      credential: credential,
      scopes: scopes,
      label: label,
      flags: Credential.FLAG_LABEL_PRESENT.toNumber()
    };

    const c = Credential.fromJSON(credentialJSON);
    
    expect(c.isValid()).toBe(true);
    expect(c.version).toStrictEqual(Credential.VERSION_CURRENT);
    expect(c.credentialKey).toBe(IDENTITY_CREDENTIAL_PLAINLOGIN.vdxfid);
    expect(c.credential).toEqual(credential);
    expect(c.scopes).toEqual(scopes);
    expect(c.label).toBe(label);
    expect(c.hasLabel()).toBe(true);

    // Test toJson instead of toJSON as the other tests check it.
    expect(credentialJSON).toStrictEqual(c.toJson());
  });
});