import { SerializableDataEntity } from "../../../utils/types/SerializableEntity";
import { OrdinalVDXFObjectInterfaceTemplate, OrdinalVDXFObjectJsonTemplate } from "./OrdinalVDXFObject";
import { SerializableEntityOrdinalVDXFObject } from "./SerializableEntityOrdinalVDXFObject";
import { AppAuthorizationResponseDetails, AppAuthorizationResponseDetailsJson } from "../appauthorization/AppAuthorizationResponseDetails";
export declare class AppAuthorizationResponseOrdinalVDXFObject extends SerializableEntityOrdinalVDXFObject implements SerializableDataEntity {
    data: AppAuthorizationResponseDetails;
    constructor(request?: OrdinalVDXFObjectInterfaceTemplate<AppAuthorizationResponseDetails>);
    static fromJson(details: OrdinalVDXFObjectJsonTemplate<AppAuthorizationResponseDetailsJson>): AppAuthorizationResponseOrdinalVDXFObject;
}
