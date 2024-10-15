import * as keylist from './keys';
import * as attestationData from '../utils/IdentityData';
import { VDXFKeyInterface } from './keys';

export const keymap = Object.keys(keylist)
    .reduce((obj: { [key: string]: VDXFKeyInterface }, item) => 
        { obj[keylist[item].vdxfid] = keylist[item]; return obj }, {});

export const attestationDataKeys = Object.keys(attestationData)
    .reduce((obj: { [key: string]: VDXFKeyInterface }, item) => 
        { obj[attestationData[item].vdxfid] = attestationData[item]; return obj }, {});

export const IdentityVdxfidMap = attestationData.IdentityVdxfidMap;