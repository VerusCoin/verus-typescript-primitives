import { ApiResponse } from "../../ApiResponse";

export class GetVdxfIdResponse extends ApiResponse {
  result: {
    vdxfid: string,
    indexid?: string,
    hash160result: string,
    qualifiedname: {
      name: string,
      parentid?: string,
      namespace?: string,
      currencyaddresstype?: string
    },
    bounddata?: {
      vdxfkey?: string,
      uint256?: string,
      indexnum?: number
    }
  }
}
