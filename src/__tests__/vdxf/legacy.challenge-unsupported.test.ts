import { IDENTITY_VIEW } from '../../vdxf';
import { AltAuthFactor, Attestation, Audience, Challenge, RequestedPermission } from '../../vdxf/classes/Challenge';
import { Request } from '../../vdxf/classes/Request';
import { ProvisioningChallenge } from '../../vdxf/classes/provisioning/ProvisioningChallenge';

const CHALLENGE = {
  challenge_id: 'iKNufKJdLX3Xg8qFru9AuLBvivAEJ88PW4',
  created_at: 1664382484,
  requested_access: [new RequestedPermission(IDENTITY_VIEW.vdxfid)],
};
const REQUEST = {
  system_id: 'i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV',
  signing_id: 'iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU',
  challenge: CHALLENGE,
};

describe.each([
  { field: 'requested_access_audience', value: new Audience('audience', IDENTITY_VIEW.vdxfid) },
  { field: 'alt_auth_factors', value: new AltAuthFactor('factor', IDENTITY_VIEW.vdxfid) },
])('legacy Challenge unsupported $field', ({ field, value }) => {
  test('rejects nonempty constructor input', () => {
    expect(() => new Challenge({ ...CHALLENGE, [field]: [value] })).toThrow(/unsupported/i);
    expect(() => new Request({
      ...REQUEST,
      challenge: { ...CHALLENGE, [field]: [value] },
    })).toThrow(/unsupported/i);
  });

  test('rejects public mutation before serialization, JSON export, or hashing', () => {
    const request = new Request(REQUEST);
    const challenge = request.challenge;
    Object.assign(challenge, { [field]: [value] });

    expect(() => challenge.dataByteLength()).toThrow(/unsupported/i);
    expect(() => challenge.toDataBuffer()).toThrow(/unsupported/i);
    expect(() => challenge.toBuffer()).toThrow(/unsupported/i);
    expect(() => challenge.toSha256()).toThrow(/unsupported/i);
    expect(() => challenge.toJson()).toThrow(/unsupported/i);
    expect(() => request.getChallengeHash(10000, 1)).toThrow(/unsupported/i);
    expect(() => request.getChallengeHash(10000, 2)).toThrow(/unsupported/i);
  });

  test('rejects inherited unsupported fields in provisioning JSON', () => {
    const challenge = new ProvisioningChallenge();
    Object.assign(challenge, { [field]: [value] });

    expect(() => challenge.toJson()).toThrow(/unsupported/i);
  });
});

test.each([
  { name: 'omitted', fields: {} },
  { name: 'null', fields: { requested_access_audience: null, alt_auth_factors: null } },
  { name: 'empty', fields: { requested_access_audience: [], alt_auth_factors: [] } },
])('accepts $name unsupported arrays without changing supported bytes or hashes', ({ fields }) => {
  const baseline = new Request(REQUEST);
  const request = new Request({ ...REQUEST, challenge: { ...CHALLENGE, ...fields } });

  expect(() => request.challenge.toJson()).not.toThrow();
  expect(request.toBuffer()).toEqual(baseline.toBuffer());
  expect(request.getChallengeHash(10000)).toEqual(baseline.getChallengeHash(10000));
});

test('preserves supported Challenge attestations in the wire round trip', () => {
  const attestation = new Attestation('supported claim', IDENTITY_VIEW.vdxfid);
  const challenge = new Challenge({ ...CHALLENGE, attestations: [attestation] });
  const wire = challenge.toBuffer();
  const restored = new Challenge();

  expect(restored.fromBuffer(wire)).toBe(wire.length);
  expect(restored.attestations.map(value => value.toJson())).toEqual([attestation.toJson()]);
  expect(restored.toJson().attestations).toHaveLength(1);
  expect(restored.toBuffer()).toEqual(wire);
  expect(restored.toSha256()).toEqual(challenge.toSha256());
});
