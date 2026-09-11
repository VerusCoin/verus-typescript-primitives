import { Response } from '../../vdxf/classes/Response';
import { ProvisioningRequest } from '../../vdxf/classes/provisioning/ProvisioningRequest';
import { ProvisioningResponse } from '../../vdxf/classes/provisioning/ProvisioningResponse';
import { ProvisioningResult } from '../../vdxf/classes/provisioning/ProvisioningResult';
import { LOGIN_CONSENT_PROVISIONING_RESULT_STATE_PENDINGAPPROVAL } from '../../vdxf/keys';

const systemId = 'i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV';
const identityId = 'iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU';
const salt = 'i6NawEzHMocZnU4h8pPkGpHApvsrHjxwXE';
const parent = 'iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq';

function expectSignedBytesPreserved(original: Response, restored: Response) {
  expect(restored.decision.toBuffer()).toEqual(original.decision.toBuffer());
  expect(restored.toBuffer()).toEqual(original.toBuffer());
  for (const signatureVersion of [1, 2]) {
    expect(restored.getDecisionHash(10000, signatureVersion))
      .toEqual(original.getDecisionHash(10000, signatureVersion));
  }
}

describe('Legacy response JSON preserves supported decision state', () => {
  test.each([true, false])('preserves a nondefault salt and skipped=%s', skipped => {
    const original = new Response({
      system_id: systemId,
      signing_id: identityId,
      decision: {
        decision_id: identityId,
        created_at: 2,
        salt,
        skipped,
        request: {
          system_id: systemId,
          signing_id: identityId,
          challenge: { challenge_id: identityId, created_at: 1 },
        },
      },
    });

    const json = JSON.parse(JSON.stringify(original.toJson()));
    expect(json.decision.salt).toBe(salt);
    expect(json.decision.skipped).toBe(skipped);
    const restored = new Response(json);

    expect(restored.decision.salt).toBe(salt);
    expect(restored.decision.skipped).toBe(skipped);
    expectSignedBytesPreserved(original, restored);
  });

  test('preserves a provisioning result parent in the signed decision', () => {
    const original = new ProvisioningResponse({
      system_id: systemId,
      signing_id: identityId,
      decision: {
        decision_id: identityId,
        created_at: 2,
        request: new ProvisioningRequest({
          signing_address: 'RYQbUr9WtRRAnMjuddZGryrNEpFEV1h8ph',
          challenge: { challenge_id: identityId, created_at: 1, name: 'example' },
        }),
        result: new ProvisioningResult({
          state: LOGIN_CONSENT_PROVISIONING_RESULT_STATE_PENDINGAPPROVAL.vdxfid,
          parent,
        }),
      },
    });

    const json = JSON.parse(JSON.stringify(original.toJson()));
    expect(json.decision.result.parent).toBe(parent);
    const restored = new ProvisioningResponse(json);

    expect(restored.decision).toMatchObject({ result: { parent } });
    expectSignedBytesPreserved(original, restored);
  });
});
