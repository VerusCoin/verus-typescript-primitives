import { OfferList } from "../../../offers/OfferList";
import { ApiResponse } from "../../ApiResponse";
export declare class GetOffersResponse extends ApiResponse {
    result: OfferList | false;
}
