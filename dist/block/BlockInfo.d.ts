import { RawTransaction } from "../transaction/RawTransaction";
export type BlockTransaction = Pick<RawTransaction, "txid" | "overwintered" | "version" | "locktime" | "vin" | "vout" | "vjoinsplit"> & {
    versiongroupid?: string;
    expiryheight?: number;
    valueBalance?: number;
    valueBalanceZat?: number;
    vShieldedSpend?: RawTransaction["vShieldedSpend"];
    vShieldedOutput?: RawTransaction["vShieldedOutput"];
    bindingSig?: string;
};
export interface BlockInfo {
    hash: string;
    validationtype: string;
    confirmations: number;
    size: number;
    height: number;
    version: number;
    merkleroot: string;
    segid: number;
    finalsaplingroot: string;
    tx: Array<string> | Array<BlockTransaction>;
    time: number;
    nonce: string;
    solution: string;
    bits: string;
    difficulty: number;
    chainwork: string;
    chainstake: string;
    anchor: string;
    blocktype: string;
    valuePools: Array<{
        id: string;
        monitored: boolean;
        chainValue?: number;
        chainValueZat?: number;
        valueDelta?: number;
        valueDeltaZat?: number;
    }>;
    previousblockhash?: string;
    nextblockhash?: string;
    proofroot: {
        version: number;
        type: number;
        systemid: string;
        height: number;
        stateroot: string;
        blockhash: string;
        power: string;
    };
}
