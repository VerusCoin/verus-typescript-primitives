import { OptCCParams } from '../OptCCParams';
import { TxDestination } from '../TxDestination';
/** Destination forms supported by version-3 identity registration conditions. */
export declare function validateRegistrationDestination(destination: TxDestination, identityOnly?: boolean): void;
export declare function registrationParams(evalCode: number, destinations: TxDestination[], vData: Buffer[]): OptCCParams;
/** Validate the single-object MakeMofNCCScript envelope, keeping master data separate. */
export declare function validateRegistrationParams(master: OptCCParams, params: OptCCParams, evalCodes: number[]): void;
