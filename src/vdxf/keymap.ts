import * as keylist from './keys';
import * as AttestationData from './classes/IdentityData';
import { VDXFKeyInterface } from './keys';
export const keymap = Object.keys(keylist).reduce((obj: { [key: string]: VDXFKeyInterface }, item) => { obj[keylist[item].vdxfid] = keylist[item]; return obj }, {});
export const attestationDataKeys = Object.keys(AttestationData).reduce((obj: { [key: string]: VDXFKeyInterface }, item) => { obj[AttestationData[item].vdxfid] = AttestationData[item]; return obj }, {});
export const IdentityVdxfidMap = AttestationData.IdentityVdxfidMap;