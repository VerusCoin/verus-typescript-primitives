import { SerializableDataEntity } from "../../../utils/types/SerializableEntity";
import { OrdinalVDXFObjectInterfaceTemplate, OrdinalVDXFObjectJsonTemplate } from "./OrdinalVDXFObject";
import { SerializableEntityOrdinalVDXFObject } from "./SerializableEntityOrdinalVDXFObject";
import { AppAuthorizationRequestDetails, AppAuthorizationRequestDetailsJson } from "../appauthorization/AppAuthorizationRequestDetails";
export declare class AppAuthorizationRequestOrdinalVDXFObject extends SerializableEntityOrdinalVDXFObject implements SerializableDataEntity {
    data: AppAuthorizationRequestDetails;
    constructor(request?: OrdinalVDXFObjectInterfaceTemplate<AppAuthorizationRequestDetails>);
    static fromJson(details: OrdinalVDXFObjectJsonTemplate<AppAuthorizationRequestDetailsJson>): AppAuthorizationRequestOrdinalVDXFObject;
}
