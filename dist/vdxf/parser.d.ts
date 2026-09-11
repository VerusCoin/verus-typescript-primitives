import { LoginConsentRequest, VerusPayInvoice } from "./classes";
/**
 * Parses legacy LoginConsentRequest and VerusPayInvoice deeplinks or QR strings.
 *
 * @deprecated Use the corresponding class's URI or QR parser directly.
 * Parse generic request URIs with GenericRequest.fromWalletDeeplinkUri()
 * and generic request QR strings with GenericRequest.fromQrString().
 */
export declare function parseVdxfObjectString(str: string): LoginConsentRequest | VerusPayInvoice;
