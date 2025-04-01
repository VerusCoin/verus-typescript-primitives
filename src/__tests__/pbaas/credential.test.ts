import { Credential } from "../../pbaas/Credential";
import {IDENTITY_CREDENTIAL_USERNAME, IDENTITY_CREDENTIAL_PASSWORD} from "../../vdxf/keys";

describe('Serializes and deserializes Credential', () => {
  test('(de)serialize Credential without label', () => {
    const c = new Credential({
      version: Credential.VERSION_CURRENT,
      credentialKey: IDENTITY_CREDENTIAL_USERNAME.vdxfid,
      credential: "myname",
      scopes: "CardUsingApplication@",
    });

    const cFromBuf = new Credential();
    cFromBuf.fromBuffer(c.toBuffer());

    expect(cFromBuf.toBuffer().toString('hex')).toBe(c.toBuffer().toString('hex'));
    expect(cFromBuf.isValid());
    expect(!cFromBuf.hasLabel());
    expect(cFromBuf.calcFlags() !== Credential.FLAG_LABEL_PRESENT);
  });

  test('(de)serialize Credential with label', () => {
    const c = new Credential({
      version: Credential.VERSION_CURRENT,
      credentialKey: IDENTITY_CREDENTIAL_PASSWORD.vdxfid,
      credential: "terrible password 1",
      scopes: "MailService@",
      label: "hint: bad",
    });

    const cFromBuf = new Credential();
    cFromBuf.fromBuffer(c.toBuffer());

    expect(cFromBuf.toBuffer().toString('hex')).toBe(c.toBuffer().toString('hex'));
    expect(cFromBuf.isValid());
    expect(cFromBuf.hasLabel());
    expect(cFromBuf.calcFlags() === Credential.FLAG_LABEL_PRESENT);
  });
});