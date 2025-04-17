import { Credential } from "../../pbaas/Credential";
import {IDENTITY_CREDENTIAL_PLAINLOGIN} from "../../vdxf/keys";

const verifyCredentialSerialization = (c: Credential) => {
  const cFromBuf = new Credential();
    cFromBuf.fromBuffer(c.toBuffer());

    expect(cFromBuf.toBuffer().toString('hex')).toBe(c.toBuffer().toString('hex'));
    expect(cFromBuf.isValid());
    expect(!cFromBuf.hasLabel());
    expect(cFromBuf.calcFlags() !== Credential.FLAG_LABEL_PRESENT);
    expect(cFromBuf).toEqual(c);
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
});