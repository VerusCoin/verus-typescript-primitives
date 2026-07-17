import { SerializableDataEntity } from "../../../utils/types/SerializableEntity";
import { OrdinalVDXFObjectInterfaceTemplate, OrdinalVDXFObjectJsonTemplate } from "./OrdinalVDXFObject";
import { RegisterIdentityRequestDetails, RegisterIdentityRequestDetailsJson } from "../request/RegisterIdentityRequestDetails";
import { SerializableEntityOrdinalVDXFObject } from "./SerializableEntityOrdinalVDXFObject";
export declare class RegisterIdentityRequestOrdinalVDXFObject extends SerializableEntityOrdinalVDXFObject implements SerializableDataEntity {
    data: RegisterIdentityRequestDetails;
    constructor(request?: OrdinalVDXFObjectInterfaceTemplate<RegisterIdentityRequestDetails>);
    fromDataBuffer(buffer: Buffer, rootSystemName?: string): void;
    static fromJson(details: OrdinalVDXFObjectJsonTemplate<RegisterIdentityRequestDetailsJson>): RegisterIdentityRequestOrdinalVDXFObject;
}
