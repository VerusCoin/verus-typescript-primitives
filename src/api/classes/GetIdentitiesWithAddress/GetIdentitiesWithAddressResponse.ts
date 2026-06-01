import { IdentityDefinition } from "../../../identity/IdentityDefinition";
import { ApiResponse } from "../../ApiResponse";

export class GetIdentitiesWithAddressResponse extends ApiResponse {
  result: Array<
    IdentityDefinition & {
      txout: {
        txid: string;
        voutnum: number;
      };
    }
  >;
}
