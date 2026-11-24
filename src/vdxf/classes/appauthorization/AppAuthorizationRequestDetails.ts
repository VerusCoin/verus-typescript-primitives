import { BigNumber } from "../../../utils/types/BigNumber";
import { BN } from "bn.js";
import { rejectUnknownFields } from "../../../utils/validation";
import { checkPayloadEnd } from "../../../pbaas/identityRegistrationSerialization";
import { isHexString } from "../../../utils/string";
import varuint from "../../../utils/varuint";
import { SerializableEntityBase } from "../../../utils/types/SerializableEntityBase";
import {
  SpendableKeyDetails,
  SpendableKeyDetailsJson,
} from "../backup/SpendableKeyDetails";
import {
  AuthorizationReader,
  ROLE_TAGGED_IDENTITY_ADDRESS_BYTE_LENGTH,
} from "./AuthorizationSerialization";
import {
  CompactIAddressObject,
  CompactAddressObjectJson,
} from "../CompactAddressObject";

export enum AppAuthorizationOfferRole {
  STORAGE = 1,
  AUTHORITY = 2,
  REVOCATION = 3,
  RECOVERY = 4,
}

export interface AppAuthorizationOffer {
  role: AppAuthorizationOfferRole;
  identity: CompactIAddressObject;
}

export interface AppAuthorizationRequestDetailsInterface {
  version?: BigNumber;
  flags?: BigNumber;
  gift?: SpendableKeyDetails;
  offeredIdentities?: AppAuthorizationOffer[];
}

export interface AppAuthorizationRequestDetailsJson {
  version: number;
  flags: number;
  gift?: SpendableKeyDetailsJson;
  offeredIdentities?: {
    role: AppAuthorizationOfferRole;
    identity: CompactAddressObjectJson;
  }[];
}

/** Payload only: admission must also validate the signed GenericRequest contract. */
export class AppAuthorizationRequestDetails extends SerializableEntityBase {
  static VERSION_INVALID = new BN(0);
  static VERSION_FIRST = new BN(1);
  static VERSION_LAST = new BN(1);
  static VERSION_CURRENT = new BN(1);

  static FLAGS_NONE = new BN(0);
  static FLAG_REQUIRES_SHARED_STORAGE = new BN(1);
  static FLAG_CONTAINS_GIFT = new BN(2);
  static FLAG_CONTAINS_OFFERS = new BN(4);
  static FLAG_CONTAINS_PERMISSIONS = new BN(16);
  static FLAGS_SUPPORTED =
    AppAuthorizationRequestDetails.FLAG_REQUIRES_SHARED_STORAGE.or(
      AppAuthorizationRequestDetails.FLAG_CONTAINS_GIFT
    ).or(AppAuthorizationRequestDetails.FLAG_CONTAINS_OFFERS);

  version: BigNumber;
  flags: BigNumber;
  gift?: SpendableKeyDetails;
  offeredIdentities?: AppAuthorizationOffer[];

  constructor(data: AppAuthorizationRequestDetailsInterface = {}) {
    super();
    rejectUnknownFields(data, [
      "version",
      "flags",
      "gift",
      "offeredIdentities",
    ]);
    if (
      (data.version !== undefined && !BN.isBN(data.version)) ||
      (data.flags !== undefined && !BN.isBN(data.flags))
    ) {
      throw new Error("Expected BN version and flags");
    }

    this.version = (
      data.version ?? AppAuthorizationRequestDetails.VERSION_CURRENT
    ).clone();
    this.gift = data.gift;
    this.offeredIdentities = data.offeredIdentities;
    this.flags = (
      data.flags ?? AppAuthorizationRequestDetails.FLAGS_NONE
    ).clone();

    if (data.flags === undefined) {
      if (data.gift !== undefined) {
        this.flags = this.flags.or(
          AppAuthorizationRequestDetails.FLAG_CONTAINS_GIFT
        );
      }

      if (data.offeredIdentities !== undefined) {
        this.flags = this.flags.or(
          AppAuthorizationRequestDetails.FLAG_CONTAINS_OFFERS
        );
      }
    }

    this.validate();
  }

  containsPermissions(): boolean {
    return !this.flags
      .and(AppAuthorizationRequestDetails.FLAG_CONTAINS_PERMISSIONS)
      .isZero();
  }

  /** Every offered identity is resolved on the enclosing request-signing system. */
  validate(): void {
    if (
      !BN.isBN(this.version) ||
      this.version.lt(AppAuthorizationRequestDetails.VERSION_FIRST) ||
      this.version.gt(AppAuthorizationRequestDetails.VERSION_LAST) ||
      !BN.isBN(this.flags) ||
      this.flags.lt(AppAuthorizationRequestDetails.FLAGS_NONE) ||
      !this.flags
        .and(AppAuthorizationRequestDetails.FLAGS_SUPPORTED)
        .eq(this.flags)
    ) {
      throw new Error("Unsupported authorization version or flags");
    }

    if (
      !this.flags
        .and(AppAuthorizationRequestDetails.FLAG_CONTAINS_GIFT)
        .isZero() !==
        (this.gift !== undefined) ||
      !this.flags
        .and(AppAuthorizationRequestDetails.FLAG_CONTAINS_OFFERS)
        .isZero() !==
        (this.offeredIdentities !== undefined)
    ) {
      throw new Error("Inconsistent authorization flags");
    }

    if (
      this.gift !== undefined &&
      (!(this.gift instanceof SpendableKeyDetails) || !this.gift.isValid())
    ) {
      throw new Error("Invalid authorization gift");
    }

    // Offers are a role inventory; adjacency does not assign storage authorities.
    if (this.offeredIdentities !== undefined) {
      if (
        !Array.isArray(this.offeredIdentities) ||
        !this.offeredIdentities.length
      ) {
        throw new Error("Invalid offer count");
      }

      const seen = new Set<string>();

      for (const offer of this.offeredIdentities) {
        rejectUnknownFields(offer, ["role", "identity"]);

        if (
          !Number.isInteger(offer.role) ||
          offer.role < AppAuthorizationOfferRole.STORAGE ||
          offer.role > AppAuthorizationOfferRole.RECOVERY
        ) {
          throw new Error("Invalid offer");
        }

        CompactIAddressObject.validateCompactIdentityAddress(offer.identity);

        const key = JSON.stringify([offer.role, offer.identity.address]);

        if (seen.has(key)) {
          throw new Error("Duplicate role/identity offer");
        }

        seen.add(key);
      }
    }
  }

  isValid(): boolean {
    try {
      this.toBuffer();

      return true;
    } catch {
      return false;
    }
  }

  toBuffer(): Buffer {
    this.validate();

    // Versions, flags and lengths use CompactSize.
    const parts = [
      varuint.encode(this.version.toNumber(), undefined, 0).buffer,
      varuint.encode(this.flags.toNumber(), undefined, 0).buffer,
    ];

    if (this.gift) {
      const bytes = this.gift.toBuffer();
      parts.push(varuint.encode(bytes.length, undefined, 0).buffer, bytes);
    }

    if (this.offeredIdentities) {
      parts.push(
        varuint.encode(this.offeredIdentities.length, undefined, 0).buffer
      );

      for (const offer of this.offeredIdentities) {
        parts.push(Buffer.from([offer.role]), offer.identity.toBuffer());
      }
    }

    return Buffer.concat(parts);
  }

  getByteLength(): number {
    return this.toBuffer().length;
  }

  fromBuffer(buffer: Buffer, offset = 0, rootSystemName?: string): number {
    const reader = new AuthorizationReader(buffer, offset);

    this.version = new BN(reader.readCompactSize());

    if (
      this.version.lt(AppAuthorizationRequestDetails.VERSION_FIRST) ||
      this.version.gt(AppAuthorizationRequestDetails.VERSION_LAST)
    ) {
      throw new Error("Unsupported authorization version");
    }

    this.flags = new BN(reader.readCompactSize());

    if (
      !this.flags
        .and(AppAuthorizationRequestDetails.FLAGS_SUPPORTED)
        .eq(this.flags)
    ) {
      throw new Error("Unsupported authorization flags");
    }

    this.gift = undefined;
    this.offeredIdentities = undefined;

    if (
      !this.flags
        .and(AppAuthorizationRequestDetails.FLAG_CONTAINS_GIFT)
        .isZero()
    ) {
      // The declared length isolates the gift; admission size policy belongs to clients.
      const bytes = reader.readVarSlice();
      this.gift = new SpendableKeyDetails();

      if (this.gift.fromBuffer(bytes) !== bytes.length) {
        throw new Error("Trailing gift bytes");
      }
    }

    if (
      !this.flags
        .and(AppAuthorizationRequestDetails.FLAG_CONTAINS_OFFERS)
        .isZero()
    ) {
      // Each offer contains only a role byte and a canonical compact I-address.
      const count = reader.count(ROLE_TAGGED_IDENTITY_ADDRESS_BYTE_LENGTH);
      this.offeredIdentities = [];

      for (let i = 0; i < count; i++) {
        this.offeredIdentities.push({
          role: reader.readUInt8(),
          identity: CompactIAddressObject.fromAddress(
            reader.address(),
            rootSystemName
          ),
        });
      }
    }

    // The ordinal wrapper must pass the complete, isolated payload to this parser.
    checkPayloadEnd(reader.offset, offset, buffer.length - offset);
    this.validate();

    return reader.offset;
  }

  toJson(): AppAuthorizationRequestDetailsJson {
    this.validate();

    return {
      version: this.version.toNumber(),
      flags: this.flags.toNumber(),
      gift: this.gift?.toJson(),
      offeredIdentities: this.offeredIdentities?.map((o) => ({
        role: o.role,
        identity: o.identity.toJson(),
      })),
    };
  }

  static fromJson(
    json: AppAuthorizationRequestDetailsJson
  ): AppAuthorizationRequestDetails {
    rejectUnknownFields(json, [
      "version",
      "flags",
      "gift",
      "offeredIdentities",
    ]);

    if (json.gift && !isHexString(json.gift.data)) {
      throw new Error("Invalid gift bytes");
    }

    if (
      !Number.isSafeInteger(json.version) ||
      !Number.isSafeInteger(json.flags)
    ) {
      throw new Error("Expected integer JSON version and flags");
    }

    return new AppAuthorizationRequestDetails({
      ...json,
      version: new BN(json.version),
      flags: new BN(json.flags),
      gift:
        json.gift === undefined
          ? undefined
          : SpendableKeyDetails.fromJson(json.gift),
      offeredIdentities: json.offeredIdentities?.map((o) => {
        rejectUnknownFields(o, ["role", "identity"]);

        return {
          role: o.role,
          identity: CompactIAddressObject.compactIdentityAddressFromJson(
            o.identity
          ),
        };
      }),
    });
  }
}
