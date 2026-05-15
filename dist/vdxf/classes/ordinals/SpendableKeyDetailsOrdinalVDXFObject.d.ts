import { SerializableDataEntity } from "../../../utils/types/SerializableEntity";
import { SpendableKeyDetails, SpendableKeyDetailsJson } from "../backup/SpendableKeyDetails";
import { OrdinalVDXFObjectInterfaceTemplate, OrdinalVDXFObjectJsonTemplate } from "./OrdinalVDXFObject";
import { SerializableEntityOrdinalVDXFObject } from "./SerializableEntityOrdinalVDXFObject";
export declare class SpendableKeyDetailsOrdinalVDXFObject extends SerializableEntityOrdinalVDXFObject implements SerializableDataEntity {
    data: SpendableKeyDetails;
    constructor(request?: OrdinalVDXFObjectInterfaceTemplate<SpendableKeyDetails>);
    static fromJson(details: OrdinalVDXFObjectJsonTemplate<SpendableKeyDetailsJson>): SpendableKeyDetailsOrdinalVDXFObject;
}
