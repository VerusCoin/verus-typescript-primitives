import { BlockInfo } from "../block/BlockInfo";
import { IdentityDefinition } from "../identity/IdentityDefinition";
import { OfferForMaking } from "../offers/OfferForMaking";
import { ListedOffer } from "../offers/OfferList";
import { RawTransaction } from "../transaction/RawTransaction";
import { SignDataArgs } from "./classes/SignData/SignDataRequest";
export declare type ApiPrimitive = string | number | boolean | null | OfferForMaking | ApiPrimitiveJson | ListedOffer | Array<ApiPrimitive> | IdentityDefinition | BlockInfo | RawTransaction | SignDataArgs;
export declare type ApiPrimitiveJson = {
    [key: string]: ApiPrimitive | undefined;
};
export declare type RequestParams = Array<ApiPrimitive>;
