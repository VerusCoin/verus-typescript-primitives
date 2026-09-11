import { OfferList } from "../../../offers/OfferList";
import { ApiResponse } from "../../ApiResponse";

export class GetOffersResponse extends ApiResponse {
  result: OfferList | false;
}
