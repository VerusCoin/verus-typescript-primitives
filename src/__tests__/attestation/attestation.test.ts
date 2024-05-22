import {
  LOGIN_CONSENT_ATTESTATION_WEBHOOK_VDXF_KEY,
  PROFILE_DATA_VIEW_REQUEST,
  LOGIN_CONSENT_PERSONALINFO_WEBHOOK_VDXF_KEY,
  ATTESTATION_READ_REQUEST,
  IDENTITY_VIEW,
  IDENTITYDATA_FIRSTNAME,
  LOGIN_CONSENT_REDIRECT_VDXF_KEY,
  VerusIDSignature,
  IDENTITYDATA_LASTNAME,
  IDENTITYDATA_ATTESTOR,
  IDENTITYDATA_IDENTITY,
  IDENTITYDATA_PERSONAL_DETAILS,
  IDENTITYDATA_CONTACT,
  IDENTITYDATA_LOCATIONS,
  IDENTITYDATA_BANKING_INFORMATION,
  IDENTITYDATA_DOCUMENTS_AND_IMAGES
} from "../../vdxf";

import { Attestation, LoginConsentRequest } from "../../vdxf/classes";
import { RedirectUri, RequestedPermission } from "../../vdxf/classes/Challenge";
import { Context } from "../../vdxf/classes/Context";
import { Subject } from "../../vdxf/classes/Challenge";



describe('Serializes and deserializes attestation request', () => {

  test("request profile information", async () => {

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
          new RequestedPermission("", IDENTITY_VIEW.vdxfid),
          new RequestedPermission("", PROFILE_DATA_VIEW_REQUEST.vdxfid),
          new RequestedPermission("", LOGIN_CONSENT_PERSONALINFO_WEBHOOK_VDXF_KEY.vdxfid),
        ],
        redirect_uris: [],
        subject: [new Subject(
          IDENTITYDATA_PERSONAL_DETAILS.vdxfid,
          PROFILE_DATA_VIEW_REQUEST.vdxfid
        ),
        new Subject(
          IDENTITYDATA_CONTACT.vdxfid,
          PROFILE_DATA_VIEW_REQUEST.vdxfid
        ),
        new Subject(
          IDENTITYDATA_LOCATIONS.vdxfid,
          PROFILE_DATA_VIEW_REQUEST.vdxfid
        ),
        new Subject(
          IDENTITYDATA_BANKING_INFORMATION.vdxfid,
          PROFILE_DATA_VIEW_REQUEST.vdxfid
        ),
        new Subject(
          IDENTITYDATA_DOCUMENTS_AND_IMAGES.vdxfid,
          PROFILE_DATA_VIEW_REQUEST.vdxfid
        ),
        new Subject(
          "https://example.com/sendpersonaldata",
          LOGIN_CONSENT_PERSONALINFO_WEBHOOK_VDXF_KEY.vdxfid
        ),
        ],
        provisioning_info: [],
        created_at: Number((Date.now() / 1000).toFixed(0)),
      }

    });
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
        requested_access: [new RequestedPermission("", IDENTITY_VIEW.vdxfid)],
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


  });


  test('attestation request with reply', async () => {
    const req = new LoginConsentRequest({
      system_id: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
      signing_id: "iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU",
      signature: {
        signature:
          "AYG2IQABQSAN1fp6A9NIVbxvKuOVLLU+0I+G3oQGbRtS6u4Eampfb217Cdf5FCMScQhV9kMxtjI9GWzpchmjuiTB2tctk6qT",
      },
      challenge: {
        challenge_id: "iKNufKJdLX3Xg8qFru9AuLBvivAEJ88PW4",
        requested_access: [new RequestedPermission("", IDENTITY_VIEW.vdxfid)],
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
      },
    });

      // TODO
    // const componentsMap = new Map();

    // componentsMap.set(0, new AttestationDataType("Chris", IDENTITYDATA_FIRSTNAME.vdxfid, "8e6744dc4f229e543bbd00d65b395829e44c8eb7b358ee3131ca25e6ecc3b210"));
    // componentsMap.set(1, new AttestationDataType("Monkins", IDENTITYDATA_LASTNAME.vdxfid, "7c3920940db4385cd305557a57a8df33346712096e76b58d7c4ace05e17b90a2"));
    // componentsMap.set(2, new AttestationDataType("chad@", IDENTITYDATA_IDENTITY.vdxfid, "ce662d61a20ae211728cdb1b924628c84edfe0fcbd59a86f56a125ad73689ac1"));
    // componentsMap.set(3, new AttestationDataType("valu attestation@", IDENTITYDATA_ATTESTOR.vdxfid, "9067dc6a9b38dd15f985770bb819eb62de39a5d1f0e12f9a4807f78968794af4"));


    // const signaturesForAttestation = new VerusIDSignature({
    //   signature: "AYG2IQABQSAN1fp6A9NIVbxvKuOVLLU+0I+G3oQGbRtS6u4Eampfb217Cdf5FCMScQhV9kMxtjI9GWzpchmjuiTB2tctk6qT",
    // })

    // const attestationResponse = new Attestation({
    //   data: new AttestationData(componentsMap),
    //   signature: signaturesForAttestation,
    //   system_id: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    //   signing_id: "iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU"
    // },
    // );

  });

});
