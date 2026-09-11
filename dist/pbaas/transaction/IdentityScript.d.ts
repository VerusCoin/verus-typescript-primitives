import { SerializableEntity } from "../../utils/types/SerializableEntity";
import { Identity } from "../Identity";
import { OptCCParams } from "../OptCCParams";
import { SmartTransactionScript } from "./SmartTransactionScript";
export declare class IdentityScript extends SmartTransactionScript implements SerializableEntity {
    constructor(master?: OptCCParams, params?: OptCCParams);
    static fromIdentity(identity: Identity): IdentityScript;
    fromBuffer(buffer: Buffer, offset?: number, length?: number): number;
    getIdentity(parseVdxfObjects?: boolean): Identity;
}
