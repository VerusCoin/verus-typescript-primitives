import {
  LOGIN_CONSENT_ATTESTATION_WEBHOOK_VDXF_KEY,
  PROFILE_DATA_VIEW_REQUEST,
  LOGIN_CONSENT_PERSONALINFO_WEBHOOK_VDXF_KEY,
  IDENTITY_VIEW,
  LOGIN_CONSENT_REDIRECT_VDXF_KEY,
  IDENTITY_PERSONALDETAILS,
  IDENTITY_CONTACTDETAILS,
  IDENTITY_LOCATION,
  IDENTITY_BANKINGDETAILS,
  IDENTITY_DOCUMENTS,
  ATTESTATION_PROVISION_TYPE,
  ATTESTATION_PROVISION_OBJECT
} from "../../vdxf";

import { Attestation, LoginConsentRequest } from "../../vdxf/classes";
import { RedirectUri, RequestedPermission } from "../../vdxf/classes/Challenge";
import { Context } from "../../vdxf/classes/Context";
import { Subject } from "../../vdxf/classes/Challenge";
import { DataDescriptor } from "../../pbaas/DataDescriptor";
import { toBase58Check, fromBase58Check } from '../../utils/address';

describe('Serializes and deserializes attestation request', () => {

  test("request profile information to Create an Attestation", async () => {

    const profileInfoRequest = new LoginConsentRequest({
      system_id: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
      signing_id: "iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU",
      signature: {
        signature:
          "AYG2IQABQSAN1fp6A9NIVbxvKuOVLLU+0I+G3oQGbRtS6u4Eampfb217Cdf5FCMScQhV9kMxtjI9GWzpchmjuiTB2tctk6qT",
      },
      challenge: {
        challenge_id: "iMqzCkWdebC19xbjkLfVdDkkGP9Ni1oxoN",
        requested_access: [
          new RequestedPermission(IDENTITY_VIEW.vdxfid),
          new RequestedPermission(PROFILE_DATA_VIEW_REQUEST.vdxfid, [IDENTITY_PERSONALDETAILS.vdxfid, IDENTITY_CONTACTDETAILS.vdxfid, IDENTITY_LOCATION.vdxfid, IDENTITY_BANKINGDETAILS.vdxfid, IDENTITY_DOCUMENTS.vdxfid]), 
          new RequestedPermission(LOGIN_CONSENT_PERSONALINFO_WEBHOOK_VDXF_KEY.vdxfid),
          new RequestedPermission(LOGIN_CONSENT_REDIRECT_VDXF_KEY.vdxfid),
        ],
        redirect_uris: [new RedirectUri(
          "https://example.com/sendpersonaldata",
          LOGIN_CONSENT_PERSONALINFO_WEBHOOK_VDXF_KEY.vdxfid)
        ],
        subject: [],
        provisioning_info: [], //<ATTESTATION_VDXF_KEY><ATTESTATION_TYPE_KEY_1><ATTESTATION_TYPE_KEY_2><ATTESTATION_TYPE_KEY_3><ATTESTATION_TYPE_KEY_4>
        created_at: Number((Date.now() / 1000).toFixed(0)),
      }
    });

    const serializedRequest = profileInfoRequest.toBuffer().toString('hex'); // Serialize the request to a hex string
    const newProfileInfoRequest = new LoginConsentRequest();

    newProfileInfoRequest.fromBuffer(Buffer.from(serializedRequest, 'hex')); // Deserialize the request from the hex string
    expect(serializedRequest).toStrictEqual(newProfileInfoRequest.toBuffer().toString('hex')) // Compare the original serialized request to the new serialized request
  });

  test("send attestation to a user", async () => {
    const req = new LoginConsentRequest({
      system_id: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
      signing_id: "iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU",
      signature: {
        signature:
          "AYG2IQABQSAN1fp6A9NIVbxvKuOVLLU+0I+G3oQGbRtS6u4Eampfb217Cdf5FCMScQhV9kMxtjI9GWzpchmjuiTB2tctk6qT",
      },
      challenge: {
        challenge_id: "iKNufKJdLX3Xg8qFru9AuLBvivAEJ88PW4",
        requested_access: [new RequestedPermission(IDENTITY_VIEW.vdxfid)],
        session_id: "iRQZGW36o3RcVR1xyVT1qWdAKdxp3wUyrh",
        redirect_uris: [
          new RedirectUri(
            "https://www.verus.io",
            LOGIN_CONSENT_ATTESTATION_WEBHOOK_VDXF_KEY.vdxfid
          ),
        ],
        created_at: 1664382484,
        salt: "i6NawEzHMocZnU4h8pPkGpHApvsrHjxwXE",
        context: new Context({
          ["i4KyLCxWZXeSkw15dF95CUKytEK3HU7em9"]: "test",
        }),
      },
    });

    const serializedRequest = req.toBuffer().toString('hex'); // Serialize the request to a hex string
    const newProfileInfoRequest = new LoginConsentRequest();

    newProfileInfoRequest.fromBuffer(Buffer.from(serializedRequest, 'hex')); // Deserialize the request from the hex string
    expect(serializedRequest).toStrictEqual(newProfileInfoRequest.toBuffer().toString('hex')) // Compare the original serialized request to the new serialized request

  });

  test('attestation provision serialize and deserialize', async () => {

    const attestationDataDescriptor = DataDescriptor.fromJson({
      version: 1,
      "flags": 2,
      "objectdata": {
        "i4GC1YGEVD21afWudGoFJVdnfjJ5XWnCQv": {
          "version": 1,
          "flags": 96,
          "mimetype": "text/plain",
          "objectdata": {
            "message": "John"
          },
          "label": "i4GqsotHGa4czCdtg2d8FVHKfJFzVyBPrM"
        }
      },
      "salt": "4f66603f256d3f757b6dc3ea44802d4041d2a1901e06005028fd60b85a5878a2"
    });

    const attestationitem = Buffer.concat([fromBase58Check(ATTESTATION_PROVISION_TYPE.vdxfid).hash,
    Buffer.from([0x01]),
    attestationDataDescriptor.toBuffer()]);

    const attestationObject = new Attestation(attestationitem.toString('hex'), ATTESTATION_PROVISION_OBJECT.vdxfid);

    const req = new LoginConsentRequest({
      system_id: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
      signing_id: "iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU",
      signature: {
        signature:
          "AYG2IQABQSAN1fp6A9NIVbxvKuOVLLU+0I+G3oQGbRtS6u4Eampfb217Cdf5FCMScQhV9kMxtjI9GWzpchmjuiTB2tctk6qT",
      },
      challenge: {
        challenge_id: "iKNufKJdLX3Xg8qFru9AuLBvivAEJ88PW4",
        requested_access: [new RequestedPermission(IDENTITY_VIEW.vdxfid)],
        session_id: "iRQZGW36o3RcVR1xyVT1qWdAKdxp3wUyrh",
        redirect_uris: [
          new RedirectUri(
            "https://www.verus.io",
            LOGIN_CONSENT_REDIRECT_VDXF_KEY.vdxfid
          ),
        ],
        created_at: 1664382484,
        salt: "i6NawEzHMocZnU4h8pPkGpHApvsrHjxwXE",
        context: new Context({
          ["i4KyLCxWZXeSkw15dF95CUKytEK3HU7em9"]: "test",
        }),
        attestations: [attestationObject]
      },
    });

    const serializedRequest = req.toBuffer().toString('hex'); // Serialize the request to a hex string
    const attestationProvisionRequest = new LoginConsentRequest();

    attestationProvisionRequest.fromBuffer(Buffer.from(serializedRequest, 'hex')); // Deserialize the request from the hex string
    expect(serializedRequest).toStrictEqual(attestationProvisionRequest.toBuffer().toString('hex')) // Compare the original serialized request to the new serialized request

  });

  test("request profile information to Create an Attestation", async () => {

    const profileInfoRequest = new LoginConsentRequest({
      system_id: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
      signing_id: "iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU",
      signature: {
        signature:
          "AYG2IQABQSAN1fp6A9NIVbxvKuOVLLU+0I+G3oQGbRtS6u4Eampfb217Cdf5FCMScQhV9kMxtjI9GWzpchmjuiTB2tctk6qT",
      },
      challenge: {
        challenge_id: "iMqzCkWdebC19xbjkLfVdDkkGP9Ni1oxoN",
        requested_access: [
          new RequestedPermission(IDENTITY_VIEW.vdxfid, [IDENTITY_PERSONALDETAILS.vdxfid, IDENTITY_CONTACTDETAILS.vdxfid, IDENTITY_LOCATION.vdxfid, IDENTITY_BANKINGDETAILS.vdxfid, IDENTITY_DOCUMENTS.vdxfid]),
          new RequestedPermission(PROFILE_DATA_VIEW_REQUEST.vdxfid), // change to array
          new RequestedPermission(LOGIN_CONSENT_PERSONALINFO_WEBHOOK_VDXF_KEY.vdxfid),
          new RequestedPermission(LOGIN_CONSENT_REDIRECT_VDXF_KEY.vdxfid),
        ],
        redirect_uris: [new RedirectUri(
          "https://example.com/sendpersonaldata",
          LOGIN_CONSENT_PERSONALINFO_WEBHOOK_VDXF_KEY.vdxfid)
        ],
        subject: [],
        provisioning_info: [], //<ATTESTATION_VDXF_KEY><ATTESTATION_TYPE_KEY_1><ATTESTATION_TYPE_KEY_2><ATTESTATION_TYPE_KEY_3><ATTESTATION_TYPE_KEY_4>
        created_at: Number((Date.now() / 1000).toFixed(0)),
      }
    });

    const serializedRequest = profileInfoRequest.toBuffer().toString('hex'); // Serialize the request to a hex string
    const newProfileInfoRequest = new LoginConsentRequest();

    newProfileInfoRequest.fromBuffer(Buffer.from(serializedRequest, 'hex')); // Deserialize the request from the hex string
    expect(serializedRequest).toStrictEqual(newProfileInfoRequest.toBuffer().toString('hex')) // Compare the original serialized request to the new serialized request
  });

});
