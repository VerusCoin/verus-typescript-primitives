import { BN } from "bn.js";
import { SerializableEntity } from "../../utils/types/SerializableEntity";
import { Identity } from "../Identity";
import { OptCCParams } from "../OptCCParams";
import { SmartTransactionScript } from "./SmartTransactionScript";
import { EVALS } from "../../utils/evals";
import { TxDestination } from "../TxDestination";
import { IdentityID } from "../IdentityID";
import { IDENTITY_RECOVER_ADDR } from "../../utils/cccustom";
import { KeyID } from "../KeyID";

export class IdentityScript extends SmartTransactionScript implements SerializableEntity {
  constructor(master?: OptCCParams, params?: OptCCParams) {
    super(master, params);
  }

  static fromIdentity(identity: Identity): IdentityScript {
    if (identity.version.lt(Identity.VERSION_CURRENT)) {
      throw new Error("Cannot generate script for outdated identity version")
    }
    
    const identityAddress = identity.getIdentityAddress();

    const destinationsMaster = identity.isRevoked() ? [
      new TxDestination(IdentityID.fromAddress(identityAddress)),
      new TxDestination(identity.recovery_authority)
    ] : [
      new TxDestination(IdentityID.fromAddress(identityAddress)),
      new TxDestination(identity.revocation_authority),
      new TxDestination(identity.recovery_authority)
    ];

    const destinationsRecovery = [
      new TxDestination(identity.recovery_authority)
    ]

    if (identity.hasTokenizedIdControl()) {
      const addrDestination = new TxDestination(KeyID.fromAddress(IDENTITY_RECOVER_ADDR));
      destinationsRecovery.push(addrDestination);
    }

    const master = new OptCCParams({
      version: Identity.VERSION_CURRENT,
      eval_code: new BN(EVALS.EVAL_NONE),
      m: new BN(1),
      n: new BN(destinationsMaster.length),
      destinations: destinationsMaster,
      vdata: []
    })

    const params = new OptCCParams({
      version: Identity.VERSION_CURRENT,
      eval_code: new BN(EVALS.EVAL_IDENTITY_PRIMARY),
      m: new BN(1),
      n: new BN(1),
      destinations: [
        new TxDestination(IdentityID.fromAddress(identityAddress))
      ],
      vdata: identity.isRevoked() ? [
        identity.toBuffer(),
        new OptCCParams({
          version: Identity.VERSION_CURRENT,
          eval_code: new BN(EVALS.EVAL_IDENTITY_RECOVER),
          m: new BN(1),
          n: new BN(destinationsRecovery.length),
          destinations: destinationsRecovery,
          vdata: []
        }).toChunk()
      ] : [
        identity.toBuffer(),
        new OptCCParams({
          version: Identity.VERSION_CURRENT,
          eval_code: new BN(EVALS.EVAL_IDENTITY_REVOKE),
          m: new BN(1),
          n: new BN(1),
          destinations: [
            new TxDestination(identity.revocation_authority)
          ],
          vdata: []
        }).toChunk(),
        new OptCCParams({
          version: Identity.VERSION_CURRENT,
          eval_code: new BN(EVALS.EVAL_IDENTITY_RECOVER),
          m: new BN(1),
          n: new BN(destinationsRecovery.length),
          destinations: destinationsRecovery,
          vdata: []
        }).toChunk()
      ]
    });

    return new IdentityScript(master, params);
  }

  getIdentity(parseVdxfObjects: boolean = false): Identity {
    const identity = new Identity();
    identity.fromBuffer(this.params.getParamObject()!, 0, parseVdxfObjects);

    return identity;
  }
}