import { BN } from "bn.js";
import { Context, LoginConsentRequest, ProvisioningInfo, RedirectUri, RequestedPermission, SignedSessionObject, SignedSessionObjectData, Subject, VerusPayInvoice, VerusPayInvoiceDetails } from "../../vdxf/classes";
import { DEST_PKH, TransferDestination } from "../../pbaas/TransferDestination";
import { fromBase58Check } from "../../utils/address";
import { parseVdxfObjectString } from "../../vdxf/parser";
import { IDENTITY_VIEW, ID_ADDRESS_VDXF_KEY, ID_FULLYQUALIFIEDNAME_VDXF_KEY, ID_PARENT_VDXF_KEY, ID_SYSTEMID_VDXF_KEY, LOGIN_CONSENT_ID_PROVISIONING_WEBHOOK_VDXF_KEY, LOGIN_CONSENT_REDIRECT_VDXF_KEY } from "../../vdxf";

describe('Parses VDXF objects correctly', () => {
  const details = new VerusPayInvoiceDetails({
    amount: new BN(10000000000, 10),
    destination: new TransferDestination({
      type: DEST_PKH,
      destination_bytes: fromBase58Check("R9J8E2no2HVjQmzX6Ntes2ShSGcn7WiRcx").hash
    }),
    requestedcurrencyid: "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
    maxestimatedslippage: new BN(40000000, 10),
    expiryheight: new BN(2000000, 10),
    acceptedsystems: ["iNC9NG5Jqk2tqVtqfjfiSpaqxrXaFU6RDu", "iBDkVJqik6BrtcDBQfFygffiYzTMy6EuhU"]
  })

  details.setFlags({
    acceptsConversion: true,
    expires: true,
    acceptsNonVerusSystems: true
  })

  const inv = new VerusPayInvoice({
    details,
    system_id: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    signing_id: "iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU",
    signature: {
      signature:
        "AYG2IQABQSAN1fp6A9NIVbxvKuOVLLU+0I+G3oQGbRtS6u4Eampfb217Cdf5FCMScQhV9kMxtjI9GWzpchmjuiTB2tctk6qT",
    },
  })

  inv.setSigned()

  test('parses VerusPayInvoice QR string correctly', async () => {
    const qrstring = inv.toQrString()

    expect(parseVdxfObjectString(qrstring).toQrString()).toBe(qrstring);
  });

  test('parses VerusPayInvoice deeplink url correctly', async () => {
    const uri = inv.toWalletDeeplinkUri()

    expect(parseVdxfObjectString(uri).toWalletDeeplinkUri()).toBe(uri);
  });

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

  test('parses LoginConsentRequest QR string correctly', async () => {
    const qrstring = req.toQrString()

    expect(parseVdxfObjectString(qrstring).toQrString()).toBe(qrstring);
  });

  test('parses VerusPayInvoice deeplink url correctly', async () => {
    const uri = req.toWalletDeeplinkUri()

    expect(parseVdxfObjectString(uri).toWalletDeeplinkUri()).toBe(uri);
  });
});
