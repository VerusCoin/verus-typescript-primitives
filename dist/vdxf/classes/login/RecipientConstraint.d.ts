import { SerializableEntityBase } from '../../../utils/types/SerializableEntityBase';
import { SerializableEntity } from "../../../utils/types/SerializableEntity";
import { CompactAddressObjectJson, CompactIAddressObject } from "../CompactAddressObject";
export interface RecipientConstraintJson {
    type: number;
    identity: CompactAddressObjectJson;
}
export interface RecipientConstraintInterface {
    type: number;
    identity: CompactIAddressObject;
}
export declare class RecipientConstraint extends SerializableEntityBase implements SerializableEntity {
    type: number;
    identity: CompactIAddressObject;
    static REQUIRED_ID: number;
    static REQUIRED_SYSTEM: number;
    static REQUIRED_PARENT: number;
    constructor(data?: RecipientConstraintInterface);
    static fromData(data: RecipientConstraint | RecipientConstraintInterface): RecipientConstraint;
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number, rootSystemName?: string): number;
    toJson(): RecipientConstraintJson;
    static fromJson(data: RecipientConstraintJson): RecipientConstraint;
    static requiredIDFromAddress(iaddr: string): RecipientConstraint;
    static requiredSystemFromAddress(iaddr: string): RecipientConstraint;
    static requiredParentFromAddress(iaddr: string): RecipientConstraint;
    static requiredSystemFromFQN(fqn: string, rootSystemName?: string): RecipientConstraint;
    static requiredParentFromFQN(fqn: string, rootSystemName?: string): RecipientConstraint;
}
