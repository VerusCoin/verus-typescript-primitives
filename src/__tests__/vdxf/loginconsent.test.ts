import { Context } from "../../vdxf/classes/Context";
import { Credential } from "../../pbaas/Credential";
import { Hash160 } from "../../vdxf/classes/Hash160";
import { IDENTITY_CREDENTIAL_PLAINLOGIN, IDENTITY_NAME_COMMITMENT_TXID, IDENTITY_REGISTRATION_TXID, IDENTITY_VIEW, ID_ADDRESS_VDXF_KEY, ID_FULLYQUALIFIEDNAME_VDXF_KEY, ID_PARENT_VDXF_KEY, ID_SYSTEMID_VDXF_KEY, LOGIN_CONSENT_ID_PROVISIONING_WEBHOOK_VDXF_KEY, LOGIN_CONSENT_PROVISIONING_ERROR_KEY_UNKNOWN, LOGIN_CONSENT_PROVISIONING_RESULT_STATE_PENDINGAPPROVAL, LOGIN_CONSENT_REDIRECT_VDXF_KEY } from "../../vdxf";
import { LoginConsentRequest, LoginConsentResponse } from "../../vdxf/classes";
import { ProvisioningInfo, RedirectUri, RequestedPermission, Subject } from "../../vdxf/classes/Challenge";
import { ProvisioningRequest } from "../../vdxf/classes/provisioning/ProvisioningRequest";
import { ProvisioningResponse } from "../../vdxf/classes/provisioning/ProvisioningResponse";
import { ProvisioningResult, ProvisioningTxid } from "../../vdxf/classes/provisioning/ProvisioningResult";

describe('Serializes and deserializes signature objects properly', () => {
  test('loginconsentrequest/response', async () => {
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
        subject: [
          new Subject(
            "fully.qualified.name",
            ID_FULLYQUALIFIEDNAME_VDXF_KEY.vdxfid
          ),
          new Subject(
            "iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU",
            ID_ADDRESS_VDXF_KEY.vdxfid
          ),
          new Subject(
            "iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU",
            ID_SYSTEMID_VDXF_KEY.vdxfid
          ),
          new Subject(
            "iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU",
            ID_PARENT_VDXF_KEY.vdxfid
          ),
        ],
        provisioning_info: [
          new ProvisioningInfo(
            "https://127.0.0.1/",
            LOGIN_CONSENT_ID_PROVISIONING_WEBHOOK_VDXF_KEY.vdxfid
          ),
          new ProvisioningInfo(
            "iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU",
            ID_ADDRESS_VDXF_KEY.vdxfid
          ),
          new ProvisioningInfo(
            "iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU",
            ID_SYSTEMID_VDXF_KEY.vdxfid
          ),
          new ProvisioningInfo(
            "iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU",
            ID_PARENT_VDXF_KEY.vdxfid
          ),
        ],
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

    const res = new LoginConsentResponse({
      system_id: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
      signing_id: "iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU",
      signature: {
        signature:
          "AYG2IQABQSAN1fp6A9NIVbxvKuOVLLU+0I+G3oQGbRtS6u4Eampfb217Cdf5FCMScQhV9kMxtjI9GWzpchmjuiTB2tctk6qT",
      },
      decision: {
        decision_id: "iBTMBHzDbsW3QG1MLBoYtmo6c1xuzn6xxb",
        context: new Context({
          ["i4KyLCxWZXeSkw15dF95CUKytEK3HU7em9"]: "test",
        }),
        request: req,
        created_at: 1664392484
      }
    })

    const reqbuf = req.toBuffer()
    const _req = new LoginConsentRequest()
    _req.fromBuffer(reqbuf)

    const resbuf = res.toBuffer()
    const _res = new LoginConsentResponse()
    _res.fromBuffer(resbuf)

    // Ensure base58 subjects and provisioning infos are serialized correctly
    expect(new Hash160(new Subject(
      "iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU",
      ID_ADDRESS_VDXF_KEY.vdxfid
    ).toDataBuffer()).toAddress()).toBe("iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU")
    expect(new Hash160(new Subject(
      "iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU",
      ID_SYSTEMID_VDXF_KEY.vdxfid
    ).toDataBuffer()).toAddress()).toBe("iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU")
    expect(new Hash160(new Subject(
      "iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU",
      ID_PARENT_VDXF_KEY.vdxfid
    ).toDataBuffer()).toAddress()).toBe("iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU")
    expect(new Hash160(new ProvisioningInfo(
      "iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU",
      ID_ADDRESS_VDXF_KEY.vdxfid
    ).toDataBuffer()).toAddress()).toBe("iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU")
    expect(new Hash160(new ProvisioningInfo(
      "iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU",
      ID_SYSTEMID_VDXF_KEY.vdxfid
    ).toDataBuffer()).toAddress()).toBe("iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU")
    expect(new Hash160(new ProvisioningInfo(
      "iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU",
      ID_PARENT_VDXF_KEY.vdxfid
    ).toDataBuffer()).toAddress()).toBe("iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU")

    // Ensure utf-8 subjects and provisioning infos are serialized correctly
    expect(new Subject(
      "fully.qualified.name",
      ID_FULLYQUALIFIEDNAME_VDXF_KEY.vdxfid
    ).toDataBuffer().toString('utf-8')).toBe("fully.qualified.name")
    expect(new ProvisioningInfo(
      "fully.qualified.name",
      ID_FULLYQUALIFIEDNAME_VDXF_KEY.vdxfid
    ).toDataBuffer().toString('utf-8')).toBe("fully.qualified.name")

    expect(_res.toBuffer().toString('hex')).toBe(resbuf.toString('hex'));
    expect(_req.toBuffer().toString('hex')).toBe(reqbuf.toString('hex'));

    expect(_res.getDecisionHash(10000, 1).toString('hex')).toBe(res.getDecisionHash(10000, 1).toString('hex'))
    expect(_req.getChallengeHash(10000, 1).toString('hex')).toBe(req.getChallengeHash(10000, 1).toString('hex'))
    expect(_res.getDecisionHash(10000, 2).toString('hex')).toBe(res.getDecisionHash(10000, 2).toString('hex'))
    expect(_req.getChallengeHash(10000, 2).toString('hex')).toBe(req.getChallengeHash(10000, 2).toString('hex'))

    const uri = _req.toWalletDeeplinkUri()

    expect(uri).toBe(LoginConsentRequest.fromWalletDeeplinkUri(uri).toWalletDeeplinkUri());

    const qrstring = _req.toQrString()

    expect(qrstring).toBe(LoginConsentRequest.fromQrString(qrstring).toQrString());
  });

  test('provisioning request/response', async () => {
    const req = new ProvisioningRequest({
      signing_address: "RYQbUr9WtRRAnMjuddZGryrNEpFEV1h8ph",
      signature: {
        signature:
          "AYG2IQABQSAN1fp6A9NIVbxvKuOVLLU+0I+G3oQGbRtS6u4Eampfb217Cdf5FCMScQhV9kMxtjI9GWzpchmjuiTB2tctk6qT",
      },
      challenge: {
        challenge_id: "iKNufKJdLX3Xg8qFru9AuLBvivAEJ88PW4",
        created_at: 1664382484,
        salt: "i6NawEzHMocZnU4h8pPkGpHApvsrHjxwXE",
        context: new Context({
          ["i4KyLCxWZXeSkw15dF95CUKytEK3HU7em9"]: "test",
        }),
        name: "😊",
        system_id: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        parent: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV"
      },
    });

    const res = new ProvisioningResponse({
      system_id: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
      signing_id: "iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU",
      signature: {
        signature:
          "AYG2IQABQSAN1fp6A9NIVbxvKuOVLLU+0I+G3oQGbRtS6u4Eampfb217Cdf5FCMScQhV9kMxtjI9GWzpchmjuiTB2tctk6qT",
      },
      decision: {
        decision_id: "iBTMBHzDbsW3QG1MLBoYtmo6c1xuzn6xxb",
        context: new Context({
          ["i4KyLCxWZXeSkw15dF95CUKytEK3HU7em9"]: "test",
        }),
        request: req,
        created_at: 1664392484,
        result: new ProvisioningResult({
          state: LOGIN_CONSENT_PROVISIONING_RESULT_STATE_PENDINGAPPROVAL.vdxfid,
          error_key: LOGIN_CONSENT_PROVISIONING_ERROR_KEY_UNKNOWN.vdxfid,
          error_desc: "Testing an error",
          identity_address: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
          info_uri: "127.0.0.1",
          provisioning_txids: [
            new ProvisioningTxid(
              "402e437df5aea8dc7af42f3072a43ef0e9e27edfbd2072c08aeea8e07024ee40",
              IDENTITY_NAME_COMMITMENT_TXID.vdxfid
            ),
            new ProvisioningTxid(
              "402e437df5aea8dc7af42f3072a43ef0e9e27edfbd2072c08aeea8e07024ee40",
              IDENTITY_REGISTRATION_TXID.vdxfid
            )
          ],
          system_id: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
          fully_qualified_name: "😊.vrsc",
          parent: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV"
        }),
      }
    })

    const reqbuf = req.toBuffer()
    const _req = new ProvisioningRequest()
    _req.fromBuffer(reqbuf)

    const resbuf = res.toBuffer()
    const _res = new ProvisioningResponse()
    _res.fromBuffer(resbuf)

    expect(_res.toBuffer().toString('hex')).toBe(resbuf.toString('hex'));
    expect(_req.toBuffer().toString('hex')).toBe(reqbuf.toString('hex'));

    expect(_res.getDecisionHash(10000).toString('hex')).toBe(res.getDecisionHash(10000).toString('hex'))
    expect(_req.getChallengeHash().toString('hex')).toBe(req.getChallengeHash().toString('hex'))
  });

  test('loginconsentresponse with a credential', async () => {
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
        subject: [
          new Subject(
            "fully.qualified.name",
            ID_FULLYQUALIFIEDNAME_VDXF_KEY.vdxfid
          ),
          new Subject(
            "iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU",
            ID_ADDRESS_VDXF_KEY.vdxfid
          ),
          new Subject(
            "iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU",
            ID_SYSTEMID_VDXF_KEY.vdxfid
          ),
          new Subject(
            "iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU",
            ID_PARENT_VDXF_KEY.vdxfid
          ),
        ],
        provisioning_info: [
          new ProvisioningInfo(
            "https://127.0.0.1/",
            LOGIN_CONSENT_ID_PROVISIONING_WEBHOOK_VDXF_KEY.vdxfid
          ),
          new ProvisioningInfo(
            "iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU",
            ID_ADDRESS_VDXF_KEY.vdxfid
          ),
          new ProvisioningInfo(
            "iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU",
            ID_SYSTEMID_VDXF_KEY.vdxfid
          ),
          new ProvisioningInfo(
            "iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU",
            ID_PARENT_VDXF_KEY.vdxfid
          ),
        ],
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

    const cred = new Credential({
      version: Credential.VERSION_CURRENT,
      credentialKey: IDENTITY_CREDENTIAL_PLAINLOGIN.vdxfid,
      credential: ["shortname", "cookies"],
      scopes: ["FileSharingSite@"],
    });

    const res = new LoginConsentResponse({
      system_id: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
      signing_id: "iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU",
      signature: {
        signature:
          "AYG2IQABQSAN1fp6A9NIVbxvKuOVLLU+0I+G3oQGbRtS6u4Eampfb217Cdf5FCMScQhV9kMxtjI9GWzpchmjuiTB2tctk6qT",
      },
      decision: {
        decision_id: "iBTMBHzDbsW3QG1MLBoYtmo6c1xuzn6xxb",
        context: new Context({
          [IDENTITY_CREDENTIAL_PLAINLOGIN.vdxfid]: cred.toBuffer().toString('hex'),
        }),
        request: req,
        created_at: 1664392484,
      }
    })
    const resbuf = res.toBuffer()
    const _res = new LoginConsentResponse()
    _res.fromBuffer(resbuf)

    expect(_res.toBuffer().toString('hex')).toBe(resbuf.toString('hex'));

    expect(_res.getDecisionHash(10000, 1).toString('hex')).toBe(res.getDecisionHash(10000, 1).toString('hex'))
    expect(_res.getDecisionHash(10000, 2).toString('hex')).toBe(res.getDecisionHash(10000, 2).toString('hex'))

    const _cred = new Credential();
    const _credHex = _res.decision.context?.kv[IDENTITY_CREDENTIAL_PLAINLOGIN.vdxfid] || '';
    _cred.fromBuffer(Buffer.from(_credHex, 'hex'))
    expect(_cred).toEqual(cred)
  });

  test('loginconsentresponse with credentials', async () => {
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
        subject: [
          new Subject(
            "fully.qualified.name",
            ID_FULLYQUALIFIEDNAME_VDXF_KEY.vdxfid
          ),
          new Subject(
            "iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU",
            ID_ADDRESS_VDXF_KEY.vdxfid
          ),
          new Subject(
            "iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU",
            ID_SYSTEMID_VDXF_KEY.vdxfid
          ),
          new Subject(
            "iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU",
            ID_PARENT_VDXF_KEY.vdxfid
          ),
        ],
        provisioning_info: [
          new ProvisioningInfo(
            "https://127.0.0.1/",
            LOGIN_CONSENT_ID_PROVISIONING_WEBHOOK_VDXF_KEY.vdxfid
          ),
          new ProvisioningInfo(
            "iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU",
            ID_ADDRESS_VDXF_KEY.vdxfid
          ),
          new ProvisioningInfo(
            "iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU",
            ID_SYSTEMID_VDXF_KEY.vdxfid
          ),
          new ProvisioningInfo(
            "iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU",
            ID_PARENT_VDXF_KEY.vdxfid
          ),
        ],
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

    const credentials = [
      new Credential({
        version: Credential.VERSION_CURRENT,
        credentialKey: IDENTITY_CREDENTIAL_PLAINLOGIN.vdxfid,
        credential: ["myemail1990@uniqueemailservice.com", "secretpassword"],
        scopes: ["UniqueEmailService@"],
      }),
      new Credential({
        version: Credential.VERSION_CURRENT,
        credentialKey: "iHHVJux4xjahxzGTe8esqfnAmr3s9qi9pH",
        credential: ["1234567891011121"],
        scopes: ["UniqueEmailService@"],
        label: "hint: numbers",
      })
    ];

    const context = new Context();
    for (const cred of credentials) {
      context.kv[cred.credentialKey] = cred.toBuffer().toString('hex');
    }

    const res = new LoginConsentResponse({
      system_id: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
      signing_id: "iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU",
      signature: {
        signature:
          "AYG2IQABQSAN1fp6A9NIVbxvKuOVLLU+0I+G3oQGbRtS6u4Eampfb217Cdf5FCMScQhV9kMxtjI9GWzpchmjuiTB2tctk6qT",
      },
      decision: {
        decision_id: "iBTMBHzDbsW3QG1MLBoYtmo6c1xuzn6xxb",
        context: context,
        request: req,
        created_at: 1664392484,
      }
    })
    const resbuf = res.toBuffer()
    const _res = new LoginConsentResponse()
    _res.fromBuffer(resbuf)

    expect(_res.toBuffer().toString('hex')).toBe(resbuf.toString('hex'));

    expect(_res.getDecisionHash(10000, 1).toString('hex')).toBe(res.getDecisionHash(10000, 1).toString('hex'))
    expect(_res.getDecisionHash(10000, 2).toString('hex')).toBe(res.getDecisionHash(10000, 2).toString('hex'))

    for (const cred of credentials) {
      const _cred = new Credential();
      const _credHex = _res.decision.context?.kv[cred.credentialKey] || '';
      _cred.fromBuffer(Buffer.from(_credHex, 'hex'))
      expect(_cred).toEqual(cred)
    }
  });
});
