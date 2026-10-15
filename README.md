# verus-typescript-primitives

`verus-typescript-primitives` is a comprehensive TypeScript library designed for interacting with the Verus blockchain. It provides a robust set of tools for serialization and deserialization of Verus's core data structures, enabling developers to build applications that can construct, parse, and manage Verus identities, currencies, transactions, and more.

This library is essential for any JavaScript or TypeScript project that needs to interface with the Verus network at a low level, offering typed classes for Verus RPC API requests and responses, and handling the complexities of Verus's unique data formats like VDXF (Verus Data Exchange Format).

## Core Features

- **PBaaS Primitives**: Strong-typed classes for core Verus data structures like `Identity`, `CurrencyDefinition`, `ReserveTransfer`, and `TokenOutput`.
- **VDXF Support**: Full implementation for creating, parsing, and verifying VDXF objects, including `VerusPayInvoice`, `LoginConsentRequest`, and `SignedSessionObject`.
- **RPC API Wrappers**: Typed classes for Verus daemon RPC API calls (e.g., `getidentity`, `sendcurrency`, `getblock`), simplifying communication with a Verus node.
- **Serialization & Deserialization**: Robust methods (`toBuffer`, `fromBuffer`) to convert complex objects into byte-level representations for network transport or storage.
- **Utility Functions**: A suite of helper functions for address conversion (`toIAddress`), hashing, and Verus script compilation/decompilation.

## ⚠️ Features in Progress ⚠️

Certain features in this library are not yet implemented on the wallet side and may be subject to breaking changes. These include the following and all related subclasses to the following (e.g. the details classes for IdentityUpdateRequest and IdentityUpdateResponse):

- `IdentityUpdateRequest`
- `IdentityUpdateResponse`
- `IdentityUpdateEnvelope`
- `IDENTITY_UPDATE_REQUEST_VDXF_KEY`
- `IDENTITY_UPDATE_RESPONSE_VDXF_KEY`
- `DATA_TYPE_DEFINEDKEY`
- `DefinedKey`

## Installation

Install the package using npm:

```bash
npm install verus-typescript-primitives
```

## Usage

Below are some examples of how to use the library.

Buffer parsing is single-use per instance: `fromBuffer`, `fromDataBuffer`, and `fromBufferOptionalType` share one attempt, including failed attempts. Create a fresh parser for each buffer. Superclass calls and internal payload parsing belong to the same attempt. The guard does not reset existing object state.

Subclasses inherit `SerializableEntityBase` and may set `this.allowRepeatedFromBuffer = true` in their constructor if they handle repeated parsing safely. Implement parser overrides as prototype methods; assigning a replacement parser function on an instance replaces its guard.

### Creating a VerusPay Invoice

You can easily create a VerusPay invoice, which can then be converted into a QR code string or a wallet deeplink.

```typescript
import { VerusPayInvoice, VerusPayInvoiceDetails } from 'verus-typescript-primitives';
import { TransferDestination, DEST_PKH } from 'verus-typescript-primitives';
import { fromBase58Check } from 'verus-typescript-primitives';
import { BN } from 'bn.js';

// Define the invoice details
const details = new VerusPayInvoiceDetails({
  amount: new BN('10000000000'), // 100 VRSC in satoshis
  destination: new TransferDestination({
    type: DEST_PKH,
    destination_bytes: fromBase58Check("R9J8E2no2HVjQmzX6Ntes2ShSGcn7WiRcx").hash
  }),
  requestedcurrencyid: "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq", // VRSCTEST i-address
});

// Create the invoice object
const invoice = new VerusPayInvoice({ details });

// Generate a string for a QR code
const qrString = invoice.toQrString();
console.log("QR String:", qrString);

// Generate a deeplink URI for wallets
const deeplink = invoice.toWalletDeeplinkUri();
console.log("Deeplink:", deeplink);
```

### Parsing a VerusPay Invoice from a Deeplink

You can parse an existing invoice URI to extract its details.

```typescript
import { VerusPayInvoice } from 'verus-typescript-primitives';

const deeplinkUri = "i5jtwbp6zymeay9llnraglgjqgdrffsau4://x-callback-url/iEETy7La3FTN2Sd2hNRgepek5S8x8eeUeQ/hv7-_wPSGvW4AVxk05q0TGDq2DF_n1qbbExTYMDNOUi9NaTOjY-LamaVjDHK0QFIAYG2IQABQSAN1fp6A9NIVbxvKuOVLLU-0I-G3oQGbRtS6u4Eampfb217Cdf5FCMScQhV9kMxtjI9GWzpchmjuiTB2tctk6qTD6SfrscAAhQALTMRw4v9IZCS0q70SYBL6LO-_qbvnqI1Y14ygST_NCnbn56Rtk4t-YgAkoizAALNUVCdtT6CLffu0RysEee3KeIkAFT1qksXEsEIZuULP1txVIMuOHY-";

const invoice = VerusPayInvoice.fromWalletDeeplinkUri(deeplinkUri);

console.log('Parsed Invoice Details:', invoice.details.toJson());
console.log('Amount:', invoice.details.amount.toString());
console.log('Destination:', invoice.details.destination.getAddressString());
```

### Creating an Identity Update Script

This example shows how to define a VerusID, modify it, and generate the corresponding transaction script.

```typescript
import { Identity, IdentityScript, KeyID, IdentityID } from 'verus-typescript-primitives';
import { BN } from 'bn.js';

// Define a new identity from a JSON structure
const identityJson = {
  "version": 3,
  "flags": 0,
  "primaryaddresses": ["RUm77XHPni9KxsppF6B5geJ83cM4ZR1TPT"],
  "minimumsignatures": 1,
  "name": "MyNewID",
  "parent": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV", // VRSC
  "systemid": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV", // VRSC
  "revocationauthority": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",

  "recoveryauthority": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
  "timelock": 0
};

const identity = Identity.fromJson(identityJson);

// Update primary addresses
identity.setPrimaryAddresses(["RKjVHqM4VF2pCfVcwGzKH7CxvfMUE4H6o8"]);

// Lock the identity for 10000 blocks
identity.lock(new BN(10000));

// Generate the output script for an identity update transaction
const idScript = IdentityScript.fromIdentity(identity);
const scriptBuffer = idScript.toBuffer();

console.log('Identity Script Hex:', scriptBuffer.toString('hex'));
```

### Preparing Identity Registration Outputs

`NameReservation` (legacy) and `AdvancedNameReservation` (version 1) encode the
commit/reveal payloads. `getCommitment()` hashes their exact serialized bytes with
SHA256d. `IdentityCommitmentScript` and `IdentityReservationScript` build and parse
the corresponding smart transaction outputs, including two-party commitments for
permissioned namespaces.

```typescript
import {
  AdvancedNameReservation, IdentityID, KeyID, TxDestination, IdentityScript,
  IdentityCommitmentScript, IdentityReservationScript,
  resolveIdentityRegistrationName, identityFromJSONForRegistration,
  decodeDestination, R_ADDR_VERSION
} from 'verus-typescript-primitives';

// The wallet supplies and persists a cryptographically random, nonzero 32-byte
// salt before broadcasting the commitment. Do not generate a new salt on retry.
function prepareIdentityRegistration(salt: Buffer, controllerAddress: string) {
  const resolved = resolveIdentityRegistrationName({
    name: 'alice.VRSCTEST@',
    rootSystemName: 'VRSCTEST',
    systemID: 'iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq'
  });
  const reservation = new AdvancedNameReservation({
    name: resolved.name,
    parent: IdentityID.fromAddress(resolved.parent),
    salt
  });
  reservation.validateForCreation();
  const controller = new TxDestination(
    new KeyID(decodeDestination(controllerAddress, R_ADDR_VERSION))
  );
  const identity = identityFromJSONForRegistration({
    version: 3, flags: 0, minimumsignatures: 1, timelock: 0,
    name: resolved.name, parent: resolved.parent, systemid: resolved.systemID,
    primaryaddresses: [controllerAddress],
    revocationauthority: resolved.identityID,
    recoveryauthority: resolved.identityID
  }, resolved);
  return {
    reservation,
    commitmentScript: IdentityCommitmentScript.fromCommitment(reservation.getCommitment(), controller),
    identityScript: IdentityScript.fromIdentity(identity),
    reservationScript: IdentityReservationScript.fromReservation(reservation)
  };
}
```

For sub-identities, resolve a qualified name such as `alice.namespace.VRSCTEST@`,
or supply a leaf with both `parent` and `parentName`. Resolution derives IDs; the
client must verify that the parent is an eligible registered currency and issues
identities on the selected system. It must also resolve referral/issuer policy.
For a required issuer or referral signature, pass its identity `TxDestination` as
the third argument to `IdentityCommitmentScript.fromCommitment`. The script keeps
the controller index separate from its two-of-two spend condition.

Salt and commitment buffers use raw serialized uint256 byte order; JSON uses
reversed display hex. Names retain their original case and UTF-8 bytes. Creation
validation rejects ambiguous names and requires explicit network context. Legacy
reservation address derivation and script construction require an explicit parent
i-address, or `null` for a historical root. Legacy RPC `parent` metadata is not
part of the commitment; `fromJSON(json, parent)` verifies `nameid` against the
caller's context. Use `toJSONWithParent(parent)` to include that metadata in
legacy reservation JSON; `toJSON()` emits only its payload fields. Advanced
reservation payloads use ordinary commitment hashes;
the separately supported tagged `CommitmentHash` token format is not a name
registration commitment.

Historical advanced reservations with a null parent require explicit chain context:
use `getIdentityAddress(rootSystemName)`, `toJSONWithRootSystem(rootSystemName)`,
and `fromJSON(json, rootSystemName)`. Their wire payload alone cannot identify the
root namespace. `Identity.fromBuffer(bytes, offset, parseVdxfObjects, rootSystemName)`
can also reconstruct the omitted system ID of a version 1 identity;
`Identity.toJson(rootSystemName)` supplies the same context for JSON projection.

Use `validateIdentityForRegistration(identity, resolved)` for an already constructed
full `Identity`, or the stricter JSON entry point above to validate original
address versions before parsing. These creation helpers currently support version
3, zero flags/timelock, and R-address primary authorities; compressed public-key
principals are unsupported by the existing `Principal` serializer. They reject
`PartialIdentity`. Historical reservation parsing is separate from creation checks;
unknown reservation versions are rejected rather than reinterpreted.

`CurrencyIdentityRegistration` exposes currency-option predicates and integer
registration/referral prices. Its constructor takes atomic amounts;
`fromJSON()` takes RPC coin amounts. `currencyAmountToAtomic()` accepts exact
decimal strings and rejects numbers that cannot preserve atomic precision.
`GetIdentityHistoryRequest`, `GetCurrencyStateRequest`, and `GetTxOutRequest`
provide the corresponding typed reads. Fees depending on currency state,
fractional conversion, funding, transaction assembly/signing, commitment
confirmation, and broadcasting remain responsibilities of the client.

These requests emit parameters compatible with the Rust RPC proxy once the
methods are whitelisted. Currency-state numeric heights are sent as strings;
omitted or nonpositive numeric heights use the current tip, while the explicit
string `"0"` selects genesis. A missing height before a conversion currency is
encoded as `""`, the daemon's string selector for the tip. Numeric heights must
be safe integers. Identity-history requests fill skipped intermediate arguments
with the daemon defaults (`0`, `0`, `false`) and omit unused trailing arguments.
Request JSON retains the caller's original values.

Offline daemon parity fixtures cover mined registrations, name derivation,
independently encoded scripts and identities, historical proofs, currency policy
and state, and UTXO reads. Coverage and regeneration instructions are in
[`src/__tests__/fixtures/identity-registration`](src/__tests__/fixtures/identity-registration/README.md).

### Making an RPC API Request

The library provides typed classes for RPC requests. You need to provide your own transport layer (e.g., using `axios` or `node-fetch`) to send the formatted request to the Verus daemon.

```typescript
import { GetIdentityRequest } from 'verus-typescript-primitives';

// Create a request object
const getIdentityRequest = new GetIdentityRequest(
  "VRSCTEST", // Chain ticker
  "VerusID@",  // Name or i-address of the identity
);

// Prepare the request parameters for your transport layer
const [chain, cmd, params] = getIdentityRequest.prepare();

console.log(`Chain: ${chain}`);
console.log(`Command: ${cmd}`);
console.log(`Params: ${JSON.stringify(params, null, 2)}`);

// Example of how you would send this with a hypothetical `sendRpcRequest` function
// async function sendRpcRequest(chain, cmd, params) {
//   const response = await myFetchFunction(`http://127.0.0.1:27486`, {
//     method: 'POST',
//     body: JSON.stringify({
//       jsonrpc: '2.0',
//       id: '1',
//       method: cmd,
//       params: params,
//     }),
//   });
//   return response.json();
// }
//
// sendRpcRequest(chain, cmd, params).then(response => {
//   console.log("RPC Response:", response.result);
// });
```

## Modules

The library is organized into several key modules:

-   **`pbaas`**: Contains primitives for Verus Public-Blockchains-as-a-Service (PaaS), including `Identity`, `CurrencyDefinition`, `ReserveTransfer`, and transaction script classes like `IdentityScript`.
-   **`vdxf`**: Manages Verus Data Exchange Format (VDXF) objects. This is crucial for application-level data exchange, such as login confirmations (`LoginConsentRequest`) and payments (`VerusPayInvoice`).
-   **`api`**: Provides classes that map to the Verus RPC API, offering a structured and type-safe way to construct requests and handle responses.
-   **`utils`**: Includes a variety of helper functions for common tasks like address and i-address conversions, cryptographic hashing (`hash`, `hash160`), and script manipulation.

## Development

To contribute to the development, clone the repository and install the dependencies.

```bash
git clone https://github.com/VerusCoin/verus-typescript-primitives.git
cd verus-typescript-primitives
yarn install
```

### Build

Compile the TypeScript source code:

```bash
yarn build
```

### Testing

Run the test suite using Jest:

```bash
yarn test
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
