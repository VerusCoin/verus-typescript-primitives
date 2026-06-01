import { ApiRequest } from "../../ApiRequest";
import { RequestParams, ApiPrimitiveJson } from "../../ApiPrimitive";
import { GET_IDENTITIES_WITH_ADDRESS } from "../../../constants/cmds";

interface GetIdentitiesWithAddressQuery {
  address: string;
  fromheight?: number;
  toheight?: number;
  unspent?: boolean;
}

export class GetIdentitiesWithAddressRequest extends ApiRequest {
  query: GetIdentitiesWithAddressQuery;

  constructor(chain: string, query: GetIdentitiesWithAddressQuery) {
    super(chain, GET_IDENTITIES_WITH_ADDRESS);
    this.query = query;
  }

  getParams(): RequestParams {
    return [
      this.query as {
        address: string;
        fromheight?: number;
        toheight?: number;
        unspent?: boolean;
      },
    ];
  }

  static fromJson(object: ApiPrimitiveJson): GetIdentitiesWithAddressRequest {
    return new GetIdentitiesWithAddressRequest(
      object.chain as string,
      object.query as unknown as GetIdentitiesWithAddressQuery
    );
  }

  toJson(): ApiPrimitiveJson {
    return {
      chain: this.chain,
      query: this.query as {
        address: string;
        fromheight?: number;
        toheight?: number;
        unspent?: boolean;
      },
    };
  }
}
