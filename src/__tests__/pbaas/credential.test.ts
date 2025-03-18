import { Credential } from "../../pbaas/Credential";

describe('Serializes and deserializes Credential', () => {
  test('(de)serialize Credential without note', () => {
    const c = new Credential({
      version: Credential.VERSION_CURRENT,
      credentialType: Credential.CREDENTIAL_CARD_SECURITY_CODE,
      credential: "481",
      recipient: "CardUsingApplication@",
    });

    const cFromBuf = new Credential();
    cFromBuf.fromBuffer(c.toBuffer());

    expect(cFromBuf.toBuffer().toString('hex')).toBe(c.toBuffer().toString('hex'));
    expect(cFromBuf.isValid());
  });

  test('(de)serialize Credential without note', () => {
    const c = new Credential({
      version: Credential.VERSION_CURRENT,
      credentialType: Credential.CREDENTIAL_DATE_OF_BIRTH,
      credential: "2025-03-14",
      recipient: "DeliveryService@",
      note: "YY-MM-DD",
    });

    const cFromBuf = new Credential();
    cFromBuf.fromBuffer(c.toBuffer());

    expect(cFromBuf.toBuffer().toString('hex')).toBe(c.toBuffer().toString('hex'));
    expect(cFromBuf.isValid());
  });
});