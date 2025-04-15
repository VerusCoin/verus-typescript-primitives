import { Credential } from "../../pbaas/Credential";
import {IDENTITY_CREDENTIAL_PLAINLOGIN} from "../../vdxf/keys";

describe('Serializes and deserializes Credential', () => {
  test('(de)serialize Credential without label', () => {
    const c = new Credential({
      version: Credential.VERSION_CURRENT,
      credentialKey: IDENTITY_CREDENTIAL_PLAINLOGIN.vdxfid,
      credential: ["myname", "mypassword"],
      scopes: ["CardUsingApplication@"],
    });

    const cFromBuf = new Credential();
    cFromBuf.fromBuffer(c.toBuffer());

    expect(cFromBuf.toBuffer().toString('hex')).toBe(c.toBuffer().toString('hex'));
    expect(cFromBuf.isValid());
    expect(!cFromBuf.hasLabel());
    expect(cFromBuf.calcFlags() !== Credential.FLAG_LABEL_PRESENT);
    expect(cFromBuf).toEqual(c);
  });

  test('(de)serialize Credential with label', () => {
    const c = new Credential({
      version: Credential.VERSION_CURRENT,
      credentialKey: IDENTITY_CREDENTIAL_PLAINLOGIN.vdxfid,
      credential: ["terrible name", "terrible password 1"],
      scopes: ["MailService@", "SecondaryMailService@"],
      label: "hint: bad",
    });

    const cFromBuf = new Credential();
    cFromBuf.fromBuffer(c.toBuffer());

    expect(cFromBuf.toBuffer().toString('hex')).toBe(c.toBuffer().toString('hex'));
    expect(cFromBuf.isValid());
    expect(cFromBuf.hasLabel());
    expect(cFromBuf.calcFlags() === Credential.FLAG_LABEL_PRESENT);
    expect(cFromBuf).toEqual(c);
  });
});