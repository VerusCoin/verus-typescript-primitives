import base64url from "base64url";
import { LoginConsentRequest, VerusPayInvoice } from "./classes";
import { LOGIN_CONSENT_REQUEST_VDXF_KEY, VERUSPAY_INVOICE_VDXF_KEY } from "./keys";
import bufferutils from "../utils/bufferutils";
import { HASH160_BYTE_LENGTH, I_ADDR_VERSION } from "../constants/vdxf";
import { toBase58Check } from "../utils/address";

/**
 * Parses legacy LoginConsentRequest and VerusPayInvoice deeplinks or QR strings.
 *
 * @deprecated Use the corresponding class's URI or QR parser directly.
 * Parse generic request URIs with GenericRequest.fromWalletDeeplinkUri()
 * and generic request QR strings with GenericRequest.fromQrString().
 */
export function parseVdxfObjectString(str: string): LoginConsentRequest | VerusPayInvoice {
  const isDeeplinkUri = str.includes("x-callback-url");

  if (isDeeplinkUri) {
    const splitUri = str.split('x-callback-url/');
    const uriTail = splitUri[1];

    if (uriTail == null) throw new Error("Failed to decode deeplink uri");

    const splitUriTail = uriTail.split('/');
    const deeplinkType = splitUriTail[0];

    if (deeplinkType == null) throw new Error("Failed to parse deeplink type");

    if (deeplinkType === LOGIN_CONSENT_REQUEST_VDXF_KEY.vdxfid) {
      return LoginConsentRequest.fromWalletDeeplinkUri(str);
    } else if (deeplinkType === VERUSPAY_INVOICE_VDXF_KEY.vdxfid) {
      return VerusPayInvoice.fromWalletDeeplinkUri(str);
    } else throw new Error("Unrecognized vdxf object type " + deeplinkType);
  } else {
    const objBuf = base64url.toBuffer(str);
    const reader = new bufferutils.BufferReader(objBuf, 0);

    const vdxfKeyBuf = reader.readSlice(HASH160_BYTE_LENGTH);
    const vdxfKey = toBase58Check(vdxfKeyBuf, I_ADDR_VERSION);

    if (vdxfKey === LOGIN_CONSENT_REQUEST_VDXF_KEY.vdxfid) {
      return LoginConsentRequest.fromQrString(str);
    } else if (vdxfKey === VERUSPAY_INVOICE_VDXF_KEY.vdxfid) {
      return VerusPayInvoice.fromQrString(str);
    } else throw new Error("Unrecognized vdxf object type " + vdxfKey);
  }
}
